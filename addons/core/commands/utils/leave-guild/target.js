/**
 * @namespace: addons/core/commands/utils/leave-guild/target.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { MessageFlags } = require('discord.js');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
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

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, kythiaConfig, helpers } = container;
		const { simpleContainer } = helpers.discord;
		const { client } = interaction;

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
				await t(interaction, 'core.utils.leave-guild.target.protected', {
					guildId,
				}),
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
				await t(interaction, 'core.utils.leave-guild.target.not.found', {
					guildId,
				}),
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

		const desc = await t(interaction, 'core.utils.leave-guild.target.success', {
			guildName,
			guildId,
			memberCount,
			serverCount: client.guilds.cache.size,
		});
		const components = await simpleContainer(interaction, desc);
		return interaction.reply({
			components,
			flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
		});
	},
};
