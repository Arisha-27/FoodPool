import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Random Name Generator (Same as Dashboard)
const getAnonymousName = (id: string) => {
  const adjectives = ["Happy", "Hungry", "Spicy", "Sweet", "Speedy", "Tasty", "Zesty", "Crunchy"];
  const animals = ["Panda", "Tiger", "Bear", "Eagle", "Koala", "Chef", "Fox", "Lion"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return `${adjectives[Math.abs(hash) % adjectives.length]} ${animals[Math.abs(hash >> 3) % animals.length]}`;
};

export default function CookReviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchReviews();
  }, [user]);

  const fetchReviews = async () => {
    try {
      const { data } = await supabase
        .from('orders')
        .select('id, rating, review, created_at')
        .eq('cook_id', user!.id)
        .neq('review', null) // Only fetch orders with reviews
        .order('created_at', { ascending: false });

      // Filter out empty strings too
      const validReviews = (data || []).filter(r => r.review && r.review.trim() !== '');
      setReviews(validReviews);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        
        <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">All Reviews</h1>
                <p className="text-gray-500 text-sm">See what your customers are saying</p>
            </div>
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" /></div>
        ) : reviews.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No reviews found.</div>
        ) : (
            <div className="grid gap-4">
                {reviews.map((r) => {
                    const randomName = getAnonymousName(r.id);
                    return (
                        <Card key={r.id} className="p-6 border-none shadow-sm bg-white rounded-2xl">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center shrink-0 text-lg font-bold text-orange-600">
                                    {randomName[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{randomName}</h3>
                                            <div className="flex items-center gap-1 mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400 font-medium">
                                            {new Date(r.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed">"{r.review}"</p>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        )}
      </main>
      <Footer />
    </div>
  );
}