export const PATENT_CHECKLIST_ITEMS: { id: string; label: string; hint?: string }[] = [
  {
    id: "summary",
    label: "One-paragraph invention summary written",
    hint: "Plain-language description of the problem and your solution.",
  },
  {
    id: "figures",
    label: "Figures / diagrams identified (or N/A noted)",
  },
  {
    id: "prior",
    label: "Prior art notes gathered (optional)",
    hint: "Patents, papers, or products you already know about.",
  },
  { id: "pdf", label: "Disclosure PDF uploaded in this tool" },
  { id: "analysis", label: "Tool output / analysis reviewed" },
  { id: "spec", label: "Draft specification sections reviewed" },
  { id: "claims", label: "Claims strategy / draft reviewed" },
  { id: "export", label: "Exported or saved artifacts for records" },
  {
    id: "counsel",
    label: "Patent attorney/agent review scheduled (external)",
    hint: "This app does not replace legal counsel.",
  },
];
