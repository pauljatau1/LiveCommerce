import { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Optimized Skeleton component with memo for loading states
 * Provides smooth loading animations with customizable styling
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {...Object} props.props - Additional props passed to the div element
 */
const Skeleton = memo(({ className, ...props }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';
Skeleton.propTypes = {
  className: PropTypes.string
};

export default Skeleton;

