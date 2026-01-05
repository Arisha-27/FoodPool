import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Loader2, Store, ShoppingBag, TrendingUp, IndianRupee, PlusCircle,
  Edit, Trash2, Eye, Star, MessageSquare, ArrowRight, Power
} from 'lucide-react';
import { toast } from 'sonner';

// --- Interfaces ---
interface Listing {
  id: string;
  title: string;
  price: number;
  image_url: string;
  category: string;
  is_active: boolean;
  description: string;
}

interface Review {
  id: string;
  rating: number;
  review: string;
  created_at: string;
}

// --- Helper: Random Name Generator ---
const getAnonymousName = (id: string) => {
  const adjectives = ["Happy", "Hungry", "Spicy", "Sweet", "Speedy", "Tasty", "Zesty", "Crunchy"];
  const animals = ["Panda", "Tiger", "Bear", "Eagle", "Koala", "Chef", "Fox", "Lion"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  
  const adjIndex = Math.abs(hash) % adjectives.length;
  const animIndex = Math.abs(hash >> 3) % animals.length;
  
  return `${adjectives[adjIndex]} ${animals[animIndex]}`;
};

export default function CookDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stats State
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalOrders: 0,
    activeListings: 0,
    thisMonthEarnings: 0,
    rating: 0,
    totalReviews: 0
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Listings
      const { data: listingsData } = await supabase
        .from('listings')
        .select('*')
        .eq('cook_id', user!.id)
        .order('created_at', { ascending: false });
      setListings(listingsData || []);

      // 2. Fetch Orders (For Stats & Reviews)
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, total_price, status, created_at, rating, review')
        .eq('cook_id', user!.id)
        .neq('status', 'cancelled'); 

      // 3. Fetch Profile (For Average Rating)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('average_rating, total_ratings')
        .eq('id', user!.id)
        .single();

      // --- CALCULATIONS ---
      const orders = ordersData || [];
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      setStats({
        totalEarnings: orders.reduce((sum, o) => sum + o.total_price, 0),
        totalOrders: orders.length,
        activeListings: listingsData?.filter(l => l.is_active).length || 0,
        thisMonthEarnings: orders
          .filter(o => new Date(o.created_at) >= startOfMonth)
          .reduce((sum, o) => sum + o.total_price, 0),
        rating: profileData?.average_rating || 0,
        totalReviews: profileData?.total_ratings || 0
      });

      // Reviews (Filter valid ones & Sort)
      const validReviews = orders
        .filter(o => o.review && o.review.trim() !== '')
        .map(o => ({
          id: o.id,
          rating: o.rating,
          review: o.review,
          created_at: o.created_at
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setReviews(validReviews);

    } catch (err: any) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // --- TOGGLE STATUS FUNCTION ---
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
        const { error } = await supabase
            .from('listings')
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (error) throw error;
        
        // Optimistic Update
        setListings(prev => prev.map(l => l.id === id ? { ...l, is_active: !currentStatus } : l));
        toast.success(currentStatus ? "Listing deactivated (Hidden)" : "Listing activated (Visible)");
        
        // Update stats
        setStats(prev => ({
            ...prev,
            activeListings: prev.activeListings + (currentStatus ? -1 : 1)
        }));

    } catch (err) {
        toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this dish?")) return;
    try {
      const { error } = await supabase.from('listings').delete().eq('id', id);
      if (error) throw error;
      toast.success("Dish deleted");
      fetchDashboardData(); 
    } catch (err) {
      toast.error("Could not delete");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900 flex items-center gap-2">
              My Kitchen <span className="text-2xl">👨‍🍳</span>
            </h1>
            <p className="text-gray-500">Manage your food listings and track your earnings</p>
          </div>
          <Link to="/add-food">
            <Button className="bg-orange-500 hover:bg-orange-600 gap-2 shadow-md text-white">
              <PlusCircle className="w-4 h-4" /> Add New Listing
            </Button>
          </Link>
        </div>

        {/* 📊 STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><IndianRupee className="w-6 h-6" /></div>
            <div><h3 className="text-2xl font-bold text-gray-900">₹{stats.totalEarnings}</h3><p className="text-sm text-gray-500 font-medium">Total Earnings</p></div>
          </Card>
          <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600"><ShoppingBag className="w-6 h-6" /></div>
            <div><h3 className="text-2xl font-bold text-gray-900">{stats.totalOrders}</h3><p className="text-sm text-gray-500 font-medium">Total Orders</p></div>
          </Card>
          <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><TrendingUp className="w-6 h-6" /></div>
            <div><h3 className="text-2xl font-bold text-gray-900">₹{stats.thisMonthEarnings}</h3><p className="text-sm text-gray-500 font-medium">This Month</p></div>
          </Card>
          <Card className="p-6 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600"><Star className="w-6 h-6 fill-yellow-600" /></div>
            <div><h3 className="text-2xl font-bold text-gray-900 flex items-center gap-1">{stats.rating} <span className="text-sm text-gray-400 font-normal">/ 5</span></h3><p className="text-sm text-gray-500 font-medium">{stats.totalReviews} Ratings</p></div>
          </Card>
        </div>

        {/* 💬 REVIEWS SECTION */}
        <div className="mb-10">
            {(() => {
                const REVIEW_LIMIT = 2; 
                return (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-gray-400" /> Recent Feedback
                            </h2>
                            {reviews.length > REVIEW_LIMIT && (
                                <Link to="/cook-reviews">
                                    <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 gap-1 font-semibold">
                                        View All ({reviews.length}) <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {reviews.length === 0 ? (
                            <div className="bg-white p-8 rounded-2xl text-center border-dashed border border-gray-200">
                                <p className="text-gray-400 italic">No written reviews yet.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {reviews.slice(0, REVIEW_LIMIT).map((r) => {
                                    const randomName = getAnonymousName(r.id);
                                    return (
                                        <Card key={r.id} className="p-4 border-none shadow-sm bg-white rounded-2xl hover:shadow-md transition-all">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center shrink-0">
                                                    <span className="text-sm font-bold text-orange-600">{randomName[0]}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-bold text-gray-900 text-sm">{randomName}</p>
                                                        <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 mb-2">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                                                        ))}
                                                    </div>
                                                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">"{r.review}"</p>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </>
                );
            })()}
        </div>

        {/* 🥘 LISTINGS SECTION */}
        <div className="mb-6">
           <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-bold text-gray-900">My Listings <span className="text-gray-400 text-sm font-normal">({stats.activeListings} Active)</span></h2>
           </div>
           
           {loading ? (
             <div className="text-center py-12"><Loader2 className="animate-spin w-8 h-8 text-orange-500 mx-auto" /></div>
           ) : listings.length === 0 ? (
             <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-100">
                <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No dishes added yet</h3>
                <p className="text-gray-500 mb-4">Add your first delicious meal to start selling!</p>
                <Link to="/add-food">
                  <Button variant="outline">Add Food</Button>
                </Link>
             </div>
           ) : (
             <div className="space-y-4">
               {listings.map((item) => (
                 <Card key={item.id} className={`p-4 border-none shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4 rounded-xl transition-all ${!item.is_active ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
                    {/* Image Container */}
                    <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
                      <img src={item.image_url || '/placeholder.svg'} alt={item.title} className={`w-full h-full object-cover ${!item.is_active ? 'grayscale' : ''}`} />
                      {!item.is_active && (
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                              <Eye className="w-6 h-6 text-white drop-shadow-md" />
                          </div>
                      )}
                    </div>

                    <div className="flex-1 w-full">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-lg text-gray-900">{item.title}</h3>
                        <span className="font-bold text-lg text-gray-900">₹{item.price}</span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1 mb-2">{item.description}</p>
                      
                      <div className="flex gap-2">
                        <Badge variant="secondary" className={item.category === 'Veg' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                          {item.category}
                        </Badge>
                        <Badge className={`border-none ${item.is_active ? 'bg-blue-50 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto justify-end">
                      {/* Toggle Status Button */}
                      <Button 
                        size="sm" 
                        variant={item.is_active ? "outline" : "default"}
                        className={`gap-1 transition-colors ${item.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        onClick={() => toggleStatus(item.id, item.is_active)}
                      >
                        <Power className="w-3 h-3" />
                        {item.is_active ? "Deactivate" : "Activate"}
                      </Button>

                      <Button 
                        variant="ghost" size="sm" 
                        className="text-gray-500 hover:text-blue-600 gap-1"
                        onClick={() => navigate(`/edit-food/${item.id}`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button 
                        variant="ghost" size="sm" 
                        className="text-gray-500 hover:text-green-600 gap-1" 
                        onClick={() => window.open(`/food/${item.id}`, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button 
                        variant="ghost" size="sm" 
                        className="text-gray-500 hover:text-red-600 gap-1" 
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                 </Card>
               ))}
             </div>
           )}
        </div>

      </main>
      <Footer />
    </div>
  );
}