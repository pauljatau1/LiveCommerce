import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Check, RefreshCw, X } from 'lucide-react';
import type { ReferralDetail } from '@/services/referralService';

interface ReferralDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  selectedReferral: ReferralDetail | null | undefined;
}

export default function ReferralDetailsModal({ isOpen, onOpenChange, isLoading, selectedReferral }: ReferralDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[80vh] md:max-h-[95vh] overflow-auto py-4 ">
        <DialogHeader>
          <DialogTitle className="text-center font-bold text-lg">Referral Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <RefreshCw className="h-8 w-8 text-[#0BB248] animate-spin" />
          </div>
        ) : selectedReferral ? (
          <div className="space-y-6 pt-2">
            <p className="text-sm text-gray-500 text-center">This is an overview of the referral details of this user</p>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-b border-gray-100 pb-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Name</p>
                <p className="text-sm font-semibold max-w-[150px] truncate text-[#101828]">{selectedReferral?.referee?.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${selectedReferral?.status === 'completed' ? 'bg-[#0BB248]' : selectedReferral?.status === 'pending' ? 'bg-[#F97316]' : 'bg-gray-400'}`} />
                  <span className="text-sm font-medium capitalize text-[#101828]">{selectedReferral?.status || '-'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Invited on</p>
                <p className="text-sm font-semibold text-[#101828]">
                  {new Date(selectedReferral?.createdAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Joined on</p>
                <p className="text-sm font-semibold text-[#101828]">
                  {new Date(selectedReferral?.referee?.registeredAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{selectedReferral?.status === 'completed' ? 'Reward Earned' : 'Potential Reward'}</p>
                <p className="text-sm font-bold text-[#0BB248]">
                  ₦{new Intl.NumberFormat('en-NG').format(selectedReferral?.amountEarned || 2000)} {selectedReferral?.status !== 'completed' && <span className="text-xs text-gray-500 font-normal">(Estimated)</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Reward Status</p>
                <div className="flex items-center gap-1.5">
                  {selectedReferral?.rewardIssued ? (
                    <>
                      <div className="h-4 w-4 rounded-sm bg-[#0BB248] flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-[#101828]">Paid</span>
                    </>
                  ) : (
                    <>
                      <div className="h-4 w-4 rounded-sm bg-red-100 flex items-center justify-center">
                        <X className="h-3 w-3 text-red-500" />
                      </div>
                      <span className="text-sm font-medium text-[#101828]">Not Yet Earned</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium text-[#101828]">
                First sale : <span className="font-normal">{selectedReferral?.completedAt ? new Date(selectedReferral?.completedAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not Completed.'}</span>
              </p>
              
              <div>
                <p className="text-sm font-bold text-[#101828] mb-4">Referral Timeline</p>
                
                {/* Timeline */}
                <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
                  {/* Invite Sent */}
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-[#0BB248] flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                    <p className="text-sm font-bold text-[#101828]">Invite Sent</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Sent on {new Date(selectedReferral?.createdAt || '').toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                  
                  {/* Signed Up */}
                  <div className="relative pl-6">
                    <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full flex items-center justify-center ${selectedReferral?.referee?.registeredAt ? 'bg-[#0BB248]' : 'bg-gray-200'}`}>
                      {selectedReferral?.referee?.registeredAt && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <p className={`text-sm font-bold ${selectedReferral?.referee?.registeredAt ? 'text-[#101828]' : 'text-gray-400'}`}>Signed Up</p>
                    {selectedReferral?.referee?.registeredAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Signed Up on {new Date(selectedReferral?.referee?.registeredAt || '').toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>
                    )}
                  </div>
                  
                  {/* First Sale (if applicable, based on completedAt) */}
                  <div className="relative pl-6">
                    <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full flex items-center justify-center ${selectedReferral?.completedAt ? 'bg-[#0BB248]' : 'bg-gray-200'}`}>
                      {selectedReferral?.completedAt && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <p className={`text-sm font-bold ${selectedReferral?.completedAt ? 'text-[#101828]' : 'text-gray-400'}`}>First Sale</p>
                    {selectedReferral?.completedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Sold on {new Date(selectedReferral?.completedAt || '').toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>
                    )}
                  </div>

                  {/* Reward Confirmed */}
                  <div className="relative pl-6">
                    <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full flex items-center justify-center ${selectedReferral?.rewardIssued ? 'bg-[#0BB248]' : 'bg-gray-200'}`}>
                      {selectedReferral?.rewardIssued && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <p className={`text-sm font-bold ${selectedReferral?.rewardIssued ? 'text-[#101828]' : 'text-gray-400'}`}>Reward Confirmed</p>
                    {selectedReferral?.rewardIssued && (
                      <p className="text-xs text-gray-500 mt-1">
                        Received reward on {new Date(selectedReferral?.completedAt || selectedReferral?.createdAt).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button 
                className="bg-[#0BB248] hover:bg-[#0a9a3d] text-white px-8" 
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-red-500">Failed to load details</div>
        )}
      </DialogContent>
    </Dialog>
  );
}