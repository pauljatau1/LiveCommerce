import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link, useNavigate, useOutletContext } from "react-router-dom"
import { Button } from "@/Components/ui/button"
import VideoPlayer from "@/Shared/VideoPlayer"
import { fetchSellerBlips } from "@/Redux/Slices/ProductSlice"
import type { SellerBlip } from "@/types/products"
import type { OutletContextType } from "@/types"
import { marketingFeatures } from "./MarketingPage"
import { ChevronLeft, ChevronRight, Play, Plus, Share2, Star } from "lucide-react"
import { Skeleton } from "@/Components/shared/Skeleton"

type ProductSliceState = {
  blips: SellerBlip[]
  isLoadingBlips: boolean
  error: string | null
  blipsPagination: {
    currentPage: number
    totalPages: number
    totalBlips: number
  }
}

type RootState = {
  product: ProductSliceState
}

type TooltipButtonProps = {
  content: string
  ariaLabel: string
}

function TooltipButton({ content, ariaLabel }: TooltipButtonProps) {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (!containerRef.current) return
      if (containerRef.current.contains(target)) return
      setOpen(false)
    }

    document.addEventListener("mousedown", onPointerDown, true)
    document.addEventListener("touchstart", onPointerDown, true)
    return () => {
      document.removeEventListener("mousedown", onPointerDown, true)
      document.removeEventListener("touchstart", onPointerDown, true)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
        <button
          type="button"
          aria-label={ariaLabel}
          aria-describedby={open ? tooltipId : undefined}
          aria-expanded={open}
          className="h-6 w-6 rounded-full border border-[#98A2B3] bg-white flex items-center justify-center text-[#98A2B3] hover:text-[#667085] hover:border-[#D0D5DD] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB248]/30"
          onClick={(e) => {
            e.preventDefault()
            setOpen((v) => !v)
          }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false)
              ;(e.currentTarget as HTMLButtonElement).blur()
            }
          }}
        >
          <span aria-hidden className="text-xs font-semibold leading-none">
            ?
          </span>
        </button>
        {open ? (
          <div
            id={tooltipId}
            role="tooltip"
            className="absolute bottom-full right-0 mb-2 w-max max-w-[220px] rounded-lg border border-white/20 bg-white/80 backdrop-blur-sm px-4 py-2 text-xs text-neutral-800 shadow-lg"
          >
            {content}
          </div>
        ) : null}
    </div>
  )
}

function formatNaira(amount: number) {
  return `₦ ${new Intl.NumberFormat("en-NG").format(amount)}`
}

type BlipVideoPreviewProps = {
  src?: string
  poster?: string
  productName: string
}

