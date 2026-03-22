import { useState, useRef } from "react";

// ── Helpers ────────────────────────────────────────────────────────────────────

function readFileAsArrayBuffer(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error("File read failed"));
    r.readAsArrayBuffer(file);
  });
}

async function extractText(file) {
  if (!file) return null;
  const ext = file.name.split(".").pop().toLowerCase();

  if (ext === "txt") {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(new Error("Read failed"));
      r.readAsText(file);
    });
  }

  if (ext === "pdf") {
    if (!window.pdfjsLib) {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }
    const ab = await readFileAsArrayBuffer(file);
    const pdf = await window.pdfjsLib.getDocument({ data: ab }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((s) => s.str).join(" ") + "\n";
    }
    if (text.trim().length < 30) throw new Error("PDF text extraction returned too little text. Please upload a clearer, text-based PDF.");
    return text;
  }

  if (ext === "docx") {
    if (!window.mammoth) {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
    }
    const ab = await readFileAsArrayBuffer(file);
    const result = await window.mammoth.extractRawText({ arrayBuffer: ab });
    if (!result.value || result.value.trim().length < 30)
      throw new Error("DOCX extraction returned too little text. Please upload a clearer file.");
    return result.value;
  }

  throw new Error(`Unsupported file type: .${ext}`);
}

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

// ── Sample data ────────────────────────────────────────────────────────────────

const SAMPLE_RESUME = `Priya Sharma
Senior Product Manager | priya.sharma@email.com | LinkedIn: priyasharma | Mumbai, India

SUMMARY
Results-driven Senior Product Manager with 6+ years of experience in B2B SaaS, specialising in data analytics platforms. Led cross-functional teams of up to 12 across engineering, design, and data science. Passionate about translating complex user problems into scalable product solutions.

EXPERIENCE
Senior Product Manager — DataStack Inc. (Jan 2021 – Present)
- Owned roadmap for core analytics dashboard used by 300+ enterprise clients
- Led 0-to-1 launch of self-serve onboarding, reducing time-to-value from 3 weeks to 4 days
- Partnered with sales to close 5 enterprise deals worth $2.4M ARR by building custom feature demos
- Ran 40+ user interviews and synthesised insights into quarterly roadmap prioritisation

Product Manager — Finlytics (Jun 2018 – Dec 2020)
- Managed reporting module for fintech platform serving 150K SMBs
- Delivered 3 major product releases on time, improving NPS from 28 to 47
- Built and maintained PRDs, acceptance criteria, and sprint backlogs in Jira

EDUCATION
B.Tech in Computer Science — IIT Bombay (2018)

SKILLS
Product Strategy, Roadmapping, SQL, Mixpanel, Amplitude, Figma, Jira, Confluence, A/B Testing, Agile/Scrum, Stakeholder Management, Enterprise SaaS`;

const SAMPLE_JD = `Job Title: Senior Product Manager – Growth & Analytics
Company: Nexus Cloud (Series B, 220 employees)
Location: Bangalore / Hybrid

About the Role:
We are looking for a Senior Product Manager to lead our Growth and Analytics product line. You will define and execute the product strategy for our self-serve growth motion and embedded analytics features used by 500+ B2B clients.

Responsibilities:
- Define and own the product roadmap for growth and analytics features
- Work closely with engineering, data science, design, and GTM teams
- Drive user research, competitive analysis, and data-driven decision making
- Lead end-to-end product launches including GTM strategy
- Collaborate with enterprise sales and customer success to identify upsell opportunities
- Define and track KPIs including activation, retention, and expansion revenue

Requirements:
- 5+ years of product management experience in B2B SaaS
- Strong experience with analytics platforms or data products
- Proven track record of launching 0-to-1 products or features
- Experience with SQL, Mixpanel, or similar tools
- Excellent communication and stakeholder management skills
- Prior experience collaborating with enterprise sales teams is a plus
- MBA or equivalent preferred but not required`;

// ── Category config ────────────────────────────────────────────────────────────

