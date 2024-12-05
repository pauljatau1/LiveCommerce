import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

function Navbar() {
  return (
    <nav className="border-b bg-card px-6 py-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">Auqli Admin</h1>
        
        <div className="flex items-center space-x-4">
          <Button size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
