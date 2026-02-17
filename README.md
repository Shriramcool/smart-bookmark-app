# 🔖 Smart Bookmark App

A real-time bookmark management web application where users can securely save, view, and delete bookmarks with instant synchronization across multiple tabs.

---

## 🚀 Live Demo

👉 https://smart-bookmark-app-mu-one.vercel.app/

---

## 📂 GitHub Repository

👉 https://github.com/Shriramcool/smart-bookmark-app

---

## 🛠️ Tech Stack

* **Frontend:** Next.js (App Router)
* **Backend / Database:** Supabase (PostgreSQL + Auth)
* **Realtime Updates:** Supabase Realtime Subscriptions
* **Authentication:** Google OAuth via Supabase
* **Deployment:** Vercel

---

## ✨ Features

✅ Google Authentication
✅ Add / Delete Bookmarks
✅ Secure User-Based Data (Row-Level Security)
✅ Realtime Sync Across Tabs
✅ No Page Refresh Required
✅ Fully Deployed Production App

---

## 📁 Project Structure

```
smart-bookmark-app/
│
├── app/                # Next.js App Router pages
│   ├── page.js         # Login page
│   └── dashboard/      # Main bookmark dashboard
│
├── lib/
│   └── supabase.js     # Supabase client configuration
│
├── public/             # Static assets
│
├── package.json        # Dependencies
└── next.config.mjs     # Next.js configuration
```

---

## ⚙️ Local Setup Instructions

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Shriramcool/smart-bookmark-app.git
cd smart-bookmark-app
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Create `.env.local`

Add your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 4️⃣ Run Locally

```bash
npm run dev
```

App runs at:

```
http://localhost:3000
```

---

## 🧠 Problems Faced & How I Solved Them

### ❌ Problem 1: OAuth Session Lost After Redirect

**Issue:** After Google login, user session was not available on dashboard refresh.

**Solution:**
Used:

```js
supabase.auth.getSession()
```

inside `useEffect` to restore session before rendering UI.

---

### ❌ Problem 2: Realtime Updates Were Delayed (1–2 Seconds)

**Issue:** Bookmark added in one tab took time to appear in another tab.

**Root Cause:**
Realtime listener was refetching from database instead of updating UI instantly.

**Solution:**
Used **optimistic UI update**:

```js
.insert(...).select()
setBookmarks(prev => [data[0], ...prev])
```

This removed dependency on refetch and made updates instant.

---

### ❌ Problem 3: Duplicate Realtime Fetch Calls

**Issue:** Multiple subscriptions triggered unnecessary reloads.

**Solution:**
Scoped realtime listener with:

```js
filter: `user_id=eq.${user.id}`
```

and cleaned up using:

```js
supabase.removeChannel(channel)
```

---

### ❌ Problem 4: Data Security Between Users

**Issue:** Needed to ensure users only see their own bookmarks.

**Solution:**
Implemented **Supabase Row Level Security (RLS)**:

```sql
user_id = auth.uid()
```

This enforces per-user data isolation at the database level.

---

## 📈 What I Learned

* Implementing realtime systems without WebSockets manually
* Handling OAuth session persistence in Next.js
* Writing secure multi-user database policies (RLS)
* Avoiding unnecessary re-renders in realtime apps
* Production deployment using Vercel + Supabase

---

⭐ If you like this project, feel free to star the repo!
