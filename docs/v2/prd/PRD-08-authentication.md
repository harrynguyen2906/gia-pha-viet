# PRD-08: Heritage Cloud — Authentication (Sign In & Register)

> **Version:** 2.0  
> **Module:** User Authentication  
> **Status:** Draft  
> **Created:** 2026-03-03  
> **Dependencies:** PRD-00 (Design System), PRD-07 (Landing Page), PRD-09 (Multi-tenant Isolation)  
> **Design Reference:** `v1/ui/0.1.login.html`, `v1/ui/0.2.register.html`  
> **Tech:** NextAuth.js v5 (Auth.js), Prisma, bcrypt

---

## 1. Overview & Purpose

### 1.1 Problem Statement
V1 has basic NextAuth credentials authentication but lacks:
- A proper public registration flow for new users to create accounts and clans
- Email verification
- Password recovery
- Clear UX separation between creating a new clan vs. joining an existing one
- OAuth social login options

### 1.2 Solution
A complete authentication system with:
- **Register page** — New users create an account and simultaneously create their clan (tenant)
- **Sign In page** — Existing users authenticate via email/password or OAuth
- **Password reset** — Email-based recovery flow
- Both pages maintain the imperial scroll design language from the HTML mockups (v1/ui)

### 1.3 Scope for V2
| In Scope | Out of Scope |
|----------|-------------|
| Email + password registration | OAuth providers (Google, Facebook) — V3 |
| Email + password sign in | Two-factor authentication (2FA) — V3 |
| Password reset flow | Admin user management panel |
| Clan creation during registration | Join existing clan by invite — V3 |
| Session management (JWT) | Session revocation across devices |
| Basic rate limiting on auth endpoints | Advanced brute-force protection |

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| AUTH-01 | New visitor | Register with email and password | I can create my family's account |
| AUTH-02 | New visitor | Name my clan during registration | My clan is created when I sign up |
| AUTH-03 | New visitor | See clear password requirements | I create a secure password the first time |
| AUTH-04 | Registered user | Sign in with my email and password | I can access my family tree |
| AUTH-05 | Registered user | Stay signed in (remember me) | I don't have to log in every visit |
| AUTH-06 | Forgetful user | Request a password reset email | I can regain access to my account |
| AUTH-07 | Any user | See loading state during auth | I know the system is processing my request |
| AUTH-08 | Any user | See clear error messages | I know what went wrong (wrong password, email taken, etc.) |

---

## 3. Registration Flow

### 3.1 Registration Page (`/auth/register`)

**Layout:** Imperial scroll design — same split-screen layout as login mockup:
- **Left panel (desktop):** Full-height background image of ancestral hall with Heritage Cloud branding
- **Right panel:** Registration form inside imperial scroll component

**Form Fields:**

| # | Field | Type | Validation | Required |
|---|-------|------|-----------|----------|
| 1 | Tên hiển thị (Display Name) | Text | 2–100 chars | ✓ |
| 2 | Email | Email | Valid email format, unique in DB | ✓ |
| 3 | Mật khẩu (Password) | Password | Min 8 chars, 1 uppercase, 1 number | ✓ |
| 4 | Xác nhận mật khẩu (Confirm Password) | Password | Must match password | ✓ |
| 5 | Tên dòng tộc (Clan Name) | Text | 2–200 chars | ✓ |

**Password Requirements (shown below password field):**
- Tối thiểu 8 ký tự (Minimum 8 characters)
- Ít nhất 1 chữ hoa (At least 1 uppercase letter)
- Ít nhất 1 chữ số (At least 1 number)
- Real-time validation checkmarks as user types

**Form Behavior:**
1. Client-side validation with `react-hook-form` + `zod`
2. Submit → Loading spinner on button
3. Success → Auto sign-in → Redirect to `/dashboard`
4. Error → Inline error message below relevant field

**What Happens on Registration (Server):**
1. Validate all fields server-side (Zod)
2. Check email uniqueness
3. Hash password with `bcrypt` (cost factor 12)
4. Create `User` record with role `HEAD_OF_HOUSE`
5. Create `UserProfile` record with display name
6. Create `Clan` record with clan name
7. Link user to clan (`user.clan_id = clan.id`)
8. Auto create session (NextAuth `signIn("credentials")`)
9. Return success → redirect to dashboard

