import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Eagerly loaded pages (landing & auth - needed immediately)
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Cadastro from "./pages/Cadastro";
import NotFound from "./pages/NotFound";

// Lazy loaded pages (protected routes - loaded on demand)
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Caixa = lazy(() => import("./pages/Caixa"));
const Cozinha = lazy(() => import("./pages/Cozinha"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Assinatura = lazy(() => import("./pages/Assinatura"));
const Organizacoes = lazy(() => import("./pages/Organizacoes"));
const SelecionarOrganizacao = lazy(() => import("./pages/SelecionarOrganizacao"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Membros = lazy(() => import("./pages/Membros"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Cookies = lazy(() => import("./pages/Cookies"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground">Carregando...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <OrganizationProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
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
                <Route path="/onboarding" element={<ProtectedRoute requiresSubscription={false}><Onboarding /></ProtectedRoute>} />
                <Route path="/pedidos" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/caixa" element={<ProtectedRoute><Caixa /></ProtectedRoute>} />
                <Route path="/cozinha" element={<ProtectedRoute><Cozinha /></ProtectedRoute>} />
                <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
                <Route path="/organizacoes" element={<ProtectedRoute><Organizacoes /></ProtectedRoute>} />
                <Route path="/membros" element={<ProtectedRoute><Membros /></ProtectedRoute>} />
                <Route path="/assinatura" element={<ProtectedRoute requiresSubscription={false}><Assinatura /></ProtectedRoute>} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ThemeProvider>
      </OrganizationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
