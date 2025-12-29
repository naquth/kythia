# Image Addon - Configuration Guide

## Overview

The **Image Addon** allows users to upload, store, and manage images using the **Kythia Storage Server**. This addon integrates with an external storage service for scalable, cloud-ready image management.

## Requirements

- **Kythia Storage Server** - A running instance of the Kythia Storage Server (Rust-based)
- **API Key** - Valid API key for authentication with the storage server

## Configuration

### Environment Variables (Recommended)

Add these variables to your `.env` file or environment:

```bash
# Kythia Storage Server Base URL
KYTHIA_IMAGE_STORAGE_URL=http://localhost:3000

# API Key for authentication
KYTHIA_IMAGE_STORAGE_API_KEY=your-super-secret-key-here
```

### Programmatic Configuration

Alternatively, configure via `kythia.config.js`:

```javascript
module.exports = {
  // ... other config
  addons: {
    image: {
      storageUrl: 'http://localhost:3000',
      apiKey: 'your-super-secret-key-here'
    }
  }
}
```

## Setting up Kythia Storage Server

1. **Clone and setup the storage server:**
   ```bash
   git clone https://github.com/kenndeclouv/kythia-storage.git
   cd kythia-storage
   cp .env.example .env
   ```

2. **Configure the storage server `.env`:**
   ```bash
   HOST=0.0.0.0
   PORT=3000
   BASE_URL=http://localhost:3000
   
   # Generate a secure API key
   API_KEYS=your-super-secret-key-here
   
   UPLOAD_DIR=./files
   MAX_FILE_SIZE_MB=10
   
   # For development
   DATABASE_TYPE=sqlite
   DATABASE_URL=sqlite:./storage.db
   
   # File types
   ALLOWED_EXTENSIONS=jpg,jpeg,png,gif,webp,svg
   ```

3. **Run the storage server:**
   ```bash
   cargo run --release
   ```

The storage server will be available at `http://localhost:3000`.

## Commands

### `/image add`
Upload a new image to the storage server.

**Usage:**
```
/image add image:[attach file]
```

**What it does:**
- Validates the file is an image
- Uploads to Kythia Storage Server via API
- Stores metadata in database
- Returns a public URL

### `/image list`
List all your uploaded images.

**Usage:**
```
/image list
```

**What it shows:**
- Image code (filename)
- Public URL to access the image

### `/image delete`
Delete an image by its code.

**Usage:**
```
/image delete code:[filename]
```

**What it does:**
- Deletes the image from the storage server
- Removes the database record

## Database Schema

The addon stores the following metadata:

| Field | Type | Description |
|-------|------|-------------|
| `userId` | STRING | Discord user ID who uploaded |
| `filename` | STRING | Stored filename |
| `originalName` | STRING | Original Discord filename |
| `fileId` | STRING | Storage server's file ID (UUID) |
| `storageUrl` | TEXT | Public URL to access the file |
| `mimetype` | STRING | MIME type (e.g., `image/jpeg`) |
| `fileSize` | INTEGER | File size in bytes |

## Troubleshooting

### ❌ "Storage API key not configured"
**Solution:** Set `KYTHIA_IMAGE_STORAGE_API_KEY` in your environment or configure `kythiaConfig.addons.image.apiKey`.

### ❌ "Storage server error (401)"
**Solution:** Your API key is invalid. Check that the key matches the one configured in the storage server's `API_KEYS`.

### ❌ "Storage server error (403)"
**Solution:** The file type may not be allowed. Check `ALLOWED_EXTENSIONS` in the storage server configuration.

### ❌ "Failed to upload image: fetch failed"
**Solution:** The storage server is not reachable. Verify:
- Storage server is running
- `KYTHIA_IMAGE_STORAGE_URL` is correct
- Network connectivity

## Migration from Local Storage

If you previously used local file storage:

1. **Option A: Re-upload images**
   - Users must re-upload their images using `/image add`
   - Old local files in `storage/images/` will not be accessible

2. **Option B: Manual migration**
   - Upload existing files to the storage server using the API
   - Update database records with new `fileId` and `storageUrl`

## Security Best Practices

- ✅ Use strong, unique API keys
- ✅ Enable HTTPS in production (use a reverse proxy like Nginx)
- ✅ Restrict allowed file types in storage server config
- ✅ Set appropriate `MAX_FILE_SIZE_MB` limits
- ✅ Regularly backup the storage server's database and files

## Support

For issues with:
- **Image Addon**: Check Kythia Discord server
- **Storage Server**: See [Kythia Storage Documentation](https://github.com/kenndeclouv/kythia-storage)

---

**Built with ❤️ by Kythia Labs**
