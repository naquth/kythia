/**
 * @namespace: addons/core/commands/utils/leave-guild.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	MessageFlags,
	SlashCommandBuilder,
	InteractionContextType,
} = require('discord.js');

module.exports = {
	aliases: ['lg'],
	isOwner: true,
	mainGuildOnly: true,
	slashCommand: new SlashCommandBuilder()
		.setName('leaveguild')
		.setDescription('Manage bot guild membership (Owner Only).')
		.addSubcommand((sub) =>
			sub
				.setName('target')
				.setDescription('Force leave a specific guild by ID.')
				.addStringOption((option) =>
					option
						.setName('guild_id')
						.setDescription('The ID of the guild to leave')
						.setRequired(true)
						.setAutocomplete(true),
				)
				.addStringOption((option) =>
					option
						.setName('except')
						.setDescription(
							'Comma-separated guild IDs to additionally protect from being left (Optional).',
						),
				),
		)

		.addSubcommand((sub) =>
			sub
				.setName('cleanup')
				.setDescription('Mass leave guilds with member count below threshold.')
				.addIntegerOption((option) =>
					option
						.setName('min_member')
						.setDescription(
							'Threshold: Leave guilds with LESS members than this.',
						)
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName('message')
						.setDescription('Last message to send before leaving (Optional).'),
				)
				.addStringOption((option) =>
					option
						.setName('except')
						.setDescription(
							'Comma-separated guild IDs to additionally protect from being left (Optional).',
						),
				),
		)
		.setContexts(InteractionContextType.Guild),

	/**
	 * @param {import('discord.js').AutocompleteInteraction} interaction
	 */
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		const guilds = interaction.client.guilds.cache;

		const filtered = guilds.filter(
			(guild) =>
				guild.name.toLowerCase().includes(focusedValue.toLowerCase()) ||
				guild.id.includes(focusedValue),
		);

		const choices = filtered
			.map((guild) => ({
				name: `${guild.name} (${guild.id})`.slice(0, 100),
				value: guild.id,
			}))
			.slice(0, 25);

		await interaction.respond(choices);
	},

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { kythiaConfig, helpers, logger } = container;
		const { simpleContainer } = helpers.discord;
		const { client } = interaction;

		const sub = interaction.options.getSubcommand();

		if (sub === 'target') {
			const guildId = interaction.options.getString('guild_id');
			const exceptRaw = interaction.options.getString('except') || '';
			const extraExcept = exceptRaw
				.split(',')
				.map((id) => id.trim())
				.filter(Boolean);

			const SAFE_GUILDS = [
				kythiaConfig.bot.mainGuildId,
				kythiaConfig.bot.devGuildId,
				...extraExcept,
			].filter(Boolean);

			if (SAFE_GUILDS.includes(guildId)) {
				const components = await simpleContainer(
					interaction,
					`🛡️ **Protected Guild**\nID: \`${guildId}\` is exempted and cannot be left.`,
					{ color: 'Yellow' },
				);
				return interaction.reply({
					components,
					flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
				});
			}

			const guild = client.guilds.cache.get(guildId);

			if (!guild) {
				const components = await simpleContainer(
					interaction,
					`❌ **Guild Not Found**\nID: \`${guildId}\``,
					{ color: 'Red' },
				);
				return interaction.reply({
					components,
					flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
				});
			}

			const guildName = guild.name;
			const memberCount = guild.memberCount;
			await guild.leave();

			const desc = `✅ **Successfully Left Guild**\n\n**Name:** ${guildName}\n**ID:** \`${guildId}\`\n**Members:** ${memberCount}\n\n📉 Server Count is now: **${client.guilds.cache.size}**`;

			const components = await simpleContainer(interaction, desc);

			return interaction.reply({
				components,
				flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
			});
		} else if (sub === 'cleanup') {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const exceptRaw = interaction.options.getString('except') || '';
			const extraExcept = exceptRaw
				.split(',')
				.map((id) => id.trim())
				.filter(Boolean);

			const SAFE_GUILDS = [
				kythiaConfig.bot.mainGuildId,
				kythiaConfig.bot.devGuildId,
				interaction?.guild?.id,
				...extraExcept,
			].filter(Boolean);

			const threshold = interaction.options.getInteger('min_member');
			const customMsg =
				interaction.options.getString('message') ||
				`👋 **Good Bye!**\n\nI am leaving this server because it has fewer than ${threshold} members (Cleanup Policy).\nIf you want to use me, please invite me to a more active server!`;

			const customMsgContainer = await simpleContainer(interaction, customMsg);

			const targets = client.guilds.cache.filter(
				(g) => g.memberCount < threshold && !SAFE_GUILDS.includes(g.id),
			);

			if (targets.size === 0) {
				const components = await simpleContainer(
					interaction,
					`✅ **No Cleanup Needed**\nNo guilds found with less than ${threshold} members.`,
				);
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}

			let leftCount = 0;
			let errorCount = 0;
			const leftNames = [];

			for (const [, guild] of targets) {
				try {
					let channel = guild.systemChannel;

					if (!channel) {
						channel = guild.channels.cache.find(
							(c) =>
								c.isTextBased() &&
								c.permissionsFor(guild.members.me).has('SendMessages') &&
								(c.name.includes('general') ||
									c.name.includes('chat') ||
									c.name.includes('obrolan')),
						);
					}

					if (!channel) {
						channel = guild.channels.cache.find(
							(c) =>
								c.isTextBased() &&
								c.permissionsFor(guild.members.me).has('SendMessages'),
						);
					}

					if (channel) {
						await channel
							.send({
								components: customMsgContainer,
								flags: MessageFlags.IsComponentsV2,
							})
							.catch(() => null);
					}

					await guild.leave();
					leftCount++;
					leftNames.push(`${guild.name} (${guild.memberCount})`);

					await new Promise((r) => setTimeout(r, 1000));
				} catch (e) {
					logger.error(`Failed to cleanup guild ${guild.name}:`, e, {
						label: 'core:utils:leave-guild',
					});
					errorCount++;
				}
			}

			let desc = `🧹 **Cleanup Complete**\n\n**Threshold:** < ${threshold} members\n**Success:** ${leftCount} guilds\n**Failed:** ${errorCount} guilds`;
			if (leftNames.length > 0) {
				desc += `\n\n**Left Guilds:**\n\`\`\`\n${leftNames.slice(0, 10).join('\n')}${leftNames.length > 10 ? `\n...and ${leftNames.length - 10} more` : ''}\`\`\``;
			}

			const components = await simpleContainer(interaction, desc);

			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};
