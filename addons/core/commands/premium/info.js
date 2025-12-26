/**
 * @namespace: addons/core/commands/premium/info.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */
const { MessageFlags } = require('discord.js');

module.exports = {
	slashCommand: (subcommand) =>
		subcommand
			.setName('info')
			.setDescription('View premium info for a user')
			.addUserOption((opt) =>
				opt.setName('user').setDescription('User to check').setRequired(true),
			),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, kythiaConfig, helpers, models } = container;
		const { createContainer } = helpers.discord;
		const { KythiaUser } = models;

		await interaction.deferReply();

		const user = interaction.options.getUser('user');
		const kythiaUser = await KythiaUser.getCache({ userId: user.id });
		if (
			!kythiaUser ||
			!kythiaUser.isPremium ||
			new Date(kythiaUser.premiumExpiresAt) < new Date()
		) {
			const components = await createContainer(interaction, {
				description: await t(
					interaction,
					'core.premium.premium.info.not.active',
					{
						user: `<@${user.id}>`,
					},
				),
				color: 'Red',
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const description =
			`**${await t(interaction, 'core.premium.premium.info.field.user')}:** <@${user.id}> (${user.id})\n` +
			`**${await t(interaction, 'core.premium.premium.info.field.status')}:** ${kythiaUser.isPremium ? await t(interaction, 'core.premium.premium.info.status.active') : await t(interaction, 'core.premium.premium.info.status.inactive')}\n` +
			`**${await t(interaction, 'core.premium.premium.info.field.expires')}:** <t:${Math.floor(new Date(kythiaUser.premiumExpiresAt).getTime() / 1000)}:F>`;

		const components = await createContainer(interaction, {
			title: await t(interaction, 'core.premium.premium.info.title', {
				tag: user.tag,
			}),
			description,
			color: kythiaConfig.bot.color,
		});

		return interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
