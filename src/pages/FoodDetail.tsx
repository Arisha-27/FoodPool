import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MapPin, Clock, Minus, Plus, Loader2, ChefHat, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function FoodDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [food, setFood] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    async function loadDish() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('listings')
          .select(`*, profiles:cook_id ( full_name, avatar_url )`) // Ensure avatar_url is selected
          .eq('id', id)
          .single();

        if (error) throw error;
        setFood(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDish();
  }, [id]);

  const handleOrder = async () => {
    if (!user) {
      toast.error("Please login to place an order");
      navigate('/auth');
      return;
    }

    try {
      setOrderLoading(true);
      const totalPrice = food.price * quantity;

      const { error } = await supabase
        .from('orders')
        .insert([
          {
            customer_id: user.id,
            cook_id: food.cook_id,
            listing_id: food.id,
            quantity: quantity,
            total_price: totalPrice,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      toast.success("Order placed successfully! 🎉");
      navigate('/customer-dashboard');

    } catch (error: any) {
      console.error(error);
      toast.error("Failed to order: " + error.message);
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  if (!food) return <div>Dish not found</div>;

  const totalPrice = food.price * quantity;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      
      {/* Hero Image */}
      <div className="relative h-[40vh] bg-gray-900">
        <img src={food.image_url} className="w-full h-full object-cover opacity-90" alt={food.title} />
        <Button variant="secondary" size="icon" className="absolute top-24 left-4 rounded-full shadow-lg" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="container mx-auto px-4 -mt-10 relative z-10 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-4xl font-bold font-display mb-2">{food.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                     <Badge variant="outline" className={food.category === 'veg' ? 'text-green-600 border-green-200' : 'text-orange-600 border-orange-200'}>
                       {food.category === 'veg' ? '🥬 Veg' : '🍖 Non-Veg'}
                     </Badge>
                     <span className="flex items-center gap-1.5 font-medium">
                       <Clock className="w-4 h-4 text-blue-500" /> Today
                     </span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-600">₹{food.price}</div>
              </div>
              <p className="text-gray-600 border-t pt-6 leading-relaxed">{food.description}</p>
            </div>

            {/* Cook Profile Section with Working Avatar */}
            <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-5 border border-gray-100">
              <Avatar className="w-16 h-16 border-2 border-orange-50 shadow-sm">
                {/* 1. Prioritize permanent avatar_url from database */}
                <AvatarImage src={food.profiles?.avatar_url} alt={food.profiles?.full_name} />
                {/* 2. Fallback to generated initials if URL is NULL */}
                <AvatarFallback className="bg-orange-100 text-orange-700 font-bold text-lg">
                  {food.profiles?.full_name?.[0] || 'C'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-0.5">Kitchen Master</p>
                <h3 className="font-bold text-xl text-gray-900">{food.profiles?.full_name || "Home Cook"}</h3>
                <div className="flex items-center gap-1 text-xs text-green-600 font-bold mt-1">
                   <ChefHat className="w-3.5 h-3.5" /> Verified Home Kitchen
                </div>
              </div>
              <Button variant="soft" className="gap-2 rounded-xl bg-gray-50 hover:bg-gray-100 border-none">
                <MessageCircle className="w-4 h-4" /> Chat
              </Button>
            </div>
          </div>

          {/* Checkout Box */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-50 sticky top-24">
              <h3 className="text-xl font-bold mb-8">Place Order</h3>
              
              <div className="flex justify-between items-center mb-8">
                <span className="font-bold text-gray-700">Quantity</span>
                <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-1.5 border border-gray-100">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><Minus className="w-4 h-4 text-gray-600"/></button>
                  <span className="font-black text-lg w-6 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><Plus className="w-4 h-4 text-gray-600"/></button>
                </div>
              </div>

              <div className="space-y-3 mb-8 border-t pt-6 text-sm font-medium">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{totalPrice}</span></div>
                <div className="flex justify-between text-gray-500"><span>Platform Fee</span><span>₹10</span></div>
                <div className="flex justify-between font-black text-xl pt-4 border-t mt-4 text-gray-900"><span>Total</span><span>₹{totalPrice + 10}</span></div>
              </div>

              <Button 
                className="w-full h-14 text-lg font-bold bg-orange-600 hover:bg-orange-700 rounded-xl shadow-lg transform active:scale-95 transition-all"
                onClick={handleOrder}
                disabled={orderLoading}
              >
                {orderLoading ? <Loader2 className="animate-spin" /> : `Pay ₹${totalPrice + 10}`}
              </Button>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}