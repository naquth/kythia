/**
 * @namespace: addons/leveling/helpers/index.js
 * @type: Helper Script
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { profileImage } = require('kythia-arts');

const {
	ContainerBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
} = require('discord.js');

/**
 * Calculate the XP required to level up from the given level,
 * based on the server's leveling curve and multiplier.
 *
 * @param {number} level - The current level.
 * @param {'linear'|'exponential'|'constant'} [curve='linear'] - The curve type.
 * @param {number} [multiplier=1.0] - The XP multiplier.
 * @returns {number}
 */
const levelUpXp = (level, curve = 'linear', multiplier = 1.0) => {
	let base;
	switch (curve) {
		case 'exponential':
			base = Math.floor(100 * 1.5 ** (level - 1));
			break;
		case 'constant':
			base = 100;
			break;
		default:
			base = level * level * 50;
			break;
	}
	return Math.max(1, Math.floor(base * multiplier));
};

/**
 * Calculate level and remaining XP from total XP,
 * respecting curve type, multiplier, and optional max level.
 *
 * @param {number} totalXp
 * @param {'linear'|'exponential'|'constant'} [curve='linear']
 * @param {number} [multiplier=1.0]
 * @param {number|null} [maxLevel=null]
 * @returns {{ newLevel: number, newXp: number }}
 */
const calculateLevelAndXp = (
	totalXp,
	curve = 'linear',
	multiplier = 1.0,
	maxLevel = null,
) => {
	let level = 1;
	let xp = totalXp;
	while (xp >= levelUpXp(level, curve, multiplier)) {
		if (maxLevel !== null && level >= maxLevel) {
			xp = Math.min(xp, levelUpXp(level, curve, multiplier) - 1);
			break;
		}
		xp -= levelUpXp(level, curve, multiplier);
		level += 1;
	}
	return { newLevel: level, newXp: xp };
};

