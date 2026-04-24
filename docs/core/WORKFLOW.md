# Kythia Core — Workflow Diagrams

> Comprehensive visual flow dari seluruh sistem Kythia Core v1.0.0-rc.3

---

## 1. System Architecture Overview

Gambaran besar: dari entry point sampai infrastructure.

```mermaid
graph TB
    subgraph ENTRY["📂 Entry Point"]
        IDX["index.js<br/>─────────────<br/>new Kythia({ client, config,<br/>redis, sequelize })<br/>kythia.start()"]
    end

    subgraph CORE["⚙️ Kythia Core Layer"]
        ORCH["Kythia Orchestrator<br/>(src/Kythia.ts)<br/>─────────────<br/>• DI Container host<br/>• Lifecycle sequencer<br/>• Manager coordinator"]

        subgraph MANAGERS["Managers"]
            AM["AddonManager<br/>─────────<br/>Discovery · Loading<br/>Priority · Dep Graph"]
            IM["InteractionManager<br/>─────────<br/>Command routing<br/>Button/Modal/Select<br/>Autocomplete<br/>Middleware exec"]
            EM["EventManager<br/>─────────<br/>Event registration<br/>Multi-handler dispatch"]
            MW["MiddlewareManager<br/>─────────<br/>Pipeline builder<br/>Middleware loading"]
            SM["ShutdownManager<br/>─────────<br/>SIGINT/SIGTERM<br/>Interval tracking<br/>Memory monitor"]
            TM["TranslatorManager<br/>─────────<br/>i18n locales<br/>Variable interpolation"]
            MM["MetricsManager<br/>─────────<br/>prom-client<br/>Command counters<br/>CPU/Memory"]
            OPT["KythiaOptimizer<br/>─────────<br/>License verification<br/>Telemetry<br/>Pulse heartbeat<br/>Anti-tamper"]
            SHARD["ShardingManager<br/>─────────<br/>Shard spawn<br/>Crash loop detection<br/>OOM kill detection"]
        end
    end

    subgraph DB["🗄️ Database Layer"]
        KM["KythiaModel<br/>─────────<br/>Hybrid caching<br/>afterSave/Destroy hooks<br/>Tag-based invalidation"]
        KMIG["KythiaMigrator<br/>─────────<br/>Batch tracking<br/>Addon migration scan<br/>Rollback support"]
        ML["ModelLoader<br/>─────────<br/>Auto-discovery<br/>autoBoot()<br/>Association linking"]
        SEQ_F["createSequelizeInstance<br/>─────────<br/>Factory function<br/>SQLite / MySQL / PG"]
        SDR["Seeder / SeederManager<br/>─────────<br/>Seed execution<br/>Addon-scoped seeds"]
    end

    subgraph INFRA["🏗️ Infrastructure"]
        REDIS["Redis<br/>(Primary Cache)"]
        LRU["LRU Map<br/>(Fallback Cache)"]
        SEQUELIZE["Sequelize ORM<br/>(Database)"]
        DJS["Discord.js Client<br/>(Gateway)"]
        SENTRY["Sentry<br/>(Error Tracking)"]
        WINSTON["Winston Logger<br/>(Structured Logs)"]
        WEBHOOK["Discord Webhook<br/>(warn/error logs)"]
    end

    subgraph CONTAINER["📦 KythiaContainer (DI)"]
        CTR["client · sequelize · logger · redis<br/>kythiaConfig · helpers · models · t()<br/>translator · metrics · optimizer<br/>addonManager · eventManager<br/>interactionManager · middlewareManager<br/>shutdownManager"]
    end

    IDX --> ORCH
    ORCH --> MANAGERS
    ORCH --> CONTAINER
    ORCH --> DJS
    ORCH --> WINSTON

    AM --> DB
    KM --> REDIS
    KM --> LRU
    KM --> SEQUELIZE
    KMIG --> SEQUELIZE
    ML --> SEQUELIZE
    SEQ_F --> SEQUELIZE

    OPT --> SENTRY
    WINSTON --> WEBHOOK

    style ENTRY fill:#1a1a2e,color:#e0e0ff
    style CORE fill:#16213e,color:#e0e0ff
    style DB fill:#0f3460,color:#e0e0ff
    style INFRA fill:#1b1b2f,color:#e0e0ff
    style CONTAINER fill:#162447,color:#e0e0ff
```

---

## 2. Boot Sequence (kythia.start())

