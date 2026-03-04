# Kythia Core — Class & Method Reference

> Complete reference for all exported classes, methods, and utilities — **v0.13.1-beta**

**Related docs:**
- [CONTAINER.md](./CONTAINER.md) — Full `KythiaContainer` property reference and access patterns
- [CONFIG.md](./CONFIG.md) — Complete `kythia.config.js` field reference
- [ADDON_GUIDE.md](./ADDON_GUIDE.md) — Step-by-step addon authoring guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture and data flow diagrams

---

## Table of Contents

- [Core Exports](#core-exports)
- [Kythia Class](#kythia-class)
- [KythiaClient Interface](#kythiaclient-interface)
- [Managers](#managers)
  - [AddonManager](#addonmanager)
  - [InteractionManager](#interactionmanager)
  - [EventManager](#eventmanager)
  - [ShardingManager](#shardingmanager)
  - [ShutdownManager](#shutdownmanager)
  - [TranslatorManager](#translatormanager)
  - [MetricsManager](#metricsmanager)
- [Database Classes](#database-classes)
  - [KythiaModel](#kythiamodel)
  - [KythiaMigrator](#kythiamigrator)
  - [ModelLoader](#modelloader)
  - [Seeder](#seeder)
  - [SeederManager](#seedermanager)
- [Utilities](#utilities)
  - [utils Object](#utils-object)
  - [BaseCommand](#basecommand)
  - [createSequelizeInstance](#createsequelizeinstance)
  - [attachWebhookTransport](#attachwebhooktransport)
- [Middlewares](#middlewares)
- [Type Definitions](#type-definitions)
- [Usage Examples](#usage-examples)

---

## Core Exports

Main named exports from `kythia-core`:

```typescript
import {
  Kythia,                    // Main orchestrator class (default export)
  ShardingManager,           // Sharding wrapper
  KythiaModel,               // Base model class
  createSequelizeInstance,   // Sequelize factory function
  utils,                     // Utility functions object
  BaseCommand,               // Optional base class for commands
  Seeder,                    // Base class for database seeders
  SeederManager,             // Manages seeder execution
  // All types re-exported:
  type KythiaContainer,
  type KythiaConfig,
  type KythiaClient,
  // ...all other types from src/types/
} from 'kythia-core';
```

---

## Kythia Class

**File:** `src/Kythia.ts`

Main orchestrator class that manages the entire bot lifecycle.

### Constructor

```typescript
const kythia = new Kythia({
  client: Client;          // ✅ Required — Discord.js Client instance
  config: KythiaConfig;    // ✅ Required — Config object from kythia.config.js
  logger?: KythiaLogger;   // Optional — defaults to built-in Winston logger
  redis?: Redis;           // Optional — ioredis instance
  sequelize?: Sequelize;   // Optional — Sequelize instance
  models?: object;         // Optional — pre-populated models map
  helpers?: object;        // Optional — custom helper functions
  utils?: object;          // Optional — additional utility objects
  appRoot?: string;        // Optional — project root dir (defaults to process.cwd())
});
```

> **Important:** `translator` is **not** a constructor parameter. `TranslatorManager` is initialized internally. There is no `dbDependencies` property.

### Properties

#### `client: IKythiaClient`
Extended Discord.js client with `container` and `commands` properties.

#### `container: KythiaContainer`
The central DI container. Contains all services.

#### `addonManager: IAddonManager`
Available after `start()` is called.

#### `interactionManager: IInteractionManager`
Available after `start()` is called.

#### `eventManager: IEventManager`
Available after `start()` is called.

#### `shutdownManager: IShutdownManager`
Available after `start()` is called (also stored in `container.shutdownManager`).

#### `translator: ITranslatorManager`
Available after `start()` is called.

#### `optimizer: KythiaOptimizer`
Internal license verification system. Available at construction time.

#### `metricsManager: MetricsManager`
Prometheus metrics collector. Available at construction time and stored in `container.metrics`.

### Methods

#### `start(): Promise<void>`
Runs the complete bot initialization sequence.

**Sequence:**
1. Print ASCII banner
2. Check client intents/partials
3. Verify `legalConfig` (TOS acceptance)
4. Initialize Sentry (if `sentry.dsn` configured)
5. Validate required config fields
6. Run license validation via `KythiaOptimizer`
7. Load translations (core lang + `appRoot/lang`)
8. Load all addons via `AddonManager`
9. Connect to database with retry logic (up to 5 retries, 5s delay)
10. Run migrations (`KythiaMigrator`)
11. Boot models (`bootModels`) and attach cache hooks
12. Initialize `EventManager`
13. Initialize `MiddlewareManager`
14. Initialize `InteractionManager`
15. Deploy slash commands to Discord
16. Initialize `ShutdownManager`
17. Log in to Discord (`client.login`)
18. On `clientReady`: execute `clientReadyHooks`, start runtime validation loop

**Example:**
```javascript
await kythia.start();
```

#### `addDbReadyHook(callback: Function): void`
Register a callback that runs after all addon models are loaded and booted.

**Use case:** Define Sequelize model associations.

```javascript
kythia.addDbReadyHook((sequelize) => {
  const { User, Profile } = sequelize.models;
  User.hasOne(Profile);
  Profile.belongsTo(User);
});
```

#### `addClientReadyHook(callback: Function): void`
Register a callback that runs once the Discord client fires the `clientReady` event.

```javascript
kythia.addClientReadyHook(async (client) => {
  console.log(`Logged in as ${client.user.tag}`);
  // Start your custom status rotation, etc.
});
```

#### `registerButtonHandler(customId: string, handler: KythiaButtonHandler): void`
Register a button interaction handler. Delegates to `addonManager`.

#### `registerModalHandler(customIdPrefix: string, handler: KythiaModalHandler): void`
Register a modal submit handler by customId prefix. Delegates to `addonManager`.

#### `registerSelectMenuHandler(customIdPrefix: string, handler: KythiaSelectMenuHandler): void`
Register a select menu handler by customId prefix. Delegates to `addonManager`.

---

## KythiaClient Interface

**Type Definition:** `src/types/KythiaClient.ts`

Extends the standard Discord.js `Client` with Kythia-specific properties.

### Properties

#### `container: KythiaContainer`
Access to all services and managers.

```javascript
const { logger, models, config, t } = client.container;
```

#### `commands: Collection<string, KythiaCommandModule>`
All registered commands, keyed by command name.

#### `cooldowns: Collection<string, Collection<string, number>>`
Cooldown tracking per command per user.

---

## Managers

### AddonManager

**File:** `src/managers/AddonManager.ts`

#### Methods

##### `loadAddons(kythiaInstance): Promise<object[]>`
Load and register all enabled addons in dependency/priority order.

**Returns:** Array of Discord API command JSON payloads for deployment.

##### `registerButtonHandler(customId: string, handler: Function): void`
Register a button click handler by exact `customId`.

```javascript
addonManager.registerButtonHandler('confirm-delete', async (interaction) => {
  await interaction.reply('Deleted!');
});
```

##### `registerModalHandler(customIdPrefix: string, handler: Function): void`
Register a modal submit handler by customId prefix.

##### `registerSelectMenuHandler(customIdPrefix: string, handler: Function): void`
Register a select menu handler by customId prefix.

##### `registerAutocompleteHandler(commandName: string, handler: Function): void`
Register an autocomplete handler for a command name key.

##### `registerTaskHandler(taskName: string, execute: Function, schedule: string | number): void`
Register a scheduled task.

| Parameter | Type | Description |
|---|---|---|
| `taskName` | `string` | Unique identifier for the task |
| `execute` | `(container) => Promise<void>` | Task function |
| `schedule` | `string` | Cron pattern (validated via `node-cron`) |
| `schedule` | `number` | Interval in milliseconds (tracked by ShutdownManager) |

```javascript
// Cron task — runs at midnight daily
addonManager.registerTaskHandler(
  'daily-cleanup',
  async (container) => {
    const { logger, models } = container;
    logger.info('Running cleanup...');
  },
  '0 0 * * *'
);

// Interval task — runs every 30 seconds
addonManager.registerTaskHandler('heartbeat', async (container) => {
  // ...
}, 30000);
```

##### `getHandlers(): object`
Get all registered handler maps.

```typescript
{
  buttonHandlers: Map<string, KythiaButtonHandler>,
  modalHandlers: Map<string, KythiaModalHandler>,
  selectMenuHandlers: Map<string, KythiaSelectMenuHandler>,
  autocompleteHandlers: Map<string, KythiaAutocompleteHandler>,
  taskHandlers: Map<string, any>,
  eventHandlers: Map<string, KythiaEventHandler[]>,
}
```

##### `registerCommand(module, filePath, namesSet, deployArray, defaults?, options?): CommandRegistrationSummary | null`
Register a single command module. Handles both plain module exports and `BaseCommand` class instances. Supports `SlashCommandBuilder` and `ContextMenuCommandBuilder`.

---

### InteractionManager

**File:** `src/managers/InteractionManager.ts`

Handles all Discord interactions.

#### Methods

##### `initialize(): void`
Attach the `InteractionCreate` listener to the Discord client. Called automatically by `Kythia.start()`.

**Handles all interaction types:**
- Chat input (slash) commands
- Context menu commands (User / Message)
- Button interactions
- Modal submissions
- String/User/Role/Channel/Mentionable select menus
- Autocomplete interactions

---

### EventManager

**File:** `src/managers/EventManager.ts`

Routes Discord gateway events to addon event handlers.

#### Methods

##### `initialize(): void`
Register all event listeners on the Discord client. Called automatically by `Kythia.start()`.

---

### ShardingManager

**File:** `src/managers/ShardingManager.ts`

Wraps Discord.js `ShardingManager` with production-grade lifecycle monitoring.

#### Constructor

```typescript
new ShardingManager({
  scriptPath?: string;             // Path to bot entry file (default: 'dist/index.js')
  token: string;                   // Discord Bot Token
  totalShards?: number | 'auto';   // Shard count (default: 'auto')
  logger?: KythiaLogger;           // Optional logger
})
```

#### Methods

##### `spawn(): Promise<void>`
Spawn all configured shards. Attaches shard lifecycle listeners:
- `spawn` / `ready` / `disconnect` / `reconnecting` / `death`
- OOM kill detection (exit code `137`)
- Crash loop detection (≥ 3 deaths within 5 minutes → 2-minute pause)
- All-time restart count tracking per shard

```javascript
import { ShardingManager } from 'kythia-core';

const manager = new ShardingManager({
  token: process.env.BOT_TOKEN,
  totalShards: 'auto',
});

await manager.spawn();
```

##### `getShardRestartCount(shardId: number): number`
Return the all-time restart count for a given shard.

```javascript
const restarts = manager.getShardRestartCount(0); // e.g. 2
```

##### `getShardStats(): Record<number, { restarts: number }>`
Return per-shard restart statistics for all known shards.

```javascript
const stats = manager.getShardStats();
// { 0: { restarts: 1 }, 1: { restarts: 0 } }
```

##### `getUptime(): number`
Return seconds since the master `ShardingManager` process was initialized (survives individual shard restarts).

```javascript
const uptimeSec = manager.getUptime(); // e.g. 86400 (1 day)
```

---

### ShutdownManager

**File:** `src/managers/ShutdownManager.ts`

Manages graceful process shutdown and active resource monitoring.

#### Methods

##### `initialize(): void`
Register SIGINT/SIGTERM signal handlers and patch global `setInterval`. Called automatically by `Kythia.start()`.

##### `registerShutdownHook(callback: Function): void`
Register a function to run during shutdown.

```javascript
kythia.shutdownManager.registerShutdownHook(async () => {
  await redis.quit();
  logger.info('Redis connection closed.');
});
```

##### `getMasterUptime(): number`
Returns seconds elapsed since the shard process started. Survives shard-level restarts (the counter is the process start time).

```javascript
const uptime = kythia.shutdownManager.getMasterUptime();
// e.g. 3600 → running for 1 hour
```

> **Memory Monitor:** `ShutdownManager` automatically starts a memory pressure monitor on `initialize()`. It polls every 5 minutes and compares `heapUsed` against `v8.getHeapStatistics().heap_size_limit`. Logs `warn` at 80% and `error` at 95%.

---

### TranslatorManager

**File:** `src/managers/TranslatorManager.ts`

Manages localization and translations.

#### Methods

##### `loadLocalesFromDir(directory: string): void`
Load all JSON locale files from a directory.

```javascript
translator.loadLocalesFromDir('./addons/core/lang');
```

##### `t(interaction: Interaction, key: string, variables?: object): Promise<string>`
Translate a key for the user's locale (falls back to `en`).

```javascript
// Shorthand via container
const message = await container.t(interaction, 'profile.welcome', {
  user: interaction.user.username
});
```

##### `getLocales(): Map<string, object>`
Get all loaded locale maps.

---

### MetricsManager

**File:** `src/managers/MetricsManager.ts`

Collects performance metrics via `prom-client`. Available at `container.metrics`.

#### Methods

##### `getMetrics(): Promise<string>`
Returns all metrics in Prometheus text format.

##### `getContentType(): string`
Returns the `Content-Type` header value for Prometheus scraping.

See [METRICS.md](./METRICS.md) for all tracked metrics and Grafana query examples.

---

## Database Classes

### KythiaModel

**File:** `src/database/KythiaModel.ts`

Base Sequelize model class with hybrid Redis/LRU caching.

#### Static Methods

##### `setDependencies(deps: object): void`
**Must be called once at startup** before any model methods are used.

```javascript
KythiaModel.setDependencies({
  logger: logger,
  config: kythiaConfig,
  redis: redisClient,  // Optional; falls back to LRU if not provided
});
```

##### `autoBoot(sequelize: Sequelize): Promise<void>`
Auto-introspect the table schema and define the Sequelize model. Called automatically by `ModelLoader`.

##### `attachHooksToAllModels(sequelize: Sequelize, client: Client): void`
Register `afterSave`, `afterDestroy`, `afterBulkCreate`, `afterBulkDestroy` hooks on all models for automatic cache invalidation. Called automatically by `Kythia.start()`.

##### `getCache(query: FindOptions): Promise<Model | null>`
Find one record with caching.

```javascript
const user = await User.getCache({ where: { userId: '123456789' } });
```

##### `getAllCache(query: FindOptions): Promise<Model[]>`
Find all records with caching.

##### `findOrCreateWithCache(options: FindOrCreateOptions): Promise<[Model, boolean]>`
Find or create a record with cache support.

##### `countWithCache(options: CountOptions): Promise<number>`
Count records with caching.

##### `aggregateWithCache(options: AggregateOptions): Promise<any>`
Run aggregate query with caching.

#### Instance Methods

##### `invalidateCache(): Promise<void>`
Manually invalidate all cache entries for this model instance.

---

### KythiaMigrator

**File:** `src/database/KythiaMigrator.ts`

Function export — not a class. Runs pending addon migrations.

```typescript
KythiaMigrator({ sequelize, container, logger }): Promise<void>
```

**Called automatically by `Kythia.start()`.**

Supports:
- `migrate` — run pending
- `migrate --fresh` — drop all tables and re-run (DESTRUCTIVE)
- `migrate --rollback` — rollback last batch

Via CLI: `npx kythia migrate`

---

### ModelLoader

**File:** `src/database/ModelLoader.ts`

Function export — not a class.

```typescript
bootModels(kythiaInstance: Kythia, sequelize: Sequelize): Promise<void>
```

**Called automatically by `Kythia.start()`.**

**Process:**
1. Scan `addons/*/database/models/`
2. Skip disabled addons
3. `require()` each model file
4. Call `Model.autoBoot(sequelize)`
5. Register model in `container.models`
6. Execute all registered `dbReadyHooks` (for associations)

---

### Seeder

**File:** `src/database/Seeder.ts`

Base class for database seeders. Exported from `kythia-core`.

```typescript
import { Seeder } from 'kythia-core';

export default class UserSeeder extends Seeder {
  public async run(): Promise<void> {
    const { User } = this.container.models;
    await User.bulkCreate([
      { username: 'Admin', role: 'admin' },
      { username: 'Moderator', role: 'mod' },
    ]);
  }
}
```

---

### SeederManager

**File:** `src/database/SeederManager.ts`

Manages seeder discovery and execution. Used internally by `npx kythia db:seed`.

```typescript
import { SeederManager } from 'kythia-core';
```

---

## Utilities

### `utils` object

Exported from `kythia-core` as `utils`. Contains:

#### `utils.convertColor(color: string): number`
**File:** `src/utils/color.ts`

Convert a hex color string to a decimal integer (for Discord embeds).

```javascript
const { utils } = require('kythia-core');
const decimal = utils.convertColor('#FF0000'); // → 16711680
```

#### `utils.formatDuration(ms: number): string`
**File:** `src/utils/formatter.ts`

Format milliseconds into a human-readable duration string.

```javascript
utils.formatDuration(90000); // → "1m 30s"
```

#### `utils.formatNumber(num: number): string`
**File:** `src/utils/formatter.ts`

Format a number with thousand-separator commas.

```javascript
utils.formatNumber(1500000); // → "1,500,000"
```

### `BaseCommand`

**File:** `src/structures/BaseCommand.ts`

Optional base class for commands using class-based syntax.

```javascript
const { BaseCommand } = require('kythia-core');

class PingCommand extends BaseCommand {
  constructor(container) {
    super(container);
    this.name = 'ping';
    this.description = 'Ping the bot';
  }

  async execute(interaction) {
    await interaction.reply('Pong!');
  }
}

module.exports = PingCommand;
```

> `BaseCommand` is **optional**. Plain module exports are perfectly valid and the more common pattern.

### `createSequelizeInstance`

**File:** `src/database/KythiaSequelize.ts`

Factory function that creates a configured Sequelize instance supporting SQLite, MySQL, and PostgreSQL.

```javascript
const { createSequelizeInstance } = require('kythia-core');
const sequelize = createSequelizeInstance(kythiaConfig, logger);
```

---

### `attachWebhookTransport`

**File:** `src/utils/DiscordWebhookTransport.ts`

Attaches a Discord webhook transport to the Winston logger, forwarding `warn` and `error` (or any configured level) logs to a Discord channel in real time. Also captures Discord REST `rateLimited` and `invalidRequestWarning` events.

```javascript
const { attachWebhookTransport } = require('kythia-core');

// Call after kythia.start() to attach the webhook transport
attachWebhookTransport(logger, webhookUrl, client);
```

| Parameter | Type | Description |
|---|---|---|
| `logger` | `KythiaLogger` | The Winston logger instance |
| `webhookUrl` | `string` | Full Discord webhook URL |
| `client` | `Client` | Discord.js client (used for REST event forwarding) |

Log levels forwarded are controlled by `settings.webhookLogFilter` in `kythia.config.js` (default: `'warn,error'`).

> **Note:** `Kythia.start()` calls this automatically when `api.webhookErrorLogs` is set in config. Only call it manually if you need a custom transport setup.

---

## Middlewares

Built-in middlewares are **not exported** from `kythia-core`. They are applied declaratively through command module properties — the `InteractionManager` reads these properties and applies the appropriate middleware.

### Command Module Middleware Properties

| Property | Type | Description |
|---|---|---|
| `botPermissions` | `string[]` | Discord permission flags the bot must have in the channel |
| `userPermissions` | `string[]` | Discord permission flags the invoking user must have |
| `cooldown` | `number` | Per-user cooldown in milliseconds |
| `ownerOnly` | `boolean` | Restrict to `config.bot.ownerId` |
| `isInMainGuild` | `boolean` | Restrict to `config.bot.mainGuildId` only |
| `mainGuildOnly` | `boolean` | Deploy this command ONLY to the main guild (not global) |

```javascript
// Example: admin ban command
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user'),

  botPermissions: ['BanMembers'],
  userPermissions: ['BanMembers'],
  cooldown: 5000,
  mainGuildOnly: true,

  async execute(interaction) {
    const { logger } = interaction.client.container;
    // ...
  }
};
```

---

## Type Definitions

### KythiaConfig

```typescript
interface KythiaConfig {
  bot: {
    token: string;
    clientId: string;
    clientSecret: string;
    ownerId?: string;
    devGuildId?: string;
    mainGuildId?: string;
    inviteLink?: string;  // Displayed in clientReady log
  };
  db: {
    driver: 'sqlite' | 'mysql' | 'postgres';  // Defaults to 'sqlite'
    name: string;         // Database name or SQLite filename
    host?: string;        // Required for mysql/postgres
    port?: number;
    user?: string;
    pass?: string;
    redis?: string | object; // Redis connection options
  };
  licenseKey: string;     // Required for KythiaOptimizer
  legal: {
    acceptTOS: boolean;   // Must be true to start
    dataCollection: boolean; // Must be true to start
  };
  env?: 'development' | 'production';
  sentry?: { dsn?: string };
  settings?: { inviteLink?: string };
  addons?: {
    all?: { active?: boolean };
    [addonName: string]: { active?: boolean } | undefined;
  };
}
```

### KythiaContainer

```typescript
interface KythiaContainer {
  client: IKythiaClient;
  sequelize?: Sequelize;
  logger: KythiaLogger;
  redis?: Redis;
  kythiaConfig: KythiaConfig;
  helpers: KythiaHelpersCollection;
  appRoot: string;
  optimizer: KythiaOptimizer;
  metrics: MetricsManager;
  optimizerToken: string | null;
  translator: ITranslatorManager;
  t: (interaction: Interaction, key: string, vars?: object) => Promise<string>;
  models: { [key: string]: typeof Model };
  middlewareManager?: MiddlewareManager;
  shutdownManager?: IShutdownManager;
  _degraded?: boolean;
}
```

### KythiaCommandModule

```typescript
interface KythiaCommandModule {
  data: SlashCommandBuilder | ContextMenuCommandBuilder | object | Function;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;

  // Middleware properties
  botPermissions?: string[];
  userPermissions?: string[];
  cooldown?: number;
  ownerOnly?: boolean;
  isInMainGuild?: boolean;
  mainGuildOnly?: boolean;
}
```

### KythiaTaskHandler

```typescript
// In addon task file:
module.exports = {
  schedule: '0 0 * * *' | 30000,  // cron string or ms interval
  taskName: string,                // Optional — filename used if not set

  async execute(container: KythiaContainer): Promise<void> {
    // task logic
  }
};
```

### KythiaLogger

```typescript
interface KythiaLogger {
  info(message: string, meta?: object): void;
  warn(message: string, meta?: object): void;
  error(message: string, meta?: object): void;
  debug(message: string, meta?: object): void;
}
```

---

## Usage Examples

### Complete Bot Setup

```javascript
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { Kythia, KythiaModel, createSequelizeInstance } = require('kythia-core');
const Redis = require('ioredis');
const config = require('./kythia.config.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Message],
});

const redis = new Redis(config.db.redis, { lazyConnect: true });
const sequelize = createSequelizeInstance(config, console);

// Set static dependencies on KythiaModel BEFORE creating Kythia
KythiaModel.setDependencies({ config, redis });

const kythia = new Kythia({
  client,
  config,
  redis,
  sequelize,
  appRoot: __dirname,
});

// Register association hooks BEFORE start()
kythia.addDbReadyHook((seq) => {
  const { User, Profile } = seq.models;
  User.hasOne(Profile);
  Profile.belongsTo(User);
});

// Register client-ready hooks
kythia.addClientReadyHook(async (client) => {
  console.log(`Online as ${client.user.tag}`);
});

await kythia.start();
```

### Using Container in Commands

```javascript
module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your profile'),

  cooldown: 3000,

  async execute(interaction) {
    const { logger, models, t } = interaction.client.container;
    const { User } = models;

    const user = await User.getCache({
      where: { userId: interaction.user.id }
    });

    const message = await t(interaction, 'profile.welcome', {
      points: user?.points ?? 0
    });

    logger.info(`Profile viewed: ${interaction.user.tag}`);
    await interaction.reply({ content: message, ephemeral: true });
  }
};
```

### Creating a Scheduled Task

```javascript
// addons/myfeature/tasks/daily-cleanup.js
const { Op } = require('sequelize');

module.exports = {
  schedule: '0 0 * * *', // Every day at midnight UTC
  taskName: 'daily-cleanup',

  async execute(container) {
    const { logger, models } = container;
    const { TempData } = models;

    const deleted = await TempData.destroy({
      where: {
        createdAt: {
          [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    logger.info(`Daily cleanup: removed ${deleted} temp records`);
  }
};
```

### Button Handler in register.js

```javascript
// addons/myfeature/register.js
module.exports = async function register({ addonManager }) {
  addonManager.registerButtonHandler('confirm-action', async (interaction) => {
    const { models } = interaction.client.container;
    // handle button
    await interaction.reply({ content: '✅ Confirmed!', ephemeral: true });
  });
};
```

---

For architecture details and flow diagrams, see [ARCHITECTURE.md](./ARCHITECTURE.md).  
For CLI tools, see [CLI_REFERENCE.md](./CLI_REFERENCE.md).  
For `KythiaContainer` property reference, see [CONTAINER.md](./CONTAINER.md).  
For `kythia.config.js` reference, see [CONFIG.md](./CONFIG.md).  
For a complete addon authoring guide, see [ADDON_GUIDE.md](./ADDON_GUIDE.md).
