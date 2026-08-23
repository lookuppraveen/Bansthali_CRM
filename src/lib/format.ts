export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function gradeOf(score: number): "A" | "B" | "C" {
  return score >= 80 ? "A" : score >= 60 ? "B" : "C";
}

export function gradeColor(score: number): string {
  if (score >= 80) return "var(--color-accent-700)";
  if (score >= 60) return "var(--color-accent-500)";
  return "var(--color-neutral-500)";
}

export function slaColor(sla: string): string {
  if (sla === "Breached") return "#b4442e";
  if (sla === "Due today") return "var(--color-accent-600)";
  return "var(--color-accent-700)";
}

export function stageTag(stage: string): "tag-accent" | "tag-accent-2" | "tag-neutral" {
  const strong = ["Counselling", "Verification", "Enrolled"];
  const mid = ["Application", "BUAT", "Merit List"];
  if (strong.includes(stage)) return "tag-accent";
  if (mid.includes(stage)) return "tag-accent-2";
  return "tag-neutral";
}