const CATEGORY_META = {
  "role-fit":   { label: "Role Fit",    color: "#818cf8", bg: "rgba(129,140,248,0.1)",  dot: "#818cf8" },
  "experience": { label: "Experience",  color: "#38bdf8", bg: "rgba(56,189,248,0.1)",   dot: "#38bdf8" },
  "behavioral": { label: "Behavioral",  color: "#34d399", bg: "rgba(52,211,153,0.1)",   dot: "#34d399" },
  "motivation": { label: "Motivation",  color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   dot: "#fbbf24" },
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:         #07070c;
    --s1:         #0e0e16;
    --s2:         #14141e;
    --s3:         #1a1a26;
    --border:     rgba(255,255,255,0.06);
    --border-md:  rgba(255,255,255,0.10);
    --border-hi:  rgba(255,255,255,0.16);
    --text:       #eeeef5;
    --text-2:     #8888a8;
    --text-3:     #55556a;
    --accent:     #6366f1;
    --accent-dim: rgba(99,102,241,0.15);
    --accent-glow:rgba(99,102,241,0.3);
    --green:      #34d399;
    --red:        #f87171;
    --red-dim:    rgba(248,113,113,0.08);
    --r:          10px;
    --r-sm:       7px;
    --mono:       'SF Mono', 'Fira Code', monospace;
  }

  html { font-size: 16px; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }

  .app { min-height: 100vh; display: flex; flex-direction: column; }

  /* ─ Topbar ─ */
  .topbar {
    height: 52px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px;
    border-bottom: 1px solid var(--border);
    background: rgba(7,7,12,0.9);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    position: sticky; top: 0; z-index: 50;
  }
  .brand { display: flex; align-items: center; gap: 9px; }
  .brand-mark {
    width: 26px; height: 26px; border-radius: 7px;
    background: linear-gradient(135deg, #818cf8, #6366f1);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #fff;
  }
  .brand-name { font-size: 13.5px; font-weight: 600; letter-spacing: -0.3px; color: var(--text); }
  .badge {
    font-size: 9.5px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase;
    color: var(--accent); background: var(--accent-dim);
    border: 1px solid rgba(99,102,241,0.2);
    padding: 2px 8px; border-radius: 20px;
  }

  /* ─ Main ─ */
  .main {
    flex: 1; max-width: 800px; width: 100%;
    margin: 0 auto; padding: 52px 20px 96px;
  }

  /* ─ Hero ─ */
  .hero { margin-bottom: 44px; }
  .eyebrow {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 11px; font-weight: 600; letter-spacing: 1.8px;
    text-transform: uppercase; color: var(--accent); margin-bottom: 16px;
  }
  .eyebrow-line { width: 20px; height: 1.5px; background: var(--accent); border-radius: 2px; }
  h1 {
    font-size: clamp(28px, 4vw, 42px);
    font-weight: 700; line-height: 1.12; letter-spacing: -1.5px;
    color: var(--text); margin-bottom: 14px;
  }
  h1 .grad {
    background: linear-gradient(100deg, #a5b4fc 0%, #818cf8 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .hero-sub {
    font-size: 14.5px; font-weight: 400; color: var(--text-2);
    line-height: 1.7; max-width: 440px;
  }

  /* ─ Card ─ */
  .card {
    background: var(--s1); border: 1px solid var(--border);
    border-radius: var(--r); padding: 24px;
  }
  .card-label {
    font-size: 10px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: var(--text-3); margin-bottom: 18px;
  }

  /* ─ Upload grid ─ */
  .upload-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
  @media (max-width: 520px) { .upload-grid { grid-template-columns: 1fr; } }

  .drop-zone {
    position: relative; cursor: pointer;
    background: var(--s2); border: 1.5px dashed var(--border-md);
    border-radius: var(--r-sm); padding: 26px 14px; text-align: center;
    transition: border-color .18s, background .18s;
  }
  .drop-zone:hover, .drop-zone.over {
    border-color: var(--accent); background: rgba(99,102,241,0.04);
  }
  .drop-zone.filled { border-color: var(--green); border-style: solid; background: rgba(52,211,153,0.03); }
  .drop-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; }
  .dz-ico {
    width: 34px; height: 34px; border-radius: 9px; margin: 0 auto 10px;
    background: var(--s3); border: 1px solid var(--border-md);
    display: flex; align-items: center; justify-content: center; font-size: 15px;
  }
  .drop-zone.filled .dz-ico { background: rgba(52,211,153,0.08); border-color: rgba(52,211,153,0.2); }
  .dz-label { font-size: 12.5px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .dz-hint { font-size: 11px; color: var(--text-3); font-family: var(--mono); }
  .dz-file {
    font-size: 10.5px; color: var(--green); margin-top: 8px;
    font-family: var(--mono); font-weight: 500;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 150px; margin-left: auto; margin-right: auto;
  }

  /* ─ Divider ─ */
  .sep {
    display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
  }
  .sep::before, .sep::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .sep span { font-size: 10.5px; font-weight: 500; color: var(--text-3); letter-spacing: 1px; text-transform: uppercase; }

  /* ─ Field ─ */
  .field-lbl {
    display: block; font-size: 10.5px; font-weight: 600;
    letter-spacing: 1.2px; text-transform: uppercase; color: var(--text-3); margin-bottom: 8px;
  }
  textarea {
    width: 100%; background: var(--s2); border: 1px solid var(--border-md);
    border-radius: var(--r-sm); padding: 13px 15px;
    font-family: 'Inter', sans-serif; font-size: 13.5px; color: var(--text);
    resize: vertical; min-height: 108px; line-height: 1.65;
    transition: border-color .18s, box-shadow .18s;
  }
  textarea::placeholder { color: var(--text-3); }
  textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }
  textarea:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ─ Footer row ─ */
  .foot-row {
    display: flex; align-items: center; justify-content: flex-start;
    margin-top: 18px; gap: 10px; flex-wrap: wrap;
  }
  .btn-ghost {
    font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500;
    color: var(--text-3); background: transparent; cursor: pointer;
    border: 1px solid var(--border-md); border-radius: var(--r-sm);
    padding: 8px 14px; transition: all .18s; display: flex; align-items: center; gap: 6px;
  }
  .btn-ghost:hover { border-color: var(--border-hi); color: var(--text-2); background: var(--s2); }

  /* ─ Error ─ */
  .err {
    display: flex; gap: 9px; align-items: flex-start;
    background: var(--red-dim); border: 1px solid rgba(248,113,113,0.18);
    border-radius: var(--r-sm); padding: 11px 14px;
    font-size: 13px; color: #fca5a5; margin-top: 14px; line-height: 1.5;
  }

  /* ─ CTA ─ */
  .btn-cta {
    width: 100%; margin-top: 18px;
    padding: 14px 20px; background: var(--accent); color: #fff; border: none;
    border-radius: var(--r-sm); font-family: 'Inter', sans-serif;
    font-size: 13.5px; font-weight: 600; letter-spacing: -0.1px;
    cursor: pointer; transition: all .18s;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    position: relative; overflow: hidden;
  }
  .btn-cta::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(255,255,255,0.07) 0%, transparent 100%);
    pointer-events: none;
  }
  .btn-cta:hover:not(:disabled) {
    background: #5254cc; transform: translateY(-1px);
    box-shadow: 0 4px 20px var(--accent-glow);
  }
  .btn-cta:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

  /* ─ Loading ─ */
  .load-card {
    background: var(--s1); border: 1px solid var(--border);
    border-radius: var(--r); padding: 64px 20px; text-align: center;
    margin-top: 16px; animation: up .3s ease;
  }
  .pulse-ring {
    width: 48px; height: 48px; border-radius: 50%;
    border: 2px solid var(--border-md); border-top-color: var(--accent);
    margin: 0 auto 22px; animation: spin .75s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .load-msg { font-size: 15px; font-weight: 500; color: var(--text); margin-bottom: 6px; }
  .load-hint { font-size: 11.5px; color: var(--text-3); font-family: var(--mono); }
  @keyframes up { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }

  /* ─ Results ─ */
  .res-card {
    background: var(--s1); border: 1px solid var(--border);
    border-radius: var(--r); padding: 24px;
    margin-top: 16px; animation: up .4s ease;
  }
  .res-head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 24px; flex-wrap: wrap; gap: 10px;
  }
  .res-title { font-size: 16px; font-weight: 700; letter-spacing: -0.4px; color: var(--text); }
  .act-row { display: flex; gap: 7px; }
  .btn-act {
    font-family: 'Inter', sans-serif; font-size: 11.5px; font-weight: 500;
    color: var(--text-2); background: var(--s2);
    border: 1px solid var(--border-md); border-radius: var(--r-sm);
    padding: 7px 13px; cursor: pointer; transition: all .18s;
    display: flex; align-items: center; gap: 5px;
  }
  .btn-act:hover { border-color: var(--border-hi); color: var(--text); }
  .btn-act.ok { border-color: rgba(52,211,153,0.35); color: var(--green); background: rgba(52,211,153,0.05); }

  /* ─ Summary ─ */
  .sum-block {
    background: var(--s2); border: 1px solid var(--border-md);
    border-radius: var(--r-sm); padding: 18px 20px 18px;
    margin-bottom: 24px; position: relative; overflow: hidden;
  }
  .sum-block::after {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 2px; background: linear-gradient(to bottom, var(--accent) 0%, transparent 100%);
  }
  .sum-title {
    font-size: 9.5px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: var(--text-3); margin-bottom: 12px;
  }
  .sum-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .sum-list li {
    font-size: 13px; color: var(--text-2); line-height: 1.6;
    padding-left: 16px; position: relative;
  }
  .sum-list li::before {
    content: ''; position: absolute; left: 0; top: 7px;
    width: 4px; height: 4px; border-radius: 50%; background: var(--accent); opacity: 0.65;
  }

  /* ─ Q section label ─ */
  .q-label {
    font-size: 9.5px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: var(--text-3); margin-bottom: 12px;
  }
  .q-stack { display: flex; flex-direction: column; gap: 8px; }

  /* ─ Q card ─ */
  .q-card {
    background: var(--s2); border: 1px solid var(--border);
    border-radius: var(--r-sm); overflow: hidden; transition: border-color .18s;
  }
  .q-card:hover { border-color: var(--border-md); }

  .q-top {
    display: flex; align-items: flex-start; gap: 13px;
    padding: 16px 18px 14px;
  }
  .q-num {
    min-width: 26px; height: 26px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; font-family: var(--mono);
    color: #fff; flex-shrink: 0; margin-top: 2px;
  }
  .q-right { flex: 1; min-width: 0; }
  .q-chip {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 9.5px; font-weight: 600; letter-spacing: 1px;
    text-transform: uppercase; padding: 2px 8px; border-radius: 20px; margin-bottom: 7px;
  }
  .q-chip-dot { width: 4px; height: 4px; border-radius: 50%; }
  .q-text { font-size: 13.5px; font-weight: 500; color: var(--text); line-height: 1.55; letter-spacing: -0.1px; }

  .q-bot {
    display: grid; grid-template-columns: 1fr 1fr;
    border-top: 1px solid var(--border);
  }
  @media (max-width: 500px) { .q-bot { grid-template-columns: 1fr; } }
  .q-det { padding: 12px 18px; font-size: 12px; color: var(--text-2); line-height: 1.55; }
  .q-det + .q-det { border-left: 1px solid var(--border); }
  @media (max-width: 500px) { .q-det + .q-det { border-left: none; border-top: 1px solid var(--border); } }
  .q-det-lbl {
    font-size: 9px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: var(--text-3); margin-bottom: 4px;
  }

  /* ─ Regen ─ */
  .btn-regen {
    width: 100%; margin-top: 18px; padding: 11px;
    background: transparent; border: 1px dashed var(--border-md);
    border-radius: var(--r-sm); font-family: 'Inter', sans-serif;
    font-size: 12.5px; font-weight: 500; color: var(--text-3);
    cursor: pointer; transition: all .18s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .btn-regen:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
`;

// ── Drop Zone ─────────────────────────────────────────────────────────────────

function DropZone({ label, hint, icon, file, onFile, accept }) {
  const [over, setOver] = useState(false);
  return (
    <div
      className={`drop-zone ${over ? "over" : ""} ${file ? "filled" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
    >
      <input type="file" accept={accept} onChange={(e) => { const f = e.target.files[0]; if (f) onFile(f); }} />
      <div className="dz-ico">{file ? "✓" : icon}</div>
      <div className="dz-label">{label}</div>
      {file
        ? <div className="dz-file">{file.name}</div>
        : <div className="dz-hint">{hint}</div>
      }
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile]         = useState(null);
  const [jdText, setJdText]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [loadMsg, setLoadMsg]       = useState("");
  const [error, setError]           = useState("");
  const [result, setResult]         = useState(null);
  const [act, setAct]               = useState("");

  const MSGS = [
    "Parsing your documents…",
    "Analysing resume against JD…",
    "Identifying strengths and gaps…",
    "Crafting tailored questions…",
  ];

  const cycleMsg = () => {
    let i = 0; setLoadMsg(MSGS[0]);
    return setInterval(() => { i = (i + 1) % MSGS.length; setLoadMsg(MSGS[i]); }, 2200);
  };

  const loadDemo = () => {
    const blob = new Blob([SAMPLE_RESUME], { type: "text/plain" });
    setResumeFile(new File([blob], "priya_sharma_resume.txt", { type: "text/plain" }));
    setJdFile(null); setJdText(SAMPLE_JD); setResult(null); setError("");
  };

  const generate = async () => {
    setError(""); setResult(null);
    if (!resumeFile) { setError("Please upload a resume to continue."); return; }
    if (!jdFile && !jdText.trim()) { setError("Please upload or paste a job description."); return; }

    setLoading(true);
    const iv = cycleMsg();
    try {
      const resumeText = await extractText(resumeFile);
      const jdContent  = jdFile ? await extractText(jdFile) : jdText.trim();

      if (!resumeText || resumeText.trim().length < 50)
        throw new Error("Resume text is too short. Please upload a clearer file.");
      if (!jdContent || jdContent.trim().length < 30)
        throw new Error("Job description content is too short or empty.");

      const prompt = `You are an expert recruiter and interview planner.

Compare the candidate resume with the job description and generate exactly 10 tailored interview questions for a first-round interview.

--- RESUME ---
${resumeText.slice(0, 4000)}

--- JOB DESCRIPTION ---
${jdContent.slice(0, 3000)}

Generate exactly:
- 4 role-fit questions
- 3 experience-validation questions  
- 2 behavioral or competency questions
- 1 motivation question

Respond ONLY with valid JSON (no markdown fences) in this exact structure:
{
  "matchSummary": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
  "questions": [
    { "category": "role-fit", "question": "...", "whyAsk": "...", "listenFor": "..." }
  ]
}

Rules: matchSummary = 5-7 bullets on strengths/gaps/focus. Be specific to resume+JD. No invented facts. Open-ended questions only. category must be exactly: "role-fit", "experience", "behavioral", or "motivation".`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "API error");

      const raw    = data.content.map((b) => b.type === "text" ? b.text : "").join("");
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

      if (!parsed.questions || parsed.questions.length !== 10)
        throw new Error("Unexpected response format. Please try again.");

      setResult(parsed);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      clearInterval(iv); setLoading(false);
    }
  };

  const fmt = () => {
    if (!result) return "";
    let o = "MATCH SUMMARY\n" + "─".repeat(36) + "\n";
    result.matchSummary.forEach((b) => { o += `• ${b}\n`; });
    o += "\n" + "─".repeat(36) + "\nINTERVIEW QUESTIONS\n" + "─".repeat(36) + "\n\n";
    result.questions.forEach((q, i) => {
      o += `${i + 1}. [${q.category.toUpperCase()}]\nQuestion: ${q.question}\nWhy ask this: ${q.whyAsk}\nListen for: ${q.listenFor}\n\n`;
    });
    return o;
  };

  const copy = () => navigator.clipboard.writeText(fmt()).then(() => { setAct("copied"); setTimeout(() => setAct(""), 2000); });
  const dl   = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([fmt()], { type: "text/plain" }));
    a.download = "interview-questions.txt"; a.click();
    setAct("dl"); setTimeout(() => setAct(""), 2000);
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">

        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">✦</div>
            <span className="brand-name">InterviewIQ</span>
          </div>
          <span className="badge">Beta</span>
        </header>

        <main className="main">

          <div className="hero">
            <div className="eyebrow"><span className="eyebrow-line" /> AI-Powered Hiring Tool</div>
            <h1>Turn any resume into<br /><span className="grad">great interview questions</span></h1>
            <p className="hero-sub">Upload a resume and job description. Get 10 tailored, role-specific interview questions with scoring guidance — instantly.</p>
          </div>

          <div className="card">
            <div className="card-label">Documents</div>

            <div className="upload-grid">
              <DropZone
                label="Candidate Resume" hint="PDF · DOCX · TXT" icon="📄"
                accept=".pdf,.docx,.txt" file={resumeFile}
                onFile={(f) => { setResumeFile(f); setError(""); setResult(null); }}
              />
              <DropZone
                label="Job Description" hint="PDF · DOCX · TXT" icon="📋"
                accept=".pdf,.docx,.txt" file={jdFile}
                onFile={(f) => { setJdFile(f); setJdText(""); setError(""); setResult(null); }}
              />
            </div>

            <div className="sep"><span>or paste JD</span></div>

            <label className="field-lbl">Job Description Text{jdFile ? " (file takes priority)" : ""}</label>
            <textarea
              rows={4}
              placeholder="Paste the full job description here if you don't have a file…"
              value={jdText}
              onChange={(e) => { setJdText(e.target.value); if (e.target.value) setJdFile(null); }}
              disabled={!!jdFile}
            />

            <div className="foot-row">
              <button className="btn-ghost" onClick={loadDemo}>✦ Load sample data</button>
            </div>

            {error && (
              <div className="err">
                <span>⚠</span><span>{error}</span>
              </div>
            )}

            <button className="btn-cta" onClick={generate} disabled={loading}>
              {loading ? "Generating…" : "Generate Interview Questions →"}
            </button>
          </div>

          {loading && (
            <div className="load-card">
              <div className="pulse-ring" />
              <div className="load-msg">{loadMsg}</div>
              <div className="load-hint">usually 10 – 20 seconds</div>
            </div>
          )}

          {result && !loading && (
            <div className="res-card">
              <div className="res-head">
                <div className="res-title">Interview Questions</div>
                <div className="act-row">
                  <button className={`btn-act ${act === "copied" ? "ok" : ""}`} onClick={copy}>
                    {act === "copied" ? "✓ Copied" : "⎘ Copy"}
                  </button>
                  <button className={`btn-act ${act === "dl" ? "ok" : ""}`} onClick={dl}>
                    {act === "dl" ? "✓ Saved" : "↓ Download"}
                  </button>
                </div>
              </div>

              <div className="sum-block">
                <div className="sum-title">Match Summary</div>
                <ul className="sum-list">
                  {result.matchSummary.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>

              <div className="q-label">10 Tailored Questions</div>
              <div className="q-stack">
                {result.questions.map((q, i) => {
                  const m = CATEGORY_META[q.category] || CATEGORY_META["role-fit"];
                  return (
                    <div className="q-card" key={i}>
                      <div className="q-top">
                        <div className="q-num" style={{ background: m.color }}>{i + 1}</div>
                        <div className="q-right">
                          <span className="q-chip" style={{ background: m.bg, color: m.color }}>
                            <span className="q-chip-dot" style={{ background: m.dot }} />
                            {m.label}
                          </span>
                          <div className="q-text">{q.question}</div>
                        </div>
                      </div>
                      <div className="q-bot">
                        <div className="q-det">
                          <div className="q-det-lbl">Why ask this</div>
                          {q.whyAsk}
                        </div>
                        <div className="q-det">
                          <div className="q-det-lbl">Listen for</div>
                          {q.listenFor}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="btn-regen" onClick={generate}>↻ Regenerate</button>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
