## 📁 Command Category: Reaction-role

### 💾 `/reaction-role`

**Description:** 🎭 Manage reaction roles for your server.

### 💻 Usage

`/reaction-role add <message_id> <emoji> <role> [channel]`
`/reaction-role list`
`/reaction-role remove <message_id> <emoji> [channel]`

### 🔧 Subcommands

**`/reaction-role add <message_id> <emoji> <role> [<channel>]`**
> ➕ Add a reaction role to a message.

**Options for this subcommand:**
- **`message_id*`**
  - **Description:** The ID of the message.
  - **Type:** Text
- **`emoji*`**
  - **Description:** The emoji to react with.
  - **Type:** Text
- **`role*`**
  - **Description:** The role to assign.
  - **Type:** Role
- **`channel`**
  - **Description:** The channel where the message is (defaults to current).
  - **Type:** Channel
**`/reaction-role list`**
> 📜 List all reaction roles in this server.


**`/reaction-role remove <message_id> <emoji> [<channel>]`**
> ➖ Remove a reaction role from a message.

**Options for this subcommand:**
- **`message_id*`**
  - **Description:** The ID of the message.
  - **Type:** Text
- **`emoji*`**
  - **Description:** The emoji to remove.
  - **Type:** Text
- **`channel`**
  - **Description:** The channel where the message is (defaults to current).
  - **Type:** Channel


