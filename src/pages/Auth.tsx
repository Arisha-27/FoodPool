import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ChefHat, User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, signup, isAuthenticated } = useAuth();

  const [isSignup, setIsSignup] = useState(searchParams.get('mode') === 'signup');
  const [role, setRole] = useState<'cook' | 'customer'>(
    (searchParams.get('role') as 'cook' | 'customer') || 'customer'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/discover');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignup) {
        if (!formData.name) {
          toast.error('Please enter your name');
          setIsLoading(false);
          return;
        }
        await signup(formData.name, formData.email, formData.password, role);
        toast.success('Welcome to FoodPool! 🎉');
      } else {
        await login(formData.email, formData.password);
        toast.success('Welcome back! 👋');
      }
      navigate('/discover');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card variant="elevated" className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-warm flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              {isSignup
                ? 'Join the FoodPool community today'
                : 'Sign in to discover homemade food near you'}
            </p>
          </div>

          {/* Role Selection (Signup only) */}
          {isSignup && (
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  role === 'customer'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <User className={`w-6 h-6 mx-auto mb-2 ${role === 'customer' ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className={`text-sm font-medium ${role === 'customer' ? 'text-primary' : 'text-muted-foreground'}`}>
                  I want to buy food
                </p>
              </button>
              <button
                type="button"
                onClick={() => setRole('cook')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  role === 'cook'
                    ? 'border-secondary bg-secondary/5'
                    : 'border-border hover:border-secondary/50'
                }`}
              >
                <ChefHat className={`w-6 h-6 mx-auto mb-2 ${role === 'cook' ? 'text-secondary' : 'text-muted-foreground'}`} />
                <p className={`text-sm font-medium ${role === 'cook' ? 'text-secondary' : 'text-muted-foreground'}`}>
                  I want to cook & sell
                </p>
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading
                ? 'Please wait...'
                : isSignup
                ? 'Create Account'
                : 'Sign In'}
            </Button>
          </form>

          {/* Switch Mode */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-primary font-medium hover:underline"
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </Card>

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our{' '}
          <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
          and{' '}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default Auth;
