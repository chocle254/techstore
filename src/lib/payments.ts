import "server-only";

/**
 * How customers pay for online orders.
 *
 * Today: "manual M-Pesa". The customer pays to the business till or paybill on their phone,
 * types the M-Pesa confirmation code on their order page, and staff tick it off in Admin → Orders.
 *
 * To plug in an online gateway later, add another PaymentGateway below (for example one that
 * starts an STK push and confirms the order from a callback) and return it from getGateway().
 * Nothing else in the shop needs to change.
 */
export type PayInstructions =
  | { kind: "till"; till: string; businessName: string }
  | { kind: "paybill"; paybill: string; account: string; businessName: string }
  | { kind: "unset" };

export interface PaymentGateway {
  id: string;
  /** What the customer is told to do after placing an order. */
  instructions(orderNo: number): PayInstructions;
  /** True when the customer types the M-Pesa code themselves. */
  asksForCode: boolean;
}

const manualMpesa: PaymentGateway = {
  id: "mpesa-manual",
  asksForCode: true,
  instructions(orderNo) {
    const businessName = process.env.MPESA_BUSINESS_NAME || "JonWin Clean";
    if (process.env.MPESA_TILL) return { kind: "till", till: process.env.MPESA_TILL, businessName };
    if (process.env.MPESA_PAYBILL) {
      return {
        kind: "paybill",
        paybill: process.env.MPESA_PAYBILL,
        account: process.env.MPESA_ACCOUNT || `JW${orderNo}`,
        businessName,
      };
    }
    return { kind: "unset" };
  },
};

export function getGateway(): PaymentGateway {
  return manualMpesa;
}

/** M-Pesa confirmation codes are 10 letters and digits, e.g. SGL7XK2P9Q. */
export function normalizeMpesaCode(input: string): string | null {
  const code = input.trim().toUpperCase().replace(/\s+/g, "");
  return /^[A-Z0-9]{10}$/.test(code) ? code : null;
}
