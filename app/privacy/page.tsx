import { LegalPage } from "@/components/legal/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      eyebrow="Data protection and wallet privacy"
      sections={[
        {
          title: "Wallet-first privacy",
          body: "Velora AI is designed around connected wallet sessions. Public wallet addresses, transaction hashes, network names, and user-approved activity records may be used to provide portfolio, payment, automation, and activity features."
        },
        {
          title: "No private key custody",
          body: "Velora AI does not ask normal users to submit wallet private keys. Wallet actions should be approved through the connected wallet or approved server-side infrastructure configured by the platform owner."
        },
        {
          title: "Data minimization",
          body: "Velora AI should only store the records needed to operate user-facing product features, such as payment approvals, transaction status, and Velora-specific activity history."
        }
      ]}
    />
  );
}
