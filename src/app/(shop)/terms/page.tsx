import Link from "next/link";
import { LegalPage, contactLine } from "@/components/shop/legal";

export const metadata = { title: "Terms and conditions" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and conditions"
      updated="5 November 2026"
      sections={[
        ["Who we are", <p key="1">JonWin Clean is a family business in Kenya that makes and sells liquid soap, bleach, antiseptic and disinfectant. These terms apply when you buy from this website.</p>],
        [
          "Your account",
          <>
            <p>You need an account to order, made with your phone number and a password. Keep your password to yourself; you are responsible for orders placed with it.</p>
            <p>We may suspend an account that is used for fraud, abuse of our staff or riders, or repeated orders that are not paid for.</p>
          </>,
        ],
        [
          "Prices and payment",
          <>
            <p>Prices are in Kenya shillings and include any taxes we must charge. The delivery fee for your area is shown before you place the order.</p>
            <p>An order paid by M-Pesa is confirmed once we have checked the payment. Cash on delivery is offered only to regular customers we have marked as trusted, and we may withdraw it.</p>
            <p>If a price on the site is clearly wrong, we will tell you before delivery and you may cancel for a full refund.</p>
          </>,
        ],
        [
          "Orders",
          <p key="1">
            We may cancel an order we cannot fulfil, for example if a product is out of stock or we cannot reach your area. Anything you paid is refunded. See our{" "}
            <Link href="/delivery" className="jw-link">
              delivery and refund policy
            </Link>
            .
          </p>,
        ],
        [
          "Using the products safely",
          <p key="1">
            Read the label. Keep containers closed and away from children and food. Never mix bleach with other cleaners or acids. We are not responsible for harm caused by
            using a product against its label.
          </p>,
        ],
        ["Ratings", <p key="1">When you order again we may ask you to rate the products from your last delivery. Ratings are used to improve our products and are not published with your name.</p>],
        ["Contact", <p key="1">Questions about these terms: {contactLine()}.</p>],
      ]}
    />
  );
}
