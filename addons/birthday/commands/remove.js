/**
 * @namespace: addons/birthday/commands/birthday/remove.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { MessageFlags } = require('discord.js');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('remove')
			.setDescription('🗑️ Remove your birthday information.'),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, models, helpers } = container;
		const { UserBirthday } = models;
		const { simpleContainer } = helpers.discord;

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const birthDay = await UserBirthday.getCache({
			guildId: interaction.guild.id,
			userId: interaction.user.id,
		});

		if (!birthDay) {
			const msg = await t(interaction, 'birthday.remove.error.not_found');
			const components = await simpleContainer(interaction, msg, {
				color: 'Red',
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		await birthDay.destroy();
		const msg = await t(interaction, 'birthday.remove.success');
		const components = await simpleContainer(interaction, msg);
		await interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
