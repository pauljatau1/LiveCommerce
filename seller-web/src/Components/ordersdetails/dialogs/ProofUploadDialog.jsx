import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Loader2 } from "lucide-react";
import { useNotification } from '@/Hooks/useNotification';
import NotificationBanner from "@/Components/ui/NotificationBanner";

export default function ProofUploadDialog({
  open,
  onOpenChange,
  disabledState,
  proofImage,
  proofNote,
  onFileChange,
  onNoteChange,
  onSubmit,
  submitting,
  storePickupState
}) {
  const disabled = disabledState || storePickupState === 'approved' || storePickupState === 'confirmed_by_seller';
  const { notification, hideNotification } = useNotification();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>

            Upload Pickup Proof
          </DialogTitle>
          <DialogDescription>
            {storePickupState === 'approved' ? (
              <div className="text-green-600 mt-2">The pickup for this order has already been approved. No further action is needed.</div>
            ) : storePickupState === 'confirmed_by_seller' ? (
              <div className="text-amber-600 mt-2">A pickup confirmation is waiting for approval. You cannot submit another confirmation.</div>
            ) : (
              "Please upload a photo as proof of pickup. This could be a signed receipt or the customer with the items."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            
            <label className="text-sm font-medium text-gray-700 block">Upload Proof</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="proof-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input id="proof-upload" name="proof-upload" type="file" accept="image/*" className="sr-only" onChange={onFileChange} disabled={disabled} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
            {proofImage && <p className="text-sm text-green-600">Selected file: {proofImage.name}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="note" className="text-sm font-medium text-gray-700">Additional Notes (Optional)</label>
            <textarea id="note" className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Add any additional notes about the pickup..." value={proofNote} onChange={onNoteChange} disabled={disabled} />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200">
            Cancel
          </Button>
          <Button type="button" disabled={submitting || disabled || !proofImage} onClick={onSubmit} className="bg-purple-600 hover:bg-purple-700 text-white">
            {submitting ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" />Confirming...</>) : 'Confirm Pickup'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
