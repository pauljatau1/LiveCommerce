import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs";

type ProductAnalyticsSectionProps = {
  value?: string;
  onChange?: (value: string) => void;
};

export default function ProductAnalyticsSection({ value: valueProp, onChange }: ProductAnalyticsSectionProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(valueProp ?? "all");

  useEffect(() => {
    if (valueProp !== undefined) setUncontrolledValue(valueProp);
  }, [valueProp]);

  const resolvedValue = valueProp ?? uncontrolledValue;

  const handleValueChange = (nextValue: string) => {
    if (valueProp === undefined) setUncontrolledValue(nextValue);
    onChange?.(nextValue);
  };

  const TabsAny = Tabs as any;
  const TabsListAny = TabsList as any;
  const TabsTriggerAny = TabsTrigger as any;

  return (
    <TabsAny value={resolvedValue} onValueChange={handleValueChange} className="mb-8 hidden sm:block">
      <TabsListAny className="border-b gap-x-6 flex-wrap items-center justify-start h-auto p-0 bg-transparent">
        <TabsTriggerAny
          value="all"
          className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
          title="All active orders (excludes abandoned orders)"
        >
          All Orders
        </TabsTriggerAny>
        <TabsTriggerAny
          value="process"
          className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
          title="Orders with pending shipping status (excludes abandoned orders)"
        >
          To Process
        </TabsTriggerAny>
        <TabsTriggerAny
          value="transit"
          className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
          title="Orders that have been picked up (excludes abandoned orders)"
        >
          In Transit
        </TabsTriggerAny>
        <TabsTriggerAny
          value="delivered"
          className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
          title="Orders with delivered shipping status (excludes abandoned orders)"
        >
          Delivered
        </TabsTriggerAny>
        <TabsTriggerAny
          value="cancelled"
          className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
          title="Orders with cancelled shipping status (excludes abandoned orders)"
        >
          Cancelled
        </TabsTriggerAny>
        <TabsTriggerAny
          value="abandoned"
          className="text-sm lg:text-base font-semibold w-fit data-[state=active]:text-green-600 data-[state=active]:bg-transparent font-inter data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none px-0 pb-2"
          title="Stale orders that were abandoned (isStale=true)"
        >
          Abandoned
        </TabsTriggerAny>
      </TabsListAny>
    </TabsAny>
  );
}


