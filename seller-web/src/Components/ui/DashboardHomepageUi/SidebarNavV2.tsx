import AuqliLogo from "@/assets/icons/AuqliLogo"
import { useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuthContext } from "../../../Hooks/useAuthContextV2";
import { sideBarNavData, sideBarNavData2, sideBarNavData3 } from "@/Utilities/data";
import ArrowRightIcon from "@/assets/icons/ArrowRightIcon";
import ArrowDownIcon from "@/assets/icons/ArrowDownIcon";

/**
 * SideBarNav Component
 * 
 * Displays the main navigation sidebar with collapsible subnav items.
 */

interface ISubItem {
    id: string;
    name: string;
    path: string;
}

interface IItem {
    id: string;
    name: string;
    path: string;
    icon: string;
    subNav?: ISubItem[];
    hasMessageCount: boolean;
}

export default function SidebarNav({ isSidebarOpen, setIsSidebarOpen, hideSidebar }: { isSidebarOpen: boolean, setIsSidebarOpen: (isSidebarOpen: boolean) => void, hideSidebar: () => void }) {
    const location = useLocation();

    const isItemActive = (item: IItem) => {
        if (item?.subNav && item?.subNav?.length > 0) {
            const exactParent = location?.pathname === item?.path;
            const isKnownSubNav = item?.subNav?.some((subNavItem: ISubItem) => location?.pathname === subNavItem?.path);

            return exactParent || isKnownSubNav;
        }

        return location?.pathname === item?.path;
    }

    return (
        <div className="bg-[#17171B] w-[300px] pl-[20px] pr-[20px] py-[37px] space-y-[24px] gap-10 " >
            <AuqliLogo height={33.3} />
            <div>
                <div className="border-l-[1px] border-l-[#FFFFFF1A] flex flex-col gap-4 overflow-y-auto h-[calc(100vh-100px)]
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-[#FFFFFF1A]
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:border-0
                  [&::-webkit-scrollbar-thumb:hover]:bg-[#FFFFFF2A]
                    [scrollbar-width:thin]
                    [scrollbar-color:#FFFFFF2A_transparent]" >
                    {
                        sideBarNavData.map((item) => {
                            const hasSubNav = item?.subNav && item?.subNav?.length > 0;
                            const isActive = isItemActive(item);

                            return (
                                <div className={`flex items-center justify-between hover:bg-white/10 hover:backdrop-blur-sm  cursor-pointer pl-[15px] pr-[20px] rounded-tr-full rounded-br-full transition-all duration-300 ease-in-out
                                ${isActive ? 'border-l-[2px] border-l-[#16783A] text-[#16783A] font-semibold hover:text-green-400 hover:bg-[#16783A]/30 ' : 'text-white/60 hover:text-white '} `} >
                                    <NavLink to={item.path} key={item.id} className="flex py-[8px] h-full w-full items-center gap-3">
                                        <Icon icon={item.icon} width={18} height={18} />
                                        <span className="font-lexend text-[14px] 3xl:text-base ">{item.name}</span>
                                    </NavLink>
                                    {
                                        item?.hasMessageCount ? (
                                            <div className="bg-[#EEFFF4] w-[27px] h-[19px] px-[10px] rounded-full flex items-center justify-center text-[#0BB248] text-[12px] font-bold " >
                                                3
                                            </div>
                                        ) : (
                                            item?.subNav && item?.subNav?.length > 0 && (
                                                <Icon icon="iconoir:nav-arrow-right" className="hover:bg-white/10 hover:backdrop-blur-sm rounded-full p-[1px] transition-all duration-300 ease-in-out" width={18} height={18} />
                                            )
                                        )
                                    }
                                </div>
                            )
                        })
                    }

                    <div className="px-4" >
                        <div className="bg-[#FFFFFF1A] h-[0.1px] w-full " />
                    </div>

                    <div className="flex flex-col gap-3 my-[12px] " >
                    {

                        sideBarNavData2.map((item) => {
                            const hasSubNav = item?.subNav && item?.subNav?.length > 0;
                            const isActive = isItemActive(item);

                            return (
                                <div className={`flex items-center justify-between hover:bg-white/10 hover:backdrop-blur-sm  cursor-pointer pl-[15px] pr-[20px] rounded-tr-full rounded-br-full transition-all duration-300 ease-in-out
                                    ${isActive ? 'border-l-[2px] border-l-[#16783A] text-[#16783A] font-semibold hover:text-green-400 hover:bg-[#16783A]/30 ' : 'text-white/60 hover:text-white '} `} >
                                    <NavLink to={item.path} key={item.id} className="flex py-[8px] h-full w-full items-center gap-3">
                                        <Icon icon={item.icon} width={18} height={18} />
                                        <span className="font-lexend text-[14px] 3xl:text-base ">{item.name}</span>
                                    </NavLink>
                                    {
                                        item?.hasMessageCount ? (
                                            <div className="bg-[#EEFFF4] w-[27px] h-[19px] px-[10px] rounded-full flex items-center justify-center text-[#0BB248] text-[12px] font-bold " >
                                                3
                                            </div>
                                        ) : (
                                            item?.subNav && item?.subNav?.length > 0 && (
                                                <Icon icon="iconoir:nav-arrow-right" className="hover:bg-white/10 hover:backdrop-blur-sm rounded-full p-[1px] transition-all duration-300 ease-in-out" width={18} height={18} />
                                            )
                                        )
                                    }
                                </div>
                            )
                        })
                    }
                        </div>

                    <div className="px-4" >
                        <div className="bg-[#FFFFFF1A] h-[0.1px] w-full " />
                    </div>

                    {
                        sideBarNavData3.map((item) => {
                            const hasSubNav = item?.subNav && item?.subNav?.length > 0;
                            const isActive = isItemActive(item);

                            return (
                                <div className={`flex items-center justify-between hover:bg-white/10 hover:backdrop-blur-sm  cursor-pointer pl-[15px] pr-[20px] rounded-tr-full rounded-br-full transition-all duration-300 ease-in-out
                                ${isActive ? 'border-l-[2px] border-l-[#16783A] text-[#16783A] font-semibold hover:text-green-400 hover:bg-[#16783A]/30 ' : 'text-white/60 hover:text-white '} `} >
                                    <NavLink to={item.path} key={item.id} className="flex py-[8px] h-full w-full items-center gap-3">
                                        <Icon icon={item.icon} width={18} height={18} />
                                        <span className="font-lexend text-[14px] 3xl:text-base ">{item.name}</span>
                                    </NavLink>
                                    {
                                        item?.hasMessageCount ? (
                                            <div className="bg-[#EEFFF4] w-[27px] h-[19px] px-[10px] rounded-full flex items-center justify-center text-[#0BB248] text-[12px] font-bold " >
                                                3
                                            </div>
                                        ) : (
                                            item?.subNav && item?.subNav?.length > 0 && (
                                                <Icon icon="iconoir:nav-arrow-right" className="hover:bg-white/10 hover:backdrop-blur-sm rounded-full p-[1px] transition-all duration-300 ease-in-out" width={18} height={18} />
                                            )
                                        )
                                    }
                                </div>
                            )
                        })
                    }


                </div>
            </div>
        </div>
    )
}