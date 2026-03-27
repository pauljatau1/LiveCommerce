import type React from "react"
import { Link } from "react-router-dom"
import { Star } from "lucide-react"
import { Button } from "@/Components/ui/button"
import TooltipButton from "@/Components/marketing/TooltipButton"

type MarketingFeature = {
  title: string
  description: string
  link: string
  isComingSoon?: boolean
  icon: React.ComponentType<{ className?: string }>
}

type MarketingFeatureCardProps = {
  feature: MarketingFeature
}

export default function MarketingFeatureCard({ feature }: MarketingFeatureCardProps) {
  const isAvailable = !feature.isComingSoon
  const infoText = feature.isComingSoon
    ? `${feature.title} is coming soon. You’ll be able to set it up from here.`
    : `Open ${feature.title} to start setting it up.`

  const badgeVariant = feature.title === "Auqli Ads" || feature.title === "Flash Sales" ? "beta" : "free"

  return (
    <div className="w-full rounded-[16px] border border-[#EEF2F6] bg-white shadow-sm px-5 py-5 flex flex-col">
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 rounded-[10px] bg-[#E7F7ED] flex items-center justify-center">
          <feature.icon className="h-5 w-5 text-[#0BB248]" />
        </div>
        <div
          className={[
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold",
            badgeVariant === "beta" ? "bg-[#0BB248] text-white" : "bg-[#0BB248] text-white",
          ].join(" ")}
        >
          {badgeVariant === "beta" && <Star className="h-3 w-3" aria-hidden />}
          {badgeVariant === "beta" ? "BETA" : "FREE"}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="text-[15px] font-semibold text-[#101828]">{feature.title}</h3>
        <p className="text-[12px] leading-[18px] text-[#667085]">{feature.description}</p>
      </div>

      <div className="mt-auto pt-5 flex items-center justify-between gap-3">
        {isAvailable ? (
          <Button
            asChild
            className="w-full h-9 rounded-[8px] border border-[#0BB248] bg-transparent hover:bg-[#0BB248]/10 text-[#0BB248] text-xs font-semibold"
          >
            <Link to={feature.link} className="w-full">
              Get Started
            </Link>
          </Button>
        ) : (
          <Button
            className="w-full h-9 rounded-[8px] border border-[#0BB248]/70 bg-transparent text-[#0BB248]/70 text-xs font-semibold"
            disabled
          >
            Not Available
          </Button>
        )}

        <TooltipButton ariaLabel={`More info about ${feature.title}`} content={infoText} />
      </div>
    </div>
  )
}
