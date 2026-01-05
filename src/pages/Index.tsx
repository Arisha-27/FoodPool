import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FoodCard from '@/components/food/FoodCard';
import { mockFoodItems } from '@/data/mockData';
import heroImage from '@/assets/hero-food.jpg';
import {
  MapPin,
  ChefHat,
  Users,
  Leaf,
  ArrowRight,
  Star,
  Clock,
  Shield,
} from 'lucide-react';

const Index = () => {
  const { isAuthenticated } = useAuth();

  const featuredFood = mockFoodItems.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Delicious homemade Indian food"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
        </div>

        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-6 animate-fade-up">
              🍳 India's First Homemade Food Sharing Platform
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Share Food,{' '}
              <span className="text-primary">Spread Joy</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              Connect with talented home cooks in your neighborhood. Discover authentic homemade meals, reduce food waste, and earn from your culinary skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              {isAuthenticated ? (
                <Link to="/discover">
                  <Button variant="hero" size="xl" className="gap-2">
                    Discover Food Near You
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth?mode=signup">
                    <Button variant="hero" size="xl" className="gap-2">
                      Get Started Free
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button variant="outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                      Login
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-12 animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <div>
                <p className="text-3xl font-bold text-primary-foreground">10K+</p>
                <p className="text-sm text-primary-foreground/60">Home Cooks</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-foreground">50K+</p>
                <p className="text-sm text-primary-foreground/60">Happy Customers</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-foreground">100+</p>
                <p className="text-sm text-primary-foreground/60">Cities</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="distance" className="mb-4">How It Works</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, Safe & Delicious
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              FoodPool connects you with home cooks in your neighborhood. No delivery personnel — just fresh, homemade food picked up from your neighbor's kitchen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card variant="interactive" className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl gradient-warm flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">1. Find Nearby Food</h3>
              <p className="text-muted-foreground">
                Browse homemade dishes available near you. Filter by distance, cuisine, and dietary preferences.
              </p>
            </Card>

            <Card variant="interactive" className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl gradient-fresh flex items-center justify-center mx-auto mb-6">
                <ChefHat className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">2. Connect & Order</h3>
              <p className="text-muted-foreground">
                Chat with the cook, confirm your order, and pay securely through the platform.
              </p>
            </Card>

            <Card variant="interactive" className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">3. Pick Up & Enjoy</h3>
              <p className="text-muted-foreground">
                Walk to the cook's location, pick up your fresh meal, and enjoy authentic homemade food!
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Food */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <Badge variant="veg" className="mb-4">Featured Today</Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Fresh From Your Neighbors
              </h2>
              <p className="text-muted-foreground">
                Discover what's cooking in kitchens near you
              </p>
            </div>
            <Link to={isAuthenticated ? '/discover' : '/auth'}>
              <Button variant="soft" className="gap-2 mt-4 md:mt-0">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredFood.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-foreground text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary-foreground/10 text-primary-foreground border-0">
              Why FoodPool
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Better For Everyone
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Reduce Food Waste</h3>
              <p className="text-sm text-primary-foreground/60">
                Extra food finds a home instead of the trash
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                <Star className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">Authentic Taste</h3>
              <p className="text-sm text-primary-foreground/60">
                Real home cooking, not mass-produced meals
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Earn Extra Income</h3>
              <p className="text-sm text-primary-foreground/60">
                Turn your cooking skills into earnings
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Safe & Secure</h3>
              <p className="text-sm text-primary-foreground/60">
                Verified cooks and secure payments
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card variant="elevated" className="gradient-warm p-8 md:p-12 text-center overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTZzLTItNC0yLTYgMi00IDItNi0yLTQtMi02IDItNC0yLTYgMi00IDItNiAyLTQgMi02LTItNC0yLTZoMmMwIDIgMiA0IDIgNnMtMiA0LTIgNiAyIDQgMiA2LTIgNC0yIDYgMiA0IDIgNi0yIDQtMiA2IDIgNCAyIDYtMiA0LTIgNmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to Start Cooking?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Join thousands of home cooks earning money while sharing delicious food with their neighbors.
              </p>
              <Link to="/auth?mode=signup&role=cook">
                <Button size="xl" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2">
                  <ChefHat className="w-5 h-5" />
                  Become a Cook
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
