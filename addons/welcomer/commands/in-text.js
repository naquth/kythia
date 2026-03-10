/**
 * @namespace: addons/welcomer/commands/in-text.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { MessageFlags } = require('discord.js');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('in-text')
			.setDescription('👋 Set welcome message text (supports placeholders)')
			.addStringOption((opt) =>
				opt
					.setName('text')
					.setDescription(
						'Welcome text. Placeholders: {username}, {guildName}, {memberCount}, etc.',
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

		const [welcomeSetting] = await WelcomeSetting.getOrCreateCache({
			guildId: interaction.guild.id,
		});

		const text = interaction.options.getString('text');
		welcomeSetting.welcomeInEmbedText = text;
		await welcomeSetting.save();

		const components = await simpleContainer(
			interaction,
			await t(interaction, 'welcomer.welcomer.in.text.set', { text }),
			{ color: 'Green' },
		);

		return interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
