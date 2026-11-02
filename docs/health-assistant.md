# Health assistant evidence and limitations

The assistant uses real AI inference through Lovable AI Gateway, not keyword-matched canned responses. It is not newly trained or fine-tuned on medical datasets. It cannot guarantee correct answers or complete medical coverage.

At answer time, a health-scope classifier resolves the latest question and follow-up context to short medical search terms. MedlinePlus's free National Library of Medicine web service retrieves up to three ranked health-topic summaries. The answering model receives these summaries as untrusted evidence, cites only supporting records, and returns their canonical links. Queries exclude personal identifiers. No profile, glucose logs, or stored account data is supplied automatically; chat messages are transmitted for inference, and conversation state remains in memory.

Only HTTPS `medlineplus.gov` evidence links are accepted. Generated answers have health-only instructions, varied off-topic redirections, uncertainty disclosures, emergency escalation, and restrictions on diagnosis and personalized medication/insulin changes. These are model guardrails, not a guarantee against errors or prompt injection. Basic biology may use general model knowledge with a disclosure when no supporting live source is found. Treatment questions without evidence must not be guessed.

The function is intentionally public general education, matching the homepage assistant: it has no access to account data or privileged operations. Local profiles are not trusted authentication. Requests have bounded message/content sizes, and Gateway limits/errors propagate without automatic inference replays. Production abuse controls and clinical review are still needed before clinical or enterprise use.

## Sources and permitted use

- [MedlinePlus Web Service](https://medlineplus.gov/about/developers/webservices/): free XML search, no registration/license required; use within acceptable-use limits.
- [MedlinePlus content policy](https://medlineplus.gov/about/using/usingcontent/): attribute to MedlinePlus/National Library of Medicine, do not imply endorsement, do not redistribute linked third-party material or logos.
- [MedlinePlus downloadable XML](https://medlineplus.gov/xml.html): broader topic data is available but is not downloaded or used for model training here.

No raw participant records, proprietary medical textbooks, or scraped commercial databases are used. More data is not a substitute for validation; cited summaries and the user's clinical situation may not cover a specific question. References are retrieved live rather than claimed as a comprehensive training corpus.