import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";

export default function OrdersMobileTabs({ value, onChange }) {
  return (
    <div className="mb-4 sm:hidden">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Orders (Active)</SelectItem>
          <SelectItem value="process">To Process (Pending Shipping)</SelectItem>
          <SelectItem value="transit">In Transit (Picked Up)</SelectItem>
          <SelectItem value="delivered">Delivered Orders</SelectItem>
          <SelectItem value="cancelled">Cancelled Orders</SelectItem>
          <SelectItem value="abandoned">Abandoned Orders (Stale)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}


