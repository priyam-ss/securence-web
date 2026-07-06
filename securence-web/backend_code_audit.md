# SECURENCE — Backend Code Audit Report

**Date:** 28 May 2026  
**Scope:** Firebase Firestore, Email (Resend API), Cloudflare Pages Functions, Form Handlers  
**Verdict:** ⚠️ Functional but has **critical security & reliability issues** that must be fixed before production

---

## 📋 Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (Client-Side)"
        A["index.html / team.html"] -->|"Firebase SDK v10.12 (compat)"| B["Firestore DB"]
        C["support.html"] -->|"form-handler.js"| D["/api/support"]
        E["mission.html"] -->|"form-handler.js"| F["/api/mission"]
        G["team-join.html"] -->|"form-handler.js"| H["/api/team"]
    end

    subgraph "Backend (Cloudflare Pages Functions)"
        D -->|"Resend API"| I["EMAIL_1 (Owner)"]
        F -->|"Resend API"| I
        H -->|"Resend API"| J["EMAIL_2 (Team Lead)"]
    end

    subgraph "Onboarding Modal"
        K["onboarding-modal.js"] -->|"Direct Firestore write"| B
    end

    style B fill:#f59e0b,stroke:#d97706,color:#000
    style I fill:#10b981,stroke:#059669,color:#000
    style J fill:#10b981,stroke:#059669,color:#000
```

---

## 1. 🔥 Firebase / Firestore Code

### Files Involved
| File | Role |
|------|------|
| [index.html](file:///x:/securence-web/index.html#L1098-L1114) | Firebase SDK + config (lines 1098–1114) |
| [team.html](file:///x:/securence-web/team.html#L476-L492) | Firebase SDK + config (lines 476–492) |
| [onboarding-modal.js](file:///x:/securence-web/onboarding-modal.js#L383-L414) | Firestore write logic (lines 383–414) |

### How It Works
1. Firebase SDK v10.12.0 (compat mode) is loaded in `index.html` and `team.html`
2. `firebase.initializeApp({...})` initializes with hardcoded config
3. `var db = firebase.firestore()` exposes a global `db` variable
4. On onboarding modal completion, `onboarding-modal.js` writes to the `users` collection

### What Gets Stored in Firestore (`users` collection)
```javascript
{
    name: "...",
    email: "...",
    phone: "...",
    address: "...",
    profession: "...",
    termsAccepted: true,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    source: 'onboarding_modal'
}
```

### Issues Found

> [!CAUTION]
> **CRITICAL: API Key Exposed in Client-Side HTML**
> 
> Firebase API key `AIzaSyAjPi-bKW8vrlDlDhZiOgN5NDDe-QKG84I` is hardcoded in plain HTML.
> While Firebase API keys are designed to be public, the **real risk** is that your Firestore Security Rules
> may be wide open. If Firestore rules allow unrestricted reads/writes, anyone can:
> - Read ALL user data (names, emails, phones, addresses)
> - Write fake/spam data to your `users` collection
> - Delete existing records
> 
> **Action Required:** Verify your Firestore Security Rules in Firebase Console immediately.

> [!WARNING]
> **Firebase Only Loaded on 2 of 7 Pages With Onboarding Modal**
> 
> The onboarding modal (`onboarding-modal.js`) is loaded on **7 pages**, but Firebase SDK is only loaded on **2 pages** (`index.html` and `team.html`). On the other 5 pages, Firebase writes silently fail because `db` is undefined.

**Pages with onboarding modal but NO Firebase:**

| Page | Has `onboarding-modal.js` | Has Firebase SDK | Firestore Writes? |
|------|:-------------------------:|:----------------:|:-----------------:|
| `index.html` | ✅ | ✅ | ✅ Works |
| `team.html` | ✅ | ✅ | ✅ Works |
| `support.html` | ✅ | ❌ | ❌ **Silently fails** |
| `mission.html` | ✅ | ❌ | ❌ **Silently fails** |
| `team-join.html` | ✅ | ❌ | ❌ **Silently fails** |
| `inside.html` | ✅ | ❌ | ❌ **Silently fails** |
| `demo.html` | ✅ | ❌ | ❌ **Silently fails** |

> [!NOTE]
> The code handles this gracefully with `if (typeof db !== 'undefined')` — so it won't crash, but **user data from those 5 pages is lost forever**. Any user who first visits `support.html`, `mission.html`, etc. and completes onboarding will NOT be saved to Firestore.

> [!WARNING]
> **Config Duplicated — Maintenance Risk**
> 
> The Firebase config object is copy-pasted in both `index.html` (line 1102) and `team.html` (line 480). If you ever rotate keys or change the project, you must update both files manually. Consider centralizing this in a shared script file.

> [!WARNING]
> **Testing Mode Is Still Active**
> 
> In [onboarding-modal.js](file:///x:/securence-web/onboarding-modal.js#L62-L63), the `localStorage` persistence is commented out:
> ```javascript
> // if (localStorage.getItem('ob_done') === '1') return;  // Line 63
> // localStorage.setItem('ob_done', '1');                  // Line 378
> ```
> Currently using `sessionStorage` (resets on tab close). This means:
> - Users see the onboarding modal **every time** they close and reopen the tab
> - **Every re-submission creates a duplicate Firestore document**

---

## 2. 📧 Email Sending Code (Resend API via Cloudflare Functions)

### Files Involved
| File | Endpoint | Sends To | Triggered By |
|------|----------|----------|--------------|
| [support.js](file:///x:/securence-web/functions/api/support.js) | `POST /api/support` | `env.EMAIL_1` | `support.html` |
| [mission.js](file:///x:/securence-web/functions/api/mission.js) | `POST /api/mission` | `env.EMAIL_1` | `mission.html` |
| [team.js](file:///x:/securence-web/functions/api/team.js) | `POST /api/team` | `env.EMAIL_2` | `team-join.html` |

### How It Works
1. User fills out a form on the page
2. `form-handler.js` intercepts the submit, collects form data, and POSTs JSON to `/api/<endpoint>`
3. Cloudflare Pages Functions receive the request and forward it to Resend API (`https://api.resend.com/emails`)
4. Email is sent from `SECURENCE <onboarding@resend.dev>` to the configured recipient

