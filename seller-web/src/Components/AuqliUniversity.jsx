import React, { useState, useEffect } from 'react';
import { Icon } from "@iconify/react";
import axios from 'axios';
import { BASE_URL } from '../Constants/Server';

// Extract YouTube video ID from URL
const getYoutubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Create thumbnail URL from video ID
const getYoutubeThumbnail = (videoId) => {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

const AuqliUniversity = ({ className }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        // Fetch only YouTube videos from Auqli University category
        const response = await axios.get(`${BASE_URL}/public/resources`, {
          params: {
            resourceType: 'youtube',
            category: 'auqli_university'
          }
        });
        
        // Filter valid YouTube links and parse video IDs
        const youtubeResources = response.data.map(resource => {
          const videoId = getYoutubeVideoId(resource.link);
          if (videoId) {
            return {
              ...resource,
              videoId,
              thumbnail: getYoutubeThumbnail(videoId)
            };
          }
          return null;
        }).filter(Boolean);
        
        setResources(youtubeResources);
      } catch (error) {
        console.error("Failed to fetch resources:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const handleVideoClick = (videoId) => {
    setActiveVideo(videoId);
  };

  const closeVideoModal = () => {
    setActiveVideo(null);
  };

  return (
    <div className={`border border-gray-200 rounded-[10px] px-4 py-3 lg:px-8 lg:py-7 ${className}`}>
      <h1 className="text-lg font-lexend font-bold text-[#05031F] mb-2">Auqli Seller University</h1>
      <p className="text-sm lg:text-base font-cabin font-normal text-[#05031F]">
        Get tips and best practices to grow your business on Auqli using Auqli marketing tools
      </p>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#16783A]"></div>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No videos available at the moment</p>
        </div>
      ) : (
        <div className="relative">
          <div className="flex gap-4 lg:gap-8 overflow-x-scroll pb-4 mt-5 scroll-smooth
            [&::-webkit-scrollbar]:h-2
            [&::-webkit-scrollbar-track]:rounded-full
            [&::-webkit-scrollbar-track]:bg-gray-100
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-gray-300
            hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
            
            {resources.map((resource) => (
              <div key={resource._id} className="flex-none">
                <div 
                  onClick={() => handleVideoClick(resource.videoId)} 
                  className="cursor-pointer group"
                >
                  <div className="relative w-[300px]">
                    <div className="relative overflow-hidden rounded-lg">
                      <img 
                        src={resource.thumbnail} 
                        alt={resource.title} 
                        className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Icon icon="logos:youtube-icon" className="w-12 h-12" />
                      </div>
                    </div>
                    <h3 className="mt-3 text-sm font-medium text-gray-900 line-clamp-2">
                      {resource.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={closeVideoModal}>
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button 
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
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuqliUniversity; 