Urutan inisialisasi yang ketat dari awal sampai bot online.

```mermaid
flowchart TD
    A(["▶ kythia.start()"]) --> B["Print ANSI Banner<br/>(figlet + cli-color)"]
    B --> C["Check Discord Client<br/>Intents & Partials"]
    C --> D{legalConfig set?<br/>acceptTOS + dataCollection}
    D -- ❌ No --> EXIT1(["process.exit(1)"])
    D -- ✅ Yes --> E["Init Sentry<br/>if sentry.dsn configured"]
    E --> F["checkRequiredConfig<br/>bot.token, bot.clientId,<br/>bot.clientSecret, db.*"]
    F --> G["performLicenseValidation<br/>KythiaOptimizer.optimize()"]
    G --> H{License Valid?}
    H -- ❌ Invalid --> EXIT2(["terminateUnauthorizedProcess()"])
    H -- ✅ Valid --> I["optimizer.startPulse()<br/>optimizer.startAutoOptimization()"]

    I --> J["Load Translator<br/>core/lang/ + appRoot/lang/"]
    J --> K["new AddonManager<br/>loadAddons() → CommandData"]
    K --> L{sequelize<br/>provided?}

    L -- ✅ Yes --> M["connectDatabaseWithRetry<br/>5 retries × 5s delay"]
    M --> N["KythiaMigrator<br/>run pending migrations"]
    N --> O["bootModels<br/>autoBoot all addon models"]
    O --> P["attachHooksToAllModels<br/>cache invalidation hooks"]
    P --> Q

    L -- ❌ No --> Q

    Q["new EventManager<br/>attach all event listeners"]
    Q --> R["new MiddlewareManager<br/>load middleware pipeline"]
    R --> S["new InteractionManager<br/>initialize interaction routing"]
    S --> T{--dev flag?}

    T -- ❌ No --> U["deployCommands<br/>global + mainGuild + devGuild"]
    T -- ✅ Yes --> V
    U --> V

    V["new ShutdownManager<br/>register SIGINT/SIGTERM"]
    V --> W["client.login()<br/>Discord Gateway"]
    W --> X["clientReady event<br/>execute clientReadyHooks<br/>startRuntimeValidation loop"]
    X --> Z(["🟢 Bot Running"])

    style EXIT1 fill:#c0392b,color:#fff
    style EXIT2 fill:#c0392b,color:#fff
    style Z fill:#27ae60,color:#fff
    style A fill:#2980b9,color:#fff
```

---

## 3. Addon Loading & Dependency Resolution

Dari scan folder sampai urutan load final.

```mermaid
flowchart TD
    START(["loadAddons() called"]) --> SCAN["Scan appRoot/addons/<br/>filter _ prefixed dirs"]
    SCAN --> PARSE["Parse each addon.json<br/>name, priority, dependencies, active"]
    PARSE --> CFGCHECK["Check kythia.config.js addons<br/>config takes precedence over addon.json"]
    CFGCHECK --> DEPVAL["validateDependencies()<br/>per addon"]
    DEPVAL --> DEPCHECK{Dep missing<br/>or disabled?}
    DEPCHECK -- ❌ Yes --> DISABLE["Add to disabled set<br/>log error"]
    DEPCHECK -- ✅ No --> TOPO

    DISABLE --> TOPO["topologicalSort<br/>(Kahn's algorithm + priority tiebreak)"]

    TOPO --> ORDER["Sorted load order ready"]
    ORDER --> FOREACH["For each addon in order..."]

    FOREACH --> ACT{addon.json<br/>active = true?}
    ACT -- ❌ No --> SKIP["Skip addon"]
    ACT -- ✅ Yes --> REG["Run register.js<br/>(if exists)"]

    REG --> CMD["Load commands/<br/>single + split folder structure"]
    CMD --> EVT["Load events/"]
    EVT --> BTN["Load buttons/"]
    BTN --> MOD["Load modals/"]
    MOD --> SEL["Load select_menus/"]
    SEL --> TSK["Load tasks/<br/>cron string or ms interval"]
    TSK --> LANG["Load lang/<br/>merge into TranslatorManager"]
    LANG --> MDLS["Scan database/models/"]

    MDLS --> DONE["return commandDataForDeployment"]
    SKIP --> DONE

    style START fill:#2980b9,color:#fff
    style DONE fill:#27ae60,color:#fff
    style DISABLE fill:#e74c3c,color:#fff
    style SKIP fill:#7f8c8d,color:#fff
```

