## 📁 Command Category: Minecraft

### 💾 `/minecraft`

**Description:** ⛏️ Minecraft: Java Edition player lookup commands

### 💻 Usage

`/minecraft player avatar <player>`
`/minecraft player body <player>`
`/minecraft player head <player>`
`/minecraft player help`
`/minecraft player pose <player> <pose> [crop]`
`/minecraft player skin <player>`
`/minecraft player wallpaper <wallpaper> <players>`
`/minecraft server status <host> [type]`
`/minecraft set autosetup <host> [port] [category_name]`
`/minecraft set ip-channel <channel>`
`/minecraft set ip <ip>`
`/minecraft set port-channel <channel>`
`/minecraft set port <port>`
`/minecraft set status-channel <channel>`

### 🔧 Subcommands

**`/minecraft player avatar <player>`**
> Shows the Minecraft: Java Edition avatar of the provided player name

**Options for this subcommand:**
- **`player*`**
  - **Description:** The Minecraft Java Edition player name
  - **Type:** Text
**`/minecraft player body <player>`**
> Shows the Minecraft: Java Edition body of the provided player name

**Options for this subcommand:**
- **`player*`**
  - **Description:** The Minecraft Java Edition player name
  - **Type:** Text
**`/minecraft player head <player>`**
> Shows the Minecraft: Java Edition head of the provided player name

**Options for this subcommand:**
- **`player*`**
  - **Description:** The Minecraft Java Edition player name
  - **Type:** Text
**`/minecraft player help`**
> 📖 View all Minecraft addon commands and features


**`/minecraft player pose <player> <pose> [<crop>]`**
> 🎭 Render a player in any Starlight Skins pose

**Options for this subcommand:**
- **`player*`**
  - **Description:** Minecraft player name or UUID
  - **Type:** Text
- **`pose*`**
  - **Description:** Render type — choose from poses 1–25
  - **Type:** Text
  - **Choices:** `Default` (`default`), `Marching` (`marching`), `Walking` (`walking`), `Crouching` (`crouching`), `Crossed` (`crossed`), `Criss Cross` (`criss_cross`), `Ultimate` (`ultimate`), `Isometric` (`isometric`), `Head` (`head`), `Custom` (`custom`), `Cheering` (`cheering`), `Relaxing` (`relaxing`), `Trudging` (`trudging`), `Cowering` (`cowering`), `Pointing` (`pointing`), `Lunging` (`lunging`), `Dungeons` (`dungeons`), `Facepalm` (`facepalm`), `Sleeping` (`sleeping`), `Dead` (`dead`), `Archer` (`archer`), `Kicking` (`kicking`), `Mojavatar` (`mojavatar`), `Reading` (`reading`), `High Ground` (`high_ground`)
- **`crop`**
  - **Description:** Crop type (auto-selects best if omitted)
  - **Type:** Text
  - **Choices:** `Full Body` (`full`), `Bust` (`bust`), `Face` (`face`), `Head` (`head`), `Default` (`default`), `Processed` (`processed`), `Barebones` (`barebones`)
**`/minecraft player skin <player>`**
> Shows the Minecraft: Java Edition skin of the provided player name

**Options for this subcommand:**
- **`player*`**
  - **Description:** The Minecraft Java Edition player name
  - **Type:** Text
**`/minecraft player wallpaper <wallpaper> <players>`**
> 🖼️ Generate a Minecraft wallpaper featuring one or more players

**Options for this subcommand:**
- **`wallpaper*`**
  - **Description:** Choose a wallpaper style
  - **Type:** Text
  - **Choices:** `Herobrine Hill` (`herobrine_hill`), `Quick Hide` (`quick_hide`), `Malevolent` (`malevolent`), `Off to the Stars` (`off_to_the_stars`), `Wheat` (`wheat`)
- **`players*`**
  - **Description:** Player name(s) — separate multiple with commas, no spaces (e.g. kenndeclouv,ribellflow)
  - **Type:** Text
**`/minecraft server status <host> [<type>]`**
> Check the status of a Minecraft server

**Options for this subcommand:**
- **`host*`**
  - **Description:** Server IP or hostname (e.g. mc.hypixel.net or play.server.net:25565)
  - **Type:** Text
- **`type`**
  - **Description:** Server type (default: Java)
  - **Type:** Text
  - **Choices:** `☕ Java Edition` (`java`), `🪨 Bedrock Edition` (`bedrock`)
**`/minecraft set autosetup <host> [<port>] [<category_name>]`**
> ⚙️ Auto-create all Minecraft stat channels in one go
> _User Permissions: `ManageChannels`, `ManageGuild`_

**Options for this subcommand:**
- **`host*`**
  - **Description:** Minecraft server IP or hostname (e.g. mc.hypixel.net)
  - **Type:** Text
- **`port`**
  - **Description:** Server port (default: 25565)
  - **Type:** Integer
- **`category_name`**
  - **Description:** Name for the new category (default: ⛏️ Minecraft Server)
  - **Type:** Text
**`/minecraft set ip-channel <channel>`**
> 📢 Set a channel to display the Minecraft server IP
> _User Permissions: `ManageGuild`_

**Options for this subcommand:**
- **`channel*`**
  - **Description:** Channel to display the server IP
  - **Type:** Channel
**`/minecraft set ip <ip>`**
> 🖥️ Set the Minecraft server IP for this guild
> _User Permissions: `ManageGuild`_

**Options for this subcommand:**
- **`ip*`**
  - **Description:** Minecraft server IP address
  - **Type:** Text
**`/minecraft set port-channel <channel>`**
> 📢 Set a channel to display the Minecraft server port
> _User Permissions: `ManageGuild`_

**Options for this subcommand:**
- **`channel*`**
  - **Description:** Channel to display the server port
  - **Type:** Channel
**`/minecraft set port <port>`**
> 🔌 Set the Minecraft server port for this guild
> _User Permissions: `ManageGuild`_

**Options for this subcommand:**
- **`port*`**
  - **Description:** Minecraft server port (default: 25565)
  - **Type:** Integer
**`/minecraft set status-channel <channel>`**
> 📢 Set a channel to display the Minecraft server status
> _User Permissions: `ManageGuild`_

**Options for this subcommand:**
- **`channel*`**
  - **Description:** Channel to display the server status
  - **Type:** Channel


