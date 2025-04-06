import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog';
import { Icon } from '@iconify/react';

function VerificationDialog({ 
  isOpen, 
  onClose, 
  isPending = false,
  title,
  message
}) {
  const navigate = useNavigate();
  
  // Set default title and message based on status
  const defaultTitle = isPending 
    ? "Account Under Review" 
    : "Account Verification Required";
    
  const defaultMessage = isPending
    ? "Your seller account verification is being reviewed. You'll be notified when your account is either approved or declined."
    : "Your seller account is not verified yet. To access all features and start selling on Auqli, you need to complete your onboarding profile.";
  
  // Use provided values or defaults
  const displayTitle = title || defaultTitle;
  const displayMessage = message || defaultMessage;

  const handleCompleteProfile = () => {
    navigate('/dashboard/account?openVerification=true');
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-xl shadow-xl border border-orange-100">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-3 text-orange-600 text-xl font-semibold">
            <div className="bg-orange-100 p-2 rounded-full">
              <Icon icon={isPending ? "solar:clock-circle-bold" : "solar:shield-warning-bold"} className="h-6 w-6 text-orange-600" />
            </div>
            {displayTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-5 px-1">
          <p className="text-gray-700 mb-4 leading-relaxed">
            {displayMessage}
          </p>
          {!isPending && (
            <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
              <Icon icon="solar:info-circle-bold" className="h-5 w-5 text-blue-600 mt-0.5" />
              <p className="text-gray-700 text-sm">
                Please complete your profile information to continue with the verification process.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-end gap-3 pt-2">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
          >
            <Icon icon="solar:close-circle-bold" className="h-4 w-4" />
            {isPending ? "Got it" : "Later"}
          </button>
          {!isPending && (
            <button 
              onClick={handleCompleteProfile}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm flex items-center gap-2"
            >
              <Icon icon="solar:user-check-bold" className="h-4 w-4" />
              Complete Profile
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default VerificationDialog; 