import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { Layout } from "@/components/layout";
import { SortPage } from "@/pages/sort";
import { SettingsPage } from "@/pages/settings";
import { EmbyPage } from "@/pages/emby";
import { HistoryPage } from "@/pages/history";
import { AdminPage } from "@/pages/admin";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<SortPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="emby" element={<EmbyPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
      <Toaster richColors position="bottom-right" />
    </BrowserRouter>
  );
}
