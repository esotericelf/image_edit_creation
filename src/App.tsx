import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { AdminDashboard } from "./pages/AdminDashboard";
import { CreatorStudioPage } from "./pages/CreatorStudioPage";
import { GiftInvitePage } from "./pages/GiftInvitePage";

export default function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/editor" replace />} />
          <Route path="/editor" element={<CreatorStudioPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/invite/:token" element={<GiftInvitePage />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}
