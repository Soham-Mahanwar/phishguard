import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import DocsPage from "./pages/DocsPage.jsx";
import CheckerApp from "./pages/CheckerApp.jsx";
import ShadowDashboard from "./pages/ShadowDashboard.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/app" element={<CheckerApp />} />
      <Route path="/shadow" element={<ShadowDashboard />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  );
}
