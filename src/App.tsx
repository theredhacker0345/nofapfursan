import { lazy, Suspense, useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { NostrProvider } from "@/context/NostrContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PageTransition } from "@/components/PageTransition";
import { LoadingScreen } from "@/components/LoadingScreen";
import { restoreFromSecureStorage } from "@/services/localStore";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const Auth = lazy(() => import("./pages/Auth"));
const Journal = lazy(() => import("./pages/Journal"));
const Join = lazy(() => import("./pages/Join"));
const Vitals = lazy(() => import("./pages/Vitals"));
const Archives = lazy(() => import("./pages/Archives"));
const Vanguard = lazy(() => import("./pages/Vanguard"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Library = lazy(() => import("./pages/Library"));
const Nutrition = lazy(() => import("./pages/Nutrition"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The Nostr layer is the source of truth and already caches locally.
      refetchOnWindowFocus: false,
      staleTime: 60_000,
      retry: 1,
    },
  },
});

export default function App() {
  useEffect(() => {
    document.title = "Fursan";
    void restoreFromSecureStorage().catch((error) => {
      console.error("[App] Secure storage recovery failed", error);
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
          {/* `reducedMotion="user"` is the only thing that makes framer-motion
              honour prefers-reduced-motion — the CSS override alone does not. */}
          <MotionConfig reducedMotion="user">
            <ThemeProvider>
              <NostrProvider>
                <Sonner position="bottom-center" richColors closeButton />
                <HashRouter>
                  <PageTransition>
                    <Suspense
                      fallback={<LoadingScreen message="Loading" subMessage="Fetching this screen" />}
                    >
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/journal" element={<Journal />} />
                        <Route path="/vitals" element={<Vitals />} />
                        <Route path="/archives" element={<Archives />} />
                        <Route path="/vanguard" element={<Vanguard />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/library" element={<Library />} />
                        <Route path="/nutrition" element={<Nutrition />} />
                        <Route path="/join" element={<Join />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </PageTransition>
                </HashRouter>
              </NostrProvider>
            </ThemeProvider>
          </MotionConfig>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}