import PrimaryTypography from "@/Components/shared/PrimaryTypography";
import LoginMarketingImage from "@/assets/v2Images/login-image.png"

interface MarketingSectionProps {
    title?: string;
    description?: string;
}

export default function MarketingSection({ title, description }: MarketingSectionProps) {
    return (
        <div className="relative w-full lg:w-1/2 h-[100dvh] lg:h-[calc(100dvh-50px)] xl:h-[calc(100dvh-63px)] min-h-[100dvh] lg:min-h-0">
            <div className="absolute inset-0 bg-gradient-to-r from-[#000000]/80  to-[#00000000] border-border/60 bg-white/70 backdrop-blur-[3px] supports-[backdrop-filter]:bg-white/15   " />
            <img src={LoginMarketingImage} alt="Login Marketing" className="w-full h-full object-cover object-center" />
            <div className="hidden lg:block absolute top-1/2 left-10 right-10 -translate-y-1/2 " >
                <h1 className="text-[64px] font-bold font-lexend text-[#FCFCFC] ">{title || "Let's Grow Your Sales — You're in Control"}</h1>
                <PrimaryTypography className="text-[#FCFCFC] " >
                    {description || "New tools. Smarter insights. Easier selling. Check your latest performance, go live, or promote top products - all in one!"}
                </PrimaryTypography>
            </div>
        </div>
    )
}