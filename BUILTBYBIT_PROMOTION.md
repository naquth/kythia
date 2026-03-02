# 🌸 Kythia — Your Cutest & Most Powerful Discord Bot

> **Kythia Hye-Jin** is a feature-rich, fully self-hosted Discord bot built for server owners who want complete control without compromise. Modular. Blazing fast. Insanely customizable.

---

## ✨ Why Choose Kythia?

| Feature | Kythia | Generic Bots |
|---|---|---|
| **Self-Hosted** | ✅ You own your data | ❌ Shared infrastructure |
| **Addon System** | ✅ Enable only what you need | ❌ Bloated features you can't remove |
| **Full Source Code** | ✅ Modify anything | ❌ Black box |
| **Web Dashboard** | ✅ Built-in | ❌ Extra cost |
| **AI Integration** | ✅ Gemini 2.5 Flash | ❌ None or extra cost |
| **Music (Lavalink)** | ✅ Spotify, YouTube & more | ❌ Often removed/broken |
| **Economy System** | ✅ Deep, configurable | ❌ Basic or missing |
| **Sharding Support** | ✅ Auto-sharding built-in | ❌ Manual |

---

## 🎯 Feature Overview

### 🛡️ Moderation & Safety
A professional-grade moderation suite to keep your server clean and safe:
- **Ban, Kick, Mute, Timeout, Warn** — Full punishment arsenal with configurable durations
- **Automod** — Intelligent spam detection against: mass mentions, duplicate messages, all-caps, excessive emojis, zalgo text, and fast message floods
- **Automod Punishments** — Auto-mute, warn, or kick rule breakers automatically
- **Message Logging** — Track edits, deletions, member joins/leaves, role changes, and more
- **Sticky Messages** — Pin persistent messages that reappear after new messages

### 🎵 Music Player
A full-featured music experience powered by **Lavalink**:
- Play from **YouTube, Spotify, SoundCloud**, and more
- Queue management: skip, shuffle, loop, autoplay
- AI-powered **lyrics fetching** using Gemini
- Configurable per-server playlists and suggestions
- Beautiful embed interface with full music controls right in Discord
- **Multiple Lavalink nodes** supported for redundancy

### 🤖 AI Chat (Google Gemini 2.5 Flash)
Give your server an intelligent AI assistant:
- **Natural conversation** with message history context
- **Customizable AI personality** — friendly, professional, humorous, technical, or casual
- **Per-user personality preferences** via `/ai personality`
- Execute bot commands via natural language (e.g., *"what's the ping?"*)
- **Daily greeter** — scheduled AI-generated morning messages to your community
- Multiple Gemini API keys with automatic round-robin rotation for high-traffic servers

### 💰 Economy System
Keep members engaged with a virtual economy:
- **Daily rewards, work, beg, rob, hack** — with configurable cooldowns
- **Loot boxes** with randomized rewards
- **Gambling** — bet your way to the top (or bottom)
- Leaderboards to spark competition between members
- Full balance management: deposit, withdraw, transfer

### 🎮 Adventure Game
A full text-based RPG inside Discord:
- Fight monsters, level up, collect loot
- Explore dungeons and unlock adventures
- Persistent character progression per user

### 🎟️ Ticket System
Handle support like a pro:
- Create tickets with categories and custom forms
- Assign staff members to specific tickets
- Auto-close idle tickets
- Ticket transcripts on close

### 📊 Leveling & XP
Reward active members:
- Customizable XP gain per message
- Custom rank cards with background image support
- Level-up notification messages
- Role rewards at specific levels

### 🐾 Virtual Pets
A unique, engaging feature your members will love:
- Adopt and raise virtual pets
- Feed, train, and care for your companions
- Gacha system for obtaining rare pets
- Pet stats and progression

### 🔊 Temporary Voice Channels
Give your members control over their own voice spaces:
- Create personal temp voice channels automatically
- Rename, set user limits, toggle privacy
- Trust/untrust members, invite friends, kick intruders
- Transfer channel ownership
- Region selection and stage mode

### 🎉 Giveaway Manager
Run fair and engaging giveaways:
- Time-based automatic ending
- Winner selection and re-roll support
- Configurable check interval for precision timing

### 🗳️ Suggestion Board
Crowdsource ideas from your community:
- Members submit suggestions with `/suggestion`
- Vote-based system to surface the best ideas
- Status updates: approve, deny, implement

### 📋 Checklist System
Keep your team organized:
- Create interactive checklists in Discord channels
- Check off items collaboratively
- Perfect for event planning, onboarding, or task tracking

### 🎂 Birthday Tracker
Never miss a member's birthday:
- Members set their own birthdays
- Automated congratulation messages
- Birthday role assignment

