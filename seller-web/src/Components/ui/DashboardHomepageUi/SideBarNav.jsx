import { sideBarNavData } from "../../../Utilities/data";
import { useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuthContext } from "../../../Hooks/useAuthContext";
import Logo from '../../../assets/auqli-official-logo.png'
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from 'prop-types';
import { MdClose } from 'react-icons/md';


const SideBarNav = ({ isSidebarOpen, setIsSidebarOpen, hideSidebar }) => {
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const activeSideBarRef = useRef(null);
  const location = useLocation();



  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleSubNavOpen = (id) => {
    if (activeSideBarRef.current === id) {
      activeSideBarRef.current = null;
    } else {
      activeSideBarRef.current = id;
    }
  };


  console.log(activeSideBarRef.current);
  console.log(sideBarNavData);



  return (
    <>
      {/* Desktop Sidebar */}
      {
        !hideSidebar && (
          <div className="min-h-screen w-[257px] xl:w-[307px] relative bg-[#17171B] z-10 flex-col items-start justify-between hidden md:flex">
            {/* Logo Section - Fixed at top */}
            <div className="sticky top-0 w-full z-10 pt-11 pb-3 bg-[#17171B]">
              <img src={Logo} alt="Logo" className="w-[162px] h-[44.03px] mx-auto" />
            </div>

            {/* Main Navigation - Scrollable */}
            <div className="flex-1 w-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] py-8">
              <div className="flex flex-col gap-4">
                {sideBarNavData.map((item) => (
                  <div key={item.id}>
                    <NavLink
                      to={item.path}
                      key={item.id}
                      onClick={() => {
                        setIsSidebarOpen(false);
                        handleSubNavOpen(item.id);
                      }}
                      className={`
                        flex items-center justify-between p-2 px-9 py-4 
                        ${location.pathname === item.path ? 'bg-[#FFFFFF] text-[#0BB248] hover:bg-[#ffffff]' : 'text-white hover:bg-white/10 hover:backdrop-blur-sm'}
                        transition-all duration-300 ease-in-out
                       
                        active:bg-white/20 active:scale-[0.98] active:backdrop-blur-md
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          icon={item.icon}
                          className={
                            location.pathname === item.path ? 'text-[#0BB248] w-[20px] h-[20px]' : 'text-white w-[20px] h-[20px]'
                          }
                        />
                        <span className="text-sm font-inter ">{item.name}</span>
                      </div>
                      {
                        item?.subNav?.length > 0 && (
                          <>
                            {
                              activeSideBarRef.current === item.id ? (
                                <Icon icon="iconamoon:arrow-down-2-light" width="24" height="24" />
                              ) : (
                                <Icon icon="iconamoon:arrow-right-2-light" width="24" height="24" />
                              )
                            }
                          </>
                        )
                      }
                    </NavLink>
                    {
                      item?.subNav?.length > 0 && (
                        <div className={`flex flex-col gap-2 xl:px-4 py-2 bg-[#5B5B5B] rounded-md mx-auto ${activeSideBarRef.current === item.id ? 'block' : 'hidden'}`}>
                          {
                            item?.subNav?.map((subNavItem) => (
                              <NavLink
                                to={subNavItem.path}
                                key={subNavItem.id}
                                id={subNavItem.id}
                                className="flex items-center whitespace-nowrap gap-2 p-2 px-9 py-2 text-white text-sm [&.active]:bg-[#0BB248] hover:bg-white/10 rounded-md"
                              >
                                {subNavItem.name}
                              </NavLink>
                            ))
                          }
                        </div>
                      )
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Section - Fixed at bottom */}
            <div className="sticky bottom-0 w-full border-t border-white/10 bg-[#17171B]">
              <div className="flex flex-col gap-4 p-4">
                <a href='https://help.auqli.live/en/' target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2 text-white text-sm hover:bg-white/10 rounded-md">
                  <Icon icon="fluent:person-support-28-regular" width="24" height="24" />
                  <p>Help & Support</p>
                </a>
                <NavLink to='/dashboard/account' className="flex items-center gap-2 px-5 py-2 text-white text-sm hover:bg-white/10 rounded-md">
                  <Icon icon="mingcute:user-4-line" width="24" height="24" />
                  <p>Account</p>
                </NavLink>
                {/* <NavLink to='/dashboard/university' className="flex items-center gap-2 px-5 py-2 text-white text-sm hover:bg-white/10 rounded-md">
                  <Icon icon="carbon:education" width="24" height="24" />
                  <p>Auqli University</p>
                </NavLink> */}
                <button
                  className="flex items-center gap-2 px-5 py-2 text-white text-sm hover:bg-white/10 rounded-md text-left"
                  onClick={handleLogout}
                >
                  <Icon icon="simple-line-icons:logout" width="22" height="22" />
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Mobile Sidebar */}
      {
        isSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />

            {/* Sidebar */}
            <div className="fixed top-0 left-0 h-full w-[257px] bg-[#17171B] flex flex-col">
              {/* Close Button */}
              <MdClose
                size={24}
                className="absolute top-4 right-4 cursor-pointer text-white"
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
                    <div key={item.id}>
                      <NavLink
                        to={item.path}
                        key={item.id}
                        onClick={() => {
                          setIsSidebarOpen(false);
                          handleSubNavOpen(item.id);
                        }}
                        className={`
                          flex items-center gap-2 p-2 px-9 py-4 
                          ${location.pathname === item.path ? 'bg-[#FFFFFF] text-[#0BB248] hover:bg-[#ffffff] hover:backdrop-blur-none' : 'text-white'}
                          transition-all duration-300 ease-in-out
                          hover:bg-white/10 hover:backdrop-blur-sm
                          active:bg-white/20 active:scale-[0.98] active:backdrop-blur-md
                        `}
                      >
                        <Icon
                          icon={item.icon}
                          size={24}
                          className={
                            location.pathname === item.path ? 'text-[#0BB248]' : 'text-white'
                          }
                        />
                        <span className="text-sm">{item.name}</span>
                      </NavLink>
                      {
                        item?.subNav?.length > 0 && (
                          <div className={`flex flex-col gap-2 px-4 py-2 bg-[#5B5B5B] rounded-md mx-auto ${activeSideBarRef.current === item.id ? 'block' : 'hidden'}`}>
                            {
                              item?.subNav?.map((subNavItem) => (
                                <NavLink
                                  to={subNavItem.path}
                                  key={subNavItem.id}
                                  className="flex items-center whitespace-nowrap gap-2 p-2 px-9 py-2 text-white text-sm [&.active]:bg-[#0BB248] hover:bg-white/10 rounded-md"
                                >
                                  {subNavItem.name}
                                </NavLink>
                              ))
                            }
                          </div>
                        )
                      }
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Section */}
              <div className="mt-auto border-t border-white/10 ">
                <div className="flex flex-col gap-4 p-4">
                  <NavLink to="/dashboard/help" className="flex items-center gap-2 px-5 py-2 text-white text-sm hover:bg-white/10 rounded-md">
                    <Icon icon="fluent:person-support-28-regular" width="24" height="24" />
                    Help & Support
                  </NavLink>
                  <NavLink to="/dashboard/account" className="flex items-center gap-2 px-5 py-2 text-white text-sm hover:bg-white/10 rounded-md">
                    <Icon icon="mingcute:user-4-line" width="24" height="24" />
                    Account
                  </NavLink>
                  {/* <NavLink to="/dashboard/university" className="flex items-center gap-2 px-5 py-2 text-white text-sm hover:bg-white/10 rounded-md">
                    <Icon icon="carbon:education" width="24" height="24" />
                    Auqli University
                  </NavLink> */}
                  <button
                    className="flex items-center gap-2 px-5 py-2 text-white text-sm hover:bg-white/10 rounded-md text-left"
                    onClick={handleLogout}
                  >
                    <Icon icon="simple-line-icons:logout" width="22" height="22" />
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
};

SideBarNav.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  setIsSidebarOpen: PropTypes.func.isRequired,
  hideSidebar: PropTypes.bool.isRequired,
};

export default SideBarNav
