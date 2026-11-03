import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";

export default function CancelOrderDialog({ open, onOpenChange, cancelReason, setCancelReason, onSubmit, submitting }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cancel Order</DialogTitle>
          <DialogDescription>
            Please provide a reason for cancelling this order. This will be communicated to the buyer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium text-gray-700">Cancellation Reason</label>
            <textarea
              id="reason"
              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Please explain why you're cancelling this order..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200">
            Cancel
          </Button>
          <Button type="button" disabled={submitting} onClick={onSubmit} className="bg-red-600 hover:bg-red-700 text-white">
            {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
