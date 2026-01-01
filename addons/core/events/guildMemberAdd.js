/**
 * @namespace: addons/core/events/guildMemberAdd.js
 * @type: Event Handler
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	resolvePlaceholders,
	safeResolvePlaceholder,
} = require('../helpers/stats');

const { welcomeBanner } = require('kythia-arts');
const {
	ContainerBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	MessageFlags,
} = require('discord.js');
const Sentry = require('@sentry/node');

module.exports = async (bot, member) => {
	const container = bot.client.container;
	const { models, helpers, kythiaConfig, logger, t } = container;
	const { ServerSetting, User } = models;
	const { embedFooter, getTextChannelSafe } = helpers.discord;
	const { convertColor } = helpers.color;

	let user = await User.getCache({
		userId: member.user.id,
		guildId: member.guild.id,
	});
	if (!user) {
		user = await User.create({
			userId: member.user.id,
			guildId: member.guild.id,
		});
	}
	const guild = member.guild;
	const guildId = guild.id;

	const setting = await ServerSetting.getCache({ guildId: guildId });
	if (!setting || !setting.welcomeInOn) return;

	const channel = await getTextChannelSafe(guild, setting.welcomeInChannelId);
	if (!channel) return logger.info('Welcome channel not found');

	if (setting.welcomeRoleId) {
		try {
			const welcomeRole = guild.roles.cache.get(setting.welcomeRoleId);
			if (welcomeRole) {
				await member.roles.add(welcomeRole);
				logger.info(`Added welcome role to ${member.user.tag}`);
			}
		} catch (err) {
			logger.error(`Failed to add welcome role: ${err}`, {
				label: 'guildMemberAdd',
			});
		}
	}

	const statsData = {
		userId: member.user.id,
		tag: member.user.tag,
		username: member.user.username,
		userTag: member.user.id,
		guildName: guild.name,
		guildId: guild.id,
		ownerName: guild.members.cache.get(guild.ownerId)?.user?.tag || 'Unknown',
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
		online: guild.members.cache.filter((m) => m.presence?.status === 'online')
			.size,
		idle: guild.members.cache.filter((m) => m.presence?.status === 'idle').size,
		dnd: guild.members.cache.filter((m) => m.presence?.status === 'dnd').size,
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

	let welcomeText;
	if (setting.welcomeInEmbedText) {
		const welcomeInTextValue = setting.welcomeInEmbedText;
		if (typeof welcomeInTextValue !== 'string' || !welcomeInTextValue.trim()) {
			welcomeText = `${member.user.username} has joined the server!`;
		} else {
			try {
				welcomeText = await resolvePlaceholders(
					container,
					welcomeInTextValue,
					statsData,
					member.guild.preferredLocale,
				);
				if (typeof welcomeText === 'string') {
					welcomeText = welcomeText.replace(/\\n/g, '\n');
				}
				if (welcomeText == null) {
					welcomeText = `${member.user.username} has joined the server!`;
				}
			} catch (err) {
				logger.error('Error in resolvePlaceholders for welcomeInText:', err, {
					label: 'guildMemberAdd',
				});
				welcomeText = `${member.user.username} has joined the server!`;
			}
		}
	} else {
		welcomeText = `${member.user.username} has joined the server!`;
	}

	/**
	 * welcomeInBannerWidth/Height,		customWidth, customHeight
	 * welcomeInBackgroundUrl,			customBackground
	 * welcomeInOverlayColor,			overlayColor
	 * welcomeInAvatarSize,				avatarSize
	 * welcomeInAvatarYOffset,			avatarY
	 * welcomeInAvatarBorderWidth,		avatarBorder.width
	 * welcomeInAvatarBorderColor,		avatarBorder.color
	 * welcomeInMainTextContent,		welcomeText
	 * welcomeInMainTextColor,			welcomeColor
	 * welcomeInMainTextFontFamily,		customFont
	 *
	 */

	const welcomeInImage = await welcomeBanner(member.user.id, {
		//
		customUsername: member.user.username,
		botToken: process.env.DISCORD_BOT_TOKEN,

		customWidth: setting.welcomeInBannerWidth || 1024,
		customHeight: setting.welcomeInBannerHeight || 450,

		customBackground: setting.welcomeInBackgroundUrl || null,
		overlayColor: setting.welcomeInOverlayColor || null,

		avatarSize: setting.welcomeInAvatarSize || null,
		avatarY: setting.welcomeInAvatarYOffset || null,
		avatarBorder: {
			width: setting.welcomeInAvatarBorderWidth || 6,
			color: setting.welcomeInAvatarBorderColor || '#FFFFFF',
		},

		welcomeText:
			(await safeResolvePlaceholder(
				member,
				setting.welcomeInMainTextContent || 'WELCOME',
				statsData,
				'WELCOME',
			)) || 'WELCOME',

		customFont: setting.welcomeInMainTextFontFamily || null,
		fontWeight: setting.welcomeInMainTextFontWeight || null,

		welcomeColor: setting.welcomeInMainTextColor || null,

		usernameColor: setting.welcomeInSubTextColor || null,

		textOffsetY: setting.welcomeInMainTextYOffset || null,

		textShadow: !!setting.welcomeInShadowColor,

		type: 'welcome',
	});

	let safeWelcomeText;
	try {
		if (typeof welcomeText !== 'string') {
			safeWelcomeText = String(welcomeText ?? '');
		} else {
			safeWelcomeText = welcomeText;
		}
	} catch (_e) {
		safeWelcomeText = '';
	}

	let embedImageUrl = welcomeInImage;
	const files = [];
	if (Buffer.isBuffer(welcomeInImage)) {
		const { AttachmentBuilder } = require('discord.js');
		const attachment = new AttachmentBuilder(welcomeInImage, {
			name: 'welcome.png',
		});
		files.push(attachment);
		embedImageUrl = 'attachment://welcome.png';
	}

	const footerObj = await embedFooter(member);
	const footerContent = footerObj?.text || '';

	const accentColor = convertColor(
		setting.welcomeInEmbedColor || kythiaConfig.bot.color,
		{
			from: 'hex',
			to: 'decimal',
		},
	);

	const welcomeContainer = new ContainerBuilder()
		.setAccentColor(accentColor)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(safeWelcomeText),
		)
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		)
		.addMediaGalleryComponents(
			new MediaGalleryBuilder().addItems([
				new MediaGalleryItemBuilder().setURL(embedImageUrl),
			]),
		)
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(footerContent),
		);

	channel.send({
		components: [welcomeContainer],
		files,
		flags: MessageFlags.IsComponentsV2,
	});

	if (setting.auditLogChannelId) {
		const logChannel = await member.guild.channels
			.fetch(setting.auditLogChannelId)
			.catch(() => null);

		if (logChannel?.isTextBased()) {
			try {
				// Regular leave log
				const components = [
					new ContainerBuilder()
						.setAccentColor(
							convertColor('Green', { from: 'discord', to: 'decimal' }),
						)
						.addTextDisplayComponents(
							new TextDisplayBuilder().setContent(
								`## Member Join\n\n` +
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
				logger.error(err, { label: 'guildMemberAdd' });
				if (bot.config?.sentry?.dsn) {
					Sentry.captureException(err);
				}
			}
		}
	}
};
