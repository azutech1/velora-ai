import Link from "next/link";
import { AppShell } from "@/components/azu/app-shell";
import { Panel } from "@/components/azu/ui";

const sections = [
  {
    id: "api-reference",
    title: "API Reference",
    body: "Velora AI API surfaces are organized around wallet activity, agent payment approvals, payment execution, and transaction status. Public API documentation will expand as production integrations stabilize."
  },
  {
    id: "integration-guide",
    title: "Integration Guide",
    body: "Integration work should preserve Velora AI's approval-first model: prepare requests, show clear user review states, execute only after approval, and record lifecycle status with transaction hashes when available."
  },
  {
    id: "status",
    title: "Status Page",
    body: "Current product status: Testnet Alpha on Arc Testnet. Production status reporting for platform services, payments, and integrations is planned."
  },
  {
    id: "community",
    title: "Community",
    body: "Official community channels will be linked here as they become available. Follow Velora AI on X for public updates."
  },
  {
    id: "announcements",
    title: "Announcements",
    body: "Product announcements, release notes, and integration updates will be published here as Velora AI moves through alpha milestones."
  },
  {
    id: "support",
    title: "Support",
    body: "For now, use the Velora AI GitHub repository to review code, track issues, and report bugs."
  }
];

export default function DocsPage() {
  return (
    <AppShell title="Documentation" eyebrow="Developer resources and integration notes">
      <div className="mx-auto max-w-5xl space-y-5">
        <Panel
          title="Velora AI Documentation"
          eyebrow="Production resources"
          action={
            <a
              href="https://github.com/azutech1/velora-ai"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-2 text-sm font-bold text-cyan transition hover:border-mint/40 hover:text-mint"
            >
              GitHub
            </a>
          }
        >
          <p className="max-w-3xl text-sm leading-7 text-slate-400">
            Velora AI is an AI-native stablecoin operating system on Arc. These docs provide a stable home for product, developer, community, and support resources as integrations move from alpha to production.
          </p>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <section id={section.id} key={section.id} className="glass scroll-mt-24 rounded-lg p-5">
              <h2 className="text-lg font-bold text-white">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{section.body}</p>
              {section.id === "community" ? (
                <Link href="https://x.com/UseVeloraAI" className="mt-4 inline-flex text-sm font-semibold text-cyan transition hover:text-mint">
                  Follow Velora AI on X
                </Link>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
