import { Button } from '@/Components/ui/button';
import { Skeleton } from '@/Components/shared/Skeleton';
import type { Referral } from '@/services/referralService';
import { Checkbox } from 'antd';
import { formatMetricValue } from '@/util/helpers';

interface MobileReferralListProps {
  referrals: Referral[];
  isLoading: boolean;
  onViewDetails: (id: string) => void;
  selectedKeys?: string[];
  onSelectChange?: (keys: string[]) => void;
}

export default function MobileReferralList({ 
  referrals, 
  isLoading, 
  onViewDetails,
  selectedKeys = [],
  onSelectChange
}: MobileReferralListProps) {
  
  const handleSelect = (id: string, checked: boolean) => {
    if (!onSelectChange) return;
    
    if (checked) {
      onSelectChange([...selectedKeys, id]);
    } else {
      onSelectChange(selectedKeys.filter(key => key !== id));
    }
  };

  if (isLoading && referrals.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex justify-between items-end mt-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {referrals?.map((referral) => {
        const isSelected = selectedKeys.includes(referral?.id || '');
        
        return (
          <div 
            key={referral?.id || ''} 
            className={`p-4 bg-white rounded-xl border ${isSelected ? 'border-[#0BB248] bg-[#0BB248]/5' : 'border-gray-100'} shadow-sm transition-colors`}
          >
            <div className="flex gap-3 mb-3">
              {onSelectChange && (
                <div className="pt-0.5">
                  <Checkbox 
                    checked={isSelected}
                    onChange={(e) => handleSelect(referral?.id || '', e.target.checked)}
                  />
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-[#101828] text-[15px] truncate pr-2">
                    {referral?.referee?.name || '-'}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`h-1.5 w-1.5 rounded-full ${referral?.status === 'completed' ? 'bg-[#0BB248]' : referral?.status === 'pending' ? 'bg-[#F97316]' : 'bg-gray-400'}`} />
                    <span className="text-xs font-medium text-[#344054] capitalize">
                      {referral?.status || '-'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Reward</p>
                    <p className={`text-sm font-semibold ${referral?.status === 'completed' ? 'text-[#0BB248]' : 'text-[#344054]'}`}>
                      {referral?.status === 'completed' 
                        ? `₦${formatMetricValue(referral?.amountEarned)}` 
                        : '-'}
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-[#0BB248] text-[#0BB248] hover:bg-[#0BB248]/10 px-4"
                    onClick={() => onViewDetails(referral?.id)}
                  >
                    View
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
