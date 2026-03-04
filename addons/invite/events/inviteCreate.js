/**
 * @namespace: addons/invite/events/inviteCreate.js
 * @type: Event Handler
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { getGuildInviteCache } = require('../helpers');

module.exports = (_bot, invite) => {
	try {
		const cache = getGuildInviteCache(invite.guild.id);
		cache.set(invite.code, {
			uses: invite.uses || 0,
			inviterId: invite.inviter?.id || null,
		});
	} catch {}
};
