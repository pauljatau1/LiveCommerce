import { Icon } from '@iconify/react';
import AuqliLogo from '../../assets/auqli-official-logo.png';
import ChatEmpty from '../../assets/Chat Empty.png';
import PropTypes from 'prop-types';

const PreStreamDesktopUi = ({ 
  viewers = [], 
  totalShares = 0, 
  handleStartStream, 
  liveStreamDetails, 
  deviceError, 
  existingLivestream,
  getInitials,
  firstName,
  lastName,
  products,
  formatCurrency,
  seller,
  isReconnecting
}) => {
  return (
    <div className="hidden xl:block">
      {/** HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 items-start xl:items-center gap-4 xl:gap-0">
        <div className="flex justify-between md:justify-start md:col-span-3 items-center gap-2">
          <img src={AuqliLogo} alt="Auqli Logo" className="w-[162px] h-[44.03px]" />
          <h1 className="text-white whitespace-nowrap text-xl md:text-2xl font-lexend font-bold">LIVE STUDIO</h1>
        </div>
        <div className="hidden xl:flex md:col-span-6 items-center justify-center gap-4 xl:gap-8">
          <div className="flex items-center h-6 xl:h-12 cursor-pointer px-4 py-3 bg-[#EDF2F7] rounded-md gap-2 hover:bg-[#D6E0F0] transition-all duration-300">
            <p className="text-sm font-inter font-medium text-[#7A828A]">https://streamlink.com</p>
            <Icon icon="solar:copy-linear" className="w-5 h-5" color='#16783A' />
          </div>
          <div className="flex items-center h-6 xl:h-12 cursor-pointer px-4 py-3 border w-fit border-[#272A31] rounded-md gap-2 hover:bg-gray-200/10 transition-all duration-300">
            <Icon icon="octicon:people-24" className="w-5 h-5" color='#EFF0FA' />
            <p className="text-sm font-inter font-medium text-[#EFF0FA]">{viewers.length}</p>
          </div>
          <div className="flex items-center h-6 xl:h-12 cursor-pointer px-4 py-3 border w-fit border-[#14AE5C] rounded-md gap-2 hover:bg-gray-200/10 transition-all duration-300">
            <Icon icon="fluent:share-16-regular" className="w-7 h-7" color='#14AE5C' />
            <p className="text-sm font-inter font-medium text-[#EFF0FA]">Shares ({totalShares})</p>
          </div>
        </div>
        <div className="flex md:col-span-3 md:justify-end items-center gap-2">
          <button onClick={handleStartStream} className="flex items-center gap-2 border h-9 xl:h-12 text-white p-2 border-[#272A31] rounded-md hover:bg-gray-200/10 transition-all duration-300">
            <Icon icon="proicons:record" className="w-5 xl:w-7 h-6 xl:h-7" color="#C74E5B" />
          </button>
          <div className="flex border border-[#272A31] h-9 xl:h-12 rounded-md items-center">
            <button className="flex items-center justify-center gap-2 h-full text-white p-2 hover:bg-gray-200/10 transition-all duration-300">
              <Icon icon="bi:record-fill" className={`w-5 h-5 ${liveStreamDetails ? 'animate-pulse' : ''}`} color="#C74E5B" />
              <p className="text-sm xl:text-base font-inter font-semibold text-[#EFF0FA]">LIVE <span className="text-base font-inter font-medium text-[#EFF0FA] inline-block min-w-[2rem] text-right">0:00</span></p>
            </button>
            <button onClick={handleStartStream} className="flex items-center justify-center gap-2 border-l border-[#272A31] h-full text-white p-2 hover:bg-gray-200/10 transition-all duration-300">
              <Icon icon="fluent:record-32-regular" className="w-5 h-5" color="#EFF0FA" />
              <p className="text-sm xl:text-base font-inter font-semibold text-[#EFF0FA]">Start</p>
            </button>
          </div>
        </div>
      </div>

      {/** BODY */}
      <div className="mt-8 grid grid-cols-12 gap-6 min-h-[calc(100vh-250px)]">
        {/* desktop Left Sidebar - Tools */}
        <div className="hidden xl:block col-span-12 md:col-span-3 xl:col-span-2 bg-[#0D0F12] rounded-xl p-4">
          <div className="space-y-4">
            <h2 className="text-[#EFF0FA] font-inter font-medium text-base">Tools</h2>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                <Icon icon="ic:outline-announcement" className="w-5 h-5" color="#14AE5C" />
                <span className="text-[#EFF0FA] font-inter text-sm">Announcement</span>
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                <Icon icon="solar:user-block-linear" className="w-5 h-5" color="#C74E5B" />
                <span className="text-[#EFF0FA] font-inter text-sm">Block/Kick User</span>
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                <Icon icon="solar:user-plus-linear" className="w-5 h-5" color="#14AE5C" />
                <span className="text-[#EFF0FA] font-inter text-sm">Add Moderator</span>
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-3 bg-transparent hover:bg-gray-200/5 rounded-lg transition-all duration-300">
                <Icon icon="solar:settings-linear" className="w-5 h-5" color="#EFF0FA" />
                <span className="text-[#EFF0FA] font-inter text-sm">Settings</span>
              </button>
            </div>

            <div className="mt-8">
              <h2 className="text-[#EFF0FA] font-inter font-medium text-base mb-4">Products</h2>
              <div className="space-y-4 max-h-[calc(100vh-450px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] ">
                {
                  products?.length > 0 ? (
                    products?.map((item) => (
                      <div key={item?.product._id} className="bg-[#161A1E] flex  gap-4 rounded-xl p-3">
                        <div className="">
                          <img
                            src={item?.product?.images[0]?.url}
                            alt={item?.product?.name}
                            className="w-[62px] h-[62px] object-contain rounded-lg"
                          />
                        </div>
                        <div>
                          <p className="text-sm text-[#EFF0FA] font-inter mb-1 line-clamp-2">{item?.product?.name}</p>
                          <p className="text-sm text-[#718096] font-inter font-medium">
                            {formatCurrency(item?.product?.price)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col mt-10 items-center justify-center h-full">
                      <p className="text-sm text-[#7A828A] font-inter">No products added yet</p>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        </div>

        {/* desktop Main Content - Stream Preview */}
        <div className="hidden xl:block col-span-12 md:col-span-6 xl:col-span-7 bg-[#0D0F12] animate-pulse rounded-xl relative overflow-hidden">
          <div className="stream-container relative w-full h-full" style={{ aspectRatio: '16/9' }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-[#272A31] rounded-full flex items-center justify-center mb-6">
                <p className="text-white text-2xl font-lexend font-bold">
                  {getInitials(firstName, lastName)}
                </p>
              </div>
              {deviceError ? (
                <div className="text-red-500 mb-4 text-center">
                  <p>{deviceError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-white bg-red-600 px-4 py-2 rounded-lg"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                existingLivestream ? (
                  <button
                    disabled={isReconnecting}
                    onClick={() => {handleStartStream()}}
                    className={`bg-[#14AE5C] hover:bg-[#14AE5C]/90 text-white px-8 py-2 rounded-lg font-inter text-sm xl:text-base font-medium transition-all duration-300 ${isReconnecting ? 'bg-gray-600' : ''}`}
                  >
                    {isReconnecting ? 'Reconnecting...' : 'Reconnect Stream'}
                  </button>
                ) : (
                  <button
                    onClick={handleStartStream}
                    className="bg-[#14AE5C] hover:bg-[#14AE5C]/90 text-white px-8 py-2 rounded-lg font-inter text-sm xl:text-base font-medium transition-all duration-300"
                  >
                    Start Stream
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* desktop Right Sidebar - Activities */}
        <div className="hidden xl:block col-span-12 md:col-span-3 xl:col-span-3 bg-[#0D0F12]  rounded-xl p-4">
          <div className="h-full flex flex-col">
            <h2 className="text-[#EFF0FA] font-inter font-medium text-base mb-4">Activities</h2>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 xl:w-24 h-16 xl:h-24 mx-auto">
                  <img src={ChatEmpty} alt="Chat" className="w-full h-full" />
                </div>
                <h3 className="text-[#EFF0FA] font-inter font-medium">Start a conversation</h3>
                <p className="text-[#7A828A] text-sm font-inter">
                  There are no messages here yet. Start a conversation by sending a message.
                </p>
              </div>
            </div>
            <div className="mt-auto pt-4">
              <div className="flex items-center gap-2 bg-[#161A1E] rounded-lg p-3">
                {
                  seller?.storeAvatar?.url ? (
                    <img src={seller?.storeAvatar.url} alt="User" className="w-8 h-8 rounded-full" />
                  ) : (
                    <Icon icon="hugeicons:user-circle" className="w-8 h-8" color="#EFF0FA" />
                  )
                }
                <input
                  type="text"
                  placeholder="Write a comment..."
                  className="flex-1 bg-transparent text-[#EFF0FA] placeholder-[#7A828A] text-sm font-inter focus:outline-none"
                />
                <button className="text-[#14AE5C]">
                  <Icon icon="solar:send-linear" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 z-10">
        <div className="bg-[#0D0F12] rounded-xl p-4 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#14AE5C] font-inter font-medium text-lg">
              {formatCurrency(0)}
            </p>
            <p className="text-[#7A828A] text-sm font-inter">In sales so far</p>
          </div>
        </div>
        <div className="bg-[#0D0F12] rounded-xl p-4 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#EFF0FA] font-inter font-medium text-lg">0</p>
            <p className="text-[#7A828A] text-sm font-inter">Items sold</p>
          </div>
        </div>
        <div className="bg-[#0D0F12] rounded-xl p-4 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#EFF0FA] font-inter font-medium text-lg">0</p>
            <p className="text-[#7A828A] text-sm font-inter">Shared your stream</p>
          </div>
        </div>
      </div>
    </div>
  );
};

PreStreamDesktopUi.propTypes = {
  viewers: PropTypes.array,
  totalShares: PropTypes.number,
  handleStartStream: PropTypes.func,
  liveStreamDetails: PropTypes.object,
  deviceError: PropTypes.string,
  existingLivestream: PropTypes.object,
  getInitials: PropTypes.func,
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  products: PropTypes.array,
  formatCurrency: PropTypes.func,
  seller: PropTypes.object,
  isReconnecting: PropTypes.bool
};

export default PreStreamDesktopUi;
