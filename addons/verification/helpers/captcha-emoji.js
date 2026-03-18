/**
 * @namespace: addons/verification/helpers/captcha-emoji.js
 * @type: Helper Script
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const EMOJI_POOL = [
	'🐶',
	'🐱',
	'🐭',
	'🐹',
	'🐰',
	'🦊',
	'🐻',
	'🐼',
	'🐨',
	'🐯',
	'🦁',
	'🐸',
	'🐵',
	'🐔',
	'🐧',
	'🐦',
	'🦅',
	'🦆',
	'🦉',
	'🦇',
	'🐝',
	'🐛',
	'🦋',
	'🐌',
	'🐞',
	'🐜',
	'🦟',
	'🐢',
	'🐍',
	'🦎',
	'🦖',
	'🐙',
	'🦑',
	'🦐',
	'🦞',
	'🦀',
	'🐡',
	'🐠',
	'🐟',
	'🐬',
	'🐳',
	'🦈',
	'🐊',
	'🐅',
	'🐆',
	'🦓',
	'🦍',
	'🐘',
	'🦛',
	'🦏',
	'🐪',
	'🦒',
	'🦘',
	'🐃',
	'🐄',
	'🐎',
	'🐖',
	'🐏',
	'🐑',
	'🦙',
	'🌵',
	'🌴',
	'🌿',
	'🍀',
	'🍁',
	'🍂',
	'🌸',
	'🌺',
	'🌻',
	'🌹',
	'⭐',
	'🌟',
	'💫',
	'✨',
	'🎃',
	'🎄',
	'🎋',
	'🎍',
	'🎎',
	'🎏',
];

function shuffle(arr) {
	return arr.sort(() => Math.random() - 0.5);
}

/**
 * Generate an emoji captcha.
 * @param {string} userId
 * @returns {{ target: string, prompt: string, rows: ActionRowBuilder[] }}
 */
function generateEmojiCaptcha(userId) {
	const pool = shuffle([...EMOJI_POOL]);
	const target = pool[0];
	const decoys = pool.slice(1, 6);

	const all = shuffle([target, ...decoys]);

	const buttons = all.map((emoji) =>
		new ButtonBuilder()
			.setCustomId(
				`verify-emoji:${userId}:${emoji === target ? 'correct' : 'wrong'}`,
			)
			.setEmoji(emoji)
			.setLabel('\u200b') // zero-width space for label (emoji-only button)
			.setStyle(ButtonStyle.Secondary),
	);

	// Discord max 5 buttons per row
	const rows = [
		new ActionRowBuilder().addComponents(buttons.slice(0, 3)),
		new ActionRowBuilder().addComponents(buttons.slice(3, 6)),
	];

	return {
		target,
		prompt: `Click the **${target}** emoji below:`,
		rows,
	};
}

module.exports = { generateEmojiCaptcha };
