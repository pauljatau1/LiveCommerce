import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';


const AnnouncementCard = ({ announcement }) => {
    return (
        <div className='flex justify-between items-center w-full hover:bg-[#0BB2481A] px-4 py-3 lg:px-8 lg:py-7 rounded-[10px] cursor-pointer transition-all duration-400'>
            <p className='text-sm lg:text-base font-cabin font-bold max-w-[250px] lg:max-w-none lg:font-normal text-[#05031F]'>{announcement.date}: <span className='font-medium'>{announcement.title}</span> </p>
            <Icon icon="ri:arrow-right-s-line" width="24" height="24" color="#05031F" />
        </div>
    )
};

AnnouncementCard.propTypes = {
    announcement: PropTypes.object.isRequired
};

export default AnnouncementCard
