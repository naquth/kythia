/**
 * @namespace: addons/core/commands/premium/list.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */
const { MessageFlags } = require('discord.js');
const { Op } = require('sequelize');

module.exports = {
	slashCommand: (subcommand) =>
		subcommand.setName('list').setDescription('View list of premium users'),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, kythiaConfig, helpers, models } = container;
		const { createContainer } = helpers.discord;
		const { KythiaUser } = models;

		await interaction.deferReply();

		const now = new Date();
		const list = await KythiaUser.getAllCache({
			where: {
				isPremium: true,
				premiumExpiresAt: { [Op.gt]: now },
			},
			order: [['premiumExpiresAt', 'ASC']],
			cacheTags: ['KythiaUser:premium:list'],
		});

		if (!list.length) {
			const components = await createContainer(interaction, {
				description: await t(interaction, 'core.premium.premium.list.empty'),
				color: 'Red',
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const description = (
			await Promise.all(
				list.map(
					async (p, i) =>
						await t(interaction, 'core.premium.premium.list.item', {
							index: i + 1,
							user: `<@${p.userId}>`,
							expires: `<t:${Math.floor(new Date(p.premiumExpiresAt).getTime() / 1000)}:R>`,
						}),
				),
			)
		).join('\n');

		const components = await createContainer(interaction, {
			title: await t(interaction, 'core.premium.premium.list.title'),
			description,
			color: kythiaConfig.bot.color,
		});

		return interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
