/**
 * @namespace: addons/leveling/commands/profile.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const {
	MediaGalleryItemBuilder,
	SeparatorSpacingSize,
	MediaGalleryBuilder,
	TextDisplayBuilder,
	ContainerBuilder,
	SeparatorBuilder,
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

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, models, kythiaConfig, helpers } = container;
		const { User, ServerSetting } = models;
		const { convertColor } = helpers.color;

		await interaction.deferReply();

		const serverSetting = await ServerSetting.getCache({
			guildId: interaction.guild.id,
		});
		const curve = serverSetting?.levelingCurve || 'linear';
		const multiplier =
			typeof serverSetting?.levelingMultiplier === 'number'
				? serverSetting.levelingMultiplier
				: 1.0;

		const targetUser = interaction.options.getUser('user') || interaction.user;

		let user = await User.getCache({
			userId: targetUser.id,
			guildId: interaction.guild.id,
		});

		if (!user) {
			user = await User.create({
				userId: targetUser.id,
				guildId: interaction.guild.id,
				xp: 0,
				level: 1,
			});

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

		const imageName = 'level-profile.png';

		const buffer = await profileImage(targetUser.id, {
			customWidth: 1024,
			customHeight: 450,
			customTag: `Level ${user.level}`,
			customSubtitle: `XP Progress`,

			customBackground: kythiaConfig.addons.leveling.backgroundUrl || null,

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
				nextLevelXp: levelUpXp(user.level, curve, multiplier),
			},
		);

		const footerText = await t(interaction, 'common.container.footer', {
			username: interaction.client.user.username,
		});

		const profileContainer = new ContainerBuilder()
			.setAccentColor(botColor)

			.addTextDisplayComponents(new TextDisplayBuilder().setContent(titleText))
			.addSeparatorComponents(
				new SeparatorBuilder()
					.setSpacing(SeparatorSpacingSize.Small)
					.setDivider(true),
			)

			.addTextDisplayComponents(new TextDisplayBuilder().setContent(descText))

			.addMediaGalleryComponents(
				new MediaGalleryBuilder().addItems([
					new MediaGalleryItemBuilder().setURL(`attachment://${imageName}`),
				]),
			)

			.addSeparatorComponents(
				new SeparatorBuilder()
					.setSpacing(SeparatorSpacingSize.Small)
					.setDivider(true),
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(footerText),
			);

		await interaction.editReply({
			components: [profileContainer],
			files: [{ attachment: buffer, name: imageName }],
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
