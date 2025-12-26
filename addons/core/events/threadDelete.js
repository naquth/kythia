/**
 * @namespace: addons/core/events/threadDelete.js
 * @type: Event Handler
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	AuditLogEvent,
	ChannelType,
	MessageFlags,
	ContainerBuilder,
	SeparatorBuilder,
	TextDisplayBuilder,
	SeparatorSpacingSize,
} = require('discord.js');

const channelTypeNames = {
	[ChannelType.GuildText]: 'Text Channel',
	[ChannelType.GuildVoice]: 'Voice Channel',
	[ChannelType.GuildCategory]: 'Category',
	[ChannelType.GuildAnnouncement]: 'Announcement Channel',
	[ChannelType.AnnouncementThread]: 'Announcement Thread',
	[ChannelType.PublicThread]: 'Public Thread',
	[ChannelType.PrivateThread]: 'Private Thread',
	[ChannelType.GuildStageVoice]: 'Stage Channel',
	[ChannelType.GuildForum]: 'Forum Channel',
	[ChannelType.GuildMedia]: 'Media Channel',
	[ChannelType.GuildDirectory]: 'Directory Channel',
	[ChannelType.GuildStore]: 'Store Channel',
	[ChannelType.DM]: 'Direct Message',
	[ChannelType.GroupDM]: 'Group DM',
};

function humanChannelType(type) {
	if (typeof type === 'string' && channelTypeNames[type])
		return channelTypeNames[type];
	if (typeof type === 'number' && channelTypeNames[type])
		return channelTypeNames[type];
	if (typeof type === 'string') return type;
	if (typeof type === 'number') return `Unknown (${type})`;
	return 'Unknown';
}

module.exports = async (bot, thread) => {
	if (!thread.guild) return;
	const container = bot.client.container;
	const { models, helpers } = container;
	const { ServerSetting } = models;
	const { convertColor } = helpers.color;

	try {
		const settings = await ServerSetting.getCache({ guildId: thread.guild.id });
		if (!settings || !settings.auditLogChannelId) return;

		const logChannel = await thread.guild.channels
			.fetch(settings.auditLogChannelId)
			.catch(() => null);
		if (!logChannel || !logChannel.isTextBased()) return;

		const audit = await thread.guild.fetchAuditLogs({
			type: AuditLogEvent.ThreadDelete,
			limit: 1,
		});

		const entry = audit.entries.find(
			(e) =>
				e.target?.id === thread.id && e.createdTimestamp > Date.now() - 5000,
		);

		if (!entry) return;

		const executor = entry.executor;
		const components = [
			new ContainerBuilder()
				.setAccentColor(convertColor('Red', { from: 'discord', to: 'decimal' }))
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`🧵 **Thread Deleted** by <@${executor?.id || 'Unknown'}>\n\n` +
							`**Thread Name:** ${thread.name}\n` +
							`**Type:** ${humanChannelType(thread.type)}\n` +
							`**Parent Channel:** ${thread.parent ? `<#${thread.parent.id}>` : 'None'}\n` +
							`**Archived:** ${thread.archived ? 'Yes' : 'No'}\n` +
							`**Locked:** ${thread.locked ? 'Yes' : 'No'}\n` +
							`**Auto Archive Duration:** ${thread.autoArchiveDuration} minutes` +
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
		console.error('Error in threadDelete audit log:', err);
	}
};
