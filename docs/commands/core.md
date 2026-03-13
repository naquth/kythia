## 📁 Command Category: Core

### 💾 `/set`

**Description:** ⚙️ Settings bot configuration

### 💻 Usage

`/set stats category <category>`
`/set stats add <format> [channel]`
`/set stats edit <stats> [channel] [format]`
`/set stats enable <stats>`
`/set stats disable <stats>`
`/set stats remove <stats>`
`/set admin edit <action> <target>`
`/set admin admin-list`
`/set leveling channel <channel>`
`/set leveling cooldown <cooldown>`
`/set leveling xp <xp>`
`/set leveling rolereward <action> <level> <role>`
`/set language set <lang>`
`/set testimony testimony-channel <channel>`
`/set testimony feedback-channel <channel>`
`/set testimony count-channel <channel>`
`/set testimony count-format <format>`
`/set testimony reset-count`
`/set testimony count <count>`
`/set ai add-channel <channel>`
`/set ai remove-channel <channel>`
`/set ai list`
`/set channels announcement <channel>`
`/set channels invite <channel>`
`/set booster channel <channel>`
`/set booster message <message>`
`/set streak-settings minimum <minimum>`
`/set streak-settings emoji <emoji>`
`/set streak-settings nickname <status>`
`/set raw set <field> <value>`
`/set streak rolereward <action> <streak> <role>`
`/set view`
`/set features server-stats <status>`
`/set features leveling <status>`
`/set features adventure <status>`
`/set features minecraft-stats <status>`
`/set features streak <status>`
`/set features invites <status>`
`/set features boost-log <status>`

### 🔧 Subcommands

**`/set stats category <category>`**
> 📈 Set category for server stats channels

**Options for this subcommand:**
- **`category*`**
  - **Description:** Category channel
  - **Type:** Channel
**`/set stats add <format> [<channel>]`**
> 📈 Add a new stat for a specific channel

**Options for this subcommand:**
- **`format*`**
  - **Description:** Stat format, e.g.: {memberstotal}
  - **Type:** Text
- **`channel`**
  - **Description:** 📈 Select a channel to use as stat (if not selected, the bot will create a new channel)
  - **Type:** Channel
**`/set stats edit <stats> [<channel>] [<format>]`**
> 📈 Edit the format of an existing stat channel

**Options for this subcommand:**
- **`stats*`**
  - **Description:** Select the stat to edit
  - **Type:** Text
- **`channel`**
  - **Description:** 📈 Edit stat channel
  - **Type:** Channel
- **`format`**
  - **Description:** 📈 Edit stat format, e.g.: {membersonline}
  - **Type:** Text
**`/set stats enable <stats>`**
> 📈 Enable stat channel

**Options for this subcommand:**
- **`stats*`**
  - **Description:** Select the stat to enable
  - **Type:** Text
**`/set stats disable <stats>`**
> 📈 Disable stat channel

**Options for this subcommand:**
- **`stats*`**
  - **Description:** Select the stat to disable
  - **Type:** Text
**`/set stats remove <stats>`**
> 📈 Delete the stat and its channel

**Options for this subcommand:**
- **`stats*`**
  - **Description:** Select the stat to delete
  - **Type:** Text
**`/set admin edit <action> <target>`**
> 🔒 Add or remove admin

**Options for this subcommand:**
- **`action*`**
  - **Description:** Add or remove
  - **Type:** Text
  - **Choices:** `Add` (`add`), `Remove` (`remove`)
- **`target*`**
  - **Description:** User or role admin
  - **Type:** Mentionable
**`/set admin admin-list`**
> View admin list


**`/set leveling channel <channel>`**
> 🎮 Set channel for level up messages

**Options for this subcommand:**
- **`channel*`**
  - **Description:** Channel for level up messages
  - **Type:** Channel
**`/set leveling cooldown <cooldown>`**
> 🎮 Set XP gain cooldown

**Options for this subcommand:**
- **`cooldown*`**
  - **Description:** Cooldown in seconds
  - **Type:** Integer
**`/set leveling xp <xp>`**
> 🎮 Set XP amount per message

**Options for this subcommand:**
- **`xp*`**
  - **Description:** XP gained per message
  - **Type:** Integer
**`/set leveling rolereward <action> <level> <role>`**
> 🎮 Set role reward for a specific level

**Options for this subcommand:**
- **`action*`**
  - **Description:** Add or remove role reward
  - **Type:** Text
  - **Choices:** `Add` (`add`), `Remove` (`remove`)
