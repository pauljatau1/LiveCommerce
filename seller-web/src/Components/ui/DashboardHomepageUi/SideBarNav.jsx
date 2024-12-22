import { sideBarNavData } from "../../../Utilities/data";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "@iconify/react";
import Logo from '../../../assets/auqli-official-logo.png'


const SideBarNav = ({ isSidebarOpen, setIsSidebarOpen }) => {

  return (
    <>
      <div className="min-h-full w-[257px] xl:w-[307px] bg-[#05031F] z-10 flex-col items-center justify-center pt-11 hidden md:flex">
        <div className="h-full w-full overflow-y-scroll  [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] py-8">
          <div className="pb-3">
            <img src={Logo} alt="Logo" className="w-[162px] h-[44.03px] mx-auto" />
          </div>
          <div className="h-full w-full py-8">
            <div className="flex flex-col gap-4">
              {sideBarNavData.map((item) => (
                <NavLink
                  to={item.path}
                  key={item.id}
                  className="flex items-center gap-2 p-2 px-9 py-4 
                [&.active]:bg-[#0BB248] 
                transition-all duration-300 ease-in-out
                hover:bg-white/10 hover:backdrop-blur-sm
                active:bg-white/20 active:scale-[0.98] active:backdrop-blur-md"
                >
                  <Icon icon={item.icon} width={24} height={24} color="#ffffff" />
                  <span className="text-white text-sm">{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
          <div className="mt-auto lg:mt-60 border-t border-white/10 bg-[#05031F]">
            <div className="flex flex-col gap-4 p-4">
              <NavLink className="flex items-center gap-2 px-5 py-2 text-white text-sm hover:bg-white/10 rounded-md">
                Auqli University
              </NavLink>
              <NavLink className="flex items-center gap-2 px-5 py-2 text-white text-sm hover:bg-white/10 rounded-md">
                Help & Support
              </NavLink>
              <NavLink className="flex items-center gap-2 px-5 py-2 text-white text-sm hover:bg-white/10 rounded-md">
                Settings
              </NavLink>
              <button
                className="flex items-center gap-2 px-5 py-2 text-white text-sm hover:bg-white/10 rounded-md text-left"
                onClick={() => {/* handle logout */ }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
      {
        isSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />

            {/* Sidebar */}
            <div className="fixed top-0 left-0 h-full w-[257px] bg-[#05031F] flex flex-col">
              {/* Close Button */}
              <Icon
                icon="line-md:menu-to-close-transition"
                width="24"
                height="24"
                color="#ffffff"
                className="absolute top-4 right-4 cursor-pointer"
                onClick={() => setIsSidebarOpen(false)}
              />

              {/* Logo Section */}
              <div className="pt-11 pb-3">
                <img src={Logo} alt="Logo" className="w-[162px] h-[44.03px] mt-10 mx-auto" />
              </div>

              {/* Navigation Section - Scrollable */}
              <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                <div className="flex flex-col gap-4 py-4">
                  {sideBarNavData.map((item) => (
                    <NavLink
                      to={item.path}
                      key={item.id}
                      onClick={() => setIsSidebarOpen(false)}
                      className="flex items-center gap-2 p-2 px-9 py-4 
                        [&.active]:bg-[#0BB248] 
                        transition-all duration-300 ease-in-out
                        hover:bg-white/10 hover:backdrop-blur-sm
                        active:bg-white/20 active:scale-[0.98] active:backdrop-blur-md"
                    >
                      <Icon icon={item.icon} width={24} height={24} color="#ffffff" />
                      <span className="text-white text-sm">{item.name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Bottom Section */}
              <div className="mt-auto border-t border-white/10 ">
                <div className="flex flex-col gap-4 p-4">
                  <NavLink className="flex items-center gap-2 px-5 py-2 text-white text-sm hover:bg-white/10 rounded-md">
                    Auqli University
                  </NavLink>
                  <NavLink className="flex items-center gap-2 px-5 py-2 text-white text-sm hover:bg-white/10 rounded-md">
                    Help & Support
                  </NavLink>
                  <NavLink className="flex items-center gap-2 px-5 py-2 text-white text-sm hover:bg-white/10 rounded-md">
                    Settings
                  </NavLink>
                  <button
                    className="flex items-center gap-2 px-5 py-2 text-white text-sm hover:bg-white/10 rounded-md text-left"
                    onClick={() => {/* handle logout */ }}
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

    </>
  )
}

export default SideBarNav
