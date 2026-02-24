import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/Components/ui/dialog';
import GlassImage from '@/Components/ui/GlassImageV2';
import { bulkDeleteProducts } from '@/Redux/Slices/ProductSlice';
import type { ProductApiModel } from '@/types/products';

interface DeleteProductsConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productIds: string[];
  products: ProductApiModel[];
  onDeleted?: () => void;
}

export default function DeleteProductsConfirmDialog({
  open,
  onOpenChange,
  productIds,
  products,
  onDeleted,
}: DeleteProductsConfirmDialogProps) {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state: any) => state.product);

  const productsToDisplay = useMemo(
    () =>
      products.filter((product) => productIds.includes(product._id)),
    [products, productIds],
  );

  const handleDelete = async () => {
    if (!productIds.length) return;
    const action = await dispatch(bulkDeleteProducts(productIds as any) as any);
    if (action && action.meta && action.meta.requestStatus === 'fulfilled') {
      if (onDeleted) {
        onDeleted();
      }
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[92vw] group max-h-[80vh] lg:max-h-[100vh] overflow-auto [&::-webkit-scrollbar]:hidden max-w-md rounded-2xl px-5 py-6 ">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-[#FF3B30]">
            Confirm Product Deletion
          </DialogTitle>
          <DialogDescription className="mt-2 text-xs sm:text-sm text-[#4B5563]">
            Are you sure you want to delete this product? This action cannot be
            undone. You can go back and edit instead.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 space-y-3 max-h-[260px] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-600 overflow-y-auto pr-1">
          {productsToDisplay.map((product) => (
            <div
              key={product._id}
              className="flex items-center gap-3 rounded-2xl bg-[#F5F5F5] px-3 py-3"
            >
              <GlassImage
                src={product.images?.[0]?.url}
                alt={product.name}
                containerClassName="w-[64px] h-[64px] rounded-2xl overflow-hidden flex-shrink-0"
                imageClassName="w-full h-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-[#17171B]">
                  {product.name}
                </p>
                <p className="mt-1 text-xs text-gray-500">{product.category}</p>
                <p className="mt-1 text-xs text-gray-500">
                  SKU: {product.sku || 'N/A'}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-[#FFF7E0] p-4 text-xs sm:text-sm text-[#4B5563]">
          <p className="mb-2 font-semibold">
            What happens when you delete this product?
          </p>
          <ul className="list-disc text-xs space-y-1 pl-4">
            <li>The product will be permanently removed from your inventory.</li>
            <li>Any active orders containing this product will not be affected.</li>
            <li>Product analytics and historical data will be lost.</li>
            <li>The product will no longer appear in your store.</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading || !productIds.length}
            className="w-full rounded-lg bg-[#FF3B30] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#FF3B30]/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-1/2"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-lg border border-[#FF3B30] bg-white py-3 text-sm font-semibold text-[#FF3B30] transition-colors hover:bg-red-50 sm:w-1/2"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
