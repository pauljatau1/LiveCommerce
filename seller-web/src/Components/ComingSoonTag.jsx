import PropTypes from 'prop-types';

const ComingSoonTag = ({ topPosition = 'top-0', rightPosition = 'right-0', xAxisCenterPosition = false, yAxisCenterPosition = false }) => {
    return (
        <div className={`absolute w-fit ${topPosition} ${rightPosition} ${xAxisCenterPosition ? 'left-1/2 -translate-x-1/2' : ''} ${yAxisCenterPosition ? 'top-1/2 -translate-y-1/2' : ''}`}>
            <div className="relative">





                {/* Background with gradient */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-full px-2 py-1.5 shadow-lg">
                    {/* Text with glow effect */}
                    <p className="text-white text-[8px] whitespace-nowrap font-medium tracking-wide animate-pulse">
                        Coming Soon
                    </p>
                </div>
                {/* Optional: Decorative dot */}
                <span className="absolute -top-0 -right-0 w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
        </div>
    );
};

ComingSoonTag.propTypes = {
    topPosition: PropTypes.string,
    rightPosition: PropTypes.string,
    xAxisCenterPosition: PropTypes.bool,
    yAxisCenterPosition: PropTypes.bool
};




export default ComingSoonTag;