import { Icon } from "@iconify/react"
import { BASE_URL } from "@/Constants/Server"
import { useQuery } from "@tanstack/react-query"
import { useDevice } from "@/Contexts/DeviceContext"
import { getInitials } from "@/util/helpers"
import { HeaderV2Props } from '@/types';
import { useNavigate, useLocation } from "react-router-dom"
import { sellerService } from "@/services/sellerService"
import { useAuthContext } from "@/Hooks/useAuthContextV2"
import { useEffect, useState } from "react"
import { Dialog, DialogTrigger } from "@/Components/ui/dialog"
import PropTypes from "prop-types"
import NotificationsDialog from "@/Components/NotificationsDialog";
import GoLiveIcon from "@/assets/icons/GoLiveIcon"
import MenuOpenIcon from "@/assets/icons/MenuOpenIcon"
import MessageIcon from "@/assets/icons/MessageIcon"
import AlertIcon from "@/assets/icons/AlertIcon"

import NavRightIcon from "@/assets/icons/NavRightIcon";

export default function HeaderV2({ name, navName, showBackButton, fullScreenMode, isSidebarOpen, setIsSidebarOpen }: HeaderV2Props) {
    const { token, seller } = useAuthContext()
    const [unreadMessages, setUnreadMessages] = useState(0)
    const navigate = useNavigate()
    const [notificationDialogOpen, setNotificationDialogOpen] = useState(false)
    const location = useLocation();
    const { isDesktop } = useDevice()

    const renderAvatar = () => {
        if (seller?.storeAvatar?.url) {
            return (
                <img
                    src={seller.storeAvatar.url}
                    alt={`${seller.firstName} ${seller.lastName}`}
                    className="h-[46px] w-[46px] rounded-full object-cover"
                />
            )
        }

        return (
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                {getInitials(seller?.firstName, seller?.lastName)}
            </div>
        )
    }


    return (
        <header className={`${fullScreenMode ? 'hidden' : 'absolute top-0 left-0 right-0 z-20'}`} >
            <div className="">
                <div className="flex items-center justify-between h-16 bg-white border-b border-[#EDF2F7] pt-[50px] pb-[36px] lg:pt-[50px] lg:pb-[40px] px-5 xl:px-8">
                    {/**Welcome Message and Back Button ui*/}
                    <div className="flex items-center">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="rounded-md  text-gray-400 xl:hidden transition-all duration-300 ease-in-out"
                            >
                                <MenuOpenIcon className="h-[24px] w-[24px]" color="#8492A6" />
                            </button>
                        )}
                        {
                            location?.pathname === "/dashboard/home" ? (
                                <div className="hidden lg:flex flex-col ">
                                    <div className="flex gap-2 items-center">
                                        {showBackButton && (
                                            <button onClick={() => navigate(-1)} className="p-2 rounded-full xl:block hidden text-[#272D30] hover:text-[#272D30]/80 transition-all duration-300 ease-in-out hover:bg-[#272D30]/10">
                                                <Icon icon="ep:back" className="h-6 w-6" />
                                            </button>
                                        )}
                                        <h1 className="ml-2 lg:ml-0 text-base md:text-xl xl:text-3xl font-lexend font-semibold text-[#111111] truncate max-w-[150px] md:max-w-full">{name}</h1>
                                    </div>
                                    {navName !== "" && (
                                        <div className="flex items-center gap-10">
                                            <h1 className="ml-2 lg:ml-0 capitalize text-base font-lexend font-normal text-[#98A2B3] truncate max-w-[100px] md:max-w-full">{navName}</h1>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="hidden lg:flex flex-col xl:flex-row xl:gap-10 xl:items-center">
                                    <div className="flex gap-2 items-center">
                                        {showBackButton && (
                                            <button onClick={() => navigate(-1)} className="p-2 rounded-full xl:block hidden text-[#272D30] hover:text-[#272D30]/80 transition-all duration-300 ease-in-out hover:bg-[#272D30]/10">
                                                <Icon icon="ep:back" className="h-6 w-6" />
                                            </button>
                                        )}
                                        <h1 className="ml-2 lg:ml-0 text-base md:text-xl xl:text-3xl font-lexend font-semibold text-[#111111] truncate max-w-[150px] md:max-w-full">{name}</h1>
                                    </div>
                                    {navName !== "" && (
                                        <div className="flex items-center gap-10">
                                            <span className="text-2xl hidden xl:block font-inter text-[#888787]">•</span>
                                            <h1 className="ml-2 lg:ml-0 capitalize text-base md:text-lg xl:text-xl font-inter font-semibold text-[#16783A] truncate max-w-[100px] md:max-w-full">{navName}</h1>
                                        </div>
                                    )}
                                </div>
                            )
                        }
                    </div>

                    {/**Mobile header items*/}
                    <nav className="flex items-center gap-1 md:hidden" >
                        <button
                            onClick={() => navigate('/dashboard/live-streams/live-stream')}
                            className="flex items-center justify-center rounded-full bg-[#FF3B3033] w-[46px] h-[46px] text-white hover:bg-[#FF3B3033]/30 transition-all duration-300 ease-in-out"
                        >
                            <GoLiveIcon className="h-[32px] w-[32px] animate-pulse" color="#FF3B30" />
                        </button>
                        <button
                            className="relative flex items-center justify-center h-[46px] w-[46px] rounded-full text-[#757575] bg-[#F6F6F6] hover:bg-gray-200 transition-all duration-300 ease-in-out"
                        >
                            <MessageIcon className="h-[20px] w-[20px]" color="#757575" />
                            {unreadMessages > 0 && (
                                <span className="absolute -top-[20px] -right-0 bg-[#0BB2481A] text-[#0BB248] text-xs font-lexend font-bold px-[10px] py-[2px] w-[35px] h-[19px] flex items-center justify-center rounded-full">
                                    {unreadMessages}
                                </span>
                            )}
                        </button>
                        <button
                            className="relative flex items-center justify-center h-[46px] w-[46px] rounded-full text-[#757575] bg-[#F6F6F6] hover:bg-gray-200 transition-all duration-300 ease-in-out"
                        >
                            <AlertIcon className="h-[20px] w-[20px]" color="#757575" />
                            {unreadMessages > 0 && (
                                <span className="absolute -top-[20px] -right-0 bg-[#FF00001A] text-[#FF0000] text-xs font-lexend font-bold px-[10px] py-[2px] w-[35px] h-[19px] flex items-center justify-center rounded-full text-xs">
                                    {unreadMessages}
                                </span>
                            )}
                        </button>

                        <div
                            onClick={() => navigate('/dashboard/account')}
                            className="ml-1 cursor-pointer hover:opacity-80 transition-all duration-300"
                        >
                            {renderAvatar()}
                        </div>
                    </nav>

                    {/**Desktop header Items*/}
                    <nav className="hidden md:flex md:items-center md:gap-2">
                        <div
                            onClick={() => navigate('/dashboard/live-streams/live-stream')}
                            className="items-center hidden lg:flex h-[40px] w-[128px] py-[4px] px-[8px] gap-2 mr-2 rounded-[8px] bg-[#FF3B30] cursor-pointer hover:bg-[#FF3B30]/80 transition-all duration-300 ease-in-out"
                        >
                            <GoLiveIcon className="h-[32px] w-[32px] animate-pulse" color="#ffffff" />
                            <span className="inline-flex items-center font-lexend border border-transparent text-sm font-medium text-[#ffffff]">
                                Go Live
                            </span>
                        </div>
                        <button
                            className="relative bg-[#F6F6F6] h-[46px] w-[46px] rounded-full flex items-center justify-center p-2 text-[#757575] hover:text-gray-700 hover:bg-gray-200 transition-all duration-300 ease-in-out"
                        >
                            <Icon icon="icon-park-outline:message" className="h-6 w-6" />
                            {unreadMessages <= 0 && (
                                <span className="absolute -top-[20px] -right-0 bg-[#0BB2481A] text-[#0BB248] text-xs font-lexend font-bold px-[10px] py-[2px] w-[35px] h-[19px] flex items-center justify-center rounded-full">
                                    {unreadMessages}
                                </span>
                            )}
                        </button>
                        <button className="relative bg-[#F6F6F6] h-[46px] w-[46px] rounded-full flex items-center justify-center p-2 mr-3 text-[#757575] hover:text-gray-700 hover:bg-gray-200 transition-all duration-300 ease-in-out">
                            <AlertIcon className="h-[24px] w-[24px]" color="#757575" />
                            {unreadMessages <= 0 && (
                                <span className="absolute -top-[20px] -right-0 bg-[#FF00001A] text-[#FF0000] text-xs font-lexend font-bold px-[10px] py-[2px] w-[35px] h-[19px] flex items-center justify-center rounded-full text-xs">
                                    {unreadMessages}
                                </span>
                            )}
                        </button>
                        <div
                            onClick={() => navigate('/dashboard/account')}
                            className="flex items-center cursor-pointer hover:opacity-80 transition-all duration-300 hover:bg-[#F6F6F6] p-3 hover:rounded-full "
                        >
                            <div className="flex-shrink-0">
                                {renderAvatar()}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-semibold font-inter capitalize text-[#16192C]">
                                    {seller?.firstName} {seller?.lastName}
                                </p>
                                {seller?.storeName && (
                                    <p className="text-xs text-gray-500">
                                        {seller?.storeName || seller?.businessName}
                                    </p>
                                )}
                            </div>
                        </div>
                    </nav>
                </div>
                {
                    location?.pathname !== "/dashboard/home" && (
                        <div className="px-5 lg:hidden flex items-center gap-[4px] " >
                            <h3 className="font-lexend font-normal text-sm text-[#888888] " >{name}</h3>
                            {
                                navName !== "" && (
                                    <>
                                        <NavRightIcon className="h-4 w-4" color="#888888" />
                                        <h3 className="font-lexend font-bold text-sm text-[#0BB248] " >{navName}</h3>
                                    </>
                                )
                            }
                        </div>
                    )
                }
            </div>
        </header>
    )
}
