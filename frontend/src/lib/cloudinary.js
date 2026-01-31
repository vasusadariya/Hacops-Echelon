import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image buffer to Cloudinary
 */
export async function uploadToCloudinary(fileBuffer, options = {}) {
  const defaultOptions = {
    folder: 'verification',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  };

  const uploadOptions = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Upload selfie from base64 data URL
 */
export async function uploadSelfieBase64(base64Data, uniqueId) {
  if (!base64Data) {
    throw new Error('No base64 data provided for selfie');
  }

  const options = {
    folder: 'verification/selfies',
    public_id: `selfie_${uniqueId}_${Date.now()}`,
    resource_type: 'image',
    format: 'jpg',
    transformation: [
      { width: 640, height: 480, crop: 'limit' },
      { quality: 'auto:good' }
    ]
  };

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64Data,
      options,
      (error, result) => {
        if (error) {
          console.error('Cloudinary selfie upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
}

/**
 * Upload document image (Aadhaar/PAN)
 */
export async function uploadDocument(fileBuffer, documentType, uniqueId) {
  const options = {
    folder: `verification/${documentType}`,
    public_id: `${documentType}_${uniqueId}_${Date.now()}`,
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit' },
      { quality: 'auto:good' }
    ]
  };

  return uploadToCloudinary(fileBuffer, options);
}

/**
 * Delete image from Cloudinary
 */
export async function deleteFromCloudinary(publicId) {
  if (!publicId) {
    console.warn('No publicId provided for deletion');
    return null;
  }
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

/**
 * Get optimized URL for an image
 */
export function getOptimizedUrl(publicId, transformations = {}) {
  if (!publicId) return null;
  
  const defaultTransformations = {
    quality: 'auto',
    fetch_format: 'auto'
  };

  return cloudinary.url(publicId, {
    ...defaultTransformations,
    ...transformations,
    secure: true
  });
}

export default cloudinary;