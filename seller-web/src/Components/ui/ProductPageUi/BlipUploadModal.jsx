import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/Components/ui/dialog';
import { Progress } from '@/Components/ui/progress';
import { CircularProgress } from '@mui/material';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import axios from 'axios';
import { BASE_URL } from '@/Constants/Server';
import { trackEvent } from '@/util/analytics';
import VideoPlayer from '@/Shared/VideoPlayer';
import PropTypes from 'prop-types';

// Update the BlipUploadModal to include product information
const BlipUploadModal = ({ open, onClose, productId, product, setOpenShareLinkPopUp, changeLinkType, changeDeepLink }) => {
    const [blipVideos, setBlipVideos] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);
    const [existingBlips, setExistingBlips] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingBlipId, setDeletingBlipId] = useState(null);
    const [isLoadingProduct, setIsLoadingProduct] = useState(false);

    // Determine if share-related handlers are available
    const canShareBlip =
        typeof setOpenShareLinkPopUp === 'function' &&
        typeof changeLinkType === 'function' &&
        typeof changeDeepLink === 'function';

        console.log('blip upload modal open details', productId, product)

    // Fetch complete product data with blips when modal opens
    const fetchProductWithBlips = useCallback(async () => {
        if (!productId) return;

        setIsLoadingProduct(true);
        try {
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null };

            const response = await axios.get(`${BASE_URL}/products/${productId}`, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`
                }
            });

            if (response.status === 200 && response.data) {
                // Check if the returned product has blips
                if (response.data.blips && Array.isArray(response.data.blips)) {
                    setExistingBlips(response.data.blips);
                }
            }
        } catch (error) {
            console.error('Error fetching product blips:', error);
            toast.error('Failed to load product blips', {
                description: error.response?.data?.message || 'Please try again',
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
        } finally {
            setIsLoadingProduct(false);
        }
    }, [productId]);

    // Fetch existing blips when modal opens
    useEffect(() => {
        if (open && productId) {
            // First check if product prop already has blips
            if (product?.blips && Array.isArray(product.blips)) {
                setExistingBlips(product.blips);
            }

            // Then fetch the latest data from API to ensure we have the most recent blips
            fetchProductWithBlips();
        }
    }, [open, productId, product, fetchProductWithBlips]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = [];
        const newPreviewUrls = [];

        // Validate each file
        files.forEach(file => {
            // Check if file is a video
            if (!file.type.startsWith('video/')) {
                toast.error(`${file.name} is not a video file`);
                return;
            }

            // Check file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 50MB)`);
                return;
            }

            validFiles.push(file);

            // Create preview URL
            const objectUrl = URL.createObjectURL(file);
            newPreviewUrls.push(objectUrl);
        });

        // Check if adding these files would exceed limit of 5 total blips
        if (existingBlips.length + validFiles.length > 5) {
            toast.error(`You can only have a maximum of 5 blips per product. You currently have ${existingBlips.length}.`);
            // Clear previews
            newPreviewUrls.forEach(url => URL.revokeObjectURL(url));
            return;
        }

        setBlipVideos(prev => [...prev, ...validFiles]);
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    const handleRemoveFile = (index) => {
        // Revoke the URL to prevent memory leaks
        URL.revokeObjectURL(previewUrls[index]);

        // Remove the file and preview
        setBlipVideos(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (blipVideos.length === 0) {
            toast.error('Please select at least one video to upload');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            blipVideos.forEach(file => {
                formData.append('blipVideos', file);
            });

            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null };

            // Create upload request with progress tracking
            const response = await axios.post(
                `${BASE_URL}/products/${productId}/blips`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${tokenData.data}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                }
            );

            if (response.status === 201) {
                toast.success(`${blipVideos.length} blip video${blipVideos.length > 1 ? 's' : ''} uploaded successfully`, {
                    style: {
                        background: '#17171B',
                        color: '#fff',
                    }
                });

                // Update existing blips with new ones from response
                if (response.data && response.data.blips) {
                    setExistingBlips(response.data.blips);
                }

                const sellerDetails = JSON.parse(localStorage.getItem('seller'));

                trackEvent('blip_created', {
                    sellerId: sellerDetails?._id,
                    sellerName: sellerDetails?.firstName + ' ' + sellerDetails?.lastName,
                    storeName: sellerDetails?.storeName,
                    sellerEmail: sellerDetails?.email,
                    sellerPhone: sellerDetails?.phoneNumber,
                    sellerAddress: sellerDetails?.sellerAddress?.addressLine1,
                    sellerCity: sellerDetails?.sellerAddress?.city,
                    sellerState: sellerDetails?.sellerAddress?.state,
                    sellerZip: sellerDetails?.sellerAddress?.zipCode,
                    sellerCountry: sellerDetails?.sellerAddress?.country,
                    productId: productId,
                    productName: product?.name,
                    productPrice: product?.price,
                    blipCount: blipVideos.length
                });

                // Clear the selected files
                setBlipVideos([]);
                setPreviewUrls([]);
            }
        } catch (error) {
            console.error('Error uploading blips:', error);
            toast.error('Failed to upload blip videos', {
                description: error.response?.data?.message || 'Please try again',
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteBlip = async (blipId) => {
        if (!blipId) return;

        setIsDeleting(true);
        setDeletingBlipId(blipId);

        try {
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null };

            const response = await axios.delete(
                `${BASE_URL}/products/${productId}/blips/${blipId}`,
                {
                    headers: {
                        Authorization: `Bearer ${tokenData.data}`
                    }
                }
            );

            if (response.status === 200) {
                toast.success('Blip video deleted successfully', {
                    style: {
                        background: '#17171B',
                        color: '#fff',
                    }
                });

                // Remove the deleted blip from the list
                setExistingBlips(prev => prev.filter(blip => blip._id !== blipId));
            }
        } catch (error) {
            console.error('Error deleting blip:', error);
            toast.error('Failed to delete blip video', {
                description: error.response?.data?.message || 'Please try again',
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
        } finally {
            setIsDeleting(false);
            setDeletingBlipId(null);
        }
    };

    const handleTriggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleClose = () => {
        // Clean up preview URLs to prevent memory leaks
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        setBlipVideos([]);
        setPreviewUrls([]);
        setUploadProgress(0);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[700px] p-6 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-2xl font-bold text-[#17171B]">Manage Product Blips</DialogTitle>
                    <DialogDescription className="text-base">
                        Add up to 5 short video blips to showcase your product
                    </DialogDescription>
                </DialogHeader>

                {/* Product Information */}
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg my-4">
                    <img
                        src={product?.images[0]?.url}
                        alt={product?.name}
                        className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                        <h3 className="font-medium text-[#17171B]">{product?.name}</h3>
                        <p className="text-sm text-gray-500">
                            {product?.category} • {product?.subCategory}
                        </p>
                        <p className="text-xs mt-1">
                            {existingBlips.length}/5 blips used
                        </p>
                    </div>
                </div>

                {/* Existing Blips Section */}
                {existingBlips.length > 0 ? (
                    <div className="space-y-3 mt-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-lg">Existing Blips</h4>
                            <button
                                onClick={fetchProductWithBlips}
                                disabled={isLoadingProduct}
                                className="text-xs flex items-center gap-1 text-[#17171B] hover:text-[#17171B]/80"
                            >
                                <Icon icon={isLoadingProduct ? "mdi:loading" : "solar:refresh-bold"} className={`w-4 h-4 ${isLoadingProduct ? "animate-spin" : ""}`} />
                                <span>Refresh</span>
                            </button>
                        </div>

                        {isLoadingProduct ? (
                            <div className="flex justify-center items-center py-8">
                                <CircularProgress size={30} color="inherit" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {existingBlips.map((blip) => (
                                    <div key={blip._id} className="border rounded-lg p-3 relative">
                                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                            <VideoPlayer
                                                src={blip.url}
                                                poster={blip.thumbnail}
                                                style={{ borderRadius: 0, maxHeight: 360 }}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs text-gray-500">
                                                <div className="flex items-center">
                                                    {/* Added date */}
                                                    <span>
                                                        Added:&nbsp;{new Date(blip.createdAt).toLocaleDateString()}
                                                    </span>

                                                    {/* show only while NOT processed */}
                                                    {!blip.processed && (
                                                        <span className="flex items-center gap-2 text-red-500 ml-5">
                                                            {/* loader */}
                                                            <svg
                                                                className="h-4 w-4 animate-spin"
                                                                viewBox="0 0 24 24"
                                                                aria-hidden="true"
                                                            >
                                                                <circle
                                                                    className="opacity-25"
                                                                    cx="12" cy="12" r="10"
                                                                    stroke="currentColor" strokeWidth="4" fill="none"
                                                                />
                                                                <path
                                                                    className="opacity-75"
                                                                    fill="currentColor"
                                                                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                                                                />
                                                            </svg>
                                                            <span>Processing…</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </span>
                                            <button
                                                onClick={() => handleDeleteBlip(blip._id)}
                                                disabled={isDeleting && deletingBlipId === blip._id}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Delete blip"
                                            >
                                                {isDeleting && deletingBlipId === blip._id ? (
                                                    <CircularProgress size={20} color="inherit" />
                                                ) : (
                                                    <Icon icon="solar:trash-bin-trash-bold" className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                        {canShareBlip && (
                                            <button onClick={() => {
                                                // Safely invoke handlers only if provided
                                                setOpenShareLinkPopUp?.(true);
                                                changeLinkType?.("Blip");
                                                changeDeepLink?.(product?.blipLink);
                                            }} className="py-2 px-3 border-2 border-solid border-gray-500 text-gray-500 hover:bg-gray-300 hover:text-gray-700 hover:border-gray-700 transition-all duration-300 rounded-md mt-5 flex items-center gap-2 justify-center" >
                                                <p className="text-sm lg:text-base font-semibold ">Share</p>
                                                <Icon icon="fluent:share-20-filled" width="18" height="18" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mt-4 p-6 border rounded-lg bg-gray-50 text-center">
                        {isLoadingProduct ? (
                            <div className="flex flex-col items-center gap-3">
                                <CircularProgress size={30} color="inherit" />
                                <p className="text-gray-500">Loading product blips...</p>
                            </div>
                        ) : (
                            <>
                                <Icon icon="solar:video-frame-broken-bold" className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                <p className="text-gray-500">No blips have been added to this product yet</p>
                                <p className="text-sm text-gray-400 mt-1">Upload your first blip below</p>
                            </>
                        )}
                    </div>
                )}

                {/* Add New Blips Section */}
                <div className="space-y-6 mt-6">
                    <div>
                        <h4 className="font-medium text-lg">Add New Blips {blipVideos.length > 0 ? `(${blipVideos.length})` : ''}</h4>
                        <p className="text-xs text-gray-500">
                            You can add up to 5 blips per product and each blip must be less than 50MB
                        </p>
                    </div>

                    {/* Only show upload area if not at max capacity */}
                    {existingBlips.length < 5 ? (
                        <div
                            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all
                                ${blipVideos.length > 0 ? 'border-[#17171B]' : 'border-gray-300'}`}
                            onClick={handleTriggerFileInput}
                        >
                            <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                multiple
                            />

                            <div className="text-center space-y-3">
                                <Icon icon="solar:video-frame-bold" className="w-12 h-12 text-gray-400 mx-auto" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-700">Click to select video files</p>
                                    <p className="text-xs text-gray-500">MP4, MOV, or WebM up to 50MB each</p>
                                    <p className="text-xs text-gray-500">You can add {5 - existingBlips.length} more blip(s)</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="border rounded-lg p-6 bg-yellow-50 text-yellow-800">
                            <p className="text-center">You&apos;ve reached the maximum limit of 5 blips for this product. Delete existing blips to add new ones.</p>
                        </div>
                    )}

                    {/* Selected Files Preview */}
                    {blipVideos.length > 0 && (
                        <div className="space-y-4">
                            <h5 className="font-medium">Selected Videos</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {blipVideos.map((file, index) => (
                                    <div key={index} className="border rounded-lg p-3 relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFile(index);
                                            }}
                                            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm hover:bg-gray-100 z-10"
                                        >
                                            <Icon icon="solar:close-circle-bold" className="w-6 h-6 text-gray-700" />
                                        </button>
                                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                            <video
                                                src={previewUrls[index]}
                                                className="w-full h-full object-contain"
                                                controls
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 truncate">
                                            {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isUploading && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Uploading {blipVideos.length} video{blipVideos.length > 1 ? 's' : ''}...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2" />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2 border border-[#17171B] rounded-lg hover:bg-gray-200 font-medium transition-all"
                            disabled={isUploading || isDeleting}
                        >
                            {blipVideos.length > 0 || existingBlips.length > 0 ? 'Done' : 'Cancel'}
                        </button>
                        {blipVideos.length > 0 && (
                            <button
                                type="button"
                                onClick={handleUpload}
                                disabled={blipVideos.length === 0 || isUploading || isDeleting}
                                className="px-6 py-2 bg-[#17171B] text-white rounded-lg hover:bg-[#17171B]/90 disabled:opacity-50 font-medium transition-all flex items-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <CircularProgress size={20} color="inherit" />
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="solar:upload-bold" className="w-5 h-5" />
                                        <span>Upload {blipVideos.length} Blip{blipVideos.length > 1 ? 's' : ''}</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BlipUploadModal;

BlipUploadModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    productId: PropTypes.string.isRequired,
    product: PropTypes.object.isRequired,
    // Optional handlers for sharing blip links; present when used within ProductCard
    setOpenShareLinkPopUp: PropTypes.func,
    changeLinkType: PropTypes.func,
    changeDeepLink: PropTypes.func,
};