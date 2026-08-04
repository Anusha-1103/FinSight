import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { logger } from '../utils/logger.utils';

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export class CloudinaryService {
  static async uploadImageBuffer(buffer: Buffer, folder: string = 'receipts'): Promise<{ url: string; publicId: string }> {
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      try {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (error, result) => {
              if (error || !result) {
                return reject(error || new Error('Cloudinary upload failed'));
              }
              resolve({ url: result.secure_url, publicId: result.public_id });
            }
          );
          uploadStream.end(buffer);
        });
      } catch (err) {
        logger.warn('Cloudinary live upload failed, using secure data URI fallback:', err);
      }
    }
    
    // Data URI fallback for development/testing without live credentials
    const base64 = buffer.toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64}`;
    return {
      url: dataUri,
      publicId: `mock_${Date.now()}`,
    };
  }
}
