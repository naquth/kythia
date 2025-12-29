/**
 * @namespace: addons/globalvoice/utils/VoiceClient.js
 * @type: Module
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const WebSocket = require('ws');
const { EventEmitter } = require('node:events');

class NexusClient extends EventEmitter {
	constructor(url, botName, apiKey) {
		super();
		this.url = url;
		this.botName = botName;
		this.apiKey = apiKey;
		this.ws = null;
		this.roomId = null;
	}

	connect() {
		const headers = {};
		if (this.apiKey) {
			headers.Authorization = `Bearer ${this.apiKey}`;
		}

		this.ws = new WebSocket(this.url, { headers });

		this.ws.on('open', () => {
			console.log(`[Nexus] Connected to Core at ${this.url}`);
			this.emit('ready');
		});

		this.ws.on('message', (data, isBinary) => {
			if (isBinary) {
				this.emit('audio', data);
			} else {
				console.log(`[Nexus] Msg: ${data.toString()}`);
			}
		});

		this.ws.on('error', (err) => console.error('[Nexus] Error:', err));
		this.ws.on('close', () => {
			console.log('[Nexus] Disconnected. Reconnecting...');

			setTimeout(() => {
				this.connect();

				this.retryDelay = Math.min((this.retryDelay || 1000) * 2, 30000);
			}, this.retryDelay || 1000);
		});
	}

	join(roomId) {
		this.roomId = roomId;
		const payload = {
			op: 'join',
			d: { room_id: roomId },
		};
		this.sendJson(payload);
	}

	sendJson(data) {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(data));
		}
	}

	broadcastAudio(buffer) {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(buffer);
		}
	}
}

module.exports = NexusClient;
