import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icon";
import { auth } from "@/auth";

const FEATURES = [
  {
    icon: "users",
    title: "One funnel, many doors",
    body: "Every enquiry — website, WhatsApp, education fair, phone, referral — lands in a single CRM with source, campaign, medium and timestamp attached.",
  },
  {
    icon: "git-branch",
    title: "Configurable admission pipeline",
    body: "Stages, SLAs, and per-programme variants are all configuration, not code. Adapts to any admission cycle without a release.",
  },
  {
    icon: "database-zap",
    title: "Governed ERP handoff",
    body: "On confirmation, a deduplicated student record hands off to the in-house ERP. Idempotent, auditable, never re-keyed.",
  },
  {
    icon: "sparkles",
    title: "Multilingual RAG AI Assistant",
    body: "Grounded in approved Banasthali content — accurate, cited, available 24×7 in English and हिंदी across web, portal, WhatsApp and mobile.",
  },
  {
    icon: "message-circle",
    title: "Omnichannel messaging",
    body: "Email, WhatsApp, SMS and in-app — all through one adapter interface, one template library, one send log.",
  },
  {
    icon: "shield",
    title: "RBAC + audit by default",
    body: "Nine roles with per-view visibility, DPDP-aligned consent handling, and an immutable audit trail on every mutation.",
  },
];

const STATS = [
  { label: "Views", value: "14+" },
  { label: "API routes", value: "23+" },
  { label: "Languages", value: "EN · हिं" },
  { label: "Uptime", value: "99.9%" },
];

export default async function SplashPage() {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <div style={{ background: "var(--color-bg)", color: "var(--color-text)", minHeight: "100vh" }}>
      <header
        className="flex items-center gap-4 mx-auto"
        style={{
          padding: "18px 32px",
          maxWidth: 1200,
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="grid place-items-center rounded-full"
            style={{
              width: 40,
              height: 40,
              background: "#7b1e28",
              border: "1px solid #9a3341",
              color: "#f3ede3",
              fontFamily: "var(--font-heading)",
              fontSize: 20,
              letterSpacing: "-.02em",
            }}
          >
            बा
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, lineHeight: 1 }}>Banasthali</div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--color-muted)",
              }}
            >
              Vidyapith CRM
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/login" className="btn btn-primary" style={{ gap: 6 }}>
            Sign in
            <Icon name="arrow-right" size={14} />
          </Link>
        </div>
      </header>

      <section
        className="mx-auto"
        style={{ maxWidth: 1200, padding: "80px 32px 60px", textAlign: "center" }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
            marginBottom: 18,
          }}
        >
          University CRM &middot; Student Engagement Portal
        </div>
        <h1 style={{ fontSize: 56, lineHeight: 1.05, margin: "0 auto 22px", maxWidth: 900 }}>
          A single funnel, from enquiry to enrolment —{" "}
          <em style={{ color: "var(--color-accent-700)" }}>and beyond</em>.
        </h1>
        <p
          className="text-muted mx-auto"
          style={{ fontSize: 18, lineHeight: 1.55, maxWidth: 720, margin: "0 auto 28px" }}
        >
          Purpose-built for Banasthali Vidyapith. Captures every prospective-student enquiry from every source,
          drives conversion through BUAT, counselling, verification and enrolment, and hands the confirmed
          student cleanly to the University&rsquo;s in-house ERP.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/login" className="btn btn-primary" style={{ gap: 6 }}>
            <Icon name="log-in" size={15} />
            Sign in to the CRM
          </Link>
          <a
            href="https://www.banasthali.org"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ gap: 6 }}
          >
            <Icon name="external-link" size={15} />
            Banasthali Vidyapith website
          </a>
        </div>

        <div className="grid grid-cols-4 gap-4 mx-auto" style={{ marginTop: 60, maxWidth: 720 }}>
          {STATS.map((s) => (
            <div key={s.label} className="card" style={{ gap: 4, alignItems: "center", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, color: "var(--color-accent-700)" }}>
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--color-muted)",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        className="mx-auto"
        style={{
          maxWidth: 1200,
          padding: "40px 32px 60px",
          borderTop: "1px solid var(--color-divider)",
        }}
      >
        <div className="mb-8" style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              marginBottom: 8,
            }}
          >
            What&rsquo;s inside
          </div>
          <h2 style={{ margin: 0 }}>Built around the Banasthali admission funnel.</h2>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card" style={{ padding: 20 }}>
              <div
                className="grid place-items-center rounded-full"
                style={{
                  width: 42,
                  height: 42,
                  border: "1px solid var(--color-accent)",
                  color: "var(--color-accent-700)",
                  background: "var(--color-accent-100)",
                  marginBottom: 14,
                }}
              >
                <Icon name={f.icon} size={20} />
              </div>
              <h4 style={{ margin: "0 0 6px", fontSize: 17 }}>{f.title}</h4>
              <div style={{ fontSize: 13, color: "var(--color-muted)", lineHeight: 1.55 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section
        className="mx-auto"
        style={{
          maxWidth: 900,
          padding: "40px 32px 60px",
          borderTop: "1px solid var(--color-divider)",
        }}
      >
        <div className="mb-6" style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              marginBottom: 8,
            }}
          >
            Try it now
          </div>
          <h2 style={{ margin: 0 }}>Sign in as any of the demo personas.</h2>
          <p className="text-muted" style={{ margin: "8px 0 0", fontSize: 14 }}>
            All accounts use the password{" "}
            <code
              style={{
                background: "var(--color-neutral-200)",
                padding: "1px 6px",
                borderRadius: 3,
                fontSize: 12,
              }}
            >
              banasthali123
            </code>
            . Each role sees a different sidebar and landing view.
          </p>
        </div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>Persona</th>
                <th>Email</th>
                <th style={{ paddingRight: 16 }}>Lands on</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ paddingLeft: 16 }}>Admissions Head</td>
                <td>meenakshi@banasthali.edu.in</td>
                <td style={{ paddingRight: 16 }}>Command Center</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 16 }}>Counsellor</td>
                <td>kavita@banasthali.edu.in</td>
                <td style={{ paddingRight: 16 }}>Counsellor Workbench</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 16 }}>Super Admin</td>
                <td>admin@banasthali.edu.in</td>
                <td style={{ paddingRight: 16 }}>Command Center</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 16 }}>Student</td>
                <td>aarohi@student.banasthali.edu.in</td>
                <td style={{ paddingRight: 16 }}>Student Portal</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 16 }}>Parent</td>
                <td>rajesh@parent.banasthali.edu.in</td>
                <td style={{ paddingRight: 16 }}>Parent Portal</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer
        className="mx-auto flex items-center justify-between"
        style={{
          maxWidth: 1200,
          padding: "22px 32px 40px",
          borderTop: "1px solid var(--color-divider)",
          fontSize: 12,
          color: "var(--color-muted)",
        }}
      >
        <div>© Banasthali Vidyapith · Built by Lookup IT Solutions</div>
        <div className="flex items-center gap-4">
          <a href="https://www.banasthali.org" target="_blank" rel="noopener noreferrer">
            banasthali.org
          </a>
          <span style={{ opacity: 0.5 }}>·</span>
          <Link href="/login">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
