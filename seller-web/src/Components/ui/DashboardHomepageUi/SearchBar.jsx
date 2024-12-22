import { Icon } from '@iconify/react'
import * as React from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../../ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../ui/popover"

const SearchBar = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const [open, setOpen] = React.useState(false)

    return (
        <div className='py-10 flex justify-between items-center'>
            {
                !isSidebarOpen && (
                    <Icon icon="pepicons-pencil:menu" width="34" height="34" color="#05031F" className='md:hidden' onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                )
            }
            <input type="text" placeholder='Search...' className=' w-[160px] md:w-[405px] xl:w-[805px] h-[40px] bg-[#05031F] text-[#FFFFFF] rounded-full py-6 pl-6 md:pl-[74px] pr-6 ' />
            <button className='bg-[#DF0707] hidden lg:flex items-center justify-center w-fit text-white text-base font-bold font-lexend px-6 py-3 rounded-full xl:ml-[56px] xl:mr-[30px] relative overflow-hidden transition-all duration-150 hover:shadow-lg group isolate before:absolute before:bg-white/30 before:content-[""] before:h-full before:w-0 before:top-0 before:left-[50%] before:transform before:-translate-x-1/2 before:-z-10 hover:before:w-full before:transition-all before:duration-150 active:scale-[0.98]'>
                <span className=' whitespace-nowrap'>Go Live</span>
            </button>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button className='bg-[#DF0707] lg:hidden items-center justify-center w-fit text-white text-base font-bold font-lexend px-6 py-3 rounded-full xl:ml-[56px] xl:mr-[30px] relative overflow-hidden transition-all duration-150 hover:shadow-lg group isolate before:absolute before:bg-white/30 before:content-[""] before:h-full before:w-0 before:top-0 before:left-[50%] before:transform before:-translate-x-1/2 before:-z-10 hover:before:w-full before:transition-all before:duration-150 active:scale-[0.98]'>
                        <Icon icon="ri:live-fill" width="24" height="24" color="#FFFFFF" className="lg:hidden" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <Command>
                        <CommandList>
                            <CommandGroup>
                                <CommandItem onSelect={() => {
                                    // Handle Go Live action
                                    setOpen(false)
                                }}>
                                    <Icon icon="fluent:live-20-filled" width="20" height="20" color="#05031F" />
                                    <span className="ml-2 text-[#05031F]">Go Live</span>
                                </CommandItem>
                                <CommandItem onSelect={() => {
                                    // Handle Live Chat action
                                    setOpen(false)
                                }}>
                                    <Icon icon="solar:chat-line-bold" width="24" height="24" color='#05031F' />
                                    <span className="ml-2 text-[#05031F]">Live Chat</span>
                                </CommandItem>
                                <CommandItem onSelect={() => {
                                    // Handle Notification action
                                    setOpen(false)
                                }}>
                                    <Icon icon="mingcute:notification-fill" width="24" height="24" color='#05031F' />
                                    <span className="ml-2 text-[#05031F]">Notification</span>
                                </CommandItem>
                                <CommandItem onSelect={() => {
                                    // Handle Profile action
                                    setOpen(false)
                                }}>
                                    <Icon icon="iconamoon:profile-fill" width="24" height="24" color='#05031F' />
                                    <span className="ml-2 text-[#05031F]">Profile</span>
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <div className='items-center gap-7 hidden lg:flex'>
                <button className="bg-[#05031F] rounded-full p-3 flex items-center justify-center relative overflow-hidden transition-all duration-150 hover:shadow-lg isolate before:absolute before:bg-white/20 before:content-[''] before:h-full before:w-0 before:top-0 before:left-[50%] before:transform before:-translate-x-1/2 before:-z-10 hover:before:w-full before:transition-all before:duration-150 active:scale-[0.98]" >
                    <span className="relative z-10">
                        <Icon icon="solar:chat-line-bold" width="24" height="24" color='#FFFFFF' />
                    </span>
                </button>
                <button className="bg-[#05031F] rounded-full p-3 flex items-center justify-center relative overflow-hidden transition-all duration-150 hover:shadow-lg isolate before:absolute before:bg-white/20 before:content-[''] before:h-full before:w-0 before:top-0 before:left-[50%] before:transform before:-translate-x-1/2 before:-z-10 hover:before:w-full before:transition-all before:duration-150 active:scale-[0.98]" >
                    <span className="relative z-10">
                        <Icon icon="si:notifications-thick-duotone" width="24" height="24" color='#FFFFFF' />
                    </span>
                </button>
                <button className="bg-[#05031F] rounded-full p-3 flex items-center justify-center relative overflow-hidden transition-all duration-150 hover:shadow-lg isolate before:absolute before:bg-white/20 before:content-[''] before:h-full before:w-0 before:top-0 before:left-[50%] before:transform before:-translate-x-1/2 before:-z-10 hover:before:w-full before:transition-all before:duration-150 active:scale-[0.98]" >
                    <span className="relative z-10">
                        <Icon icon="iconamoon:profile-fill" width="24" height="24" color='#FFFFFF' />
                    </span>
                </button>
            </div>
        </div>
    )
}

export default SearchBar
