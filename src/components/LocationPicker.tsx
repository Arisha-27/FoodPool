import { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { MapPin, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button"; // Fixes the red squiggle

export default function LocationPicker({ onLocationSet }: { onLocationSet?: () => void }) {
  const [loading, setLoading] = useState(false);

  const captureLocation = () => {
    setLoading(true);
    
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }
  
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
  
        // Update profile with REAL coordinates from browser GPS
        const { error } = await supabase
          .from('profiles')
          .update({ 
            latitude, 
            longitude,
            location: `POINT(${longitude} ${latitude})` 
          })
          .eq('id', user.id);
  
        if (error) throw error;
        toast.success("Kitchen location saved! 📍");
        if (onLocationSet) onLocationSet();
      } catch (err) {
        toast.error("Database sync failed");
      } finally {
        setLoading(false);
      }
    }, () => {
      toast.error("Location access denied. Please enable it in browser settings.");
      setLoading(false);
    });
  };

  return (
    <Button onClick={captureLocation} disabled={loading} className="bg-orange-500 hover:bg-orange-600">
      {loading ? <Loader2 className="animate-spin mr-2" /> : <MapPin className="mr-2" />}
      Set My Kitchen Location
    </Button>
  );
}