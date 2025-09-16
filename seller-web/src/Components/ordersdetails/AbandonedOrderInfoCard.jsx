import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { AlertCircle, Clock, CreditCard, ShoppingBag } from "lucide-react";

export default function AbandonedOrderInfoCard() {
  return (
    <Card className="border border-gray-100 -sm bg-white">
      <CardHeader className="border-b border-gray-100 p-4">
        <CardTitle className="flex items-center font-inter gap-2 text-sm text-gray-700">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          Abandoned Order Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="p-4 rounded-lg flex items-start gap-3 bg-orange-50 border border-orange-100">
          <div className="p-2 rounded-full bg-orange-100 flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="font-medium text-orange-800">Payment Not Completed</p>
            <p className="text-sm text-orange-700 mt-1">
              This order was abandoned by the buyer who did not complete the payment process. No shipping or fulfillment is required.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-orange-700">
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-orange-200 p-1 mt-0.5">
                  <Clock className="h-3 w-3 text-orange-700" />
                </div>
                <span>Order timeout: Payment window expired</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-orange-200 p-1 mt-0.5">
                  <ShoppingBag className="h-3 w-3 text-orange-700" />
                </div>
                <span>Products have been returned to inventory automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-orange-200 p-1 mt-0.5">
                  <CreditCard className="h-3 w-3 text-orange-700" />
                </div>
                <span>No payment was processed or received</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


