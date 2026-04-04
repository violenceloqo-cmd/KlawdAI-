<p align="center">
  <img src="public/klawd.jpg" alt="Klawd AI" width="120" height="120" style="border-radius: 20px;" />
</p>

<h1 align="center">Klawd AI</h1>

<p align="center">
  <strong>100% free, open-source, self-hosted Claude AI chat interface.</strong><br/>
  A pixel-perfect clone of claude.ai — every button, every feature, every setting — powered by your own Anthropic API key.<br/><br/>
  No subscription. No paywall. No limits. Just bring your API key and go.
</p>

<p align="center">
  <a href="#features">Features</a> &nbsp;&bull;&nbsp;
  <a href="#tech-stack">Tech Stack</a> &nbsp;&bull;&nbsp;
  <a href="#getting-started">Getting Started</a> &nbsp;&bull;&nbsp;
  <a href="#database-setup">Database Setup</a> &nbsp;&bull;&nbsp;
  <a href="#project-structure">Project Structure</a> &nbsp;&bull;&nbsp;
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Claude-API-D4A574?logo=anthropic" alt="Claude" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  <img src="https://img.shields.io/badge/price-FREE-brightgreen" alt="Free" />
</p>

---

> **Klawd is completely free.** No subscription fees, no usage limits, no premium tiers. You only pay Anthropic directly for the tokens you use — and you keep full control of your API key.

---

## Models

| Model | Description |
|-------|-------------|
| **Klawd ku 4.5** | Fastest and cheapest — great for quick tasks |
| **Klawd son 4.6** | Fast and smart — the balanced everyday model |
| **Klawd 4.6** | Most capable — for complex reasoning and code |

All three models support **extended thinking** with collapsible thinking blocks and duration timers.

---

## Features

### Chat
- **Three models** — Klawd ku 4.5, Klawd son 4.6, and Klawd 4.6
- **Real-time streaming** — Token-by-token responses with animated cursor
- **Extended thinking** — Collapsible thinking blocks with duration timer
- **Chat modes** — Ask, Plan, and Code modes for different workflows
- **Web search** — Toggle web search capability in conversations
- **Markdown rendering** — Full GFM support with syntax-highlighted code blocks

### Organization
- **Projects** — Group conversations with custom instructions and knowledge base documents
- **Conversation management** — Star, rename, delete, archive, and bulk actions
- **Share** — Generate public links to share conversations with anyone
- **Search** — Full-text search across all conversations

### Code IDE
- **Monaco Editor** — VS Code-powered code editor built into the app
- **File tree** — Navigate and manage project files
- **Live preview** — See changes in real-time
- **GitHub integration** — Push code directly to GitHub repositories
- **Download** — Export projects as ZIP files

### Customization
- **Skills system** — Extend Claude with custom tools and instructions
- **Themes** — Light, dark, and system-detected modes
- **Chat fonts** — Default, sans, system, and dyslexic-friendly options
- **Profile** — Display name and avatar customization

