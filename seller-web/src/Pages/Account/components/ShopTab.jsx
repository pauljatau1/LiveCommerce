import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import LinearProgress from "@mui/material/LinearProgress"
import { BASE_URL } from "@/Constants/Server"
import { Eye, ShoppingCart, Star, Package, Barcode } from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table"

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

  if (loading) return <LinearProgress />
  if (error) return <div className="text-red-500">Error: {error}</div>

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
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  {/* Product Info Column */}
                  <TableCell>
                    <div className="flex gap-2 sm:gap-4">
                      <img
                        src={product.images[0]?.url}
                        alt={product.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                      />
                      <div className="space-y-1 sm:space-y-2">
                        <h3 className="font-medium text-sm sm:text-base">{product.name}</h3>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          <Badge variant="outline" className="text-xs">{product.category}</Badge>
                          <Badge variant="outline" className="text-xs">{product.brand}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Barcode className="w-3 h-3" />
                          {product.inventory?.sku}
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
                    <Badge variant={product.status === "active" ? "success" : "secondary"}>
                      {product.status}
                    </Badge>
                  </TableCell>

                  {/* Statistics Column */}
                  <TableCell>
                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                        <span>{product.stats?.views || 0} views</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                        <span>{product.stats?.soldCount || 0} sold</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                        <span>{product.stats?.averageRating || "N/A"} rating</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Inventory Column */}
                  <TableCell>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Package className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
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