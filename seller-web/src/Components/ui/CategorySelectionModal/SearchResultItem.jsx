import { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Badge } from '../badge';

/**
 * Optimized Search Result Item Component with memo
 * Renders search result categories with matching subcategories
 * 
 * @param {Object} props - Component props
 * @param {Object} props.category - Category data object
 * @param {string} props.tempSelectedCategory - Currently selected category
 * @param {string} props.tempSelectedSubCategory - Currently selected subcategory
 * @param {Function} props.onSelect - Callback when category/subcategory is selected
 */
const SearchResultItem = memo(({ 
  category, 
  tempSelectedCategory, 
  tempSelectedSubCategory, 
  onSelect 
}) => {
  const handleCategoryClick = useCallback(() => {
    onSelect(category.name);
  }, [onSelect, category.name]);

  const handleSubCategoryClick = useCallback((subCategoryName) => {
    onSelect(category.name, subCategoryName);
  }, [onSelect, category.name]);

  return (
    <div 
      className="bg-white border border-[#E5E7EB] rounded-lg p-4 hover:border-[#0BB248] transition-all duration-200 shadow-sm hover:shadow"
    >
      <h3 className="font-medium text-lg mb-2 text-[#111827]">
        <button 
          className="text-left hover:text-[#0BB248] transition-colors w-full"
          onClick={handleCategoryClick}
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
              onClick={() => handleSubCategoryClick(sub.name)}
            >
              {sub.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
});

SearchResultItem.displayName = 'SearchResultItem';
SearchResultItem.propTypes = {
  category: PropTypes.object.isRequired,
  tempSelectedCategory: PropTypes.string.isRequired,
  tempSelectedSubCategory: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired
};

export default SearchResultItem;

