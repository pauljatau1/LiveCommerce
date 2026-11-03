import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { useNotification } from '@/Hooks/useNotification';

interface ShareReferralLinkModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  referralLink: string;
}

export default function ShareReferralLinkModal({ isOpen, onOpenChange, referralLink }: ShareReferralLinkModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { showNotification } = useNotification();

  const handleCopyLink = async () => {
    if (!referralLink) return;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = referralLink;
        textArea.style.position = 'absolute';
        textArea.style.left = '-999999px';
        document.body.prepend(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setIsCopied(true);
      showNotification('Referral link copied to clipboard!', 'information');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      showNotification('Failed to copy link', 'error');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] text-center py-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold text-[#101828] text-center">Invite Sellers & Earn Together</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <p className="text-[#344054] font-medium">Share your referral link. Earn rewards when they sell.</p>
          
          <div className="text-left space-y-2">
            <label className="text-sm font-semibold text-[#101828]">Your Referral Link</label>
            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-gray-200 rounded-lg p-1 pl-3">
              <input 
                type="text" 
                readOnly 
                value={referralLink} 
                className="flex-1 bg-transparent text-sm text-gray-600 outline-none truncate"
              />
              <Button 
                variant="outline" 
                className="h-8 border-[#0BB248] text-[#0BB248] hover:text-[#0BB248] hover:bg-[#0BB248]/10 text-xs gap-1 px-3 bg-white"
                onClick={handleCopyLink}
              >
                {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {isCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-bold text-[#101828] mb-4">Share to your socials</p>
            <div className="flex items-center justify-center gap-4">
              {/* Social icons placeholders */}
              <button className="h-10 w-10 rounded-full border border-[#0BB248] text-[#0BB248] flex items-center justify-center hover:bg-[#0BB248]/5">
                IG
              </button>
              <button className="h-10 w-10 rounded-full border border-[#0BB248] text-[#0BB248] flex items-center justify-center hover:bg-[#0BB248]/5">
                TW
              </button>
              <button className="h-10 w-10 rounded-full border border-[#0BB248] text-[#0BB248] flex items-center justify-center hover:bg-[#0BB248]/5">
                FB
              </button>
              <button className="h-10 w-10 rounded-full border border-[#0BB248] text-[#0BB248] flex items-center justify-center hover:bg-[#0BB248]/5">
                TK
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" className="border-[#0BB248] text-[#0BB248] hover:bg-[#0BB248]/10" onClick={() => onOpenChange(false)}>
              Back
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
