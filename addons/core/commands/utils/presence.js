/**
 * @namespace: addons/core/commands/utils/presence.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */
const {
	SlashCommandBuilder,
	ActivityType,
	InteractionContextType,
	MessageFlags,
} = require('discord.js');

const STATUS_OPTIONS = [
	{ name: 'Online', value: 'online' },
	{ name: 'Idle', value: 'idle' },
	{ name: 'Do Not Disturb', value: 'dnd' },
	{ name: 'Invisible', value: 'invisible' },
];

const ACTIVITY_TYPE_OPTIONS = Object.entries(ActivityType)
	.filter(([_k, v]) => typeof v === 'number')
	.map(([k, _v]) => ({ name: k, value: k }));

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('presence')
		.setDescription('🔄 Change bot presence')
		.addStringOption((opt) =>
			opt
				.setName('status')
				.setDescription('Bot status (online, idle, dnd, invisible)')
				.setRequired(true)
				.addChoices(...STATUS_OPTIONS),
		)
		.addStringOption((opt) =>
			opt
				.setName('type')
				.setDescription(
					'Activity type (Playing, Streaming, Listening, Watching, Competing)',
				)
				.setRequired(true)
				.addChoices(...ACTIVITY_TYPE_OPTIONS),
		)
		.addStringOption((opt) =>
			opt.setName('activity').setDescription('Activity name').setRequired(true),
		)
		.addStringOption((opt) =>
			opt
				.setName('url')
				.setDescription(
					'Streaming URL (Twitch/YouTube), required for streaming',
				)
				.setRequired(false),
		)
		.setContexts(InteractionContextType.BotDM),
	ownerOnly: true,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, helpers } = container;
		const { simpleContainer } = helpers.discord;

		await interaction.deferReply({ ephemeral: true });

		const status = interaction.options.getString('status');
		const type = interaction.options.getString('type');
		const activityName = interaction.options.getString('activity');
		const url = interaction.options.getString('url');

		const activityPayload = {
			name: activityName,
			type: ActivityType[type],
		};

		if (activityPayload.type === ActivityType.Streaming) {
			if (
				!url ||
				(!url.startsWith('https://www.twitch.tv/') &&
					!url.startsWith('https://www.youtube.com/'))
			) {
				return interaction.editReply({
					content: await t(interaction, 'core.utils.presence.invalid.url'),
					ephemeral: true,
				});
			}
			activityPayload.url = url;
		}

		await interaction.client.user.setPresence({
			activities: [activityPayload],
			status: status,
		});

		return interaction.editReply({
			components: simpleContainer(
				interaction,
				await t(interaction, 'core.utils.presence.success'),
			),
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
