import multer, { StorageEngine, FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

// Image upload types
export enum ImageType {
  PROFILE = 'profile',
  DOCUMENT = 'document',
  PAYMENT = 'payment'
}

// Interface for image upload result
export interface ImageUploadResult {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

// Base uploads directory
const UPLOADS_BASE_DIR = path.join(process.cwd(), 'uploads');

// Create folder structure
const createUploadFolders = async (): Promise<void> => {
  try {
    const folders = [
      path.join(UPLOADS_BASE_DIR, 'profile'),
      path.join(UPLOADS_BASE_DIR, 'document'),
      path.join(UPLOADS_BASE_DIR, 'payment')
    ];

    for (const folder of folders) {
      if (!fs.existsSync(folder)) {
        await mkdirAsync(folder, { recursive: true });
      }
    }
  } catch (error) {
    console.error('Error creating upload folders:', error);
    throw new Error('Failed to create upload directories');
  }
};

// Initialize folders on module load
createUploadFolders();

// File filter function to validate image types
export const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  // Check if file is an image
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }

  // Allowed image types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }

  cb(null, true);
};

// Generate unique filename
const generateFilename = (originalname: string): string => {
  const timestamp = Date.now();
  const randomNum = Math.round(Math.random() * 1E9);
  const extension = path.extname(originalname);
  return `${timestamp}-${randomNum}${extension}`;
};

// Storage configuration for different image types
const createStorage = (imageType: ImageType): StorageEngine => {
  return multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
      const uploadPath = path.join(UPLOADS_BASE_DIR, imageType);
      cb(null, uploadPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      const filename = generateFilename(file.originalname);
      cb(null, filename);
    }
  }); 
};

// Multer configurations for different image types
export const profileImageUpload = multer({
  storage: createStorage(ImageType.PROFILE),
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  }
});

export const documentImageUpload = multer({
  storage: createStorage(ImageType.DOCUMENT),
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for document images
    files: 1 // Single document image
  }
});

export const paymentImageUpload = multer({
  storage: createStorage(ImageType.PAYMENT),
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  }
});

// Utility functions for image management

// Get image URL from filename and type
export const getImageUrl = (filename: string, imageType: ImageType): string => {
  return `/uploads/${imageType}/${filename}`;
};

// Get full image path from filename and type
export const getImagePath = (filename: string, imageType: ImageType): string => {
  return path.join(UPLOADS_BASE_DIR, imageType, filename);
};

// Delete image file
export const deleteImage = async (filename: string, imageType: ImageType): Promise<boolean> => {
  try {
    if (!filename) {
      return false;
    }

    const filePath = getImagePath(filename, imageType);
    
    if (fs.existsSync(filePath)) {
      await unlinkAsync(filePath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// Delete multiple images
export const deleteImages = async (filenames: string[], imageType: ImageType): Promise<number> => {
  let deletedCount = 0;
  
  for (const filename of filenames) {
    const deleted = await deleteImage(filename, imageType);
    if (deleted) {
      deletedCount++;
    }
  }
  
  return deletedCount;
};

// Update image (delete old, return new path info)
export const updateImage = async (
  oldFilename: string | null,
  newFile: Express.Multer.File,
  imageType: ImageType
): Promise<ImageUploadResult> => {
  // Delete old image if exists
  if (oldFilename) {
    await deleteImage(oldFilename, imageType);
  }

  // Return new image info
  return {
    filename: newFile.filename,
    originalname: newFile.originalname,
    mimetype: newFile.mimetype,
    size: newFile.size,
    path: newFile.path,
    url: getImageUrl(newFile.filename, imageType)
  };
};

// Check if image exists
export const imageExists = (filename: string, imageType: ImageType): boolean => {
  if (!filename) {
    return false;
  }
  
  const filePath = getImagePath(filename, imageType);
  return fs.existsSync(filePath);
};

// Get image stats
export const getImageStats = (filename: string, imageType: ImageType): fs.Stats | null => {
  try {
    if (!imageExists(filename, imageType)) {
      return null;
    }
    
    const filePath = getImagePath(filename, imageType);
    return fs.statSync(filePath);
  } catch (error) {
    console.error('Error getting image stats:', error);
    return null;
  }
};

// Validate image file before upload
export const validateImageFile = (file: Express.Multer.File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!file.mimetype.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  return { valid: true };
};

// Create image upload result from multer file
export const createImageUploadResult = (file: Express.Multer.File, imageType: ImageType): ImageUploadResult => {
  return {
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    url: getImageUrl(file.filename, imageType)
  };
};