### 3.2 Registration API

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "displayName": "Nguyễn Văn A",
  "email": "nguyen@example.com",
  "password": "SecurePassword1",
  "clanName": "Dòng Họ Nguyễn"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "nguyen@example.com",
    "role": "HEAD_OF_HOUSE",
    "clanId": "uuid"
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | Field-specific validation errors |
| 409 | `EMAIL_EXISTS` | "Email đã được sử dụng" (Email already registered) |
| 429 | `RATE_LIMITED` | "Quá nhiều yêu cầu, vui lòng thử lại sau" (Too many requests) |
| 500 | `INTERNAL_ERROR` | "Lỗi hệ thống, vui lòng thử lại" |

---

## 4. Sign In Flow

### 4.1 Sign In Page (`/auth/signin`)

**Layout:** Same imperial scroll split-screen layout as registration

**Form Fields:**

| # | Field | Type | Validation | Required |
|---|-------|------|-----------|----------|
| 1 | Email / Ancestral ID | Text/Email | Non-empty | ✓ |
| 2 | Mật khẩu (Password) | Password | Non-empty | ✓ |
| 3 | Ghi nhớ (Remember Me) | Checkbox | — | ✗ |

**Form Behavior:**
1. Submit → Loading state
2. Success → Redirect to `/dashboard` (or original requested URL)
3. Error → Generic message: "Email hoặc mật khẩu không đúng" (incorrect email or password) — do NOT reveal which field is wrong
4. After 5 failed attempts → show CAPTCHA or temporary lockout (rate limiting)

**Additional Links on Sign In Page:**
- "Quên mật khẩu?" (Forgot Password?) → `/auth/forgot-password`
- "Chưa có tài khoản? Đăng ký" (No account? Register) → `/auth/register`

### 4.2 Sign In via NextAuth

Use NextAuth.js v5 credentials provider:

```typescript
// Authorization flow:
// 1. Receive email + password
// 2. Find user by email (case-insensitive)
// 3. Compare password hash with bcrypt
// 4. If valid → return user object for JWT
// 5. If invalid → throw AuthError
```

**Session Strategy:** JWT (stateless, no server-side session store)

**JWT Token Contents:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "HEAD_OF_HOUSE",
  "clanId": "clan-uuid",
  "name": "Display Name"
}
```

---

## 5. Password Reset Flow

### 5.1 Forgot Password Page (`/auth/forgot-password`)

**Form:** Single email field + submit button

**Behavior:**
1. User enters email → Submit
2. **Always** show success message: "Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu" — never reveal if email exists
3. Server: If email exists, generate reset token (UUID, expires in 1 hour), store in `password_reset_tokens` table
4. Send email with reset link: `/auth/reset-password?token=<token>`

### 5.2 Reset Password Page (`/auth/reset-password?token=xxx`)

**Form Fields:**
| # | Field | Type | Validation |
|---|-------|------|-----------|
| 1 | Mật khẩu mới (New Password) | Password | Same rules as registration |
| 2 | Xác nhận mật khẩu (Confirm Password) | Password | Must match |

**Behavior:**
1. On page load: validate token exists and is not expired
2. If invalid/expired: show error with link to request again
3. On submit: Update password hash, delete token, redirect to sign-in with success message

---

## 6. Design Specifications

### 6.1 Page Layout (Both Sign In & Register)

```
┌──────────────────────────────────────────────────┐
│ ┌─────────────────────┐ ┌──────────────────────┐ │
│ │                     │ │  ┌─ Scroll Roller ─┐  │ │
│ │   Background Image  │ │  │                 │  │ │
│ │   with overlay       │ │  │  IMPERIAL DECREE│  │ │
│ │                     │ │  │  ──────────────  │  │ │
│ │                     │ │  │  [Form Fields]   │  │ │
│ │                     │ │  │  [Submit Button]  │  │ │
│ │                     │ │  │                 │  │ │
│ │   HERITAGE CLOUD    │ │  └─ Scroll Roller ─┘  │ │
│ │   logo + tagline    │ │                        │ │
│ └─────────────────────┘ └──────────────────────┘ │
│        7/12 width              5/12 width         │
└──────────────────────────────────────────────────┘
```

**Mobile:** Full-screen scroll form (no split), background image becomes subtle overlay

### 6.2 Components Used
| Component | Source | Usage |
|-----------|--------|-------|
| Imperial Scroll | `.imperial-scroll` CSS (PRD-00) | Form container |
| Scroll Roller | `.scroll-roller` CSS | Top/bottom of scroll |
| Lacquer Pillars | `.lacquer-pillar` CSS | Decorative side columns |
| Gold Shimmer Button | `.btn-gold-shimmer` | Submit buttons |
| Input fields | Custom underline style | Form inputs (bottom-border only) |

### 6.3 Color & Typography
From PRD-00:
- Form background: `parchment-base` (scroll) on `lacquer-dark` (panel)
- Form text: `temple-stone` / `lacquer`  
- Input borders: `lacquer/20` → `primary` on focus
- Button: `primary` (#8a0000) bg, white text, gold border
- Error messages: `red-600` text below field
- Success messages: `green-600` text

---

## 7. Security Requirements

### 7.1 Password Security
- **Hashing:** bcrypt with cost factor 12 (already in v1)
- **Min requirements:** 8 chars, 1 uppercase, 1 number
- **No max length** (bcrypt handles it, but cap at 128 chars to prevent DoS)
- **Never log or return** passwords in any response

### 7.2 Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/register` | 5 requests | per IP per 15 minutes |
| `POST /api/auth/signin` (NextAuth) | 10 requests | per IP per 15 minutes |
| `POST /api/auth/forgot-password` | 3 requests | per IP per 15 minutes |

