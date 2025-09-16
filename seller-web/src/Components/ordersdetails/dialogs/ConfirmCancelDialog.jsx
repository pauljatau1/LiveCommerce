import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";

export default function ConfirmCancelDialog({ open, onOpenChange, onContinue }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Order Cancellation</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this order? 
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-3 text-sm">
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-md text-amber-800">
            <p className="font-medium mb-1">Cancelling this order will:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Stop the order from being processed further</li>
              <li>Return funds to the customer if already paid</li>
              <li>Make inventory available for other customers</li>
              <li>Potentially affect your seller metrics and ratings</li>
            </ul>
          </div>
          <p>This action cannot be undone once you provide a reason and confirm.</p>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200">
            Go Back
          </Button>
          <Button type="button" onClick={onContinue} className="bg-red-600 hover:bg-red-700 text-white">
            Continue to Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
