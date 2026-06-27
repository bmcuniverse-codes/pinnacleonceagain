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

export default function App() {
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/events" element={<Events />} />
      <Route path="/events/:eventSlug/categories" element={<Categories />} />
      <Route path="/events/:eventSlug/categories/:categorySlug" element={<Nominees />} />
      <Route path="/vote/:nominationSlug" element={<NomineeProfile />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/success" element={<Success />} />
    </Route>
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/admin" element={<AdminDashboard />} />
  </Routes>
}
