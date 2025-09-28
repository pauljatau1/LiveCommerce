import { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import GlassImage from '../GlassImage';

/**
 * Optimized Category Item Component with memo
 * Renders individual category items with glassmorphism image loading
 * 
 * @param {Object} props - Component props
 * @param {Object} props.category - Category data object
 * @param {boolean} props.isSelected - Whether this category is selected
 * @param {Function} props.onSelect - Callback when category is selected
 */
const CategoryItem = memo(({
  category,
  isSelected,
  onSelect
}) => {
  const handleClick = useCallback(() => {
    onSelect(category.name);
  }, [onSelect, category.name]);

  return (
    <div
      className={`border border-[#E5E7EB] rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors duration-150 ${isSelected ? 'bg-gray-100' : ''
        }`}
      onClick={handleClick}
    >
      <div className="flex gap-[10px] items-center space-x-3">
        <GlassImage
          src={category.image?.url}
          className="w-10 h-10 rounded object-cover"
          glassClassName="w-10 h-10 rounded object-cover"
          containerClassName="w-10 h-10 rounded overflow-hidden"
          showActivityIndicator={false}
          blurIntensity={0}
          tint="dark"
        />
        <div className="text-sm text-gray-600">
          <h4 className="font-medium text-sm">{category.name}</h4>
          <p className="text-sm text-gray-600">commission: {category.platformFee}%</p>
        </div>
      </div>

    </div>
  );
});

CategoryItem.displayName = 'CategoryItem';
CategoryItem.propTypes = {
  category: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired
};

export default CategoryItem;

