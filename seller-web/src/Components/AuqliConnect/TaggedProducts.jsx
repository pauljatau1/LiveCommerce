import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from 'lucide-react';

const TaggedProducts = ({ products }) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="mt-4 border-t border-gray-100 dark:border-gray-700/50 pt-4">
      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
        <span className="inline-block w-1 h-4 bg-green-500 rounded-full"></span>
        Tagged Products ({products.length})
      </h4>
      <div className="grid grid-cols-2 gap-3">
        {products.map((productItem) => {
          const product = productItem.productId || productItem;
          
          const {
            _id: id,
            name,
            price,
            images = [],
            category,
            brand,
            discountedPrice
          } = product;

          return (
            <div
              key={id}
              className="group relative flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer overflow-hidden"
              onClick={() => window.open(`/dashboard/products/${id}`, '_blank')}
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={images[0]?.url || '/placeholder-product.png'}
                  alt={name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {images.length > 1 && (
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full">
                    +{images.length - 1}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {name}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                    ₦{(discountedPrice || price)?.toLocaleString()}
                  </p>
                  {discountedPrice && discountedPrice < price && (
                    <p className="text-xs text-gray-500 line-through">
                      ₦{price?.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {category && (
                    <Badge variant="secondary" className="bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs">
                      {category}
                    </Badge>
                  )}
                  {brand && (
                    <Badge variant="secondary" className="bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs">
                      {brand}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaggedProducts; 