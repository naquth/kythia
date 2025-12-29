/**
 * @namespace: addons/leveling/commands/profile.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */
const {
	ContainerBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	MessageFlags,
} = require('discord.js');
const { levelUpXp } = require('../helpers');

const { profileImage } = require('kythia-arts');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('profile')
			.setDescription("Check your or another user's level profile.")
			.addUserOption((option) =>
				option
					.setName('user')
					.setDescription('The user whose profile you want to see.'),
			),

	async execute(interaction, container) {
		const { t, models, kythiaConfig, helpers } = container;
		const { User } = models;
		const { convertColor } = helpers.color;

		await interaction.deferReply();

		const targetUser = interaction.options.getUser('user') || interaction.user;

		let user = await User.getCache({
			userId: targetUser.id,
			guildId: interaction.guild.id,
		});

		// Handle User Baru
		if (!user) {
			user = await User.create({
				userId: targetUser.id,
				guildId: interaction.guild.id,
				xp: 0,
				level: 1,
			});

			// Tampilkan pesan "Profile Created" pake Container sederhana
			const title = `## ${await t(interaction, 'leveling.profile.leveling.profile.created.title')}`;
			const desc = await t(
				interaction,
				'leveling.profile.leveling.profile.created.desc',
			);
			const footerText = await t(interaction, 'common.container.footer', {
				username: interaction.client.user.username,
			});

			const accentColor = convertColor('Yellow', {
				from: 'discord',
				to: 'decimal',
			});

			const createdContainer = new ContainerBuilder()
				.setAccentColor(accentColor)
				.addTextDisplayComponents(new TextDisplayBuilder().setContent(title))
				.addSeparatorComponents(
					new SeparatorBuilder()
						.setSpacing(SeparatorSpacingSize.Small)
						.setDivider(true),
				)
				.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc))
				.addSeparatorComponents(
					new SeparatorBuilder()
						.setSpacing(SeparatorSpacingSize.Small)
						.setDivider(true),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(footerText),
				);

			return interaction.editReply({
				components: [createdContainer],
				flags: MessageFlags.IsComponentsV2,
			});
		}

		// 🎨 Generate profile card dengan kythia-arts (Direct - No Helper!)
		const imageName = 'level-profile.png';

		// Get member untuk presence status
		const member = interaction.guild.members.cache.get(targetUser.id);

		// 🎨 kythia-arts Configuration (Mudah diutak-atik!)
		const buffer = await profileImage(targetUser.id, {
			// botToken: kythiaConfig.bot.token,
			customWidth: 1024,
			customHeight: 450,
			customTag: `Level ${user.level}`, // Text di bawah username
			customSubtitle: `XP Progress`, // Text paling bawah

			customBackground: kythiaConfig.addons.leveling.backgroundUrl || null,

			usernameColor: '#FFFFFF',
			tagColor: kythiaConfig.bot.color || '#5865F2',
			borderColor: kythiaConfig.bot.color || '#5865F2',

			rankData: {
				currentXp: user.xp,
				requiredXp: levelUpXp(user.level),
				level: user.level,
				barColor: kythiaConfig.bot.color || '#5865F2',
				levelColor: kythiaConfig.bot.color || '#5865F2',
				// autoColorRank: true, // Gold/Silver/Bronze untuk rank 1-3
			},

			customFont: 'BagelFatOne-Regular',
			fontWeight: 'normal',
			// ⚙️ Options
			badgesFrame: false, // Frame di belakang badges
			// presenceStatus: member?.presence?.status || 'offline', // online/idle/dnd/offline
			disabledBadges: false, // Disable badges
			squareAvatar: false, // false = circle, true = square
			moreBackgroundBlur: false, // Triple background blur
			// backgroundBrightness: 100, // 1-100%
			// customDate: 'Kythia',
			// hideDate: true,
		});

		// 🔥 BUILD PROFILE CONTAINER
		const botColor = convertColor(kythiaConfig.bot.color, {
			from: 'hex',
			to: 'decimal',
		});

		const titleText = `## ${await t(interaction, 'leveling.profile.leveling.profile.title')}`;
		const descText = await t(
			interaction,
			'leveling.profile.leveling.profile.desc',
			{
				username: targetUser.username,
				level: user.level || 0,
				xp: user.xp || 0,
				nextLevelXp: levelUpXp(user.level),
			},
		);

		const footerText = await t(interaction, 'common.container.footer', {
			username: interaction.client.user.username,
		});

		const profileContainer = new ContainerBuilder()
			.setAccentColor(botColor)
			// Header
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(titleText))
			.addSeparatorComponents(
				new SeparatorBuilder()
					.setSpacing(SeparatorSpacingSize.Small)
					.setDivider(true),
			)
			// Stats
			.addTextDisplayComponents(new TextDisplayBuilder().setContent(descText))
			// Image
			.addMediaGalleryComponents(
				new MediaGalleryBuilder().addItems([
					new MediaGalleryItemBuilder().setURL(`attachment://${imageName}`),
				]),
			)
			// Footer
			.addSeparatorComponents(
				new SeparatorBuilder()
					.setSpacing(SeparatorSpacingSize.Small)
					.setDivider(true),
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(footerText),
			);

		// Kirim Reply dengan Attachment
		await interaction.editReply({
			components: [profileContainer],
			files: [{ attachment: buffer, name: imageName }],
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
