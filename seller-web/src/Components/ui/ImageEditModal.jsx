import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Slider } from './slider';
import { toast } from 'sonner';
import { Icon } from "@iconify/react";
import PropTypes from 'prop-types';

const ImageEditModal = ({ 
  isOpen, 
  onClose, 
  image, 
  onSave,
  originalFile
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1); // Default to square
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Generate preview of cropped image
  const generatePreview = useCallback(async () => {
    if (!croppedAreaPixels || !image) return;

    setIsGeneratingPreview(true);
    try {
      const croppedImageBlob = await getCroppedImg(
        image,
        croppedAreaPixels,
        rotation
      );

      if (croppedImageBlob) {
        const url = URL.createObjectURL(croppedImageBlob);
        setCroppedImageUrl(url);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [croppedAreaPixels, image, rotation]);

  // Update preview when crop changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generatePreview();
    }, 300); // Debounce to avoid too many updates

    return () => clearTimeout(timeoutId);
  }, [generatePreview]);

  // Cleanup blob URL when component unmounts or URL changes
  useEffect(() => {
    return () => {
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl);
      }
    };
  }, [croppedImageUrl]);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    const rotRad = getRadianAngle(rotation);

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    // draw rotated image
    ctx.drawImage(image, 0, 0);

    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');

    if (!croppedCtx) {
      return null;
    }

    // Set the size of the cropped canvas
    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;

    // Draw the cropped image onto the new canvas
    croppedCtx.drawImage(
      canvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      croppedCanvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const getRadianAngle = (degreeValue) => {
    return (degreeValue * Math.PI) / 180;
  };

  const rotateSize = (width, height, rotation) => {
    const rotRad = getRadianAngle(rotation);

    return {
      width:
        Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      toast.error('Please select a crop area');
      return;
    }

    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(
        image,
        croppedAreaPixels,
        rotation
      );

      if (croppedImageBlob) {
        // Create a new File object with the original file properties
        const croppedFile = new File(
          [croppedImageBlob], 
          originalFile.name || 'cropped-image.jpg', 
          {
            type: croppedImageBlob.type,
            lastModified: Date.now()
          }
        );

        // Convert to data URL for preview
        const reader = new FileReader();
        reader.onloadend = () => {
          const croppedImageData = {
            url: reader.result,
            contentType: croppedFile.type,
            isDefault: false,
            file: croppedFile
          };
          
          onSave(croppedImageData);
          onClose();
          toast.success('Image edited successfully!');
        };
        reader.readAsDataURL(croppedFile);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedImageUrl(null);
  };

  const handleAspectRatioChange = (ratio) => {
    setAspectRatio(ratio);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedImageUrl(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Edit Image</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Alert message */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <Icon icon="solar:info-circle-bold" className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Image Requires Editing</h4>
              <p className="text-sm text-amber-700 mt-1">
                This image appears to have a mobile screenshot aspect ratio. Please crop it to a more suitable format for product listing.
                Recommended aspect ratio: 1:1 (square) or 4:3 (landscape).
              </p>
            </div>
          </div>

          {/* Cropper Container */}
          <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              showGrid={true}
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#f3f4f6'
                }
              }}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Quick Aspect Ratio Buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Aspect Ratio</label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant={aspectRatio === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAspectRatioChange(1)}
                >
                  1:1 Square
                </Button>
                <Button
                  type="button"
                  variant={aspectRatio === 4/3 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAspectRatioChange(4/3)}
                >
                  4:3 Landscape
                </Button>
                <Button
                  type="button"
                  variant={aspectRatio === 16/9 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAspectRatioChange(16/9)}
                >
                  16:9 Wide
                </Button>
                <Button
                  type="button"
                  variant={aspectRatio === undefined ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAspectRatioChange(undefined)}
                >
                  Free Form
                </Button>
              </div>
            </div>

            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Zoom</label>
                <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Rotation</label>
                <span className="text-sm text-gray-500">{rotation}°</span>
              </div>
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                min={-45}
                max={45}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Preview</label>
            <div className="flex justify-center items-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              {isGeneratingPreview ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Icon icon="solar:loading-bold" className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Generating preview...</span>
                </div>
              ) : croppedImageUrl ? (
                <div className="text-center">
                  <img
                    src={croppedImageUrl}
                    alt="Cropped preview"
                    className="max-w-32 max-h-32 object-contain rounded-lg shadow-sm border"
                  />
                  <p className="text-xs text-gray-500 mt-2">Preview of cropped image</p>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Icon icon="solar:image-bold" className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Adjust crop area to see preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
            >
              Reset
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isProcessing}
                className="bg-[#17171B]/90 hover:bg-[#17171B]/80"
              >
                {isProcessing ? (
                  <>
                    <Icon icon="solar:loading-bold" className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Save Edited Image'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

ImageEditModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  image: PropTypes.string,
  onSave: PropTypes.func,
  originalFile: PropTypes.object
};

export default ImageEditModal; 