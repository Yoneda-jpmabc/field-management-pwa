import type { ReactNode } from "react";
import { Card } from "./Card";

export function StatCard({
  label,
  value,
  unit,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  tone?: "default" | "warning";
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground-secondary">
          {label}
        </span>
        {icon && (
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              tone === "warning" ? "bg-warning-bg text-warning" : "bg-accent/10 text-accent"
            }`}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-foreground-tertiary">
            {unit}
          </span>
        )}
      </div>
    </Card>
  );
}
