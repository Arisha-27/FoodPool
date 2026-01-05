import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Star, MapPin, Clock, User } from 'lucide-react'; // Added User icon
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/supabaseClient';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function FoodCard({ food }: { food: any }) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  // DEBUG: Check what data we are getting
  // useEffect(() => { console.log("Food Data:", food); }, [food]);

  useEffect(() => {
    if (user) checkIfLiked();
  }, [user]);

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user?.id)
      .eq('listing_id', food.id)
      .single();
    if (data) setIsLiked(true);
  };

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to save favorites");
      return;
    }
    setLoading(true);
    if (isLiked) {
      const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', food.id);
      if (!error) { setIsLiked(false); toast.success("Removed from favorites"); }
    } else {
      const { error } = await supabase.from('favorites').insert([{ user_id: user.id, listing_id: food.id }]);
      if (!error) { setIsLiked(true); toast.success("Added to favorites"); }
    }
    setLoading(false);
  };

  // 1. SAFE NAME CHECK
  // We check full_name, then username, then fallback to "Home Cook"
  const chefName = food.profiles?.full_name || food.profiles?.username || "Home Cook";
  
  // 2. SAFE AVATAR CHECK
  const chefAvatar = food.profiles?.avatar_url;

  return (
    <Link to={`/food/${food.id}`} className="group">
      <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl bg-white h-full flex flex-col relative">
        
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={food.image_url || "/placeholder.svg"}
            alt={food.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent opacity-60" />
          
          <div className="absolute top-3 left-3">
             <Badge variant="secondary" className="bg-white/90 backdrop-blur text-xs font-bold text-gray-800 shadow-sm border-none px-2 py-1">
              {food.category === 'Veg' ? '🥬' : food.category === 'Non-Veg' ? '🍖' : '🍽️'} {food.category}
             </Badge>
          </div>

          <button
            onClick={toggleLike}
            disabled={loading}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all active:scale-95 ${
              isLiked 
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                : 'bg-white/30 text-white hover:bg-white hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          <div className="absolute bottom-3 right-3 bg-white text-gray-900 px-3 py-1 rounded-full font-bold text-sm shadow-lg">
            ₹{food.price}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors mb-3">
            {food.title}
          </h3>

          {/* CHEF INFO ROW */}
          <div className="flex items-center gap-2 mb-4">
             {/* Avatar Circle */}
             <div className="w-6 h-6 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
               {chefAvatar ? (
                 <img src={chefAvatar} alt={chefName} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                   <User className="w-3 h-3" />
                 </div>
               )}
             </div>
             {/* Chef Name */}
             <span className="text-sm font-medium text-gray-700 truncate">{chefName}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-3 border-t border-gray-50">
             <div className="flex items-center gap-1">
               <MapPin className="w-3 h-3 text-orange-500" />
               <span>{food.dist_meters ? `${(food.dist_meters / 1000).toFixed(1)} km` : 'Nearby'}</span>
             </div>
             
             <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-500" />
                <span>Today</span>
             </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}