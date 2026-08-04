"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const cloudinary_1 = require("cloudinary");
const env_1 = require("../config/env");
const logger_utils_1 = require("../utils/logger.utils");
if (env_1.env.CLOUDINARY_CLOUD_NAME && env_1.env.CLOUDINARY_API_KEY && env_1.env.CLOUDINARY_API_SECRET) {
    cloudinary_1.v2.config({
        cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
        api_key: env_1.env.CLOUDINARY_API_KEY,
        api_secret: env_1.env.CLOUDINARY_API_SECRET,
    });
}
class CloudinaryService {
    static async uploadImageBuffer(buffer, folder = 'receipts') {
        if (env_1.env.CLOUDINARY_CLOUD_NAME && env_1.env.CLOUDINARY_API_KEY && env_1.env.CLOUDINARY_API_SECRET) {
            try {
                return new Promise((resolve, reject) => {
                    const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
                        if (error || !result) {
                            return reject(error || new Error('Cloudinary upload failed'));
                        }
                        resolve({ url: result.secure_url, publicId: result.public_id });
                    });
                    uploadStream.end(buffer);
                });
            }
            catch (err) {
                logger_utils_1.logger.warn('Cloudinary live upload failed, using secure data URI fallback:', err);
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
exports.CloudinaryService = CloudinaryService;
