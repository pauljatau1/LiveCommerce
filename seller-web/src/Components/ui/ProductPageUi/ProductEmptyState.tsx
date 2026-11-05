import { Link } from 'react-router-dom';
import EmptyOrdersIcon from '@/assets/icons/EmptyOrdersIcon';

interface ProductEmptyStateProps {
  status?: string
}

export default function ProductEmptyState({ status = 'product' }: ProductEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-lexend font-semibold text-[#0BB248]">No {status === 'product' ? 'Products' : 'Blips'} Found!</h3>
        <p className="text-[#425466] text-sm font-lexend font-normal max-w-2xl">
          There are no {status === 'product' ? 'products' : 'blips'} matching your current filters. Try adjusting your search criteria, date range or click the create blips button to create a blip.
        </p>
      </div>

      {/* Illustration placeholder - you can replace this with an actual image */}
      <div className="mt-8 mb-6 flex items-center justify-center">
        <div className="w-48 h-48 rounded-lg flex items-center justify-center">
          <EmptyOrdersIcon width={300} height={300} />
        </div>
      </div>


      {
        status === 'product' && (
          <>
            <p className="text-base font-medium text-[#425466] mb-6">Let's fix that!</p>
            <Link
              to="/studio/list"
              className="px-6 py-3 h-[38px] flex items-center justify-center border-2 border-[#0BB248] text-[#0BB248] text-sm rounded-lg font-semibold hover:bg-[#0BB248]/10 transition-all duration-300"
            >
              Start Uploading
            </Link>
          </>
        )
      }
    </div>
  );
}

