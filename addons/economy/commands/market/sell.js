/**
 * @namespace: addons/economy/commands/market/sell.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */
const { MessageFlags } = require('discord.js');
const { getMarketData, ASSET_IDS } = require('../../helpers/market');
const { toBigIntSafe } = require('../../helpers/bigint');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('sell')
			.setDescription('💰 Sell an asset to the global market.')
			.addStringOption((option) =>
				option
					.setName('asset')
					.setDescription(
						'The symbol of the asset you want to sell (e.g., BTC, ETH)',
					)
					.setRequired(true)
					.addChoices(
						...ASSET_IDS.map((id) => ({ name: id.toUpperCase(), value: id })),
					),
			)
			.addNumberOption((option) =>
				option
					.setName('quantity')
					.setDescription(
						'The amount of the asset you want to sell (e.g., 0.5)',
					)
					.setRequired(true)
					.setMinValue(0.000001),
			),

	async execute(interaction, container) {
		const { t, models, kythiaConfig, helpers, logger } = container;
		const { KythiaUser, MarketPortfolio, MarketTransaction } = models;
		const { simpleContainer } = helpers.discord;

		await interaction.deferReply();

		const assetId = interaction.options.getString('asset');
		const sellQuantity = interaction.options.getNumber('quantity');

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

		const holding = await MarketPortfolio.getCache({
			userId: interaction.user.id,
			assetId: assetId,
		});

		if (!holding || holding.quantity < sellQuantity) {
			const msg = `## ${await t(interaction, 'economy.market.sell.insufficient.asset.title')}\n${await t(interaction, 'economy.market.sell.insufficient.asset.desc', { asset: assetId.toUpperCase() })}`;
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
			const msg = `## ${await t(interaction, 'economy.market.sell.asset.not.found.title')}\n${await t(interaction, 'economy.market.sell.asset.not.found.desc')}`;
			const components = await simpleContainer(interaction, msg, {
				color: kythiaConfig.bot.color,
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const currentPrice = assetData.usd;
		const totalUsdReceived = sellQuantity * currentPrice;

		try {
			const newQuantity = holding.quantity - sellQuantity;
			if (newQuantity > 0) {
				holding.quantity = newQuantity;
				await holding.save();
			} else {
				await holding.destroy();
			}

			await MarketTransaction.create({
				userId: interaction.user.id,
				assetId: assetId,
				type: 'sell',
				quantity: sellQuantity,
				price: currentPrice,
			});

			let kythiaCoinNumeric =
				typeof user.kythiaCoin === 'bigint'
					? Number(user.kythiaCoin)
					: typeof user.kythiaCoin === 'number'
						? user.kythiaCoin
						: /^\d+$/.test(user.kythiaCoin)
							? parseInt(user.kythiaCoin, 10)
							: parseFloat(user.kythiaCoin);

			kythiaCoinNumeric += totalUsdReceived;

			user.kythiaCoin = toBigIntSafe(kythiaCoinNumeric);

			user.changed('kythiaCoin', true);

			await user.saveAndUpdateCache();

			const pnl = (currentPrice - holding.avgBuyPrice) * sellQuantity;
			const pnlSign = pnl >= 0 ? '+' : '';
			const pnlEmoji = pnl >= 0 ? '📈' : '📉';

			const msg = `## ${await t(interaction, 'economy.market.sell.success.title')}\n${await t(interaction, 'economy.market.sell.success.desc', { quantity: sellQuantity.toFixed(6), asset: assetId.toUpperCase(), amount: totalUsdReceived.toLocaleString(undefined, { maximumFractionDigits: 2 }), avgBuyPrice: holding.avgBuyPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }), sellPrice: currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }), pnlEmoji: pnlEmoji, pnlSign: pnlSign, pnl: pnl.toLocaleString(undefined, { maximumFractionDigits: 2 }) })}`;
			const components = await simpleContainer(interaction, msg, {
				color: 'Yellow',
			});

			await interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			logger.error('Error during market sell:', error, {
				label: 'economy:market:sell',
			});
			const msg = `## ${await t(interaction, 'economy.market.sell.error.title')}\n${await t(interaction, 'economy.market.sell.error.desc')}`;
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
