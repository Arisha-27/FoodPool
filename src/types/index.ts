export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  cookId: string;
  cookName: string;
  cookAvatar: string;
  category: 'veg' | 'nonveg' | 'snacks' | 'sweets';
  quantity: number;
  pickupTime: string;
  distance: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  createdAt: Date;
  likes: number;
  isLiked?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'cook' | 'customer';
  avatar?: string;
  phone?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  foodItemId?: string;
  createdAt: Date;
  read: boolean;
}

export interface Order {
  id: string;
  foodItemId: string;
  customerId: string;
  cookId: string;
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';
  pickupTime: string;
  createdAt: Date;
}
