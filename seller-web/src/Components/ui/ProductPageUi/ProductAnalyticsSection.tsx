import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs";

export default function OrdersDesktopTabs({ value, onChange }) {
  return (
    <Tabs value={value} onValueChange={onChange} className="mb-8 hidden sm:block">
      <TabsList className="border-b gap-x-6 flex-wrap items-center justify-start h-auto p-0 bg-transparent">
        <TabsTrigger
          value="all"
          className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
          title="All active orders (excludes abandoned orders)"
        >
          All Orders
        </TabsTrigger>
        <TabsTrigger
          value="process"
          className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
          title="Orders with pending shipping status (excludes abandoned orders)"
        >
          To Process
        </TabsTrigger>
        <TabsTrigger
          value="transit"
          className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
          title="Orders that have been picked up (excludes abandoned orders)"
        >
          In Transit
        </TabsTrigger>
        <TabsTrigger
          value="delivered"
          className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
          title="Orders with delivered shipping status (excludes abandoned orders)"
        >
          Delivered
        </TabsTrigger>
        <TabsTrigger
          value="cancelled"
          className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
          title="Orders with cancelled shipping status (excludes abandoned orders)"
        >
          Cancelled
        </TabsTrigger>
        <TabsTrigger
          value="abandoned"
          className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
          title="Stale orders that were abandoned (isStale=true)"
        >
          Abandoned
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}


