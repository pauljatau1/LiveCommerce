import { Icon } from "@iconify/react";
import { Progress } from "@/Components/ui/progressv2";
import { useDispatch } from "react-redux";
import { useMutation, useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { blipService } from "@/services/blipService";
import { useAuthContext } from "@/Hooks/useAuthContextV2";
import { useNotification } from "@/Hooks/useNotification";
import { CircularProgress } from "@mui/material";
import { fetchSellerBlips } from "@/Redux/Slices/ProductSlice";
import { extractAxiosErrorMessage } from "@/util/helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductApiModel } from "@/types/products";
import GlassImage from "@/Components/ui/GlassImageV2";
import UploadIcon from "@/assets/icons/UploadIcon";
import { Skeleton } from "@/Components/shared/Skeleton";

type CreateBlipModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CreateBlipModal({ open, onOpenChange }: CreateBlipModalProps) {
  const dispatch = useDispatch();
  const { seller } = useAuthContext();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const [productPage, setProductPage] = useState(1);
  const [productLimit] = useState(10);
  const [selectedProduct, setSelectedProduct] = useState<ProductApiModel | null>(null);

  const [blipVideos, setBlipVideos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const { data: productsData, isLoading: isLoadingProducts, refetch } = useQuery({
    queryKey: ["seller-products", seller?._id, productPage, productLimit],
    queryFn: () =>
      blipService.fetchSellerProducts({
        sellerId: seller!._id,
        page: productPage,
        limit: productLimit,
      }),
    enabled: !!seller?._id && open,
    placeholderData: keepPreviousData,
  });

  const productsForBlip = productsData?.products || [];
  const totalProductPages = productsData?.totalPages || 1;

  const { data: existingBlipsCount = 0 } = useQuery({
    queryKey: ["product-blips-count", selectedProduct?._id],
    queryFn: () => blipService.fetchProductBlipsCount(selectedProduct!._id),
    enabled: !!selectedProduct?._id,
  });

  const availableSlots = Math.max(0, 5 - existingBlipsCount);

  const resetLocalFiles = useCallback(() => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setBlipVideos([]);
    setPreviewUrls([]);
    setUploadProgress(0);
    setIsDragging(false);
  }, [previewUrls]);

  useEffect(() => {
    if (open) {
      setProductPage(1);
      setSelectedProduct(null);
      resetLocalFiles();
      return;
    }
    resetLocalFiles();
  }, [open]);

  const filteredProducts = useMemo(() => {
    return productsForBlip;
  }, [productsForBlip]);

  const addFiles = (files: File[]) => {
    if (!selectedProduct) {
      showNotification("Select a product before uploading videos", "warning");
      return;
    }

    if (availableSlots <= 0) {
      showNotification("You have reached the maximum of 5 blips for this product", "warning");
      return;
    }

    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    files.forEach((file) => {
      if (!file.type.startsWith("video/")) {
        showNotification(`${file.name} is not a video file`, "warning");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        showNotification(`${file.name} is too large (max 50MB)`, "warning");
        return;
      }

      validFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    });

    const remainingCapacity = availableSlots - blipVideos.length;
    const filesToAdd = validFiles.slice(0, Math.max(0, remainingCapacity));
    const previewsToAdd = newPreviewUrls.slice(0, Math.max(0, remainingCapacity));

    if (filesToAdd.length < validFiles.length) {
      newPreviewUrls.slice(filesToAdd.length).forEach((url) => URL.revokeObjectURL(url));
      showNotification(`You can only add ${availableSlots} blip${availableSlots === 1 ? "" : "s"} for this product`, "warning");
    }

    setBlipVideos((prev) => [...prev, ...filesToAdd]);
    setPreviewUrls((prev) => [...prev, ...previewsToAdd]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    addFiles(files);
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    const url = previewUrls[index];
    if (url) URL.revokeObjectURL(url);
    setBlipVideos((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct?._id) {
        throw new Error("Please select a product first");
      }
      if (blipVideos.length === 0) {
        throw new Error("Please select at least one video to upload");
      }

      setUploadProgress(0);
      return blipService.uploadProductBlips({
        productId: selectedProduct._id,
        blipVideos,
        onUploadProgress: (event) => {
          const total = event.total ?? 0;
          if (total <= 0) return;
          const percentCompleted = Math.round((event.loaded * 100) / total);
          setUploadProgress(percentCompleted);
        },
      });
    },
    onSuccess: () => {
      showNotification(
        `${blipVideos.length} blip video${blipVideos.length > 1 ? "s" : ""} uploaded successfully`,
        "information"
      );
      resetLocalFiles();
      if (selectedProduct?._id) {
        queryClient.invalidateQueries({ queryKey: ["product-blips-count", selectedProduct._id] });
        refetch()
      }
      dispatch((fetchSellerBlips as any)({ page: 1, limit: 10 }));
      onOpenChange(false);
    },
    onError: (error) => {
      showNotification(extractAxiosErrorMessage(error) || "Failed to upload blip videos", "error");
      console.log('blip upload failed', error)
    },
  });

  const canPickVideos = !!selectedProduct && availableSlots > 0 && !uploadMutation.isPending;
  const canUpload = !!selectedProduct && blipVideos.length > 0 && !uploadMutation.isPending;

  const handleTriggerFileInput = () => {
    if (!canPickVideos) return;
    fileInputRef.current?.click();
  };

  const handleClose = (nextOpen: boolean) => {
    if (uploadMutation.isPending) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[520px] max-h-[80vh] rounded-xl overflow-auto custom-scrollbar  p-0">
        <div className="p-5 sm:p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-LG sm:text-2xl font-bold text-[#272D30]">Manage Product Blips</DialogTitle>
          </DialogHeader>

          <div className="mt-4 rounded-md border border-[#C7E0FF] bg-[#EAF3FF] px-3 py-3 flex gap-2">
            <Icon icon="heroicons:information-circle-solid" className="w-5 h-5 text-[#2563EB] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#1E3A8A]">
              Use a high-resolution video to make your products stand out and boost sales.
            </p>
          </div>

          <div className="flex items-start bg-[#F4F4F5] p-2 mt-2 rounded-lg gap-3">
            <div className="h-[65px] w-[89px] rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
              {selectedProduct?.images?.[0]?.url ? (
                <GlassImage
                  src={selectedProduct.images[0].url as string}
                  alt={selectedProduct.name}
                  containerClassName="h-full w-full object-cover"
                  imageClassName="h-full w-full object-cover "

                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400">
                  <Icon icon="solar:gallery-broken" className="w-6 h-6" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold max-w-[200px] text-sm text-[#17171B] truncate">
                {selectedProduct ? selectedProduct.name : "Select a product"}
              </p>
              <p className="text-xs text-[#6B7280]">
                {selectedProduct ? selectedProduct.category : "Choose an active product to upload blips for"}
              </p>
              <p className="text-xs bg-gray-200 w-fit py-[4px] px-[8px] rounded-full text-[#6B7280] mt-1">
                {existingBlipsCount > 0 ? `${existingBlipsCount}/5 Blips created` : "No Blips created"}
              </p>
            </div>
          </div>
          <h4 className="font-semibold mt-2 text-sm text-[#686A6C]">Active Products</h4>
          <div className="mt-4 rounded-lg bg-[#F4F4F5] p-4">
            <div className="mt-4 group">
              {isLoadingProducts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-hidden">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-full border border-[#E5E7EB] rounded-lg p-3 flex items-center gap-3"
                    >
                      <Skeleton className="h-10 w-10 rounded-md flex-shrink-0" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-3 w-1/2 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto activity-feed-scrollbar ">
                  {filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      className={`w-full text-left border rounded-lg p-3 flex items-center gap-3 transition-all
                        ${selectedProduct?._id === product._id ? "border-[#0BB248] bg-[#0BB2480D]" : "border-[#E5E7EB] hover:border-[#D1D5DB]"}`}
                    >
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                        {product.images?.[0]?.url ? (
                          <img src={product.images[0].url as string} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400">
                            <Icon icon="solar:gallery-broken" className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#17171B] truncate">{product.name}</p>
                        <p className="text-xs text-[#6B7280] truncate">{product.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {totalProductPages > 1 && (
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                    disabled={productPage === 1 || isLoadingProducts}
                    className="px-3 py-1 border border-gray-400 rounded text-xs text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-[#6B7280]">
                    Page {productPage} of {totalProductPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setProductPage((p) => Math.min(totalProductPages, p + 1))}
                    disabled={productPage === totalProductPages || isLoadingProducts}
                    className="px-3 py-1 border border-gray-400 rounded text-xs text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <h4 className="font-semibold text-sm text-[#686A6C]">Add New Blips</h4>
            <div className="px-3 py-1 rounded-full bg-[#E1E2E2] border border-[#E5E7EB] text-xs font-normal text-[#202025]">
              {existingBlipsCount}/5
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={handleTriggerFileInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleTriggerFileInput();
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (canPickVideos) setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (canPickVideos) setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              if (!canPickVideos) return;
              const files = Array.from(e.dataTransfer.files ?? []);
              addFiles(files);
            }}
            className={`mt-3 rounded-xl border p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all
              ${!canPickVideos ? "opacity-50 cursor-not-allowed" : ""}
              ${isDragging ? "border-[#0BB248] bg-[#0BB2480D]" : "border-[#E5E7EB] bg-[#F4F4F5]"}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
              disabled={!canPickVideos}
            />

            <div className="h-16 w-16 rounded-2xl bg-gray-200 flex items-center justify-center">
              <Icon icon="tabler:plus" className="w-7 h-7 text-[#17171B]" />
            </div>

            <p className="mt-5 text-base sm:text-lg font-bold text-[#17171B]">Upload Blip Video</p>
            <p className="mt-2 text-xs lg:text-sm text-[#6B7280] max-w-[320px]">
              {selectedProduct ? "You can Upload Up To 5 Videos. Mp4, MOV or WebM up to 50MB" : "Select a product first to upload up to 5 blip videos"}
            </p>
          </div>

          {blipVideos.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-[#0BB248]">Selected Videos ({blipVideos.length})</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blipVideos.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="border border-[#E5E7EB] rounded-lg p-3 bg-white">
                    <div className="relative rounded-md overflow-hidden bg-black">
                      <video src={previewUrls[index]} className="w-full aspect-[9/16] object-cover" controls />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute bottom-2 right-2 bg-white/90 rounded p-1 hover:bg-white"
                        aria-label="Remove video"
                      >
                        <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4 text-[#EF4444]" />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-[#6B7280] truncate">
                      Added on {new Date().toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadMutation.isPending && (
            <div className="space-y-2 mt-5">
              <div className="flex justify-between text-sm">
                <span>Uploading {blipVideos.length} video{blipVideos.length > 1 ? "s" : ""}...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2 text-[#0BB248]" />
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={uploadMutation.isPending}
            className="min-w-[120px] h-[40px] px-4 border border-[#0BB248] text-[#0BB248] rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => uploadMutation.mutate()}
            disabled={!canUpload}
            className="min-w-[140px] h-[40px] px-4 bg-[#0BB248] text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploadMutation.isPending ? (
              <>
                <CircularProgress size={18} color="inherit" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadIcon className="w-3 h-3" />
                <span>
                  Upload {blipVideos.length || 1} Blip{(blipVideos.length || 1) > 1 ? "s" : ""}
                </span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
