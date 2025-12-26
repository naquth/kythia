/**
 * @namespace: addons/core/events/emojiCreate.js
 * @type: Event Handler
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	AuditLogEvent,
	MessageFlags,
	ContainerBuilder,
	SeparatorBuilder,
	TextDisplayBuilder,
	SeparatorSpacingSize,
} = require('discord.js');

module.exports = async (bot, emoji) => {
	if (!emoji.guild) return;
	const container = bot.client.container;
	const { models, helpers } = container;
	const { ServerSetting } = models;
	const { convertColor } = helpers.color;

	try {
		const settings = await ServerSetting.getCache({ guildId: emoji.guild.id });
		if (!settings || !settings.auditLogChannelId) return;

		const logChannel = await emoji.guild.channels
			.fetch(settings.auditLogChannelId)
			.catch(() => null);
		if (!logChannel || !logChannel.isTextBased()) return;

		const audit = await emoji.guild.fetchAuditLogs({
			type: AuditLogEvent.EmojiCreate,
			limit: 1,
		});

		const entry = audit.entries.find(
			(e) =>
				e.target?.id === emoji.id && e.createdTimestamp > Date.now() - 10000,
		);

		if (!entry) return;

		const executor = entry.executor;
		const components = [
			new ContainerBuilder()
				.setAccentColor(
					convertColor('Green', { from: 'discord', to: 'decimal' }),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`😃 **Emoji Created** by <@${executor?.id || 'Unknown'}>\n\n` +
							`**Emoji:** <:${emoji.name}:${emoji.id}>\n` +
							`**Name:** ${emoji.name}\n` +
							`**Animated:** ${emoji.animated ? 'Yes' : 'No'}\n` +
							`**Available:** ${emoji.available ? 'Yes' : 'No'}\n` +
							`**Managed:** ${emoji.managed ? 'Yes' : 'No'}` +
							(entry.reason ? `\n\n**Reason:** ${entry.reason}` : ''),
					),
				)
				.addSeparatorComponents(
					new SeparatorBuilder()
						.setSpacing(SeparatorSpacingSize.Small)
						.setDivider(true),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`👤 **Executor:** ${executor?.tag || 'Unknown'} (${executor?.id || 'Unknown'})\n` +
							`🕒 **Timestamp:** <t:${Math.floor(Date.now() / 1000)}:F>`,
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
		console.error('Error in guildEmojiCreate audit log:', err);
	}
};
