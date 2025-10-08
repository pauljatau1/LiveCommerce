import PrimaryTypography from "@/Components/shared/PrimaryTypography";
import LoginMarketingImage from "@/assets/v2Images/login-image.png"

export default function MarketingSection() {
    return (
        <div className="relative w-full lg:w-1/2 h-[calc(100dvh-50px)] xl:h-[calc(100dvh-63px)] ">
            <div className="absolute inset-0 bg-gradient-to-r from-[#000000]/80  to-[#00000000] border-border/60 bg-white/70 backdrop-blur-[3px] supports-[backdrop-filter]:bg-white/15   " />
            <img src={LoginMarketingImage} alt="Login Marketing" className="w-full h-full object-cover object-center" />
            <div className="hidden lg:block absolute top-1/2 left-10 right-10 -translate-y-1/2 " >
                <h1 className="text-[64px] font-bold font-lexend text-[#FCFCFC] ">Let’s Grow Your Sales — You’re in Control</h1>
                <PrimaryTypography className="text-[#FCFCFC] " >
                    New tools. Smarter insights. Easier selling. Check your latest performance, go live, or promote top products - all in one!
                </PrimaryTypography>
            </div>
        </div>
    )
}