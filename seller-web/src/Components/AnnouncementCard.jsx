import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from './ui/dialog';


const AnnouncementCard = ({ announcement }) => {
    const formattedDate = new Date(announcement.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className='flex justify-between items-center w-full hover:bg-[#0BB2481A] px-4 py-3 lg:px-8 lg:py-7 cursor-pointer transition-all duration-400 border-b border-gray-200'>
                    <p className='text-sm lg:text-base font-cabin font-bold max-w-[250px] lg:max-w-none lg:font-normal line-clamp-2 text-[#17171B]'>
                        {formattedDate}: <span className='font-medium'>{announcement.description}</span>
                    </p>
                    <Icon icon="ri:arrow-right-s-line" width="24" height="24" color="#17171B" />
                </div>
            </DialogTrigger>

            <DialogContent className='bg-white max-h-[80vh] overflow-y-auto md:max-w-xl'>
                <DialogTitle className='text-[#0BB248] font-cabin font-bold text-lg mb-4'>{formattedDate}</DialogTitle>
                <p className='text-[#17171B] text-sm lg:text-base whitespace-pre-wrap'>{announcement.description}</p>
            </DialogContent>
        </Dialog>
    );
};

AnnouncementCard.propTypes = {
    announcement: PropTypes.object.isRequired
};

export default AnnouncementCard
