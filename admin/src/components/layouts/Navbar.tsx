import { Bell, Menu, LogOut, User as UserIcon, Settings, Search, ShieldCheck, Zap, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/context/sidebarContext";
import { useAuth } from "@/context/authContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function Navbar() {
  const { toggle } = useSidebar();
  const { user, logout } = useAuth();

  return (
    <nav className="border-b bg-slate-950/80 backdrop-blur-md border-slate-800/60 px-4 sm:px-6 py-2.5 fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-all">

      {/* Left: Mobile Menu & Logo */}
      <div className="flex items-center gap-4">
        <Button
          size="icon"
          variant="ghost"
          className="md:hidden text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors"
          onClick={toggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo Section */}
        <div className="flex items-center gap-3 group px-1">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:scale-105 transition-transform duration-300">
            <img
              src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png"
              alt="Auqli Logo"
              className="h-7 w-auto object-contain"
            />
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-sm font-black text-white tracking-tighter leading-none">AUQLI</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">Admin OS</span>
          </div>
        </div>
      </div>

      {/* Middle: Integrated Search (Visual Only for now) */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            placeholder="Search ecosystem..."
            className="w-full bg-slate-900/50 border border-slate-800/60 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all hover:bg-slate-900"
          />
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Actions Groups */}
        <div className="hidden sm:flex items-center gap-1.5 border-r border-slate-800/60 pr-4 mr-1">
          <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all">
            <Zap className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-slate-950" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 pl-1.5 pr-3 py-1.5 h-auto rounded-2xl hover:bg-slate-800/40 transition-all group">
              <Avatar className="h-8 w-8 rounded-xl border border-slate-700/50 shadow-lg group-hover:scale-105 transition-transform">
                <AvatarImage src={user?.profileImage} alt={user?.username} />
                <AvatarFallback className="bg-slate-800 text-orange-400 font-bold text-xs uppercase">
                  {user?.firstName?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start gap-0.5 text-left">
                <span className="text-xs font-bold text-white leading-none whitespace-nowrap">{user?.username || 'Admin'}</span>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-none px-1.5 py-0 h-4 text-[8px] font-black uppercase tracking-tighter">
                  System Super
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 bg-slate-900/95 backdrop-blur-xl border-slate-800 p-2 text-slate-300 shadow-2xl rounded-2xl" align="end" sideOffset={10}>
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 rounded-xl border border-slate-800">
                    <AvatarImage src={user?.profileImage} alt={user?.username} />
                    <AvatarFallback className="bg-slate-800 text-orange-400 font-bold uppercase">
                      {user?.firstName?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-bold leading-none text-white">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[10px] text-slate-500 mt-1 truncate max-w-[150px]">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-emerald-400/10 text-emerald-400 text-[9px] font-black uppercase border border-emerald-400/20">
                    <ShieldCheck className="h-3 w-3" /> VERIFIED
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800 my-2 mx-1" />
            <div className="space-y-1">
              <DropdownMenuItem className="flex items-center gap-3 rounded-xl focus:bg-slate-800 focus:text-white cursor-pointer py-2.5 px-3 transition-colors">
                <UserIcon className="h-4 w-4 text-slate-500" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold">Personal Profile</span>
                  <span className="text-[10px] text-slate-500">View and edit details</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 rounded-xl focus:bg-slate-800 focus:text-white cursor-pointer py-2.5 px-3 transition-colors">
                <Settings className="h-4 w-4 text-slate-500" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold">System Settings</span>
                  <span className="text-[10px] text-slate-500">Account configurations</span>
                </div>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="bg-slate-800 my-2 mx-1" />
            <DropdownMenuItem
              className="flex items-center gap-3 rounded-xl text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 cursor-pointer py-2.5 px-3 transition-colors"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-xs font-bold">Terminate Session</span>
                <span className="text-[10px] text-rose-500/60 font-medium">Safe logout of terminal</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

export default Navbar;
