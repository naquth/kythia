/**
 * @namespace: addons/economy/commands/market/buy.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */
const { MessageFlags } = require('discord.js');
const { getMarketData, ASSET_IDS } = require('../../helpers/market');
const { toBigIntSafe } = require('../../helpers/bigint');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('buy')
			.setDescription('💸 Buy an asset from the global market.')
			.addStringOption((option) =>
				option
					.setName('asset')
					.setDescription(
						'The symbol of the asset you want to buy (e.g., BTC, ETH)',
					)
					.setRequired(true)
					.addChoices(
						...ASSET_IDS.map((id) => ({ name: id.toUpperCase(), value: id })),
					),
			)
			.addNumberOption((option) =>
				option
					.setName('amount')
					.setDescription('The amount of KythiaCoin you want to spend')
					.setRequired(true)
					.setMinValue(1),
			),

	async execute(interaction, container) {
		const { t, models, kythiaConfig, helpers, logger } = container;
		const { KythiaUser, MarketPortfolio, MarketTransaction } = models;
		const { simpleContainer } = helpers.discord;

		await interaction.deferReply();

		const assetId = interaction.options.getString('asset');
		const amountToSpend = interaction.options.getNumber('amount');

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

		if (user.kythiaCoin < amountToSpend) {
			const msg = `## ${await t(interaction, 'economy.market.buy.insufficient.funds.title')}\n${await t(interaction, 'economy.market.buy.insufficient.funds.desc', { amount: amountToSpend.toLocaleString() })}`;
			const components = await simpleContainer(interaction, msg, {
				color: kythiaConfig.bot.color,
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const marketData = await getMarketData();
		const assetData = marketData[assetId];

		if (!assetData) {
			const msg = `## ${await t(interaction, 'economy.market.buy.asset.not.found.title')}\n${await t(interaction, 'economy.market.buy.asset.not.found.desc')}`;
			const components = await simpleContainer(interaction, msg, {
				color: kythiaConfig.bot.color,
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const currentPrice = assetData.usd;
		const quantityToBuy = amountToSpend / currentPrice;

		try {
			const existingHolding = await MarketPortfolio.getCache({
				userId: interaction.user.id,
				assetId: assetId,
			});

			if (existingHolding) {
				const oldQuantity = existingHolding.quantity;
				const oldAvgPrice = existingHolding.avgBuyPrice;

				const newTotalQuantity = oldQuantity + quantityToBuy;
				const newAvgBuyPrice =
					(oldQuantity * oldAvgPrice + quantityToBuy * currentPrice) /
					newTotalQuantity;

				existingHolding.quantity = newTotalQuantity;
				existingHolding.avgBuyPrice = newAvgBuyPrice;
				await existingHolding.save();
			} else {
				await MarketPortfolio.create({
					userId: interaction.user.id,
					assetId: assetId,
					quantity: quantityToBuy,
					avgBuyPrice: currentPrice,
				});
			}

			await MarketTransaction.create({
				userId: interaction.user.id,
				assetId: assetId,
				type: 'buy',
				quantity: quantityToBuy,
				price: currentPrice,
			});

			user.kythiaCoin =
				toBigIntSafe(user.kythiaCoin) - toBigIntSafe(amountToSpend);

			user.changed('kythiaCoin', true);

			await user.save();

			const msg = `## ${await t(interaction, 'economy.market.buy.success.title')}\n${await t(interaction, 'economy.market.buy.success.desc', { quantity: quantityToBuy.toFixed(6), asset: assetId.toUpperCase(), amount: amountToSpend.toLocaleString() })}`;
			const components = await simpleContainer(interaction, msg, {
				color: 'Green',
			});

			await interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			logger.error('Error during market buy:', error, {
				label: 'core:commands:economy:market:buy',
			});
			const msg = `## ${await t(interaction, 'economy.market.buy.error.title')}\n${await t(interaction, 'economy.market.buy.error.desc')}`;
			const components = await simpleContainer(interaction, msg, {
				color: kythiaConfig.bot.color,
			});
			await interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};
