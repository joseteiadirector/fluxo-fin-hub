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
                    <Insights />
                  </Layout>
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
