/**
 * @namespace: addons/giveaway/register.js
 * @type: Module
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const GiveawayManager = require('./helpers/GiveawayManager');
const giveawayJoinButton = require('./buttons/giveaway-join');

module.exports = {
	initialize(bot) {
		const container = bot.client.container;
		const client = bot.client;
		const summary = [];

		container.giveawayManager = new GiveawayManager(container);

		// Button handler must run on all shards (users can click on any shard)
		bot.registerButtonHandler('giveaway-join', (interaction) => {
			return giveawayJoinButton.execute(interaction, container);
		});

		// Scheduler only on Shard 0 — prevents multiple shards ending the same giveaway
		const isShardZeroOrNoShard = !client.shard || client.shard.ids.includes(0);
		if (isShardZeroOrNoShard) {
			bot.addClientReadyHook(async () => {
				await container.giveawayManager.init();
			});
			summary.push(
				'   └─ 🎁 Giveaway Manager (Scheduler Queued, Shard 0 only)',
			);
		} else {
			summary.push(
				'   └─ 🎁 Giveaway Manager (Scheduler skipped on this shard)',
			);
		}

		return summary;
	},
};
