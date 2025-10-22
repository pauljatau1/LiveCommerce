import { Icon } from '@iconify/react'
import PropTypes from 'prop-types';

const Loader = ({color = '#0BB248'}) => {

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-200/5 backdrop-blur-xl">
      <Icon icon="eos-icons:three-dots-loading" color={color} className="w-[150px] xl:w-[200px] h-[150px] xl:h-[200px]" />
    </div>
  );
};

Loader.propTypes = {
  color: PropTypes.string
};

export default Loader;