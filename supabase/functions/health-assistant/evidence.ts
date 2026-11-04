import { XMLParser } from "npm:fast-xml-parser@5.3.0";

export interface Source { id: number; title: string; url: string; summary: string }
export const bodySchemaOptions = { maxMessages: 16, maxContent: 2000 };
export function trustedUrl(url: string): boolean {
  try { const parsed = new URL(url); return parsed.protocol === "https:" && parsed.hostname === "medlineplus.gov"; } catch { return false; }
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
    if (summary) sources.push({ id: sources.length + 1, url: row.url, title: get("title"), summary: summary.slice(0, 10_000) });
  }
  if (!sources.length && broaden && query.trim().includes(" ")) {
    const terms = query.match(/[a-zA-Z][a-zA-Z-]+/g) ?? [];
    const expanded = terms.slice(0, 4).map(term => `"${term}"`).join(" OR ");
    if (expanded) return retrieveEvidence(expanded, false);
  }
  return sources;
}
const STOP = new Set("a an and are as at be but by can do does for from had has have how i if in is it its me my of on or should so than that the their them then there these they this to was we what when where which who why will with would you your about after before could did get into just much more most also very please tell explain".split(" "));
/** Local, model-free search terms from the latest message so lookup can run alongside nothing else. */
export function searchTerms(text: string): string {
  const words = (text.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? []).filter(w => !STOP.has(w));
  return [...new Set(words)].slice(0, 4).join(" ");
}
