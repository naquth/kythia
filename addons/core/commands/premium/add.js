/**
 * @namespace: addons/core/commands/premium/add.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { MessageFlags } = require('discord.js');

module.exports = {
	slashCommand: (subcommand) =>
		subcommand
			.setName('add')
			.setDescription('Add a user to premium')
			.addUserOption((opt) =>
				opt
					.setName('user')
					.setDescription('User to grant premium')
					.setRequired(true),
			)
			.addIntegerOption((opt) =>
				opt
					.setName('days')
					.setDescription('Number of premium days (default 30)')
					.setRequired(false),
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
		const days = interaction.options.getInteger('days') ?? 30;
		const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

		let kythiaUser = await KythiaUser.getCache({ userId: user.id });
		if (kythiaUser) {
			kythiaUser.isPremium = true;
			kythiaUser.premiumExpiresAt = expiresAt;
			await kythiaUser.save();
		} else {
			kythiaUser = await KythiaUser.create({
				userId: user.id,
				isPremium: true,
				premiumExpiresAt: expiresAt,
			});
		}

		const msg = await t(interaction, 'core.premium.premium.add.success', {
			user: `<@${user.id}>`,
			days,
			expires: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`,
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
