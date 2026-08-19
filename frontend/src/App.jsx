import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import DocsPage from "./pages/DocsPage.jsx";
import CheckerApp from "./pages/CheckerApp.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/app" element={<CheckerApp />} />
    </Routes>
  );
}
