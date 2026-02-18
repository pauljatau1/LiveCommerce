import { useSelector } from "react-redux";

export default function ProductAnalyticsSection() {
    const { productStatistics } = useSelector((state: any) => state.product);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 bg-[#FFFFFF] lg:bg-transparent px-[24px] lg:px-0 py-[16px] lg:py-0 rounded-[16px] " >
            <div className="w-full min-w-[140px] whitespace-nowrap h-[95px] lg:h-[107px] bg-[#FFFFFF] p-[24px] lg:-[32px] border border-solid border-[#EDF2F7] rounded-[16px] flex flex-col items-center justify-center shadow-[0px_3px_8px_-1px_rgba(50,50,71,0.05)] hover:shadow-[0px_4px_12px_-1px_rgba(50,50,71,0.08)] transition-shadow duration-300 cursor-pointer " >
                <h3 className="text-lg lg:text-xl 4xl:text-2xl font-lexend font-semibold text-[#000000] " >{productStatistics?.totalProducts || 0}</h3>
                <p className="text-xs lg:text-sm font-lexend font-normal text-[#718096] " >Total Products</p>
            </div>
            <div className="w-full min-w-[140px] whitespace-nowrap h-[95px] lg:h-[107px] bg-[#FFFFFF] p-[24px] lg:-[32px] border border-solid border-[#EDF2F7] rounded-[16px] flex flex-col items-center justify-center shadow-[0px_3px_8px_-1px_rgba(50,50,71,0.05)] hover:shadow-[0px_4px_12px_-1px_rgba(50,50,71,0.08)] transition-shadow duration-300 cursor-pointer " >
                <h3 className="text-lg lg:text-xl 4xl:text-2xl font-lexend font-semibold text-[#000000] " >{productStatistics?.activeProducts || 0}</h3>
                <p className="text-xs lg:text-sm font-lexend font-normal text-[#718096] " >Active Products</p>
            </div>
            <div className="w-full min-w-[140px] whitespace-nowrap h-[95px] lg:h-[107px] bg-[#FFFFFF] p-[24px] lg:-[32px] border border-solid border-[#EDF2F7] rounded-[16px] flex flex-col items-center justify-center shadow-[0px_3px_8px_-1px_rgba(50,50,71,0.05)] hover:shadow-[0px_4px_12px_-1px_rgba(50,50,71,0.08)] transition-shadow duration-300 cursor-pointer " >
                <h3 className="text-lg lg:text-xl 4xl:text-2xl font-lexend font-semibold text-[#000000] " >{productStatistics?.draftProducts || 0}</h3>
                <p className="text-xs lg:text-sm font-lexend font-normal text-[#718096] " >Drafts Products</p>
            </div>
            <div className="hidden lg:flex w-full min-w-[140px] whitespace-nowrap h-[95px] lg:h-[107px] bg-[#FFFFFF] p-[24px] lg:-[32px] border border-solid border-[#EDF2F7] rounded-[16px] flex-col items-center justify-center shadow-[0px_3px_8px_-1px_rgba(50,50,71,0.05)] hover:shadow-[0px_4px_12px_-1px_rgba(50,50,71,0.08)] transition-shadow duration-300 cursor-pointer " >
                <h3 className="text-lg lg:text-xl 4xl:text-2xl font-lexend font-semibold text-[#000000] " >{productStatistics?.productsWithBlips || 0}</h3>
                <p className="text-xs lg:text-sm font-lexend font-normal text-[#718096] " >With Blips</p>
            </div>
            <div className="w-full min-w-[140px] whitespace-nowrap h-[95px] lg:h-[107px] bg-[#FFFFFF] p-[24px] lg:-[32px] border border-solid border-[#EDF2F7] rounded-[16px] flex flex-col items-center justify-center shadow-[0px_3px_8px_-1px_rgba(50,50,71,0.05)] hover:shadow-[0px_4px_12px_-1px_rgba(50,50,71,0.08)] transition-shadow duration-300 cursor-pointer " >
                <h3 className="text-lg lg:text-xl 4xl:text-2xl font-lexend font-semibold text-[#000000] " >{productStatistics?.productsWithoutBlips || 0}</h3>
                <p className="text-xs lg:text-sm font-lexend font-normal text-[#718096] " >Product Without Blips</p>
            </div>
        </div>
    )
}
