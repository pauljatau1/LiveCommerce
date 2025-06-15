import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSellerBlips, fetchSellerProducts } from '../../Redux/Slices/ProductSlice';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../Components/ui/pagination';
import Loader from '../../Components/Loader';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import BlipDetails from './BlipDetails';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../Components/ui/dialog';
import { Icon } from '@iconify/react';
import { Progress } from '../../Components/ui/progress';
import { CircularProgress } from '@mui/material';
import axios from 'axios';
import { toast } from 'sonner';
import { BASE_URL } from '../../Constants/Server';

const Blips = () => {
  const dispatch = useDispatch();
  const { blips, isLoadingBlips, blipsPagination, products } = useSelector((state) => state.product);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedBlip, setSelectedBlip] = useState(null);
  const [isBlipModalOpen, setIsBlipModalOpen] = useState(false);
  const [isAddBlipModalOpen, setIsAddBlipModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [blipVideos, setBlipVideos] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [productsForBlip, setProductsForBlip] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const fileInputRef = React.useRef(null);
  const [productsWithBlips, setProductsWithBlips] = useState({});
  const [productPage, setProductPage] = useState(1);
  const [productLimit] = useState(12);
  const [totalProductPages, setTotalProductPages] = useState(1);
  const [productFilter, setProductFilter] = useState('all'); // 'all', 'with-blips', 'without-blips'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Function to safely format dates
  const safeFormatDate = (dateString) => {
    try {
      if (!dateString) return 'Unknown date';
      const date = new Date(dateString);
      // Check if date is valid
      return isNaN(date.getTime()) ? 'Unknown date' : formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };

  useEffect(() => {
    dispatch(fetchSellerBlips({ page: currentPage, limit: itemsPerPage }));
  }, [dispatch, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewBlipDetails = (blip) => {
    console.log('Selected blip for details view:', blip);
    
    // Ensure we have valid IDs
    const productId = blip.productId;
    
    // Find the blipId - it might be in different fields
    let blipId = blip.blipId;
    if (!blipId) {
      if (blip._id) {
        blipId = blip._id;
      } else if (blip.id) {
        blipId = blip.id;
      }
    }
    
    console.log(`Opening modal with productId: ${productId}, blipId: ${blipId}`);
    
    if (!productId || !blipId) {
      console.error('Missing required IDs. ProductId:', productId, 'BlipId:', blipId);
      return;
    }
    
    setSelectedBlip({
      ...blip,
      productId,
      blipId
    });
    setIsBlipModalOpen(true);
  };

  const handleCloseBlipModal = () => {
    setIsBlipModalOpen(false);
    setSelectedBlip(null);
  };

  const handleOpenAddBlipModal = async () => {
    setIsLoadingProducts(true);
    fetchProductsForBlip(1);
    setIsAddBlipModalOpen(true);
  };

  const fetchProductsForBlip = async (page = productPage, query = searchQuery) => {
    setIsLoadingProducts(true);
    try {
      // Fetch active products for the seller
      const seller = JSON.parse(localStorage.getItem('seller'));
      const response = await axios.get(`${BASE_URL}/products/seller/${seller._id}`, {
        params: {
          status: 'active',
          page: page,
          limit: productLimit,
          search: query || undefined
        }
      });
      
      if (response.status === 200 && response.data.products) {
        setProductsForBlip(response.data.products);
        setTotalProductPages(response.data.totalPages || 1);
        
        // Now fetch which products have blips
        const productIds = response.data.products.map(p => p._id);
        await fetchProductsBlipStatus(productIds);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products', {
        description: "Please try again",
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchProductsBlipStatus = async (productIds) => {
    if (!productIds.length) return;
    
    try {
      const sellerToken = localStorage.getItem('sellerToken');
      const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null };
      
      // Create a map to store which products have blips
      const blipStatusMap = {};
      
      // Fetch each product's blips status
      await Promise.all(productIds.map(async (productId) => {
        try {
          const response = await axios.get(`${BASE_URL}/products/${productId}`, {
            headers: {
              Authorization: `Bearer ${tokenData.data}`
            }
          });
          
          if (response.status === 200 && response.data) {
            // Check if the product has blips
            const hasBlips = response.data.blips && Array.isArray(response.data.blips) && response.data.blips.length > 0;
            blipStatusMap[productId] = {
              hasBlips,
              blipCount: hasBlips ? response.data.blips.length : 0
            };
          }
        } catch (error) {
          console.error(`Error fetching blips for product ${productId}:`, error);
          blipStatusMap[productId] = { hasBlips: false, blipCount: 0 };
        }
      }));
      
      setProductsWithBlips(blipStatusMap);
    } catch (error) {
      console.error('Error fetching product blip status:', error);
    }
  };

  const handleProductPageChange = (page) => {
    setProductPage(page);
    fetchProductsForBlip(page);
  };

  const handleProductFilterChange = (filter) => {
    setProductFilter(filter);
  };

  const getFilteredProducts = () => {
    if (productFilter === 'all') {
      return productsForBlip;
    } else if (productFilter === 'with-blips') {
      return productsForBlip.filter(product => 
        productsWithBlips[product._id]?.hasBlips
      );
    } else if (productFilter === 'without-blips') {
      return productsForBlip.filter(product => 
        !productsWithBlips[product._id]?.hasBlips
      );
    }
    return productsForBlip;
  };

  const handleCloseAddBlipModal = () => {
    setIsAddBlipModalOpen(false);
    setSelectedProduct(null);
    setBlipVideos([]);
    setPreviewUrls([]);
    setUploadProgress(0);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
  };

  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const newPreviewUrls = [];
    
    // Validate each file
    files.forEach(file => {
      // Check if file is a video
      if (!file.type.startsWith('video/')) {
        toast.error(`${file.name} is not a video file`);
        return;
      }
      
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 50MB)`);
        return;
      }

      validFiles.push(file);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      newPreviewUrls.push(objectUrl);
    });

    setBlipVideos(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const handleRemoveFile = (index) => {
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    
    // Remove the file and preview
    setBlipVideos(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product first');
      return;
    }
    
    if (blipVideos.length === 0) {
      toast.error('Please select at least one video to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      blipVideos.forEach(file => {
        formData.append('blipVideos', file);
      });
      
      const sellerToken = localStorage.getItem('sellerToken');
      const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null };
      
      // Create upload request with progress tracking
      const response = await axios.post(
        `${BASE_URL}/products/${selectedProduct._id}/blips`, 
        formData, 
        {
          headers: {
            Authorization: `Bearer ${tokenData.data}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      if (response.status === 201) {
        toast.success(`${blipVideos.length} blip video${blipVideos.length > 1 ? 's' : ''} uploaded successfully`);
        
        // Clear the selected files
        setBlipVideos([]);
        setPreviewUrls([]);
        setSelectedProduct(null);
        
        // Refresh the blips list
        dispatch(fetchSellerBlips({ page: 1, limit: itemsPerPage }));
        setCurrentPage(1);
        
        // Close the modal
        setIsAddBlipModalOpen(false);
      }
    } catch (error) {
      console.error('Error uploading blips:', error);
      toast.error('Failed to upload blip videos', {
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set a new timeout to delay the search
    const timeout = setTimeout(() => {
      setProductPage(1); // Reset to first page
      fetchProductsForBlip(1, query);
    }, 500); // 500ms delay
    
    setSearchTimeout(timeout);
  };

  // Generate pagination links
  const renderPaginationLinks = () => {
    const { totalPages } = blipsPagination;
    const links = [];

    // Start with Previous button
    links.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        />
      </PaginationItem>
    );

    // First page
    links.push(
      <PaginationItem key={1}>
        <PaginationLink
          isActive={currentPage === 1}
          onClick={() => handlePageChange(1)}
          className="cursor-pointer"
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Ellipsis if needed - will be hidden on mobile with CSS
    if (currentPage > 3) {
      links.push(
        <PaginationItem key="ellipsis-1" className="hidden sm:block">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Current page when not 1 or last (on mobile)
    if (currentPage > 1 && currentPage < totalPages) {
      links.push(
        <PaginationItem key={`current-${currentPage}`} className="sm:hidden">
          <PaginationLink
            isActive={true}
            onClick={() => handlePageChange(currentPage)}
            className="cursor-pointer"
          >
            {currentPage}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Pages around current page (hidden on mobile)
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages || i === currentPage) continue; // Skip first/last/current page
      links.push(
        <PaginationItem key={i} className="hidden sm:block">
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => handlePageChange(i)}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Ellipsis if needed - will be hidden on mobile with CSS
    if (currentPage < totalPages - 2) {
      links.push(
        <PaginationItem key="ellipsis-2" className="hidden sm:block">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Last page if there are multiple pages
    if (totalPages > 1) {
      links.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            isActive={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // End with Next button
    links.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
          className={currentPage === totalPages || totalPages === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        />
      </PaginationItem>
    );

    return links;
  };

  if (isLoadingBlips && blips.length === 0) {
    return <Loader />;
  }

  // Mobile card view for each blip
  const renderMobileCard = (blip) => {
    return (
    <div key={blip._id} className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex items-center mb-3">
        <img 
          src={blip.thumbnail} 
          alt={blip.productName}
          className="h-16 w-16 object-cover rounded mr-3 cursor-pointer"
          onClick={() => handleViewBlipDetails(blip)}
        />
        <div className="flex-1 min-w-0">
          <Link to={`/dashboard/edit-product/${blip.productId}`} className="text-blue-600 hover:underline font-medium block truncate">
            {blip.productName}
          </Link>
          <div className="mt-1 flex items-center justify-between">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              blip.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {blip.status}
            </span>
            <span className="text-sm">₦{blip.price.toLocaleString('en-NG')}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <span className="text-gray-500">Stock:</span> 
          <span className="font-medium ml-1">{blip.stock}</span>
        </div>
        <div>
          <span className="text-gray-500">Created:</span> 
          <span className="font-medium ml-1">{safeFormatDate(blip.createdAt)}</span>
        </div>
        <div className="col-span-2 flex space-x-4 mt-1">
          <span className="text-xs flex items-center"><span className="mr-1">❤️</span> {blip.blipEngagement?.likesCount || 0}</span>
          <span className="text-xs flex items-center"><span className="mr-1">💬</span> {blip.blipEngagement?.commentsCount || 0}</span>
          <span className="text-xs flex items-center"><span className="mr-1">👁️</span> {blip.blipEngagement?.viewCount || 0}</span>
        </div>
      </div>
      
      <div className="mt-2">
        <button
          onClick={() => handleViewBlipDetails(blip)}
          className="w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-sm font-medium text-center transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  )};

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Product Blips</h1>
        <button 
          onClick={handleOpenAddBlipModal}
          className="bg-[#17171B] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
        >
          <Icon icon="tabler:plus" className="mr-1" />
          Add Blip
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {blips.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-gray-600">You don't have any product blips yet.</p>
            <button 
              onClick={handleOpenAddBlipModal}
              className="mt-4 bg-[#17171B] text-white px-6 py-2 rounded-md text-sm font-medium"
            >
              Add Your First Blip
            </button>
          </div>
        ) : (
          <>
            {/* Mobile view (card layout) */}
            <div className="block md:hidden">
              {blips.map(renderMobileCard)}
            </div>
            
            {/* Desktop view (table layout) */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thumbnail
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Engagement
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {blips.map((blip) => (
                      <tr key={blip._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleViewBlipDetails(blip)}>
                          <img 
                            src={blip.thumbnail} 
                            alt={blip.productName}
                            className="h-16 w-16 object-cover rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link to={`/dashboard/edit-product/${blip.productId}`} className="text-blue-600 hover:underline">
                            {blip.productName.length > 30 ? `${blip.productName.substring(0, 30)}...` : blip.productName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          ₦{blip.price.toLocaleString('en-NG')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {blip.stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            blip.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {blip.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs">❤️ {blip.blipEngagement?.likesCount || 0}</span>
                            <span className="text-xs">💬 {blip.blipEngagement?.commentsCount || 0}</span>
                            <span className="text-xs">👁️ {blip.blipEngagement?.viewCount || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                          {safeFormatDate(blip.createdAt) || 'Unknown date'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewBlipDetails(blip)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination - make it more responsive */}
            {blipsPagination.totalPages > 1 && (
              <div className="py-4 overflow-x-auto">
                <Pagination>
                  <PaginationContent className="flex-wrap justify-center">
                    {renderPaginationLinks()}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* Blip Details Modal */}
      {selectedBlip && (
        <BlipDetails
          isOpen={isBlipModalOpen}
          onClose={handleCloseBlipModal}
          productId={selectedBlip.productId}
          blipId={selectedBlip.blipId || selectedBlip._id}
        />
      )}

      {/* Add Blip Modal */}
      <Dialog open={isAddBlipModalOpen} onOpenChange={handleCloseAddBlipModal}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-center sm:text-left">Add New Blip</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Product Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Select Product</label>
                <div className="flex gap-2 text-xs">
                  <button 
                    onClick={() => handleProductFilterChange('all')}
                    className={`px-2 py-1 rounded ${productFilter === 'all' ? 'bg-[#17171B] text-white' : 'bg-gray-100'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => handleProductFilterChange('with-blips')}
                    className={`px-2 py-1 rounded ${productFilter === 'with-blips' ? 'bg-[#17171B] text-white' : 'bg-gray-100'}`}
                  >
                    With Blips
                  </button>
                  <button 
                    onClick={() => handleProductFilterChange('without-blips')}
                    className={`px-2 py-1 rounded ${productFilter === 'without-blips' ? 'bg-[#17171B] text-white' : 'bg-gray-100'}`}
                  >
                    No Blips
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Icon icon="heroicons:magnifying-glass" className="w-4 h-4 text-gray-500" />
                </div>
                <input
                  type="text"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                  placeholder="Search products by name..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      fetchProductsForBlip(1, '');
                    }}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    <Icon icon="heroicons:x-mark" className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>

              {isLoadingProducts ? (
                <div className="flex justify-center py-4">
                  <CircularProgress size={24} />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                  {getFilteredProducts().length === 0 ? (
                    <p className="col-span-full text-center py-4 text-gray-500">
                      {searchQuery 
                        ? `No products found matching "${searchQuery}"` 
                        : productFilter !== 'all' 
                          ? `No products ${productFilter === 'with-blips' ? 'with' : 'without'} blips found` 
                          : 'No active products found'}
                    </p>
                  ) : (
                    getFilteredProducts().map(product => (
                      <div 
                        key={product._id}
                        onClick={() => handleProductSelect(product)}
                        className={`border rounded-lg p-3 flex items-center gap-3 cursor-pointer transition-all
                          ${selectedProduct?._id === product._id 
                            ? 'border-[#17171B] bg-[#17171B]/5' 
                            : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className="h-12 w-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.images && product.images[0] && product.images[0].url ? (
                            <img 
                              src={product.images[0].url} 
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/80';
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                              <Icon icon="solar:gallery-broken" className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="overflow-hidden flex-1">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">₦{product.price.toLocaleString('en-NG')}</p>
                          {productsWithBlips[product._id] && (
                            <div className="mt-1 flex items-center">
                              {productsWithBlips[product._id].hasBlips ? (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  {productsWithBlips[product._id].blipCount} blip{productsWithBlips[product._id].blipCount !== 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                  No blips
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Products Pagination */}
              {totalProductPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => productPage > 1 && handleProductPageChange(productPage - 1)}
                      disabled={productPage === 1 || isLoadingProducts}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50"
                    >
                      <Icon icon="heroicons:chevron-left" className="w-4 h-4" />
                    </button>
                    
                    <span className="text-sm px-2">
                      Page {productPage} of {totalProductPages}
                    </span>
                    
                    <button
                      onClick={() => productPage < totalProductPages && handleProductPageChange(productPage + 1)}
                      disabled={productPage === totalProductPages || isLoadingProducts}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50"
                    >
                      <Icon icon="heroicons:chevron-right" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Selection status message */}
              <div className="mt-3 p-2 rounded bg-blue-50 border border-blue-100">
                <p className="text-sm text-blue-700 flex items-center">
                  <Icon icon="heroicons:information-circle" className="w-5 h-5 mr-1" />
                  {selectedProduct 
                    ? `Selected: ${selectedProduct.name}` 
                    : "Please select a product before uploading videos"}
                </p>
              </div>
            </div>

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Upload Blip Videos (Max 5)</label>
              
              <div 
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all
                  ${!selectedProduct ? 'opacity-50 pointer-events-none' : ''} 
                  ${blipVideos.length > 0 ? 'border-[#17171B]' : 'border-gray-300'}`}
                onClick={handleTriggerFileInput}
              >
                <input 
                  type="file" 
                  accept="video/*"
                  className="hidden" 
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  multiple
                  disabled={!selectedProduct}
                />
                
                <div className="text-center space-y-3">
                  <Icon icon="solar:video-frame-bold" className="w-12 h-12 text-gray-400 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">
                      {selectedProduct 
                        ? "Click to select video files" 
                        : "Select a product first"}
                    </p>
                    <p className="text-xs text-gray-500">MP4, MOV, or WebM up to 50MB each</p>
                    <p className="text-xs text-gray-500">You can add up to 5 blips per product</p>
                  </div>
                </div>
              </div>

              {/* Preview selected videos */}
              {blipVideos.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium mb-2">Selected Videos ({blipVideos.length})</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {blipVideos.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden">
                          <video 
                            src={previewUrls[index]} 
                            className="w-full h-full object-cover" 
                            controls={false}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                        >
                          <Icon icon="heroicons:x-mark" className="w-4 h-4" />
                        </button>
                        <p className="mt-2 text-xs text-gray-500 truncate">
                          {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {isUploading && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Uploading {blipVideos.length} video{blipVideos.length > 1 ? 's' : ''}...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseAddBlipModal}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50 font-medium transition-all"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedProduct || blipVideos.length === 0 || isUploading}
                className="px-6 py-3 bg-[#17171B] text-white rounded-lg hover:bg-[#17171B]/90 disabled:opacity-50 font-medium transition-all flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <CircularProgress size={20} color="inherit" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="solar:upload-bold" className="w-5 h-5" />
                    <span>Upload {blipVideos.length} Blip{blipVideos.length > 1 ? 's' : ''}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Blips; 