require('@dotenvx/dotenvx').config({ quiet: true });

const { ShardingManager } = require('kythia-core');
const path = require('node:path');

const manager = new ShardingManager({
	scriptPath: path.join(__dirname, 'index.js'),
	token: process.env.DISCORD_BOT_TOKEN,
	totalShards: 'auto',
});

manager.spawn().catch((err) => {
	// biome-ignore lint/suspicious/noConsole: logger not initialized yet
	console.error('❌ Failed to spawn shards:', err);
});
