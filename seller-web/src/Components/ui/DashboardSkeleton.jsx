import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const DashboardSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Analytics Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-4 xl:gap-x-8 gap-y-2 md:gap-y-4 xl:gap-y-8 mt-6 xl:mt-9">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-7 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Notifications and Top Products Section */}
      <div className="mt-10 flex flex-col lg:flex-row lg:align-center lg:justify-between gap-14 lg:gap-4">
        {/* Notifications Skeleton */}
        <div className="w-full bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products Skeleton */}
        <div className="w-full bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-40"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table Skeleton */}
      <div className="mt-5 bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                {[...Array(5)].map((_, index) => (
                  <th key={index}>
                    <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {[...Array(5)].map((_, colIndex) => (
                    <td key={colIndex} className="py-4">
                      <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seller University Section Skeleton */}
      <div className="mt-10 border border-gray-200 rounded-[10px] px-4 py-3 lg:px-8 lg:py-7">
        <div className="space-y-2 mb-6">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-full max-w-2xl"></div>
        </div>
        <div className="flex gap-4 lg:gap-8 overflow-x-hidden">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex-none w-72">
              <div className="space-y-3">
                <div className="h-40 bg-gray-200 rounded-lg"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Announcements Skeleton */}
      <div className="mt-5">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white p-4 rounded-md border border-gray-200">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton; 