### Kahn's Algorithm (Dependency Resolution Detail)

```mermaid
flowchart LR
    A["Build dependency graph<br/>all enabled addons"] --> B["Calculate in-degree<br/>per addon"]
    B --> C["Queue addons with<br/>in-degree = 0"]
    C --> D["Sort queue by priority<br/>lower = loads first"]
    D --> E["Process next addon"]
    E --> F["Decrement in-degree<br/>for all dependents"]
    F --> G{Any dependent<br/>now in-degree = 0?}
    G -- Yes --> H["Add to queue"] --> D
    G -- No --> I{Queue empty?}
    I -- No --> D
    I -- Yes --> J{result.length<br/>== addons.length?}
    J -- No --> K(["❌ Circular dependency<br/>detected — log error"])
    J -- Yes --> L(["✅ Sorted load order"])

    style K fill:#c0392b,color:#fff
    style L fill:#27ae60,color:#fff
```

---

## 4. Interaction Routing Pipeline

Dari Discord event masuk sampai command execute & metrics.

```mermaid
flowchart TD
    DISC["Discord: InteractionCreate"] --> TYPE{Identify<br/>Interaction Type}

    TYPE --> CMD["ChatInputCommand<br/>(Slash Command)"]
    TYPE --> CTX["ContextMenuCommand<br/>(User / Message)"]
    TYPE --> BTN["ButtonInteraction"]
    TYPE --> MOD["ModalSubmit"]
    TYPE --> SEL["SelectMenu"]
    TYPE --> AUTO["Autocomplete"]

    CMD --> GET["client.commands.get(name)"]
    CTX --> GET

    GET --> MWP["Run Middleware Pipeline"]

    subgraph PIPELINE["Middleware Pipeline"]
        MW1["botPermissions check"] --> MW2["userPermissions check"]
        MW2 --> MW3["cooldown check (per user)"]
        MW3 --> MW4["ownerOnly check"]
        MW4 --> MW5["isInMainGuild check"]
    end

    MWP --> PIPELINE
    PIPELINE --> PASS{All pass?}
    PASS -- ❌ No --> ERR["Reply with error<br/>or silently skip"]
    PASS -- ✅ Yes --> INJECT["Inject container<br/>interaction.client.container"]
    INJECT --> EXEC["command.execute(interaction)"]
    EXEC --> METRIC1["kythia_commands_total + 1"]
    METRIC1 --> METRIC2["kythia_command_duration_seconds"]
    EXEC --> ERRHANDLE["Report error to optimizer<br/>if exception thrown"]

    BTN --> BTNLOOKUP["Find handler by<br/>customId prefix-match"]
    MOD --> BTNLOOKUP
    SEL --> BTNLOOKUP
    BTNLOOKUP --> HNDL["handler(interaction, container)"]

    AUTO --> ACLOOKUP["Find autocomplete handler<br/>by command name"]
    ACLOOKUP --> AEXEC["handler.autocomplete(interaction)"]

    style DISC fill:#5865F2,color:#fff
    style ERR fill:#e74c3c,color:#fff
    style METRIC1 fill:#8e44ad,color:#fff
    style METRIC2 fill:#8e44ad,color:#fff
```

---

## 5. Event Dispatch Flow

Dari gateway event ke semua addon handler yang relevan.

```mermaid
sequenceDiagram
    participant DJS as Discord.js Gateway
    participant EM as EventManager
    participant MAP as eventHandlers Map
    participant H1 as Handler 1 (Addon A)
    participant H2 as Handler 2 (Addon B)
    participant H3 as Handler 3 (Addon C)
    participant LOG as Logger

    Note over EM: initialize() — register all events on client

    DJS->>EM: emit('messageCreate', message)
    EM->>MAP: get handlers for 'messageCreate'
    MAP-->>EM: [H1, H2, H3]

    par Execute all handlers concurrently (Promise.all)
        EM->>H1: handler(message, container)
        EM->>H2: handler(message, container)
        EM->>H3: handler(message, container)
    end

    H1-->>EM: done
    H2-->>EM: error thrown
    H3-->>EM: return true (stopPropagation)

    EM->>LOG: log H2 error (no crash)

    Note over H3: return true stops subsequent handlers
```

---

## 6. Database & Caching Layer

Query flow dari kode addon ke database, lewat Redis/LRU cache.

