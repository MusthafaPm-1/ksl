import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import "./App.css";

// Public pages
import Home from "./pages/Home";
import Live from "./pages/Live";
import Fixtures from "./pages/Fixtures";
import Results from "./pages/Results";
import Standings from "./pages/Standings";
import Teams from "./pages/Teams";
import MatchDetails from "./pages/MatchDetails";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTeams from "./pages/admin/AdminTeams";
import AdminFixtures from "./pages/admin/AdminFixtures";
import AdminMatches from "./pages/admin/AdminMatches";
import AdminLiveMatch from "./pages/admin/AdminLiveMatch";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/live" element={<Live />} />
        <Route path="/fixtures" element={<Fixtures />} />
        <Route path="/results" element={<Results />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/teams" element={<Teams />} />
        
        {/* Match Details (support both /match/:id and /matches/:id) */}
        <Route path="/match/:id" element={<MatchDetails />} />
        <Route path="/matches/:id" element={<MatchDetails />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/teams" element={<AdminTeams />} />
        <Route path="/admin/fixtures" element={<AdminFixtures />} />
        <Route path="/admin/matches" element={<AdminMatches />} />

        {/* Admin Live Match Control (support both /admin/live/:id and /admin/live-match/:id) */}
        <Route path="/admin/live/:id" element={<AdminLiveMatch />} />
        <Route path="/admin/live-match/:id" element={<AdminLiveMatch />} />
        <Route path="/admin/match/:id" element={<AdminLiveMatch />} />
      </Routes>
    </>
  );
}

export default App;