### 💌 Auto-Reply & Auto-React
Automate your server's personality:
- Set trigger words/phrases to auto-reply with custom messages
- Auto-react to specific keywords or channels with chosen emojis
- Per-guild configuration

### 🎰 Reaction Roles
Give members control over their own roles:
- Set up role menus with reaction-based assignment
- Single or multi-role selection modes
- Fully customizable embed messages

### 📈 Invite Tracking
Know how your server grows:
- Track which invite link each new member used
- Leaderboard for top inviters
- Per-invite usage statistics

### 🌐 Server Templates & Tools
Useful utilities for server management:
- `/serverinfo` — Comprehensive server overview
- `/userinfo` — Detailed member profiles
- `/embed` builder — Create rich embed messages without coding
- `/hash` — Hash cracking and generation utilities
- Currency exchange rates via ExchangeRate API

### 🌍 i18n / Multilingual Support
Built for global communities:
- Full internationalization system with JSON translation files
- AI-powered auto-translation via `npx kythia lang:translate --target <lang>`
- Translation key linting to catch missing or unused strings

---

## ⚙️ Developer-Grade Architecture

Kythia isn't just a bot — it's a **professionally engineered platform**:

### 🧩 Modular Addon System
- Each feature lives in its own `addon/` folder — fully isolated
- Enable or disable any addon with a single config flag
- Disabled addons don't load at all, keeping memory usage minimal
- Add your own custom addons using the same structure

### 🔀 Sharding
- Auto-sharding out of the box via `sharding.js`
- Scales automatically as your bot grows to more servers

### 🗄️ Multi-Database Support
Kythia works with any major SQL database via **Sequelize ORM**:
- MySQL, PostgreSQL, MariaDB, MSSQL, SQLite, Oracle, and more
- Redis integration for high-performance caching
- Built-in migration system: `npx kythia migrate`

### 🛠️ Powerful CLI Tools
```bash
npx kythia migrate           # Run database migrations
npx kythia make:migration    # Scaffold new migration files
npx kythia make:model        # Scaffold new Sequelize models
npx kythia cache:clear       # Flush Redis cache
npx kythia lang:check        # Lint translation keys
npx kythia lang:translate    # AI auto-translate to any language
npx kythia gen:structure     # Generate a project structure tree
npx kythia version:up        # Sync version tags across all files
```

### 📊 Dashboard (Optional)
- Full web dashboard via the `api` addon
- Discord OAuth2 authentication
- Deployable on localhost, VPS (IP), or custom domain
- Separate open-source dashboard repository included

### 🔒 Error Monitoring & Logging
- **Sentry** integration for real-time error tracking
- **Discord Webhook** error logging for instant alerts
- Formatted console logging with custom filters and timestamp formats
- Structured log files in `logs/` directory

---

## 📦 What You Get

- ✅ Full source code (JavaScript / Node.js)
- ✅ 28+ feature addons, all included
- ✅ `example.env` with 100+ documented environment variables
- ✅ `example.kythia.config.js` — fully commented configuration file
- ✅ Complete CLI toolchain (`npx kythia ...`)
- ✅ Database migration system
- ✅ PM2 & sharding startup scripts
- ✅ Detailed `README.md` and `docs/` folder
- ✅ Active development with changelog (`changelog.md`)
- ✅ Support Discord server access

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp example.env .env
cp example.kythia.config.js kythia.config.js
# Edit both files with your values

# 3. Run migrations
npx kythia migrate

# 4. Start the bot
npm run shard

# 5. For 24/7 uptime (PM2)
npm run pm2:startup
```

---

## 📋 Requirements

| Requirement | Details |
|---|---|
| **Node.js** | v22 LTS (recommended) |
| **Database** | MySQL, PostgreSQL, MariaDB, SQLite, MSSQL, etc. |
| **Redis** | Strongly recommended (some features require it) |
| **Lavalink** | Required for music addon |
| **Discord Bot Token** | From [Discord Developer Portal](https://discord.com/developers/applications) |
| **Gemini API Key** | Free at [Google AI Studio](https://aistudio.google.com/apikey) (for AI features) |

---

## 📜 License & Terms

- Licensed under **CC BY-NC 4.0**
- A valid **license key** is required to run the bot
- License is tied to your HWID for security
- No redistribution or resale of the source code permitted
- Commercial use requires direct authorization from the author

---

## 💬 Support & Community

| Channel | Link |
|---|---|
| 🌐 Website | [kythia.me](https://kythia.me) |
| 💬 Discord | [dsc.gg/kythia](https://dsc.gg/kythia) |
| 📧 Email | kenndeclouv@gmail.com |
| 📝 Docs | [kythia.me/commands](https://kythia.me/commands) |

---

> *Kythia is actively maintained and regularly updated. Join the Discord for the latest updates, free Lavalink access, and community support.*
