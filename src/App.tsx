import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

const queryClient = new QueryClient();

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