- **`level*`**
  - **Description:** Required level
  - **Type:** Integer
- **`role*`**
  - **Description:** Role to be given
  - **Type:** Role
**`/set language set <lang>`**
> 🌐 Set bot language

**Options for this subcommand:**
- **`lang*`**
  - **Description:** Choose language
  - **Type:** Text
  - **Choices:** `en-US` (`en-US`)
**`/set testimony testimony-channel <channel>`**
> 💬 Set channel to send testimonies

**Options for this subcommand:**
- **`channel*`**
  - **Description:** Testimony channel
  - **Type:** Channel
**`/set testimony feedback-channel <channel>`**
> 💬 Set channel for testimony feedback

**Options for this subcommand:**
- **`channel*`**
  - **Description:** Testimony feedback channel
  - **Type:** Channel
**`/set testimony count-channel <channel>`**
> 💬 Set channel to display testimony count (name will be changed automatically)

**Options for this subcommand:**
- **`channel*`**
  - **Description:** Testimony counter channel
  - **Type:** Channel
**`/set testimony count-format <format>`**
> 💬 Set channel name format for testimony counter

**Options for this subcommand:**
- **`format*`**
  - **Description:** Channel name format, use {count} for the number. Example: testimony-{count}
  - **Type:** Text
**`/set testimony reset-count`**
> 💬 Reset testimony count to 0


**`/set testimony count <count>`**
> 💬 Change testimony count

**Options for this subcommand:**
- **`count*`**
  - **Description:** New testimony count
  - **Type:** Integer
**`/set ai add-channel <channel>`**
> 🤖 Allow a channel to use AI

**Options for this subcommand:**
- **`channel*`**
  - **Description:** Channel
  - **Type:** Channel
**`/set ai remove-channel <channel>`**
> 🤖 Disallow a channel from using AI

**Options for this subcommand:**
- **`channel*`**
  - **Description:** Channel
  - **Type:** Channel
**`/set ai list`**
> 🤖 List AI-enabled channels


**`/set channels announcement <channel>`**
> 📢 Set announcement channel

**Options for this subcommand:**
- **`channel*`**
  - **Description:** Channel
  - **Type:** Channel
**`/set channels invite <channel>`**
> 📢 Set invite log channel

**Options for this subcommand:**
- **`channel*`**
  - **Description:** Channel
  - **Type:** Channel
**`/set booster channel <channel>`**
> 🚀 Set boost log channel

**Options for this subcommand:**
- **`channel*`**
  - **Description:** Channel for boost logs
  - **Type:** Channel
**`/set booster message <message>`**
> 🚀 Set boost log message

**Options for this subcommand:**
- **`message*`**
  - **Description:** Custom message for boost logs (use placeholders like {username}, {displayName})
  - **Type:** Text
**`/set streak-settings minimum <minimum>`**
> 🔥 Set minimum streak

**Options for this subcommand:**
- **`minimum*`**
  - **Description:** Minimum streak
  - **Type:** Integer
**`/set streak-settings emoji <emoji>`**
> 🔥 Set streak emoji

**Options for this subcommand:**
- **`emoji*`**
  - **Description:** Emoji
  - **Type:** Text
**`/set streak-settings nickname <status>`**
> 🔥 Toggle auto-nickname for streak

**Options for this subcommand:**
- **`status*`**
  - **Description:** Select status
  - **Type:** Text
  - **Choices:** `Enable` (`enable`), `Disable` (`disable`)
**`/set raw set <field> <value>`**
> 🧰 Set any field (admin only)

**Options for this subcommand:**
- **`field*`**
  - **Description:** Field name
  - **Type:** Text
- **`value*`**
  - **Description:** Value
  - **Type:** Text
**`/set streak rolereward <action> <streak> <role>`**
> 🔥 Set role reward for a specific streak

**Options for this subcommand:**
- **`action*`**
  - **Description:** Add or remove role reward
  - **Type:** Text
  - **Choices:** `Add` (`add`), `Remove` (`remove`)
- **`streak*`**
  - **Description:** Required streak
  - **Type:** Integer
- **`role*`**
  - **Description:** Role to be given
  - **Type:** Role
**`/set view`**
> 🔍 View all bot settings


**`/set features server-stats <status>`**
> Enable or disable the Server Stats feature

