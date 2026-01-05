import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Utensils, Hash } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  created_at: string;
  total_price: number;
  quantity: number;
  status: 'pending' | 'accepted' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  customer_id: string; // 👈 Changed from customer object to ID string
  listing: { title: string; image_url: string };
}

export default function CookOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const fetchOrders = async () => {
    if (!user) return;
    try {
      // 1. MODIFIED QUERY: Fetch 'customer_id' directly, removed 'customer(full_name)'
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, created_at, total_price, quantity, status, customer_id,
          listing:listing_id ( title, image_url )
        `)
        .eq('cook_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data as any || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('realtime_cook_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `cook_id=eq.${user?.id}` }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const previousOrders = [...orders];
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
    
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      toast.success(`Order status: ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      setOrders(previousOrders);
      toast.error("Update failed");
    }
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;
  
  const displayedOrders = orders.filter(order => {
    if (activeTab === 'active') return ['pending', 'accepted', 'confirmed', 'preparing', 'ready'].includes(order.status);
    return ['completed', 'cancelled'].includes(order.status);
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-gray-900">Manage Orders</h1>
          <p className="text-gray-500">Handle incoming requests and pickups</p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-none shadow-sm flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-orange-500 mb-1">{pendingCount}</span>
            <span className="text-sm font-medium text-gray-400">Requests</span>
          </Card>
          <Card className="p-6 border-none shadow-sm flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-green-500 mb-1">{readyCount}</span>
            <span className="text-sm font-medium text-gray-400">Ready for Pickup</span>
          </Card>
          <Card className="p-6 border-none shadow-sm flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-gray-900 mb-1">{orders.filter(o => o.status === 'completed').length}</span>
            <span className="text-sm font-medium text-gray-400">Completed Total</span>
          </Card>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 mb-6">
          <button onClick={() => setActiveTab('active')} className={`px-4 py-2 text-sm font-semibold rounded-full transition-all ${activeTab === 'active' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
            Active Orders
          </button>
          <button onClick={() => setActiveTab('completed')} className={`px-4 py-2 text-sm font-semibold rounded-full transition-all ${activeTab === 'completed' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
            Completed History
          </button>
        </div>

        {/* Orders List */}
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" /></div> : 
         displayedOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <Utensils className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No orders found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((order) => (
              <Card key={order.id} className="p-5 border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <img src={order.listing?.image_url} alt={order.listing?.title} className="w-20 h-20 rounded-xl object-cover bg-gray-100" />

                  <div className="flex-1 w-full text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{order.listing?.title}</h3>
                      <div className="mt-2 md:mt-0">
                        {order.status === 'pending' && <Badge className="bg-yellow-100 text-yellow-700 px-3 py-1">New Request</Badge>}
                        {order.status === 'accepted' && <Badge className="bg-blue-50 text-blue-700 px-3 py-1">Waiting for Payment</Badge>}
                        {order.status === 'confirmed' && <Badge className="bg-orange-100 text-orange-700 px-3 py-1">Payment Confirmed</Badge>}
                        {order.status === 'preparing' && <Badge className="bg-orange-100 text-orange-700 px-3 py-1">Preparing</Badge>}
                        {order.status === 'ready' && <Badge className="bg-green-100 text-green-700 px-3 py-1">Ready</Badge>}
                        {order.status === 'completed' && <Badge className="bg-gray-100 text-gray-700 px-3 py-1">Completed</Badge>}
                      </div>
                    </div>
                    
                    {/* 👇 PRIVACY CHANGE HERE 👇 */}
                    <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500 mb-1">
                        <Hash className="w-3 h-3" />
                        <span className="font-mono bg-gray-100 px-1 rounded text-xs text-gray-600">
                            ID: {order.customer_id.split('-')[0]}
                        </span>
                        <span>• Qty: {order.quantity} • ₹{order.total_price}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-center">
                    {order.status === 'pending' && (
                      <Button className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 font-semibold" onClick={() => updateStatus(order.id, 'accepted')}>
                        Accept Order
                      </Button>
                    )}
                    {order.status === 'accepted' && (
                      <span className="text-xs font-bold text-gray-400 italic">Waiting for Customer...</span>
                    )}
                    {order.status === 'confirmed' && (
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-6 font-semibold" onClick={() => updateStatus(order.id, 'preparing')}>
                        Start Preparing
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 font-semibold" onClick={() => updateStatus(order.id, 'ready')}>
                        Mark Ready
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-6 font-semibold" onClick={() => updateStatus(order.id, 'completed')}>
                        Complete & Deliver
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}