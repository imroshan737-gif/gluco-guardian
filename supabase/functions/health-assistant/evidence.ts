import { XMLParser } from "npm:fast-xml-parser@5.3.0";

export interface Source { id: number; title: string; url: string; summary: string; publisher: "MedlinePlus / NLM" | "PubMed / NLM" }
export interface EvidenceBundle { sources: Source[]; evidenceStatus: "retrieved" | "no_match" | "partial" }
export const bodySchemaOptions = { maxMessages: 16, maxContent: 2000 };
export function trustedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && (parsed.hostname === "medlineplus.gov" || (parsed.hostname === "pubmed.ncbi.nlm.nih.gov" && /^\/\d+\/?$/.test(parsed.pathname)));
  } catch { return false; }
}
export async function retrieveEvidence(query: string, broaden = true): Promise<Source[]> {
  const url = new URL("https://wsearch.nlm.nih.gov/ws/query");
  url.search = new URLSearchParams({ db: "healthTopics", term: query, retmax: "3", rettype: "brief" }).toString();
  const res = await fetch(url, { signal: AbortSignal.timeout(3_500) });
  if (!res.ok) throw new Error("Medical reference service unavailable");
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "", processEntities: true });
  const data = parser.parse(xml);
  const documents = data?.nlmSearchResult?.list?.document;
  const rows: unknown[] = Array.isArray(documents) ? documents : documents ? [documents] : [];
  const sources: Source[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object" || !("url" in row) || typeof row.url !== "string" || !trustedUrl(row.url) || !("content" in row)) continue;
    const content: unknown[] = Array.isArray(row.content) ? row.content : [row.content];
    const get = (name: string) => {
      const field = content.find(item => item && typeof item === "object" && "name" in item && item.name === name);
      return field && typeof field === "object" && "#text" in field && typeof field["#text"] === "string" ? field["#text"].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
    };
    const summary = get("FullSummary");
    if (summary) sources.push({ id: sources.length + 1, url: row.url, title: get("title"), summary: summary.slice(0, 10_000), publisher: "MedlinePlus / NLM" });
  }
  if (!sources.length && broaden && query.trim().includes(" ")) {
    const terms = query.match(/[a-zA-Z][a-zA-Z-]+/g) ?? [];
    const expanded = terms.slice(0, 4).map(term => `"${term}"`).join(" OR ");
    if (expanded) return retrieveEvidence(expanded, false);
  }
  return sources;
}

function xmlText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(xmlText).filter(Boolean).join(" ");
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  if ("#text" in record) return xmlText(record["#text"]);
  return Object.entries(record).filter(([key]) => !key.startsWith("@")).map(([, item]) => xmlText(item)).filter(Boolean).join(" ");
}

/** Search PubMed for relevant reviews, meta-analyses, and practice guidelines; retrieve abstracts only. */
export async function retrievePubMedEvidence(query: string): Promise<Source[]> {
  const searchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
  searchUrl.search = new URLSearchParams({
    db: "pubmed",
    term: `(${query}) AND (systematic review[Publication Type] OR meta-analysis[Publication Type] OR practice guideline[Publication Type])`,
    retmax: "2",
    retmode: "json",
    sort: "relevance",
  }).toString();
  const searchResponse = await fetch(searchUrl, { signal: AbortSignal.timeout(2_500) });
  if (!searchResponse.ok) throw new Error("PubMed search unavailable");
  const searchData: unknown = await searchResponse.json();
  const idsValue = searchData && typeof searchData === "object" && "esearchresult" in searchData ? (searchData as { esearchresult?: { idlist?: unknown } }).esearchresult?.idlist : null;
  const ids = Array.isArray(idsValue) ? idsValue.filter((id): id is string => typeof id === "string" && /^\d+$/.test(id)).slice(0, 2) : [];
  if (!ids.length) return [];

  const fetchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi");
  fetchUrl.search = new URLSearchParams({ db: "pubmed", id: ids.join(","), retmode: "xml" }).toString();
  const articleResponse = await fetch(fetchUrl, { signal: AbortSignal.timeout(2_500) });
  if (!articleResponse.ok) throw new Error("PubMed abstracts unavailable");
  const xml = await articleResponse.text();
  const parsed = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "", processEntities: true }).parse(xml);
  const articlesValue = parsed?.PubmedArticleSet?.PubmedArticle;
  const articles: unknown[] = Array.isArray(articlesValue) ? articlesValue : articlesValue ? [articlesValue] : [];
  const sources: Source[] = [];
  for (const item of articles) {
    if (!item || typeof item !== "object") continue;
    const article = item as { MedlineCitation?: { PMID?: unknown; Article?: { ArticleTitle?: unknown; Abstract?: { AbstractText?: unknown }; Journal?: { JournalIssue?: { PubDate?: { Year?: unknown; MedlineDate?: unknown } } } } } };
    const id = xmlText(article.MedlineCitation?.PMID);
    const details = article.MedlineCitation?.Article;
    const title = xmlText(details?.ArticleTitle);
    const summary = xmlText(details?.Abstract?.AbstractText);
    if (!/^\d+$/.test(id) || !title || !summary || !trustedUrl(`https://pubmed.ncbi.nlm.nih.gov/${id}/`)) continue;
    const publicationDate = details?.Journal?.JournalIssue?.PubDate;
    const year = xmlText(publicationDate?.Year ?? publicationDate?.MedlineDate).match(/(?:19|20)\d{2}/)?.[0];
    sources.push({ id: sources.length + 1, title: year ? `${title} (${year})` : title, url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`, summary: summary.slice(0, 5_000), publisher: "PubMed / NLM" });
  }
  return sources;
}

/** Retrieve independent consumer-health and review-literature evidence in parallel. */
export async function retrieveEvidenceBundle(query: string): Promise<EvidenceBundle> {
  const results = await Promise.allSettled([retrieveEvidence(query), retrievePubMedEvidence(query)]);
  const available = results.filter((result): result is PromiseFulfilledResult<Source[]> => result.status === "fulfilled");
  if (!available.length) throw new Error("Trusted medical reference services unavailable");
  const sources = available.flatMap(result => result.value).slice(0, 5).map((source, index) => ({ ...source, id: index + 1 }));
  return {
    sources,
    evidenceStatus: results.some(result => result.status === "rejected") ? "partial" : sources.length ? "retrieved" : "no_match",
  };
}
const STOP = new Set("a an and are as at be but by can do does for from had has have how i if in is it its me my of on or should so than that the their them then there these they this to was we what when where which who why will with would you your about after before could did get into just much more most also very please tell explain".split(" "));
/** Local, model-free search terms from the latest message so lookup can run alongside nothing else. */
export function searchTerms(text: string): string {
  const words = (text.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? []).filter(w => !STOP.has(w));
  return [...new Set(words)].slice(0, 4).join(" ");
}
