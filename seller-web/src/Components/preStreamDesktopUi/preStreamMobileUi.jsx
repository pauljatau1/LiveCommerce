import { useState } from 'react';
import PropTypes from 'prop-types';
import { MdClose, MdVideocam, MdVideocamOff, MdMic, MdMicOff, MdFlipCameraIos, MdCheck, MdAdd } from 'react-icons/md';
import { IoChevronDown } from 'react-icons/io5';
import { FiUsers } from 'react-icons/fi';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Icon } from '@iconify/react';

const PreStreamMobileUi = ({
    handleStartStream,
    deviceError,
    existingLivestream,
    getInitials,
    firstName,
    lastName,
    products,
    formatCurrency,
    viewers = [],
    liveStreamDetails,
    isReconnecting,
    onOpenVideoSettings
}) => {
    const [activeTab, setActiveTab] = useState('settings');
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [micEnabled, setMicEnabled] = useState(true);
    const [videoQuality, setVideoQuality] = useState('High (1080p)');
    const [audioQuality, setAudioQuality] = useState('High');

    // Quality options
    const videoOptions = ['Low (480p)', 'Medium (720p)', 'High (1080p)'];
    const audioOptions = ['Low', 'Medium', 'High'];

    return (
        <div className="block xl:hidden h-[100dvh] w-full relative bg-black overflow-hidden">
            {/* Header area */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-md font-medium">
                        NOT LIVE
                    </div>
                    <div className="bg-black/40 backdrop-blur-sm text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        <FiUsers className="mr-1" size={12} />
                        {viewers.length || 0}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="bg-black/40 backdrop-blur-sm text-white rounded-md w-8 h-8 flex items-center justify-center"
                        onClick={() => setCameraEnabled(!cameraEnabled)}
                    >
                        {cameraEnabled ? <MdVideocam size={20} /> : <MdVideocamOff size={20} />}
                    </button>
                    <button
                        className="bg-black/40 backdrop-blur-sm text-white rounded-md w-8 h-8 flex items-center justify-center"
                        onClick={() => setMicEnabled(!micEnabled)}
                    >
                        {micEnabled ? <MdMic size={20} /> : <MdMicOff size={20} />}
                    </button>
                    <button className="bg-black/40 backdrop-blur-sm text-white rounded-md w-8 h-8 flex items-center justify-center">
                        <MdClose size={20} />
                    </button>
                </div>
            </div>

            {/* Stream Panel / Tabs section */}
            <div className="absolute top-16 left-0 right-0 p-4 z-10">
                {/* Tab navigation */}
                <div className="flex justify-between border-b border-gray-700">
                    <button
                        className={`py-2 px-4 text-sm font-medium relative ${activeTab === 'settings' ? 'text-green-500' : 'text-gray-400'}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        Settings
                        {activeTab === 'settings' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"></div>
                        )}
                    </button>
                    <button
                        className={`py-2 px-4 text-sm font-medium relative ${activeTab === 'products' ? 'text-green-500' : 'text-gray-400'}`}
                        onClick={() => setActiveTab('products')}
                    >
                        Products
                        {activeTab === 'products' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"></div>
                        )}
                    </button>
                </div>

                {/* Tab content */}
                <div className="mt-4 max-h-[60dvh] overflow-y-auto scroll-smooth pb-40">
                    {activeTab === 'settings' && (
                        <div className="space-y-3">
                            <div className="bg-[#1A1D24] rounded-md p-3">
                                <p className="text-sm capitalize text-gray-300">Title: {liveStreamDetails?.title}</p>
                            </div>
                            {/* Add settings button */}
                            <button
                                onClick={onOpenVideoSettings}
                                className="flex items-center gap-2 bg-[#1A1D24] rounded-md p-3 w-full transition-all duration-300"
                            >
                                <Icon icon="solar:settings-linear" className="w-5 h-5" color="#EFF0FA" />
                                <span className="text-[#EFF0FA] font-inter text-sm">Video Settings</span>
                            </button>
                            <div className="bg-[#1A1D24] rounded-md p-3">
                                <p className="text-sm text-gray-300">FAQ&apos;s</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <div className={`space-y-3 ${products && products.length > 0 ? '' : 'relative h-[500px]'}`}>
                            {products && products.length > 0 ? (
                                products.map((item, index) => (
                                    <div key={item?.product?._id || index} className="bg-[#1A1D24] rounded-md p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-700 rounded-md overflow-hidden">
                                                {item?.product?.images?.[0]?.url ? (
                                                    <img
                                                        src={item.product.images[0].url}
                                                        alt={item.product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-gray-400 text-xs">No img</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm text-white truncate max-w-[150px] font-medium">{item?.product?.name}</p>
                                                <p className="text-xs text-gray-400">
                                                    {item?.product?.size && `Size: ${item.product.size}`}
                                                </p>
                                                {item?.product?.price && (
                                                    <p className="text-xs text-green-500 font-medium">
                                                        {formatCurrency ? formatCurrency(item.product.price) : `₦${item.product.price}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // No Products Available UI
                                <div className="flex flex-col items-center justify-center py-8 text-center absolute top-0 left-0 right-0 bottom-0">
                                    <div className="w-16 h-16 bg-[#1A1D24] rounded-full flex items-center justify-center mb-4">
                                        <MdAdd className="text-gray-400" size={24} />
                                    </div>
                                    <p className="text-gray-300 text-sm mb-4">No products added yet</p>
                                    <button className="bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium">
                                        Upload Product
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Bottom Sheet (Fixed overlay) */}
            <div className={`absolute bottom-0 left-0 right-0 bg-black border-t border-gray-800 rounded-t-2xl shadow-2xl z-20 }`}>
                <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto my-2"></div>


                <div className="px-4 pb-6 pt-2">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                            <Icon icon="proicons:record" className="text-red-500" size={20} />
                            <p className="text-sm text-gray-300">
                                Start Stream
                            </p>
                        </div>
                        {/* Camera flip button positioned on the bottom-right corner of Start Stream section */}
                        <button className=" bg-black/60 border border-gray-600 p-2 rounded-lg">
                            <MdFlipCameraIos size={20} />
                        </button>
                    </div>

                    <p className="text-xs text-gray-400 mb-4">
                        Begin your stream when you are done with the settings.
                    </p>

                    {deviceError ? (
                        <div className="text-red-500 mb-3 text-center w-full">
                            <p className="text-sm text-left ">{deviceError}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-2 bg-red-600 text-white w-full py-3 rounded-lg"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <button
                                disabled={isReconnecting}
                                onClick={existingLivestream ? () => handleStartStream() : handleStartStream}
                                className={`w-full ${isReconnecting ? 'bg-gray-600' : 'bg-white'} text-black font-medium py-3 rounded-lg`}
                            >
                                {existingLivestream ? isReconnecting ? 'Reconnecting...' : 'Reconnect Stream' : 'Go Live'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

PreStreamMobileUi.propTypes = {
    handleStartStream: PropTypes.func,
    deviceError: PropTypes.string,
    existingLivestream: PropTypes.object,
    getInitials: PropTypes.func,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    products: PropTypes.array,
    formatCurrency: PropTypes.func,
    viewers: PropTypes.array,
    isToolsSidebarOpen: PropTypes.bool,
    setIsToolsSidebarOpen: PropTypes.func,
    totalShares: PropTypes.number,
    liveStreamDetails: PropTypes.object,
    isReconnecting: PropTypes.bool,
    onOpenVideoSettings: PropTypes.func
};

export default PreStreamMobileUi;
