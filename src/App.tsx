import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Index from "./pages/Index";
import { NostrProvider } from "./context/NostrContext";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageTransition } from "./components/PageTransition";
import { LoadingScreen } from "@/components/LoadingScreen";

// Lazy-load secondary routes so heavy deps (recharts, nostr chat, charts)
// are only fetched when the user actually visits them
const Auth = lazy(() => import("./pages/Auth"));
const Community = lazy(() => import("./pages/Community"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Journal = lazy(() => import("./pages/Journal"));
const Join = lazy(() => import("./pages/Join"));
const Vitals = lazy(() => import("./pages/Vitals"));
const Archives = lazy(() => import("./pages/Archives"));
const Vanguard = lazy(() => import("./pages/Vanguard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Internal component to handle location-based transitions
const AnimatedRoutes = () => {
  return (
    <PageTransition>
      <Suspense fallback={<LoadingScreen message="Loading..." subMessage="Preparing your protocol" />}>
        <Routes>
          <Route path='/' element={<Index />} />
          <Route path='/auth' element={<Auth />} />
          <Route path='/journal' element={<Journal />} />
          <Route path='/vitals' element={<Vitals />} />
          <Route path='/archives' element={<Archives />} />
          <Route path='/vanguard' element={<Vanguard />} />
          <Route path='/community' element={<Community />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/settings' element={<Settings />} />
          <Route path='/join' element={<Join />} />
          <Route path='*' element={<NotFound />} />
        </Routes>
      </Suspense>
    </PageTransition>
  );
};

const App = () => {
  useEffect(() => {
    document.title = "Fursan";
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <NostrProvider>
              <Toaster />
              <Sonner />
              <HashRouter>
                <AnimatedRoutes />
              </HashRouter>
            </NostrProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
