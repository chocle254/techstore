import { LegalPage, contactLine } from "@/components/shop/legal";

export const metadata = { title: "Delivery and refund policy" };

export default function DeliveryPage() {
  return (
    <LegalPage
      title="Delivery and refunds"
      updated="5 November 2026"
      sections={[
        [
          "Where and when",
          <p key="1">
            We deliver to the areas listed on our home page, each with its own fee, charged once per order. After your order is confirmed we pack it and a rider calls you
            before coming.
          </p>,
        ],
        [
          "Receiving your order",
          <p key="1">
            Please check the bottles when they arrive: the right products and sizes, sealed caps, no leaks. If you pay cash on delivery, pay the rider the amount shown on your
            order page.
          </p>,
        ],
        [
          "Something wrong?",
          <p key="1">
            If a bottle arrives leaking, damaged or wrong, tell us within 24 hours: {contactLine()}. We will replace it on the next delivery or refund it, whichever you prefer.
          </p>,
        ],
        [
          "Cancelling",
          <p key="1">
            You can cancel free of charge until the rider leaves with your order. After that we may keep the delivery fee. Cleaning products cannot be returned once opened,
            for safety.
          </p>,
        ],
        ["Refunds", <p key="1">Refunds go back by M-Pesa to the number on your order, usually within three working days. Every refund appears as its own line in your payment history.</p>],
      ]}
    />
  );
}
