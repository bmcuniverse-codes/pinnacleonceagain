import HeroSection from '../components/home/HeroSection'
import StatsSection from '../components/home/StatsSection'
import FeaturedEventSection from '../components/home/FeaturedEventSection'
import HowItWorksSection from '../components/home/HowItWorksSection'
import LeaderboardPreviewSection from '../components/home/LeaderboardPreviewSection'

export default function Home() {
  return (
    <div className="space-y-14">
      <HeroSection />
      <StatsSection />
      <FeaturedEventSection />
      <HowItWorksSection />
      <LeaderboardPreviewSection />
    </div>
  )
}