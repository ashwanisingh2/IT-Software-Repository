import { Request, Response, NextFunction } from 'express';

const ALLOWED_EXTENSIONS = ['.exe', '.msi', '.zip', '.bat', '.ps1'];
const ALLOWED_MIME_TYPES = [
  'application/x-msdownload',
  'application/x-msi',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream', // Fallback for some windows clients
  'application/x-bat',
  'text/plain',
];

export const validateUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: 'No file uploaded' } });
  }

  const file = req.file;
  
  if (file.size > 2 * 1024 * 1024 * 1024) { // 2GB
    return res.status(400).json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'File exceeds 2GB limit' } });
  }

  const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: 'Extension not allowed' } });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype) && !req.file.mimetype.startsWith('text/')) {
     return res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: 'MIME type not allowed' } });
  }

  // Magic byte checks
  const header = file.buffer.toString('hex', 0, 4).toUpperCase();
  if (ext === '.exe' || ext === '.msi') {
    if (!header.startsWith('4D5A')) { // MZ
      return res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: 'Invalid executable format' } });
    }
  } else if (ext === '.zip') {
    if (!header.startsWith('504B0304')) { // PK..
      return res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: 'Invalid ZIP format' } });
    }
  }

  next();
};
