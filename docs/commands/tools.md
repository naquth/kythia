## 📁 Command Category: Tools

### 💾 `/ascii`

**Description:** 🎨 Generate ASCII art from your text using figlet.

### 📋 Details

- **Cooldown:** 15 seconds
### 💻 Usage

`/ascii <text> [font] [allfonts]`

### ⚙️ Options

- **`text*`**
  - **Description:** The text to convert to ASCII art
  - **Type:** Text
- **`font`**
  - **Description:** The figlet font to use (eg: Standard, Slant, Larry 3D, etc.)
  - **Type:** Text
- **`allfonts`**
  - **Description:** Generate ASCII art with ALL fonts
  - **Type:** Boolean


### 💾 `/avatar`

**Description:** 🖼️ Show user avatar.

### 💻 Usage

`/avatar [user]`

### ⚙️ Options

- **`user`**
  - **Description:** The user whose avatar you want to see.
  - **Type:** User


### 💾 `/crack-hash`

**Description:** 🔍 Try to lookup a hash from public databases (MD5, SHA1, SHA256, SHA512).

### 💻 Usage

`/crack-hash <algorithm> <hash>`

### ⚙️ Options

- **`algorithm*`**
  - **Description:** The hash algorithm to lookup
  - **Type:** Text
  - **Choices:** `MD5` (`md5`), `SHA1` (`sha1`), `SHA256` (`sha256`), `SHA512` (`sha512`)
- **`hash*`**
  - **Description:** The hash to try to lookup
  - **Type:** Text


### 💾 `/decrypt`

**Description:** 🔓 Decrypt data using the correct secret key.

### 💻 Usage

`/decrypt <encrypted-data> <secret-key>`

### ⚙️ Options

- **`encrypted-data*`**
  - **Description:** The full encrypted string from the /encrypt command
  - **Type:** Text
- **`secret-key*`**
  - **Description:** The 32-character secret key used for encryption
  - **Type:** Text


### 💾 `/encrypt`

**Description:** 🔒 Encrypt a text with a secret key (two-way encryption).

### 💻 Usage

`/encrypt <text> <secret-key>`

### ⚙️ Options

- **`text*`**
  - **Description:** The text you want to encrypt
  - **Type:** Text
- **`secret-key*`**
  - **Description:** A 32-character secret key for encryption
  - **Type:** Text


### 💾 `/hash`

**Description:** 🔒 Hash a text string using MD5, SHA, or other algorithms.

### 💻 Usage

`/hash <algorithm> <text>`

### ⚙️ Options

- **`algorithm*`**
  - **Description:** The hash algorithm to use
  - **Type:** Text
  - **Choices:** `MD5` (`md5`), `SHA1` (`sha1`), `SHA224` (`sha224`), `SHA256` (`sha256`), `SHA384` (`sha384`), `SHA512` (`sha512`), `SHA3-256` (`sha3-256`), `SHA3-512` (`sha3-512`), `RIPEMD160` (`ripemd160`)
- **`text*`**
  - **Description:** The text to hash
  - **Type:** Text


### 💾 `/instagram`

**Description:** 📸 Get and play an Instagram post/reel by link.

### 💻 Usage

`/instagram <link>`

### ⚙️ Options

- **`link*`**
  - **Description:** The Instagram post/reel link
  - **Type:** Text


### 💾 `/nickprefix`

**Description:** 📛 Adds or removes a prefix from member nicknames.

### 💻 Usage

`/nickprefix add`
`/nickprefix remove`

### 🔧 Subcommands

**`/nickprefix add`**
> 📛 Adds the highest role prefix to member nicknames.


**`/nickprefix remove`**
> 📛 Removes the prefix from member nicknames.




### 💾 `/obfuscate`

**Description:** 🔒 Obfuscate a Lua or JavaScript file and return it as an attachment.

### 💻 Usage

`/obfuscate <type> <file>`

### ⚙️ Options

- **`type*`**
  - **Description:** The type of script to obfuscate (lua/javascript)
  - **Type:** Text
  - **Choices:** `javascript` (`javascript`), `lua` (`lua`)
- **`file*`**
  - **Description:** The script file to obfuscate
  - **Type:** Attachment


### 💾 `/sticky`

**Description:** 📌 Manage sticky messages in a channel.

### 💻 Usage

`/sticky set <message>`
`/sticky remove`

### 🔧 Subcommands

**`/sticky set <message>`**
> Sets a sticky message for this channel.

**Options for this subcommand:**
- **`message*`**
  - **Description:** The content of the sticky message.
  - **Type:** Text
**`/sticky remove`**
> Removes the sticky message from this channel.




### 💾 `/tiktok`

**Description:** 🎬 Get and play a TikTok video by link.

### 💻 Usage

`/tiktok <link>`

### ⚙️ Options

- **`link*`**
  - **Description:** The TikTok video link
  - **Type:** Text


