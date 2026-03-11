/**
 * @namespace: addons/minecraft/commands/player/info.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 *
 * @description
 * Comprehensive info/tutorial command for the Minecraft addon.
 * Shows all available commands and features with usage examples.
 */

const {
	MessageFlags,
	ContainerBuilder,
	SeparatorBuilder,
	TextDisplayBuilder,
	SeparatorSpacingSize,
} = require('discord.js');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('help')
			.setDescription('📖 View all Minecraft addon commands and features'),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, kythiaConfig, helpers } = container;

		const accentColor = helpers.color.convertColor(kythiaConfig.bot.color, {
			from: 'hex',
			to: 'decimal',
		});

		const sections = [
			// ── Header ────────────────────────────────────────────────────────
			`## ⛏️ Minecraft Addon — Command Guide`,
			`-# Powered by [Starlight Skins](https://starlightskins.lunareclipse.studio) & [mcsrvstat.us](https://api.mcsrvstat.us)`,

			// ── Player commands ────────────────────────────────────────────────
			``,
			`### 👤 Player Commands`,
			`> All renders are fetched live from Starlight Skins.`,
			``,
			`**\`/minecraft player avatar <player>\`**`,
			`Shows the face/avatar of a player.`,
			``,
			`**\`/minecraft player head <player>\`**`,
			`Renders the full 3D head of a player.`,
			``,
			`**\`/minecraft player body <player>\`**`,
			`Renders the full body of a player.`,
			``,
			`**\`/minecraft player skin <player>\`**`,
			`Shows the raw skin texture of a player.`,
			``,
			`**\`/minecraft player pose <player> <pose> [pose2] [crop]\`**`,
			`Renders a player in any of **31 poses**. Split across two dropdowns:`,
			`- **pose** — 25 poses (default → high_ground)`,
			`- **pose2** — 6 extra poses (clown, bitzel, pixel, ornament, skin, profile)`,
			`- **crop** — Optional: \`full\`, \`bust\`, \`face\`, \`head\`, \`default\`, \`processed\`, \`barebones\``,
			`  *(If the crop is invalid for the pose, the best crop is auto-selected)*`,
			``,
			`┌─ Full Pose List ──────────────────────────────┐`,
			`│ default · marching · walking · crouching      │`,
			`│ crossed · criss_cross · ultimate · isometric  │`,
			`│ head · custom · cheering · relaxing · trudging │`,
			`│ cowering · pointing · lunging · dungeons       │`,
			`│ facepalm · sleeping · dead · archer · kicking  │`,
			`│ mojavatar · reading · high_ground · clown      │`,
			`│ bitzel · pixel · ornament · skin · profile     │`,
			`└────────────────────────────────────────────────┘`,
			``,
			`**\`/minecraft player wallpaper <wallpaper> <players>\`**`,
			`Generates a scenic wallpaper featuring one or more players.`,
			`Players are comma-separated with no spaces: \`Steve,Alex,Notch\``,
			`- **quick_hide** *(supports up to 3 players)*`,
			`- herobrine_hill · malevolent · off_to_the_stars · wheat`,

			// ── Server commands ────────────────────────────────────────────────
			``,
			`### 🖥️ Server Commands`,
			``,
			`**\`/minecraft server status <host> [type]\`**`,
			`Check the status of any Java or Bedrock server.`,
			`Includes online players, MOTD, version, and a 🔄 Refresh button.`,

			// ── Settings commands ──────────────────────────────────────────────
			``,
			`### ⚙️ Settings Commands`,
			`> Requires **Manage Server** permission.`,
			``,
			`**\`/minecraft set autosetup <host> [port] [category_name]\`**`,
			`One-command setup — creates a stat category + 4 voice channels,`,
			`saves all settings, and enables the live updater automatically.`,
			``,
			`**\`/minecraft set ip <ip>\`** — Set the guild's server IP`,
			`**\`/minecraft set port <port>\`** — Set the server port (default: 25565)`,
			`**\`/minecraft set ip-channel <channel>\`** — Voice channel showing the IP`,
			`**\`/minecraft set port-channel <channel>\`** — Voice channel showing the port`,
			`**\`/minecraft set status-channel <channel>\`** — Voice channel showing 🟢/🔴 status`,
			``,
			`Then enable the live updater via:`,
			`> \`/set features minecraft-stats enable\``,

			// ── Cron info ──────────────────────────────────────────────────────
			``,
			`### ⏱️ Live Stats`,
			`Voice channels update automatically every **5 minutes**.`,
			`You can also force an update via the API:`,
			`\`POST /api/minecraft/trigger-update/:guildId\``,
		];

		const responseContainer = new ContainerBuilder()
			.setAccentColor(accentColor)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(sections.join('\n')),
			)
			.addSeparatorComponents(
				new SeparatorBuilder()
					.setSpacing(SeparatorSpacingSize.Small)
					.setDivider(true),
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					await t(interaction, 'common.container.footer', {
						username: interaction.client.user.username,
					}),
				),
			);

		return interaction.reply({
			components: [responseContainer],
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
