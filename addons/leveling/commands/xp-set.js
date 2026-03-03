/**
 * @namespace: addons/leveling/commands/xp-set.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { PermissionFlagsBits, MessageFlags } = require('discord.js');
const { calculateLevelAndXp } = require('../helpers');

module.exports = {
	subcommand: true,
	permissions: [PermissionFlagsBits.ManageGuild],
	slashCommand: (subcommand) =>
		subcommand
			.setName('xp-set')
			.setDescription("Set a user's total XP to a specific value.")
			.addUserOption((option) =>
				option
					.setName('user')
					.setDescription('The user to set the XP for.')
					.setRequired(true),
			)
			.addIntegerOption((option) =>
				option
					.setName('xp')
					.setDescription('The total XP to set.')
					.setRequired(true),
			),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, models, helpers, kythiaConfig } = container;
		const { simpleContainer } = helpers.discord;
		const { User, ServerSetting } = models;

		await interaction.deferReply({ ephemeral: true });

		const serverSetting = await ServerSetting.getCache({
			guildId: interaction.guild.id,
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

		const targetUser = interaction.options.getUser('user');
		const xpToSet = interaction.options.getInteger('xp');
		const user = await User.getCache({
			userId: targetUser.id,
			guildId: interaction.guild.id,
		});

		if (!user) {
			const components = await simpleContainer(
				interaction,
				`## ${await t(interaction, 'leveling.xp-set.leveling.user.not.found.title')}\n${await t(interaction, 'leveling.xp-set.leveling.user.not.found.desc')}`,
				{ color: 'Red' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const { newLevel, newXp } = calculateLevelAndXp(
			xpToSet,
			curve,
			multiplier,
			maxLevel,
		);
		user.level = newLevel;
		user.xp = newXp;
		user.changed('xp', true);
		user.changed('level', true);
		await user.saveAndUpdateCache('userId');

		const components = await simpleContainer(
			interaction,
			`## ${await t(interaction, 'leveling.xp-set.leveling.xp.set.title')}\n` +
				(await t(interaction, 'leveling.xp-set.leveling.xp.set.desc', {
					username: targetUser.username,
					newLevel: user.level,
					newXp: user.xp,
				})),
			{ color: kythiaConfig.bot.color },
		);

		return interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
