import { LegalPage, contactLine } from "@/components/shop/legal";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="5 November 2026"
      sections={[
        [
          "Summary",
          <p key="1">
            We collect only what we need to deliver your bottles and keep our accounts, we never sell it, and you can ask to see or delete it. This policy follows the Kenya Data
            Protection Act, 2019. JonWin Clean is the data controller.
          </p>,
        ],
        [
          "What we collect",
          <ul key="1" className="list-disc space-y-2 pl-5">
            <li>Your name, phone number and, if you give it, your email.</li>
            <li>Your delivery area, directions and, if you drop one, a map pin.</li>
            <li>Your orders, payments, M-Pesa confirmation codes and ratings.</li>
            <li>A record of logins and changes to your account, kept for security.</li>
          </ul>,
        ],
        [
          "Why we use it",
          <p key="1">
            To take and deliver your orders, confirm payments, contact you about an order, keep the records the law requires of a business, and protect your account. Our lawful
            basis is the contract between us and our legal obligations.
          </p>,
        ],
        [
          "Who sees it",
          <p key="1">
            Our family staff and the rider delivering your order see what they need for that order. We use Vercel to host the site, Neon to store the database and, if you gave
            an email, Resend to send password reset emails. We do not sell or share your data for advertising.
          </p>,
        ],
        [
          "How long we keep it",
          <p key="1">
            Order and payment records are kept for seven years, as tax law requires. Other details are deleted within 90 days after you ask us to close your account.
          </p>,
        ],
        [
          "Your rights",
          <p key="1">
            You can ask to see the data we hold about you, correct it, object to its use, or have it deleted where the law allows. To do so, {contactLine()}. You may also
            complain to the Office of the Data Protection Commissioner (odpc.go.ke).
          </p>,
        ],
        ["Cookies", <p key="1">We use one cookie to keep you logged in. Your cart is stored on your own phone. There are no tracking or advertising cookies.</p>],
      ]}
    />
  );
}
