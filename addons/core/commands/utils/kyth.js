/**
 * @namespace: addons/core/commands/utils/kyth.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	MessageFlags,
	SlashCommandBuilder,
	PermissionFlagsBits,
	InteractionContextType,
} = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('kyth')
		.setDescription('🛠️ Manage All Kythia related config')
		.addSubcommandGroup((group) =>
			group
				.setName('team')
				.setDescription('Manage Kythia Team members')
				.addSubcommand((sub) =>
					sub
						.setName('add')
						.setDescription('Add a member to Kythia Team')
						.addUserOption((option) =>
							option
								.setName('user')
								.setDescription('User to add to the team')
								.setRequired(true),
						)
						.addStringOption((option) =>
							option
								.setName('name')
								.setDescription('Name/role of the team member')
								.setRequired(false),
						),
				)
				.addSubcommand((sub) =>
					sub
						.setName('delete')
						.setDescription('Remove a member from Kythia Team')
						.addUserOption((option) =>
							option
								.setName('user')
								.setDescription('User to remove from the team')
								.setRequired(true),
						),
				)
				.addSubcommand((sub) =>
					sub.setName('list').setDescription('Show all Kythia Team members'),
				),
		)
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	ownerOnly: true,
	mainGuildOnly: true,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		await interaction.deferReply();

		const subcommandGroup = interaction.options.getSubcommandGroup();
		const subcommand = interaction.options.getSubcommand();

		if (subcommandGroup === 'team') {
			if (subcommand === 'add') {
				await this.handleAdd(interaction, container);
			} else if (subcommand === 'delete') {
				await this.handleDelete(interaction, container);
			} else if (subcommand === 'list') {
				await this.handleList(interaction, container);
			}
		}
	},

	async handleAdd(interaction, container) {
		const { models, logger, helpers } = container;
		const { KythiaTeam } = models;
		const { createContainer } = helpers.discord;

		const user = interaction.options.getUser('user');
		const name = interaction.options.getString('name') || null;

		try {
			const existing = await KythiaTeam.getCache({ userId: user.id });
			if (existing) {
				const components = await createContainer(interaction, {
					description: `❌ **${user.tag}** is already in the Kythia Team!`,
					color: 'Red',
				});
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}

			await KythiaTeam.create({
				userId: user.id,
				name: name,
			});

			const description =
				`Successfully added **${user.tag}** to Kythia Team!\n\n` +
				`**User ID:** ${user.id}\n` +
				`**Name/Role:** ${name || 'Not specified'}`;

			const components = await createContainer(interaction, {
				title: '✅ Team Member Added',
				description,
				color: 'Green',
			});

			await interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
			logger.info(
				`Added ${user.tag} (${user.id}) to Kythia Team by ${interaction.user.tag}`,
			);
		} catch (error) {
			logger.error('Failed to add team member:', error);
			const components = await createContainer(interaction, {
				description: `❌ Failed to add team member: ${error.message}`,
				color: 'Red',
			});
			await interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},

	async handleDelete(interaction, container) {
		const { models, logger, helpers } = container;
		const { KythiaTeam } = models;
		const { createContainer } = helpers.discord;

		const user = interaction.options.getUser('user');

		try {
			const existing = await KythiaTeam.getCache({ userId: user.id });
			if (!existing) {
				const components = await createContainer(interaction, {
					description: `❌ **${user.tag}** is not in the Kythia Team!`,
					color: 'Red',
				});
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}

			await KythiaTeam.destroy({ where: { userId: user.id } });

			const description =
				`Successfully removed **${user.tag}** from Kythia Team!\n\n` +
				`**User ID:** ${user.id}`;

			const components = await createContainer(interaction, {
				title: '✅ Team Member Removed',
				description,
				color: 'Red',
			});

			await interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
			logger.info(
				`Removed ${user.tag} (${user.id}) from Kythia Team by ${interaction.user.tag}`,
			);
		} catch (error) {
			logger.error('Failed to remove team member:', error);
			const components = await createContainer(interaction, {
				description: `❌ Failed to remove team member: ${error.message}`,
				color: 'Red',
			});
			await interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},

	async handleList(interaction, container) {
		const { models, logger, helpers } = container;
		const { KythiaTeam } = models;
		const { createContainer } = helpers.discord;

		try {
			const teamMembers = await KythiaTeam.getAllCache();

			if (teamMembers.length === 0) {
				const components = await createContainer(interaction, {
					description: '📋 The Kythia Team is currently empty.',
					color: 'Blurple',
				});
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}

			const memberList = [];
			for (const member of teamMembers) {
				try {
					const user = await interaction.client.users
						.fetch(member.userId)
						.catch(() => null);
					const userName = user ? user.tag : `Unknown User (${member.userId})`;
					const nameRole = member.name || 'No role specified';
					memberList.push(
						`**${userName}**\n**ID:** ${member.userId}\n**Role:** ${nameRole}`,
					);
				} catch (err) {
					logger.warn(`Failed to fetch user ${member.userId}:`, err);
					memberList.push(
						`**Unknown User**\n**ID:** ${member.userId}\n**Role:** ${member.name || 'No role specified'}`,
					);
				}
			}

			const description =
				`Total members: **${teamMembers.length}**\n\n` +
				memberList.join('\n\n');

			const components = await createContainer(interaction, {
				title: '👥 Kythia Team Members',
				description,
				color: 'Blurple',
			});

			await interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});

			logger.info(`Kythia Team list viewed by ${interaction.user.tag}`);
		} catch (error) {
			logger.error('Failed to list team members:', error);
			const components = await createContainer(interaction, {
				description: `❌ Failed to list team members: ${error.message}`,
				color: 'Red',
			});
			await interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};
