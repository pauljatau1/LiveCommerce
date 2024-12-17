import PropTypes from 'prop-types';

const Loader2 = ({color = '#0BB248'}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-200/5 backdrop-blur-xl">
      <div className="loader w-[45px] aspect-[0.75]" 
           style={{
             '--loader-color': color
           }}
      ></div>
    </div>
  )
}

Loader2.propTypes = {
  color: PropTypes.string
};

export default Loader2