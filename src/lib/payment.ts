// Mock payment provider (Stripe-shaped API). Replace with real Stripe later.
// Platform fee 5% per requirements.md §9.
export const PLATFORM_FEE_RATE = 0.05;

export function platformFee(amount: number) {
  return Math.floor(amount * PLATFORM_FEE_RATE);
}
export function ownerNet(amount: number) {
  return amount - platformFee(amount);
}

