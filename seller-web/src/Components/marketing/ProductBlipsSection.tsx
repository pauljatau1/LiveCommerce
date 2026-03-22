import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/Components/ui/button"
import { Skeleton } from "@/Components/shared/Skeleton"
import type { SellerBlip } from "@/types/products"
import BlipCard from "@/Components/marketing/BlipCard"

type BlipsPagination = {
  currentPage: number
  totalPages: number
  totalBlips: number
}

type ProductBlipsSectionProps = {
  blips: SellerBlip[]
  isLoading: boolean
  error: string | null
  pagination: BlipsPagination | null | undefined
  onAddBlips: () => void
  onRetry: () => void
  onPrevPage: () => void
  onNextPage: () => void
  onProductClick: (productLink: string) => void
}

export default function ProductBlipsSection({
  blips,
  isLoading,
  error,
  pagination,
  onAddBlips,
  onRetry,
  onPrevPage,
  onNextPage,
  onProductClick,
}: ProductBlipsSectionProps) {
  const currentPage = pagination?.currentPage ?? 1
  const totalPages = pagination?.totalPages ?? 1

  return (
    <section className="border border-gray-200 rounded-[16px] bg-[#F8FAFC] px-5 md:px-7 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold text-[#101828]">Product Blips</h2>
          <p className="mt-1 text-[13px] text-[#667085]">Your most recent blips appear here!</p>
        </div>

        <Button
          onClick={onAddBlips}
          className="h-9 rounded-[10px] bg-[#0BB248] hover:bg-[#0BB248]/90 text-white text-xs font-semibold px-4"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden />
          Add Blips
        </Button>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="rounded-[18px] bg-white border border-[#EEF2F6] overflow-hidden">
                <Skeleton className="h-[180px] bg-[#F2F4F7] animate-pulse" />
                <div className="px-4 pt-4 pb-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <Skeleton className="h-4 w-2/3 bg-[#F2F4F7] animate-pulse rounded" />
                      <Skeleton className="h-3 w-1/3 bg-[#F2F4F7] animate-pulse rounded" />
                    </div>
                    <Skeleton className="h-8 w-20 bg-[#F2F4F7] animate-pulse rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-12 bg-[#F2F4F7] animate-pulse rounded-full" />
                    <Skeleton className="h-3 w-16 bg-[#F2F4F7] animate-pulse rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[14px] border border-[#FEE4E2] bg-white px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-[#B42318]">Failed to load blips. Please try again.</p>
            <Button variant="outline" className="border-[#0BB248] text-[#0BB248] hover:bg-[#0BB248]/10" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : blips.length === 0 ? (
          <div className="rounded-[18px] bg-white border border-[#EEF2F6] overflow-hidden flex flex-col sm:flex-row">
            <div className="flex-1 px-6 py-8">
              <h3 className="text-[20px] font-semibold text-[#101828]">No Blips found.</h3>
              <p className="mt-2 text-[13px] text-[#667085]">Create a new blips to see quick highlights about your products.</p>
            </div>
            <div className="sm:w-[220px] bg-[#D7F2E2] p-6 flex items-center justify-center">
              <Button
                onClick={onAddBlips}
                className="h-9 rounded-[10px] bg-[#0BB248] hover:bg-[#0BB248]/90 text-white text-xs font-semibold px-4"
              >
                Create Blips
                <ChevronRight className="h-4 w-4 ml-2" aria-hidden />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                aria-label="Previous blips page"
                onClick={onPrevPage}
                disabled={currentPage <= 1}
                className="h-8 w-8 rounded-full bg-[#0BB248] text-white disabled:bg-[#0BB248]/40 flex items-center justify-center"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Next blips page"
                onClick={onNextPage}
                disabled={currentPage >= totalPages}
                className="h-8 w-8 rounded-full bg-[#0BB248] text-white disabled:bg-[#0BB248]/40 flex items-center justify-center"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {blips.map((blip) => (
                <BlipCard key={blip._id} blip={blip} onProductClick={onProductClick} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

