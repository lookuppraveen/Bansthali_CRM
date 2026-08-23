"use client";

import { icons, type LucideProps } from "lucide-react";

// Map kebab-case Lucide names to PascalCase.
function toPascal(name: string) {
  return name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

interface IconProps extends Omit<LucideProps, "ref"> {
  name: string;
}

export function Icon({ name, size = 16, strokeWidth = 1.6, ...rest }: IconProps) {
  const key = toPascal(name) as keyof typeof icons;
  const Component = icons[key] ?? icons.Circle;
  return <Component size={size} strokeWidth={strokeWidth} {...rest} />;
}
