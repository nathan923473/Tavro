"use client";

import { addWeighInAction } from "@/app/(app)/member/actions";
import { Button } from "@/components/ui/button";
import { convertWeight } from "@/lib/weight-units";
import type { WeightUnit } from "@/types";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

export function WeighInForm({
  unit,
  defaultValue,
  submitLabel,
  onDone,
}: {
  unit: WeightUnit;
  defaultValue?: number | null;
  submitLabel: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const inputId = useId();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(
    defaultValue != null && Number.isFinite(defaultValue) ? String(defaultValue) : "",
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  function save() {
    const n = Number.parseFloat(value);
    if (!Number.isFinite(n) || n <= 0) {
      setStatus("error");
      setMessage("Enter a weight greater than zero.");
      return;
    }
    const weightLb = unit === "kg" ? convertWeight(n, "kg", "lb") : n;
    setStatus("saving");
    setMessage(null);
    startTransition(async () => {
      try {
        await addWeighInAction(weightLb);
        setStatus("saved");
        setMessage(`Saved ${n.toFixed(1)} ${unit}. Only you can see this.`);
        router.refresh();
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Could not save.");
      }
    });
  }

  return (
    <form
      className="mt-3 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (status !== "saving") save();
      }}
    >
      <div>
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          Today’s weight ({unit})
        </label>
        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0.1"
          autoFocus
          value={value}
          disabled={status === "saving"}
          onChange={(event) => {
            setValue(event.target.value);
            if (status === "error" || status === "saved") setStatus("idle");
          }}
          className="focus-ring mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-3 text-base text-foreground"
          placeholder={unit === "kg" ? "70.0" : "154.0"}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" fullWidth disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : submitLabel}
        </Button>
        {onDone ? (
          <Button
            type="button"
            variant="outline"
            disabled={status === "saving"}
            onClick={onDone}
          >
            Cancel
          </Button>
        ) : null}
      </div>
      {message ? (
        <p
          className={
            status === "error"
              ? "text-sm text-destructive"
              : "text-sm text-muted-foreground"
          }
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Stored on your account only. Nothing is shared unless you choose to share a win.
        </p>
      )}
    </form>
  );
}
