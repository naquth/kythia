## 📁 Command Category: Verification

### 💾 `/verify`

**Description:** 🛡️ Verification system management

### 💻 Usage

`/verify setup role <role>`
`/verify setup unverified-role <role>`
`/verify setup channel [channel]`
`/verify setup type <type>`
`/verify setup timeout <seconds>`
`/verify setup attempts <count>`
`/verify setup kick-on-fail <enabled>`
`/verify setup kick-on-timeout <enabled>`
`/verify setup log-channel <channel>`
`/verify setup welcome-message <message>`
`/verify status`
`/verify reset <member>`
`/verify force <member>`
`/verify revoke <member>`

### 🔧 Subcommands

**`/verify setup role <role>`**
> Set the role given to verified members

**Options for this subcommand:**
- **`role*`**
  - **Description:** Verified role
  - **Type:** Role
**`/verify setup unverified-role <role>`**
> Role assigned on join (restricts unverified members)

**Options for this subcommand:**
- **`role*`**
  - **Description:** Unverified role
  - **Type:** Role
**`/verify setup channel [<channel>]`**
> Channel where captcha is sent (leave blank for DM only)

**Options for this subcommand:**
- **`channel`**
  - **Description:** Verification channel
  - **Type:** Channel
**`/verify setup type <type>`**
> Captcha challenge type

**Options for this subcommand:**
- **`type*`**
  - **Description:** Type of captcha
  - **Type:** Text
  - **Choices:** `Math (multiple choice buttons)` (`math`), `Emoji click (buttons)` (`emoji`), `Image text (type the code)` (`image`)
**`/verify setup timeout <seconds>`**
> How long members have to complete the captcha (seconds)

**Options for this subcommand:**
- **`seconds*`**
  - **Description:** Timeout in seconds (30–600)
  - **Type:** Integer
**`/verify setup attempts <count>`**
> Max wrong attempts before failing

**Options for this subcommand:**
- **`count*`**
  - **Description:** Max attempts (1–10)
  - **Type:** Integer
**`/verify setup kick-on-fail <enabled>`**
> Kick member if they exceed max attempts

**Options for this subcommand:**
- **`enabled*`**
  - **Description:** Enable?
  - **Type:** Boolean
**`/verify setup kick-on-timeout <enabled>`**
> Kick member if they time out

**Options for this subcommand:**
- **`enabled*`**
  - **Description:** Enable?
  - **Type:** Boolean
**`/verify setup log-channel <channel>`**
> Channel to log verification events

**Options for this subcommand:**
- **`channel*`**
  - **Description:** Log channel
  - **Type:** Channel
**`/verify setup welcome-message <message>`**
> DM sent to members after they verify

**Options for this subcommand:**
- **`message*`**
  - **Description:** Welcome message text (or "none" to disable)
  - **Type:** Text
**`/verify status`**
> View current verification config


**`/verify reset <member>`**
> Re-send captcha to a member

**Options for this subcommand:**
- **`member*`**
  - **Description:** Target member
  - **Type:** User
**`/verify force <member>`**
> Manually verify a member (skip captcha)

**Options for this subcommand:**
- **`member*`**
  - **Description:** Target member
  - **Type:** User
**`/verify revoke <member>`**
> Remove verified role from a member

**Options for this subcommand:**
- **`member*`**
  - **Description:** Target member
  - **Type:** User


