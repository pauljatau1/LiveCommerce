import type { SellerBlip } from "@/types/products"
import BlipVideoPreview from "@/Components/marketing/BlipVideoPreview"
import ShareBlipsButton from "@/Components/marketing/ShareBlipsButton"

function formatNaira(amount: number) {
  return `₦ ${new Intl.NumberFormat("en-NG").format(amount)}`
}

type BlipCardProps = {
  blip: SellerBlip
  onProductClick?: (productLink: string) => void
}

export default function BlipCard({ blip, onProductClick }: BlipCardProps) {
  const posterUrl = blip.thumbnail || blip.images
  const videoUrl = blip.blipUrl
  const inStock = blip.stock > 0

  return (
    <div className="rounded-[18px] bg-white border border-[#EEF2F6] overflow-hidden">
      <div className="relative h-[180px] bg-[#F2F4F7] overflow-hidden">
        <BlipVideoPreview src={videoUrl} poster={posterUrl} productName={blip.productName} />
      </div>

      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              className="text-left text-[13px] max-w-[120px] md:max-w-[200px] font-semibold text-[#0BB248] underline underline-offset-2 truncate block"
              onClick={() => {
                if (blip.productLink) onProductClick?.(blip.productLink)
              }}
            >
              {blip.productName}
            </button>
            <p className="mt-1 text-[12px] font-semibold text-[#344054]">{formatNaira(blip.price)}</p>
          </div>

          <ShareBlipsButton blipLink={blip.blipLink} blipUrl={blip.blipUrl} productName={blip.productName} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#E7F7ED] text-[#0BB248] text-[11px] font-semibold">Product</span>
          <span className={["text-[11px] font-medium", inStock ? "text-[#667085]" : "text-[#EF4444]"].join(" ")}>
            {inStock ? "In stock" : "Out of stock"}
          </span>
        </div>
      </div>
    </div>
  )
}

