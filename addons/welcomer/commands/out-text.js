/**
 * @namespace: addons/welcomer/commands/out-text.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant chaa & graa
 * @version 1.0.0
 */

const { MessageFlags } = require('discord.js');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('out-text')
			.setDescription('👋 Set farewell message text (supports placeholders)')
			.addStringOption((opt) =>
				opt
					.setName('text')
					.setDescription(
						'Farewell text. Placeholders: {username}, {guildName}, etc.',
					)
					.setRequired(true),
			),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, models, helpers } = container;
		const { WelcomeSetting } = models;
		const { simpleContainer } = helpers.discord;

		await interaction.deferReply({ ephemeral: true });

		const serverSetting = await WelcomeSetting.getOrCreateCache({
			guildId: interaction.guild.id,
		});

		const text = interaction.options.getString('text');
		serverSetting.welcomeOutEmbedText = text;
		await serverSetting.saveAndUpdateCache('guildId');

		const components = await simpleContainer(
			interaction,
			await t(interaction, 'welcomer.welcomer.out.text.set', { text }),
			{ color: 'Green' },
		);

		return interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
