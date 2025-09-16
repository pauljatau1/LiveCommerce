import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Box, Tag } from "lucide-react";

export default function OrderItemsCard({ items, seller }) {
  if (!items) return null;
  return (
    <Card className="border rounded-2xl border-gray-100 -sm bg-white">
      <CardHeader className="border-b border-gray-100 p-4">
        <CardTitle className="flex items-center gap-2 font-inter text-sm text-gray-700">
          <Box className="h-4 w-4 text-blue-500" />
          Order Items
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {items?.map((item) => (
            <div key={item._id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="h-32 w-32 mx-auto sm:mx-0 bg-white rounded-md overflow-hidden border border-gray-100 flex-shrink-0">
                  <img src={item?.product?.images?.[0]?.url || "/placeholder.svg"} alt={item?.product?.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-center sm:text-left">
                      <h3 className="text-sm font-medium line-clamp-2">{item?.product?.name}</h3>
                      <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs capitalize px-2 py-0.5">
                          <Box className="h-3 w-3 mr-1" />
                          {item?.product?.condition || 'New'}
                        </Badge>
                        {item?.product?.brand && (
                          <Badge variant="outline" className="text-xs capitalize px-2 py-0.5">
                            <Tag className="h-3 w-3 mr-1" />
                            {item?.product?.brand}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item?.product?.description || '' }} />
                    {item?.specifications && Object.values(item.specifications).some(value => value) && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(item.specifications).map(([key, value]) => (
                          value && (
                            <Badge key={key} variant="secondary" className="text-xs capitalize bg-gray-100 text-gray-700 hover:bg-gray-200">
                              {key}: {value}
                            </Badge>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-end justify-between mt-2">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Seller: {item?.seller?.businessName || seller?.businessName}</p>
                      <p className="text-xs text-gray-500">SKU: {item?.product?.sku || 'N/A'}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">₦{item?.price?.toLocaleString()}</p>
                        {item?.product?.discount?.isActive && (
                          <p className="text-xs line-through text-gray-400">₦{(item?.price / (1 - item?.product?.discount?.value / 100))?.toLocaleString()}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">Quantity: {item?.quantity}</p>
                      <Badge className={`mt-1 ${
                        item?.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        item?.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        item?.status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                      } capitalize`}>
                        {item?.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


