import { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react';

const MediaGalleryModal = ({ isOpen, onClose, media, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!media || media.length === 0) return null;

  const currentMedia = media[currentIndex];
  const isVideo = currentMedia?.type === 'video' || currentMedia?.url?.includes('.mp4');

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 bg-black/95 border-none">
        <div className="relative h-[85vh] flex items-center justify-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation buttons */}
          {media.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-50 text-white hover:bg-white/20"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-50 text-white hover:bg-white/20"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Media display */}
          <div className="relative w-full h-full flex items-center justify-center">
            {isVideo ? (
              <video
                src={currentMedia.url}
                className="max-h-full max-w-full object-contain"
                controls
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={currentMedia.url}
                alt={`Media ${currentIndex + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>

          {/* Thumbnails */}
          {media.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
              {media.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden transition-opacity ${
                    index === currentIndex ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  {item.type === 'video' || item.url?.includes('.mp4') ? (
                    <>
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <img
                      src={item.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaGalleryModal; 