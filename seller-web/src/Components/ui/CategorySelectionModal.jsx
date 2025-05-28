import { useState, useEffect } from 'react';
import { Icon } from "@iconify/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog";
import { Button } from "./button";
import { Badge } from "./badge";
import { ScrollArea } from "./scroll-area";
import PropTypes from 'prop-types';

// Add Skeleton component
const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
      {...props}
    />
  );
};

Skeleton.propTypes = {
  className: PropTypes.string
};

const CategorySelectionModal = ({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  selectedSubCategory,
  onApply,
  isSearching,
  searchResults,
  categorySearchQuery,
  setCategorySearchQuery,
  getSubCategories,
  loading
}) => {
  const [tempSelectedCategory, setTempSelectedCategory] = useState(selectedCategory);
  const [tempSelectedSubCategory, setTempSelectedSubCategory] = useState(selectedSubCategory);
  const [activeTab, setActiveTab] = useState('categories');
  const [subCategorySearchQuery, setSubCategorySearchQuery] = useState('');
  const [filteredSubCategories, setFilteredSubCategories] = useState([]);

  // Reset temp selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempSelectedCategory(selectedCategory);
      setTempSelectedSubCategory(selectedSubCategory);
      setActiveTab(selectedCategory ? 'subcategories' : 'categories');
      setSubCategorySearchQuery('');
    }
  }, [isOpen, selectedCategory, selectedSubCategory]);

  // Filter subcategories based on search query
  useEffect(() => {
    if (!tempSelectedCategory || !subCategorySearchQuery.trim()) {
      setFilteredSubCategories(getSubCategories(tempSelectedCategory));
      return;
    }

    const query = subCategorySearchQuery.toLowerCase();
    const filtered = getSubCategories(tempSelectedCategory).filter(
      subCat => subCat.name.toLowerCase().includes(query)
    );
    setFilteredSubCategories(filtered);
  }, [tempSelectedCategory, subCategorySearchQuery, getSubCategories]);

  const handleApply = () => {
    onApply(tempSelectedCategory, tempSelectedSubCategory);
    onClose();
  };

  const handleCategorySelect = (categoryName) => {
    setTempSelectedCategory(categoryName);
    setTempSelectedSubCategory('');
    setActiveTab('subcategories');
    setSubCategorySearchQuery('');
    setCategorySearchQuery('');
  };

  const handleSubCategorySelect = (subCategoryName) => {
    setTempSelectedSubCategory(subCategoryName);
  };

  const handleSearchCategorySelect = (category, subCategory = null) => {
    setTempSelectedCategory(category);
    setCategorySearchQuery('');
    
    if (subCategory) {
      setTempSelectedSubCategory(subCategory);
    } else {
      setTempSelectedSubCategory('');
    }
    
    setActiveTab('subcategories');
  };

  const clearAllSelections = () => {
    setTempSelectedCategory('');
    setTempSelectedSubCategory('');
    setCategorySearchQuery('');
    setSubCategorySearchQuery('');
    setActiveTab('categories');
  };

  const clearCategorySelection = () => {
    setTempSelectedCategory('');
    setTempSelectedSubCategory('');
    setActiveTab('categories');
  };

  const clearSubCategorySelection = () => {
    setTempSelectedSubCategory('');
  };

  const clearSearch = () => {
    if (activeTab === 'categories') {
      setCategorySearchQuery('');
    } else {
      setSubCategorySearchQuery('');
    }
  };

  // Determine search placeholder based on active tab
  const getSearchPlaceholder = () => {
    if (activeTab === 'categories' || !tempSelectedCategory) {
      return "Search categories...";
    }
    return `Search subcategories in ${tempSelectedCategory}...`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[800px] w-[90vw] p-0 max-h-[85vh] flex flex-col bg-[#FAFAFA]">
        <DialogHeader className="px-6 pt-6 pb-2 border-b bg-white">
          <DialogTitle className="text-xl font-semibold text-[#17171B]">
            {activeTab === 'categories' ? 'Select Category' : 
             tempSelectedCategory ? `Select sub-category for ${tempSelectedCategory}` : 'Select Category'}
          </DialogTitle>
          <div className="mt-4 relative">
            <div className="relative">
              <input
                type="text"
                value={activeTab === 'categories' ? categorySearchQuery : subCategorySearchQuery}
                onChange={(e) => {
                  if (activeTab === 'categories') {
                    setCategorySearchQuery(e.target.value);
                  } else {
                    setSubCategorySearchQuery(e.target.value);
                  }
                }}
                placeholder={getSearchPlaceholder()}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-full text-sm outline-none focus:border-[#0BB248] focus:ring-1 focus:ring-[#0BB248]/20 pl-10 bg-[#F9FAFB] shadow-sm"
              />
              <Icon 
                icon="heroicons:magnifying-glass" 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" 
              />
              {((activeTab === 'categories' && isSearching) || 
                (activeTab === 'subcategories' && subCategorySearchQuery && filteredSubCategories.length === 0)) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icon icon="eos-icons:loading" className="w-5 h-5 text-[#0BB248] animate-spin" />
                </div>
              )}
              {((activeTab === 'categories' && categorySearchQuery) || 
                (activeTab === 'subcategories' && subCategorySearchQuery)) && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-gray-100 rounded-full p-1"
                >
                  <Icon icon="heroicons:x-mark" className="w-5 h-5 text-[#6B7280]" />
                </button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Selection Breadcrumb */}
        <div className="px-6 py-3 border-b bg-[#F3F4F6] flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap">
            <Button 
              variant="ghost" 
              className={`h-8 px-3 rounded-full text-sm ${activeTab === 'categories' ? 'bg-[#0BB248]/10 text-[#0BB248] hover:bg-[#0BB248]/20' : 'text-[#4B5563] hover:bg-gray-100'}`}
              onClick={() => {
                setActiveTab('categories');
                setCategorySearchQuery('');
              }}
            >
              Categories
            </Button>
            
            {tempSelectedCategory && (
              <>
                <Icon icon="heroicons:chevron-right" className="w-4 h-4 text-[#9CA3AF]" />
                <Button 
                  variant="ghost"
                  className={`h-8 px-3 rounded-full text-sm ${activeTab === 'subcategories' ? 'bg-[#0BB248]/10 text-[#0BB248] hover:bg-[#0BB248]/20 hover:text-[#0BB248]' : 'text-[#4B5563] hover:bg-gray-100'}`}
                  onClick={() => {
                    setActiveTab('subcategories');
                    setSubCategorySearchQuery('');
                  }}
                >
                  {tempSelectedCategory}
                  {tempSelectedSubCategory ? ' / ' + tempSelectedSubCategory : ''}
                </Button>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {tempSelectedSubCategory && (
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 px-2 text-xs text-[#6B7280] hover:text-[#1F2937]"
                onClick={clearSubCategorySelection}
              >
                <Icon icon="heroicons:x-mark" className="w-3 h-3 mr-1" />
                Clear subcategory
              </Button>
            )}
            
            {tempSelectedCategory && (
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 px-2 text-xs text-[#6B7280] hover:text-[#1F2937]"
                onClick={clearCategorySelection}
              >
                <Icon icon="heroicons:x-mark" className="w-3 h-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[50vh]">
            {loading ? (
              // Skeleton loading state
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="flex items-center border border-gray-200 rounded-lg p-3 animate-pulse">
                      <div className="flex items-center space-x-3 flex-1">
                        <Skeleton className="w-10 h-10 rounded" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                      <Skeleton className="w-20 h-4" />
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === 'categories' && categorySearchQuery ? (
              // Category search results
              <div className="p-4">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-3">
                    <Icon icon="eos-icons:loading" className="w-8 h-8 text-[#0BB248] animate-spin" />
                    <p className="text-[#6B7280]">Searching categories...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {searchResults.map((category) => (
                      <div 
                        key={category._id} 
                        className="bg-white border border-[#E5E7EB] rounded-lg p-4 hover:border-[#0BB248] transition-all duration-200 shadow-sm hover:shadow"
                      >
                        <h3 className="font-medium text-lg mb-2 text-[#111827]">
                          <button 
                            className="text-left hover:text-[#0BB248] transition-colors w-full"
                            onClick={() => handleSearchCategorySelect(category.name)}
                          >
                            {category.name}
                          </button>
                        </h3>
                        {category.matchingSubCategories?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {category.matchingSubCategories.map((sub) => (
                              <Badge 
                                key={sub.name} 
                                variant="outline" 
                                className={`cursor-pointer hover:bg-[#0BB248]/10 transition-colors ${
                                  tempSelectedCategory === category.name && tempSelectedSubCategory === sub.name
                                    ? 'bg-[#0BB248]/10 text-[#0BB248] border-[#0BB248]'
                                    : 'bg-[#F9FAFB] text-[#4B5563] hover:text-[#0BB248]'
                                }`}
                                onClick={() => handleSearchCategorySelect(category.name, sub.name)}
                              >
                                {sub.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 gap-2 text-[#6B7280]">
                    <Icon icon="heroicons:magnifying-glass" className="w-8 h-8 text-[#D1D5DB]" />
                    <p>No categories found for {categorySearchQuery}</p>
                    <Button variant="outline" size="sm" onClick={clearSearch} className="mt-2">
                      Clear search
                    </Button>
                  </div>
                )}
              </div>
            ) : activeTab === 'categories' ? (
              // Categories view
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((category) => (
                  <div
                    key={category._id}
                    className={`flex items-center border border-[#E5E7EB] rounded-lg justify-between p-3 cursor-pointer hover:bg-gray-100 ${
                      selectedCategory === category.name ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => handleCategorySelect(category.name)}
                  >
                    <div className="flex items-center space-x-3">
                      <img src={category.image?.url} alt={category.name} className="w-10 h-10 object-cover rounded" />
                      <span>{category.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      commission: {category.platformFee}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Subcategories view
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-[#6B7280]">
                    {subCategorySearchQuery 
                      ? `Search results for "${subCategorySearchQuery}" in ${tempSelectedCategory}`
                      : `Sub-categories for ${tempSelectedCategory}`}
                  </h3>
                  
                  {filteredSubCategories.length > 0 && (
                    <span className="text-xs text-[#9CA3AF]">
                      {filteredSubCategories.length} results
                    </span>
                  )}
                </div>
                
                {filteredSubCategories.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredSubCategories.map((subCategory) => (
                      <div
                        key={subCategory._id}
                        onClick={() => handleSubCategorySelect(subCategory.name)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          tempSelectedSubCategory === subCategory.name
                            ? 'border-[#0BB248] bg-[#0BB248]/5 shadow'
                            : 'border-[#E5E7EB] bg-white hover:border-[#0BB248]/50 hover:shadow'
                        }`}
                      >
                        <span className={tempSelectedSubCategory === subCategory.name ? 'text-[#0BB248]' : 'text-[#111827]'}>
                          {subCategory.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 gap-2 text-[#6B7280]">
                    <Icon icon="heroicons:magnifying-glass" className="w-8 h-8 text-[#D1D5DB]" />
                    <p>{subCategorySearchQuery 
                      ? `No subcategories found for "${subCategorySearchQuery}"` 
                      : `No subcategories available for ${tempSelectedCategory}`}
                    </p>
                    {subCategorySearchQuery && (
                      <Button variant="outline" size="sm" onClick={clearSearch} className="mt-2">
                        Clear search
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
        
        <DialogFooter className="p-4 border-t bg-white">
          <div className="flex flex-wrap w-full items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={clearAllSelections} 
              className="text-[#6B7280] hover:text-[#111827]"
              disabled={!tempSelectedCategory && !tempSelectedSubCategory}
            >
              Clear all selections
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="border-[#E5E7EB] text-[#4B5563]">
                Cancel
              </Button>
              <Button 
                onClick={handleApply}
                disabled={!tempSelectedCategory}
                className="bg-[#17171B] hover:bg-[#17171B]/90 text-white"
              >
                Apply
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

CategorySelectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  categories: PropTypes.array.isRequired,
  selectedCategory: PropTypes.string,
  selectedSubCategory: PropTypes.string,
  onApply: PropTypes.func.isRequired,
  isSearching: PropTypes.bool.isRequired,
  searchResults: PropTypes.array.isRequired,
  categorySearchQuery: PropTypes.string.isRequired,
  setCategorySearchQuery: PropTypes.func.isRequired,
  getSubCategories: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired
};

export default CategorySelectionModal; 