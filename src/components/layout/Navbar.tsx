import { Link, useLocation as useRouteLocation } from 'react-router-dom'; // Renamed to avoid conflict
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext'; // Import our custom hook
import { 
  MapPin, 
  User, 
  ChefHat, 
  LogOut, 
  Menu, 
  X, 
  ShoppingBag, 
  Compass, 
  Rss,
  IndianRupee,
  PlusCircle, 
  ClipboardList 
} from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const routeLocation = useRouteLocation(); // Use renamed hook for routing
  const { location } = useLocation(); // Use our Location Context
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => routeLocation.pathname === path;

  // Role Checks
  const isCook = user?.is_cook === true;
  const isCustomer = user?.is_cook === false;

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              Food<span className="text-primary">Pool</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated && (
              <>
                {/* 🛒 CUSTOMER LINKS */}
                {isCustomer && (
                  <>
                    <Link
                      to="/discover"
                      className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        isActive('/discover') ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Compass className="w-4 h-4" />
                      Discover
                    </Link>

                    <Link
                      to="/customer-dashboard"
                      className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        isActive('/customer-dashboard') ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      My Orders
                    </Link>
                  </>
                )}

                {/* 👨‍🍳 COOK LINKS */}
                {isCook && (
                  <>
                    <Link
                      to="/cook-dashboard"
                      className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        isActive('/cook-dashboard') ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <ChefHat className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      to="/cook-orders"
                      className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        isActive('/cook-orders') ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <ClipboardList className="w-4 h-4" />
                      Orders
                    </Link>
                    <Link
                      to="/cook-earnings"
                      className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        isActive('/cook-earnings') ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <IndianRupee className="w-4 h-4" />
                      Earnings
                    </Link>
                  </>
                )}

                {/* Shared Links */}
                <Link
                  to="/feed"
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/feed') ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Rss className="w-4 h-4" />
                  Food Feed
                </Link>
              </>
            )}
          </div>

          {/* Right Section (Location, Profile, Logout) */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* 📍 REAL-TIME LOCATION BADGE */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border/50 max-w-[200px]">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground truncate">
                    {location?.address || "Locating..."}
                  </span>
                </div>

                <Link to="/profile">
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="hero">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* 📱 Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-up">
            <div className="flex flex-col gap-3">
              {isAuthenticated ? (
                <>
                  {/* Mobile Location Badge */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg mx-4 mb-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-600 truncate">
                       {location?.address || "Locating..."}
                    </span>
                  </div>

                  {/* Customer Mobile Links */}
                  {isCustomer && (
                    <>
                      <Link
                        to="/discover"
                        className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg flex items-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Compass className="w-4 h-4" />
                        Discover Food
                      </Link>
                      <Link
                        to="/customer-dashboard"
                        className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg flex items-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        My Orders
                      </Link>
                    </>
                  )}

                  {/* Cook Mobile Links */}
                  {isCook && (
                    <>
                      <Link
                        to="/cook-dashboard"
                        className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg flex items-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <ChefHat className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <Link
                        to="/cook-orders"
                        className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg flex items-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <ClipboardList className="w-4 h-4" />
                        Orders
                      </Link>
                      <Link
                        to="/add-food"
                        className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg flex items-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <PlusCircle className="w-4 h-4" />
                        Add Food
                      </Link>
                    </>
                  )}

                  <Link
                    to="/feed"
                    className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Rss className="w-4 h-4" />
                    Food Feed
                  </Link>

                  <div className="border-t border-gray-100 my-1"></div>

                  <Link
                    to="/profile"
                    className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <button
                    className="px-4 py-2 text-sm font-medium text-destructive hover:bg-muted rounded-lg text-left flex items-center gap-2"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/auth?mode=signup"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="hero" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;