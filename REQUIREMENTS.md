# Confirmed requirements — implementation backlog
English-only interface. Closed-test, nonredeemable credits with clear disclosure at registration and receipts.
Registration: name, mobile, email, country, DOB, password/confirmation, verified email OTP, unique wallet/QR after verification. Receive allowed during KYC pending; send only after KYC approval. KYC identity name replaces display name after approval. Document review with rejection reason/resubmit.
One active device; first/new device password+TOTP; same trusted device after logout password; sensitive changes fresh TOTP; recovery codes. Separate MPIN.
Dashboard balance/available/pending/total received, privacy eye, add/send/receive/scan, notifications, history.
QR preview recipient verified name/photo/masked wallet, confirm+MPIN, server-confirmed receipts only. Both parties notified on success, sender only on failure/return.
Append-only balanced ledger, serializable transfers, idempotency, limits, transfer pending reconciliation, similar recipient+amount pending block. Never blindly refund successful transfer; if confirmed failed release reservation within 2h; unresolved escalates investigation.
Add credits by admin request (preset/custom), user receive, single-use admin code, audited admin credit. Request R-Coin is notification only: accept prefills send form, never debits without confirm+MPIN.
History filters/search, PDF/image receipt and statement, block/report, dispute/support, account recovery.
Help/Feedback from registration/login/settings; ticket status, response and delegated support.
Main super admin alone may suspend/unsuspend, choose duration, reason+fresh TOTP+audit; delegated admins only recommend. Suspended user may log in to view balance/history/status/reason/appeal, cannot send or receive; never show reporter/admin ID. Super admin controls global/per-user transfer and request limits and approves limit-increase requests, with TOTP/audit.
Admin reviews KYC/credits/reports and delegated roles; security permissions enforced server-side. Light/Dark/System, user-editable public photo separate from private KYC photo. Professional responsive animation with reduced-motion support.
