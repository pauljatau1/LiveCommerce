import { Icon } from '@iconify/react';
import { formatDate } from '@/util/helpers';
import { useNavigate } from 'react-router-dom';
import { extractPlainText } from '@/util/htmlSanitizer';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/Components/ui/dialog';
import type { ProductApiModel } from '@/types/products';
import GlassImage from '@/Components/ui/GlassImageV2';
import eyeBoldIcon from '@iconify-icons/solar/eye-bold';
import penBoldIcon from '@iconify-icons/solar/pen-bold';
import trashBinTrashBoldIcon from '@iconify-icons/solar/trash-bin-trash-bold';
import boxBoldIcon from '@iconify-icons/solar/box-bold';
import DeleteProductsConfirmDialog from './DeleteProductsConfirmDialog';
import tagPriceBoldIcon from '@iconify-icons/solar/tag-price-bold'; // Using as proxy for Units Sold icon
import EditIcon from '@/assets/icons/EditIcon';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';



interface ProductDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductApiModel | null;
}

export default function ProductDetailsModal({
  open,
  onOpenChange,
  product,
}: ProductDetailsModalProps) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index when modal opens/product changes
  useEffect(() => {
    if (open) {
      setCurrentImageIndex(0);
    }
  }, [open, product]);

  if (!product) return null;

  const images = product.images || [];
  const displayImages = images.length > 0 ? images : [{ url: '' }]; // Fallback

  // Status Badge Style
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[#DEFFEE] text-[#66CB9F]';
      case 'draft':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-red-100 text-red-600';
    }
  };

  const handleEdit = () => {
    onOpenChange(false);
    navigate(`/dashboard/products/edit-product/${product._id}`);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setCurrentImageIndex(index);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[90vw] w-full md:max-w-[85vw] h-[85vh] md:h-auto md:max-h-[90vh] p-0 overflow-y-auto md:overflow-hidden flex flex-col md:block rounded-3xl bg-white border-none shadow-xl gap-0">
            {/* Accessibility Title/Desc (Hidden visually but required) */}
            <div className="sr-only">
                <DialogTitle>Product Details</DialogTitle>
            </div>

          {/* Close Button is handled by DialogContent's default close button, but we might want to customize or ensure it's visible. 
              DialogContent usually has a close X. We'll rely on that for now or check styling. */}

          <div className="flex flex-col md:flex-row h-full  md:overflow-hidden">
            
            {/* Left Column (Desktop) / Content (Mobile) */}
            <div className='group flex-1 ' >
            <div className="p-5 md:p-8 md:h-[90vh] md:overflow-y-auto activity-feed-scrollbar order-2 md:order-1 bg-white">
              
              {/* Header Section */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#17171B]">Product Details</h2>
                <p className="text-[#888888] text-sm mt-1">Comprehensive Information about your product</p>
              </div>

              {/* Status Badge */}
              <div className="mb-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs md:text-[10px] font-bold uppercase tracking-wide ${getStatusStyle(product.status)}`}>
                  {product.status}
                </span>
              </div>

              {/* Product Name */}
              <div className='flex flex-wrap items-center justify-between '>
                <h1 className="text-xl md:text-xl max-w-[400px] truncate font-bold text-[#0BB248] mb-1">
                {product.name}
              </h1>
                <p className="text-[#718096] text-sm">Posted {formatDate(product.createdAt)}</p>
              </div>

              {/* Tags/Category (Mocked based on image if not in data) */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#718096] mb-3">
                <span>#{product.category?.split(' ').join('') || 'Category'}</span>
                <span className="bg-[#0BB2481A] text-[#0BB248] px-3 py-1 rounded-md font-bold text-sm">
                  ₦{product.price.toLocaleString()}
                </span>
              </div>

              {/* Price and Stock Row */}
              <div className="flex items-center flex-wrap gap-3 mb-6">
                <span className="text-sm font-semibold text-[#5C5F62]">
                  {product.stock} Available
                </span>
                {
                  product?.sku && <span className="text-xs text-[#718096]">SKU-{product.sku} </span>
                }
                {product.stock <= (product.productInfo?.lowStockThreshold || 5) && (
                   <span className="bg-[#F7936F26] text-[#F7936F] text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                     Low Stock
                   </span>
                )}
              </div>

              {/* Category */}
              <div className="mb-6">
                <h3 className="font-bold text-[#17171B] mb-1">Category</h3>
                <p className="text-[#718096] text-sm">{product.category}</p>
              </div>

              {/* Product Description */}
              <div className="mb-6 group">
                <h3 className="font-bold text-[#17171B] mb-1">Product Description</h3>
                <p className="text-[#718096] max-h-[200px] overflow-auto activity-feed-scrollbar  text-sm leading-relaxed">
                  {extractPlainText(product.description || 'No description available.')}
                </p>
              </div>

              {/* Mobile Image Gallery */}
              <div className="md:hidden mb-6 -mx-5 relative">
                <h3 className="font-bold mx-5 text-[#17171B] mb-1">Product Images</h3>
                <Swiper
                  modules={[Pagination]}
                  pagination={{ clickable: true }}
                  spaceBetween={0}
                  slidesPerView={1}
                  className="w-full aspect-square bg-[#F9FAFB]"
                  onSlideChange={(swiper) => setCurrentImageIndex(swiper.activeIndex)}
                  style={{
                      '--swiper-pagination-color': '#0BB248',
                      '--swiper-pagination-bullet-inactive-color': '#E2E8F0',
                      '--swiper-pagination-bullet-inactive-opacity': '1',
                      '--swiper-pagination-bullet-size': '8px',
                      '--swiper-pagination-bullet-horizontal-gap': '6px',
                  } as React.CSSProperties}
                >
                  {displayImages.map((img, index) => (
                    <SwiperSlide key={index} className="flex items-center justify-center">
                      <div className="w-full h-full p-8 flex items-center justify-center relative">
                          <GlassImage
                              src={img.url}
                              alt={`${product.name} - Image ${index + 1}`}
                              containerClassName="w-full h-full flex items-center justify-center"
                              imageClassName="max-w-full max-h-full object-contain mix-blend-multiply"
                          />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* Brand Name */}
              <div className="mb-6">
                <h3 className="font-bold text-[#17171B] mb-2">Brand Name</h3>
                <div className="flex items-center gap-3">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#17171B]">
                        {product.brand || 'GENERIC'}
                    </span>
                    <span className="bg-[#E4ECF7] text-[#505780] px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold">
                        <Icon icon={boxBoldIcon} className="w-3 h-3" />
                        {product.condition === 'new' ? 'New' : product.condition === 'fairly-used' ? 'Fairly Used' : 'Refurbished'}
                    </span>
                    {/* Mock Weight Badge as per design */}
                    <span className="bg-[#E4ECF7] text-[#505780] px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold">
                        <Icon icon="mdi:weight-kg" className="w-4 h-4" />
                        10KG
                    </span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="mb-8 border border-[#EDF2F7] rounded-2xl p-4">
                <h3 className="font-bold text-[#17171B] mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    {/* Total Views */}
                    <div>
                        <div className="w-8 h-8 rounded bg-[#10723114] flex items-center justify-center mb-2">
                             <Icon icon={eyeBoldIcon} className="text-[#107231] w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold text-[#17171B] mb-0.5">Total Views</p>
                        <p className="text-[10px] text-[#107231] font-medium">{product.stats?.views || 0} views</p>
                    </div>

                    {/* Units Sold */}
                    <div>
                        <div className="w-8 h-8 rounded bg-[#10723114] flex items-center justify-center mb-2">
                             <Icon icon={boxBoldIcon} className="text-[#107231] w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold text-[#17171B] mb-0.5">Units Sold</p>
                        <p className="text-[10px] text-[#107231] font-medium">{product.stats?.soldCount || 0} sold</p>
                    </div>

                    {/* Last Viewed */}
                    <div>
                        <p className="text-xs font-bold text-[#17171B] mb-0.5">Last Viewed</p>
                        <p className="text-[10px] text-[#107231] font-medium">{formatDate(product.stats?.lastViewed)}</p>
                    </div>

                    {/* Last Restocked */}
                    <div>
                        <p className="text-xs font-bold text-[#17171B] mb-0.5">Last Restocked</p>
                        <p className="text-[10px] text-[#107231] font-medium">{formatDate(product.stats?.lastRestocked || product.updatedAt)}</p>
                    </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-auto">
                <button
                    onClick={handleEdit}
                    className="flex-1 flex items-center justify-center gap-2 border border-[#0BB248] text-[#0BB248] py-2.5 rounded-lg font-bold text-sm hover:bg-[#0BB2480A] transition-colors"
                >
                    <EditIcon className="w-4 h-4" />
                    Edit
                </button>
                <button
                    onClick={handleDelete}
                    className="flex-1 flex items-center justify-center gap-2 border border-[#FF3B30] text-[#FF3B30] py-2.5 rounded-lg font-bold text-sm hover:bg-[#FF3B300A] transition-colors"
                >
                    <Icon icon={trashBinTrashBoldIcon} className="w-4 h-4" />
                    Delete
                </button>
              </div>

            </div>
            </div>

            {/* Right Column (Desktop) / Top Image Carousel (Mobile) */}
            <div className="w-full md:w-[40%] bg-[#F5F5F5] md:bg-[#F1F4F4] order-1 md:order-2 hidden md:flex flex-col justify-center p-4 md:p-6 relative">
                
                {/* Desktop Grid Layout */}
                <div className="hidden md:grid grid-cols-2 gap-4 h-full content-center">
                    {displayImages.slice(0, 4).map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-solid border-gray-300 shadow-sm">
                             <GlassImage
                                src={img.url}
                                alt={`${product.name} ${idx + 1}`}
                                containerClassName="w-full h-full"
                                imageClassName="w-full h-full object-cover"
                             />
                        </div>
                    ))}
                    {/* If fewer than 4 images, fill with empty or placeholder if needed, but flex/grid handles it ok */}
                </div>

                {/* Mobile Carousel Layout */}
                <div className="md:hidden w-full relative">
                    <div 
                        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-4"
                        onScroll={handleScroll}
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {displayImages.map((img, idx) => (
                             <div key={idx} className="flex-shrink-0 w-full snap-center">
                                 <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-sm mx-auto max-w-[300px]">
                                     <GlassImage
                                        src={img.url}
                                        alt={`${product.name} ${idx + 1}`}
                                        containerClassName="w-full h-full"
                                        imageClassName="w-full h-full object-cover"
                                     />
                                 </div>
                             </div>
                        ))}
                    </div>

                    {/* Pagination Dots */}
                    {displayImages.length > 1 && (
                        <div className="flex justify-center gap-1.5 mt-2">
                            {displayImages.map((_, idx) => (
                                <div 
                                    key={idx} 
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-[#0BB248]' : 'bg-gray-300'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteProductsConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        productIds={[product._id]}
        products={[product]}
        onDeleted={() => {
            onOpenChange(false); // Close details modal after delete
        }}
      />
    </>
  );
}
