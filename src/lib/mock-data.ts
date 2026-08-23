export const STAGES = [
  "Enquiry",
  "Nurturing",
  "Application",
  "BUAT",
  "Merit List",
  "Counselling",
  "Verification",
  "Enrolled",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_ICON: Record<Stage, string> = {
  Enquiry: "sparkle",
  Nurturing: "sprout",
  Application: "file-text",
  BUAT: "pen-line",
  "Merit List": "list-ordered",
  Counselling: "messages-square",
  Verification: "file-check",
  Enrolled: "graduation-cap",
};

export interface Lead {
  id: number;
  name: string;
  city: string;
  program: string;
  faculty: string;
  source: string;
  srcIcon: string;
  stage: Stage;
  score: number;
  owner: string;
  lastTouch: string;
  sla: "On track" | "Due today" | "Breached";
  campaign: string;
  medium: string;
}

export const LEADS: Lead[] = [
  { id: 1, name: "Aarohi Sharma", city: "Jaipur, RJ", program: "B.Tech — Computer Science", faculty: "Faculty of Technology", source: "WhatsApp", srcIcon: "message-circle", stage: "Counselling", score: 88, owner: "Meenakshi V.", lastTouch: "2h ago", sla: "On track", campaign: "BUAT-2026 Retarget", medium: "wa-inbound" },
  { id: 2, name: "Ishita Verma", city: "Kota, RJ", program: "BCA", faculty: "Maths & Computing", source: "Website", srcIcon: "globe", stage: "Application", score: 74, owner: "Kavita S.", lastTouch: "5h ago", sla: "On track", campaign: "Organic / banasthali.org", medium: "web-form" },
  { id: 3, name: "Priyanka Meena", city: "Ajmer, RJ", program: "B.Sc — Home Science", faculty: "Faculty of Home Science", source: "Education Fair", srcIcon: "tent", stage: "Nurturing", score: 63, owner: "Sunita R.", lastTouch: "1d ago", sla: "Due today", campaign: "Jaipur Edu Fair '26", medium: "event-capture" },
  { id: 4, name: "Sneha Agarwal", city: "Delhi", program: "BA — English", faculty: "Arts & Social Sciences", source: "Shiksha", srcIcon: "building-2", stage: "Enquiry", score: 45, owner: "Kavita S.", lastTouch: "3d ago", sla: "Breached", campaign: "Shiksha marketplace", medium: "portal-lead" },
  { id: 5, name: "Riya Gupta", city: "Udaipur, RJ", program: "B.Ed", faculty: "Faculty of Education", source: "Referral", srcIcon: "user-plus", stage: "BUAT", score: 81, owner: "Meenakshi V.", lastTouch: "6h ago", sla: "On track", campaign: "Alumna referral", medium: "referral-code" },
  { id: 6, name: "Ananya Singh", city: "Lucknow, UP", program: "LL.B", faculty: "Faculty of Law", source: "Instagram Ad", srcIcon: "share-2", stage: "Nurturing", score: 58, owner: "Sunita R.", lastTouch: "1d ago", sla: "Due today", campaign: "IG Lead Ad — Law", medium: "paid-social" },
  { id: 7, name: "Kavya Nair", city: "Kochi, KL", program: "M.Sc — Biotechnology", faculty: "Faculty of Life Sciences", source: "Website", srcIcon: "globe", stage: "Merit List", score: 79, owner: "Meenakshi V.", lastTouch: "4h ago", sla: "On track", campaign: "PG landing page", medium: "web-form" },
  { id: 8, name: "Diya Patel", city: "Ahmedabad, GJ", program: "BBA", faculty: "Management & Commerce", source: "Phone", srcIcon: "phone", stage: "Application", score: 66, owner: "Kavita S.", lastTouch: "8h ago", sla: "On track", campaign: "Inbound call centre", medium: "telephony" },
  { id: 9, name: "Meghna Rao", city: "Hyderabad, TS", program: "B.Des — Fine Arts", faculty: "Fine Arts", source: "Walk-in", srcIcon: "door-open", stage: "Enquiry", score: 52, owner: "Sunita R.", lastTouch: "2d ago", sla: "Due today", campaign: "Front office", medium: "walk-in" },
  { id: 10, name: "Tanvi Joshi", city: "Pune, MH", program: "MA — Music", faculty: "Music & Performing Arts", source: "Email", srcIcon: "mail", stage: "Verification", score: 71, owner: "Meenakshi V.", lastTouch: "3h ago", sla: "On track", campaign: "Admissions inbox", medium: "email" },
  { id: 11, name: "Nidhi Kumari", city: "Patna, BR", program: "Ph.D — Chemistry", faculty: "Faculty of Science", source: "Website", srcIcon: "globe", stage: "Counselling", score: 84, owner: "Kavita S.", lastTouch: "1h ago", sla: "On track", campaign: "Research programmes", medium: "web-form" },
  { id: 12, name: "Saanvi Reddy", city: "Bengaluru, KA", program: "B.Tech — Computer Science", faculty: "Faculty of Technology", source: "Careers360", srcIcon: "building-2", stage: "BUAT", score: 69, owner: "Sunita R.", lastTouch: "7h ago", sla: "Due today", campaign: "Careers360 listing", medium: "portal-lead" },
];

export interface LeadDetail {
  firstTouch: string;
  profile: { k: string; v: string }[];
  parent: { name: string; relation: string; phone: string };
  docs: { name: string; status: string; icon: string; color: string }[];
  timeline: { icon: string; title: string; detail: string; time: string }[];
  scoreFactors: { label: string; pts: string; width: string }[];
  nba: { icon: string; text: string }[];
  tasks: { text: string; due: string; color: string }[];
}

export const LEAD_DETAILS: Record<number, LeadDetail> = {
  1: {
    firstTouch: "12 Jun 2026",
    profile: [
      { k: "Phone", v: "+91 98290 •••21" },
      { k: "Email", v: "aarohi.s@gmail.com" },
      { k: "Category", v: "General" },
      { k: "10+2 aggregate", v: "93.4%" },
      { k: "Language", v: "Hindi, English" },
      { k: "Hostel", v: "Requested" },
    ],
    parent: { name: "Rajesh Sharma", relation: "Father", phone: "+91 98290 •••88" },
    docs: [
      { name: "10+2 Marksheet", status: "Verified", icon: "file-check", color: "var(--color-accent-700)" },
      { name: "BUAT Admit Card", status: "Verified", icon: "file-check", color: "var(--color-accent-700)" },
      { name: "Character Certificate", status: "Pending", icon: "file-clock", color: "var(--color-neutral-600)" },
      { name: "Transfer Certificate", status: "Not uploaded", icon: "file-x", color: "var(--color-neutral-500)" },
    ],
    timeline: [
      { icon: "chevron-right", title: "Stage advanced to Counselling", detail: "Rank 142 · CS preference confirmed", time: "2h ago" },
      { icon: "message-circle", title: "WhatsApp — counselling slot", detail: "Sent call letter & slot options for 24 Aug", time: "2h ago" },
      { icon: "phone", title: "Call — 6m 12s", detail: "Discussed hostel & fee schedule with parent", time: "1d ago" },
      { icon: "pen-line", title: "BUAT score imported", detail: "Score 168/200 · normalised aggregate applied", time: "6d ago" },
      { icon: "file-text", title: "Application submitted", detail: "Online on banasthali.org · fee paid", time: "18d ago" },
      { icon: "sparkle", title: "Enquiry captured", detail: "WhatsApp inbound · BUAT-2026 retarget campaign", time: "12 Jun" },
    ],
    scoreFactors: [
      { label: "Programme fit", pts: "28/30", width: "93%" },
      { label: "Engagement", pts: "24/25", width: "96%" },
      { label: "Profile completeness", pts: "20/25", width: "80%" },
      { label: "Source quality", pts: "16/20", width: "80%" },
    ],
    nba: [
      { icon: "calendar-clock", text: "Confirm 24 Aug counselling slot — parent awaiting reply" },
      { icon: "file-clock", text: "Nudge for Character Certificate before verification" },
      { icon: "home", text: "Share hostel allotment brochure (requested)" },
    ],
    tasks: [
      { text: "Counselling reminder call", due: "Today 4pm", color: "var(--color-accent-700)" },
      { text: "Collect pending document", due: "23 Aug", color: "var(--color-neutral-600)" },
    ],
  },
  5: {
    firstTouch: "2 Jul 2026",
    profile: [
      { k: "Phone", v: "+91 94140 •••09" },
      { k: "Email", v: "riya.g@gmail.com" },
      { k: "Category", v: "OBC" },
      { k: "10+2 aggregate", v: "88.1%" },
      { k: "Language", v: "Hindi" },
      { k: "Hostel", v: "Requested" },
    ],
    parent: { name: "Sunita Gupta", relation: "Mother", phone: "+91 94140 •••55" },
    docs: [
      { name: "10+2 Marksheet", status: "Verified", icon: "file-check", color: "var(--color-accent-700)" },
      { name: "BUAT Admit Card", status: "Issued", icon: "file-check", color: "var(--color-accent-700)" },
      { name: "Category Certificate", status: "Pending", icon: "file-clock", color: "var(--color-neutral-600)" },
    ],
    timeline: [
      { icon: "pen-line", title: "BUAT admit card issued", detail: "Exam centre: Jaipur · 21 Aug slot", time: "6h ago" },
      { icon: "message-circle", title: "WhatsApp — exam reminder", detail: "Admit card + reporting instructions sent", time: "6h ago" },
      { icon: "user-plus", title: "Referred by alumna", detail: "Referral code ALU-2291 applied", time: "2 Jul" },
    ],
    scoreFactors: [
      { label: "Programme fit", pts: "25/30", width: "83%" },
      { label: "Engagement", pts: "22/25", width: "88%" },
      { label: "Profile completeness", pts: "18/25", width: "72%" },
      { label: "Source quality", pts: "16/20", width: "80%" },
    ],
    nba: [
      { icon: "pen-line", text: "Send BUAT day-before checklist tomorrow" },
      { icon: "file-clock", text: "Request Category Certificate upload" },
    ],
    tasks: [{ text: "BUAT reminder (T-1)", due: "20 Aug", color: "var(--color-accent-700)" }],
  },
};

export const KPIS = [
  { label: "Total enquiries", value: "11,842", delta: "+18% vs last cycle", deltaColor: "var(--color-accent-700)", deltaIcon: "trending-up", icon: "inbox" },
  { label: "Applications", value: "6,204", delta: "+12% conversion", deltaColor: "var(--color-accent-700)", deltaIcon: "trending-up", icon: "file-text" },
  { label: "BUAT registered", value: "4,517", delta: "73% of applicants", deltaColor: "var(--color-muted)", deltaIcon: "minus", icon: "pen-line" },
  { label: "Enrolled", value: "1,986", delta: "+9% vs target", deltaColor: "var(--color-accent-700)", deltaIcon: "trending-up", icon: "graduation-cap" },
];

export const FUNNEL = [
  { stage: "Enquiry", count: "11,842", conv: "100%", width: "100%" },
  { stage: "Nurturing", count: "8,930", conv: "75%", width: "75%" },
  { stage: "Application", count: "6,204", conv: "52%", width: "52%" },
  { stage: "BUAT", count: "4,517", conv: "38%", width: "38%" },
  { stage: "Merit List", count: "3,140", conv: "27%", width: "27%" },
  { stage: "Counselling", count: "2,610", conv: "22%", width: "22%" },
  { stage: "Verification", count: "2,190", conv: "18%", width: "18%" },
  { stage: "Enrolled", count: "1,986", conv: "17%", width: "17%" },
];

export const SOURCES = [
  { name: "University website", icon: "globe", pct: "34%" },
  { name: "WhatsApp", icon: "message-circle", pct: "19%" },
  { name: "Education fairs", icon: "tent", pct: "12%" },
  { name: "Edu portals", icon: "building-2", pct: "11%" },
  { name: "Social ads", icon: "share-2", pct: "9%" },
  { name: "Phone / call centre", icon: "phone", pct: "7%" },
  { name: "Referrals", icon: "user-plus", pct: "5%" },
  { name: "Walk-in", icon: "door-open", pct: "3%" },
];

export const SOURCE_STRIP = [
  { name: "Website", icon: "globe", count: "4,026", pct: "34%" },
  { name: "WhatsApp", icon: "message-circle", count: "2,250", pct: "19%" },
  { name: "Edu fairs", icon: "tent", count: "1,421", pct: "12%" },
  { name: "Portals", icon: "building-2", count: "1,303", pct: "11%" },
  { name: "Social", icon: "share-2", count: "1,066", pct: "9%" },
  { name: "Phone", icon: "phone", count: "829", pct: "7%" },
  { name: "Referral", icon: "user-plus", count: "592", pct: "5%" },
  { name: "Walk-in", icon: "door-open", count: "355", pct: "3%" },
];

export const SLA_ALERTS = [
  { title: "12 leads breached first-response SLA", meta: "Shiksha & Careers360 portal batch · reassign", dot: "#b4442e" },
  { title: "34 counselling reminders due today", meta: "Rank 100–250 · call letters pending", dot: "var(--color-accent)" },
  { title: "8 documents awaiting verification", meta: "Character / transfer certificates", dot: "var(--color-neutral-500)" },
];

export const COUNSELLORS = [
  { name: "Meenakshi Vyas", initials: "MV", leads: 412, converted: "96", onTime: "94%" },
  { name: "Kavita Sharma", initials: "KS", leads: 388, converted: "81", onTime: "89%" },
  { name: "Sunita Rathore", initials: "SR", leads: 401, converted: "74", onTime: "82%" },
];

export const ERP_RECENT = [
  { name: "Aarohi Sharma", meta: "B.Tech CS · ID BV26-1042", status: "Synced", icon: "check-circle-2", color: "var(--color-accent-700)", tagClass: "tag-accent" },
  { name: "Nidhi Kumari", meta: "Ph.D Chemistry · retry 2", status: "Queued", icon: "clock", color: "var(--color-neutral-600)", tagClass: "tag-neutral" },
  { name: "Tanvi Joshi", meta: "MA Music · schema mismatch", status: "Review", icon: "alert-triangle", color: "#b4442e", tagClass: "tag-outline" },
];

export const OPS_BUAT = [
  { label: "Registered", value: "4,517", icon: "user-check" },
  { label: "Admit cards issued", value: "4,290", icon: "ticket" },
  { label: "Appeared", value: "3,988", icon: "pen-line" },
  { label: "Scores imported", value: "3,988", icon: "download" },
];

export const OPS_MERIT = [
  { rank: "001", name: "Kavya Nair", program: "M.Sc Biotech", score: "191", agg: "96.2%", status: "Called" },
  { rank: "014", name: "Nidhi Kumari", program: "Ph.D Chemistry", score: "184", agg: "—", status: "Called" },
  { rank: "142", name: "Aarohi Sharma", program: "B.Tech CS", score: "168", agg: "93.4%", status: "Counselling" },
  { rank: "207", name: "Saanvi Reddy", program: "B.Tech CS", score: "159", agg: "90.1%", status: "Waitlist R2" },
  { rank: "318", name: "Riya Gupta", program: "B.Ed", score: "151", agg: "88.1%", status: "Pending" },
];

export const OPS_SLOTS = [
  { time: "23 Aug · 10:00", prog: "B.Tech / BCA", ranks: "Rank 1–120", booked: "96 / 120", fill: "80%" },
  { time: "24 Aug · 10:00", prog: "B.Tech / BCA", ranks: "Rank 121–250", booked: "71 / 130", fill: "55%" },
  { time: "24 Aug · 14:00", prog: "Life Sciences PG", ranks: "Rank 1–80", booked: "44 / 80", fill: "55%" },
  { time: "25 Aug · 10:00", prog: "Management", ranks: "Rank 1–150", booked: "22 / 150", fill: "15%" },
];

export const OPS_VERIFY = [
  { name: "Aarohi Sharma", doc: "Character Certificate", status: "Pending", color: "var(--color-neutral-600)" },
  { name: "Tanvi Joshi", doc: "Migration Certificate", status: "Query raised", color: "#b4442e" },
  { name: "Riya Gupta", doc: "Category Certificate", status: "Pending", color: "var(--color-neutral-600)" },
  { name: "Nidhi Kumari", doc: "All documents", status: "Verified", color: "var(--color-accent-700)" },
];

export const ERP_FLOW = [
  { icon: "badge-check", title: "Admission confirmed", detail: "Counselling outcome + verified docs + fee status" },
  { icon: "user-round-cog", title: "Assemble profile", detail: "Personal, academic, programme, guardians, consent" },
  { icon: "copy-check", title: "Deduplicate", detail: "Fuzzy match against ERP & CRM — no duplicates" },
  { icon: "arrow-left-right", title: "Map & validate", detail: "To ERP schema & code lists (programme, category)" },
  { icon: "database-zap", title: "Handoff transaction", detail: "Create / update student via integration contract" },
  { icon: "key-round", title: "ERP returns ID", detail: "Authoritative enrolment number stored as x-ref" },
  { icon: "party-popper", title: "Onboarding triggered", detail: "Welcome journey, portal account, parent linkage" },
];

export const ERP_STYLES = [
  { name: "REST / JSON API", tag: "Preferred", note: "OAuth2 or mTLS · synchronous ack + student ID", on: true },
  { name: "Webhook / event push", tag: "Real-time", note: "Signed payloads · retry with backoff", on: false },
  { name: "Message queue / iPaaS", tag: "Decoupled", note: "Kafka / RabbitMQ or an ESB layer", on: false },
  { name: "Guarded DB view / proc", tag: "Fallback", note: "Read/write via views only · no table coupling", on: false },
  { name: "Batch file / SFTP", tag: "Backfill", note: "Scheduled CSV/XML · checksums + reconciliation", on: false },
];

export const ERP_MAP = [
  { crm: "Full name", erp: "student_name", rule: "Split to first / last per ERP format" },
  { crm: "CRM Lead ID", erp: "external_ref_id", rule: "Stored for cross-reference" },
  { crm: "Programme + Faculty", erp: "programme_code, faculty_code", rule: "Map to ERP code lists" },
  { crm: "Category / quota", erp: "category_code", rule: "Map to ERP master" },
  { crm: "Parent / Guardian", erp: "guardian_name, guardian_mobile", rule: "Link relationship" },
  { crm: "Fee / payment status", erp: "fee_status, txn_ref", rule: "From gateway · reconcile with ERP" },
  { crm: "Admission session", erp: "session_id / batch", rule: "Map to ERP academic session" },
];

export const ERP_QUEUE = [
  { name: "Aarohi Sharma", prog: "B.Tech CS", ref: "BV26-1042", status: "Synced", color: "var(--color-accent-700)", tag: "tag-accent", icon: "check-circle-2" },
  { name: "Nidhi Kumari", prog: "Ph.D Chemistry", ref: "pending", status: "Queued · retry 2", color: "var(--color-neutral-600)", tag: "tag-neutral", icon: "clock" },
  { name: "Kavya Nair", prog: "M.Sc Biotech", ref: "BV26-0771", status: "Synced", color: "var(--color-accent-700)", tag: "tag-accent", icon: "check-circle-2" },
  { name: "Tanvi Joshi", prog: "MA Music", ref: "error", status: "Review · schema mismatch", color: "#b4442e", tag: "tag-outline", icon: "alert-triangle" },
];

export const ERP_STATS = [
  { label: "Handoff success", value: "98.7%" },
  { label: "Synced this cycle", value: "1,986" },
  { label: "In retry queue", value: "12" },
  { label: "Reconcile exceptions", value: "3" },
];

export const A_KPI = [
  { label: "Enquiry → Enrolment", value: "16.8%", delta: "+2.1 pts", up: true },
  { label: "Avg. first response", value: "42 min", delta: "−18 min", up: true },
  { label: "Cost per enrolment", value: "₹4,120", delta: "−9%", up: true },
  { label: "AI deflection rate", value: "61%", delta: "+7 pts", up: true },
];

export const A_ROI = [
  { src: "University website", leads: "4,026", enr: "812", conv: "20.2%", cost: "₹2,650", fill: "100%" },
  { src: "Referrals", leads: "592", enr: "138", conv: "23.3%", cost: "₹980", fill: "88%" },
  { src: "WhatsApp", leads: "2,250", enr: "389", conv: "17.3%", cost: "₹3,100", fill: "74%" },
  { src: "Education fairs", leads: "1,421", enr: "201", conv: "14.1%", cost: "₹5,400", fill: "58%" },
  { src: "Social ads", leads: "1,066", enr: "112", conv: "10.5%", cost: "₹6,900", fill: "42%" },
  { src: "Edu portals", leads: "1,303", enr: "134", conv: "10.3%", cost: "₹7,250", fill: "40%" },
];

export const A_COMMS = [
  { ch: "WhatsApp", icon: "message-circle", sent: "18,240", rate: "delivered 97% · read 82%", fill: "82%" },
  { ch: "Email", icon: "mail", sent: "26,910", rate: "delivered 94% · open 41%", fill: "41%" },
  { ch: "SMS (DLT)", icon: "smartphone", sent: "31,500", rate: "delivered 96% · click 12%", fill: "12%" },
  { ch: "In-app", icon: "bell", sent: "9,120", rate: "seen 88% · action 34%", fill: "34%" },
];

export const STU_CHECK = [
  { name: "Accept offer & pay admission fee", done: true },
  { name: "Upload verified documents", done: true },
  { name: "Complete hostel preference form", done: true },
  { name: "Register for orientation (28 Aug)", done: false },
  { name: "Health & vaccination declaration", done: false },
  { name: "Collect ID card & library access", done: false },
];

export const STU_ANN = [
  { icon: "megaphone", title: "Orientation week begins 28 August", meta: "Faculty of Technology · Sharda Peeth", time: "2d" },
  { icon: "home", title: "Hostel allotment published", meta: "Check your block & room on the portal", time: "4d" },
  { icon: "calendar", title: "Panchmukhi induction sessions", meta: "Physical, aesthetic & moral education tracks", time: "5d" },
];

export const STU_INFO = [
  { icon: "indian-rupee", label: "Semester fee", value: "₹68,400", sub: "Due 5 Sep · from ERP", color: "var(--color-accent-700)" },
  { icon: "bed-double", label: "Hostel", value: "Chandra Bhawan · C-214", sub: "Allotted · read-only", color: "var(--color-text)" },
  { icon: "clock", label: "Classes begin", value: "2 September", sub: "Timetable from ERP", color: "var(--color-text)" },
];

export const PAR_STATUS = [
  { icon: "check-circle-2", title: "Admission confirmed", meta: "B.Tech Computer Science · seat secured", done: true },
  { icon: "file-check", title: "Documents verified", meta: "All certificates accepted", done: true },
  { icon: "home", title: "Hostel allotted", meta: "Chandra Bhawan · C-214", done: true },
  { icon: "calendar-clock", title: "Orientation registration", meta: "Pending — closes 26 Aug", done: false },
];

export const PAR_INFO = [
  { icon: "shield-check", label: "Campus safety", value: "Fully residential, gated, 24×7 wardens" },
  { icon: "indian-rupee", label: "Next fee", value: "₹68,400 due 5 Sep" },
  { icon: "phone", label: "Warden contact", value: "Chandra Bhawan · +91 1438 •••210" },
  { icon: "bus", label: "Visiting & travel", value: "Guest house bookings via portal" },
];

export const AI_MSGS: {
  role: "bot" | "user";
  text: string;
  src?: string;
}[] = [
  { role: "bot", text: "Namaste! I'm the Banasthali assistant. Ask me about admissions, BUAT, fees, hostel or campus life — in English or Hindi." },
  { role: "user", text: "What documents do I need for verification after counselling?" },
  { role: "bot", text: "For document verification you'll need: your 10+2 marksheet, BUAT admit card, character certificate from your last institution, transfer certificate, and category certificate (if applicable). Originals plus one photocopy each.", src: "Admission Handbook 2026 · §4.3 Verification" },
  { role: "user", text: "BUAT ki merit list kab aayegi?" },
  { role: "bot", text: "Merit list programme-specific hoti hai. B.Tech aur UG programmes ke liye BUAT ke result ke lagbhag 7–10 din baad publish hoti hai — test score aur normalised 10+2 aggregate ke aadhaar par. Aapko portal aur WhatsApp par notification milega.", src: "Admissions FAQ · Merit & Counselling" },
];

export const AI_PROMPTS = [
  "Eligibility for M.Sc Biotechnology",
  "Hostel fee & facilities",
  "How is BUAT score normalised?",
  "Counselling slot booking",
];

export const AI_HOW = [
  { icon: "library", title: "Grounded knowledge base", text: "Website, brochures, FAQs & policies — chunked, embedded, refreshed on change" },
  { icon: "search-check", title: "Retrieval + grounding", text: "Answers only from approved content, with source references" },
  { icon: "shield-alert", title: "Guardrails", text: "Scope restriction, no fabrication, PII protection, safe completion" },
  { icon: "user-round-check", title: "Human-in-the-loop", text: "Low-confidence queries escalate to a counsellor with full context" },
];

export const AI_STATS = [
  { label: "Deflection", value: "61%" },
  { label: "Avg. answer", value: "1.4s" },
  { label: "Satisfaction", value: "4.6/5" },
];

export const ROLES = [
  { role: "Super Admin / IT", perm: "Full configuration, integrations, RBAC, audit — no restriction", scope: "All" },
  { role: "Admissions Head / Registrar", perm: "Funnel oversight, merit & counselling, ERP handoff approval, reports", scope: "All admissions" },
  { role: "Admission Counsellor", perm: "Own assigned leads, communicate, progress stages, log activities", scope: "Assigned leads" },
  { role: "Marketing / Outreach", perm: "Campaigns, sources, event capture, analytics — limited lead PII", scope: "Campaigns" },
  { role: "Front Office / Data Entry", perm: "Create & capture leads and walk-ins — limited view", scope: "Capture only" },
  { role: "Management / Leadership", perm: "Read-only dashboards & KPIs across the funnel", scope: "Read-only" },
  { role: "Student", perm: "Own portal, application status, self-service, AI assistant, tickets", scope: "Self" },
  { role: "Parent / Guardian", perm: "Consent-bound view of linked student's admission & onboarding", scope: "Linked student" },
  { role: "Data Protection Officer", perm: "Consent, privacy requests, audit & compliance views", scope: "Compliance" },
];

export const ADM_CONFIG = [
  { icon: "git-branch", title: "Pipelines & stages", meta: "6 pipelines · 8 stages · configurable per programme" },
  { icon: "radio", title: "Source taxonomy", meta: "11 sources · add channels without code" },
  { icon: "file-text", title: "Message templates", meta: "42 templates · WhatsApp approved · multilingual" },
  { icon: "sliders-horizontal", title: "Lead scoring rules", meta: "4 factors · thresholds A/B/C configurable" },
];

export const ADM_INTEG = [
  { name: "In-house ERP", status: "Healthy", color: "var(--color-accent-700)", dot: "var(--color-accent)" },
  { name: "WhatsApp Business API", status: "Healthy", color: "var(--color-accent-700)", dot: "var(--color-accent)" },
  { name: "SMS provider (DLT)", status: "Healthy", color: "var(--color-accent-700)", dot: "var(--color-accent)" },
  { name: "Payment gateway", status: "Degraded · webhook lag", color: "#b4442e", dot: "#b4442e" },
  { name: "Telephony / CTI", status: "Healthy", color: "var(--color-accent-700)", dot: "var(--color-accent)" },
];

export const ADM_AUDIT = [
  { who: "Kavita S.", act: "Advanced 12 leads to Counselling", time: "11:42" },
  { who: "System", act: "ERP handoff — Aarohi Sharma synced (BV26-1042)", time: "11:20" },
  { who: "Meenakshi V.", act: "Edited WhatsApp template “Counselling slot”", time: "10:58" },
  { who: "DPO", act: "Processed data-erasure request #DP-204", time: "09:30" },
];

export const NAV_GROUPS = [
  { label: "Command", items: [{ k: "dashboard", label: "Command Center", icon: "layout-dashboard" }] },
  {
    label: "CRM Core",
    items: [
      { k: "leads", label: "Leads & Enquiries", icon: "users", badge: "2.4k" },
      { k: "funnel", label: "Admission Funnel", icon: "git-branch" },
      { k: "workbench", label: "Counsellor Workbench", icon: "briefcase" },
    ],
  },
  {
    label: "Admissions",
    items: [
      { k: "ops", label: "Admission Ops", icon: "clipboard-check" },
      { k: "erp", label: "ERP Handoff", icon: "database-zap" },
    ],
  },
  { label: "Insight", items: [{ k: "analytics", label: "Analytics", icon: "bar-chart-3" }] },
  {
    label: "Engagement",
    items: [
      { k: "student", label: "Student Portal", icon: "graduation-cap" },
      { k: "parent", label: "Parent Portal", icon: "heart-handshake" },
      { k: "ai", label: "AI Assistant", icon: "sparkles" },
    ],
  },
  {
    label: "System",
    items: [
      { k: "pipelines", label: "Pipelines", icon: "git-branch" },
      { k: "templates", label: "Templates", icon: "file-text" },
      { k: "journeys", label: "Journeys", icon: "workflow" },
      { k: "kb", label: "Knowledge Base", icon: "library" },
      { k: "admin", label: "Admin & RBAC", icon: "shield" },
    ],
  },
] as const;

export const CRUMBS: Record<string, [string, string]> = {
  dashboard: ["Command Center", "Overview"],
  leads: ["CRM Core", "Leads & Enquiries"],
  lead360: ["CRM Core", "Lead 360°"],
  funnel: ["CRM Core", "Admission Funnel"],
  workbench: ["CRM Core", "Counsellor Workbench"],
  ops: ["Admissions", "Admission Ops"],
  erp: ["Admissions", "ERP Handoff"],
  analytics: ["Insight", "Analytics"],
  student: ["Engagement", "Student Portal"],
  parent: ["Engagement", "Parent Portal"],
  ai: ["Engagement", "AI Assistant"],
  admin: ["System", "Admin & RBAC"],
  templates: ["System", "Templates"],
  pipelines: ["System", "Pipelines"],
  kb: ["System", "Knowledge Base"],
  journeys: ["System", "Journeys"],
};

export type ViewKey =
  | "dashboard"
  | "leads"
  | "lead360"
  | "funnel"
  | "workbench"
  | "ops"
  | "erp"
  | "analytics"
  | "student"
  | "parent"
  | "ai"
  | "admin"
  | "templates"
  | "pipelines"
  | "kb"
  | "journeys";
