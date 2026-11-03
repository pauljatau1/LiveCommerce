import { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink, useOutletContext } from 'react-router-dom';
import { useLivestreamContext } from '../../Hooks/useLivestreamContext';
import ActiveLiveStreamCard from '../../Components/ActiveLiveStreamCard';
import NotFoundIcon from "../../assets/not-found-icon.png";
import LinearProgress from "@mui/material/LinearProgress";
import { Icon } from "@iconify/react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../Components/ui/popover";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "../../Components/ui/command";
import arrowLongLeftIcon from '@iconify-icons/gg/arrow-long-left';
import arrowLongRightIcon from '@iconify-icons/gg/arrow-long-right';
import arrowDownIcon from '@iconify-icons/simple-line-icons/arrow-down';
import checkIcon from '@iconify-icons/lucide/check';

const ScheduleShows = () => {
  const { setHeaderName, setNavName } = useOutletContext();
  const { getAllSellerActiveStreams, fetchedLiveStreams, isLoading, streamsPagination } = useLivestreamContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Set header names - only run once on mount
  useEffect(() => {
    setHeaderName('Live Streams');
    setNavName('Scheduled Shows');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch streams when page or itemsPerPage changes - DO NOT include getAllSellerActiveStreams in deps
  useEffect(() => {
    getAllSellerActiveStreams(currentPage, itemsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  // Handle page navigation - memoized to prevent re-renders
  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => {
      if (prev > 1) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => {
      if (streamsPagination && prev < streamsPagination.totalPages) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return prev + 1;
      }
      return prev;
    });
  }, [streamsPagination]);

  // Handle items per page change - memoized
  const handleItemsPerPageChange = useCallback((newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  // Filter out ended streams - memoized to prevent unnecessary recalculations
  const newScheduledShows = useMemo(() => {
    return fetchedLiveStreams?.filter(item => item.status !== 'ended') || [];
  }, [fetchedLiveStreams]);

  // Get seller info from localStorage - memoized
  const sellerInfo = useMemo(() => {
    const sellerData = localStorage.getItem('seller');
    return sellerData ? JSON.parse(sellerData) : null;
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80dvh]">
        <div className="w-3/4 sm:w-1/2 md:w-1/3 lg:w-1/4">
          <LinearProgress color="success" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex relative flex-col gap-6 p-4 md:p-6">
      {/* Grid of Cards */}
      {newScheduledShows.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {newScheduledShows.map((item) => (
              <ActiveLiveStreamCard
                key={item._id}
                streamerName={item.seller?.storeName || sellerInfo?.firstName || 'Seller'}
                streamerImage={item.seller?.storeAvatar?.url || sellerInfo?.storeAvatar?.url}
                streamTitle={item?.title}
                thumbnailImage={item?.coverImage}
                blip={item?.video}
                tags={item?.tags || []}
                startTime={item?.scheduledStartTime}
                isLiveStatus={item?.status}
                category={item?.category}
                location={item.seller?.businessAddress || sellerInfo?.businessAddress}
                streamLink={item?.streamLink}
                id={item?._id}
              />
            ))}
          </div>

          {/* Pagination Controls - Matching ProductsPage style */}
          {streamsPagination && streamsPagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between flex-wrap gap-3 mt-4 lg:mt-8 w-full px-2 sm:px-4 py-3">
              <div className="text-xs sm:text-sm text-gray-600 w-full sm:w-auto text-center sm:text-left">
                Showing {newScheduledShows.length} of {streamsPagination.totalStreams} streams
              </div>
              <div className="flex items-center justify-center flex-wrap gap-3 w-full sm:w-auto">
                {/* Mobile pagination display */}
                <div className="flex sm:hidden items-center justify-center w-full">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage <= 1}
                    className={`flex-1 ${currentPage <= 1
                      ? 'text-gray-400 bg-gray-200 cursor-not-allowed'
                      : 'text-[#ffffff] bg-[#17171B] hover:bg-[#17171B]/90'
                      } flex items-center justify-center gap-1 rounded-l-lg py-2 transition-all duration-300 ease-in-out`}
                  >
                    <Icon icon={arrowLongLeftIcon} width="14" height="14" color={currentPage <= 1 ? "#a0a0a0" : "#FFFFFF"} />
                    <span className="text-xs">Prev</span>
                  </button>

                  <span className="px-4 py-2 text-xs bg-gray-50 border-t border-b border-gray-200">
                    Page {currentPage} of {streamsPagination.totalPages}
                  </span>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= streamsPagination.totalPages}
                    className={`flex-1 ${currentPage >= streamsPagination.totalPages
                      ? 'text-gray-400 bg-gray-200 cursor-not-allowed'
                      : 'text-[#ffffff] bg-[#17171B] hover:bg-[#17171B]/90'
                      } flex items-center justify-center gap-1 rounded-r-lg py-2 transition-all duration-300 ease-in-out`}
                  >
                    <span className="text-xs">Next</span>
                    <Icon icon={arrowLongRightIcon} width="14" height="14" color={currentPage >= streamsPagination.totalPages ? "#a0a0a0" : "#FFFFFF"} />
                  </button>
                </div>

                {/* Desktop pagination controls */}
                <div className="hidden sm:flex items-center justify-center gap-3">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage <= 1}
                    className={`text-xs sm:text-sm font-cabin font-normal ${currentPage <= 1
                      ? 'text-gray-400 bg-gray-200 cursor-not-allowed'
                      : 'text-[#ffffff] bg-[#17171B] hover:bg-[#17171B]/90'
                      } flex items-center gap-1 sm:gap-2 rounded-full py-2 sm:py-3 px-3 sm:px-4 transition-all duration-500 ease-in-out`}
                  >
                    <Icon icon={arrowLongLeftIcon} width="16" height="16" color={currentPage <= 1 ? "#a0a0a0" : "#FFFFFF"} />
                    <p className="text-xs sm:text-sm font-cabin font-normal">Previous</p>
                  </button>

                  <div className="flex items-center gap-1">
                    <span className="px-3 py-2 rounded-md bg-[#17171B] text-white">
                      {currentPage}
                    </span>
                    <span className="text-gray-600">of</span>
                    <span className="px-3 py-2 rounded-md border border-gray-200">
                      {streamsPagination.totalPages}
                    </span>
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= streamsPagination.totalPages}
                    className={`text-xs sm:text-sm font-cabin font-normal ${currentPage >= streamsPagination.totalPages
                      ? 'text-gray-400 bg-gray-200 cursor-not-allowed'
                      : 'text-[#ffffff] bg-[#17171B] hover:bg-[#17171B]/90'
                      } flex items-center gap-1 sm:gap-2 rounded-full py-2 sm:py-3 px-3 sm:px-4 transition-all duration-500 ease-in-out`}
                  >
                    <p className="text-xs sm:text-sm font-cabin font-normal">Next</p>
                    <Icon icon={arrowLongRightIcon} width="16" height="16" color={currentPage >= streamsPagination.totalPages ? "#a0a0a0" : "#FFFFFF"} />
                  </button>
                </div>

                {/* Items per page selector */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-xs sm:text-sm font-cabin font-normal text-[#ffffff] bg-[#17171B] flex items-center gap-1 sm:gap-2 rounded-full py-2 sm:py-3 px-3 sm:px-4 whitespace-nowrap hover:bg-[#17171B]/90 transition-all duration-500 ease-in-out">
                      <p className="text-xs sm:text-sm font-cabin font-normal text-[#FFFFFF]">{itemsPerPage} per page</p>
                      <Icon icon={arrowDownIcon} width="8" height="8" color="#FFFFFF" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          <CommandItem onSelect={() => handleItemsPerPageChange(10)}>
                            <span>10 per page</span>
                            {itemsPerPage === 10 && <Icon icon={checkIcon} className="ml-auto" />}
                          </CommandItem>
                          <CommandItem onSelect={() => handleItemsPerPageChange(20)}>
                            <span>20 per page</span>
                            {itemsPerPage === 20 && <Icon icon={checkIcon} className="ml-auto" />}
                          </CommandItem>
                          <CommandItem onSelect={() => handleItemsPerPageChange(50)}>
                            <span>50 per page</span>
                            {itemsPerPage === 50 && <Icon icon={checkIcon} className="ml-auto" />}
                          </CommandItem>
                          <CommandItem onSelect={() => handleItemsPerPageChange(100)}>
                            <span>100 per page</span>
                            {itemsPerPage === 100 && <Icon icon={checkIcon} className="ml-auto" />}
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="h-[70dvh] flex mt-10 flex-col absolute inset-0 items-center justify-center gap-4">
          <img src={NotFoundIcon} alt="No active streams" className="w-[180px] md:w-[220px] h-[180px] md:h-[220px] xl:w-[386px] xl:h-[386px]" />
          <h1 className="text-base lg:text-lg font-medium text-center text-[#000000]">You have no scheduled shows yet</h1>
          <NavLink to="/dashboard/live-streams/live-stream" className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 transition-all duration-300 rounded-lg">
            Schedule a show
          </NavLink>
        </div>
      )}
    </div>
  );
};

export default ScheduleShows;