**Options for this subcommand:**
- **`status*`**
  - **Description:** Select status
  - **Type:** Text
  - **Choices:** `Enable` (`enable`), `Disable` (`disable`)
**`/set features leveling <status>`**
> Enable or disable the Leveling feature

**Options for this subcommand:**
- **`status*`**
  - **Description:** Select status
  - **Type:** Text
  - **Choices:** `Enable` (`enable`), `Disable` (`disable`)
**`/set features adventure <status>`**
> Enable or disable the Adventure feature

**Options for this subcommand:**
- **`status*`**
  - **Description:** Select status
  - **Type:** Text
  - **Choices:** `Enable` (`enable`), `Disable` (`disable`)
**`/set features minecraft-stats <status>`**
> Enable or disable the Minecraft Stats feature

**Options for this subcommand:**
- **`status*`**
  - **Description:** Select status
  - **Type:** Text
  - **Choices:** `Enable` (`enable`), `Disable` (`disable`)
**`/set features streak <status>`**
> Enable or disable the Streak feature

**Options for this subcommand:**
- **`status*`**
  - **Description:** Select status
  - **Type:** Text
  - **Choices:** `Enable` (`enable`), `Disable` (`disable`)
**`/set features invites <status>`**
> Enable or disable the Invites feature

**Options for this subcommand:**
- **`status*`**
  - **Description:** Select status
  - **Type:** Text
  - **Choices:** `Enable` (`enable`), `Disable` (`disable`)
**`/set features boost-log <status>`**
> Enable or disable the Boost Log feature

**Options for this subcommand:**
- **`status*`**
  - **Description:** Select status
  - **Type:** Text
  - **Choices:** `Enable` (`enable`), `Disable` (`disable`)


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


### 💾 `/tiktok`

**Description:** 🎬 Get and play a TikTok video by link.

### 💻 Usage

`/tiktok <link>`

### ⚙️ Options

- **`link*`**
  - **Description:** The TikTok video link
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




### 💾 `/sticky`

**Description:** 📌 Manage sticky messages in a channel.

### 💻 Usage

`/sticky list`
`/sticky remove`
`/sticky set <message>`

### 🔧 Subcommands

**`/sticky list`**
> 📋 List all sticky messages in this server.


**`/sticky remove`**
> Removes the sticky message from this channel.


**`/sticky set <message>`**
> Sets a sticky message for this channel.

**Options for this subcommand:**
- **`message*`**
  - **Description:** The content of the sticky message.
  - **Type:** Text


### 💾 `/about`

**Description:** 😋 A brief introduction about kythia

### 📋 Details

- **Aliases:** `abt`, `🌸`
### 💻 Usage

`/about`



### 💾 `/afk`

**Description:** 💤 Set your Away From Keyboard (AFK) status.

### 💻 Usage

`/afk [reason]`

### ⚙️ Options

- **`reason`**
  - **Description:** The reason for being AFK.
  - **Type:** Text


### 💾 `/cache`

**Description:** Shows cache statistics.

### 💻 Usage

`/cache`



### 💾 `/debug-cache`

**Description:** 🛠️ [DEV] Run diagnostic tests on KythiaModel (Music Edition).

### 💻 Usage

`/debug-cache`



### 💾 `/grab`

**Description:** 🛍️ grab stickers or emojis from messages.

### 💻 Usage

`/grab sticker <sticker_id>`
`/grab emoji <emoji>`

### 🔧 Subcommands

**`/grab sticker <sticker_id>`**
> Grab a sticker from a message

**Options for this subcommand:**
- **`sticker_id*`**
  - **Description:** Sticker ID to grab
  - **Type:** Text
**`/grab emoji <emoji>`**
> Grab a custom emoji from a message

**Options for this subcommand:**
- **`emoji*`**
  - **Description:** Emoji to grab (custom emoji format)
  - **Type:** Text


### 💾 `/help`

**Description:** 💡 Displays a list of bot commands with complete details.

### 📋 Details

- **Aliases:** `h`, `ℹ️`
### 💻 Usage

`/help`



### 💾 `/legal`

**Description:** ⚖️ View the Terms of Service and Privacy Policy

### 💻 Usage

`/legal`



### 💾 `/ping`

**Description:** 🔍 Checks the bot's, Discord API's, database and cache/redis connection speed.

### 📋 Details

- **Aliases:** `p`, `pong`, `🏓`
### 💻 Usage

`/ping`



### 💾 `/report`

