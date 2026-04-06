import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Predictor from "./pages/Predictor";
import Timeline from "./pages/Timeline";
import Settings from "./pages/Settings";
import HealthPlan from "./pages/HealthPlan";
import NotFound from "./pages/NotFound";
import AIAssistant from "./components/AIAssistant";
import ParticlesBackground from "./components/ParticlesBackground";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { saveUser } from "@/lib/glucosense";

const queryClient = new QueryClient();

function AuthRedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // This fires on every auth state change including Google OAuth callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        const user = {
          fullName: session.user.user_metadata?.full_name || session.user.email || '',
          email: session.user.email || '',
          password: '',
          age: session.user.user_metadata?.age || 0,
          diabetesType: session.user.user_metadata?.diabetesType || 'Type 1',
          glucoseRange: '70–140',
        };
        // Save to localStorage so rest of app works
        saveUser(user);
        localStorage.setItem('glucosense_session', JSON.stringify(user));
        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Global particles background on all pages */}
        <div className="fixed inset-0 -z-10">
          <ParticlesBackground />
        </div>
        {/* Handles Google OAuth redirect globally */}
        <AuthRedirectHandler />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/predictor" element={<Predictor />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/health-plan" element={<HealthPlan />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        {/* Global AI Assistant */}
        <AIAssistant />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
