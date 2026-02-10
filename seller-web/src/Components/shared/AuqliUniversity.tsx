import React, { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { resourcesService, type PublicResource } from '@/services/resourcesService';

type AuqliUniversityProps = {
  className?: string;
};

type YoutubeResource = PublicResource & {
  videoId: string;
  thumbnail: string;
};

// Extract YouTube video ID from URL
const getYoutubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Create thumbnail URL from video ID
const getYoutubeThumbnail = (videoId: string): string =>
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

const CARD_WIDTH = 320; // px, approximate for scroll snapping

const AuqliUniversity: React.FC<AuqliUniversityProps> = ({ className = '' }) => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    data,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['auqliUniversityResources'],
    queryFn: () => resourcesService.fetchAuqliUniversityResources(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const resources: YoutubeResource[] = useMemo(() => {
    if (!data) return [];
    return (
      data
        // mirror v1 behaviour: filter valid YouTube links and parse IDs
        .map((resource) => {
          const videoId = getYoutubeVideoId(resource.link);
          if (!videoId) return null;
          return {
            ...resource,
            videoId,
            thumbnail: getYoutubeThumbnail(videoId),
          } as YoutubeResource;
        })
        .filter(Boolean) as YoutubeResource[]
    );
  }, [data]);

  const handleVideoClick = (videoId: string) => {
    setActiveVideo(videoId);
  };

  const closeVideoModal = () => {
    setActiveVideo(null);
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current || resources.length === 0) return;

    setCurrentIndex((prev) => {
      const nextIndex =
        direction === 'right'
          ? Math.min(prev + 1, resources.length - 1)
          : Math.max(prev - 1, 0);

      const scrollLeft = nextIndex * (CARD_WIDTH + 24); // include gap approximation
      scrollContainerRef.current?.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });

      return nextIndex;
    });
  };

  return (
    <section
      className={`w-full bg-white border border-[#EDF2F7] rounded-2xl shadow-[0px_3px_8px_-1px_rgba(50,50,71,0.05)] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7 flex flex-col gap-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-[#17171B] text-lg sm:text-xl lg:text-2xl font-['Lexend'] font-semibold leading-snug">
            Auqli Seller University
          </h2>
          <p className="mt-1 text-xs sm:text-sm lg:text-base text-[#4B5563] font-['Lexend']">
            Get tips and best practices to grow your business on Auqli using Auqli marketing tools.
          </p>
        </div>

        {/* Carousel controls (desktop) */}
        {resources.length > 1 && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={currentIndex === 0}
              aria-label="Previous lesson"
            >
              <Icon icon="lucide:chevron-left" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={currentIndex === resources.length - 1}
              aria-label="Next lesson"
            >
              <Icon icon="lucide:chevron-right" className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isPending ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#16783A]" />
        </div>
      ) : isError ? (
        <div className="py-8 text-center text-sm text-red-500">
          Failed to load Auqli University lessons. Please try again later.
        </div>
      ) : resources.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">
          No videos available at the moment.
        </div>
      ) : (
        <>
          {/* Lessons carousel */}
          <div className="relative mt-2">
            <div
              ref={scrollContainerRef}
              className="flex gap-4 lg:gap-6 overflow-x-auto pb-2 mt-1 scroll-smooth
              [&::-webkit-scrollbar]:h-2
              [&::-webkit-scrollbar-track]:rounded-full
              [&::-webkit-scrollbar-track]:bg-gray-200
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-[#16a34a]
              hover:[&::-webkit-scrollbar-thumb]:bg-[#15803d]"
            >
              {resources.map((resource, index) => (
                <div key={resource._id} className="flex-none w-[260px] sm:w-[280px] lg:w-[320px]">
                  <button
                    type="button"
                    onClick={() => handleVideoClick(resource.videoId)}
                    className="group block text-left"
                  >
                    <div className="relative overflow-hidden rounded-xl shadow-sm">
                      <img
                        src={resource.thumbnail}
                        alt={resource.title}
                        className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Icon icon="logos:youtube-icon" className="w-20 h-20" />
                      </div>
                      </div>
                    </div>
                    <p className="mt-3 text-xs lg:text-sm 2xl:text-base capitalize font-bold text-[#111827] font-['Lexend'] line-clamp-2">
                      {`Lesson ${index + 1}: ${resource.title}`}
                    </p>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Video Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={closeVideoModal}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
              onClick={closeVideoModal}
            >
              <Icon icon="mdi:close" className="w-8 h-8" />
            </button>
            <div className="relative pb-[56.25%] h-0">
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AuqliUniversity;