### What's Good ✅

| Aspect | Status | Details |
|--------|--------|---------|
| CORS Handling | ✅ Good | Proper `OPTIONS` preflight handler on all 3 endpoints |
| Error Handling | ✅ Good | Try-catch blocks, JSON parse error handling, input validation |
| Environment Variables | ✅ Good | API keys stored in `env` (Cloudflare secrets), not in client code |
| Input Validation | ✅ Good | Required fields checked server-side (name, email, message) |
| Response Format | ✅ Good | Consistent `{ success: true/false, error: "..." }` JSON |
| Content-Type Check | ✅ Good | `form-handler.js` verifies response is JSON before parsing |

### Issues Found

> [!CAUTION]
> **CRITICAL: No Rate Limiting**
> 
> All 3 API endpoints have **zero rate limiting**. An attacker can:
> - Flood your Resend inbox with thousands of emails per minute
> - Burn through your Resend API quota (free tier: 100 emails/day)
> - Create a denial-of-service on your email pipeline
> 
> **Fix:** Add Cloudflare rate limiting rules or implement in-function throttling.

> [!WARNING]
> **No Email Validation on Server**
> 
> The `mission.js` and `team.js` endpoints check if email is non-empty, but **don't validate email format**. The `support.js` endpoint doesn't even collect an email field. Client-side validation exists in `form-handler.js`, but server-side should never trust client input.

> [!WARNING]
> **Sender Address is `onboarding@resend.dev` (Resend Test Domain)**
> 
> All 3 endpoints use `from: 'SECURENCE <onboarding@resend.dev>'`. This is a **Resend test/sandbox domain**. Emails sent from `@resend.dev`:
> - May be flagged as spam by recipients' email providers
> - Cannot be customized (no reply-to)
> - Have limited sending quotas
> 
> **Fix:** Verify your own domain in Resend and send from `noreply@securence.com` (or similar).

> [!NOTE]
> **No Confirmation Email to the User**
> 
> When someone submits a support message, mission signup, or team application — they get no email confirmation. Only the site owner receives the notification. Adding a user-facing confirmation email would improve trust and professionalism.

> [!NOTE]
> **Plain Text Emails Only**
> 
> All emails are sent as plain text (`text: emailBody`). Consider using `html:` for branded, professional-looking email notifications.

---

## 3. 📝 Form Handler (`form-handler.js`)

### File: [form-handler.js](file:///x:/securence-web/form-handler.js)
**Loaded on:** `support.html`, `mission.html`, `team-join.html`

### What's Good ✅
- Clean, well-structured code with IIFE pattern
- Reusable `submitForm()` function for all 3 forms
- Loading state management (disables button, shows "Sending...")
- Toast notification system (success/error) with animations
- Handles non-JSON server responses gracefully (line 150–152)
- Form reset on success

### Issues Found

> [!WARNING]
> **No Client-Side Email Format Validation**
> 
> `form-handler.js` only checks if `Object.keys(data).length === 0` (all fields empty). It doesn't validate email format, phone format, or any specific field constraints. The onboarding modal has email regex validation, but the form handler does not.

