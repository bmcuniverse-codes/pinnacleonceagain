import { Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import Home from './pages/Home'
import Events from './pages/Events'
import Categories from './pages/Categories'
import Nominees from './pages/Nominees'
import NomineeProfile from './pages/NomineeProfile'
import Leaderboard from './pages/Leaderboard'
import Success from './pages/Success'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import CommitteeLogin from './pages/CommitteeLogin'
import CommitteeDashboard from './pages/CommitteeDashboard'
import TicketPurchase from './pages/TicketPurchase'
import TicketSuccess from './pages/TicketSuccess'
import VerifierLogin from './pages/VerifierLogin'
import VerifierDashboard from './pages/VerifierDashboard'
import VerifyTicket from './pages/VerifyTicket'
import TicketFloatingBanner from './components/tickets/TicketFloatingBanner'

export default function App() {
  return (
    <>
      <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/events" element={<Events />} />
      <Route path="/events/:eventSlug/categories" element={<Categories />} />
      <Route path="/events/:eventSlug/categories/:categorySlug" element={<Nominees />} />
      <Route path="/vote/:nominationSlug" element={<NomineeProfile />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/success" element={<Success />} />
      <Route path="/tickets" element={<TicketPurchase />} />
      <Route path="/ticket/success" element={<TicketSuccess />} />
    </Route>

    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/admin" element={<AdminDashboard />} />

    <Route path="/committee" element={<CommitteeLogin />} />
    <Route path="/committee/login" element={<CommitteeLogin />} />
    <Route path="/committee/dashboard" element={<CommitteeDashboard />} />

    <Route path="/verifier" element={<VerifierDashboard />} />
    <Route path="/verifier/login" element={<VerifierLogin />} />
    <Route path="/verify-ticket/:code" element={<VerifyTicket />} />
      </Routes>

      <TicketFloatingBanner />
    </>
  )
}
