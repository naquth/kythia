/**
 * @namespace: addons/welcomer/commands/role.js
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
			.setName('role')
			.setDescription('👋 Set auto-role given to new members on join')
			.addRoleOption((opt) =>
				opt
					.setName('role')
					.setDescription('Role to assign on join')
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

		const role = interaction.options.getRole('role');
		serverSetting.welcomeRoleId = role.id;
		await serverSetting.saveAndUpdateCache('guildId');

		const components = await simpleContainer(
			interaction,
			await t(interaction, 'welcomer.welcomer.role.set', { roleId: role.id }),
			{ color: 'Green' },
		);

		return interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
