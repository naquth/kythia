## 📁 Command Category: Moderation

### 💾 `/mod`

**Description:** Moderation action

### 💻 Usage

`/mod announce <message> [title]`
`/mod autosetup`
`/mod ban <user> [reason]`
`/mod clear <amount>`
`/mod kick <user> [reason]`
`/mod lock [reason]`
`/mod mute <user> [reason]`
`/mod pin <message_id>`
`/mod role <user> <role>`
`/mod say <message>`
`/mod slowmode <seconds> [reason]`
`/mod timeout <user> <duration> [reason]`
`/mod unban <user_id>`
`/mod unlock [reason]`
`/mod unmute <user>`
`/mod unpin <message_id>`
`/mod warn <user> [reason]`
`/mod warnings <user>`

### 🔧 Subcommands

**`/mod announce <message> [<title>]`**
> 📢 Sends an announcement to the current channel.

**Options for this subcommand:**
- **`message*`**
  - **Description:** The message to announce
  - **Type:** Text
- **`title`**
  - **Description:** Title for the announcement
  - **Type:** Text
**`/mod autosetup`**
> 🤖 Automatically setup moderation channels and roles.


**`/mod ban <user> [<reason>]`**
> 🔨 Bans a user from the server.

**Options for this subcommand:**
- **`user*`**
  - **Description:** The user to ban
  - **Type:** User
- **`reason`**
  - **Description:** Reason for the ban
  - **Type:** Text
**`/mod clear <amount>`**
> 🗑️ Delete messages from a channel.

**Options for this subcommand:**
- **`amount*`**
  - **Description:** Amount of messages to delete (0 = all)
  - **Type:** Integer
**`/mod kick <user> [<reason>]`**
> 👢 Kicks a user from the server.

**Options for this subcommand:**
- **`user*`**
  - **Description:** The user to kick
  - **Type:** User
- **`reason`**
  - **Description:** Reason for the kick
  - **Type:** Text
**`/mod lock [<reason>]`**
> 🔒 Locks the current channel.

**Options for this subcommand:**
- **`reason`**
  - **Description:** Reason for locking the channel
  - **Type:** Text
**`/mod mute <user> [<reason>]`**
> 🔇 Mutes a user in voice channels.

**Options for this subcommand:**
- **`user*`**
  - **Description:** The user to mute
  - **Type:** User
- **`reason`**
  - **Description:** Reason for the mute
  - **Type:** Text
**`/mod pin <message_id>`**
> 📌 Pins a message in the channel.

**Options for this subcommand:**
- **`message_id*`**
  - **Description:** The ID of the message to pin
  - **Type:** Text
**`/mod role <user> <role>`**
> 🎭 Manage roles for a user.

**Options for this subcommand:**
- **`user*`**
  - **Description:** The user to modify roles for
  - **Type:** User
- **`role*`**
  - **Description:** The role to add or remove
  - **Type:** Role
**`/mod say <message>`**
> 🗣️ Makes the bot say something.

**Options for this subcommand:**
- **`message*`**
  - **Description:** The message to say
  - **Type:** Text
**`/mod slowmode <seconds> [<reason>]`**
> 🐢 Sets the slowmode for the current channel.

**Options for this subcommand:**
- **`seconds*`**
  - **Description:** Slowmode duration in seconds (0 to disable)
  - **Type:** Integer
- **`reason`**
  - **Description:** Reason for changing slowmode
  - **Type:** Text
**`/mod timeout <user> <duration> [<reason>]`**
> ⏳ Timeouts a user.

**Options for this subcommand:**
- **`user*`**
  - **Description:** The user to timeout
  - **Type:** User
- **`duration*`**
  - **Description:** Duration in minutes
  - **Type:** Integer
- **`reason`**
  - **Description:** Reason for the timeout
  - **Type:** Text
**`/mod unban <user_id>`**
> 🔓 Unbans a user from the server.

**Options for this subcommand:**
- **`user_id*`**
  - **Description:** The ID of the user to unban
  - **Type:** Text
**`/mod unlock [<reason>]`**
> 🔓 Unlocks the current channel.

**Options for this subcommand:**
- **`reason`**
  - **Description:** Reason for unlocking the channel
  - **Type:** Text
**`/mod unmute <user>`**
> 🔊 Unmutes a user in voice channels.

**Options for this subcommand:**
- **`user*`**
  - **Description:** The user to unmute
  - **Type:** User
**`/mod unpin <message_id>`**
> 📌 Unpins a message from the channel.

**Options for this subcommand:**
- **`message_id*`**
  - **Description:** The ID of the message to unpin
  - **Type:** Text
**`/mod warn <user> [<reason>]`**
> ⚠️ Warns a user.

**Options for this subcommand:**
- **`user*`**
  - **Description:** The user to warn
  - **Type:** User
- **`reason`**
  - **Description:** Reason for the warning
  - **Type:** Text
**`/mod warnings <user>`**
> ⚠️ View warnings for a user.

**Options for this subcommand:**
- **`user*`**
  - **Description:** The user to view warnings for
  - **Type:** User


