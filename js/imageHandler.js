// Image handling functionality for issue submissions

// Keep track of uploaded image files
let uploadedImages = [];

function handleImageUpload(e) {
    e.preventDefault();
    const newFiles = e.target.files;

    if (newFiles && newFiles.length > 0) {
        // Create a map of existing files for quick lookup
        const filesMap = new Map();
        uploadedImages.forEach(file => {
            const fileId = `${file.name}-${file.size}`;
            filesMap.set(fileId, file);
        });

        // Add only new, unique files to the map
        Array.from(newFiles).forEach(file => {
            if (file.type.startsWith('image/')) {
                const fileId = `${file.name}-${file.size}`;
                if (!filesMap.has(fileId)) {
                    filesMap.set(fileId, file);
                }
            }
        });

        // Convert map values back to an array, and limit to 5
        uploadedImages = Array.from(filesMap.values()).slice(0, 5);
        console.log(`Updated uploadedImages array - ${uploadedImages.length} images`); // Debug log
    }

    // Update the preview with the master list of images
    updateImagePreview(uploadedImages);

    // Clear the file input value to allow re-selecting the same file
    e.target.value = '';
}

// Function to remove an image from the preview
function removeUploadedImage(index) {
    if (index > -1 && index < uploadedImages.length) {
        uploadedImages.splice(index, 1);
        console.log(`Removed image at index ${index}. ${uploadedImages.length} images remaining`); // Debug log
        // Re-render the preview with the modified array
        updateImagePreview(uploadedImages);
    }
}

// Function to update the image preview UI
function updateImagePreview(images) {
    const previewContainer = document.getElementById('imagePreview');
    if (!previewContainer) return;

    previewContainer.innerHTML = '';

    if (images && images.length > 0) {
        images.forEach((file, index) => {
            const reader = new FileReader();

            reader.onload = function (e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';

                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" class="preview-image">
                    <button type="button" class="remove-image" onclick="removeUploadedImage(${index})" aria-label="Remove image">
                        <i class="fas fa-times"></i>
                    </button>
                `;

                previewContainer.appendChild(previewItem);
            };

            reader.readAsDataURL(file);
        });

        // Add button to add more images if less than 5
        if (images.length < 5) {
            const addMoreButton = document.createElement('button');
            addMoreButton.type = 'button';
            addMoreButton.className = 'add-more-images';
            addMoreButton.innerHTML = '<i class="fas fa-plus"></i><span>Add More</span>';
            addMoreButton.onclick = addMoreImages;
            addMoreButton.setAttribute('aria-label', 'Add more images');
            previewContainer.appendChild(addMoreButton);
        }
    } else {
        previewContainer.innerHTML = '<p class="no-images">No images selected</p>';
    }
}

// Upload images to server and get their paths
async function uploadImages() {
    if (!uploadedImages || uploadedImages.length === 0) {
        console.log('No images to upload');
        return [];
    }

    console.log(`Uploading ${uploadedImages.length} images to server`);
    const formData = new FormData();
    uploadedImages.forEach(file => {
        formData.append('images', file);
    });

    try {
        const token = localStorage.getItem('bup-token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/upload', {
            method: 'POST',
            headers,
            body: formData
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error('Image upload failed:', errorData);
            throw new Error(errorData.message || 'Image upload failed');
        }

        const data = await res.json();
        console.log('Image upload successful:', data.filePaths);
        return data.filePaths || [];
    } catch (error) {
        console.error('Error uploading images:', error);
        showNotification('Failed to upload images: ' + error.message, 'error');
        return [];
    }
}

// Function to handle adding more images
function addMoreImages() {
    // Trigger the file input to open
    document.getElementById('imageUpload').click();
}

// Make functions available globally
window.handleImageUpload = handleImageUpload;
window.removeUploadedImage = removeUploadedImage;
window.updateImagePreview = updateImagePreview;
window.uploadImages = uploadImages;
window.addMoreImages = addMoreImages;
window.uploadedImages = uploadedImages; // Expose for debugging
