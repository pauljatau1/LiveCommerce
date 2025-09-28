import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Icon } from "@iconify/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";
import PropTypes from 'prop-types';
import { Skeleton, CategoryItem, SubCategoryItem, SearchResultItem } from './CategorySelectionModal/index';


const CategorySelectionModal = memo(({
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

  // Reset temp selections when modal opens - optimized with useCallback
  useEffect(() => {
    if (isOpen) {
      setTempSelectedCategory(selectedCategory);
      setTempSelectedSubCategory(selectedSubCategory);
      setActiveTab(selectedCategory ? 'subcategories' : 'categories');
      setSubCategorySearchQuery('');
    }
  }, [isOpen, selectedCategory, selectedSubCategory]);

  // Memoized subcategories computation for better performance
  const subCategories = useMemo(() => {
    return getSubCategories(tempSelectedCategory);
  }, [tempSelectedCategory, getSubCategories]);

  // Filter subcategories based on search query - optimized
  useEffect(() => {
    if (!tempSelectedCategory || !subCategorySearchQuery.trim()) {
      setFilteredSubCategories(subCategories);
      return;
    }

    const query = subCategorySearchQuery.toLowerCase();
    const filtered = subCategories.filter(
      subCat => subCat.name.toLowerCase().includes(query)
    );
    setFilteredSubCategories(filtered);
  }, [tempSelectedCategory, subCategorySearchQuery, subCategories]);

  // Optimized event handlers with useCallback
  const handleApply = useCallback(() => {
    onApply(tempSelectedCategory, tempSelectedSubCategory);
    onClose();
  }, [onApply, onClose, tempSelectedCategory, tempSelectedSubCategory]);

  const handleCategorySelect = useCallback((categoryName) => {
    setTempSelectedCategory(categoryName);
    setTempSelectedSubCategory('');
    setActiveTab('subcategories');
    setSubCategorySearchQuery('');
    setCategorySearchQuery('');
  }, [setCategorySearchQuery]);

  const handleSubCategorySelect = useCallback((subCategoryName) => {
    setTempSelectedSubCategory(subCategoryName);
  }, []);

  const handleSearchCategorySelect = useCallback((category, subCategory = null) => {
    setTempSelectedCategory(category);
    setCategorySearchQuery('');
    
    if (subCategory) {
      setTempSelectedSubCategory(subCategory);
    } else {
      setTempSelectedSubCategory('');
    }
    
    setActiveTab('subcategories');
  }, [setCategorySearchQuery]);

  const clearAllSelections = useCallback(() => {
    setTempSelectedCategory('');
    setTempSelectedSubCategory('');
    setCategorySearchQuery('');
    setSubCategorySearchQuery('');
    setActiveTab('categories');
  }, [setCategorySearchQuery]);

  const clearCategorySelection = useCallback(() => {
    setTempSelectedCategory('');
    setTempSelectedSubCategory('');
    setActiveTab('categories');
  }, []);

  const clearSubCategorySelection = useCallback(() => {
    setTempSelectedSubCategory('');
  }, []);

  const clearSearch = useCallback(() => {
    if (activeTab === 'categories') {
      setCategorySearchQuery('');
    } else {
      setSubCategorySearchQuery('');
    }
  }, [activeTab, setCategorySearchQuery]);

  // Memoized search placeholder
  const searchPlaceholder = useMemo(() => {
    if (activeTab === 'categories' || !tempSelectedCategory) {
      return "Search categories...";
    }
    return `Search subcategories in ${tempSelectedCategory}...`;
  }, [activeTab, tempSelectedCategory]);

  // Memoized search input handler
  const handleSearchInputChange = useCallback((e) => {
    if (activeTab === 'categories') {
      setCategorySearchQuery(e.target.value);
    } else {
      setSubCategorySearchQuery(e.target.value);
    }
  }, [activeTab, setCategorySearchQuery]);

  // Memoized tab switching handlers
  const handleCategoriesTabClick = useCallback(() => {
    setActiveTab('categories');
    setCategorySearchQuery('');
  }, [setCategorySearchQuery]);

  const handleSubCategoriesTabClick = useCallback(() => {
    setActiveTab('subcategories');
    setSubCategorySearchQuery('');
  }, []);

  // Memoized scroll area height calculation
  const scrollAreaHeight = useMemo(() => {
    // Calculate dynamic height based on viewport and content
    const viewportHeight = window.innerHeight;
    const modalHeaderHeight = 120; // Approximate header height
    const modalFooterHeight = 80; // Approximate footer height
    const breadcrumbHeight = 60; // Approximate breadcrumb height
    const availableHeight = viewportHeight - modalHeaderHeight - modalFooterHeight - breadcrumbHeight;
    
    // Ensure minimum height and maximum height
    return Math.max(300, Math.min(availableHeight, 500));
  }, []);

  // Memoized categories list for virtualization
  const categoriesList = useMemo(() => {
    return categories.map(category => ({
      ...category,
      isSelected: selectedCategory === category.name
    }));
  }, [categories, selectedCategory]);

  // Memoized filtered subcategories list
  const subCategoriesList = useMemo(() => {
    return filteredSubCategories.map(subCategory => ({
      ...subCategory,
      isSelected: tempSelectedSubCategory === subCategory.name
    }));
  }, [filteredSubCategories, tempSelectedSubCategory]);

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
                onChange={handleSearchInputChange}
                placeholder={searchPlaceholder}
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
              onClick={handleCategoriesTabClick}
            >
              Categories
            </Button>
            
            {tempSelectedCategory && (
              <>
                <Icon icon="heroicons:chevron-right" className="w-4 h-4 text-[#9CA3AF]" />
                <Button 
                  variant="ghost"
                  className={`h-8 px-3 rounded-full text-sm ${activeTab === 'subcategories' ? 'bg-[#0BB248]/10 text-[#0BB248] hover:bg-[#0BB248]/20 hover:text-[#0BB248]' : 'text-[#4B5563] hover:bg-gray-100'}`}
                  onClick={handleSubCategoriesTabClick}
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


          <ScrollArea className={`h-[${scrollAreaHeight}px]`} style={{ height: `${scrollAreaHeight}px` }}>
            {loading ? (
              // Optimized skeleton loading state
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: 6 }, (_, index) => (
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
              // Optimized category search results
              <div className="p-4">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-3">
                    <Icon icon="eos-icons:loading" className="w-8 h-8 text-[#0BB248] animate-spin" />
                    <p className="text-[#6B7280]">Searching categories...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {searchResults.map((category) => (
                      <SearchResultItem
                        key={category._id}
                        category={category}
                        tempSelectedCategory={tempSelectedCategory}
                        tempSelectedSubCategory={tempSelectedSubCategory}
                        onSelect={handleSearchCategorySelect}
                      />
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
              // Optimized categories view with virtualization
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoriesList.map((category) => (
                  <CategoryItem
                    key={category._id}
                    category={category}
                    isSelected={category.isSelected}
                    onSelect={handleCategorySelect}
                  />
                ))}
              </div>
            ) : (
              // Optimized subcategories view
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
                
                {subCategoriesList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {subCategoriesList.map((subCategory) => (
                      <SubCategoryItem
                        key={subCategory._id}
                        subCategory={subCategory}
                        isSelected={subCategory.isSelected}
                        onSelect={handleSubCategorySelect}
                      />
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
});

CategorySelectionModal.displayName = 'CategorySelectionModal';
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
  loading: PropTypes.bool
};

export default CategorySelectionModal; 