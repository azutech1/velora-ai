import { LegalPage } from "@/components/legal/LegalPage";

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Disclaimer"
      eyebrow="Important product notices"
      sections={[
        {
          title: "No financial advice",
          body: "Velora AI provides software interfaces, automation preparation, wallet activity views, and payment workflow tooling. It does not provide financial, legal, tax, or investment advice."
        },
        {
          title: "Transaction risk",
          body: "Blockchain transactions may be irreversible. Users should verify wallet addresses, asset types, network selection, fees, and approval prompts before authorizing any action."
        },
        {
          title: "Alpha-stage integrations",
          body: "Some integrations may be marked as ready, optional, coming soon, or requiring setup. Those labels describe product availability and should not be interpreted as guarantees."
        }
      ]}
    />
  );
}