> [!NOTE]
> **No Duplicate Submission Prevention**
> 
> If a user double-clicks the submit button quickly, two requests may fire before the loading state kicks in. Consider disabling the button immediately on click or adding a debounce.

---

## 4. 🔐 Onboarding Form (`onboarding.js` — Standalone Page)

### File: [onboarding.js](file:///x:/securence-web/onboarding.js)
**Used by:** `onboarding.html` (standalone onboarding page, separate from the modal)

### Issues Found

> [!CAUTION]
> **No Backend Integration At All**
> 
> Unlike the modal version (`onboarding-modal.js`), the standalone `onboarding.js` has **NO Firebase write and NO API call**. The form processes entirely client-side — data is collected, validated, an animation plays... and then the data is **discarded**. Nothing is saved anywhere.

> [!WARNING]
> **Redirect Logic Commented Out**
> 
> The `localStorage.setItem('userFilled', 'true')` and `window.location.replace('index.html')` are both commented out (lines 134–140). The processing animation plays but leads nowhere in the current testing state.

---

## 5. Summary: All Issues at a Glance

### 🔴 Critical (Must Fix Before Production)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **Firestore Security Rules may be open** | Firebase Console | Anyone can read/write all user data |
| 2 | **No rate limiting on API endpoints** | `functions/api/*.js` | Email flood, quota burn, DoS |
| 3 | **Firebase missing on 5 of 7 onboarding pages** | `support.html`, `mission.html`, `team-join.html`, `inside.html`, `demo.html` | User data silently lost |
| 4 | **Standalone onboarding form saves nothing** | `onboarding.js` | All form data discarded |

### 🟡 Important (Should Fix)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 5 | Sender domain is `@resend.dev` (sandbox) | `functions/api/*.js` | Emails may land in spam |
| 6 | No server-side email format validation | `functions/api/mission.js`, `team.js` | Invalid data accepted |
| 7 | Testing mode active (sessionStorage) | `onboarding-modal.js` | Duplicate Firestore entries, no persistence |
| 8 | Firebase config duplicated | `index.html`, `team.html` | Maintenance risk |
| 9 | No duplicate submission prevention | `form-handler.js` | Double-click = double submit |

### 🔵 Nice to Have

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 10 | No confirmation email to user | `functions/api/*.js` | Reduced trust/professionalism |
| 11 | Plain text emails only | `functions/api/*.js` | No branding in notifications |
| 12 | No client-side email validation in form handler | `form-handler.js` | Relies entirely on server |

---

## 6. Recommended Fixes (Priority Order)

### Fix 1: Add Firebase to All Onboarding Pages
Add the Firebase SDK + config block to `support.html`, `mission.html`, `team-join.html`, `inside.html`, and `demo.html` — **before** the `onboarding-modal.js` script tag:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script>
    firebase.initializeApp({
        apiKey: "AIzaSyAjPi-bKW8vrlDlDhZiOgN5NDDe-QKG84I",
        authDomain: "nce-web.firebaseapp.com",
        projectId: "nce-web",
        storageBucket: "nce-web.firebasestorage.app",
        messagingSenderId: "935647667030",
        appId: "1:935647667030:web:d7a976a6793edcc368ecf7"
    });
    var db = firebase.firestore();
</script>

<!-- Onboarding Modal — Must load AFTER Firebase -->
<script src="onboarding-modal.js"></script>
```

### Fix 2: Lock Down Firestore Security Rules
In Firebase Console → Firestore → Rules, set:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow create: if true;    // Allow new submissions
      allow read, update, delete: if false;  // Block all other access
    }
    match /{document=**} {
      allow read, write: if false;  // Deny everything else
    }
  }
}
```

### Fix 3: Add Rate Limiting
Add a simple in-memory rate limiter to each Cloudflare function, or better yet, use Cloudflare's built-in Rate Limiting rules in the dashboard.

### Fix 4: Switch to Production Mode
Uncomment the `localStorage` lines in `onboarding-modal.js`:
```diff
-// if (localStorage.getItem('ob_done') === '1') return;
+if (localStorage.getItem('ob_done') === '1') return;

-// localStorage.setItem('ob_done', '1');
+localStorage.setItem('ob_done', '1');
```

### Fix 5: Verify Custom Domain in Resend
Replace `onboarding@resend.dev` with your own verified domain sender address across all 3 API files.

---

> [!IMPORTANT]
> **Bottom Line:** The code structure and logic are well-written and functional. The main risks are **missing Firebase on most pages** (data loss) and **no rate limiting** (abuse potential). The Resend email integration via Cloudflare Functions is clean and follows good patterns — just needs the sender domain and rate limiting hardened for production.