```mermaid
flowchart LR
    CODE["Addon Code<br/>User.getCache(query)"] --> GEN

    subgraph KM["KythiaModel Cache Layer"]
        GEN["Generate cache key<br/>SHA256(query)"] --> CHECK
        CHECK{"Cache hit?"}
    end

    CHECK -- "🟢 HIT" --> REDIS["Redis<br/>(Primary Cache)"]
    CHECK -- "🔴 MISS (Redis down)" --> LRU["LRU Map<br/>(Fallback Cache)"]
    CHECK -- "🔴 MISS" --> DB["Sequelize Database<br/>(SQLite / MySQL / PG)"]

    DB --> STORE["Store result in cache<br/>Tag: 'ModelName'<br/>Tag: 'ModelName:ID:1'<br/>Tag: 'ModelName:query:hash'"]
    STORE --> REDIS

    REDIS --> RETURN["Return result"]
    LRU --> RETURN

    subgraph HOOKS["Cache Invalidation (afterSave/afterDestroy)"]
        HOOK["user.save() / user.destroy()"] --> INVAL["Invalidate by tag prefix<br/>'User*'"]
        INVAL --> CLEARREDIS["DEL from Redis"]
        INVAL --> CLEARLRU["DEL from LRU Map"]
    end

    style REDIS fill:#c0392b,color:#fff
    style LRU fill:#e67e22,color:#fff
    style DB fill:#2980b9,color:#fff
    style RETURN fill:#27ae60,color:#fff
```

### DB Query: Cache Miss Flow (Detail)

```mermaid
sequenceDiagram
    participant CODE as Addon Code
    participant KM as KythiaModel
    participant REDIS as Redis
    participant LRU as LRU Map
    participant DB as Database

    CODE->>KM: User.getCache({ where: { id: 1 } })
    KM->>KM: generateKey → SHA256 hash

    KM->>REDIS: GET cache:key
    REDIS-->>KM: null (MISS)

    KM->>DB: SELECT * FROM users WHERE id=1
    DB-->>KM: user row

    KM->>REDIS: SET cache:key → user (with TTL)
    KM->>REDIS: SADD tag "User", "User:ID:1"
    KM-->>CODE: return user

    Note over DB,REDIS: Later: user.save() → afterSave hook
    KM->>REDIS: DEL all keys tagged "User*"
    KM->>LRU: Delete all matching entries
```

---

## 7. KythiaOptimizer — License & Telemetry Flow

```mermaid
sequenceDiagram
    participant K as Kythia.start()
    participant OPT as KythiaOptimizer
    participant LS as License Server
    participant SENTRY as Sentry
    participant P as Process

    K->>OPT: optimize()
    OPT->>OPT: _sSpec() — collect HWID<br/>(CPU, RAM, hostname, platform)
    OPT->>LS: POST /license/verify<br/>{ key, clientId, hwid, config }

    alt ✅ License Valid (200)
        LS-->>OPT: 200 { valid: true } → OPTIMAL
        OPT-->>K: encrypted token (AES-256-CBC)
        K->>OPT: startPulse() — heartbeat every 10–20 min
        K->>OPT: startAutoOptimization() — flush telemetry every 5 min
        OPT->>SENTRY: report errors/crashes
    else ❌ License Invalid (401/403)
        LS-->>OPT: 401/403 → SUBOPTIMAL
        OPT-->>K: null token
        K->>P: _terminateUnauthorizedProcess()
    else 🔌 Network Error
        LS-->>OPT: NET_ERR
        Note over OPT: Allows up to 6 consecutive failures<br/>before terminating
    end
```

---

## 8. Shutdown Sequence

Dari signal OS sampai process.exit.

```mermaid
flowchart TD
    SIG(["⚡ SIGINT or SIGTERM"]) --> INIT["ShutdownManager.initialize()<br/>registers signal handlers"]
    INIT --> HOOKS["Execute all registered<br/>shutdownHooks in order"]
    HOOKS --> CLOSE_DB["Close DB connection<br/>(sequelize.close())"]
    CLOSE_DB --> FLUSH["Flush logs / telemetry<br/>(Winston + Optimizer)"]
    FLUSH --> CLEAR["Clear all tracked intervals<br/>(patched setInterval)"]
    CLEAR --> EXIT(["process.exit(0)"])

    subgraph MONITOR["Memory Monitor (every 5 min)"]
        MPOLL["Poll heapUsed vs heap_size_limit"]
        MPOLL --> M80{heapUsed > 80%?}
        M80 -- Yes --> MWARN["logger.warn() memory pressure"]
        M80 -- No --> M95{heapUsed > 95%?}
        M95 -- Yes --> MERR["logger.error() critical memory"]
    end

    style SIG fill:#e74c3c,color:#fff
    style EXIT fill:#27ae60,color:#fff
    style MWARN fill:#f39c12,color:#fff
    style MERR fill:#c0392b,color:#fff
```

