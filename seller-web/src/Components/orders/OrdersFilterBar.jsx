import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { FilterX, Search as SearchIcon } from "lucide-react";

export default function OrdersFilterBar({
  searchInput,
  setSearchInput,
  onSearch,
  paymentFilter,
  setPaymentFilter,
  channelFilter,
  setChannelFilter,
  onReset,
}) {
  return (
    <div className="hidden sm:flex flex-wrap gap-4">
      <div className="flex items-center gap-2 w-[240px]">
        <Input
          placeholder="Search by Order ID"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
        />
        <Button variant="outline" onClick={onSearch} className="shrink-0">
          <SearchIcon className="h-4 w-4" />
        </Button>
      </div>

      <Select value={paymentFilter} onValueChange={setPaymentFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Payment Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Payments</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>

      <Select value={channelFilter} onValueChange={setChannelFilter}>
        <SelectTrigger className="w-[180px]">
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

      <Button
        variant="outline"
        className="border-slate-300 hover:bg-slate-100"
        onClick={onReset}
      >
        <FilterX className="w-4 h-4 mr-2" />
        Reset All Filters
      </Button>
    </div>
  );
}


