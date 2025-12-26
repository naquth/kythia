/**
 * @namespace: addons/core/events/stickerCreate.js
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

module.exports = async (bot, sticker) => {
	if (!sticker.guild) return;
	const container = bot.client.container;
	const { models, helpers } = container;
	const { ServerSetting } = models;
	const { convertColor } = helpers.color;

	try {
		const settings = await ServerSetting.getCache({
			guildId: sticker.guild.id,
		});
		if (!settings || !settings.auditLogChannelId) return;

		const logChannel = await sticker.guild.channels
			.fetch(settings.auditLogChannelId)
			.catch(() => null);
		if (!logChannel || !logChannel.isTextBased()) return;

		const audit = await sticker.guild.fetchAuditLogs({
			type: AuditLogEvent.StickerCreate,
			limit: 1,
		});

		const entry = audit.entries.find(
			(e) =>
				e.target?.id === sticker.id && e.createdTimestamp > Date.now() - 5000,
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
						`🏷️ **Sticker Created** by <@${executor?.id || 'Unknown'}>\n\n` +
							`**Sticker:** <:${sticker.name}:${sticker.id}>\n` +
							`**Name:** ${sticker.name}\n` +
							`**Description:** ${sticker.description || 'No description'}\n` +
							`**Available:** ${sticker.available ? 'Yes' : 'No'}\n` +
							`**Managed:** ${sticker.managed ? 'Yes' : 'No'}` +
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
						`👤 **Executor:** ${executor?.tag || 'Unknown'} (${executor?.id || 'Un known'})\n` +
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
		console.error('Error in guildStickerCreate audit log:', err);
	}
};
