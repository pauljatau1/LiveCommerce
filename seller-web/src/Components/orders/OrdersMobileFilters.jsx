import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/Components/ui/drawer";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { FilterX, Search as SearchIcon } from "lucide-react";

export default function OrdersMobileFilters({
  open,
  onOpenChange,
  searchInput,
  setSearchInput,
  onSearch,
  paymentFilter,
  setPaymentFilter,
  channelFilter,
  setChannelFilter,
  onClear,
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-6">
        <DrawerHeader>
          <DrawerTitle>Filter Orders</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 p-1">
          <div>
            <p className="text-sm font-medium mb-2">Search by Order ID</p>
            <div className="flex items-center gap-2 w-full">
              <Input
                placeholder="Enter order ID"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
                className="w-full"
              />
              <Button variant="outline" onClick={onSearch} className="shrink-0">
                <SearchIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Payment Status</p>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Channel</p>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
                <SelectItem value="liveshow">Liveshow</SelectItem>
                <SelectItem value="auction">Auction</SelectItem>
                <SelectItem value="blips">Blips</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DrawerFooter className="pt-2">
          <Button
            variant="outline"
            className="w-full border-slate-300 hover:bg-slate-100"
            onClick={onClear}
          >
            <FilterX className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
          <DrawerClose asChild>
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={onSearch}>Apply Filters</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}


