# Checkpoint 20 — manual credit request data foundation

Interpretation: The administrator may allocate **closed-test nonredeemable credits** after reviewing a user request. A request is not a payment, proof of a deposit, or authorization to issue credits. User-to-user transfers remain simulated-value transfers only. No cash in/out, conversion, redemption, or real-money balance.

## Added
- Prisma `CreditRequest` model: user, positive integer minor units (enforce in service), optional note, PENDING/APPROVED/REJECTED/CANCELLED status, reviewer, review note, optional unique ledger transaction reference, timestamps and indexes.
- User relation for requests. No public request/approval API or UI is claimed.

## Required before enabling
- Prisma migration review and apply on isolated PostgreSQL; validate schema and generate client.
- Authenticated user request route, strict amount validation and rate limits; no client-selected user ID.
- Separate admin role/permission and fresh TOTP on approval; atomic serializable, balanced issuance ledger posting with unique request linkage and idempotency; prohibit double approval.
- Audit trail, rejection/cancellation rules, notification and end-to-end tests. Admin must never simply mutate balance.
- Maintain prominent nonredeemable test-credit disclosure and no payment collection in this feature.
