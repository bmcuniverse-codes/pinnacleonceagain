import HeroSection from '../components/home/HeroSection'
import StatsSection from '../components/home/StatsSection'
import FeaturedEventSection from '../components/home/FeaturedEventSection'
import HowItWorksSection from '../components/home/HowItWorksSection'
import LeaderboardPreviewSection from '../components/home/LeaderboardPreviewSection'
import TicketFloatingBanner from '../components/tickets/TicketFloatingBanner'
import TicketPopup from '../components/tickets/TicketPopup'
import TicketSection from '../components/tickets/TicketSection'

export default function Home() {
  return (
    <div className="space-y-14">
      <TicketPopup />
      <TicketFloatingBanner />
      <HeroSection />
      <TicketSection />
      <StatsSection />
      <FeaturedEventSection />
      <HowItWorksSection />
      <LeaderboardPreviewSection />
    </div>
  )
}