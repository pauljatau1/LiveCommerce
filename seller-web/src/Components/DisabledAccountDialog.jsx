import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog';
import { Icon } from '@iconify/react';

function DisabledAccountDialog({ isOpen, onClose }) {
  // Function to handle contact support
  const handleContactSupport = () => {
    window.open('mailto:support@auqli.com', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-xl shadow-xl border border-red-100">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-3 text-red-600 text-xl font-semibold">
            <div className="bg-red-100 p-2 rounded-full">
              <Icon icon="solar:shield-x-bold" className="h-6 w-6 text-red-600" />
            </div>
            Account Disabled
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-gray-700 mb-4">
            Your seller account has been disabled. This could be due to a policy violation or other security concerns.
          </p>
          <p className="text-gray-700">
            If you believe this is a mistake, please contact our support team for assistance.
          </p>
        </div>
        
        <DialogFooter className="flex justify-end gap-3 pt-2">
          <button 
            onClick={handleContactSupport} 
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center gap-2"
          >
            <Icon icon="solar:mailbox-bold" className="h-4 w-4" />
            Contact Support
          </button>
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
          >
            <Icon icon="solar:logout-3-bold" className="h-4 w-4" />
            Logout
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

DisabledAccountDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default DisabledAccountDialog; 