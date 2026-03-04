/**
 * @namespace: addons/api/routes/_addonGuard.js
 * @type: Helper / Middleware Factory
 * @copyright © 2026 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 *
 * Factory that returns a Hono middleware which checks whether a given addon
 * is active in kythiaConfig before forwarding the request. If the addon is
 * inactive, it immediately responds with 503 instead of executing the route.
 *
 * Usage in a route file:
 *   const addonGuard = require('./_addonGuard');
 *   app.use('*', addonGuard('quest'));
 */

/**
 * @param {string} addonKey - The addon key as it appears in kythiaConfig.addons (e.g. 'quest', 'giveaway')
 * @returns {import('hono').MiddlewareHandler}
 */
function addonGuard(addonKey) {
	return async (c, next) => {
		const config = c.get('config') ?? c.get('client')?.container?.kythiaConfig;
		const addonConfig = config?.addons?.[addonKey];

		// Treat missing config key as inactive, unless addons.all.active is explicitly true
		const allActive = config?.addons?.all?.active === true;
		const isActive =
			addonConfig?.active === true || (addonConfig === undefined && allActive);

		if (!isActive) {
			return c.json(
				{
					success: false,
					addon: addonKey,
					active: false,
					error: `The '${addonKey}' addon is currently disabled. Enable it in kythia.config.js to use this API.`,
				},
				503,
			);
		}

		await next();
	};
}

module.exports = addonGuard;
