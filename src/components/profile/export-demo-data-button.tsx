"use client";

import { useDemoStore } from "@/lib/demo-store/demo-store";
import { Download } from "lucide-react";

export function ExportDemoDataButton() {
  const { exportDemoData } = useDemoStore();

  function handleExport() {
    const blob = new Blob([exportDemoData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "streakly-demo-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-foreground"
    >
      <Download className="h-4 w-4" aria-hidden />
      Export my demo data
    </button>
  );
}
