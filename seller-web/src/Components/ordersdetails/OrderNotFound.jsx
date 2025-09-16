import { Button } from "@/Components/ui/button";
import { AlertCircle } from "lucide-react";

export default function OrderNotFound({ onBack, onRetry }) {
  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="bg-amber-50 rounded-full p-5 mb-6">
        <AlertCircle className="h-12 w-12 text-amber-500" />
      </div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Order Not Found</h1>
      <p className="text-gray-600 text-center max-w-md mb-8">
        We couldn't find the order you're looking for. It may have been deleted or the order ID might be incorrect.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          Back to Orders
        </Button>
        <Button onClick={onRetry} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M8 16H3v5"/>
          </svg>
          Retry
        </Button>
      </div>
    </div>
  );
}


