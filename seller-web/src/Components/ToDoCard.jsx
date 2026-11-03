import PropTypes from 'prop-types';

const ToDoCard = ({ card }) => {
    return (
        <div className="group px-4 py-3 hover:bg-white transition-colors duration-200 flex justify-between items-center gap-4 first:rounded-t-xl last:rounded-b-xl border-b last:border-b-0 border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-600"></div>
          <p className="text-gray-700 text-sm font-medium truncate">
            {card?.message}
          </p>
        </div>
        <button className="flex-shrink-0 inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200 group-hover:shadow-sm">
          Check it
          <svg 
            className="ml-2 w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    )
};

ToDoCard.propTypes = {
    card: PropTypes.object.isRequired
};

export default ToDoCard
