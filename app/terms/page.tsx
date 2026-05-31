import { LegalPage } from "@/components/legal/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      eyebrow="Velora AI platform terms"
      sections={[
        {
          title: "Testnet alpha product",
          body: "Velora AI currently operates as a testnet alpha product for Arc-based stablecoin workflows, AI-assisted recommendations, agent payment approvals, and wallet activity tooling."
        },
        {
          title: "User approvals",
          body: "Transactions, swaps, bridges, automation actions, and agent payments are expected to require user approval before execution. Users are responsible for reviewing recipients, amounts, networks, and transaction details."
        },
        {
          title: "Service availability",
          body: "Features may change as Velora AI develops. External wallet, network, bridge, swap, payment, and infrastructure providers may affect availability and execution results."
        }
      ]}
    />
  );
}
