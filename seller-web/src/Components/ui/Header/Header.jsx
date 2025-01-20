import { Icon } from "@iconify/react"
import { useEffect, useState } from "react"
import { Command, CommandGroup, CommandItem, CommandList } from "../../ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"
import { Crisp } from "crisp-sdk-web"
import PropTypes from "prop-types"
import { BASE_URL } from "@/Constants/Server"

const Header = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const [open, setOpen] = useState(false)
  const [isChatVisible, setIsChatVisible] = useState(true)
  const [seller, setSeller] = useState(null)
  const WEBSITE_ID = "1e433cca-97ba-42a7-bac7-b3ea79d648f1"

  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        const sellerToken = localStorage.getItem('sellerToken')
        if (sellerToken) {
          const tokenData = JSON.parse(sellerToken)
          const token = tokenData.data
          
          const response = await fetch(`${BASE_URL}/seller/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const data = await response.json()
          setSeller(data)
        }
      } catch (error) {
        console.error('Error fetching seller profile:', error)
      }
    }

    fetchSellerProfile()
  }, [])

  useEffect(() => {
    Crisp.configure(WEBSITE_ID, {
      autoLoad: false,
    })
    window.$crisp.push(["do", "chat:hide"])
    window.$crisp.push([
      "on",
      "chat:closed",
      () => {
        setIsChatVisible(false)
        window.$crisp.push(["do", "chat:hide"])
      },
    ])
    return () => {
      window.$crisp.push(["off", "chat:closed"])
    }
  }, [])

  const handleChatOpen = () => {
    setIsChatVisible(true)
    window.$crisp.push(["do", "chat:show"])
    Crisp.chat.open()
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto py-3">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 lg:hidden"
              >
                <Icon icon="pepicons-pencil:menu" className="h-6 w-6" />
              </button>
            )}
            <h1 className="ml-2 lg:ml-0 text-2xl font-semibold text-gray-900">Dashboard</h1>
          </div>

          {/* Mobile Menu */}
          <Popover open={open} onOpenChange={setOpen} className="lg:hidden">
            <PopoverTrigger asChild>
              <button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500">
                <Icon icon="heroicon-o:menu" className="h-6 w-6" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 mt-2 p-2 bg-white rounded-md shadow-lg border border-gray-200">
              <Command>
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => setOpen(false)}
                      className="px-2 py-2 hover:bg-gray-100 rounded-md cursor-pointer"
                    >
                      <Icon icon="fluent:live-20-filled" className="mr-2 h-5 w-5 text-gray-400" />
                      <span>Go Live</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        handleChatOpen()
                        setOpen(false)
                      }}
                      className="px-2 py-2 hover:bg-gray-100 rounded-md cursor-pointer"
                    >
                      <Icon icon="solar:chat-line-bold" className="mr-2 h-5 w-5 text-gray-400" />
                      <span>Live Chat</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => setOpen(false)}
                      className="px-2 py-2 hover:bg-gray-100 rounded-md cursor-pointer"
                    >
                      <Icon icon="mingcute:notification-fill" className="mr-2 h-5 w-5 text-gray-400" />
                      <span>Notifications</span>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Desktop Menu */}
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Go Live
            </button>

            {isChatVisible && (
              <button
                onClick={handleChatOpen}
                className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Icon icon="solar:chat-line-bold" className="h-6 w-6" />
              </button>
            )}

            <button className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <Icon icon="mingcute:notification-fill" className="h-6 w-6" />
            </button>

            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                  {getInitials(seller?.firstName, seller?.lastName)}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {seller?.firstName} {seller?.lastName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

Header.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  setIsSidebarOpen: PropTypes.func.isRequired,
}

export default Header

