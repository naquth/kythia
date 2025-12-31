/**
 * @namespace: addons/leveling/commands/add.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */
const { MessageFlags, PermissionFlagsBits } = require('discord.js');

module.exports = {
	subcommand: true,
	permissions: [PermissionFlagsBits.ManageGuild],
	slashCommand: (subcommand) =>
		subcommand
			.setName('add')
			.setDescription('Add levels to a user.')
			.addUserOption((option) =>
				option
					.setName('user')
					.setDescription('The user to add levels to.')
					.setRequired(true),
			)
			.addIntegerOption((option) =>
				option
					.setName('level')
					.setDescription('The amount of levels to add.')
					.setRequired(true),
			),

	async execute(interaction, container) {
		const { t, models, helpers, kythiaConfig } = container;
		const { simpleContainer } = helpers.discord;
		const { User } = models;

		await interaction.deferReply({ ephemeral: true });

		const targetUser = interaction.options.getUser('user');
		const levelToAdd = interaction.options.getInteger('level');
		const user = await User.getCache({
			userId: targetUser.id,
			guildId: interaction.guild.id,
		});

		if (!user) {
			const components = await simpleContainer(
				interaction,
				`## ${await t(interaction, 'leveling.add.leveling.user.not.found.title')}\n${await t(interaction, 'leveling.add.leveling.user.not.found.desc')}`,
				{ color: 'Red' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		user.level += levelToAdd;
		user.xp = 0;
		user.changed('level', true);
		user.changed('xp', true);
		await user.saveAndUpdateCache('userId');

		const components = await simpleContainer(
			interaction,
			`## ${await t(interaction, 'leveling.add.leveling.level.add.title')}\n` +
				(await t(interaction, 'leveling.add.leveling.level.add.desc', {
					username: targetUser.username,
					level: levelToAdd,
					newLevel: user.level,
				})),
			{ color: kythiaConfig.bot.color },
		);

		return interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
