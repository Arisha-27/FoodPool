import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Loader2, Heart, SlidersHorizontal, Frown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface FoodItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  cook_id: string;
  cook_name: string;
  cook_avatar: string;
  dist_meters: number;
}

const RealDiscover = () => {
  const { user } = useAuth();
  
  // 1. Get Location from Global Context
  const { location, isLoading: locationLoading, requestLocation } = useLocation();

  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<number | null>(5); 

  // --- 2. Fetch Data ---
  useEffect(() => {
    if (location) {
      fetchFood();
    } else if (!locationLoading) {
        requestLocation();
    }
  }, [location, searchTerm, selectedDistance]); 

  // --- 3. Fetch Favorites ---
  useEffect(() => {
    if (user) fetchUserFavorites();
  }, [user]);

  const fetchFood = async () => {
    try {
      setLoading(true);

      // Handle "Anywhere" (-1) vs Specific Distance
      const radiusVal = selectedDistance ? selectedDistance * 1000 : -1;

      console.log("Calling search_food with radius:", radiusVal);

      // CALLING THE CORRECT FUNCTION NAME: 'search_food'
      const { data, error } = await supabase
        .rpc('search_food', { 
          lat: location!.latitude,
          long: location!.longitude,
          radius_meters: radiusVal,
          search_query: searchTerm || "" 
        });

      if (error) {
        console.error("Supabase RPC Error:", error);
        throw error;
      }

      setItems(data || []);
      
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast.error("Could not load food nearby.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFavorites = async () => {
    const { data } = await supabase.from('favorites').select('listing_id').eq('user_id', user?.id);
    if (data) {
      const ids = new Set<string>(data.map((item: any) => item.listing_id));
      setLikedItems(ids);
    }
  };

  const toggleLike = async (e: React.MouseEvent, foodId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to save favorites");
      return;
    }

    const isLiked = likedItems.has(foodId);
    
    // Optimistic Update
    const newLiked = new Set(likedItems);
    if (isLiked) newLiked.delete(foodId);
    else newLiked.add(foodId);
    setLikedItems(newLiked);

    try {
      if (isLiked) {
        await supabase.from('favorites').delete().match({ user_id: user.id, listing_id: foodId });
        toast("Removed from favorites");
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, listing_id: foodId });
        toast.success("Saved to favorites ❤️");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save");
      fetchUserFavorites();
    }
  };

  // Client Side Category Filter
  const filteredItems = items.filter(item => {
    if (selectedCategory) {
      return item.category.toLowerCase() === selectedCategory.toLowerCase();
    }
    return true;
  });

  const categories = [
    { label: 'Veg', icon: '🥬', value: 'Veg' },
    { label: 'Non-Veg', icon: '🍗', value: 'Non-Veg' },
    { label: 'Snacks', icon: '🍿', value: 'Snacks' },
    { label: 'Sweets', icon: '🍬', value: 'Sweets' },
  ];

  const distances = [
    { label: '1 km', value: 1 }, 
    { label: '5 km', value: 5 }, 
    { label: '10 km', value: 10 },
    { label: 'Anywhere', value: null }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Discover Food</h1>
                <p className="text-gray-500 flex items-center gap-2 text-sm mt-1">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    {location?.address || "Locating..."}
                </p>
            </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input 
                placeholder="Search for Biryani, Rajma Chawal..." 
                className="pl-12 h-12 bg-white rounded-xl shadow-sm border-gray-200 focus:ring-orange-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant={showFilters ? "secondary" : "outline"} 
              className={`h-12 px-6 rounded-xl gap-2 border-gray-200 ${showFilters ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-white'}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-top-2">
               <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
                <h3 className="font-semibold text-gray-900">Refine Results</h3>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={() => { setSelectedCategory(null); setSelectedDistance(5); setSearchTerm(''); }}
                >
                    Reset All
                </Button>
              </div>
              
              <div className="space-y-6">
                <div>
                   <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-wider">Category</label>
                   <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button 
                        key={cat.value} 
                        onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)} 
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-2 ${
                            selectedCategory === cat.value 
                            ? 'bg-orange-500 text-white border-orange-500 shadow-md' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-200 hover:text-orange-600'
                        }`}
                      >
                        <span>{cat.icon}</span> {cat.label}
                      </button>
                    ))}
                   </div>
                </div>

                <div>
                   <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-wider">Search Radius</label>
                   <div className="flex flex-wrap gap-2">
                    {distances.map((dist) => (
                      <button 
                        key={String(dist.label)} 
                        onClick={() => setSelectedDistance(dist.value)} 
                        className={`px-5 py-2 rounded-full border text-sm font-medium transition-all ${
                            selectedDistance === dist.value 
                            ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {dist.label}
                      </button>
                    ))}
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Grid */}
        {loading || locationLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
                <p className="text-gray-500">Scanning neighborhood kitchens...</p>
            </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((food) => (
              <Link to={`/food/${food.id}`} key={food.id} className="block group h-full">
                <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white h-full flex flex-col rounded-2xl">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <img 
                        src={food.image_url || '/placeholder.svg'} 
                        alt={food.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute top-3 right-3">
                      <span className="bg-white/95 backdrop-blur-sm text-gray-900 font-bold text-sm px-3 py-1.5 rounded-lg shadow-sm">
                        ₹{food.price}
                      </span>
                    </div>
                    <div className="absolute top-3 left-3">
                       <Badge variant="secondary" className="bg-white/95 text-gray-700 backdrop-blur-sm shadow-sm font-medium">
                            {food.category}
                       </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3">
                       <div className="bg-black/60 text-white backdrop-blur-md text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {food.dist_meters < 1000 
                                ? `${Math.round(food.dist_meters)}m` 
                                : `${(food.dist_meters / 1000).toFixed(1)} km`}
                       </div>
                    </div>
                    <button 
                      onClick={(e) => toggleLike(e, food.id)}
                      className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-sm transition-transform active:scale-95"
                    >
                      <Heart 
                        className={`w-5 h-5 transition-colors ${likedItems.has(food.id) ? "fill-red-500 text-red-500" : "text-gray-400"}`} 
                      />
                    </button>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">{food.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{food.description}</p>
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-50 mt-auto">
                      <Avatar className="h-8 w-8 border border-gray-100">
                        <AvatarImage src={food.cook_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${food.cook_name}`} />
                        <AvatarFallback>{food.cook_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-900 truncate max-w-[120px]">
                            {food.cook_name}
                          </span>
                          <span className="text-[10px] text-gray-400">Home Chef</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
               <Frown className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No food found nearby</h3>
            <p className="text-gray-500 max-w-sm mt-2 mb-6">
               We couldn't find any dishes within {selectedDistance ? `${selectedDistance}km` : 'range'}.
            </p>
            <Button 
                onClick={() => setSelectedDistance(null)} 
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
            >
                Search Everywhere
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default RealDiscover;