### 7.3 Session Security
- JWT tokens expire in 24 hours (default)
- "Remember Me" extends to 30 days
- HttpOnly, Secure, SameSite=Lax cookies
- CSRF protection via NextAuth built-in

### 7.4 Input Sanitization
- All inputs trimmed and validated server-side
- Email normalized (lowercase, trim)
- XSS prevention: React's default escaping + no `dangerouslySetInnerHTML`
- SQL injection prevention: Prisma parameterized queries (built-in)

---

## 8. Error Handling UX

### 8.1 Sign In Errors
| Scenario | User-Facing Message |
|----------|-------------------|
| Wrong email or password | "Email hoặc mật khẩu không đúng" |
| Account deactivated | "Tài khoản đã bị vô hiệu hóa. Liên hệ hỗ trợ." |
| Too many attempts | "Quá nhiều lần thử. Vui lòng đợi 15 phút." |
| Server error | "Lỗi hệ thống. Vui lòng thử lại sau." |

### 8.2 Registration Errors
| Scenario | User-Facing Message |
|----------|-------------------|
| Email already registered | "Email này đã được đăng ký" |
| Password too weak | Inline checklist (real-time) |
| Passwords don't match | "Mật khẩu xác nhận không khớp" |
| Clan name empty | "Vui lòng nhập tên dòng tộc" |

### 8.3 Error Display Pattern
- Field-level errors: red text below the specific field
- Form-level errors: red banner at top of form with icon
- Errors clear when user starts typing in the errored field

---

## 9. Routes Summary

| Page | Route | Auth Status |
|------|-------|-------------|
| Sign In | `/auth/signin` | Public (redirect to dashboard if already signed in) |
| Register | `/auth/register` | Public (redirect to dashboard if already signed in) |
| Forgot Password | `/auth/forgot-password` | Public |
| Reset Password | `/auth/reset-password` | Public (token required) |
| Sign Out action | `POST /api/auth/signout` | Authenticated |

### 9.1 Redirect Logic
- Authenticated user visits `/auth/signin` or `/auth/register` → redirect to `/dashboard`
- Unauthenticated user visits protected route → redirect to `/auth/signin?callbackUrl=<original>`
- After sign in → redirect to `callbackUrl` param, or `/dashboard` by default

---

## 10. Database Changes for Auth V2

### 10.1 New Table: `password_reset_tokens`

```sql
CREATE TABLE password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
```

### 10.2 User Table Modifications
No structural changes needed — v1 `users` table already has all required fields:
- `email`, `password_hash`, `role`, `clan_id`, `is_active`, `last_login_at`

---

## 11. Out of Scope for V2

- ❌ OAuth providers (Google, Facebook, Apple)
- ❌ Two-factor authentication (2FA / TOTP)
- ❌ Email verification after registration
- ❌ Invite system (join existing clan by invite link)
- ❌ Account deletion / GDPR self-service
- ❌ Admin panel for user management
