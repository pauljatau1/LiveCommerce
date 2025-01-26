import { useState } from 'react';
import { NavLink, useOutletContext } from 'react-router-dom';
import { useEffect } from 'react';
import { useLivestreamContext } from '../../Hooks/useLivestreamContext';
import ActiveLiveStreamCard from '../../Components/ActiveLiveStreamCard';
import Header from "../../Components/ui/Header/Header";
import NotFoundIcon from "../../assets/not-found-icon.png";
import DraftCoverPhoto from "../../assets/young-woman-organizing-live-shop 1.png";

const ScheduleShows = () => {
  const { setHeaderName, setNavName } = useOutletContext()
  const { activeStreams, livestream, getAllSellerActiveStreams, fetchedLiveStreams } = useLivestreamContext();
  const [scheduledShows, setScheduledShows] = useState([]);
  
  useEffect(() => {
    setHeaderName('Live Streams')
    setNavName('Scheduled Shows')
  }, [])

  useEffect(() => {
    getAllSellerActiveStreams();
  }, []);

  useEffect(() => {
    setScheduledShows(fetchedLiveStreams);
  }, [fetchedLiveStreams]);



  const sellerData = localStorage.getItem('seller');
  const sellerInfo = sellerData ? JSON.parse(sellerData) : null;
  console.log('sellerInfo', sellerInfo);
  return (
    <div className="flex relative h-screen flex-col gap-6 p-4 md:p-6">

      {/* Grid of Cards */}
      {
        scheduledShows.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {
                scheduledShows.map((item) => (
                  <ActiveLiveStreamCard
                    key={item._id}
                    streamerName={sellerInfo?.firstName}
                    streamerImage={sellerInfo?.storeAvatar?.url}
                    streamTitle={item?.title}
                    thumbnailImage={item?.coverImage}
                    tags={item?.tags}
                    startTime={item?.scheduledStartTime}
                    isLive={item.status === 'scheduled' ? false : true}
                    category={item?.category}
                    location={sellerInfo?.businessAddress}
                    livestream={DraftCoverPhoto}
                    id={item?._id}
                  />
                ))
              }
            </div>

            {/* Pagination */}
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Back
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Next
              </button>
            </div>
          </>
        ) : (
          <div className=" flex mt-10 flex-col absolute inset-0 items-center justify-center gap-4">
            <img src={NotFoundIcon} alt="No active streams" className="w-[180px] md:w-[220px] h-[180px] md:h-[220px] xl:w-[386px] xl:h-[386px]" />
            <h1 className="text-lg font-medium text-center text-[#000000]">You have no scheduled shows yet</h1>
            <NavLink to="/dashboard/live-streams/live-stream" className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 transition-all duration-300 rounded-lg">
              Schedule a show
            </NavLink>
          </div>
        )
      }
    </div>
  );
};

export default ScheduleShows;


