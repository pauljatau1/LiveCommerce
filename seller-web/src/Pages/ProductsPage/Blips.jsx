import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSellerBlips } from '../../Redux/Slices/ProductSlice';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../Components/ui/pagination';
import Loader from '../../Components/Loader';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import BlipDetails from './BlipDetails';

const Blips = () => {
  const dispatch = useDispatch();
  const { blips, isLoadingBlips, blipsPagination } = useSelector((state) => state.product);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedBlip, setSelectedBlip] = useState(null);
  const [isBlipModalOpen, setIsBlipModalOpen] = useState(false);

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
  const renderMobileCard = (blip) => (
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
          <span className="font-medium ml-1">{formatDistanceToNow(new Date(blip.createdAt), { addSuffix: true })}</span>
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
  );

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Product Blips</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {blips.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-gray-600">You don't have any product blips yet.</p>
            <p className="text-sm text-gray-500 mt-2">Product blips appear here when you create them in the mobile app.</p>
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
                            {blip.productName}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDistanceToNow(new Date(blip.createdAt), { addSuffix: true })}
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
    </div>
  );
};

export default Blips; 