/**
 * @namespace: addons/core/events/guildMemberRemove.js
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
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
} = require('discord.js');
const Sentry = require('@sentry/node');

const {
	resolvePlaceholders,
	safeResolvePlaceholder,
} = require('../helpers/stats');
const { welcomeBanner } = require('kythia-arts');

module.exports = async (bot, member) => {
	if (!member.guild) return;
	const container = bot.client.container;
	const { models, helpers, kythiaConfig, logger, t } = container;
	const { ServerSetting } = models;
	const { embedFooter, getTextChannelSafe } = helpers.discord;
	const { convertColor } = helpers.color;

	const setting = await ServerSetting.getCache({ guildId: member.guild.id });
	if (!setting) return;
	const guild = member.guild;

	if (setting.welcomeOutOn) {
		const outChannel = await getTextChannelSafe(
			member.guild,
			setting.welcomeOutChannelId,
		);

		if (outChannel) {
			const statsData = {
				userId: member.user.id,
				tag: member.user.tag,
				username: member.user.username,
				userTag: member.user.id,
				guildName: guild.name,
				guildId: guild.id,
				ownerName:
					guild.members.cache.get(guild.ownerId)?.user?.tag || 'Unknown',
				ownerId: guild.ownerId,
				region: guild.preferredLocale,
				createdAt: guild.createdAt,
				boosts: guild.premiumSubscriptionCount || 0,
				boostLevel: guild.premiumTier || 0,
				members: guild.memberCount,
				roles: guild.roles.cache.size,
				emojis: guild.emojis.cache.size,
				stickers: guild.stickers.cache.size,
				memberJoin: member.joinedAt,
				online: guild.members.cache.filter(
					(m) => m.presence?.status === 'online',
				).size,
				idle: guild.members.cache.filter((m) => m.presence?.status === 'idle')
					.size,
				dnd: guild.members.cache.filter((m) => m.presence?.status === 'dnd')
					.size,
				offline: guild.members.cache.filter(
					(m) => !m.presence || m.presence.status === 'offline',
				).size,
				bots: guild.members.cache.filter((m) => m.user.bot).size,
				humans: guild.members.cache.filter((m) => !m.user.bot).size,
				onlineBots: guild.members.cache.filter(
					(m) => m.user.bot && m.presence && m.presence.status !== 'offline',
				).size,
				onlineHumans: guild.members.cache.filter(
					(m) => !m.user.bot && m.presence && m.presence.status !== 'offline',
				).size,
				channels: guild.channels.cache.size,
				textChannels: guild.channels.cache.filter(
					(c) => c.type === 0 || c.type === 'GUILD_TEXT',
				).size,
				voiceChannels: guild.channels.cache.filter(
					(c) => c.type === 2 || c.type === 'GUILD_VOICE',
				).size,
				categories: guild.channels.cache.filter(
					(c) => c.type === 4 || c.type === 'GUILD_CATEGORY',
				).size,
				announcementChannels: guild.channels.cache.filter(
					(c) => c.type === 5 || c.type === 'GUILD_ANNOUNCEMENT',
				).size,
				stageChannels: guild.channels.cache.filter(
					(c) => c.type === 13 || c.type === 'GUILD_STAGE_VOICE',
				).size,
				verified: guild.verified,
				partnered: guild.partnered,
				membersTotal: guild.members.cache.size,
			};
			let goodbyeText;
			if (setting.welcomeOutEmbedText) {
				const val = setting.welcomeOutEmbedText;
				if (typeof val !== 'string' || !val.trim()) {
					goodbyeText = `${member.user.username} has left the server.`;
				} else {
					try {
						goodbyeText = await resolvePlaceholders(
							container,
							val,
							statsData,
							member.guild.preferredLocale,
						);
						if (typeof goodbyeText === 'string') {
							goodbyeText = goodbyeText.replace(/\\n/g, '\n');
						}
					} catch (_e) {
						goodbyeText = `${member.user.username} has left the server.`;
					}
				}
			} else {
				goodbyeText = `${member.user.username} has left the server.`;
			}

			// Generate Goodbye Banner
			let goodbyeImage;
			try {
				goodbyeImage = await welcomeBanner(member.user.id, {
					botToken: kythiaConfig.bot.token,
					customUsername: member.user.username,

					customWidth: setting.welcomeOutBannerWidth || 1024,
					customHeight: setting.welcomeOutBannerHeight || 450,

					customBackground: setting.welcomeOutBackgroundUrl || null,
					overlayColor: setting.welcomeOutOverlayColor || null,

					avatarSize: setting.welcomeOutAvatarSize || null,
					avatarY: setting.welcomeOutAvatarYOffset || null,
					avatarBorder: {
						width: setting.welcomeOutAvatarBorderWidth || 6,
						color: setting.welcomeOutAvatarBorderColor || '#FFFFFF',
					},

					welcomeText:
						(await safeResolvePlaceholder(
							member,
							setting.welcomeOutMainTextContent || 'GOODBYE',
							statsData,
							'GOODBYE',
						)) || 'GOODBYE',

					customFont: setting.welcomeOutMainTextFontFamily || null,
					fontWeight: setting.welcomeOutMainTextFontWeight || null,

					welcomeColor: setting.welcomeOutMainTextColor || null,
					usernameColor: setting.welcomeOutSubTextColor || null,

					textOffsetY: setting.welcomeOutMainTextYOffset || null,

					type: 'goodbye',
				});
			} catch (e) {
				logger.error(
					`[GuildMemberRemove] Failed to generate banner: ${e.message}`,
					{ label: 'guildMemberRemove:banner' },
				);
				goodbyeImage = null;
			}

			const accentColor = convertColor(
				setting.welcomeInEmbedColor || kythiaConfig.bot.color,
				{
					from: 'hex',
					to: 'decimal',
				},
			);

			// Footer handling
			const footerObj = await embedFooter(member);
			const footerContent = footerObj?.text || '';

			let embedImageUrl = goodbyeImage;
			const files = [];

			if (Buffer.isBuffer(goodbyeImage)) {
				const { AttachmentBuilder } = require('discord.js');
				const attachment = new AttachmentBuilder(goodbyeImage, {
					name: 'goodbye.png',
				});
				files.push(attachment);
				embedImageUrl = 'attachment://goodbye.png';
			}

			const goodbyeContainer = new ContainerBuilder()
				.setAccentColor(accentColor)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(String(goodbyeText || '')),
				)
				.addSeparatorComponents(
					new SeparatorBuilder()
						.setSpacing(SeparatorSpacingSize.Small)
						.setDivider(true),
				);

			if (embedImageUrl) {
				goodbyeContainer.addMediaGalleryComponents(
					new MediaGalleryBuilder().addItems([
						new MediaGalleryItemBuilder().setURL(embedImageUrl),
					]),
				);
				goodbyeContainer.addSeparatorComponents(
					new SeparatorBuilder()
						.setSpacing(SeparatorSpacingSize.Small)
						.setDivider(true),
				);
			}

			goodbyeContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(footerContent),
			);

			await outChannel
				.send({
					components: [goodbyeContainer],
					files,
					flags: MessageFlags.IsComponentsV2,
				})
				.catch((err) =>
					logger.error(
						`[GuildMemberRemove] Failed to send goodbye msg: ${err.message}`,
						{ label: 'guildMemberRemove:send' },
					),
				);
		}
	}

	if (setting.auditLogChannelId) {
		const logChannel = await member.guild.channels
			.fetch(setting.auditLogChannelId)
			.catch(() => null);

		if (logChannel?.isTextBased()) {
			try {
				// Check if it was a kick
				const kickAudit = await member.guild.fetchAuditLogs({
					type: AuditLogEvent.MemberKick,
					limit: 1,
				});

				const kickEntry = kickAudit.entries.find(
					(e) =>
						e.target?.id === member.id &&
						e.createdTimestamp > Date.now() - 5000,
				);

				if (kickEntry) {
					const executor = kickEntry.executor;
					const components = [
						new ContainerBuilder()
							.setAccentColor(
								convertColor('Red', { from: 'discord', to: 'decimal' }),
							)
							.addTextDisplayComponents(
								new TextDisplayBuilder().setContent(
									`👢 **Member Kicked** by <@${executor?.id || 'Unknown'}>\n\n` +
										`**User:** ${member.user.tag} (<@${member.user.id}>)\n` +
										`**User ID:** ${member.user.id}\n` +
										`**Account Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:F>\n` +
										`**Joined Server:** ${member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:F>` : 'Unknown'}` +
										(kickEntry.reason
											? `\n\n**Reason:** ${kickEntry.reason}`
											: ''),
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
							)
							.addSeparatorComponents(
								new SeparatorBuilder()
									.setSpacing(SeparatorSpacingSize.Small)
									.setDivider(true),
							)
							.addTextDisplayComponents(
								new TextDisplayBuilder().setContent(
									await t(
										{ guildId: member.guild.id },
										'common.container.footer',
										{
											username: bot.client.user.username,
										},
									),
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
					return;
				}

				// Regular leave log
				const components = [
					new ContainerBuilder()
						.setAccentColor(
							convertColor('Orange', { from: 'discord', to: 'decimal' }),
						)
						.addTextDisplayComponents(
							new TextDisplayBuilder().setContent(
								`## 👋 Member Left\n\n` +
									`**User:** ${member.user.tag} (<@${member.user.id}>)\n` +
									`**User ID:** ${member.user.id}\n` +
									`**Account Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:F>\n` +
									`**Joined Server:**  ${member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:F>` : 'Unknown'}\n` +
									`**Member Count:** ${member.guild.memberCount}`,
							),
						)
						.addSeparatorComponents(
							new SeparatorBuilder()
								.setSpacing(SeparatorSpacingSize.Small)
								.setDivider(true),
						)
						.addTextDisplayComponents(
							new TextDisplayBuilder().setContent(
								`👤 **User:** ${member.user.tag}\n` +
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
								await t(
									{ guildId: member.guild.id },
									'common.container.footer',
									{
										username: bot.client.user.username,
									},
								),
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
				logger.error(err, { label: 'guildMemberRemove' });
				if (bot.config?.sentry?.dsn) {
					Sentry.captureException(err);
				}
			}
		}
	}
};