---

## 9. Full Command Execution (End-to-End)

Dari user Discord input sampai response + metrics.

```mermaid
sequenceDiagram
    actor User
    participant DJS as Discord.js Gateway
    participant IM as InteractionManager
    participant MW as Middleware Pipeline
    participant CMD as Command execute()
    participant CM as KythiaModel (Cache)
    participant DB as Database
    participant MM as MetricsManager
    participant OPT as KythiaOptimizer

    User->>DJS: /profile
    DJS->>IM: InteractionCreate (ChatInputCommand)
    IM->>IM: client.commands.get('profile')

    IM->>MW: botPermissions check
    MW-->>IM: ✅ pass
    IM->>MW: userPermissions check
    MW-->>IM: ✅ pass
    IM->>MW: cooldown check
    MW-->>IM: ✅ pass (or ❌ block)

    IM->>CMD: execute(interaction)
    CMD->>CM: User.getCache({ where: { userId } })
    CM->>CM: generate cache key (SHA256)
    CM-->>CMD: cache HIT → return user

    CMD->>DJS: interaction.reply(embed)
    DJS-->>User: ✅ Response shown

    CMD->>MM: kythia_commands_total + 1 (success)
    CMD->>MM: kythia_command_duration_seconds observe

    Note over CMD,OPT: If error thrown during execute():
    CMD->>OPT: reportError(err) → queued telemetry
```

---

## 10. KythiaContainer — Dependency Injection Map

Semua yang ada di dalam container, beserta kapan tersedia.

```mermaid
graph LR
    subgraph CTOR["🔧 Available at Constructor"]
        C_CLIENT["client<br/>(IKythiaClient)"]
        C_LOGGER["logger<br/>(Winston)"]
        C_REDIS["redis<br/>(ioredis | undefined)"]
        C_SEQ["sequelize<br/>(Sequelize | undefined)"]
        C_CFG["kythiaConfig<br/>(KythiaConfig)"]
        C_HELP["helpers<br/>(discord + custom)"]
        C_APPROOT["appRoot<br/>(string)"]
        C_OPT["optimizer<br/>(KythiaOptimizer)"]
        C_METRICS["metrics<br/>(MetricsManager)"]
    end

    subgraph BOOT["⚙️ Available After start()"]
        B_TRANS["translator<br/>(TranslatorManager)"]
        B_T["t()<br/>(translate function)"]
        B_AM["addonManager"]
        B_TOKEN["optimizerToken"]
        B_MODELS["models<br/>(all addon Sequelize models)"]
        B_MW["middlewareManager"]
        B_IM["interactionManager"]
        B_EM["eventManager"]
        B_SM["shutdownManager"]
    end

    CTR["KythiaContainer<br/>client.container"]

    CTR --> CTOR
    CTR --> BOOT

    B_MODELS -.->|"after bootModels()"| DB_READY["addDbReadyHook()<br/>define associations"]
    B_T -.->|"after translator init"| TRANS_USAGE["t(interaction, 'key', vars)"]

    style CTR fill:#1a1a2e,color:#e0e0ff,stroke:#5865F2
    style CTOR fill:#16213e,color:#e0e0ff
    style BOOT fill:#0f3460,color:#e0e0ff
```

---

## 11. Addon Structure → Auto-Load Mapping

Dari struktur folder ke apa yang di-load Kythia secara otomatis.

