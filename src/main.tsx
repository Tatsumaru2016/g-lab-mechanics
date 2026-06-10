import { StrictMode, lazy, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";

const AdminApp = lazy(() => import("./admin/AdminApp.tsx"));

function Root() {
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash.startsWith("#/admin"));

  useEffect(() => {
    const onHashChange = () => setIsAdmin(window.location.hash.startsWith("#/admin"));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return isAdmin ? (
    <Suspense fallback={<div className="min-h-screen bg-[#F6F6F4] p-8 font-mono text-sm">管理画面を読み込み中…</div>}>
      <AdminApp />
    </Suspense>
  ) : (
    <App />
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