function BlipVideoPreview({ src, poster, productName }: BlipVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  if (!src) {
    return <div className="h-full w-full bg-[#F2F4F7]" />
  }

  return (
    <div className="relative h-full w-full">
      <VideoPlayer
        ref={videoRef}
        src={src}
        poster={poster}
        controls={isPlaying}
        muted={false}
        autoPlay={false}
        className="h-full w-full"
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {!isPlaying ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            aria-label={`Play blip video for ${productName}`}
            className="h-10 w-10 rounded-full bg-black/30 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            onClick={() => {
              setIsPlaying(true)
              videoRef.current?.play().catch(() => setIsPlaying(false))
            }}
          >
            <Play className="h-5 w-5 text-white" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default function MarketingPageV2() {
  const { setHeaderName, setNavName } = useOutletContext<OutletContextType>()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { blips, isLoadingBlips, error, blipsPagination } = useSelector((state: RootState) => state.product)

  const itemsPerPage = 3
  const lastRequestedPageRef = useRef<number | null>(null)

  useEffect(() => {
    setHeaderName("Marketing")
    setNavName("")
  }, [setHeaderName, setNavName])

  useEffect(() => {
    const page = blipsPagination?.currentPage ?? 1

    if (lastRequestedPageRef.current === page) return

    lastRequestedPageRef.current = page
    dispatch(((fetchSellerBlips as any)({ page, limit: itemsPerPage }) as unknown) as any)
  }, [dispatch, blipsPagination?.currentPage, itemsPerPage])

  const displayBlips = useMemo(() => (Array.isArray(blips) ? blips : []), [blips])

  const goToProductsBlips = () => {
    navigate("/dashboard/products/list", { state: { initialTab: "product-blips" } })
  }

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > (blipsPagination?.totalPages ?? 1)) return
    lastRequestedPageRef.current = nextPage
    dispatch(((fetchSellerBlips as any)({ page: nextPage, limit: itemsPerPage }) as unknown) as any)
  }

  return (
    <div className="py-6 space-y-10">
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {marketingFeatures.map((feature) => {
          const isAvailable = !feature.isComingSoon
          const infoText =
            feature.isComingSoon
              ? `${feature.title} is coming soon. You’ll be able to set it up from here.`
              : `Open ${feature.title} to start setting it up.`

          const badgeVariant = feature.title === "Auqli Ads" || feature.title === "Flash Sales" ? "beta" : "free"

          return (
            <div
              key={feature.title}
              className="w-full rounded-[16px] border border-[#EEF2F6] bg-white shadow-sm px-5 py-5 flex flex-col"
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-[10px] bg-[#E7F7ED] flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-[#0BB248]" />
                </div>
                <div
                  className={[
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold",
                    badgeVariant === "beta" ? "bg-[#0BB248] text-white" : "bg-[#0BB248] text-white",
                  ].join(" ")}
                >
                  {badgeVariant === "beta" && <Star className="h-3 w-3" aria-hidden />}
                  {badgeVariant === "beta" ? "BETA" : "FREE"}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <h3 className="text-[15px] font-semibold text-[#101828]">{feature.title}</h3>
                <p className="text-[12px] leading-[18px] text-[#667085]">{feature.description}</p>
              </div>

              <div className="mt-auto pt-5 flex items-center justify-between gap-3">
                {isAvailable ? (
                  <Button
                    asChild
                    className="w-full h-9 rounded-[8px] border border-[#0BB248] bg-transparent hover:bg-[#0BB248]/10 text-[#0BB248] text-xs font-semibold"
                  >
                    <Link to={feature.link} className="w-full">
                      Get Started
                    </Link>
                  </Button>
                ) : (
                  <Button
                    className="w-full h-9 rounded-[8px] border border-[#0BB248]/70 bg-transparent text-[#0BB248]/70 text-xs font-semibold"
                    disabled
                  >
                    Not Available
                  </Button>
                )}

                <TooltipButton ariaLabel={`More info about ${feature.title}`} content={infoText} />
              </div>
            </div>
          )
        })}
      </section>

      <section className="border border-gray-200 rounded-[16px] bg-[#F8FAFC] px-5 md:px-7 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-semibold text-[#101828]">Product Blips</h2>
            <p className="mt-1 text-[13px] text-[#667085]">Your most recent blips appear here!</p>
          </div>

          <Button
            onClick={goToProductsBlips}
            className="h-9 rounded-[10px] bg-[#0BB248] hover:bg-[#0BB248]/90 text-white text-xs font-semibold px-4"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden />
            Add Blips
          </Button>
        </div>

        <div className="mt-5">
          {isLoadingBlips ? (
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
              <Button
                variant="outline"
                className="border-[#0BB248] text-[#0BB248] hover:bg-[#0BB248]/10"
                onClick={() => goToPage(blipsPagination?.currentPage ?? 1)}
              >
                Retry
              </Button>
            </div>
          ) : displayBlips.length === 0 ? (
            <div className="rounded-[18px] bg-white border border-[#EEF2F6] overflow-hidden flex flex-col sm:flex-row">
              <div className="flex-1 px-6 py-8">
                <h3 className="text-[20px] font-semibold text-[#101828]">No Blips found.</h3>
                <p className="mt-2 text-[13px] text-[#667085]">
                  Create a new blips to see quick highlights about your products.
                </p>
              </div>
              <div className="sm:w-[220px] bg-[#D7F2E2] p-6 flex items-center justify-center">
                <Button
                  onClick={goToProductsBlips}
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
                  onClick={() => goToPage((blipsPagination?.currentPage ?? 1) - 1)}
                  disabled={(blipsPagination?.currentPage ?? 1) <= 1}
                  className="h-8 w-8 rounded-full bg-[#0BB248] text-white disabled:bg-[#0BB248]/40 flex items-center justify-center"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Next blips page"
                  onClick={() => goToPage((blipsPagination?.currentPage ?? 1) + 1)}
                  disabled={(blipsPagination?.currentPage ?? 1) >= (blipsPagination?.totalPages ?? 1)}
                  className="h-8 w-8 rounded-full bg-[#0BB248] text-white disabled:bg-[#0BB248]/40 flex items-center justify-center"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayBlips.map((blip) => {
                  const posterUrl = blip.thumbnail || blip.images
                  const videoUrl = blip.blipUrl
                  const inStock = blip.stock > 0

                  return (
                    <div
                      key={blip._id}
                      className="rounded-[18px] bg-white border border-[#EEF2F6] overflow-hidden"
                    >
                      <div className="relative h-[180px] bg-[#F2F4F7] overflow-hidden">
                        <BlipVideoPreview src={videoUrl} poster={posterUrl} productName={blip.productName} />
                      </div>

                      <div className="px-4 pt-4 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <button
                              type="button"
                              className="text-left text-[13px] max-w-[120px] md:max-w-[200px] font-semibold text-[#0BB248] underline underline-offset-2 truncate block"
                            >
                              {blip.productName}
                            </button>
                            <p className="mt-1 text-[12px] font-semibold text-[#344054]">{formatNaira(blip.price)}</p>
                          </div>

                          <button
                            type="button"
                            className="h-8 px-3 rounded-[10px] whitespace-nowrap border border-[#0BB248] text-[#0BB248] text-xs font-semibold hover:bg-[#0BB248]/10 flex items-center gap-2"
                            aria-label={`Share blip for ${blip.productName}`}
                            onClick={() => {
                              if (blip.blipLink) window.open(blip.blipLink, "_blank", "noopener,noreferrer")
                            }}
                          >
                            <Share2 className="h-4 w-4" aria-hidden />
                            Share Blips
                          </button>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-[#E7F7ED] text-[#0BB248] text-[11px] font-semibold">
                            Product
                          </span>
                          <span className={["text-[11px] font-medium", inStock ? "text-[#667085]" : "text-[#EF4444]"].join(" ")}>
                            {inStock ? "In stock" : "Out of stock"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
