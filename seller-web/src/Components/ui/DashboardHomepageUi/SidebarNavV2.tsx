import AuqliLogo from "@/assets/icons/AuqliLogo"
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuthContext } from "../../../Hooks/useAuthContextV2";
import { sideBarNavData, sideBarNavData2, sideBarNavData3, sideBarNavData4 } from "@/Utilities/data";
import ArrowRightIcon from "@/assets/icons/ArrowRightIcon";
import ArrowDownIcon from "@/assets/icons/ArrowDownIcon";

/**
 * SideBarNav Component
 * 
 * Displays the main navigation sidebar with collapsible subnav items.
 * Features:
 * - Collapsible menu items with subnav support
 * - Active state highlighting for parent and child items
 * - Mobile responsive with backdrop overlay
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
    const [isExpanded, setIsExpanded] = useState<string[]>(() => {
        // Initialize with items that have active subnav children
        // This ensures parent items are expanded when the page loads with an active subnav route
        const initialExpanded: string[] = [];
        const mergedSideBarData = [...sideBarNavData, ...sideBarNavData2, ...sideBarNavData3, ...sideBarNavData4];
        mergedSideBarData.forEach((item) => {
            if (item?.subNav && item?.subNav?.length > 0) {
                const hasActiveChild = item.subNav.some(subItem => location.pathname === subItem.path);
                if (hasActiveChild) {
                    initialExpanded.push(item.id);
                }
            }
            return initialExpanded;
        });
        return initialExpanded;
    }
    );

    const isItemActive = (item: IItem) => {
        if (item?.subNav && item?.subNav?.length > 0) {
            const exactParent = location?.pathname === item?.path;
            return exactParent;
        }

        return location?.pathname === item?.path;
    }

    const isSubNavActive = (item: ISubItem) => {
        return location.pathname.includes(item?.path);
    }

    const isFixedSideNavActive = (path: string) => {
        return location?.pathname === path;
    }

    const handleSubNavOpen = (id: string) => {
        setIsExpanded(prev => prev?.includes(id) ? prev?.filter((item: string) => item !== id) : [...prev, id]);
    }

     /**
     * Effect to auto-expand parent items when route changes and a subnav child is active
     * This handles cases where users navigate directly to a subnav URL or click on subnav links
     */
     useEffect(() => {
        const mergedSideBarData = [...sideBarNavData, ...sideBarNavData2, ...sideBarNavData3, ...sideBarNavData4];
        mergedSideBarData?.forEach(item => {
            if (item.subNav && item.subNav.length > 0) {
                const subNavPaths = item?.subNav?.map(subItem => subItem.path);
                const lastPath = location.pathname.split('/').pop();
                const hasActiveChild = subNavPaths.some(path => lastPath === path);
                //console.log('location pathname', location.pathname);
                //console.log('item subnav', item.subNav);
                //console.log('hasActiveChild', hasActiveChild);
                //console.log('subNavPaths', subNavPaths);
                //console.log('lastPath', lastPath);
                if (hasActiveChild) {
                    // Auto-expand parent if it has an active child
                    // Using functional update to avoid adding expandedItems to dependencies
                    setIsExpanded(prev => {
                        if (!prev.includes(item.id)) {
                            return [...prev, item.id];
                        }
                        return prev;
                    });


                }
            }
        });
    }, [location.pathname]); // Re-run when route changes

    return (
        <div className="relative group bg-[#17171B] h-full w-[300px] py-[37px] space-y-[24px] gap-10 " >
            <div className="px-[20px]">
                <AuqliLogo height={33.3} />
            </div>
            <div className="px-[20px]">
                <div className="border-l-[1px] border-l-[#FFFFFF1A] flex flex-col gap-3 overflow-y-auto h-[500px]
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:border-0
                    group-hover:[&::-webkit-scrollbar-thumb]:bg-[#FFFFFF1A]" >
                    <h3 className="font-lexend text-[14px] 3xl:text-base text-white/80 pl-[15px] ">E-COMMERCE</h3>
                    {
                        sideBarNavData.map((item) => {
                            const hasSubNav = item?.subNav && item?.subNav?.length > 0;
                            const isActive = isItemActive(item);
                            const isSubNavExpanded = isExpanded.includes(item.id);

                            return (
                                <>
                                    <div key={item.id} className={`flex items-center justify-between w-[95%] hover:bg-white/10 hover:backdrop-blur-sm  cursor-pointer pl-[15px] pr-[20px] rounded-tr-full rounded-br-full transition-all duration-300 ease-in-out
                                        ${isActive ? 'border-l-[2px] border-l-[#16783A] text-[#16783A] font-semibold hover:text-green-400 hover:bg-[#16783A]/30 ' : 'text-white/60 hover:text-white '} `} >
                                        <NavLink to={item.path} key={item.id} onClick={() => handleSubNavOpen(item.id)} className="flex py-[8px] h-full w-full items-center gap-3">
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
                                                    <Icon icon={isSubNavExpanded ? "iconamoon:arrow-down-2-light" : "iconamoon:arrow-right-2-light"} onClick={() => handleSubNavOpen(item.id)} className="hover:bg-white/10 hover:backdrop-blur-sm rounded-full p-[1px] transition-all duration-300 ease-in-out" width={18} height={18} />
                                                )
                                            )
                                        }
                                    </div>
                                    {
                                        hasSubNav && isSubNavExpanded && (
                                            <div className="border-l-[1px] border-l-[#FFFFFF1A] flex flex-col gap-2 ml-[22px]" >
                                                {
                                                    item?.subNav?.map((subNavItem) => {
                                                        const isActive = isSubNavActive(subNavItem);

                                                        return (
                                                            <div key={subNavItem.id} className={`flex items-center justify-between w-[92%] hover:bg-white/10 hover:backdrop-blur-sm  cursor-pointer rounded-tr-full rounded-br-full transition-all duration-300 ease-in-out
                                                                ${isActive ? 'border-l-[2px] border-l-[#16783A] text-[#16783A] font-semibold hover:text-green-400 hover:bg-[#16783A]/30 ' : 'text-white/60 hover:text-white '}  h-full w-full items-center gap-3 pl-[22px] pr-[20px] `} >
                                                                <NavLink to={subNavItem.path} key={subNavItem.id} className="flex py-[8px] h-full w-full">
                                                                    <span className="font-lexend text-[14px] 3xl:text-base ">{subNavItem.name}</span>
                                                                </NavLink>
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </div>
                                        )
                                    }
                                </>
                            )
                        })
                    }

                    <div className="px-4" >
                        <div className="bg-[#FFFFFF1A] h-[0.1px] w-full " />
                    </div>

                    <h3 className="font-lexend text-[14px] 3xl:text-base text-white/80 pl-[15px] ">FINANCE & ANALYTICS</h3>
                    <div className="flex flex-col gap-3 my-[12px] " >
                        {

                            sideBarNavData2.map((item) => {
                                //const hasSubNav = item?.subNav && item?.subNav?.length > 0;
                                const isActive = isItemActive(item);

                                //console.log('nav data 2 id', item.id);

                                return (
                                    <div key={item.id} className={`flex items-center justify-between w-[95%] hover:bg-white/10 hover:backdrop-blur-sm cursor-pointer pl-[15px] pr-[20px] rounded-tr-full rounded-br-full transition-all duration-300 ease-in-out
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

                    <h3 className="font-lexend text-[14px] 3xl:text-base text-white/80 pl-[15px] ">SOCIALS</h3>
                    {
                        sideBarNavData3.map((item) => {
                            //const hasSubNav = item?.subNav && item?.subNav?.length > 0;
                            const isActive = isItemActive(item);

                            //console.log('nav data 3 id', item.id);

                            return (
                                <div key={item.id} className={`flex items-center justify-between w-[95%] hover:bg-white/10 hover:backdrop-blur-sm  cursor-pointer pl-[15px] pr-[20px] rounded-tr-full rounded-br-full transition-all duration-300 ease-in-out
                                    ${isActive ? 'border-l-[2px] border-l-[#16783A] text-[#16783A] font-semibold hover:text-green-400 hover:bg-[#16783A]/30 ' : 'text-white/60 hover:text-white '} `} >
                                    <NavLink to={item.path} key={item.id} className="flex py-[8px] h-full w-full items-center gap-3">
                                        <Icon icon={item.icon} width={18} height={18} />
                                        <span className="font-lexend text-[14px] 3xl:text-base ">{item.name}</span>
                                    </NavLink>
                                    {
                                        item?.hasMessageCount ? (
                                            <div className="bg-[#FFE6E4] w-[27px] h-[19px] px-[10px] rounded-full flex items-center justify-center text-[#F16063] text-[12px] font-bold " >
                                                23
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
            <div className="pl-[10px] pr-[20px]">
                <div className="bg-[#17171B] flex flex-col gap-2 overflow-y-auto h-[150px] [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:border-0
                    group-hover:[&::-webkit-scrollbar-thumb]:bg-[#FFFFFF1A] " >
                    {
                        sideBarNavData4.map((item) => {
                            const hasSubNav = item?.subNav && item?.subNav?.length > 0;
                            const isActive = isItemActive(item);
                            const isSubNavExpanded = isExpanded.includes(item.id);

                            return (
                                <>
                                    <div key={item.id} className={`flex items-center w-[95%] pl-[5px] ${isSubNavExpanded ? 'pr-[19px]' : 'pr-[25px]'} justify-between hover:bg-white/10 hover:backdrop-blur-sm  cursor-pointer py-[2px] rounded-tr-full rounded-br-full transition-all duration-300 ease-in-out
                                        ${isActive ? 'border-l-[2px] border-l-[#16783A] text-[#16783A] font-semibold hover:text-green-400 hover:bg-[#16783A]/30 ' : 'text-white/60 hover:text-white '} `} >
                                        <NavLink to={item.path} className="flex py-[8px] h-full w-full items-center gap-3" >
                                            <Icon icon={item.icon} width={18} height={18} />
                                            <span className="font-lexend text-[14px] 3xl:text-base ">{item.name}</span>
                                        </NavLink>
                                        {
                                            item?.subNav && item?.subNav?.length > 0 && (
                                                <Icon icon={isSubNavExpanded ? "iconamoon:arrow-down-2-light" : "iconamoon:arrow-right-2-light"} onClick={() => handleSubNavOpen(item.id)} className="hover:bg-white/10 hover:backdrop-blur-sm rounded-full p-[1px] transition-all duration-300 ease-in-out" width={18} height={18} />
                                            )
                                        }
                                    </div>
                                    {
                                        hasSubNav && isSubNavExpanded && (
                                            <div className="border-l-[1px] border-l-[#FFFFFF1A] flex flex-col gap-2 ml-[10px]" >
                                                {
                                                    item?.subNav?.map((subNavItem) => {
                                                        const isActive = isSubNavActive(subNavItem);

                                                        return (
                                                            <div key={subNavItem.id} className={`flex items-center justify-between w-[92%] hover:bg-white/10 hover:backdrop-blur-sm  cursor-pointer rounded-tr-full rounded-br-full transition-all duration-300 ease-in-out
                                                            ${isActive ? 'border-l-[2px] border-l-[#16783A] text-[#16783A] font-semibold hover:text-green-400 hover:bg-[#16783A]/30 ' : 'text-white/60 hover:text-white '}  h-full w-full items-center gap-3 pl-[22px] pr-[20px] `} >
                                                                <NavLink to={subNavItem.path} key={subNavItem.id} className="flex py-[8px] h-full w-full">
                                                                    <span className="font-lexend text-[14px] 3xl:text-base ">{subNavItem.name}</span>
                                                                </NavLink>
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </div>
                                        )
                                    }
                                </>
                            )
                        })
                    }
                    <div className="flex items-center w-[95%] px-[5px] justify-between hover:bg-white/10 hover:backdrop-blur-sm text-white/60 hover:text-white cursor-pointer py-[2px] rounded-tr-full rounded-br-full transition-all duration-300 ease-in-out" >
                        <NavLink to="/dashboard/shop-manager" className="flex py-[8px] h-full w-full items-center gap-3" >
                            <Icon icon="ix:support" width={18} height={18} />
                            <span className="font-lexend text-[14px] 3xl:text-base ">Help & Support</span>
                        </NavLink>
                    </div>
                    <div className="flex items-center w-[95%] px-[5px] justify-between hover:bg-white/10 hover:backdrop-blur-sm text-white/60 hover:text-white cursor-pointer py-[2px] rounded-tr-full rounded-br-full transition-all duration-300 ease-in-out" >
                        <NavLink to="/dashboard/shop-manager" className="flex py-[8px] h-full w-full items-center gap-3" >
                            <Icon icon="solar:logout-2-outline" width={18} height={18} />
                            <span className="font-lexend text-[14px] 3xl:text-base ">Log Out</span>
                        </NavLink>
                    </div>
                </div>
            </div>
        </div>
    )
}