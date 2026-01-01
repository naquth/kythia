/**
 * @namespace: addons/core/events/messageUpdate.js
 * @type: Event Handler
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	MessageFlags,
	ContainerBuilder,
	SeparatorBuilder,
	TextDisplayBuilder,
	SeparatorSpacingSize,
} = require('discord.js');
const Sentry = require('@sentry/node');
const { automodSystem } = require('../helpers/automod');

module.exports = async (bot, oldMessage, newMessage) => {
	const container = bot.client.container;
	const { helpers, models, logger, t } = container;
	const { isOwner } = helpers.discord;
	const { convertColor } = helpers.color;
	const { ServerSetting } = models;
	const guildId = newMessage.guild?.id;

	try {
		const client = bot.client;
		if (!newMessage || !newMessage.author || !newMessage.guild) return;
		if (newMessage.author.bot) return;

		if (
			!isOwner(newMessage.author.id) &&
			!newMessage.member?.permissions.has(['Administrator', 'ManageGuild'])
		) {
			const isFlagged = await automodSystem(newMessage, client);
			if (isFlagged) return true;
		}

		// Don't log if content hasn't changed
		if (oldMessage.content === newMessage.content) return;

		// Get audit log settings
		const settings = await ServerSetting.getCache({
			guildId: newMessage.guild.id,
		});
		if (!settings || !settings.auditLogChannelId) return;

		const logChannel = await newMessage.guild.channels
			.fetch(settings.auditLogChannelId)
			.catch(() => null);
		if (!logChannel || !logChannel.isTextBased()) return;

		// Build Components V2
		const oldContent = oldMessage.content
			? oldMessage.content.length > 1024
				? `${oldMessage.content.substring(0, 1021)}...`
				: oldMessage.content
			: '*(Unable to fetch old content)*';

		const newContent = newMessage.content
			? newMessage.content.length > 1024
				? `${newMessage.content.substring(0, 1021)}...`
				: newMessage.content
			: '*(Empty)*';

		const components = [
			new ContainerBuilder()
				.setAccentColor(
					convertColor('Blurple', { from: 'discord', to: 'decimal' }),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`✏️ **Message Edited** in <#${newMessage.channelId}>\n\n` +
							`**Author:** ${newMessage.author.tag} (<@${newMessage.author.id}>)\n` +
							`**Message:** [Jump to Message](${newMessage.url})\n\n` +
							`**Before:**\n${oldContent}\n\n` +
							`**After:**\n${newContent}`,
					),
				)
				.addSeparatorComponents(
					new SeparatorBuilder()
						.setSpacing(SeparatorSpacingSize.Small)
						.setDivider(true),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`👤 **Author:** ${newMessage.author.tag} (${newMessage.author.id})\n` +
							`📝 **Message ID:** ${newMessage.id}\n` +
							`🕒 **Timestamp:** <t:${Math.floor(Date.now() / 1000)}:F>`,
					),
				)
				.addSeparatorComponents(
					new SeparatorBuilder()
						.setSpacing(SeparatorSpacingSize.Small)
						.setDivider(true),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						await t({ guildId }, 'common.container.footer', {
							username: bot.client.user.username,
						}),
					),
				),
		];

		await logChannel.send({
			components,
			flags: MessageFlags.IsComponentsV2,
			allowedMentions: {
				parse: [],
			},
		});
	} catch (err) {
		logger.error(err, { label: 'messageUpdate' });
		if (bot.config?.sentry?.dsn) {
			Sentry.captureException(err);
		}
	}
};
