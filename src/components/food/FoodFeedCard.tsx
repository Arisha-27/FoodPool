import { FoodItem } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface FoodFeedCardProps {
  food: FoodItem;
}

const FoodFeedCard: React.FC<FoodFeedCardProps> = ({ food }) => {
  const [isLiked, setIsLiked] = useState(food.isLiked);
  const [likes, setLikes] = useState(food.likes);
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <Card variant="elevated" className="max-w-lg mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <img
            src={food.cookAvatar}
            alt={food.cookName}
            className="w-10 h-10 rounded-full object-cover border-2 border-primary"
          />
          <div>
            <p className="font-semibold text-sm">{food.cookName}</p>
            <p className="text-xs text-muted-foreground">{food.location.address}</p>
          </div>
        </div>
        <button className="p-2 hover:bg-muted rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Image */}
      <div className="relative aspect-square">
        <img
          src={food.image}
          alt={food.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <Badge variant="price" className="text-sm">
            ₹{food.price}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className="hover:scale-110 transition-transform">
            <Heart
              className={`w-6 h-6 transition-colors ${
                isLiked ? 'fill-destructive text-destructive' : 'text-foreground'
              }`}
            />
          </button>
          <button className="hover:scale-110 transition-transform">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button className="hover:scale-110 transition-transform">
            <Share2 className="w-6 h-6" />
          </button>
        </div>
        <button
          onClick={() => setIsSaved(!isSaved)}
          className="hover:scale-110 transition-transform"
        >
          <Bookmark
            className={`w-6 h-6 transition-colors ${
              isSaved ? 'fill-foreground' : ''
            }`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <p className="font-semibold text-sm mb-1">{likes} likes</p>
        <p className="text-sm">
          <span className="font-semibold">{food.cookName}</span>{' '}
          {food.name} - {food.description}
        </p>
        <div className="flex gap-1 mt-2">
          <Badge variant={food.category === 'veg' ? 'veg' : food.category === 'nonveg' ? 'nonveg' : 'default'} className="text-xs">
            #{food.category}
          </Badge>
          <Badge variant="distance" className="text-xs">
            #homemade
          </Badge>
          <Badge variant="time" className="text-xs">
            #foodpool
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(food.createdAt, { addSuffix: true })}
        </p>
      </div>
    </Card>
  );
};

export default FoodFeedCard;
