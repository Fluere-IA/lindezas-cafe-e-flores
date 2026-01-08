import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { SuperAdminRoute } from "@/components/auth/SuperAdminRoute";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";

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
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Membros = lazy(() => import("./pages/Membros"));
const Perfil = lazy(() => import("./pages/Perfil"));
const SuperDashboard = lazy(() => import("./pages/SuperDashboard"));
const Estoque = lazy(() => import("./pages/Estoque"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Auditoria = lazy(() => import("./pages/Auditoria"));
const Planos = lazy(() => import("./pages/Planos"));
const CheckoutSucesso = lazy(() => import("./pages/CheckoutSucesso"));

// Lazy loaded public pages
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha"));
const AtualizarSenha = lazy(() => import("./pages/AtualizarSenha"));
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
        <SubscriptionProvider>
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
                <Route path="/recuperar-senha" element={<RecuperarSenha />} />
                <Route path="/atualizar-senha" element={<AtualizarSenha />} />
                <Route path="/privacidade" element={<Privacidade />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/termos" element={<TermosDeUso />} />
                
                {/* Super Admin Route */}
                <Route path="/admin/super-dashboard" element={<SuperAdminRoute><SuperDashboard /></SuperAdminRoute>} />
                
                {/* Protected App Routes */}
                <Route path="/onboarding" element={<ProtectedRoute requiresSubscription={false}><Onboarding /></ProtectedRoute>} />
                <Route path="/pedidos" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/caixa" element={<ProtectedRoute><Caixa /></ProtectedRoute>} />
                <Route path="/cozinha" element={<ProtectedRoute><RoleGuard allowedRoles={['owner', 'admin', 'kitchen']}><Cozinha /></RoleGuard></ProtectedRoute>} />
                <Route path="/configuracoes" element={<ProtectedRoute><RoleGuard allowedRoles={['owner', 'admin']}><Configuracoes /></RoleGuard></ProtectedRoute>} />
                <Route path="/organizacoes" element={<ProtectedRoute><Organizacoes /></ProtectedRoute>} />
                <Route path="/membros" element={<ProtectedRoute><RoleGuard allowedRoles={['owner', 'admin']}><Membros /></RoleGuard></ProtectedRoute>} />
                <Route path="/assinatura" element={<ProtectedRoute requiresSubscription={false}><Assinatura /></ProtectedRoute>} />
                <Route path="/planos" element={<ProtectedRoute requiresSubscription={false}><Planos /></ProtectedRoute>} />
                <Route path="/checkout/sucesso" element={<ProtectedRoute requiresSubscription={false}><CheckoutSucesso /></ProtectedRoute>} />
                <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                <Route path="/estoque" element={<ProtectedRoute><Estoque /></ProtectedRoute>} />
                <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
                <Route path="/auditoria" element={<ProtectedRoute><Auditoria /></ProtectedRoute>} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ThemeProvider>
      </SubscriptionProvider>
    </OrganizationProvider>
  </TooltipProvider>
  </QueryClientProvider>
);

export default App;
