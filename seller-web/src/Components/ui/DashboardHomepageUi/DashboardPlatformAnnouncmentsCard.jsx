import { useEffect, useState } from "react";
import { BASE_URL } from "../../../Constants/Server";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import { Icon } from "@iconify/react";
import AnnouncementCard from "@/Components/AnnouncementCard";

export default function DashboardPlatformAnnouncmentsCard() {
  const [platformAnnouncements, setPlatformAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlatformAnnouncements = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/public/announcements`);
        if (response.status === 200) {
          console.log("Platform announcements:", response.data);
          setPlatformAnnouncements(response.data);
        }
      } catch (error) {
        console.error("Error fetching platform announcements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatformAnnouncements();
  }, []);

  if (isLoading) {
    return (
      <>
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-md border border-gray-200"
            >
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-lg font-lexend font-bold text-[#17171B] mb-2">
        Platform Announcements
      </h1>
      <div className="flex flex-col bg-white mt-4 rounded-md border border-gray-200 ">
        {platformAnnouncements.length > 0 ? (
          platformAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement._id}
              announcement={announcement}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <Icon
              icon="line-md:clipboard-list"
              className="text-gray-400 w-20 h-20"
            />
            <p className="text-base font-medium text-[#425466] font-inter mt-3">
              No announcements available
            </p>
            <p className="text-sm text-[#425466] font-inter mt-1">
              Check back later for updates from Auqli
            </p>
          </div>
        )}
      </div>
    </>
  );
}
