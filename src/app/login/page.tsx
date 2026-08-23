import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { from?: string; error?: string };
}) {
  return (
    <div className="min-h-screen grid place-items-center" style={{ background: "#1c1512" }}>
      <div
        className="w-full max-w-[420px] mx-4"
        style={{
          background: "#f6f4ef",
          border: "1px solid rgba(0,0,0,.15)",
          borderRadius: 6,
          padding: 32,
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 flex-none grid place-items-center rounded-full"
            style={{
              background: "#7b1e28",
              border: "1px solid #9a3341",
              color: "#f3ede3",
              fontFamily: "var(--font-heading)",
              fontSize: 22,
              letterSpacing: "-.02em",
            }}
          >
            बा
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, lineHeight: 1.05 }}>
              Banasthali
            </div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--color-muted)",
              }}
            >
              Vidyapith CRM · Sign in
            </div>
          </div>
        </div>

        <LoginForm from={searchParams?.from} error={searchParams?.error} />

        <div
          className="mt-6 pt-4"
          style={{ borderTop: "1px solid var(--color-divider)", fontSize: 12, color: "var(--color-muted)", lineHeight: 1.7 }}
        >
          <div style={{ marginBottom: 6, color: "var(--color-text)" }}>
            Demo accounts (all use password{" "}
            <code
              style={{
                background: "#eae7e7",
                padding: "1px 6px",
                borderRadius: 3,
                fontSize: 11,
              }}
            >
              banasthali123
            </code>
            ):
          </div>
          <div>· meenakshi@banasthali.edu.in — Admissions Head</div>
          <div>· kavita@banasthali.edu.in — Counsellor</div>
          <div>· admin@banasthali.edu.in — Super Admin</div>
          <div>· aarohi@student.banasthali.edu.in — Student</div>
          <div>· rajesh@parent.banasthali.edu.in — Parent</div>
        </div>
      </div>
    </div>
  );
}
