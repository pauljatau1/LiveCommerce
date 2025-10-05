import { Button } from "@/Components/ui/button";
import { FilterX, ShoppingBag } from "lucide-react";

export default function OrderEmptyState({ onClear, onViewProducts }) {
  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 text-center">
      <div className="flex flex-col items-center justify-center">
        <div className="bg-slate-50 p-4 rounded-full mb-4">
          <ShoppingBag className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 mb-1">No Orders Found</h3>
        <p className="text-slate-500 text-xs mb-4">
          There are no orders matching your filters. Try adjusting your search criteria.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-slate-300 hover:bg-slate-100 text-xs"
            onClick={onClear}
          >
            <FilterX className="w-3 h-3 mr-2" />
            Clear Filters
          </Button>
          {onViewProducts && (
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white text-xs"
              onClick={onViewProducts}
            >
              <ShoppingBag className="w-3 h-3 mr-2" />
              View Products
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


