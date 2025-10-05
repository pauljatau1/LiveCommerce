import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";

export default function ShippingDocumentsCard({ shipping, onPrintLabel, onPrintInvoice }) {
  if (!shipping?.documents?.shippingLabel && !shipping?.documents?.commercialInvoice) return null;
  return (
    <Card className="border border-gray-100 shadow-s rounded-2xl bg-white">
      <CardHeader className="border-b border-gray-100 p-0">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4">
          <CardTitle className="flex items-center font-inter gap-2 text-base text-gray-800">
            <div className="p-2 bg-purple-500 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            Shipping Documents
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">Download and print your shipping documents</p>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shipping.documents.shippingLabel && (
            <div className="group">
              <Button
                className="w-full h-auto p-4 bg-green-600 border-2 border-green-600 hover:bg-green-700 hover:border-green-700 transition-all duration-200 flex flex-row items-center justify-center gap-3 text-white font-semibold text-base"
                variant="outline"
                onClick={onPrintLabel}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
                  <path d="M16 8h3.5a2 2 0 0 1 2 2l1.5 5v3a2 2 0 0 1-2 2h-1.5"></path>
                  <circle cx="5.5" cy="18.5" r="2"></circle>
                  <circle cx="18.5" cy="18.5" r="2"></circle>
                </svg>
                Track Shipment
              </Button>
            </div>
          )}
          {shipping.documents.commercialInvoice && (
            <div className="group">
              <Button
                className="w-full h-auto p-4 bg-blue-600 border-2 border-blue-600 hover:bg-blue-700 hover:border-blue-700 transition-all duration-200 flex flex-row items-center justify-center gap-3 text-white font-semibold text-base"
                variant="outline"
                onClick={onPrintInvoice}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <rect x="3" y="4" width="18" height="14" rx="2" ry="2"></rect>
                  <path d="M7 20h10v-4H7v4z"></path>
                  <path d="M17 8V4H7v4"></path>
                  <line x1="9" y1="12" x2="15" y2="12"></line>
                </svg>
                Shipping Label
              </Button>
            </div>
          )}
        </div>

        {/* Quick Action Section */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">Next Steps</p>
              <p className="text-sm text-blue-700 mt-1">
                {shipping?.tracking?.status === 'confirmed' 
                  ? 'Your shipment is ready for pickup. The carrier will collect the package according to the schedule.'
                  : 'Package your items securely and attach the shipping label. The carrier will pickup according to schedule.'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


