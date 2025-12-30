/**
 * @namespace: addons/economy/commands/market/history.js
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
			.setName('history')
			.setDescription('View your transaction history.'),

	async execute(interaction, container) {
		const { t, models, kythiaConfig, helpers } = container;
		const { KythiaUser, MarketTransaction } = models;
		const { simpleContainer } = helpers.discord;

		await interaction.deferReply();

		const user = await KythiaUser.getCache({ userId: interaction.user.id });
		if (!user) {
			const msg = await t(interaction, 'economy.withdraw.no.account.desc');
			const components = await simpleContainer(interaction, msg, {
				color: kythiaConfig.bot.color,
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		try {
			const transactions = await MarketTransaction.getAllCache({
				where: { userId: interaction.user.id },
				order: [['createdAt', 'DESC']],
				limit: 10,
				cacheTags: [`MarketTransaction:byUser:${interaction.user.id}`],
			});

			if (transactions.length === 0) {
				const msg = `## ${await t(interaction, 'economy.market.history.empty.title')}\n${await t(interaction, 'economy.market.history.empty.desc')}`;
				const components = await simpleContainer(interaction, msg, {
					color: kythiaConfig.bot.color,
				});
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}

			const description = transactions
				.map((tx) => {
					const side = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
					const emoji = tx.type === 'buy' ? '🟢' : '🔴';
					return `${emoji} **${side} ${tx.quantity.toFixed(6)} ${tx.assetId.toUpperCase()}** at $${tx.price.toLocaleString()} each\n*${new Date(tx.createdAt).toLocaleString()}*`;
				})
				.join('\n\n');

			const msg = `## ${await t(interaction, 'economy.market.history.title', {
				username: interaction.user.username,
			})}\n\n${description}`;

			const components = await simpleContainer(interaction, msg, {
				color: kythiaConfig.bot.color,
			});

			await interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			console.error('Error in history command:', error);
			const msg = `## ${await t(interaction, 'economy.market.history.error.title')}\n${await t(interaction, 'economy.market.history.error.desc')}`;
			const components = await simpleContainer(interaction, msg, {
				color: 'Red',
			});
			await interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};
