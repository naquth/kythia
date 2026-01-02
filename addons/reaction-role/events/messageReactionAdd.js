/**
 * @namespace: addons/reaction-role/events/messageReactionAdd.js
 * @type: Event Handler
 * @copyright © 2026 kenndeclouv
 * @assistant chaa & graa
 * @version 1.0.0
 */

module.exports = async (bot, reaction, user) => {
	const container = bot.client.container;
	const { models, logger } = container;
	const { ReactionRole } = models;

	try {
		// Ignore bots
		if (user.bot) return;

		// Handle partials
		if (reaction.partial) {
			try {
				await reaction.fetch();
			} catch (error) {
				logger.error(error, { label: 'reactionRole:fetchMessage' });
				return;
			}
		}

		if (reaction.message.partial) {
			try {
				await reaction.message.fetch();
			} catch (error) {
				logger.error(error, { label: 'reactionRole:fetchMessagePartial' });
				return;
			}
		}

		const { guildId, id: messageId } = reaction.message;
		if (!guildId) return;

		// Determine the emoji string used in DB
		// If it's a custom emoji, we might have stored it as <a:name:id> or <:name:id> or just id?
		// In the add command, we used `emojiInput` directly.
		// If the user input was an emoji char, it's that char.
		// If it was a custom emoji string, it's that string.
		// The reaction.emoji.toString() usually gives the formatted string for custom emojis, or the char for unicode.
		const emojiIdentifier = reaction.emoji.toString();

		const rr = await ReactionRole.findOne({
			where: {
				guildId,
				messageId,
				// We try to match leniently? Or strictly?
				// Let's assume strict match on what was stored.
				// But we need to handle the potential formats.
				emoji: emojiIdentifier, // Try exact match first
			},
		});

		if (rr) {
			const member = await reaction.message.guild.members.fetch(user.id);
			if (member) {
				await member.roles.add(rr.roleId).catch((err) => {
					logger.warn(
						`Failed to add role ${rr.roleId} to user ${user.id}: ${err.message}`,
						{ label: 'reactionRole:addRole' },
					);
				});
			}
		}
	} catch (err) {
		logger.error(err, { label: 'reactionRole:messageReactionAdd' });
	}
};
