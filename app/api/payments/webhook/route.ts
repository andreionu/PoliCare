// Canonical webhook handler lives at /api/webhooks/stripe
// This file exists only for backwards compatibility with older Stripe dashboard configs.
// All logic is in the canonical route — keep both URLs pointing to the same implementation.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export { POST } from "@/app/api/webhooks/stripe/route"