**Description:** 🚨 Report a user to the moderators.

### 💻 Usage

`/report <user> <reason>`

### ⚙️ Options

- **`user*`**
  - **Description:** User to report
  - **Type:** User
- **`reason*`**
  - **Description:** Reason for the report
  - **Type:** Text


### 💾 `/serverinfo`

**Description:** 📰 Displays detailed information about the server.

### 💻 Usage

`/serverinfo`



### 💾 `/stats`

**Description:** 📊 Displays kythia statistics.

### 📋 Details

- **Aliases:** `s`, `📊`
### 💻 Usage

`/stats`



### 💾 `/userinfo`

**Description:** 📄 Displays information about a user.

### 💻 Usage

`/userinfo [user]`

### ⚙️ Options

- **`user`**
  - **Description:** User to get info about
  - **Type:** User


### 💾 `/vote`

**Description:** ❤️ Vote for kythia on top.gg!

### 📋 Details

- **Aliases:** `v`
### 💻 Usage

`/vote`



### 💾 `/convert`

**Description:** 🔄 Convert between units, currencies, etc.

### 💻 Usage

`/convert area <from> <to> <value>`
`/convert currency <from> <to> <amount>`
`/convert data <from> <to> <value>`
`/convert length <from> <to> <value>`
`/convert mass <from> <to> <value>`
`/convert temperature <from> <to> <value>`
`/convert volume <from> <to> <value>`

### 🔧 Subcommands

**`/convert area <from> <to> <value>`**
> 🟦 Convert area units (e.g. m² to acre)

**Options for this subcommand:**
- **`from*`**
  - **Description:** From unit
  - **Type:** Text
  - **Choices:** `Square Meter (m²)` (`sqm`), `Square Kilometer (km²)` (`sqkm`), `Square Mile (mi²)` (`sqmi`), `Square Yard (yd²)` (`sqyd`), `Square Foot (ft²)` (`sqft`), `Square Inch (in²)` (`sqin`), `Hectare (ha)` (`ha`), `Acre (acre)` (`acre`)
- **`to*`**
  - **Description:** To unit
  - **Type:** Text
  - **Choices:** `Square Meter (m²)` (`sqm`), `Square Kilometer (km²)` (`sqkm`), `Square Mile (mi²)` (`sqmi`), `Square Yard (yd²)` (`sqyd`), `Square Foot (ft²)` (`sqft`), `Square Inch (in²)` (`sqin`), `Hectare (ha)` (`ha`), `Acre (acre)` (`acre`)
- **`value*`**
  - **Description:** Value to convert
  - **Type:** Number
**`/convert currency <from> <to> <amount>`**
> 💰 Convert currency (e.g. USD to IDR)

**Options for this subcommand:**
- **`from*`**
  - **Description:** Currency code (e.g. USD)
  - **Type:** Text
- **`to*`**
  - **Description:** Currency code to convert to (e.g. IDR)
  - **Type:** Text
- **`amount*`**
  - **Description:** Amount to convert
  - **Type:** Number
**`/convert data <from> <to> <value>`**
> 💾 Convert data storage units (e.g. MB to GB)

**Options for this subcommand:**
- **`from*`**
  - **Description:** From unit
  - **Type:** Text
  - **Choices:** `Byte (B)` (`b`), `Kilobyte (KB)` (`kb`), `Megabyte (MB)` (`mb`), `Gigabyte (GB)` (`gb`), `Terabyte (TB)` (`tb`), `Petabyte (PB)` (`pb`), `Exabyte (EB)` (`eb`), `Zettabyte (ZB)` (`zb`), `Yottabyte (YB)` (`yb`), `Bit (bit)` (`bit`)
- **`to*`**
  - **Description:** To unit
  - **Type:** Text
  - **Choices:** `Byte (B)` (`b`), `Kilobyte (KB)` (`kb`), `Megabyte (MB)` (`mb`), `Gigabyte (GB)` (`gb`), `Terabyte (TB)` (`tb`), `Petabyte (PB)` (`pb`), `Exabyte (EB)` (`eb`), `Zettabyte (ZB)` (`zb`), `Yottabyte (YB)` (`yb`), `Bit (bit)` (`bit`)
- **`value*`**
  - **Description:** Value to convert
  - **Type:** Number
**`/convert length <from> <to> <value>`**
> 📏 Convert length units (e.g. m to km)

