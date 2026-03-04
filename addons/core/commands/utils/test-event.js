/**
 * @namespace: addons/core/commands/utils/test-event.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const {
	Events,
	SlashCommandBuilder,
	PermissionFlagsBits,
	InteractionContextType,
} = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('testevent')
		.setDescription('🧪 Trigger a Discord event for testing purposes')
		.addStringOption((option) =>
			option
				.setName('event')
				.setDescription('The event to trigger')
				.setRequired(true)
				.addChoices(
					{ name: 'GuildMemberAdd', value: Events.GuildMemberAdd },
					{ name: 'GuildMemberRemove', value: Events.GuildMemberRemove },
					{ name: 'GuildMemberUpdate', value: Events.GuildMemberUpdate },
					{ name: 'MessageCreate', value: Events.MessageCreate },
					{ name: 'MessageDelete', value: Events.MessageDelete },
					{ name: 'MessageUpdate', value: Events.MessageUpdate },
					{ name: 'ChannelCreate', value: Events.ChannelCreate },
					{ name: 'ChannelDelete', value: Events.ChannelDelete },
					{ name: 'ChannelUpdate', value: Events.ChannelUpdate },
					{ name: 'GuildBanAdd', value: Events.GuildBanAdd },
					{ name: 'GuildBanRemove', value: Events.GuildBanRemove },
					{ name: 'GuildUpdate', value: Events.GuildUpdate },
					{ name: 'RoleCreate', value: Events.GuildRoleCreate },
					{ name: 'RoleDelete', value: Events.GuildRoleDelete },
					{ name: 'RoleUpdate', value: Events.GuildRoleUpdate },
					{ name: 'VoiceStateUpdate', value: Events.VoiceStateUpdate },
					{ name: 'PresenceUpdate', value: Events.PresenceUpdate },
					{ name: 'InviteCreate', value: Events.InviteCreate },
					{ name: 'InviteDelete', value: Events.InviteDelete },
					{ name: 'EmojiCreate', value: Events.GuildEmojiCreate },
					{ name: 'EmojiUpdate', value: Events.GuildEmojiUpdate },
					{ name: 'StickerCreate', value: Events.GuildStickerCreate },
					{ name: 'WebhooksUpdate', value: Events.WebhooksUpdate },
				),
		)
		.addStringOption((option) =>
			option
				.setName('type')
				.setDescription('The specific scenario to test')
				.setRequired(false)
				.addChoices(
					{ name: 'Default', value: 'default' },
					{ name: 'Boost', value: 'boost' },
					{ name: 'Unboost', value: 'unboost' },
					{ name: 'Nickname Change', value: 'nickname' },
					{ name: 'Role Change', value: 'role-change' },
					{ name: 'Name Change', value: 'name-change' },
					{ name: 'Topic Change', value: 'topic-change' },
					{ name: 'NSFW Toggle', value: 'nsfw-toggle' },
					{ name: 'Voice Join', value: 'join' },
					{ name: 'Voice Leave', value: 'leave' },
					{ name: 'Voice Mute', value: 'mute' },
					{ name: 'Voice Unmute', value: 'unmute' },
					{ name: 'Status: Online', value: 'online' },
					{ name: 'Status: Idle', value: 'idle' },
					{ name: 'Status: DND', value: 'dnd' },
					{ name: 'Status: Offline', value: 'offline' },
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setContexts(InteractionContextType.Guild),
	ownerOnly: true,
	mainGuildOnly: true,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { logger } = container;
		// 👇 Import langsung dari events helper
		const { createMockEventArgs } = require('../../helpers/events');

		await interaction.deferReply({ ephemeral: true });

		const eventName = interaction.options.getString('event');
		const type = interaction.options.getString('type') || 'default';
		const { client, user } = interaction;

		logger.info(
			`[TEST COMMAND] Attempting to trigger '${eventName}' (type: ${type}) for ${user.tag}`,
		);

		try {
			const args = await createMockEventArgs(eventName, interaction, type);
			client.emit(eventName, ...args);

			await interaction.editReply({
				content: `✅ Event \`${eventName}\` (type: \`${type}\`) emitted successfully!`,
			});
		} catch (err) {
			logger.error(
				`[TEST COMMAND] Error during event simulation '${eventName}':`,
				err,
			);
			await interaction.editReply({
				content: `❌ Failed to emit event \`${eventName}\`: ${err.message}`,
			});
		}
	},
};
