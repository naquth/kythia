/**
 * @namespace: addons/verification/events/guildMemberAdd.js
 * @type: Event Handler
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { sendCaptcha } = require('../helpers/verify');

module.exports = async (bot, member) => {
	if (!member.guild || member.user.bot) return;

	const container = bot.client.container;
	const { models, logger } = container;
	const { VerificationConfig, ServerSetting } = models;

	try {
		// Check verificationOn flag
		const settings = await ServerSetting.getCache({ guildId: member.guild.id });
		if (!settings?.verificationOn) return;

		// Load verification config
		const config = await VerificationConfig.findOne({
			where: { guildId: member.guild.id },
		});
		if (!config || !config.verifiedRoleId) return;

		await sendCaptcha(member, config);
	} catch (err) {
		logger.error('[Verification] guildMemberAdd error:', err);
	}
};
