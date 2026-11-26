# Security Specification & Red Team Audit

## 1. Data Invariants
1. Public website visitors can read fest settings (`settings/main`), `programs`, `candidates`, `teams`, `results`, `gallery`, `updates`, and `downloads`.
2. Only verified admins (bootstrapped admin email `webz3321@gmail.com` with `email_verified == true`, or UIDs explicitly listed in `/admins/{uid}`) may create, update, or delete any collection or document.
3. No unauthenticated user or non-admin user can write, modify, or delete any document, nor read `/admins`.
4. All document IDs must match `^[a-zA-Z0-9_-]+$` and be <= 128 chars.
5. Every string field enforces strict `.size()` bounds; every document enforces `keys().hasAll(...)` and `keys().hasOnly(...)` to block shadow fields; `createdAt`/`updatedAt` timestamps must equal `request.time`.

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated write to `/results/r1`
2. Non-admin authenticated user writing to `/results/r1`
3. Unverified email spoofing admin email (`email_verified == false`) writing to `/settings/main`
4. Shadow field injection (`isAdmin: true`, `extraField: 1`) in `/programs/p1`
5. Self-escalation: non-admin creating `/admins/{uid}`
6. Oversized string DoS (>150 chars) in `/programs/p1.title`
7. Invalid hex colour (`colour: "red"`) in `/teams/t1`
8. Negative or non-number `points` (`points: "100"` or `points: -5`) in `/results/r1`
9. Client-forged `createdAt` timestamp not equal to `request.time`
10. ID poisoning (`programId` containing spaces or >128 chars)
11. Deleting `/results/r1` as a non-admin
12. Reading `/admins` list as an unauthenticated or non-admin user
