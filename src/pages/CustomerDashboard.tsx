import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import {
  ShoppingBag,
  Heart,
  Clock,
  MapPin,
  Star,
  ArrowRight,
  Package,
  CheckCircle,
  Loader2,
  CreditCard,
  Utensils,
  ChefHat,
  XCircle
} from 'lucide-react';

// --- Types ---
interface Order {
  id: string;
  total_price: number;
  status: string;
  created_at: string;
  quantity: number;
  cook_id: string;
  rating?: number;
  listing: { title: string; image_url: string; price: number };
  cook: { full_name: string; avatar_url: string };
}

interface FavoriteItem {
  id: string;
  listing: {
    id: string;
    title: string;
    price: number;
    image_url: string;
    cook_id: string;
    profiles: { full_name: string };
  };
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // --- Data Fetching ---
  useEffect(() => {
    if (user) {
      Promise.all([fetchOrders(), fetchFavorites()]).finally(() => setLoading(false));
      setupRealtime();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, total_price, status, created_at, quantity, cook_id, rating,
          listing:listing_id ( title, image_url, price ),
          cook:cook_id ( full_name, avatar_url )
        `)
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data as any || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          listing:listing_id (
            id, title, price, image_url, cook_id,
            profiles:cook_id ( full_name )
          )
        `)
        .eq('user_id', user!.id);

      if (error) throw error;
      setFavorites(data as any || []);
    } catch (err) {
      console.error(err);
    }
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel('customer_dashboard')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `customer_id=eq.${user?.id}` }, 
        (payload) => {
          fetchOrders();
          if (payload.new.status === 'accepted') toast.success("Order accepted! Please proceed to pay.");
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const handleRateOrder = async (orderId: string, rating: number, review: string) => {
    const { error } = await supabase.from('orders').update({ rating, review }).eq('id', orderId);
    if (error) toast.error("Failed to rate");
    else {
        toast.success("Thank you for your feedback!");
        fetchOrders();
    }
  };

  // --- Stats Calculation ---
  const stats = {
    totalOrders: orders.length,
    favoritesCount: favorites.length,
    totalSpent: orders.filter(o => o.status !== 'cancelled').reduce((acc, curr) => acc + curr.total_price, 0),
    cooksSupported: new Set(orders.map(o => o.cook_id)).size,
  };

  // --- Helper for Badges ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3" /> Requested</Badge>;
      case 'accepted': return <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3" /> Accepted</Badge>;
      case 'confirmed': return <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-800"><ChefHat className="w-3 h-3" /> Confirmed</Badge>;
      case 'ready': return <Badge variant="secondary" className="gap-1 bg-green-500 text-white animate-pulse"><Utensils className="w-3 h-3" /> Ready for Pickup</Badge>;
      case 'completed': return <Badge variant="secondary" className="gap-1 bg-gray-100 text-gray-600"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // --- Safe Name Display ---
  const getDisplayName = () => {
    // FIX: Cast to 'any' to bypass the TypeScript error
    const metaName = (user as any)?.user_metadata?.full_name;
    
    // Fallback if metadata is missing
    return metaName ? metaName.split(' ')[0] : 'Foodie';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                Welcome back, {getDisplayName()}! 👋
              </h1>
              <p className="text-gray-500">
                Discover delicious homemade food from your neighborhood
              </p>
            </div>
            <Link to="/discover">
              <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6 shadow-md">
                <MapPin className="w-4 h-4" />
                Find Food Near Me
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-sm text-gray-500">Total Orders</p>
              </div>
            </Card>

            <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.favoritesCount}</p>
                <p className="text-sm text-gray-500">Favorites</p>
              </div>
            </Card>

            <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalSpent}</p>
                <p className="text-sm text-gray-500">Total Spent</p>
              </div>
            </Card>

            <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.cooksSupported}</p>
                <p className="text-sm text-gray-500">Cooks Supported</p>
              </div>
            </Card>
          </div>

          {/* Recent Orders Section */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-600" /></div>
            ) : orders.length > 0 ? (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <Card key={order.id} className="p-4 border-none shadow-sm bg-white rounded-2xl hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <img
                        src={order.listing?.image_url}
                        alt={order.listing?.title}
                        className="w-full sm:w-24 h-24 rounded-xl object-cover bg-gray-100"
                      />
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {order.listing?.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              by {order.cook?.full_name} • Qty: {order.quantity}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(order.status)}
                            <span className="text-sm text-gray-400">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                          <span className="text-lg font-bold text-orange-600">
                            ₹{order.total_price}
                          </span>
                          
                          {/* ACTIONS */}
                          <div className="flex gap-2">
                            {/* 1. PAY NOW Button */}
                            {order.status === 'accepted' && (
                                <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                    onClick={() => navigate(`/payment/${order.id}`)}
                                >
                                    <CreditCard className="w-4 h-4" /> Pay Now
                                </Button>
                            )}

                            {/* 2. RATE COOK Button */}
                            {order.status === 'completed' && !order.rating && (
                                <RateDialog order={order} onRate={handleRateOrder} />
                            )}
                            
                            {/* 3. SHOW RATING */}
                            {order.rating && (
                                <div className="flex items-center text-yellow-500 font-bold text-sm bg-yellow-50 px-3 py-1 rounded-full">
                                    <Star className="w-4 h-4 fill-yellow-500 mr-1" /> {order.rating}
                                </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center border-dashed border-2 bg-gray-50 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <ShoppingBag className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-500 mb-6">Start exploring delicious homemade food near you!</p>
                <Link to="/discover">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full">
                    Discover Food
                  </Button>
                </Link>
              </Card>
            )}
          </div>

          {/* Favorites Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Your Favorites</h2>
              <Link to="/discover">
                <Button variant="ghost" size="sm" className="gap-2 text-orange-600 hover:text-orange-700">
                  Discover More <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {favorites.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((fav) => (
                  <Link key={fav.id} to={`/food/${fav.listing.id}`}>
                    <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all group bg-white rounded-2xl">
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={fav.listing.image_url}
                          alt={fav.listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm">
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900">{fav.listing.title}</h3>
                            <p className="text-sm text-gray-500">by {fav.listing.profiles.full_name}</p>
                          </div>
                          <Badge variant="secondary" className="bg-orange-50 text-orange-700">₹{fav.listing.price}</Badge>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center bg-white border-none shadow-sm rounded-2xl">
                <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">No favorites yet</h3>
                <p className="text-sm text-gray-500">Save your favorite dishes for quick access</p>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// --- Rate Dialog Subcomponent ---
function RateDialog({ order, onRate }: any) {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-yellow-400 text-yellow-600 hover:bg-yellow-50">
                    <Star className="w-4 h-4 mr-1" /> Rate Cook
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Rate {order.cook.full_name}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110 focus:outline-none">
                                <Star className={`w-8 h-8 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                            </button>
                        ))}
                    </div>
                    <Textarea 
                        placeholder="How was the food?" 
                        value={review} 
                        onChange={(e) => setReview(e.target.value)} 
                        className="resize-none"
                    />
                    <Button onClick={() => onRate(order.id, rating, review)} disabled={rating === 0} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                        Submit Review
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
