import { AppShell } from "@/components/azu/app-shell";
import { Panel } from "@/components/azu/ui";

type Section = {
  title: string;
  body: string;
};

export function LegalPage({ title, eyebrow, sections }: { title: string; eyebrow: string; sections: Section[] }) {
  return (
    <AppShell title={title} eyebrow={eyebrow}>
      <div className="mx-auto max-w-4xl">
        <Panel title={title} eyebrow="Velora AI">
          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.title} className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
                <h2 className="text-lg font-bold text-white">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{section.body}</p>
              </section>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