const addXp = async (guildId, userId, xpToAdd, message, channel) => {
	const { container } = message.client;
	const { helpers, t, models, kythiaConfig, logger } = container;
	const { ServerSetting, User } = models;
	const { getTextChannelSafe } = helpers.discord;
	const { convertColor } = helpers.color;

	const serverSetting = await ServerSetting.getCache({
		guildId: message.guild.id,
	});

	const curve = serverSetting?.levelingCurve || 'linear';
	const multiplier =
		typeof serverSetting?.levelingMultiplier === 'number'
			? serverSetting.levelingMultiplier
			: 1.0;
	const maxLevel =
		typeof serverSetting?.levelingMaxLevel === 'number'
			? serverSetting.levelingMaxLevel
			: null;

	if (!channel) {
		if (serverSetting?.levelingChannelId) {
			channel =
				(await getTextChannelSafe(
					message.guild,
					serverSetting.levelingChannelId,
				)) || null;
		}
	}

	let user = await User.getCache({ userId: userId, guildId: guildId });

	if (!user) {
		user = await User.create({ guildId, userId, xp: 0, level: 1 });
	}

	// If user is already at max level, do nothing
	if (maxLevel !== null && user.level >= maxLevel) return;

	user.xp = Number(BigInt(user.xp) + BigInt(xpToAdd));
	let leveledUp = false;
	const levelBefore = user.level;

	while (user.xp >= levelUpXp(user.level, curve, multiplier)) {
		if (maxLevel !== null && user.level >= maxLevel) {
			user.xp = levelUpXp(user.level, curve, multiplier) - 1;
			break;
		}
		user.xp -= levelUpXp(user.level, curve, multiplier);
		user.level += 1;
		leveledUp = true;
	}

	user.changed('xp', true);
	user.changed('level', true);
	await user.saveAndUpdateCache();

	if (!leveledUp) return;

	const member = await helpers.discord.getMemberSafe(message.guild, userId);

	let rewardRoleName = null;
	let rewardLevel = null;
	if (serverSetting && Array.isArray(serverSetting.roleRewards)) {
		const rewards = serverSetting.roleRewards.filter(
			(r) => r.level > levelBefore && r.level <= user.level,
		);

		if (rewards.length > 0) {
			const highestReward = rewards.reduce((a, b) =>
				a.level > b.level ? a : b,
			);
			const role = message.guild.roles.cache.get(highestReward.role);
			if (role && member) {
				await member.roles.add(role).catch(() => {});
				rewardRoleName = role.name;
				rewardLevel = highestReward.level;
			}
		}
	}

	let buffer;
	const imageName = 'level-up.png';
	try {
		buffer = await profileImage(userId, {
			botToken: kythiaConfig.bot.token,
			customTag: `Level Up!`,
			customSubtitle: `New Level: ${user.level}`,
			customBackground: kythiaConfig.addons.leveling.backgroundUrl || null,
			font: 'NOTO_SANS',
			usernameColor: '#FFFFFF',
			tagColor: kythiaConfig.bot.color || '#5865F2',
			borderColor: kythiaConfig.bot.color || '#5865F2',
			rankData: {
				currentXp: user.xp,
				requiredXp: levelUpXp(user.level, curve, multiplier),
				level: user.level,
				barColor: kythiaConfig.bot.color || '#5865F2',
				levelColor: kythiaConfig.bot.color || '#5865F2',
			},
			customFont: 'BagelFatOne-Regular',
			fontWeight: 'normal',
			badgesFrame: false,
			disabledBadges: false,
			squareAvatar: false,
			moreBackgroundBlur: false,
		});
	} catch (err) {
		logger.error('Failed to generate level up image:', err, {
			label: 'leveling:helpers',
		});
		buffer = null;
	}

	const accentColor = convertColor(kythiaConfig.bot.color, {
		from: 'hex',
		to: 'decimal',
	});

	const titleText = `## ${await t(message, 'leveling.helpers.index.leveling.profile.up.title')}`;
	const descText = await t(
		message,
		'leveling.helpers.index.leveling.profile.up.desc',
		{
			username: message.author.username,
			mention: message.author.toString(),
			level: user.level || 0,
			xp: user.xp || 0,
			nextLevelXp: levelUpXp(user.level, curve, multiplier),
		},
	);

	const containerBuilder = new ContainerBuilder()
		.setAccentColor(accentColor)
		.addTextDisplayComponents(new TextDisplayBuilder().setContent(titleText))
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		)
		.addTextDisplayComponents(new TextDisplayBuilder().setContent(descText));

	if (rewardRoleName && rewardLevel) {
		const rewardTitle = `### ${await t(message, 'leveling.helpers.index.leveling.role.reward.title')}`;
		const rewardDesc = await t(
			message,
			'leveling.helpers.index.leveling.role.reward.desc',
			{
				mention: message.author.toString(),
				role: rewardRoleName,
				level: rewardLevel,
			},
		);

		containerBuilder
			.addSeparatorComponents(
				new SeparatorBuilder()
					.setSpacing(SeparatorSpacingSize.Small)
					.setDivider(true),
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(rewardTitle),
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(rewardDesc),
			);
	}

	if (buffer && (Buffer.isBuffer(buffer) || typeof buffer === 'string')) {
		containerBuilder.addMediaGalleryComponents(
			new MediaGalleryBuilder().addItems([
				new MediaGalleryItemBuilder().setURL(`attachment://${imageName}`),
			]),
		);
	}

	const footerText = await t(message, 'common.container.footer', {
		username: message.client.user.username,
	});

	containerBuilder
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		)
		.addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText));

	if (channel) {
		const payload = {
			content: message.author.toString(),
			components: [containerBuilder],
		};

		if (buffer && (Buffer.isBuffer(buffer) || typeof buffer === 'string')) {
			payload.files = [{ attachment: buffer, name: imageName }];
		}

		await channel.send(payload).catch(() => {});
	}
};

module.exports = {
	levelUpXp,
	calculateLevelAndXp,
	addXp,
};
