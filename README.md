# 🪼 Jelly — AI-Powered Personal Operating System & Assistant

<p align="center">
  <img src="life-assist/public/jelly-logo.png" width="160" alt="Jelly Logo" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(6, 182, 212, 0.4);" />
</p>

> A modern, local-first personal productivity operating system featuring intelligent task management, habit tracking, goal planning, calendar integration, Pomodoro focus mode, and a proactive Jelly AI assistant powered by Gemini.

---

## 🌟 Highlights and Features

- ⚡ **Local-First Architecture**: Powered by IndexedDB via Dexie for fast, offline-capable storage without arbitrary ceiling limits.
- 🤖 **Jarvis AI Assistant**: Conversational AI assistant supporting tool execution (creating tasks, reminders, calendar events, habits, and analyzing progress).
- 🔒 **Secure Firebase Backend**: Serverless cloud function (`functions/`) option to keep your Gemini API keys safe off the client browser using Firebase App Check token verification.
- 🎯 ***Habit Tracker & Goals***: Weekly habit check-ins, streak tracking, multi-milestone goal progress bars, and automatic week/month rescheduling.
- 📅 **Integrated Calendar & Timelines**: Full month grid view and hourly timeline view merging task deadlines, academic study slots, and calendar events.
- ⏱️ **Focus Mode (Pomodoro)**: Customizable focus & break timers with session metrics and completion tracking.
- 🏆 **Gamified Progress & XP System**: Earn XP and level up as you complete tasks, habits, focus sessions, and goal milestones.
- 🔔 **Proactive Notifications**: Rule-based suggestion engine surfacing priority task reminders and quiet-hours aware browser notifications.
- 📱 **Progressive Web App (PWA)**: Offline-first service worker registration, custom web app manifest, and mobile touch navigation.

---

## 🛠️ Tech Stack

- **Frontend Core**: React 18, Vite, TypeScript, React Router DOM
- **State & Persistence**: Zustand, Dexie (IndexedDB), LocalStorage migration bridge
- **Styling & UI**: Tailwind CSS, Framer Motion, Lucide React icons, TipTap Rich Text Editor
- **Backend & Cloud**: Firebase Functions (v2 HTTPS), Firebase Auth, Cloud Firestore, Firebase App Check
- **AI Integration**: Google Gemini API (`gemini-2.5-flash`), custom tool-calling loop framework
- **Testing & Quality**: Vitest, TypeScript Compiler (`tsc`), ESLint

---

## 🚀 Quick Start

### 1. Installation

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/kodurupakasaimanideep/Jelly-.git
cd life-assist

# Install dependencies
npm install
```

### 2. Development Mode

Launch the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Commands & Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server |
| `npm run build` | Builds production bundle for web application |
| `npm run typecheck` | Runs TypeScript compiler verification (`tsc -b`) |
| `npm run test` | Runs unit test suite with Vitest |
| `npm run preview` | Previews production build locally |

---

## 📂 Project Structure

```
├── package.json               # Root workspace script launcher
├── README.md                  # Project documentation
├── .gitignore                 # Workspace git exclusion rules
└── life-assist/               # Main Application Source
    ├── index.html             # Application entry HTML
    ├── package.json           # Frontend dependencies & scripts
    ├── vite.config.ts         # Vite configuration
    ├── functions/             # Firebase Cloud Functions backend
    │   ├── package.json       # Backend function dependencies
    │   └── src/index.ts       # Secure Gemini API endpoint
    └── src/
        ├── components/        # Shared UI components & layout shell
        ├── lib/               # Storage layer, AI clients, time & ID helpers
        ├── modules/           # Feature modules (Tasks, Goals, Calendar, Habits, Assistant...)
        ├── store/             # Zustand state management stores
        └── types/             # TypeScript domain definitions
```

---

## 🔒 Firebase Backend Setup (Optional)

If you prefer to run the secure server-side AI proxy instead of entering a client-side API key in Settings:

1. Navigate to `life-assist/functions` and install dependencies:
   ```bash
   cd life-assist/functions
   npm install
   ```
2. Build and deploy cloud functions to Firebase:
   ```bash
   npm run build
   firebase deploy --only functions
   ```
3. Set your backend API URL in `.env`:
   ```env
   VITE_ASSISTANT_API_URL=https://us-central1-YOUR_PROJECT.cloudfunctions.net/assistantChat
   ```

---

## 📤 Pushing to Git

Follow these steps to push your project to GitHub / Git host:

```bash
# Initialize git repository (if not already done)
git init

# Stage all files
git add .

# Commit changes
git commit -m "feat: complete lifeassist OS with backend, storage sync, and fixes"

# Add remote repository
git remote add origin https://github.com/kodurupakasaimanideep/Jelly-.git

# Push to main branch
git branch -M main
git push -u origin main
```

---

## 👤 Author

**Koduru Paka Sai Mani Deep**  
GitHub: [@kodurupakasaimanideep](https://github.com/kodurupakasaimanideep)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
