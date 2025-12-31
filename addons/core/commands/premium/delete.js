/**
 * @namespace: addons/core/commands/premium/delete.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { MessageFlags } = require('discord.js');

module.exports = {
	slashCommand: (subcommand) =>
		subcommand
			.setName('delete')
			.setDescription('Remove a user from premium')
			.addUserOption((opt) =>
				opt
					.setName('user')
					.setDescription('User to remove premium from')
					.setRequired(true),
			),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, models, helpers } = container;
		const { KythiaUser } = models;
		const { simpleContainer } = helpers.discord;

		await interaction.deferReply();

		const user = interaction.options.getUser('user');

		const kythiaUser = await KythiaUser.getCache({ userId: user.id });
		if (!kythiaUser || !kythiaUser.isPremium) {
			return interaction.editReply(
				await t(interaction, 'core.premium.premium.not.premium'),
			);
		}

		kythiaUser.isPremium = false;
		kythiaUser.premiumExpiresAt = null;
		await kythiaUser.save();

		const msg = await t(interaction, 'core.premium.premium.delete.success', {
			user: `<@${user.id}>`,
		});
		const components = await simpleContainer(interaction, msg, {
			color: 'Red',
		});
		return interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
