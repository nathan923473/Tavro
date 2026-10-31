"use client";

import { WeighInForm } from "@/components/progress/weigh-in-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  readStoredWeightUnit,
  subscribeWeightUnit,
} from "@/lib/weight-units";
import type { WeightUnit } from "@/types";
import { useState, useSyncExternalStore } from "react";

export function LogWeighInCard() {
  const unit = useSyncExternalStore(
    subscribeWeightUnit,
    readStoredWeightUnit,
    (): WeightUnit => "lb",
  );
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <p className="text-sm text-muted-foreground">
        Private weekly weigh-ins stay on your account only.
      </p>
      {open ? (
        <WeighInForm
          unit={unit}
          submitLabel="Save weigh-in"
          onDone={() => setOpen(false)}
        />
      ) : (
        <Button className="mt-3" variant="primary" fullWidth onClick={() => setOpen(true)}>
          Log first weigh-in
        </Button>
      )}
    </Card>
  );
}
