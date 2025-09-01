
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { lazy, Suspense } from "react";

// Import frequently used pages directly for faster loading
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Payroll from "./pages/Payroll";

// Lazy load only rarely used pages
const Leave = lazy(() => import("./pages/Leave"));
const Performance = lazy(() => import("./pages/Performance"));
const Recruitment = lazy(() => import("./pages/Recruitment"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Branches = lazy(() => import("./pages/Branches"));
const CustomizedReports = lazy(() => import("./pages/CustomizedReports"));
const Check = lazy(() => import("./pages/Check"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15 minutes cache for better performance
      gcTime: 60 * 60 * 1000, // 1 hour garbage collection
      refetchOnWindowFocus: false,
      retry: 2,
      networkMode: 'offlineFirst', // Enable offline-first behavior
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Employees />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Attendance />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payroll"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Payroll />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leave"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
                        <Leave />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/performance"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
                        <Performance />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruitment"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
                        <Recruitment />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
                        <Reports />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/branches"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
                        <Branches />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
                        <Settings />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customized-reports"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
                        <CustomizedReports />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/check"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
                        <Check />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
