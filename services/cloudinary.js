const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} folder - The folder to upload to (default: 'bup-issues')
 * @returns {Promise<object>} - Cloudinary upload result with secure_url
 */
const uploadToCloudinary = (fileBuffer, folder = 'bup-issues') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'image',
                transformation: [
                    { width: 1200, crop: 'limit' }, // Limit max width
                    { quality: 'auto:good' }        // Auto optimize quality
                ]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        uploadStream.end(fileBuffer);
    });
};

/**
 * Delete an image from Cloudinary by public_id
 * @param {string} publicId - The public_id of the image to delete
 * @returns {Promise<object>} - Cloudinary deletion result
 */
const deleteFromCloudinary = (publicId) => {
    return cloudinary.uploader.destroy(publicId);
};

module.exports = {
    cloudinary,
    uploadToCloudinary,
    deleteFromCloudinary
};
