import { Icon } from "@iconify/react"
import { useEffect, useState } from "react"
import { Command, CommandGroup, CommandItem, CommandList } from "../../ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"
import PropTypes from "prop-types"
import { BASE_URL, BASE_URL_V2 } from "@/Constants/Server"
import { useNavigate } from "react-router-dom"
import { Dialog, DialogTrigger } from "../../ui/dialog"
import NotificationsDialog from "../../NotificationsDialog"
import { useAuthContext } from "../../../Hooks/useAuthContext"

const Header = ({ isSidebarOpen, setIsSidebarOpen, name = "Dashboard", navName, showBackButton, fullScreenMode }) => {
  const [open, setOpen] = useState(false)
  const [isChatVisible, setIsChatVisible] = useState(true)
  const [seller, setSeller] = useState(null)
  const { stuffToDo, getSellerNotifications } = useAuthContext()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const navigate = useNavigate()
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false)

  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        const sellerToken = localStorage.getItem('sellerToken')
        if (sellerToken) {
          const tokenData = JSON.parse(sellerToken)
          const token = tokenData.data

          const response = await fetch(`${BASE_URL_V2}/sellers/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const data = await response.json()
          setSeller(data.data)
        }
      } catch (error) {
        console.error('Error fetching seller profile:', error)
      }
    }

    fetchSellerProfile()
  }, [])

  useEffect(() => {
    getSellerNotifications()
  }, [])

  useEffect(() => {
    const calculateUnreadMessages = async () => {
      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken'))?.data
        if (!sellerToken) return

        const response = await fetch(`${BASE_URL}/conversations`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`
          }
        })
        const data = await response.json()
        
        const totalUnread = data.conversations?.reduce((total, conv) => 
          total + (conv.unreadCount || 0), 0) || 0
        
        setUnreadMessages(totalUnread)
      } catch (error) {
        console.error('Error fetching unread messages:', error)
      }
    }

    calculateUnreadMessages()
  }, [])

  const calculateNewNotifications = () => {
    if (!stuffToDo?.notifications) return 0

    const today = new Date().setHours(0, 0, 0, 0)
    return stuffToDo.notifications.filter(notification =>
      !notification.isRead &&
      new Date(notification.createdAt).setHours(0, 0, 0, 0) === today
    ).length
  }

  const handleChatOpen = () => {
    console.log("Chat open")
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  }

  const mobileNotificationsItem = (
    <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
      <DialogTrigger asChild>
        <CommandItem
          onSelect={() => setOpen(false)}
          className="px-2 py-2 hover:bg-gray-100 rounded-md cursor-pointer"
        >
          <Icon icon="mingcute:notification-fill" className="mr-2 h-5 w-5 text-gray-400" />
          <span>Notifications</span>
          {calculateNewNotifications() > 0 && (
            <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
              {calculateNewNotifications()}
            </span>
          )}
        </CommandItem>
      </DialogTrigger>
      <NotificationsDialog 
        notifications={stuffToDo?.notifications || []} 
        onClose={() => setNotificationDialogOpen(false)}
      />
    </Dialog>
  )

  const desktopGoLiveButton = (
    <>
      <div 
        onClick={() => navigate('/dashboard/live-streams/live-stream')}
        className="items-center hidden lg:flex px-6 py-2 gap-2 mr-2 rounded-md bg-red-600 cursor-pointer hover:bg-red-700 transition-all duration-300 ease-in-out"
      >
        <Icon icon="mdi:record" className="h-4 w-4 animate-pulse" color="#ffffff" />
        <span className="inline-flex items-center font-lexend border border-transparent text-sm font-medium text-[#ffffff]">
          Go Live
        </span>
      </div>
      <button
        onClick={() => navigate('/dashboard/live-streams')}
        className="items-center justify-center lg:hidden flex h-9 w-9 gap-2 mr-2 rounded-full bg-red-600 cursor-pointer hover:bg-red-700 transition-all duration-300 ease-in-out">
        <Icon icon="material-symbols:screen-record" className="h-4 w-4 animate-pulse" color="#ffffff" />
      </button>
    </>
  )

  const desktopNotificationsButton = (
    <Dialog open={notificationDialogOpen} onOpenChange={async (isOpen) => {
      setNotificationDialogOpen(isOpen);
      if (isOpen && calculateNewNotifications() > 0) {
        try {
          const sellerToken = JSON.parse(localStorage.getItem('sellerToken'))?.data;
          if (!sellerToken) return;

          // Update local state immediately
          const updatedNotifications = stuffToDo.notifications.map(notification => ({
            ...notification,
            isRead: true
          }));
          stuffToDo.notifications = updatedNotifications;

          // Make API call to mark all notifications as read
          await fetch(`${BASE_URL}/notifications/mark-all-read`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${sellerToken}`,
              'accept': '*/*'
            }
          });
        } catch (error) {
          console.error('Error marking notifications as read:', error);
        }
      }
    }}>
      <DialogTrigger asChild>
        <button className="relative p-2 mr-3 text-[#757575] hover:text-gray-700 transition-all duration-300 ease-in-out">
          <Icon icon="ion:notifications-outline" className="h-7 w-7" />
          {calculateNewNotifications() > 0 && (
            <span className="absolute -top-0 -right-0 bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">
              {calculateNewNotifications()}
            </span>
          )}
        </button>
      </DialogTrigger>
      <NotificationsDialog 
        notifications={stuffToDo?.notifications || []} 
        onClose={() => setNotificationDialogOpen(false)}
      />
    </Dialog>
  )

  const renderAvatar = () => {
    if (seller?.storeAvatar?.url) {
      return (
        <img
          src={seller.storeAvatar.url}
          alt={`${seller.firstName} ${seller.lastName}`}
          className="h-8 w-8 rounded-full object-cover"
        />
      )
    }

    return (
      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
        {getInitials(seller?.firstName, seller?.lastName)}
      </div>
    )
  }

  const handleMessagesClick = async () => {
    try {
      const sellerToken = JSON.parse(localStorage.getItem('sellerToken'))?.data;
      if (!sellerToken) return;

      // Clear unread count locally first for immediate UI update
      setUnreadMessages(0);

      // Navigate to messages page
      navigate('/dashboard/messages');

      // Make API call to mark all conversations as read
      await fetch(`${BASE_URL}/conversations/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sellerToken}`
        }
      });

    } catch (error) {
      console.error('Error marking conversations as read:', error);
      // Optionally refresh the unread count if the API call fails
      calculateUnreadMessages();
    }
  };

  const desktopMenuItems = (
    <div className="hidden md:flex md:items-center md:gap-2">
      {desktopGoLiveButton}
      <button
        onClick={handleMessagesClick}
        className="relative p-2 text-[#757575] hover:text-gray-700 transition-all duration-300 ease-in-out"
      >
        <Icon icon="icon-park-outline:message" className="h-6 w-6" />
        {unreadMessages > 0 && (
          <span className="absolute -top-0 -right-0 bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">
            {unreadMessages}
          </span>
        )}
      </button>
      {desktopNotificationsButton}
      <div 
        onClick={() => navigate('/dashboard/account')}
        className="flex items-center cursor-pointer hover:opacity-80 transition-all duration-300"
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
              {seller.storeName || seller.businessName}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  const mobileMessagesItem = (
    <CommandItem
      onSelect={() => {
        handleMessagesClick();
        setOpen(false);
      }}
      className="px-2 py-2 hover:bg-gray-100 rounded-md cursor-pointer"
    >
      <Icon icon="solar:chat-line-bold" className="mr-2 h-5 w-5 text-gray-400" />
      <span>Messages</span>
      {unreadMessages > 0 && (
        <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
          {unreadMessages}
        </span>
      )}
    </CommandItem>
  )

  // Mobile inline header actions
  const mobileHeaderActions = (
    <div className="flex items-center gap-1 md:hidden">
      <button
        onClick={() => navigate('/dashboard/live-streams/live-stream')}
        className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all duration-300"
      >
        <Icon icon="material-symbols:screen-record" className="h-5 w-5 animate-pulse" />
      </button>
      
      <button
        onClick={handleMessagesClick}
        className="relative p-2 rounded-full text-[#757575] hover:bg-gray-100"
      >
        <Icon icon="solar:chat-line-bold" className="h-5 w-5" />
        {unreadMessages > 0 && (
          <span className="absolute -top-0 -right-0 bg-blue-600 text-white w-4 h-4 flex items-center justify-center rounded-full text-xs">
            {unreadMessages}
          </span>
        )}
      </button>
      
      <Dialog open={notificationDialogOpen} onOpenChange={async (isOpen) => {
        setNotificationDialogOpen(isOpen);
        if (isOpen && calculateNewNotifications() > 0) {
          try {
            const sellerToken = JSON.parse(localStorage.getItem('sellerToken'))?.data;
            if (!sellerToken) return;

            // Update local state immediately
            const updatedNotifications = stuffToDo.notifications.map(notification => ({
              ...notification,
              isRead: true
            }));
            stuffToDo.notifications = updatedNotifications;

            // Make API call to mark all notifications as read
            await fetch(`${BASE_URL}/notifications/mark-all-read`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${sellerToken}`,
                'accept': '*/*'
              }
            });
          } catch (error) {
            console.error('Error marking notifications as read:', error);
          }
        }
      }}>
        <DialogTrigger asChild>
          <button className="relative p-2 rounded-full text-[#757575] hover:bg-gray-100">
            <Icon icon="ion:notifications-outline" className="h-5 w-5" />
            {calculateNewNotifications() > 0 && (
              <span className="absolute -top-0 -right-0 bg-blue-600 text-white w-4 h-4 flex items-center justify-center rounded-full text-xs">
                {calculateNewNotifications()}
              </span>
            )}
          </button>
        </DialogTrigger>
        <NotificationsDialog 
          notifications={stuffToDo?.notifications || []} 
          onClose={() => setNotificationDialogOpen(false)}
        />
      </Dialog>

      <div 
        onClick={() => navigate('/dashboard/account')}
        className="ml-1 cursor-pointer hover:opacity-80 transition-all duration-300"
      >
        {renderAvatar()}
      </div>
    </div>
  )

  return (
    <header className={`${
      fullScreenMode 
        ? 'hidden' 
        : `block bg-white border-b border-[#EDF2F7] fixed top-0 z-50 
           ${isSidebarOpen ? 'left-[257px]' : 'left-0'} right-0 
           md:left-[257px] xl:left-[307px] 
           w-full md:w-[calc(100%-257px)] xl:w-[calc(100%-307px)]`
    }`}>
      <div className="py-3 px-5 md:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md md:hidden text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
              >
                <Icon icon="pepicons-pencil:menu" className="h-6 w-6" />
              </button>
            )}
            <div className="flex flex-col xl:flex-row xl:gap-10 xl:items-center">
              <div className="flex gap-2 items-center">
                {showBackButton && (
                  <button onClick={() => navigate(-1)} className="p-2 rounded-full md:block hidden text-[#272D30] hover:text-[#272D30]/80 transition-all duration-300 ease-in-out hover:bg-[#272D30]/10">
                    <Icon icon="ep:back" className="h-6 w-6" />
                  </button>
                )}
                <h1 className="ml-2 lg:ml-0 text-base md:text-lg xl:text-xl font-inter font-semibold text-[#27272E] truncate max-w-[150px] md:max-w-full">{name}</h1>
              </div>
              {navName !== "" && (
                <div className="flex items-center gap-10">
                  <span className="text-2xl hidden xl:block font-inter text-[#888787]">•</span>
                  <h1 className="ml-2 lg:ml-0 capitalize text-base md:text-lg xl:text-xl font-inter font-semibold text-[#16783A] truncate max-w-[100px] md:max-w-full">{navName}</h1>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu - replaced dropdown with inline icons */}
          {mobileHeaderActions}

          {/* Desktop Menu */}
          {desktopMenuItems}
        </div>
      </div>
    </header>
  )
}

Header.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  setIsSidebarOpen: PropTypes.func.isRequired,
  name: PropTypes.string,
  navName: PropTypes.string,
  showBackButton: PropTypes.bool
}

export default Header
