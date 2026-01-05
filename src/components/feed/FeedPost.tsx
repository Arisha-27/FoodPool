import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Heart, MessageCircle, Share2, Send, ChefHat } from 'lucide-react';
import { toast } from 'sonner';

interface FeedPostProps {
  post: any;
  currentUserId: string | undefined;
}

export default function FeedPost({ post, currentUserId }: FeedPostProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // 1. Check if user already liked this post on load
  useEffect(() => {
    if (currentUserId) checkLikeStatus();
  }, [currentUserId]);

  const checkLikeStatus = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('listing_id', post.id)
      .single();
    if (data) setIsLiked(true);
  };

  // 2. LIKE / UNLIKE FUNCTION
  const toggleLike = async () => {
    if (!currentUserId) return toast.error("Please login to like");

    if (isLiked) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUserId)
        .eq('listing_id', post.id);
      if (!error) setIsLiked(false);
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: currentUserId, listing_id: post.id }]);
      if (!error) {
        setIsLiked(true);
        toast.success("Added to favorites ❤️");
      }
    }
  };

  // 3. FETCH COMMENTS
  const fetchComments = async () => {
    if (showComments) {
        setShowComments(false); // Toggle close if open
        return;
    }
    setShowComments(true);
    setLoadingComments(true);
    
    const { data } = await supabase
      .from('comments')
      .select(`
        id, content, created_at,
        profiles (full_name, avatar_url)
      `)
      .eq('listing_id', post.id)
      .order('created_at', { ascending: true });

    setComments(data || []);
    setLoadingComments(false);
  };

  // 4. POST NEW COMMENT
  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (!currentUserId) return toast.error("Please login to comment");

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{ 
            content: newComment, 
            listing_id: post.id,
            user_id: currentUserId
        }]);

      if (error) throw error;

      setNewComment('');
      fetchComments(); // Refresh list (simple way) or manually append
      // Since fetchComments toggles, we force reload:
      const { data } = await supabase
      .from('comments')
      .select(`id, content, created_at, profiles (full_name, avatar_url)`)
      .eq('listing_id', post.id)
      .order('created_at', { ascending: true });
      setComments(data || []);

      toast.success("Comment posted!");
    } catch (err) {
      toast.error("Failed to post comment");
    }
  };

  // 5. SHARE FUNCTION
  const handleShare = () => {
    const url = `${window.location.origin}/food/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard! 🔗");
  };

  const chefName = post.profiles?.full_name || post.profiles?.username || "Home Cook";
  const chefAvatar = post.profiles?.avatar_url;

  return (
    <Card className="overflow-hidden border-none shadow-xl rounded-2xl transition-transform hover:scale-[1.01] bg-white">
      {/* Header */}
      <div className="p-4 flex items-center bg-white border-b border-gray-50">
        <Avatar className="h-10 w-10 border-2 border-orange-50">
          <AvatarImage src={chefAvatar} />
          <AvatarFallback>{chefName[0]}</AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <p className="font-bold text-sm text-gray-900">{chefName}</p>
          <p className="text-[11px] text-gray-500 mt-0.5 flex items-center font-medium">
            <MapPin className="w-3 h-3 mr-1 text-orange-500" />
            {post.dist_meters < 100 ? "Under 100m away" : `${(post.dist_meters / 1000).toFixed(1)} km away`}
          </p>
        </div>
      </div>

      {/* Image */}
      <div className="aspect-square bg-gray-100 relative">
        <img src={post.image_url} className="w-full h-full object-cover" alt={post.title} />
        <div className="absolute top-4 right-4">
          <Badge className="bg-black/80 text-white font-bold px-3 py-1.5 shadow-lg backdrop-blur text-sm border-none">
            ₹{post.price}
          </Badge>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="p-4 pb-2">
        <div className="flex gap-6 text-gray-900">
          <button onClick={toggleLike} className="transition-transform active:scale-90">
            <Heart className={`w-7 h-7 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-900'}`} />
          </button>
          <button onClick={fetchComments} className="transition-transform active:scale-90">
            <MessageCircle className="w-7 h-7 hover:text-orange-500" />
          </button>
          <button onClick={handleShare} className="transition-transform active:scale-90">
            <Share2 className="w-7 h-7 hover:text-blue-500" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 pb-4">
        <h3 className="font-bold text-lg text-gray-900 mb-1">{post.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">
          {post.description}
        </p>

        {/* --- COMMENT SECTION (Collapsible) --- */}
        {showComments && (
            <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 -mx-4 px-4 pb-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Comments</h4>
                
                {/* List Comments */}
                <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                    {comments.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No comments yet. Say something tasty!</p>
                    ) : (
                        comments.map((c) => (
                            <div key={c.id} className="flex gap-2 items-start">
                                <span className="font-bold text-xs text-gray-900 shrink-0">
                                    {c.profiles?.full_name || "User"}:
                                </span>
                                <span className="text-xs text-gray-600 break-words">{c.content}</span>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Comment Input */}
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..." 
                        className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-500"
                    />
                    <Button size="icon" className="h-9 w-9 bg-orange-500 hover:bg-orange-600" onClick={handlePostComment}>
                        <Send className="w-4 h-4 text-white" />
                    </Button>
                </div>
            </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-[10px] text-gray-400 font-bold uppercase">
                {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Today'}
            </p>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl px-6 h-9 text-xs">
                Order Now
            </Button>
        </div>
      </div>
    </Card>
  );
}