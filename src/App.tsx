import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CookReviews from "./pages/CookReviews";

// Shared Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import FoodDetail from "./pages/FoodDetail";
import Payment from "./pages/Payment";

// Customer Pages
import CustomerDashboard from "./pages/CustomerDashboard";
import Discover from "./pages/Discover"; // Renamed from RealDiscover to match file structure

// Cook Pages
import CookDashboard from "./pages/CookDashboard";
import CookOrders from "./pages/CookOrders";
import CookEarnings from "./pages/CookEarnings";
import AddFood from "./pages/AddFood";
import EditFood from "./pages/EditFood";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LocationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* --- Public Routes --- */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* --- Customer Routes --- */}
              <Route
                path="/customer-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/discover"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Discover />
                  </ProtectedRoute>
                }
              />
              {/* Payment Page (Protected for authenticated users) */}
              <Route 
                path="/payment/:orderId" 
                element={
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                } 
              />
              
              {/* --- Cook Routes --- */}
              <Route
                path="/cook-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['cook']}>
                    <CookDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cook-orders"
                element={
                  <ProtectedRoute allowedRoles={['cook']}>
                    <CookOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cook-reviews"
                element={
                  <ProtectedRoute allowedRoles={['cook']}>
                    <CookReviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cook-earnings"
                element={
                  <ProtectedRoute allowedRoles={['cook']}>
                    <CookEarnings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-food"
                element={
                  <ProtectedRoute allowedRoles={['cook']}>
                    <AddFood />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-food/:id"
                element={
                  <ProtectedRoute allowedRoles={['cook']}>
                    <EditFood />
                  </ProtectedRoute>
                }
              />

              {/* --- Shared Routes (Accessible by both) --- */}
              <Route
                path="/food/:id"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'cook']}> 
                    <FoodDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/feed"
                element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LocationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;