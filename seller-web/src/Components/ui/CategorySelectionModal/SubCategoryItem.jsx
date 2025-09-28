import { memo, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Optimized SubCategory Item Component with memo
 * Renders individual subcategory items with selection states
 * 
 * @param {Object} props - Component props
 * @param {Object} props.subCategory - SubCategory data object
 * @param {boolean} props.isSelected - Whether this subcategory is selected
 * @param {Function} props.onSelect - Callback when subcategory is selected
 */
const SubCategoryItem = memo(({ 
  subCategory, 
  isSelected, 
  onSelect 
}) => {
  const handleClick = useCallback(() => {
    onSelect(subCategory.name);
  }, [onSelect, subCategory.name]);

  return (
    <div
      onClick={handleClick}
      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-[#0BB248] bg-[#0BB248]/5 shadow'
          : 'border-[#E5E7EB] bg-white hover:border-[#0BB248]/50 hover:shadow'
      }`}
    >
      <span className={isSelected ? 'text-[#0BB248] font-medium' : 'text-[#111827]'}>
        {subCategory.name}
      </span>
    </div>
  );
});

SubCategoryItem.displayName = 'SubCategoryItem';
SubCategoryItem.propTypes = {
  subCategory: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired
};

export default SubCategoryItem;

