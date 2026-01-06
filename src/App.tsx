import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Caixa from "./pages/Caixa";
import Cozinha from "./pages/Cozinha";
import Configuracoes from "./pages/Configuracoes";
import Assinatura from "./pages/Assinatura";
import Organizacoes from "./pages/Organizacoes";
import SelecionarOrganizacao from "./pages/SelecionarOrganizacao";
import Privacidade from "./pages/Privacidade";
import Cookies from "./pages/Cookies";
import TermosDeUso from "./pages/TermosDeUso";
import Auth from "./pages/Auth";
import Cadastro from "./pages/Cadastro";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <OrganizationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/privacidade" element={<Privacidade />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/termos" element={<TermosDeUso />} />
            
            {/* Protected App Routes */}
            <Route path="/selecionar-organizacao" element={<ProtectedRoute requiresSubscription={false}><SelecionarOrganizacao /></ProtectedRoute>} />
            <Route path="/pedidos" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/caixa" element={<ProtectedRoute><Caixa /></ProtectedRoute>} />
            <Route path="/cozinha" element={<ProtectedRoute><Cozinha /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
            <Route path="/organizacoes" element={<ProtectedRoute><Organizacoes /></ProtectedRoute>} />
            <Route path="/assinatura" element={<ProtectedRoute requiresSubscription={false}><Assinatura /></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </OrganizationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
