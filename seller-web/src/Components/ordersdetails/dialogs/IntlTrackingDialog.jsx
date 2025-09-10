import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";

export default function IntlTrackingDialog({
  open,
  onOpenChange,
  trackingNumber,
  setTrackingNumber,
  trackingUrl,
  setTrackingUrl,
  estimatedDeliveryDate,
  setEstimatedDeliveryDate,
  onSubmit,
  submitting
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Tracking Information</DialogTitle>
          <DialogDescription>Enter the tracking details for this international order.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="trackingNumber" className="text-sm font-medium text-gray-700">Tracking Number <span className="text-red-500">*</span></label>
            <input id="trackingNumber" className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter tracking number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="trackingUrl" className="text-sm font-medium text-gray-700">Tracking URL (Optional)</label>
            <input id="trackingUrl" className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter tracking URL" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="estimatedDeliveryDate" className="text-sm font-medium text-gray-700">Estimated Delivery Date (Optional)</label>
            <input id="estimatedDeliveryDate" type="date" className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={estimatedDeliveryDate} onChange={(e) => setEstimatedDeliveryDate(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200">Cancel</Button>
          <Button type="button" disabled={submitting || !trackingNumber} onClick={onSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">{submitting ? 'Updating...' : 'Update Tracking'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