### Auth & Privacy
- **Username-based auth** — No email required, just pick a username and password
- **Google OAuth** — Optional Google sign-in
- **Row-level security** — All data protected with Supabase RLS policies
- **Session management** — View and revoke active sessions
- **Data export** — Export all your data at any time
- **Account deletion** — Full account and data removal

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **UI** | [React 19](https://react.dev/) + [Tailwind CSS v4](https://tailwindcss.com/) |
| **AI** | [Anthropic SDK](https://docs.anthropic.com/) + [Vercel AI SDK](https://sdk.vercel.ai/) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage) |
| **State** | [Zustand](https://zustand-demo.pmnd.rs/) |
| **Editor** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Markdown** | [react-markdown](https://github.com/remarkjs/react-markdown) + [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Supabase](https://supabase.com/) project (free tier works)
- [Anthropic API key](https://console.anthropic.com/)

### 1. Clone the repository

```bash
git clone https://github.com/violenceloqo-cmd/KlawdAI-.git
cd KlawdAI-
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your keys:

```bash
cp .env.local.example .env.local
```

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Optional — GitHub integration
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=
```

### 3. Set up the database

See the [Database Setup](#database-setup) section below.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account with a username and password, and start chatting.

---

## Database Setup

### Supabase Configuration

1. Create a free project at [supabase.com](https://supabase.com)
2. Navigate to **SQL Editor** and run the migration files in order:

```
src/supabase/migrations/
├── 001_initial_schema.sql          # Core tables, RLS policies, triggers
├── 002_update_handle_new_user_username.sql
├── 003_oauth_profile_display_name.sql
├── 004_settings_theme_font.sql
├── 005_user_sessions.sql
├── 006_project_code_files.sql
└── 007_github_connections.sql
```

3. Copy your **Project URL** and **Anon Key** from **Settings → API**

### Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (display name, avatar, theme, font) |
| `conversations` | Chat conversations (title, model, starred, shared) |
| `messages` | Individual messages (role, content, thinking, tokens) |
| `projects` | User projects (name, description, instructions) |
| `project_documents` | Uploaded knowledge base documents |
| `usage_logs` | Token usage and cost tracking |

All tables are protected with **Row-Level Security (RLS)** — users can only access their own data. Shared conversations are readable by anyone with the share link.

### Google OAuth (Optional)

1. Create an OAuth app in [Google Cloud Console](https://console.cloud.google.com/)
2. Add redirect URI: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
3. Paste Client ID and Secret in Supabase: **Authentication → Providers → Google**
4. Add your app URLs to **Authentication → URL Configuration → Redirect URLs**:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-domain.com/auth/callback` (production)

### GitHub Integration (Optional)

To enable pushing code from the IDE to GitHub:

1. Create a GitHub OAuth App at [github.com/settings/developers](https://github.com/settings/developers)
2. Set callback URL: `http://localhost:3000/api/auth/github/callback`
3. Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to `.env.local`

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── chat/                 #   Chat streaming & title generation
│   │   ├── conversations/        #   CRUD, bulk delete, feedback
│   │   ├── projects/             #   Projects, documents, code, GitHub push
│   │   ├── profile/              #   User profile
│   │   ├── account/              #   Export data, delete account
│   │   ├── share/                #   Public shared conversations
│   │   ├── sessions/             #   Session management
│   │   └── auth/                 #   OAuth callbacks
│   ├── (app)/                    # Protected app routes
│   │   ├── page.tsx              #   Main chat interface
│   │   ├── recents/              #   Conversation history
│   │   ├── projects/             #   Projects & IDE
│   │   ├── settings/             #   All settings pages
│   │   └── customize/            #   Skills management
│   ├── login/                    # Auth pages
│   ├── signup/
│   └── share/                    # Public share page
├── components/
│   ├── app/                      # AppShell, ThemeProvider
│   ├── chat/                     # Chat UI (messages, input, markdown)
│   ├── chat-header/              # Title, share dialog
│   ├── sidebar/                  # Navigation, conversation list
│   ├── ide/                      # Monaco editor, file tree, preview
│   ├── projects/                 # Project management
│   └── ui/                       # Reusable UI primitives
├── hooks/                        # Custom React hooks
├── lib/
│   ├── supabase/                 # Supabase client setup
│   ├── store.ts                  # Zustand global state
│   ├── models.ts                 # Claude model definitions
│   └── utils.ts                  # Shared utilities
└── supabase/
    └── migrations/               # SQL migration files
```

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/chat` | Stream chat completions |
| `POST` | `/api/chat/title` | Auto-generate conversation title |
| `GET` | `/api/conversations` | List all conversations |
| `GET` | `/api/conversations/[id]` | Get conversation with messages |
| `POST` | `/api/conversations/bulk-delete` | Bulk delete conversations |
| `PATCH` | `/api/conversations/message-feedback` | Thumbs up/down on messages |
| `GET/POST` | `/api/projects` | List or create projects |
| `GET/PATCH` | `/api/projects/[id]` | Get or update a project |
| `POST` | `/api/projects/[id]/documents` | Upload knowledge base document |
| `POST` | `/api/projects/[id]/github/push` | Push project code to GitHub |
| `GET/PATCH` | `/api/profile` | User profile management |
| `POST` | `/api/account/export` | Export all user data |
| `DELETE` | `/api/account` | Delete account |
| `GET` | `/api/share/[shareId]` | View shared conversation |

---

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Commit** your changes: `git commit -m 'Add my feature'`
4. **Push** to the branch: `git push origin feature/my-feature`
5. **Open** a Pull Request

Please make sure your code passes linting before submitting.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with Klawd AI
</p>
