import { useEffect, useMemo, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useOutletContext } from "react-router-dom"
import { fetchSellerBlips } from "@/Redux/Slices/ProductSlice"
import type { SellerBlip } from "@/types/products"
import type { OutletContextType } from "@/types"
import { marketingFeatures } from "./MarketingPage"
import MarketingFeaturesSection from "@/Components/marketing/MarketingFeaturesSection"
import ProductBlipsSection from "@/Components/marketing/ProductBlipsSection"

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
      <MarketingFeaturesSection features={marketingFeatures} />

      <ProductBlipsSection
        blips={displayBlips}
        isLoading={isLoadingBlips}
        error={error}
        pagination={blipsPagination}
        onAddBlips={goToProductsBlips}
        onRetry={() => goToPage(blipsPagination?.currentPage ?? 1)}
        onPrevPage={() => goToPage((blipsPagination?.currentPage ?? 1) - 1)}
        onNextPage={() => goToPage((blipsPagination?.currentPage ?? 1) + 1)}
        onProductClick={(productLink) => {
          navigate(productLink)
        }}
      />
    </div>
  )
}
