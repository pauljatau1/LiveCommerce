import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";

export default function IntlStatusDialog({
  open,
  onOpenChange,
  shippingStatus,
  setShippingStatus,
  onSubmit,
  submitting
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>Select the current status of this international order.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="shippingStatus" className="text-sm font-medium text-gray-700">Shipping Status <span className="text-red-500">*</span></label>
            <select id="shippingStatus" className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={shippingStatus} onChange={(e) => setShippingStatus(e.target.value)}>
              <option value="">Select a status</option>
              <option value="Picked-Up">Picked-Up</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200">Cancel</Button>
          <Button type="button" disabled={submitting || !shippingStatus} onClick={onSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">{submitting ? 'Updating...' : 'Update Status'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
