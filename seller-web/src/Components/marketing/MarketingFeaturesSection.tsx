import type React from "react"
import MarketingFeatureCard from "@/Components/marketing/MarketingFeatureCard"

type MarketingFeature = {
  title: string
  description: string
  link: string
  isComingSoon?: boolean
  icon: React.ComponentType<{ className?: string }>
}

type MarketingFeaturesSectionProps = {
  features: MarketingFeature[]
}

export default function MarketingFeaturesSection({ features }: MarketingFeaturesSectionProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {features.map((feature) => (
        <MarketingFeatureCard key={feature.title} feature={feature} />
      ))}
    </section>
  )
}
