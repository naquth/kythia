const { ShardingManager } = require('kythia-core');
const kythiaConfig = require('./kythia.config');
const path = require('node:path');

const manager = new ShardingManager({
	scriptPath: path.join(__dirname, 'index.js'),
	token: kythiaConfig.bot.token,
	totalShards: kythiaConfig.bot.totalShards,
});

manager.spawn().catch((err) => {
	// biome-ignore lint/suspicious/noConsole: logger not initialized yet
	console.error('❌ Failed to spawn shards:', err);
});
