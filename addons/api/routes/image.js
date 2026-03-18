/**
 * @namespace: addons/api/routes/image.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { Hono } = require('hono');
const app = new Hono();

// Helper to get models and container
const getContainer = (c) => c.get('client').container;
const getModels = (c) => getContainer(c).models;

// POST /api/image/upload - Upload an image to Kythia Storage and save metadata
// Accepts multipart/form-data: { file: File, userId: string, ?fileName: string }
// Mirrors /image add command behaviour.
app.post('/upload', async (c) => {
	const container = getContainer(c);
	const { Image } = getModels(c);
	const { kythiaConfig, logger } = container;

	const storageUrl =
		kythiaConfig.addons.image?.storageUrl ||
		process.env.KYTHIA_IMAGE_STORAGE_URL ||
		'http://localhost:3000';
	const apiKey =
		kythiaConfig.addons.image?.apiKey ||
		process.env.KYTHIA_IMAGE_STORAGE_API_KEY ||
		'';

	if (!apiKey) {
		return c.json(
			{
				success: false,
				error:
					'Storage API key not configured. Set KYTHIA_IMAGE_STORAGE_API_KEY.',
			},
			500,
		);
	}

	let formData;
	try {
		formData = await c.req.parseBody();
	} catch (_e) {
		return c.json(
			{ success: false, error: 'Invalid multipart/form-data body' },
			400,
		);
	}

	const file = formData.file;
	const userId = formData.userId;

	if (!file || !userId) {
		return c.json(
			{ success: false, error: 'Missing required fields: file, userId' },
			400,
		);
	}

	// Hono parseBody() returns a File-like object when the field is a file
	if (typeof file === 'string') {
		return c.json(
			{
				success: false,
				error: 'Field "file" must be a file upload, not a string',
			},
			400,
		);
	}

	if (!file.type?.startsWith('image/')) {
		return c.json(
			{ success: false, error: 'Only image files are allowed' },
			415,
		);
	}

	try {
		// Build FormData to forward the file to Kythia Storage
		const uploadForm = new FormData();
		const buffer = await file.arrayBuffer();
		const blob = new Blob([buffer], { type: file.type });
		uploadForm.append('file', blob, formData.fileName || file.name);

		const uploadResponse = await fetch(`${storageUrl}/api/upload`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
			body: uploadForm,
		});

		if (!uploadResponse.ok) {
			const errorText = await uploadResponse.text();
			throw new Error(
				`Storage server error (${uploadResponse.status}): ${errorText}`,
			);
		}

		const uploadData = await uploadResponse.json();

		// Save metadata to database
		const savedImage = await Image.create({
			userId,
			filename: uploadData.metadata.stored_name,
			originalName: uploadData.metadata.original_name,
			fileId: uploadData.file_id,
			storageUrl: uploadData.url,
			mimetype: uploadData.metadata.mime_type,
			fileSize: uploadData.metadata.file_size,
		});

		return c.json({ success: true, data: savedImage }, 201);
	} catch (error) {
		logger.error(`Upload failed: ${error.message}`, { label: 'image api' });
		return c.json({ success: false, error: error.message }, 500);
	}
});

// GET /api/image - List images (with optional filters)
app.get('/', async (c) => {
	const { Image } = getModels(c);
	const userId = c.req.query('userId');
	const mimetype = c.req.query('mimetype');

	const where = {};
	if (userId) where.userId = userId;
	if (mimetype) where.mimetype = mimetype;

	try {
		const data = await Image.findAll({ where });
		return c.json({ success: true, count: data.length, data });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// GET /api/image/:id - Get a single image by database ID
app.get('/:id', async (c) => {
	const { Image } = getModels(c);
	const id = c.req.param('id');

	try {
		const result = await Image.findByPk(id);
		if (!result)
			return c.json({ success: false, error: 'Image not found' }, 404);
		return c.json({ success: true, data: result });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// POST /api/image - Create a new image record
app.post('/', async (c) => {
	const { Image } = getModels(c);
	const body = await c.req.json();
	const {
		userId,
		filename,
		originalName,
		fileId,
		storageUrl,
		mimetype,
		fileSize,
	} = body;

	if (
		!userId ||
		!filename ||
		!originalName ||
		!fileId ||
		!storageUrl ||
		!mimetype ||
		!fileSize
	) {
		return c.json(
			{
				success: false,
				error:
					'Missing required fields: userId, filename, originalName, fileId, storageUrl, mimetype, fileSize',
			},
			400,
		);
	}

	try {
		const result = await Image.create({
			userId,
			filename,
			originalName,
			fileId,
			storageUrl,
			mimetype,
			fileSize,
		});
		return c.json({ success: true, data: result }, 201);
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// PATCH /api/image/:id - Update an image record
app.patch('/:id', async (c) => {
	const { Image } = getModels(c);
	const id = c.req.param('id');
	const body = await c.req.json();

	try {
		const result = await Image.findByPk(id);
		if (!result)
			return c.json({ success: false, error: 'Image not found' }, 404);

		const allowedFields = [
			'storageUrl',
			'originalName',
			'mimetype',
			'fileSize',
		];
		const updates = {};
		for (const field of allowedFields) {
			if (Object.hasOwn(body, field)) {
				updates[field] = body[field];
			}
		}

		await result.update(updates);
		return c.json({ success: true, data: result });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// DELETE /api/image/:id - Delete an image record
app.delete('/:id', async (c) => {
	const { Image } = getModels(c);
	const id = c.req.param('id');

	try {
		const result = await Image.findByPk(id);
		if (!result)
			return c.json({ success: false, error: 'Image not found' }, 404);

		await result.destroy();
		return c.json({ success: true, message: 'Image deleted successfully' });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

module.exports = app;
