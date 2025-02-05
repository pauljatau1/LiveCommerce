import { Icon } from "@iconify/react"
import { useEffect, useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "../../ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"
import PropTypes from "prop-types"

const SearchBar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const [open, setOpen] = useState(false)
  const [isChatVisible, setIsChatVisible] = useState(true)
  const WEBSITE_ID = "1e433cca-97ba-42a7-bac7-b3ea79d648f1"


  const handleChatOpen = () => {
    console.log("Chat open")
  }

  return (
    <div className="flex items-center justify-between gap-4 py-6">
      <div className="flex items-center gap-4 flex-1">
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
          >
            <Icon icon="pepicons-pencil:menu" className="w-6 h-6 text-gray-700" />
          </button>
        )}

        <div className="relative flex-1 max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon icon="iconamoon:search-thin" className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full h-12 pl-11 pr-4 bg-white text-gray-900 placeholder-gray-500 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
        </div>
      </div>

      {/* Mobile Menu */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="lg:hidden inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
            <Icon icon="ri:live-fill" className="w-5 h-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2 shadow-lg rounded-lg border border-gray-200">
          <Command className="rounded-lg">
            <CommandList>
              <CommandGroup>
                <CommandItem
                  onSelect={() => setOpen(false)}
                  className="px-2 py-3 hover:bg-gray-100 rounded-md cursor-pointer"
                >
                  <Icon icon="fluent:live-20-filled" className="w-5 h-5 text-gray-700" />
                  <span className="ml-3 text-gray-700">Go Live</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    handleChatOpen()
                    setOpen(false)
                  }}
                  className="px-2 py-3 hover:bg-gray-100 rounded-md cursor-pointer"
                >
                  <Icon icon="solar:chat-line-bold" className="w-5 h-5 text-gray-700" />
                  <span className="ml-3 text-gray-700">Live Chat</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => setOpen(false)}
                  className="px-2 py-3 hover:bg-gray-100 rounded-md cursor-pointer"
                >
                  <Icon icon="mingcute:notification-fill" className="w-5 h-5 text-gray-700" />
                  <span className="ml-3 text-gray-700">Notification</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => setOpen(false)}
                  className="px-2 py-3 hover:bg-gray-100 rounded-md cursor-pointer"
                >
                  <Icon icon="iconamoon:profile-fill" className="w-5 h-5 text-gray-700" />
                  <span className="ml-3 text-gray-700">Profile</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Desktop Menu */}
      <div className="items-center gap-4 hidden lg:flex">
        <button className="inline-flex items-center px-6 py-2.5 text-sm font-medium bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
          <span className="whitespace-nowrap">Go Live</span>
        </button>

        <div className="flex items-center gap-3">
          {isChatVisible && (
            <button
              onClick={handleChatOpen}
              className="relative inline-flex items-center justify-center p-2.5 text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              <Icon icon="solar:chat-line-bold" className="w-5 h-5" />
            </button>
          )}

          <button className="relative inline-flex items-center justify-center p-2.5 text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
            <Icon icon="si:notifications-thick-duotone" className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white">
              3
            </span>
          </button>

          <button className="relative inline-flex items-center justify-center p-2.5 text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
            <Icon icon="iconamoon:profile-fill" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

SearchBar.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  setIsSidebarOpen: PropTypes.func.isRequired,
}

export default SearchBar

