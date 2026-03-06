# Global Chat API

A specialized Discord Global Chat API system designed exclusively for **[Alya-chan](https://alyaa.site)** and **[Yuki Suou](https://yukisuou.xyz)** Discord bots. This API enables cross-server message broadcasting, allowing users from different Discord servers to communicate through a unified global chat system.

## 🤖 Supported Bots

This API is specifically built for and supports:
- **[Alya-chan](https://alyaa.site)** - Advanced Discord bot with global chat capabilities
- **[Yuki Suou](https://yukisuou.xyz)** - Feature-rich Discord bot with cross-server communication
- **[Kythia](https://kythia.my.id)** - Cutest Discord bot companion, with image, video, and document understanding, even realtime searching.

## 🚀 Features

- ✅ **Cross-Server Messaging** - Messages sent in one server appear in all connected servers
- ✅ **Message Deletion** - Delete broadcasted messages from all servers simultaneously
- ✅ **Automatic Message Cleanup** - Messages are stored for 3 days, then auto-deleted
- ✅ **Webhook-Based Broadcasting** - Fast and efficient message delivery using Discord webhooks
- ✅ **Message Deduplication** - Prevents duplicate messages and spam
- ✅ **Guild Management** - Easy registration and removal of Discord servers
- ✅ **Rich Message Support** - Handles attachments, stickers, replies, and embeds
- ✅ **Bot Loop Prevention** - Intelligent filtering to prevent infinite message loops
- ✅ **Cache System** - In-memory caching for optimal performance
- 🔒 **Concurrency Control** - Thread-safe message processing
- ⚡ **High Performance** - Built with Bun runtime for maximum speed
- 🚫 **Ban System** - Comprehensive user and server banning with time-based restrictions
- 🔐 **API Authentication** - Secure API key-based authentication for administrative operations
- 📢 **Ban Notifications** - Automatic notifications to all servers when bans are applied
- 📋 **Audit Trail** - Complete tracking of who performed ban actions and when

## 🛠️ How It Works

### Architecture Overview

```
Discord Server A → Bot → Global Chat API → Webhook System → Discord Servers B, C, D...
```

1. **Message Reception**: A user sends a message in a global chat channel
2. **Bot Processing**: Alya-chan, Yuki Suou, or Kythia receives the message and sends it to the API
3. **API Processing**: The API processes the message, formats it, and prepares webhook payloads
4. **Broadcasting**: The message is sent to all registered Discord servers via webhooks
5. **Display**: Users in all connected servers see the message with proper formatting

### Message Flow

1. **Input Validation**: Check message structure and required fields
2. **Duplicate Detection**: Prevent processing the same message multiple times
3. **Guild Filtering**: Exclude the origin server from broadcast targets
4. **Payload Generation**: Create Discord webhook payloads with proper formatting
5. **Webhook Delivery**: Send messages to all target servers simultaneously
6. **Response**: Return processing status and delivery results

## 🔧 Setup & Installation

### Prerequisites

- [Bun](https://bun.sh/) runtime
- [Turso](https://turso.tech/) database account
- Discord Bot with webhook permissions

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/idMJA/Global-Chat-API.git
cd Global-Chat-API
bun install
```

### 2. Database Setup (Turso)

1. Create a Turso account at [turso.tech](https://turso.tech/)
2. Create a new database:
   ```bash
   turso db create global-chat-db
   ```
3. Get database URL and auth token:
   ```bash
   turso db show global-chat-db
   turso db tokens create global-chat-db
   ```

### 3. Environment Configuration

Create a `.env` file with your Turso credentials:

```env
TURSO_DATABASE_URL=your_turso_database_url_here
TURSO_AUTH_TOKEN=your_turso_auth_token_here
PORT=2000
```

### 4. Database Schema Setup

```bash
# Generate migration files
bun run db:generate

# Push schema to database
bun run db:push
```

### 5. Ban System Setup (Optional)

If you plan to use the ban system, create an initial API key:

```bash
# Create your first API key for ban system access
bun run setup:api-key

# Follow the prompts to create an admin API key
# Save the generated API key securely - it won't be shown again
```

### 6. Start the Server

```bash
# Development mode (with hot reload)
bun run dev

# Production mode
bun run start
```

The API will be available at `http://localhost:2000`

## 📚 API Endpoints Reference

### 1. Send Global Chat Message

**Endpoint**: `POST /chat`

Broadcasts a message to all registered Discord servers in the global chat network.

**Request Body**:
```json
{
  "message": {
    "id": "1234567890123456789",
    "content": "Hello from global chat!",
    "author": {
      "id": "987654321098765432",
      "username": "UserName",
      "globalName": "Display Name",
      "avatarURL": "https://cdn.discordapp.com/avatars/user_id/avatar_hash.png",
      "bot": false
    },
    "channelId": "111222333444555666",
    "guildId": "123456789012345678",
    "referencedMessage": {
      "id": "1111111111111111111",
      "content": "Original message being replied to",
      "author": {
        "id": "222222222222222222",
        "username": "OriginalUser",
        "globalName": "Original Display Name",
        "avatarURL": "https://cdn.discordapp.com/avatars/user2/avatar2.png"
      }
    },
    "attachments": [
      {
        "id": "attachment_id",
        "url": "https://cdn.discordapp.com/attachments/channel/message/file.png",
        "contentType": "image/png",
        "filename": "image.png",
        "size": 1024,
        "width": 800,
        "height": 600
      }
    ],
    "stickerItems": [
      {
        "id": "sticker_id",
        "name": "sticker_name",
        "formatType": 1
      }
    ]
  },
  "guildName": "My Discord Server"
}
```

**Response (Success - Message from Global Chat Channel)**:
```json
{
  "status": "ok",
  "message": "Message successfully broadcasted to global chat network",
  "code": "BROADCAST_SUCCESS",
  "data": {
    "messageInfo": {
      "id": "1234567890123456789",
      "author": "UserName",
      "content": "Hello from global chat!",
      "fromGuild": "123456789012345678",
      "fromGuildName": "My Discord Server"
    },
    "deliveryStats": {
      "total": 2,
      "successful": 2,
      "failed": 0,
      "successRate": 100
    },
    "successfulGuilds": [
      {
        "guildId": "target_guild_id",
        "guildName": "Target Server Name",
        "messageId": "new_message_id_1"
      }
    ],
    "failedGuilds": []
  },
  "payloads": [...],
  "webhookResults": [...]
}
```

**Response (Ignored - Message NOT from Global Chat Channel)**:
```json
{
  "status": "ignored",
  "message": "Message not from global chat channel",
  "code": "NOT_GLOBAL_CHAT_CHANNEL",
  "data": {
    "messageId": "1234567890123456789",
    "channelId": "999888777666555444",
    "guildId": "123456789012345678",
    "reason": "This message is from a regular channel, not the designated global chat channel",
    "suggestion": "Only messages from the registered global chat channel will be processed"
  }
}
```

**Response (Partial Success - Some Webhooks Failed)**:
```json
{
  "status": "partial",
  "payloads": [...],
  "webhookResults": [
    {
      "guildId": "successful_guild_id",
      "guildName": "Successful Server",
      "success": true,
      "status": 200,
      "messageId": "new_message_id"
    },
    {
      "guildId": "failed_guild_id",
      "guildName": "Failed Server",
      "success": false,
      "error": "Webhook failed: 401 Unauthorized"
    }
  ],
  "data": {
    "deliveryStats": {
      "total": 2,
      "successful": 1,
      "failed": 1,
      "successRate": 50
    },
    "successfulGuilds": [
      {
        "guildId": "successful_guild_id",
        "guildName": "Successful Server",
        "messageId": "new_message_id"
      }
    ],
    "failedGuilds": [
      {
        "guildId": "failed_guild_id",
        "guildName": "Failed Server",
        "error": "Webhook failed: 401 Unauthorized"
      }
    ]
  }
}
```

**Response (Complete Failure)**:
```json
{
  "status": "failed",
  "payloads": [...],
  "webhookResults": [
    {
      "guildId": "failed_guild_id_1",
      "guildName": "Failed Server 1",
      "success": false,
      "error": "Webhook failed: 401 Unauthorized"
    },
    {
      "guildId": "failed_guild_id_2", 
      "guildName": "Failed Server 2",
      "success": false,
      "error": "Webhook failed: 404 Not Found"
    }
  ],
  "data": {
    "deliveryStats": {
      "total": 2,
      "successful": 0,
      "failed": 2,
      "successRate": 0
    },
    "successfulGuilds": [],
    "failedGuilds": [
      {
        "guildId": "failed_guild_id_1",
        "guildName": "Failed Server 1",
        "error": "Webhook failed: 401 Unauthorized"
      },
      {
        "guildId": "failed_guild_id_2",
        "guildName": "Failed Server 2",
        "error": "Webhook failed: 404 Not Found"
      }
    ]
  }
}
```

**Response (Duplicate/Skipped)**:
```json
{
  "status": "skipped",
  "message": "Message processing skipped",
  "code": "MESSAGE_SKIPPED",
  "data": {
    "messageId": "1234567890123456789",
    "messageKey": "unique_message_key",
    "reason": "Duplicate message request, already processed"
  }
}
```

### 2. Register Guild for Global Chat

**Endpoint**: `POST /add`

Registers a Discord server to participate in the global chat network.

**Request Body**:
```json
{
  "guildId": "123456789012345678",
  "globalChannelId": "111222333444555666",
  "webhookId": "987654321098765432",
  "webhookToken": "webhook_token_here"
}
```

**Response**:
```json
{
  "status": "ok",
  "message": "Guild added/updated successfully",
  "data": {
    "guild": {
      "id": "123456789012345678",
      "globalChannelId": "111222333444555666",
      "webhookId": "987654321098765432",
      "webhookToken": "webhook_token_here",
      "createdAt": "2025-07-24T10:00:00.000Z",
      "updatedAt": "2025-07-24T10:00:00.000Z"
    },
    "operation": "created",
    "hasWebhook": true
  }
}
```

**Error Response**:
```json
{
  "status": "error",
  "error": "Missing required fields: guildId and globalChannelId are required",
  "code": "MISSING_REQUIRED_FIELDS",
  "data": {
    "provided": { "guildId": true, "globalChannelId": false },
    "required": ["guildId", "globalChannelId"]
  }
}
```

### 3. Remove Guild from Global Chat

**Endpoint**: `DELETE /remove/{guildId}`

Removes a Discord server from the global chat network.

**URL Parameters**:
- `guildId`: The Discord guild ID to remove

**Response**:
```json
{
  "status": "ok",
  "message": "Guild removed from global chat successfully",
  "data": {
    "removedGuild": {
      "id": "123456789012345678",
      "globalChannelId": "111222333444555666",
      "webhookId": "987654321098765432",
      "webhookToken": "webhook_token_here",
      "createdAt": "2025-07-24T10:00:00.000Z",
      "updatedAt": "2025-07-24T10:00:00.000Z"
    },
    "operation": "deleted",
    "removedAt": "2025-07-24T11:30:00.000Z"
  }
}
```

**Error Response (Guild Not Found)**:
```json
{
  "status": "error", 
  "error": "Guild not found in global chat system",
  "code": "GUILD_NOT_FOUND",
  "data": {
    "guildId": "123456789012345678",
    "suggestion": "Check if the guild was ever registered with /add endpoint"
  }
}
```

### 4. List All Registered Guilds

**Endpoint**: `GET /list`

Retrieves all Discord servers registered in the global chat network.

**Response**:
```json
{
  "status": "ok",
  "message": "Guilds retrieved successfully",
  "data": {
    "guilds": [
      {
        "id": "123456789012345678",
        "globalChannelId": "111222333444555666",
        "webhookId": "987654321098765432",
        "webhookToken": "webhook_token_here",
        "createdAt": "2025-07-24T10:00:00.000Z",
        "updatedAt": "2025-07-24T10:00:00.000Z"
      },
      {
        "id": "987654321098765432",
        "globalChannelId": "222333444555666777",
        "webhookId": "111222333444555666",
        "webhookToken": "another_webhook_token",
        "createdAt": "2025-07-24T09:00:00.000Z",
        "updatedAt": "2025-07-24T09:30:00.000Z"
      }
    ],
    "count": 2,
    "timestamp": "2025-07-24T12:00:00.000Z",
    "guildsWithWebhook": 2,
    "guildsWithoutWebhook": 0
  }
}
```

## � Ban System API

The ban system provides comprehensive moderation capabilities with secure authentication, allowing authorized users to ban/unban users and servers from the global chat network.

### Authentication

All ban system endpoints require authentication via API key. Include the API key in the request headers:

```bash
Authorization: Bearer your_api_key_here
```

### 5. Ban User

**Endpoint**: `POST /ban/user`

Bans a user from participating in the global chat network.

**Headers**:
```
Authorization: Bearer your_api_key_here
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "123456789012345678",
  "reason": "Spamming inappropriate content",
  "duration": "7d",
  "bannedBy": "ModeratorName"
}
```

**Request Parameters**:
- `userId` (required): Discord user ID to ban
- `reason` (required): Reason for the ban
- `duration` (optional): Ban duration (e.g., "1h", "30m", "7d", "1w"). If omitted, ban is permanent
- `bannedBy` (required): Name/ID of the person performing the ban

**Response (Success)**:
```json
{
  "status": "success",
  "message": "User banned successfully",
  "data": {
    "ban": {
      "id": 1,
      "userId": "123456789012345678",
      "reason": "Spamming inappropriate content",
      "bannedBy": "ModeratorName",
      "bannedAt": "2025-01-15T10:30:00.000Z",
      "expiresAt": "2025-01-22T10:30:00.000Z",
      "isActive": true
    },
    "notificationsSent": 15,
    "notificationResults": {
      "successful": 14,
      "failed": 1
    }
  }
}
```

### 6. Ban Server

**Endpoint**: `POST /ban/server`

Bans an entire Discord server from participating in the global chat network.

**Headers**:
```
Authorization: Bearer your_api_key_here
Content-Type: application/json
```

**Request Body**:
```json
{
  "serverId": "987654321098765432",
  "reason": "Server allowing spam and harassment",
  "duration": "1w",
  "bannedBy": "AdminName"
}
```

**Request Parameters**:
- `serverId` (required): Discord server/guild ID to ban
- `reason` (required): Reason for the ban
- `duration` (optional): Ban duration (e.g., "1h", "30m", "7d", "1w"). If omitted, ban is permanent
- `bannedBy` (required): Name/ID of the person performing the ban

**Response (Success)**:
```json
{
  "status": "success",
  "message": "Server banned successfully",
  "data": {
    "ban": {
      "id": 2,
      "serverId": "987654321098765432",
      "reason": "Server allowing spam and harassment",
      "bannedBy": "AdminName",
      "bannedAt": "2025-01-15T10:30:00.000Z",
      "expiresAt": "2025-01-22T10:30:00.000Z",
      "isActive": true
    },
    "notificationsSent": 15,
    "notificationResults": {
      "successful": 15,
      "failed": 0
    }
  }
}
```

### 7. Unban User

**Endpoint**: `POST /unban/user`

Removes a ban from a user, allowing them to participate in global chat again.

**Headers**:
```
Authorization: Bearer your_api_key_here
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "123456789012345678",
  "unbannedBy": "ModeratorName"
}
```

**Response (Success)**:
```json
{
  "status": "success",
  "message": "User unbanned successfully",
  "data": {
    "userId": "123456789012345678",
    "unbannedBy": "ModeratorName",
    "unbannedAt": "2025-01-15T11:00:00.000Z",
    "previousBan": {
      "reason": "Spamming inappropriate content",
      "bannedAt": "2025-01-15T10:30:00.000Z",
      "bannedBy": "ModeratorName"
    },
    "notificationsSent": 15,
    "notificationResults": {
      "successful": 15,
      "failed": 0
    }
  }
}
```

### 8. Unban Server

**Endpoint**: `POST /unban/server`

Removes a ban from a Discord server, allowing it to participate in global chat again.

**Headers**:
```
Authorization: Bearer your_api_key_here
Content-Type: application/json
```

**Request Body**:
```json
{
  "serverId": "987654321098765432",
  "unbannedBy": "AdminName"
}
```

**Response (Success)**:
```json
{
  "status": "success",
  "message": "Server unbanned successfully",
  "data": {
    "serverId": "987654321098765432",
    "unbannedBy": "AdminName",
    "unbannedAt": "2025-01-15T11:00:00.000Z",
    "previousBan": {
      "reason": "Server allowing spam and harassment",
      "bannedAt": "2025-01-15T10:30:00.000Z",
      "bannedBy": "AdminName"
    },
    "notificationsSent": 15,
    "notificationResults": {
      "successful": 15,
      "failed": 0
    }
  }
}
```

### 9. List All Bans

**Endpoint**: `GET /bans`

Retrieves all active bans (both users and servers) in the system.

**Headers**:
```
Authorization: Bearer your_api_key_here
```

**Query Parameters**:
- `active` (optional): `true` to show only active bans, `false` to show all bans (default: `true`)
- `type` (optional): `user` or `server` to filter by ban type (default: both)

**Response**:
```json
{
  "status": "success",
  "message": "Bans retrieved successfully",
  "data": {
    "userBans": [
      {
        "id": 1,
        "userId": "123456789012345678",
        "reason": "Spamming inappropriate content",
        "bannedBy": "ModeratorName",
        "bannedAt": "2025-01-15T10:30:00.000Z",
        "expiresAt": "2025-01-22T10:30:00.000Z",
        "isActive": true
      }
    ],
    "serverBans": [
      {
        "id": 2,
        "serverId": "987654321098765432",
        "reason": "Server allowing spam and harassment",
        "bannedBy": "AdminName",
        "bannedAt": "2025-01-15T10:30:00.000Z",
        "expiresAt": "2025-01-22T10:30:00.000Z",
        "isActive": true
      }
    ],
    "counts": {
      "totalUserBans": 1,
      "totalServerBans": 1,
      "activeUserBans": 1,
      "activeServerBans": 1
    }
  }
}
```

### 10. Generate API Key (Admin Only)

**Endpoint**: `POST /admin/api-keys`

Creates a new API key for accessing the ban system. This endpoint requires an existing API key with admin permissions.

**Headers**:
```
Authorization: Bearer your_admin_api_key_here
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Bot Moderator Key",
  "permissions": ["ban_user", "ban_server", "unban_user", "unban_server", "view_bans"],
  "createdBy": "AdminName"
}
```

**Response (Success)**:
```json
{
  "status": "success",
  "message": "API key created successfully",
  "data": {
    "apiKey": "gcapi_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "keyInfo": {
      "id": 2,
      "hashedKey": "sha256_hash_here",
      "name": "Bot Moderator Key",
      "permissions": ["ban_user", "ban_server", "unban_user", "unban_server", "view_bans"],
      "createdBy": "AdminName",
      "createdAt": "2025-01-15T12:00:00.000Z",
      "isActive": true
    }
  }
}
```

### Duration Format

The ban system supports flexible duration formats:

| Format | Examples | Description |
|--------|----------|-------------|
| Minutes | `30m`, `45m` | Ban for specified minutes |
| Hours | `1h`, `12h`, `24h` | Ban for specified hours |
| Days | `1d`, `7d`, `30d` | Ban for specified days |
| Weeks | `1w`, `2w` | Ban for specified weeks |
| Permanent | (omit duration) | Ban never expires automatically |

### Ban Notifications

When a user or server is banned/unbanned, notifications are automatically sent to all registered Discord servers via webhooks. The notification includes:

- **Ban Type**: User or Server ban
- **Target**: The banned user/server information
- **Reason**: Why the ban was applied
- **Duration**: How long the ban will last
- **Moderator**: Who performed the ban action
- **Timestamp**: When the ban was applied

Example notification embed sent to Discord:
```json
{
  "embeds": [
    {
      "title": "🚫 Global Chat Ban Applied",
      "description": "A user has been banned from the global chat network",
      "color": 15158332,
      "fields": [
        {
          "name": "👤 Banned User",
          "value": "123456789012345678",
          "inline": true
        },
        {
          "name": "📝 Reason",
          "value": "Spamming inappropriate content",
          "inline": true
        },
        {
          "name": "⏰ Duration",
          "value": "7 days",
          "inline": true
        },
        {
          "name": "👮 Banned By",
          "value": "ModeratorName",
          "inline": true
        }
      ],
      "timestamp": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

### Error Responses

#### Authentication Errors

```json
{
  "status": "error",
  "message": "Authentication required",
  "code": "AUTHENTICATION_REQUIRED"
}
```

```json
{
  "status": "error",
  "message": "Invalid API key",
  "code": "INVALID_API_KEY"
}
```

```json
{
  "status": "error",
  "message": "Insufficient permissions",
  "code": "INSUFFICIENT_PERMISSIONS",
  "data": {
    "required": ["ban_user"],
    "provided": ["view_bans"]
  }
}
```

#### Validation Errors

```json
{
  "status": "error",
  "message": "Invalid duration format",
  "code": "INVALID_DURATION",
  "data": {
    "provided": "invalid_duration",
    "expected": "Format like: 1h, 30m, 7d, 1w"
  }
}
```

```json
{
  "status": "error",
  "message": "User is already banned",
  "code": "USER_ALREADY_BANNED",
  "data": {
    "userId": "123456789012345678",
    "existingBan": {
      "reason": "Previous violation",
      "bannedAt": "2025-01-10T10:00:00.000Z",
      "expiresAt": "2025-01-17T10:00:00.000Z"
    }
  }
}
```

## �🔧 Core Components

### 1. ApiHandler Class

Main request handler that processes all incoming API requests.

**Key Methods**:
- `handleGlobalChatMessage()` - Processes global chat message broadcasts
- `handleAddGuild()` - Registers new guilds
- `handleRemoveGuild()` - Removes guilds from the system
- `handleGetGuilds()` - Lists all registered guilds

### 2. GlobalChatService Class

Core service for message processing and broadcasting logic.

**Features**:
- Message deduplication using cache system
- Payload generation for Discord webhooks
- Coordinate with WebhookService for message delivery
- Ban status checking before message processing

### 3. WebhookService Class

Handles Discord webhook communication and message delivery.

**Capabilities**:
- Concurrent webhook message sending
- Error handling and retry logic
- Result aggregation and reporting

### 4. MessageCache Class

In-memory caching system for duplicate message prevention.

**Functions**:
- Tracks processed messages by unique keys
- Automatic cache cleanup
- Thread-safe operations

### 5. BanService Class

Comprehensive ban management system for users and servers.

**Features**:
- User and server ban/unban operations
- Time-based ban expiration handling
- Ban notification broadcasting to all servers
- Ban status verification and enforcement
- Duration parsing with flexible formats

### 6. BanApiHandler Class

Specialized handler for all ban-related API endpoints.

**Capabilities**:
- Secure authentication and authorization
- Ban/unban request processing
- Ban listing and filtering
- API key management
- Comprehensive error handling

### 7. AuthMiddleware Class

Authentication and authorization system for secure API access.

**Security Features**:
- API key generation and management
- SHA-256 key hashing for secure storage
- Permission-based access control
- Request authentication validation
- Role-based operation restrictions

## 🚦 Message Processing Flow

```mermaid
graph TD
    A[Discord Message] --> B[Bot Receives Message]
    B --> C[Send to API /chat endpoint]
    C --> D[ApiHandler handleGlobalChatMessage]
    D --> E[GlobalChatService processMessage]
    E --> F{Check Message Cache}
    F -->|Duplicate| G[Return skipped status]
    F -->|New| H[Mark as processed in cache]
    H --> I[Get all registered guilds]
    I --> J[Build webhook payloads]
    J --> K[WebhookService sendToMultipleWebhooks]
    K --> L[Send to Discord webhooks]
    L --> M[Return results]
```

## 🔒 Security & Anti-Loop Features

### Duplicate Message Prevention
- **Message Hashing**: Creates unique keys from message content, author, and metadata
- **Cache-Based Detection**: In-memory cache tracks recently processed messages
- **Automatic Cleanup**: Cache entries expire automatically to prevent memory leaks

### Bot Loop Prevention
- **Origin Filtering**: Messages are not sent back to the originating server
- **Bot Message Filtering**: Bot-generated messages are ignored by default
- **Webhook Detection**: Prevents processing messages sent via webhooks

### Concurrency Control
- **Thread-Safe Operations**: All cache operations are atomic
- **Race Condition Prevention**: Message processing includes proper locking mechanisms
- **Database Transaction Safety**: All database operations are properly synchronized

## 📊 Error Handling

### Error Response Format

All API errors return a consistent JSON format:

```json
{
  "error": "Error message description",
  "details": "Additional error context (optional)"
}
```

### Common HTTP Status Codes

| Status | Meaning | When It Occurs |
|--------|---------|----------------|
| `200` | Success | All webhooks delivered successfully or message was skipped |
| `207` | Multi-Status | Partial success - some webhooks succeeded, some failed |
| `400` | Bad Request | Invalid request body or missing required fields |
| `404` | Not Found | Guild not found or invalid endpoint |
| `500` | Internal Server Error | All webhooks failed or unexpected server-side errors |

### Response Status Types

The API returns different `status` values in the response body:

| Status | HTTP Code | Meaning |
|--------|-----------|---------|  
| `"ok"` | 200 | All webhooks delivered successfully |
| `"partial"` | 207 | Some webhooks succeeded, some failed |
| `"failed"` | 500 | All webhook deliveries failed |
| `"skipped"` | 200 | Message was skipped (duplicate or not from global chat channel) |

### Webhook-Specific Errors

When guilds are missing webhook configuration:

```json
{
  "error": "WEBHOOK_REQUIRED",
  "message": "Some guilds are missing webhook configuration",
  "missingWebhookGuilds": ["guild_id_1", "guild_id_2"],
  "instruction": "Bot must create webhooks for these guilds and update via /add endpoint"
}
```

## 🔧 Development

### Available Scripts

```bash
# Development with hot reload
bun run dev

# Production start
bun run start

# Database operations
bun run db:generate    # Generate migration files
bun run db:push        # Push schema to database
bun run db:studio      # Open Drizzle Studio

# Ban system setup
bun run setup:api-key  # Create initial API key for ban system

# Code formatting
bun run format         # Format code with Biome
```

### Project Structure

```
├── src/
│   ├── index.ts                 # Main server entry point
│   ├── db/
│   │   ├── index.ts            # Database connection setup
│   │   └── schema.ts           # Database schema definition (includes ban tables)
│   ├── types/
│   │   ├── api.ts              # API request/response types
│   │   ├── global-chat.ts      # Global chat message types
│   │   ├── service.ts          # Service layer types
│   │   └── webhook.ts          # Webhook-related types
│   └── utils/
│       ├── ApiHandler.ts       # Main API request handler
│       ├── GlobalChatService.ts # Core message processing
│       ├── GlobalChatHandler.ts # Message formatting logic
│       ├── WebhookService.ts   # Discord webhook communication
│       ├── MessageCache.ts     # Message deduplication cache
│       ├── BanService.ts       # Ban management and enforcement
│       ├── BanApiHandler.ts    # Ban system API endpoints
│       ├── AuthMiddleware.ts   # API authentication system
│       └── index.ts            # Utility exports
├── scripts/
│   └── create-initial-api-key.ts # Initial API key setup script
├── drizzle/                    # Database migrations
├── drizzle.config.ts          # Drizzle ORM configuration
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
├── BAN_SYSTEM_README.md       # Detailed ban system documentation
└── README.md                  # This file
```

### Key Dependencies

- **[Bun](https://bun.sh/)** - JavaScript runtime and package manager
- **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM for database operations
- **[@libsql/client](https://github.com/tursodatabase/libsql-client-ts)** - Turso database client
- **[@dotenvx/dotenvx](https://dotenvx.com/)** - Environment variable management
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation

## 📞 Support & Links

- **Alya-chan Bot**: [https://alyaa.site](https://alyaa.site)
- **Yuki Suou Bot**: [https://yukisuou.xyz](https://yukisuou.xyz)
- **Kythia Bot**: [https://kythia.my.id](https://kythia.my.id)
- **GitHub Repository**: [https://github.com/idMJA/Global-Chat-API](https://github.com/idMJA/Global-Chat-API)

For technical support or questions about integrating with this API, please contact the respective bot developers or create an issue in the GitHub repository.

---

*This API is specifically designed for and maintained by the Alya-chan, Yuki Suou, and Kythia bot development teams. Use with other bots may require modifications.*