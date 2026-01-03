/**
 * @namespace: addons/autoreply/database/models/AutoReply.js
 * @type: Database Model
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { KythiaModel } = require('kythia-core');

class AutoReply extends KythiaModel {
	static guarded = [];

	// Define cache keys for efficient lookups
	static cacheKeys = [['guildId'], ['guildId', 'trigger']];
	static customInvalidationTags = ['AutoReply:list'];
}

module.exports = AutoReply;
