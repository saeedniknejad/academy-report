# Keeping Academy Report Off Amazon — Where to Store Everything

Your requirement is simple: **no Amazon account anywhere in this project.** The
standard free stack below meets that completely. This doc tells you exactly
**where each piece lives** and **which account to use**. Pair it with
`SETUP-GUIDE.md`, which has the click-by-click steps — this doc is the "which
account / which computer" layer on top.

---

## The golden rule

> Use a **personal computer** and **personal accounts** (your own email, not an
> @amazon.com address) for every step. If a signup ever offers "continue with
> Amazon/AWS" or a work SSO, **don't** — always pick personal email, personal
> GitHub, or personal Google.

That one rule keeps the whole project off any Amazon account of yours.

---

## Where each part of the project lives

Your project has four "homes." None of them is Amazon:

| Part | What it is | Store it on | Account to use |
|---|---|---|---|
| **The code folder** | The `academy-report` files | Your **personal computer** (Desktop/Documents) | none — it's your machine |
| **Code backup / deploy source** | A copy of the code online | **GitHub** | personal GitHub |
| **The live website + AI function** | The running app | **Vercel** (free Hobby) | personal (sign in with GitHub) |
| **The database + logins** | Stored assessments, coach login | **Supabase** (free) | personal email or GitHub |

None of these require an Amazon account, an AWS account, or an Amazon login.
(Supabase and Vercel are independent companies with their own free tiers — you
just sign up and use them like any other website.)

---

## Step 0 — Get the code onto YOUR computer

1. Make sure you're on your **personal laptop/desktop**, not a work machine.
2. Download **`academy-report.zip`** and save it to your personal **Desktop**.
3. Unzip it there. That folder is now the master copy on your own machine.

> ✅ At this point the whole project already lives 100% on your personal
> computer, with no Amazon connection. Everything below is about publishing it.

---

## Step 1 — Accounts to create (all personal, ~10 minutes)

Create these with your **personal email**:

1. **GitHub** — https://github.com → Sign up with personal email.
   *(Stores your code online and feeds Vercel.)*
2. **Vercel** — https://vercel.com → Sign up **with GitHub** (the account above).
   *(Runs your live website + the AI function. Free Hobby plan.)*
3. **Supabase** — https://supabase.com → Sign up with personal email or GitHub.
   *(Your database + coach login. Free plan.)*
4. **Google account** for the AI key — https://aistudio.google.com/app/apikey.
   *(A personal Gmail is fine. Free Gemini key.)*

None of these involve Amazon.

---

## Step 2 — Follow the main guide

Now open **`SETUP-GUIDE.md`** and follow Parts 1–6. Everything there uses the
personal accounts you just made. Reminders to stay Amazon-free:

- **Part 1 (installing tools):** Node.js and VS Code are free, independent tools.
  Install them on your personal computer.
- **Part 6a (GitHub Desktop):** sign in with your **personal GitHub**. Choose
  **"Keep this code private"** if you'd rather it not be public — private repos
  are free.
- **Part 6b (Vercel):** sign in with your personal GitHub. The app deploys to a
  `*.vercel.app` address — not an Amazon domain.

Whenever any site offers a sign-in choice, pick your personal account — never a
work/Amazon SSO.

---

## Where your data physically sits (plain answer)

- **The code:** on your personal computer, plus a private copy in your personal
  GitHub.
- **The assessments/logins:** in your Supabase project — a database you own and
  can export or delete anytime.
- **The live app:** served by Vercel.

You hold the keys to all three and can delete any of them whenever you want.

---

## A note on THIS environment (important)

You first built and previewed this app inside an Amazon development space. That
was just a temporary workspace. **The zip file is fully self-contained** — once
you unzip it on your personal computer and run `npm install`, it has no link back
to that environment. Nothing you do from your personal computer touches Amazon.

Once you've confirmed the app runs on your own machine, you can safely delete the
copy from the Amazon workspace — you won't need it.

---

## Later: using your own web address (optional)

If you buy a personal domain (e.g. `myacademy.com`) from a registrar like
Namecheap or Cloudflare, you can point it at your Vercel site in
**Vercel → Project → Settings → Domains**. Still no Amazon involved.

---

## Quick checklist

- [ ] Working on a personal computer
- [ ] GitHub, Vercel, Supabase, Google accounts all created with personal email
- [ ] Never chose "continue with Amazon/AWS" or a work SSO
- [ ] Code folder saved on your personal machine
- [ ] (Optional) Deleted the copy from the Amazon workspace once it runs locally
