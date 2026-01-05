import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  Loader2, 
  Download, 
  IndianRupee, 
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function CookEarnings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    avgOrder: 0,
    totalOrders: 0,
    bestDay: '-',
    topDish: '-',
    repeatRate: '0%'
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id, total_price, created_at, quantity, customer_id,
          listing:listing_id ( title )
        `)
        .eq('cook_id', user!.id)
        .eq('status', 'completed') // Ensure we only count completed orders
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allOrders = orders || [];
      const now = new Date();
      
      // --- FIXED LOGIC STARTS HERE ---
      
      // 1. Helper to zero-out time for accurate date comparison
      const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      
      const todayDate = startOfDay(now);
      const sevenDaysAgo = new Date(todayDate);
      sevenDaysAgo.setDate(todayDate.getDate() - 6); // Last 7 days window
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let todaySum = 0;
      let weekSum = 0;
      let monthSum = 0;
      
      // 2. Initialize the Chart Data for the Last 7 Days (Empty)
      // This ensures "Yesterday" and "Today" always appear on the right
      const last7DaysMap = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(todayDate);
        d.setDate(d.getDate() - i);
        // Key format: "Mon", "Tue" etc.
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }); 
        last7DaysMap.set(dayName, 0); 
      }

      const dishCounts: Record<string, number> = {};
      const customerCounts: Record<string, number> = {};

      allOrders.forEach(o => {
        const orderDate = new Date(o.created_at);
        const orderDayStart = startOfDay(orderDate);
        const price = o.total_price;

        // Today Stats
        if (orderDayStart.getTime() === todayDate.getTime()) {
          todaySum += price;
        }

        // Week Stats (Last 7 Days Rolling)
        if (orderDayStart >= sevenDaysAgo) {
          weekSum += price;
          const dayName = orderDate.toLocaleDateString('en-US', { weekday: 'short' });
          // Add to chart map
          if (last7DaysMap.has(dayName)) {
            last7DaysMap.set(dayName, (last7DaysMap.get(dayName) || 0) + price);
          }
        }

        // Month Stats
        if (orderDayStart >= startOfMonth) {
          monthSum += price;
        }

        // Analytics
        const dishName = o.listing?.title || 'Unknown';
        dishCounts[dishName] = (dishCounts[dishName] || 0) + 1;
        customerCounts[o.customer_id] = (customerCounts[o.customer_id] || 0) + 1;
      });

      // 3. Convert Map to Array for Recharts
      // This guarantees the order is Mon -> Tue -> ... -> Today
      const finalChartData = Array.from(last7DaysMap).map(([name, amount]) => ({
        name,
        amount
      }));

      // --- END FIXED LOGIC ---

      const topDish = Object.keys(dishCounts).reduce((a, b) => dishCounts[a] > dishCounts[b] ? a : b, '-');
      const bestDayEntry = finalChartData.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
      
      const repeatCustomers = Object.values(customerCounts).filter(count => count > 1).length;
      const totalCustomers = Object.keys(customerCounts).length;
      const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) + '%' : '0%';

      setStats({
        today: todaySum,
        week: weekSum,
        month: monthSum,
        avgOrder: allOrders.length > 0 ? Math.round(allOrders.reduce((a,b)=>a+b.total_price,0) / allOrders.length) : 0,
        totalOrders: allOrders.length,
        bestDay: bestDayEntry.amount > 0 ? bestDayEntry.name : '-',
        topDish: topDish,
        repeatRate: repeatRate
      });

      setChartData(finalChartData);
      setTransactions(allOrders.slice(0, 5));

    } catch (err) {
      console.error(err);
      toast.error("Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Earnings</h1>
            <p className="text-gray-500">Track your income and transactions</p>
          </div>
          <Button variant="outline" className="gap-2 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2 h-10 shadow-sm" onClick={() => toast.success("Report Downloaded!")}>
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>

        {loading ? (
           <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-orange-500"/></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Today", value: stats.today, trend: '+12%', bg: 'bg-[#F0FDF4]', text: 'text-green-600' },
                { label: "Last 7 Days", value: stats.week, trend: '+8%', bg: 'bg-[#F0FDF4]', text: 'text-green-600' },
                { label: "This Month", value: stats.month, trend: '+15%', bg: 'bg-[#F0FDF4]', text: 'text-green-600' },
                { label: "Avg. Order Value", value: stats.avgOrder, trend: '', bg: '', text: '' },
              ].map((stat, i) => (
                <Card key={i} className="p-6 border-none shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] bg-[#FAFAFA] rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    {stat.trend && (
                        <span className={`text-xs font-bold flex items-center px-2 py-0.5 rounded-full ${stat.text} ${stat.bg}`}>
                            <TrendingUp className="w-3 h-3 mr-1" /> {stat.trend}
                        </span>
                    )}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 flex items-center">
                    <IndianRupee className="w-6 h-6 text-gray-900 mr-0.5" />
                    {stat.value.toLocaleString()}
                  </h3>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <Card className="lg:col-span-2 p-8 border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] bg-white rounded-2xl">
                <h3 className="font-bold text-lg text-gray-900 mb-8">Weekly Overview</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={40}>
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 13, fontWeight: 500 }} 
                        dy={15}
                      />
                      <Tooltip 
                        cursor={{ fill: '#FFF7ED', radius: 4 }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                        formatter={(value: any) => [`₹${value}`, 'Revenue']}
                      />
                      <Bar dataKey="amount" radius={[8, 8, 8, 8]} background={{ fill: 'transparent' }}>
                        {chartData.map((entry, index) => (
                          // Highlight TODAY (the last bar) in Orange, others in Gray-ish
                          <Cell key={`cell-${index}`} fill={index === 6 ? '#F97316' : '#FFD700'} opacity={index === 6 ? 1 : 0.4} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-8 border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] bg-white rounded-2xl flex flex-col justify-center">
                <h3 className="font-bold text-lg text-gray-900 mb-8">Quick Stats</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center p-4 bg-[#FAFAFA] rounded-xl">
                     <span className="text-gray-500 font-medium text-sm">Total Orders</span>
                     <span className="font-bold text-gray-900">{stats.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-[#FAFAFA] rounded-xl">
                     <span className="text-gray-500 font-medium text-sm">Best Day</span>
                     <span className="font-bold text-gray-900">{stats.bestDay}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-[#FAFAFA] rounded-xl">
                     <span className="text-gray-500 font-medium text-sm">Top Dish</span>
                     <span className="font-bold text-gray-900">{stats.topDish}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-[#FAFAFA] rounded-xl">
                     <span className="text-gray-500 font-medium text-sm">Repeat Customers</span>
                     <span className="font-bold text-gray-900">{stats.repeatRate}</span>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-8 border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] bg-white rounded-2xl">
              <h3 className="font-bold text-lg text-gray-900 mb-6">Recent Transactions</h3>
              <div className="space-y-1">
                {transactions.length === 0 ? (
                  <p className="text-gray-500 py-4">No transactions yet.</p>
                ) : transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-4 hover:bg-gray-50 px-2 rounded-lg transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{t.listing?.title}</p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                           Customer ID: {t.customer_id.slice(0, 4)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-500">+₹{t.total_price}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}