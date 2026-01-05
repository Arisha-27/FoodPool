import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import Navbar from '@/components/layout/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, Wallet, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, listing:listing_id(title, price, image_url), cook:cook_id(full_name)`)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      toast.error("Order not found");
      navigate('/customer-dashboard'); // Redirect to dashboard on error
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setProcessing(true);
      // Simulate network processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { error } = await supabase
        .from('orders')
        .update({ 
            status: 'confirmed', 
            payment_method: 'cash' 
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success("Order confirmed! Please pay cash on delivery.");
      
      // --- FIX: Navigate to the correct dashboard route ---
      navigate('/customer-dashboard'); 
      
    } catch (error) {
      toast.error("Payment confirmation failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2 pl-0 hover:bg-transparent hover:text-orange-600">
            <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        <Card className="p-6 mb-6 border-none shadow-sm bg-white rounded-2xl">
            <h2 className="font-bold text-gray-700 mb-4">Order Summary</h2>
            <div className="flex gap-4 mb-4">
                <img src={order.listing.image_url} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                <div>
                    <h3 className="font-bold text-gray-900">{order.listing.title}</h3>
                    <p className="text-sm text-gray-500">Cook: {order.cook.full_name}</p>
                    <p className="text-sm text-gray-500">Qty: {order.quantity}</p>
                </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="font-bold text-gray-600">Total Amount</span>
                <span className="text-xl font-bold text-orange-600">₹{order.total_price}</span>
            </div>
        </Card>

        <Card className="p-6 mb-8 border-none shadow-sm bg-white rounded-2xl">
            <h2 className="font-bold text-gray-700 mb-4">Select Payment Method</h2>
            
            <div className="p-4 border-2 border-orange-500 bg-orange-50 rounded-xl flex items-center justify-between cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">Cash on Delivery</p>
                        <p className="text-xs text-gray-500">Pay cash to the cook upon arrival</p>
                    </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-orange-600 fill-orange-100" />
            </div>
            
            <div className="mt-4 p-4 border border-gray-100 rounded-xl flex items-center justify-between opacity-50 cursor-not-allowed">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-400">UPI / Card</p>
                        <p className="text-xs text-gray-400">Coming soon</p>
                    </div>
                </div>
            </div>
        </Card>

        <Button 
            className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 rounded-xl"
            onClick={handleConfirmPayment}
            disabled={processing}
        >
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Confirm Order • ₹${order.total_price}`}
        </Button>

      </main>
    </div>
  );
}