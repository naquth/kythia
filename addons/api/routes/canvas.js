/**
 * @namespace: addons/api/routes/canvas.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { welcomeBanner } = require('kythia-arts');
const { Hono } = require('hono');
const app = new Hono();

const intOrUndefined = (val) => {
	if (val === null || val === undefined || val === '') return undefined;
	const parsed = parseInt(val, 10);
	return Number.isNaN(parsed) ? undefined : parsed;
};

const strOrUndefined = (val) => (!val ? undefined : val);

const resolvePreviewText = (text, _type) => {
	if (!text) return undefined;

	const replacements = {
		'{username}': 'Kythia User',
		'{tag}': 'Kythia#0000',
		'{userId}': '123456789012345678',
		'{guildName}': 'Kythia Universe',
		'{members}': '1,337',
		'{mention}': '@Kythia User',
	};

	let result = text;
	for (const [key, value] of Object.entries(replacements)) {
		result = result.replace(new RegExp(key, 'gi'), value);
	}
	return result;
};

app.post('/preview', async (c) => {
	const client = c.get('client');
	const { logger } = c.get('container');

	try {
		const body = await c.req.json();
		const type = body.type || 'In';
		const prefix = `welcome${type}`;

		const mockUserId = '000000000000000000';
		const mockUsername = 'Kythia Preview';

		const options = {
			customUsername: mockUsername,
			botToken: process.env.DISCORD_BOT_TOKEN,

			customWidth: intOrUndefined(body[`${prefix}BannerWidth`]),
			customHeight: intOrUndefined(body[`${prefix}BannerHeight`]),

			customBackground: strOrUndefined(body[`${prefix}BackgroundUrl`]),
			overlayColor: strOrUndefined(body[`${prefix}OverlayColor`]),

			avatarSize:
				body[`${prefix}AvatarEnabled`] === false
					? 0
					: intOrUndefined(body[`${prefix}AvatarSize`]),
			avatarY: intOrUndefined(body[`${prefix}AvatarYOffset`]),

			avatarBorder: {
				width: intOrUndefined(body[`${prefix}AvatarBorderWidth`]),
				color: strOrUndefined(body[`${prefix}AvatarBorderColor`]),
			},

			welcomeText: resolvePreviewText(body[`${prefix}MainTextContent`], type),
			welcomeColor: strOrUndefined(body[`${prefix}MainTextColor`]),
			customFont: strOrUndefined(body[`${prefix}MainTextFontFamily`]),
			fontWeight: strOrUndefined(body[`${prefix}MainTextFontWeight`]),
			textOffsetY: intOrUndefined(body[`${prefix}MainTextYOffset`]),

			usernameColor: strOrUndefined(body[`${prefix}SubTextColor`]),

			textShadow: !!body[`${prefix}ShadowColor`],

			type: 'welcome',
		};

		const buffer = await welcomeBanner(client.user?.id || mockUserId, options);

		const base64Image = Buffer.from(buffer).toString('base64');
		const dataUri = `data:image/png;base64,${base64Image}`;

		return c.json({
			success: true,
			image: dataUri,
		});
	} catch (e) {
		logger.error('Error generating canvas preview:', e, { label: 'api' });
		return c.json(
			{
				success: false,
				message: 'Failed to generate preview',
				error: e.message,
			},
			500,
		);
	}
});

module.exports = app;
