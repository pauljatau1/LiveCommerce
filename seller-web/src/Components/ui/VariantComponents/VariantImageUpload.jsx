import { memo, useCallback } from 'react';
import { Icon } from "@iconify/react";
import { useVariants } from '../../../Contexts/VariantContext';
import { toast } from "sonner";
import PropTypes from 'prop-types';

const VariantImageUpload = memo(({ variantPath }) => {
    const { tempInputs, updateVariantValue } = useVariants();
    const images = tempInputs[variantPath]?.images || [];

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        const currentImagesLength = Array.isArray(images) ? images.length : 0;
        const remainingSlots = 5 - currentImagesLength;

        if (remainingSlots <= 0) {
            toast.error('Maximum 5 images allowed');
            return;
        }

        const filesToProcess = files.slice(0, remainingSlots);

        // File size limit: 7MB
        const maxSize = 7 * 1024 * 1024; // 7MB in bytes
        const validFiles = [];
        const oversizedFiles = [];

        // Check file sizes
        filesToProcess.forEach(file => {
            if (file.size > maxSize) {
                oversizedFiles.push(file.name);
            } else {
                validFiles.push(file);
            }
        });

        // Show error for oversized files
        if (oversizedFiles.length > 0) {
            toast.error(`File${oversizedFiles.length > 1 ? 's' : ''} too large: ${oversizedFiles.join(', ')}`, {
                description: "Each image must be less than 7MB",
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
        }

        // Process valid files only
        if (validFiles.length === 0) {
            return;
        }

        const newImages = await Promise.all(validFiles.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve({
                    url: reader.result,
                    type: file.type,
                    isDefault: false
                });
                reader.readAsDataURL(file);
            });
        }));

        if (newImages.length > 0 && (!images || images.length === 0)) {
            newImages[0].isDefault = true;
        }

        updateVariantValue(variantPath, 'images', [
            ...images,
            ...newImages
        ]);
    };

    const handleRemoveImage = useCallback((index) => {
        const newImages = images.filter((_, i) => i !== index);
        if (newImages.length > 0 && index === 0) {
            newImages[0].isDefault = true;
        }
        updateVariantValue(variantPath, 'images', newImages);
    }, [variantPath, images, updateVariantValue]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
                {images?.map((image, index) => (
                    <div key={index} className="relative w-24 h-24">
                        <img
                            src={image.url}
                            alt={`Variant ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                        >
                            <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                        </button>
                        {image.isDefault && (
                            <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center">
                                Default
                            </span>
                        )}
                    </div>
                ))}
                <label className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                    <Icon icon="solar:add-circle-bold" className="w-8 h-8 text-gray-400" />
                </label>
            </div>
        </div>
    );
});

VariantImageUpload.propTypes = {
    variantPath: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(PropTypes.shape({
        url: PropTypes.string,
        type: PropTypes.string,
        isDefault: PropTypes.bool
    })),
    onUpload: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired
};

VariantImageUpload.defaultProps = {
    images: []
};

VariantImageUpload.displayName = 'VariantImageUpload';

export default VariantImageUpload; 