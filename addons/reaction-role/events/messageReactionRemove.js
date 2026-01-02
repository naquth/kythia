/**
 * @namespace: addons/reaction-role/events/messageReactionRemove.js
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

		const emojiIdentifier = reaction.emoji.toString();

		const rr = await ReactionRole.findOne({
			where: {
				guildId,
				messageId,
				emoji: emojiIdentifier,
			},
		});

		if (rr) {
			const member = await reaction.message.guild.members.fetch(user.id);
			if (member) {
				await member.roles.remove(rr.roleId).catch((err) => {
					logger.warn(
						`Failed to remove role ${rr.roleId} from user ${user.id}: ${err.message}`,
						{ label: 'reactionRole:removeRole' },
					);
				});
			}
		}
	} catch (err) {
		logger.error(err, { label: 'reactionRole:messageReactionRemove' });
	}
};
