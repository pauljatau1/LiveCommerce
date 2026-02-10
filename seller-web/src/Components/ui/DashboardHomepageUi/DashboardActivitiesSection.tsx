import ActivityFeed from '@/Components/ui/DashboardHomepageUi/ActivityFeed';
import ShopHighlight from '@/Components/ui/DashboardHomepageUi/ShopHighlight';

export default function DashboardActivitiesSection() {
  return (
    <section className="mt-4 lg:mt-8 flex flex-col lg:flex-row lg:align-center lg:justify-between lg:max-h-[480px] gap-4 lg:gap-8 ">
        <ActivityFeed />
        <ShopHighlight />
    </section>
  )
}
