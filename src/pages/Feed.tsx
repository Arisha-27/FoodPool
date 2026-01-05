import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/supabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, ChefHat, PlusCircle, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from '@/contexts/LocationContext'; // 🟢 Import Context
import FeedPost from '@/components/feed/FeedPost';

// Interface matching the FeedPost component requirements
interface FoodPost {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  dist_meters: number;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    username: string;
  };
}

const Feed = () => {
  const navigate = useNavigate();
  // 🟢 Use Global Location
  const { location, isLoading: locationLoading, requestLocation } = useLocation();
  
  const [posts, setPosts] = useState<FoodPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCook, setIsCook] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  // 1. Check User Status (Cook/Regular)
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_cook')
          .eq('id', user.id)
          .single();
        setIsCook(!!profile?.is_cook);
      }
    };
    checkUser();
  }, []);

  // 2. Fetch Feed when Location changes
  useEffect(() => {
    if (location) {
      fetchFeed();
    } else if (!locationLoading) {
      // Try to get location if we don't have it yet
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const fetchFeed = async () => {
    try {
      setLoading(true);

      // 🟢 Logic: Use Real Location or Fallback to Test Location (Arisha's)
      const TEST_LAT = 26.4677536423731;
      const TEST_LONG = 80.346298037978;

      const userLat = location?.latitude ? Number(location.latitude) : TEST_LAT;
      const userLong = location?.longitude ? Number(location.longitude) : TEST_LONG;

      // Using a larger radius for the Feed (e.g., 50km) so it always feels full
      const RADIUS = 50000; 

      const { data, error } = await supabase
        .rpc('search_food', {
          lat: userLat,
          long: userLong,
          radius_meters: RADIUS,
          search_query: ''
        });

      if (error) throw error;

      // 🟢 TRANSFORM DATA:
      // The RPC returns flat data (chef_name), but FeedPost expects nested (profiles.full_name).
      const formattedPosts: FoodPost[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.name,        // RPC calls it 'name', component wants 'title'
        description: item.description,
        price: item.price,
        image_url: item.image_url,
        dist_meters: item.dist_meters,
        created_at: new Date().toISOString(), // RPC doesn't return date, using current for now
        profiles: {
          full_name: item.chef_name,
          avatar_url: item.chef_avatar,
          username: item.chef_name // Fallback for username
        }
      }));

      setPosts(formattedPosts);

    } catch (error: any) {
      console.error("Feed error:", error);
      toast.error("Failed to refresh feed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 container max-w-lg mx-auto py-8 px-4">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-display text-gray-900 tracking-tight">
            What's Cooking?
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
             <MapPin className="w-3 h-3 text-orange-500" />
             <p className="text-gray-500 text-sm">
                Near {location?.address ? location.address.split(',')[0] : "You"}
             </p>
          </div>
        </div>

        {/* Loading State */}
        {(loading || locationLoading) && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
            <p className="text-gray-400 text-sm">Finding fresh meals...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !locationLoading && posts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-100 shadow-sm px-6">
            <ChefHat className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <h3 className="font-bold text-xl text-gray-900">No food found nearby</h3>
            <p className="text-gray-400 text-sm mt-2 mb-6">
                Be the first to add a dish in this area!
            </p>
            {isCook && (
               <Button onClick={() => navigate('/add-food')} className="bg-orange-500 hover:bg-orange-600 rounded-xl font-bold px-8">
                 Start Cooking
               </Button>
            )}
          </div>
        )}

        {/* Feed Posts */}
        <div className="space-y-8">
          {posts.map((post) => (
            <FeedPost key={post.id} post={post} currentUserId={currentUserId} />
          ))}
        </div>
      </main>

      {/* Floating Add Button for Cooks */}
      {isCook && (
        <div className="fixed bottom-24 right-6 sm:right-12 z-50">
          <Link to="/add-food">
            <Button className="h-14 w-14 rounded-full bg-orange-600 hover:bg-orange-700 shadow-2xl p-0 flex items-center justify-center border-2 border-white transform hover:rotate-90 transition-all duration-300">
              <PlusCircle className="w-8 h-8 text-white" />
            </Button>
          </Link>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Feed;