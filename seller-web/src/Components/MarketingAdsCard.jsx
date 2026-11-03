import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import ComingSoonTag from './ComingSoonTag';

const MarketingAdsCard = ({ item }) => {
    return (
        <div className="w-full xl:w-[404px] h-[169.5px] md:h-[239px] relative bg-[#17171B] rounded-lg py-3 px-4 md:py-6 md:px-7 space-y-3 md:space-y-6">
            <div className="absolute top-3 right-3">
                {
                    !item?.available && (
                        <ComingSoonTag />
                    )
                }
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h1 className="text-white text-sm md:text-lg font-medium font-lexend">{item.title}</h1>
                <div className="flex flex-wrap gap-2">
                    {
                        item.tags.map((tag) => (
                            <span className="text-white text-xs font-medium bg-[#0BB248] font-cabin rounded-full px-4 py-[2px] md:py-1" key={tag.id}>{tag.name}</span>
                        ))
                    }
                </div>
            </div>
            <p className="text-white text-xs font-normal md:text-base font-cabin line-clamp-2">{item.description}</p>
            <div className="flex items-center gap-2">
                <NavLink to={item.link} className="text-[#17171B] text-xs md:text-base font-medium bg-[#0BB248] font-cabin rounded-full px-6 py-2 hover:bg-[#0BB248]/80 hover:text-[#17171B]">Get Started</NavLink>
                <Icon icon="rivet-icons:question-mark-solid" className="text-[#0BB248] hover:text-[#0BB248]/80 cursor-pointer w-8 h-8 md:w-10 md:h-10" />
            </div>
        </div>
    )
};

MarketingAdsCard.propTypes = {
    item: PropTypes.object.isRequired
};

export default MarketingAdsCard
