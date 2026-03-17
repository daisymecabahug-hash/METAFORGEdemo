# METAFORGEdemo

A static prompt-engineering practice platform built with vanilla HTML/CSS/JS and optional Firebase authentication + persistence.

## ▶️ Local development

1. **Install Python** (for local server) and ensure `python` is on your PATH.
2. Run this from the repo root:

```powershell
python -m http.server 8080
```

3. Open:

```
http://localhost:8080
```

---

## 🔐 Firebase setup (login + saved progress)

1. Create a Firebase project: https://console.firebase.google.com
2. Enable **Authentication → Email/Password**.
3. Create a Firestore database (test mode is fine for dev).
4. Copy the example config:

```bash
cp firebase.config.example.js firebase.config.js
```

5. Fill `firebase.config.js` with your Firebase settings (from Project Settings → General → Your apps → SDK config).

6. (Optional but strongly recommended) Secure your data with Firestore rules:

   - This repo includes `firestore.rules`, which only allows a logged-in user to read/write their own `/users/{uid}` document.
   - To apply these rules to your project, use the Firebase CLI (requires `firebase init firestore`):

     ```bash
     firebase deploy --only firestore:rules
     ```

---

## 🚀 Deploy on Render (free static hosting + custom domain)

1. Create an account at https://render.com
2. Create a new **Static Site**.
3. Connect your GitHub account and select this repository.
4. Configure:
   - **Name:** (your choice)
   - **Branch:** `main`
   - **Root Directory:** `.`
   - **Build Command:** *leave empty*
   - **Publish Directory:** `.`
5. Click **Create Web Service**.

### Custom domain (optional)

1. In Render, open your site → **Settings → Custom Domains**.
2. Add your domain (e.g., `example.com`).
3. Follow the DNS instructions Render gives you (CNAME / A records).

---

## ✅ Notes

- The project uses `firebase.config.js` for local secrets (this file is gitignored).
- If you want a production-safe setup with environment variables, I can add a small build script that generates `firebase.config.js` during deploy.
