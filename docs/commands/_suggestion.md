## 📁 Command Category: _suggestion

### 💾 `/suggestion`

**Description:** 💡 Manage suggestions for the server.

### 💻 Usage

`/suggestion decision <action> <id> <reason>`
`/suggestion delete <id>`
`/suggestion setup <channel> [admin_role] [upvote_emoji] [downvote_emoji]`
`/suggestion suggest <query> [image]`

### 🔧 Subcommands

**`/suggestion decision <action> <id> <reason>`**
> Accept or deny a suggestion.

**Options for this subcommand:**
- **`action*`**
  - **Description:** Action to take
  - **Type:** Text
  - **Choices:** `Accept` (`accept`), `Deny` (`deny`)
- **`id*`**
  - **Description:** Suggestion ID (local ID)
  - **Type:** Integer
- **`reason*`**
  - **Description:** Reason for the decision
  - **Type:** Text
**`/suggestion delete <id>`**
> Delete a suggestion.

**Options for this subcommand:**
- **`id*`**
  - **Description:** Suggestion ID (local ID)
  - **Type:** Integer
**`/suggestion setup <channel> [<admin_role>] [<upvote_emoji>] [<downvote_emoji>]`**
> Configure suggestion system settings.

**Options for this subcommand:**
- **`channel*`**
  - **Description:** Channel to post suggestions in
  - **Type:** Channel
- **`admin_role`**
  - **Description:** Role that can manage suggestions (accept/deny)
  - **Type:** Role
- **`upvote_emoji`**
  - **Description:** Custom emoji for upvotes
  - **Type:** Text
- **`downvote_emoji`**
  - **Description:** Custom emoji for downvotes
  - **Type:** Text
**`/suggestion suggest <query> [<image>]`**
> Submit a new suggestion.

**Options for this subcommand:**
- **`query*`**
  - **Description:** Your suggestion text
  - **Type:** Text
- **`image`**
  - **Description:** Optional image attachment
  - **Type:** Attachment


