/**
 * @namespace: addons/welcomer/commands/in-channel.js
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
			.setName('in-channel')
			.setDescription('👋 Set the welcome channel')
			.addChannelOption((opt) =>
				opt
					.setName('channel')
					.setDescription('Channel where welcome messages are sent')
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

		const ch = interaction.options.getChannel('channel');
		welcomeSetting.welcomeInChannelId = ch.id;
		await welcomeSetting.save();

		const components = await simpleContainer(
			interaction,
			await t(interaction, 'welcomer.welcomer.in.channel.set', {
				channelId: ch.id,
			}),
			{ color: 'Green' },
		);

		return interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
