"use client";

import {
  AU_TIMEZONE_PICKER,
  COMMON_GLOBAL_TIMEZONES,
} from "@/lib/timezone/constants";
import { friendlyTimezoneLabel } from "@/lib/timezone/format";

export function TimezoneSelect({
  value,
  onChange,
  id,
  label = "Timezone",
}: {
  value: string;
  onChange: (iana: string) => void;
  id?: string;
  label?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        id={id}
        className="mt-0.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <optgroup label="Australia & nearby">
          {AU_TIMEZONE_PICKER.map((z) => (
            <option key={z.iana} value={z.iana}>
              {z.label} ({z.iana})
            </option>
          ))}
        </optgroup>
        <optgroup label="International">
          {COMMON_GLOBAL_TIMEZONES.filter(
            (z) => !AU_TIMEZONE_PICKER.some((a) => a.iana === z.iana),
          ).map((z) => (
            <option key={z.iana} value={z.iana}>
              {z.label} ({z.iana})
            </option>
          ))}
        </optgroup>
        {!AU_TIMEZONE_PICKER.some((z) => z.iana === value) &&
        !COMMON_GLOBAL_TIMEZONES.some((z) => z.iana === value) ? (
          <option value={value}>
            {friendlyTimezoneLabel(value)} ({value})
          </option>
        ) : null}
      </select>
    </label>
  );
}