**Options for this subcommand:**
- **`from*`**
  - **Description:** From unit
  - **Type:** Text
  - **Choices:** `Meter (m)` (`m`), `Kilometer (km)` (`km`), `Centimeter (cm)` (`cm`), `Millimeter (mm)` (`mm`), `Mile (mi)` (`mi`), `Yard (yd)` (`yd`), `Foot (ft)` (`ft`), `Inch (in)` (`in`), `Nautical Mile (nm)` (`nm`), `Astronomical Unit (au)` (`au`), `Light Year (ly)` (`ly`)
- **`to*`**
  - **Description:** To unit
  - **Type:** Text
  - **Choices:** `Meter (m)` (`m`), `Kilometer (km)` (`km`), `Centimeter (cm)` (`cm`), `Millimeter (mm)` (`mm`), `Mile (mi)` (`mi`), `Yard (yd)` (`yd`), `Foot (ft)` (`ft`), `Inch (in)` (`in`), `Nautical Mile (nm)` (`nm`), `Astronomical Unit (au)` (`au`), `Light Year (ly)` (`ly`)
- **`value*`**
  - **Description:** Value to convert
  - **Type:** Number
**`/convert mass <from> <to> <value>`**
> ⚖️ Convert mass units (e.g. kg to lb)

**Options for this subcommand:**
- **`from*`**
  - **Description:** From unit
  - **Type:** Text
  - **Choices:** `Kilogram (kg)` (`kg`), `Gram (g)` (`g`), `Milligram (mg)` (`mg`), `Ton (ton)` (`ton`), `Pound (lb)` (`lb`), `Ounce (oz)` (`oz`), `Stone (st)` (`st`), `Carat (ct)` (`ct`), `Slug (slug)` (`slug`)
- **`to*`**
  - **Description:** To unit
  - **Type:** Text
  - **Choices:** `Kilogram (kg)` (`kg`), `Gram (g)` (`g`), `Milligram (mg)` (`mg`), `Ton (ton)` (`ton`), `Pound (lb)` (`lb`), `Ounce (oz)` (`oz`), `Stone (st)` (`st`), `Carat (ct)` (`ct`), `Slug (slug)` (`slug`)
- **`value*`**
  - **Description:** Value to convert
  - **Type:** Number
**`/convert temperature <from> <to> <value>`**
> 🌡️ Convert temperature (C, F, K, R, Re)

**Options for this subcommand:**
- **`from*`**
  - **Description:** From unit
  - **Type:** Text
  - **Choices:** `Celsius (C)` (`c`), `Fahrenheit (F)` (`f`), `Kelvin (K)` (`k`), `Rankine (R)` (`r`), `Réaumur (Re)` (`re`)
- **`to*`**
  - **Description:** To unit
  - **Type:** Text
  - **Choices:** `Celsius (C)` (`c`), `Fahrenheit (F)` (`f`), `Kelvin (K)` (`k`), `Rankine (R)` (`r`), `Réaumur (Re)` (`re`)
- **`value*`**
  - **Description:** Value to convert
  - **Type:** Number
**`/convert volume <from> <to> <value>`**
> 🧪 Convert volume units (e.g. L to gal)

**Options for this subcommand:**
- **`from*`**
  - **Description:** From unit
  - **Type:** Text
  - **Choices:** `Liter (L)` (`l`), `Milliliter (mL)` (`ml`), `Cubic Meter (m³)` (`m3`), `Cubic Centimeter (cm³)` (`cm3`), `Gallon (gal)` (`gal`), `Quart (qt)` (`qt`), `Pint (pt)` (`pt`), `Cup (cup)` (`cup`), `Fluid Ounce (fl oz)` (`floz`), `Tablespoon (tbsp)` (`tbsp`), `Teaspoon (tsp)` (`tsp`)
- **`to*`**
  - **Description:** To unit
  - **Type:** Text
  - **Choices:** `Liter (L)` (`l`), `Milliliter (mL)` (`ml`), `Cubic Meter (m³)` (`m3`), `Cubic Centimeter (cm³)` (`cm3`), `Gallon (gal)` (`gal`), `Quart (qt)` (`qt`), `Pint (pt)` (`pt`), `Cup (cup)` (`cup`), `Fluid Ounce (fl oz)` (`floz`), `Tablespoon (tbsp)` (`tbsp`), `Teaspoon (tsp)` (`tsp`)
- **`value*`**
  - **Description:** Value to convert
  - **Type:** Number


