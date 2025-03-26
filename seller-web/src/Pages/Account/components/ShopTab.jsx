import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { BASE_URL } from "@/Constants/Server"
import { Eye, ShoppingCart, Star, Package, Barcode, Store, ShoppingBag } from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export default function ShopTab({ sellerId }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (sellerId) {
      fetchProducts()
    }
  }, [sellerId])

  const fetchProducts = async () => {
    try {
      const sellerToken = localStorage.getItem("sellerToken")
      if (!sellerToken) throw new Error("Not authenticated")

      const tokenData = JSON.parse(sellerToken)
      const token = tokenData.data

      const response = await fetch(`${BASE_URL}/products/seller/${sellerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const renderSkeletonRow = (key) => (
    <TableRow key={key}>
      <TableCell>
        <div className="flex gap-2 sm:gap-4">
          <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-16" />
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-24" />
      </TableCell>
    </TableRow>
  )

  if (loading) {
    return (
      <div className="space-y-4 -mx-4 sm:mx-0">
        <div className="overflow-x-auto">
          <div className="min-w-[800px] p-4 sm:p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Statistics</TableHead>
                  <TableHead>Inventory</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="animate-pulse">
                {Array.from({ length: 5 }).map((_, index) => renderSkeletonRow(index))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
          <p className="font-medium">Error: {error}</p>
        </div>
        <Button 
          onClick={() => { setLoading(true); fetchProducts(); }}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No products found</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Your shop is empty. Add products to start selling and growing your business!
        </p>
        <Button className="bg-green-600 hover:bg-green-700">
          Add Your First Product
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 -mx-4 sm:mx-0">
      <div className="overflow-x-auto bg-white rounded-lg border border-zinc-200 shadow-sm">
        <div className="min-w-[800px] p-0">
          <Table>
            <TableHeader className="bg-zinc-50">
              <TableRow>
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="font-semibold">Price</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Statistics</TableHead>
                <TableHead className="font-semibold">Inventory</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow 
                  key={product._id} 
                  className="hover:bg-zinc-50/50 transition-colors border-b border-zinc-100"
                >
                  {/* Product Info Column */}
                  <TableCell>
                    <div className="flex gap-2 sm:gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-zinc-200">
                        <img
                          src={product.images[0]?.url}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <h3 className="font-medium text-sm sm:text-base line-clamp-2">{product.name}</h3>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          <Badge variant="outline" className="text-xs">{product.category}</Badge>
                          <Badge variant="outline" className="text-xs">{product.brand}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Barcode className="w-3 h-3" />
                          {product.inventory?.sku || "No SKU"}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Price Column */}
                  <TableCell>
                    <div className="space-y-1">
                      {product.hasDiscount ? (
                        <>
                          <div className="font-medium text-green-600 text-sm sm:text-base">
                            ₦{product.discountedPrice.toLocaleString()}
                          </div>
                          <div className="text-xs sm:text-sm line-through text-muted-foreground">
                            ₦{product.price.toLocaleString()}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {product.discount.couponName}
                          </Badge>
                        </>
                      ) : (
                        <div className="font-medium text-sm sm:text-base">
                          ₦{product.price.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Status Column */}
                  <TableCell>
                    <Badge 
                      variant={product.status === "active" ? "success" : "secondary"}
                      className="capitalize px-2.5 py-1"
                    >
                      {product.status}
                    </Badge>
                  </TableCell>

                  {/* Statistics Column */}
                  <TableCell>
                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        <span>{product.stats?.views || 0} views</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                        <span>{product.stats?.soldCount || 0} sold</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                        <span>{product.stats?.averageRating || "N/A"} rating</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Inventory Column */}
                  <TableCell>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Package className={`w-3 h-3 sm:w-4 sm:h-4 ${product.isLowStock ? "text-red-500" : "text-green-500"}`} />
                      <span className={`font-medium text-xs sm:text-sm ${product.isLowStock ? "text-red-500" : ""}`}>
                        {product.stock} in stock
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}