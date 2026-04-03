# Heritage Cloud — V2 Roadmap (SaaS Foundation)

> **Version:** 2.0  
> **Status:** Planning  
> **Created:** 2026-03-03  
> **Previous Phase:** [V1 Archive](../v1/README.md)

---

## 1. V2 Vision

Transform Heritage Cloud from a **single-tenant deployment** into a **multi-tenant SaaS application** where multiple Vietnamese families can independently manage their genealogy data — securely isolated from each other.

### V2 Goals
- ✅ Public marketing landing page to attract users
- ✅ Self-service registration (create account + clan)
- ✅ Proper sign-in / password reset flows
- ✅ Multi-tenant data isolation (defense-in-depth)
- ❌ Payment/subscription (deferred to V3)
- ❌ OAuth social login (deferred to V3)

---

## 2. Phase Overview

```
Phase 5        Phase 6          Phase 7
Landing Page → Auth System →  Tenant Isolation
(1 sprint)     (1 sprint)      (1 sprint)
```

**Total Estimated Effort:** ~3 sprints (3 weeks)

---

## 3. Phase 5: Public Landing Page

**PRD:** [PRD-07-landing-page.md](prd/PRD-07-landing-page.md)  
**Implementation:** [IP-07-landing-page.md](implementation/IP-07-landing-page.md)

### Summary
| Task | Description |
|------|-------------|
| LP-001 | Route restructuring: `(marketing)` vs `(app)` groups |
| LP-002 | Marketing layout (header + footer) |
| LP-003 | Hero section with imperial scroll CTA |
| LP-004 | Features showcase (6-card grid) |
| LP-005 | How it works (3-step timeline) |
| LP-006 | Social proof & stats counters |
| LP-007 | CTA banner + page assembly |
| LP-008 | Auth-aware header logic |

### Exit Criteria
- [ ] `/` shows public landing page
- [ ] CTAs link to `/auth/register` and `/auth/signin`
- [ ] Lighthouse performance > 90
- [ ] Mobile responsive

---

## 4. Phase 6: Authentication System

**PRD:** [PRD-08-authentication.md](prd/PRD-08-authentication.md)  
**Implementation:** [IP-08-authentication.md](implementation/IP-08-authentication.md)  
**DB Changes:** [database-schema-v2.md §2](db-design/database-schema-v2.md)

### Summary
| Task | Description |
|------|-------------|
| AUTH-001 | DB migration: password_reset_tokens table |
| AUTH-002 | Zod validation schemas for auth |
| AUTH-003 | Registration API (creates user + clan + profile atomically) |
| AUTH-004 | Updated NextAuth configuration (JWT with clanId) |
| AUTH-005 | Auth page shared components (imperial scroll form) |
| AUTH-006 | Sign in page |
| AUTH-007 | Register page |
| AUTH-008 | Password reset pages + API |
| AUTH-009 | Route protection middleware |

### Exit Criteria
- [ ] New users can register (creates account + clan)
- [ ] Users can sign in with email/password
- [ ] Password reset flow works
- [ ] Protected routes redirect to `/auth/signin`
- [ ] JWT contains `role` and `clanId`

---

## 5. Phase 7: Multi-Tenant Data Isolation

**PRD:** [PRD-09-multi-tenant-isolation.md](prd/PRD-09-multi-tenant-isolation.md)  
**Implementation:** [IP-09-multi-tenant-isolation.md](implementation/IP-09-multi-tenant-isolation.md)  
**DB Changes:** [database-schema-v2.md §3-4](db-design/database-schema-v2.md)

### Summary
| Task | Description |
|------|-------------|
| MT-001 | Tenant helper library (`getTenantContext()`) |
| MT-002 | Refactor all API routes with tenant scoping |
| MT-003 | PostgreSQL RLS policies (14 tables) |
| MT-004 | Prisma RLS session variable injection |
| MT-005 | Clan auto-assignment on data creation |
| MT-006 | Cross-tenant prevention for relationships |
| MT-007 | Integration tests (10 isolation test cases) |

### Exit Criteria
- [ ] All API queries scoped to user's clan
- [ ] Cross-clan data access returns 404
- [ ] RLS policies active on all tenant tables
- [ ] 10/10 isolation test cases pass
- [ ] Zero cross-tenant data leaks

---

## 6. Document Index

| Type | Document | Covers |
|------|----------|--------|
| PRD | [PRD-07-landing-page.md](prd/PRD-07-landing-page.md) | Landing page specs |
| PRD | [PRD-08-authentication.md](prd/PRD-08-authentication.md) | Sign in, register, password reset |
| PRD | [PRD-09-multi-tenant-isolation.md](prd/PRD-09-multi-tenant-isolation.md) | Tenant isolation strategy |
| IP | [IP-07-landing-page.md](implementation/IP-07-landing-page.md) | Landing page tasks |
| IP | [IP-08-authentication.md](implementation/IP-08-authentication.md) | Auth implementation tasks |
| IP | [IP-09-multi-tenant-isolation.md](implementation/IP-09-multi-tenant-isolation.md) | Isolation tasks |
| DB | [database-schema-v2.md](db-design/database-schema-v2.md) | Schema changes + RLS |

---

## 7. What Comes After V2 (V3 Preview)

| Feature | Priority |
|---------|----------|
| Stripe/Lemonsqueezy payment integration | High |
| Freemium tier gating (feature limits) | High |
| OAuth login (Google, Facebook) | Medium |
| Clan invite system (add user to existing clan) | Medium |
| Email verification flow | Medium |
| Admin dashboard | Low |
| i18n (English translation) | Low |
