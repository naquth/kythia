/**
 * @namespace: addons/economy/commands/market/view.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	MessageFlags,
	ContainerBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	AttachmentBuilder,
} = require('discord.js');
const {
	getMarketData,
	ASSET_IDS,
	getChartBuffer,
} = require('../../helpers/market');

function formatMarketTable(rows) {
	return [
		'```',
		'SYMBOL   |    PRICE (USD)  |  24H CHANGE',
		'----------------------------------------',
		...rows,
		'```',
	].join('\n');
}

function getChangeEmoji(percent) {
	if (percent > 0) return '🟢 ▲';
	if (percent < 0) return '🔴 ▼';
	return '⏹️';
}

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('view')
			.setDescription('📈 View real-time crypto prices from the global market.')
			.addStringOption((option) =>
				option
					.setName('asset')
					.setDescription(
						'The symbol of the asset to view, or leave empty for all',
					)
					.setRequired(false)
					.addChoices(
						...ASSET_IDS.map((id) => ({ name: id.toUpperCase(), value: id })),
					),
			),

	async execute(interaction, container) {
		const { t, models, kythiaConfig, helpers } = container;
		const { KythiaUser, MarketOrder } = models;
		const { simpleContainer } = helpers.discord;
		const { convertColor } = helpers.color;

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

		const marketData = await getMarketData();
		const assetId = interaction.options.getString('asset');
		const files = [];

		if (assetId) {
			const data = marketData[assetId];
			if (!data) {
				const msg = `## ${await t(interaction, 'economy.market.view.asset.not.found.title')}\n${await t(interaction, 'economy.market.view.asset.not.found.desc', { asset: assetId.toUpperCase() })}`;
				const components = await simpleContainer(interaction, msg, {
					color: 'Red',
				});
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}

			const percent = data.usd_24h_change.toFixed(2);
			const emoji = getChangeEmoji(data.usd_24h_change);

			let description = `## ${await t(
				interaction,
				'economy.market.view.chart.title',
				{
					asset: assetId.toUpperCase(),
				},
			)}\n\n`;
			description += `**${await t(interaction, 'economy.market.view.price.label')}:** $${data.usd.toLocaleString()}\n`;
			description += `**${await t(interaction, 'economy.market.view.24h.change.label')}:** ${emoji} ${percent}%\n`;

			const openOrders = await MarketOrder.getAllCache({
				where: {
					userId: interaction.user.id,
					assetId: assetId,
					status: 'open',
				},
				cacheTags: [
					`MarketOrder:open:byUser:${interaction.user.id}:byAsset:${assetId}`,
				],
			});

			if (openOrders.length > 0) {
				const orderSummary = openOrders
					.map((order) => {
						return `- **${order.side.toUpperCase()} ${order.quantity} ${order.assetId.toUpperCase()}** at $${order.price} (${order.type})`;
					})
					.join('\n');
				description += `\n**${await t(interaction, 'economy.market.view.open.orders.label')}:**\n${orderSummary}`;
			}

			const chartBuffer = await getChartBuffer(kythiaConfig, assetId);
			let mediaUrl = null;
			if (chartBuffer) {
				const attachment = new AttachmentBuilder(chartBuffer, {
					name: 'market-chart.png',
				});
				files.push(attachment);
				mediaUrl = 'attachment://market-chart.png';
			}

			const viewContainer = new ContainerBuilder()
				.setAccentColor(
					convertColor(kythiaConfig.bot.color, { from: 'hex', to: 'decimal' }),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(description),
				);

			if (mediaUrl) {
				viewContainer
					.addSeparatorComponents(
						new SeparatorBuilder()
							.setSpacing(SeparatorSpacingSize.Small)
							.setDivider(true),
					)
					.addMediaGalleryComponents(
						new MediaGalleryBuilder().addItems([
							new MediaGalleryItemBuilder().setURL(mediaUrl),
						]),
					);
			}

			viewContainer
				.addSeparatorComponents(
					new SeparatorBuilder()
						.setSpacing(SeparatorSpacingSize.Small)
						.setDivider(true),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						await t(interaction, 'common.container.footer', {
							username: interaction.client.user.username,
						}),
					),
				);

			await interaction.editReply({
				components: [viewContainer],
				files: files,
				flags: MessageFlags.IsComponentsV2,
			});
		} else {
			const assetRows = ASSET_IDS.map((id) => {
				const data = marketData[id];
				if (!data) {
					return `${id.toUpperCase().padEnd(8)}| ${'Data not found'.padEnd(15)}| N/A`;
				}
				const symbol = id.toUpperCase().padEnd(8);
				const price = `$${data.usd.toLocaleString('en-US', {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				})}`.padEnd(15);
				const percent = data.usd_24h_change.toFixed(2);
				const emoji = getChangeEmoji(data.usd_24h_change);
				const change = `${emoji} ${percent}%`;

				return `${symbol}| ${price}| ${change}`;
			});
			const prettyTable = formatMarketTable(assetRows);

			const msg =
				`## ${await t(interaction, 'economy.market.view.all.title')}\n` +
				prettyTable;
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
