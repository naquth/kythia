/**
 * @namespace: addons/core/helpers/handlers/StickyMessageHandler.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const {
	MessageFlags,
	ContainerBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
} = require('discord.js');

class StickyMessageHandler {
	/**
	 * Handle sticky message logic
	 * @param {Message} message - Discord message
	 * @param {Object} container - Kythia container
	 */
	async handle(message, container) {
		const { models, t, kythiaConfig, logger, helpers } = container;
		const { StickyMessage } = models;
		const { convertColor } = helpers.color;

		try {
			if (message.author.bot) return;

			const sticky = await StickyMessage.getCache({
				channelId: message.channel.id,
			});

			if (!sticky) return;

			if (sticky.messageId) {
				const oldMsg = await message.channel.messages
					.fetch(sticky.messageId)
					.catch(() => null);
				if (oldMsg) await oldMsg.delete().catch(() => {});
			}

			const stickyContainer = new ContainerBuilder()
				.setAccentColor(
					convertColor(kythiaConfig.bot.color, { from: 'hex', to: 'decimal' }),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(sticky.message),
				)
				.addSeparatorComponents(
					new SeparatorBuilder()
						.setSpacing(SeparatorSpacingSize.Small)
						.setDivider(true),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						await t(message, 'common.container.footer', {
							username: message.client.user.username,
						}),
					),
				);

			const sent = await message.channel.send({
				components: [stickyContainer],
				flags: MessageFlags.IsComponentsV2,
			});

			sticky.messageId = sent.id;
			sticky.changed('messageId', true);
			await sticky.saveAndUpdateCache('channelId');
		} catch (err) {
			logger.error('❌ Error loading sticky:', err);
		}
	}
}

module.exports = StickyMessageHandler;
