import { lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { BackdropProvider } from "./contexts/BackdropContext";
import { PirateIdentityProvider } from "./contexts/PirateIdentityContext";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import Anime from "./pages/Anime";
import Search from "./pages/Search";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ShortcutLoadingOverlay from "./components/ShortcutLoadingOverlay";
import FloatingQuickActions from "./components/FloatingQuickActions";
import Header from "./components/Header";
import RoutePrefetcher from "./components/RoutePrefetcher";
import { lazyRouteLoaders } from "./lib/lazyRoutes";

const Watchlist = lazy(lazyRouteLoaders.watchlist);
const Settings = lazy(lazyRouteLoaders.settings);
const Help = lazy(lazyRouteLoaders.help);
const Live = lazy(lazyRouteLoaders.live);
const Sports = lazy(lazyRouteLoaders.sports);
const Watch = lazy(lazyRouteLoaders.watch);
const ServerStatus = lazy(lazyRouteLoaders.serverStatus);
const NotFound = lazy(lazyRouteLoaders.notFound);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BackdropProvider>
            <PirateIdentityProvider>
              <Toaster />
              <Sonner />
              <SpeedInsights />
               <ShortcutLoadingOverlay />
              <BrowserRouter future={{ v7_startTransition: true }}>
                <RoutePrefetcher />
                <Header />
                <FloatingQuickActions />
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/" element={<Index />} />
                    <Route path="/movies" element={<Movies />} />
                    <Route path="/series" element={<Series />} />
                    <Route path="/anime" element={<Anime />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/watchlist" element={<Watchlist />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/live" element={<Live />} />
                    <Route path="/live/:id" element={<Live />} />
                    <Route path="/sports" element={<Sports />} />
                    <Route path="/watch/:type/:id" element={<Watch />} />
                    <Route path="/server" element={<ServerStatus />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </PirateIdentityProvider>
        </BackdropProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