```mermaid
graph LR
    subgraph ADDON["addons/my-feature/"]
        AJ["addon.json<br/>priority · deps · active"]
        RJ["register.js<br/>custom init hook"]

        subgraph CMDS["commands/"]
            SC["ping.js → /ping"]
            FC["user/_command.js → /user"]
            SUB["user/profile.js → /user profile"]
            GRP["user/settings/_group.js → group def"]
            GSUB["user/settings/privacy.js → /user settings privacy"]
        end

        subgraph EVTS["events/"]
            EV["messageCreate.js → messageCreate"]
            EV2["guildMemberAdd.js → guildMemberAdd"]
        end

        subgraph BTNS["buttons/"]
            BTN["confirm-delete.js → customId match"]
        end

        subgraph MODS["modals/"]
            MOD["feedback.js → customId prefix"]
        end

        subgraph SELS["select_menus/"]
            SEL["role-select.js → customId prefix"]
        end

        subgraph TSKS["tasks/"]
            TSK["daily-cleanup.js → cron/interval"]
        end

        subgraph LANG["lang/"]
            LNG["en.json → TranslatorManager"]
        end

        subgraph DBFOLDER["database/"]
            MDLS["models/UserData.js → container.models"]
            MIGR["migrations/*.js → KythiaMigrator"]
            SEED["seeders/*.js → SeederManager"]
        end
    end

    AJ -->|"parsed by"| AM["AddonManager"]
    RJ -->|"runs during"| AM
    CMDS -->|"registered in"| CLIENT_CMD["client.commands Collection"]
    EVTS -->|"registered in"| EM["EventManager eventHandlers Map"]
    BTNS -->|"registered in"| AM_BTN["AddonManager buttonHandlers Map"]
    MODS -->|"registered in"| AM_MOD["AddonManager modalHandlers Map"]
    SELS -->|"registered in"| AM_SEL["AddonManager selectMenuHandlers Map"]
    TSKS -->|"scheduled via"| CRON["node-cron / setInterval"]
    LANG -->|"merged into"| TM["TranslatorManager"]
    MDLS -->|"booted via"| ML["ModelLoader → container.models"]
    MIGR -->|"run via"| KMIG["KythiaMigrator"]
    SEED -->|"run via"| SMDG["SeederManager"]

    style AM fill:#2980b9,color:#fff
    style EM fill:#8e44ad,color:#fff
    style CLIENT_CMD fill:#1a1a2e,color:#e0e0ff
```

---

## 12. Sharding Architecture (Multi-Process)

```mermaid
flowchart TD
    MASTER["ShardingManager (Master Process)<br/>─────────────────────<br/>• Spawn shards<br/>• Crash loop detection (≥3 deaths/5min → pause)<br/>• OOM kill detection (exit code 137)<br/>• All-time restart count per shard<br/>• getMasterUptime()"]

    MASTER --> S0["Shard 0<br/>Kythia instance"]
    MASTER --> S1["Shard 1<br/>Kythia instance"]
    MASTER --> SN["Shard N<br/>Kythia instance"]

    S0 & S1 & SN --> REDIS_SHARED["Redis<br/>(Shared Cache — all shards)"]
    S0 & S1 & SN --> DB_SHARED["Database<br/>(Shared — all shards)"]
    S0 & S1 & SN --> DJS_GW["Discord Gateway<br/>(separate WS connection)"]

    subgraph EVENTS_SHARD["Shard Lifecycle Events"]
        EV_SPAWN["spawn"] 
        EV_READY["ready"]
        EV_DISC["disconnect"]
        EV_RECON["reconnecting"]
        EV_DEATH["death"]
    end

    MASTER --> EVENTS_SHARD

    style MASTER fill:#2c3e50,color:#fff
    style REDIS_SHARED fill:#c0392b,color:#fff
    style DB_SHARED fill:#2980b9,color:#fff
```

---

## Summary: Data Flow Cheat Sheet

| From | To | Via |
|------|-----|-----|
| `index.js` | `Kythia Orchestrator` | `new Kythia().start()` |
| `Kythia.start()` | All Managers | Sequential initialization |
| `Discord Gateway` | `InteractionManager` | `InteractionCreate` event |
| `InteractionManager` | `Middleware Pipeline` | Before every command |
| `Middleware Pipeline` | `command.execute()` | If all checks pass |
| `command.execute()` | `KythiaContainer` | `interaction.client.container` |
| `KythiaModel.getCache()` | Redis → LRU → DB | Cache fallback chain |
| `afterSave hook` | Redis + LRU | Tag-based invalidation |
| `Discord Gateway` | `EventManager` | Any gateway event |
| `EventManager` | `Addon handlers` | Concurrent `Promise.all` |
| `SIGINT/SIGTERM` | `ShutdownManager` | Signal handlers |
| `ShutdownManager` | `Shutdown hooks → DB close → exit` | Sequential |
| `KythiaOptimizer` | `License Server` | POST /license/verify |
| `KythiaOptimizer` | `Sentry` | Error telemetry |
| `Winston logger` | `Discord Webhook` | warn/error level |
