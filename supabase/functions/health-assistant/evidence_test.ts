import { trustedUrl, retrieveEvidence } from "./evidence.ts";

Deno.test("medical evidence accepts only canonical HTTPS MedlinePlus links", () => {
  if (!trustedUrl("https://medlineplus.gov/diabetes.html")) throw new Error("Expected trusted source");
  for (const url of ["http://medlineplus.gov/diabetes.html", "https://medlineplus.gov.evil.test/topic", "javascript:alert(1)", "https://example.com"]) {
    if (trustedUrl(url)) throw new Error("Untrusted source accepted");
  }
});
Deno.test("retrieval obtains genuine NLM summaries rather than invented evidence", async () => {
  const sources = await retrieveEvidence("diabetes");
  if (!sources.length || !sources.some(s => s.summary.toLowerCase().includes("insulin"))) throw new Error("Expected diabetes evidence");
});