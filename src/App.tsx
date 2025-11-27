import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Extrato from "./pages/Extrato";
import Servicos from "./pages/Servicos";
import Insights from "./pages/Insights";
import Metas from "./pages/Metas";
import Ofertas from "./pages/Ofertas";
import Preferencias from "./pages/Preferencias";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [modoTrabalho, setModoTrabalho] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout modoTrabalho={modoTrabalho} setModoTrabalho={setModoTrabalho}>
                    <Index modoTrabalho={modoTrabalho} />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/extrato"
              element={
                <ProtectedRoute>
                  <Layout modoTrabalho={modoTrabalho} setModoTrabalho={setModoTrabalho}>
                    <Extrato modoTrabalho={modoTrabalho} />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/servicos"
              element={
                <ProtectedRoute>
                  <Layout modoTrabalho={modoTrabalho} setModoTrabalho={setModoTrabalho}>
                    <Servicos />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights"
              element={
                <ProtectedRoute>
                  <Layout modoTrabalho={modoTrabalho} setModoTrabalho={setModoTrabalho}>
                    <Insights modoTrabalho={modoTrabalho} />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/metas"
              element={
                <ProtectedRoute>
                  <Metas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ofertas"
              element={
                <ProtectedRoute>
                  <Ofertas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/preferencias"
              element={
                <ProtectedRoute>
                  <Preferencias />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
