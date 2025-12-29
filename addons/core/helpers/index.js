/**
 * @namespace: addons/core/helpers/index.js
 * @type: Helper Script
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const rolePrefix = require('./role-prefix');
const roleUnprefix = require('./role-unprefix');
const figletFonts = require('./figlet-fonts');
const {
	EVENT_SCENARIOS,
	createMockEventArgs,
	getEventScenarios,
} = require('./events');

const { checkCooldown, formatDuration, parseDuration } = require('./time');

const sendLogsWarning = require('./send-logs');

module.exports = {
	rolePrefix,
	roleUnprefix,
	EVENT_SCENARIOS,
	createMockEventArgs,
	getEventScenarios,
	checkCooldown,
	formatDuration,
	parseDuration,
	figletFonts,
	sendLogsWarning,
};
