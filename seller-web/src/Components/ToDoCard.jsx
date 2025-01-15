import PropTypes from 'prop-types';

const ToDoCard = ({ card }) => {
    return (
        <div className="flex justify-between items-center cursor-pointer hover:bg-gray-200 px-4 py-3">
            <p className="text-sm font-cabin font-normal text-[#05031F] capitalize max-w-[200px] xl:max-w-[300px]">{card?.message}</p>
            <button className="text-sm font-cabin font-normal text-[#05031F] border border-[#05031F] rounded-[7.8px] px-4 py-2 hover:bg-[#05031F] hover:text-white transition-all duration-300 ease-in-out">Check it.</button>
        </div>
    )
};

ToDoCard.propTypes = {
    card: PropTypes.object.isRequired
};

export default ToDoCard
