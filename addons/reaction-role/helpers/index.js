/**
 * @namespace: addons/reaction-role/helpers/index.js
 * @type: Helper
 * @copyright © 2026 kenndeclouv
 * @assistant chaa & graa
 * @version 1.0.0
 */

const {
	ContainerBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	MessageFlags,
} = require('discord.js');

/**
 * Build a Components V2 ContainerBuilder representing all reaction roles for a
 * given message.  This is a **pure** function — it does not touch Discord or
 * the database.
 *
 * @param {object[]} reactionRoles   Array of ReactionRole DB instances/plain objects.
 * @param {object}   container       Kythia DI container (for kythiaConfig / helpers).
 * @returns {ContainerBuilder}
 */
function buildReactionRoleComponents(reactionRoles, container) {
	const { kythiaConfig, helpers } = container;
	const { convertColor } = helpers.color;

	const accentColor = convertColor(kythiaConfig.bot.color, {
		from: 'hex',
		to: 'decimal',
	});

	const builder = new ContainerBuilder().setAccentColor(accentColor);

	builder.addTextDisplayComponents(
		new TextDisplayBuilder().setContent('## 🎭 Reaction Roles'),
	);

	builder.addSeparatorComponents(
		new SeparatorBuilder()
			.setSpacing(SeparatorSpacingSize.Small)
			.setDivider(true),
	);

	if (!reactionRoles || reactionRoles.length === 0) {
		builder.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				'> No reaction roles configured for this message yet.',
			),
		);
	} else {
		let lines = '';
		for (const rr of reactionRoles) {
			lines += `${rr.emoji} ➡️ <@&${rr.roleId}>\n`;
		}

		builder.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(lines.trimEnd()),
		);
	}

	return builder;
}

/**
 * Fetch all ReactionRole records for a given messageId from the database, then
 * edit the actual Discord message to reflect the current state.
 *
 * The function is idempotent — calling it multiple times produces the same
 * result as calling it once.
 *
 * @param {string} messageId   Discord message ID.
 * @param {object} container   Kythia DI container.
 * @returns {Promise<void>}
 */
async function refreshReactionRoleMessage(messageId, container) {
	const { models, logger } = container;
	const client = container.client;
	const { ReactionRole } = models;

	// Load all reaction roles that belong to this message
	const reactionRoles = await ReactionRole.findAll({ where: { messageId } });

	if (reactionRoles.length === 0) {
		// Nothing to refresh; the message may have been stripped of all RRs.
		// Optionally still update the message if we can find it.
		return;
	}

	// All records share the same channelId for identical messageId
	const channelId = reactionRoles[0].channelId;

	const channel = await client.channels.fetch(channelId).catch(() => null);
	if (!channel) {
		logger.warn(
			`[reaction-role:refresh] Channel ${channelId} not found, skipping message refresh.`,
		);
		return;
	}

	const message = await channel.messages.fetch(messageId).catch(() => null);
	if (!message) {
		logger.warn(
			`[reaction-role:refresh] Message ${messageId} not found in channel ${channelId}.`,
		);
		return;
	}

	const updatedContainer = buildReactionRoleComponents(
		reactionRoles,
		container,
	);

	await message.edit({
		components: [updatedContainer],
		flags: MessageFlags.IsComponentsV2,
	});
}

module.exports = {
	buildReactionRoleComponents,
	refreshReactionRoleMessage,
};
