import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/Components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";

interface LogoutConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isLoggingOut?: boolean;
}

export default function LogoutConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  isLoggingOut = false,
}: LogoutConfirmationModalProps) {
  const queryClient = useQueryClient();

  const handleConfirm = async () => {
    // Invalidate all queries to clear cached data
    queryClient.invalidateQueries();
    queryClient.clear();
    queryClient.resetQueries();
    queryClient.removeQueries();
    await onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md py-8 rounded-lg"
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          // Prevent auto-focus on dialog open
          e.preventDefault();
        }}
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl md:text-3xl font-bold text-[#FF3B30] mb-4">
            Logout?
          </DialogTitle>
          <DialogDescription className="text-base text-gray-700 font-normal">
            Are you sure you want to log out now?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-row flex-wrap gap-3 sm:gap-4 mt-6">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoggingOut}
            className="flex-1 bg-[#FF3B30] hover:bg-[#FF3B30]/80 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs lg:text-sm"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoggingOut}
            className="flex-1 bg-white border-2 border-[#FF3B30] text-[#FF3B30] hover:bg-red-50 font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs lg:text-sm"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

