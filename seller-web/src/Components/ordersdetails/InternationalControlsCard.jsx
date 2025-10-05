import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Truck } from "lucide-react";

export default function InternationalControlsCard({ onOpenTracking, onOpenStatus }) {
  return (
    <Card className="border w-full border-blue-200 shadow-sm bg-white">
      <CardHeader className="border-b border-blue-100 p-4">
        <CardTitle className="flex items-center gap-2 font-inter text-sm text-blue-700">
          <Truck className="h-4 w-4 text-blue-500" />
          International Order Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={onOpenTracking}>
          Update Tracking Information
        </Button>
        <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={onOpenStatus}>
          Update Order Status
        </Button>
      </CardContent>
    </Card>
  );
}


