import { deletePersonalTemplateAction } from "@/app/(app)/studio/template-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CATEGORY_LABELS,
  type ChallengeTemplate,
  type TemplateScheduleItem,
} from "@/lib/creator/challenge-templates";
import type { PersonalChallengeTemplate } from "@/lib/creator/personal-templates";
import Link from "next/link";

function dayGroups(schedule: TemplateScheduleItem[]) {
  const groups: Array<{ label: string; items: TemplateScheduleItem[] }> = [];
  for (const item of schedule) {
    const label = item.weekTheme || "Daily plan";
    const current = groups[groups.length - 1];
    if (!current || current.label !== label) {
      groups.push({ label, items: [item] });
    } else {
      current.items.push(item);
    }
  }
  return groups;
}

function TemplatePreview({
  template,
  useHref,
}: {
  template: ChallengeTemplate;
  useHref: string;
}) {
  const tasks = template.schedule.filter((item) => !item.isRest).length;
  return (
    <Card className="space-y-3 border-primary/30">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-primary">
            {CATEGORY_LABELS[template.category]} · {template.durationDays} days
          </p>
          <h2 className="mt-1 text-lg font-semibold">{template.title}</h2>
        </div>
        <Link href="/studio/challenges/templates" className="text-sm font-medium text-primary">
          Close preview
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">{template.shortDescription}</p>
      <p className="text-sm">{template.participantSummary}</p>
      <p className="text-sm text-muted-foreground">{template.goalDescription}</p>
      <p className="text-xs text-muted-foreground">
        {tasks} active day{tasks === 1 ? "" : "s"}
        {template.schedule.length - tasks > 0
          ? ` · ${template.schedule.length - tasks} rest day${template.schedule.length - tasks === 1 ? "" : "s"}`
          : ""}
        . Using this template copies the plan into a new draft.
      </p>
      <div className="max-h-[min(420px,55vh)] space-y-3 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3">
        {dayGroups(template.schedule).map((group) => (
          <section key={group.label}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </h3>
            <ul className="mt-1 space-y-1 text-sm">
              {group.items.map((item) => (
                <li key={item.dayLabel}>
                  <span className="font-medium">{item.dayLabel}:</span>{" "}
                  {item.isRest ? "Rest" : item.title}
                  {item.body ? <span className="text-muted-foreground"> · {item.body}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <Link
        href={useHref}
        className="flex min-h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
      >
        Use this template
      </Link>
    </Card>
  );
}

function TemplateCard({
  template,
  previewHref,
  useHref,
  personalId,
}: {
  template: ChallengeTemplate;
  previewHref: string;
  useHref: string;
  personalId?: string;
}) {
  return (
    <Card className="flex h-full flex-col gap-3">
      <div>
        <p className="text-xs font-medium text-primary">
          {CATEGORY_LABELS[template.category]} · {template.durationDays} days
        </p>
        <h2 className="mt-1 font-semibold">{template.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{template.shortDescription}</p>
      </div>
      <p className="text-sm">{template.participantSummary}</p>
      <div className="mt-auto flex flex-col gap-2 sm:flex-row">
        <Link
          href={previewHref}
          className="flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-border bg-surface px-4 text-sm font-semibold"
        >
          Preview
        </Link>
        <Link
          href={useHref}
          className="flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Use template
        </Link>
      </div>
      {personalId ? (
        <form action={deletePersonalTemplateAction}>
          <input type="hidden" name="template_id" value={personalId} />
          <Button type="submit" variant="ghost" fullWidth className="text-muted-foreground">
            Delete template
          </Button>
        </form>
      ) : null}
    </Card>
  );
}

export function ChallengeTemplateLibrary({
  official,
  personal,
  migrationRequired,
  preview,
  notice,
  error,
}: {
  official: ChallengeTemplate[];
  personal: PersonalChallengeTemplate[];
  migrationRequired: boolean;
  preview: { template: ChallengeTemplate; useHref: string } | null;
  notice: string | null;
  error: string | null;
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Templates are starting points. Preview the full plan, then edit the name, dates, tasks,
        and milestones in the challenge builder.
      </p>
      {notice === "deleted" ? (
        <p className="text-sm text-primary" role="status">
          Template deleted. Existing challenges were not changed.
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error === "migration"
            ? "Run migration 043_creator_challenge_templates.sql in Supabase to save personal templates."
            : error === "missing_template"
              ? "That personal template could not be found."
              : "Could not update that template."}
        </p>
      ) : null}
      {preview ? <TemplatePreview template={preview.template} useHref={preview.useHref} /> : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Tavro templates</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {official.map((template) => (
            <TemplateCard
              key={template.key}
              template={template}
              previewHref={`/studio/challenges/templates?preview=${template.key}`}
              useHref={`/studio/challenges/new?template=${template.key}`}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Your templates</h2>
        {migrationRequired ? (
          <Card>
            <p className="text-sm text-muted-foreground">
              Personal templates need{" "}
              <code className="text-xs">043_creator_challenge_templates.sql</code> in the Supabase
              SQL editor. The Tavro templates above still work.
            </p>
          </Card>
        ) : personal.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {personal.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                personalId={template.id}
                previewHref={`/studio/challenges/templates?previewPersonal=${template.id}`}
                useHref={`/studio/challenges/new?personal=${template.id}`}
              />
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">
              Save a challenge as a template from the review step, or from a challenge you already
              created. Each save is your own copy.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
