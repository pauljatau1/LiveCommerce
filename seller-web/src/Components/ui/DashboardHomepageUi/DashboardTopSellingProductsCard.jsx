import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import QuickOrderCard from "@/Components/QuickOrderCard";
import NotFoundAsset from "@/assets/no-order-found.png";

export default function DashboardTopSellingProductsCard() {

  const { data: products, isPending } = useQuery({
    queryKey: ["topSellingProducts"],
    queryFn: () => sellerService.fetchTopSoldProducts()
  });

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col">
      <div className="flex flex-col xl:flex-row xl:justify-between space-y-3 xl:space-y-0 xl:items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#27272E] font-inter ">
            Your top 3 selling products
          </h3>
          <p className="text-sm text-[#425466] font-inter mt-0.5">
            Best performing items this month
          </p>
        </div>
        <Link
          to="/dashboard/analytics-insights"
          className="flex items-center w-fit px-3 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors duration-200 shadow-sm hover:shadow"
        >
          View Analytics
          <svg
            className="ml-1.5 w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
      <div className="overflow-hidden flex-1">
        {isPending ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#16783A]"></div>
          </div>
        ) : (
          <div className=" space-y-3 mt-3 h-full">
            {products?.length > 0 ? (
              products?.map((product) => (
                <QuickOrderCard
                  key={product?._id}
                  product={product}
                  className="hover:bg-gray-50 transition-colors duration-200 p-3"
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[364px] text-gray-500">
                <img
                  src={NotFoundAsset}
                  alt="No Products Sold Yet"
                  className="h-48 "
                />
                <p className="text-base font-medium text-[#425466] font-inter">
                  No Products Sold Yet
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
