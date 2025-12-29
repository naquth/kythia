/**
 * @namespace: addons/leveling/helpers/index.js
 * @type: Helper Script
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
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

const levelUpXp = (level) => level * level * 50;

const addXp = async (guildId, userId, xpToAdd, message, channel) => {
	const { container } = message.client;
	const { helpers, kythia, t, models, kythiaConfig } = container;
	const { ServerSetting, User } = models;
	const { getTextChannelSafe } = helpers.discord;
	const { convertColor } = helpers.color;

	// 1. Resolve Channel
	if (!channel) {
		const setting = await ServerSetting.getCache({ guildId: message.guild.id });
		if (setting?.levelingChannelId) {
			channel =
				(await getTextChannelSafe(message.guild, setting.levelingChannelId)) ||
				null;
		}
	}

	// 2. Fetch User Data
	let user = await User.getCache({ userId: userId, guildId: guildId });

	if (!user) {
		user = await User.create({ guildId, userId, xp: 0, level: 1 });
	}

	// 3. Logic XP & Level Up
	user.xp = Number(BigInt(user.xp) + BigInt(xpToAdd));
	let leveledUp = false;
	const levelBefore = user.level;

	while (user.xp >= levelUpXp(user.level)) {
		user.xp -= levelUpXp(user.level);
		user.level += 1;
		leveledUp = true;
	}

	user.changed('xp', true);
	user.changed('level', true);
	await user.saveAndUpdateCache();

	if (!leveledUp) return;

	// 4. Handle Rewards
	const member = await helpers.discord.getMemberSafe(message.guild, userId);
	const serverSetting = await ServerSetting.getCache({
		guildId: message.guild.id,
	});

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

	// 5. Generate Image (Level Up)
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
				requiredXp: levelUpXp(user.level),
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
		console.error('Failed to generate level up image:', err);
		buffer = null;
	}

	// 6. 🔥 BUILD CONTAINER
	const accentColor = convertColor(kythia.bot.color, {
		from: 'hex',
		to: 'decimal',
	});

	// String content
	const titleText = `## ${await t(message, 'leveling.helpers.index.leveling.profile.up.title')}`;
	const descText = await t(
		message,
		'leveling.helpers.index.leveling.profile.up.desc',
		{
			username: message.author.username,
			mention: message.author.toString(),
			level: user.level || 0,
			xp: user.xp || 0,
			nextLevelXp: levelUpXp(user.level),
		},
	);

	// Mulai racik Container
	const containerBuilder = new ContainerBuilder()
		.setAccentColor(accentColor)
		.addTextDisplayComponents(new TextDisplayBuilder().setContent(titleText))
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		)
		.addTextDisplayComponents(new TextDisplayBuilder().setContent(descText));

	// Kalau ada Reward Role, tambahin sekat dan infonya
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

	// Kalau ada gambar, masukin sebagai FileComponent dalam container
	if (buffer && (Buffer.isBuffer(buffer) || typeof buffer === 'string')) {
		containerBuilder.addMediaGalleryComponents(
			new MediaGalleryBuilder().addItems([
				new MediaGalleryItemBuilder().setURL(`attachment://${imageName}`),
			]),
		);
	}

	// Footer cantik
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

	// 7. Kirim Pesan
	if (channel) {
		const payload = {
			content: message.author.toString(),
			components: [containerBuilder],
		};

		// Attach file fisiknya kalau ada buffer
		if (buffer && (Buffer.isBuffer(buffer) || typeof buffer === 'string')) {
			payload.files = [{ attachment: buffer, name: imageName }];
		}

		await channel.send(payload).catch(() => {});
	}
};

const _calculateLevel = (xp) => {
	let level = 1;
	while (xp >= levelUpXp(level)) {
		xp -= levelUpXp(level);
		level += 1;
	}
	return level;
};

function calculateLevelAndXp(totalXp) {
	let level = 1;
	let xp = totalXp;
	while (xp >= levelUpXp(level)) {
		xp -= levelUpXp(level);
		level += 1;
	}
	return { newLevel: level, newXp: xp };
}

module.exports = {
	levelUpXp,
	calculateLevelAndXp,
	addXp,
};
