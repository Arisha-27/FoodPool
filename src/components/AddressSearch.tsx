import { useState } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext'; // Adjust path if needed
import { toast } from 'sonner'; // or 'react-hot-toast' depending on what you use

export const AddressSearch = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // 1. Get the setLocation function from your existing Context
  // Make sure your Context actually exports 'setLocation' or similar!
  const { setLocation } = useLocation(); 

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);

    try {
      // 2. Call the OpenStreetMap API
      // We limit to India (countrycodes=in) for better accuracy
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=1`
      );
      
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        console.log("📍 New Location Found:", result.display_name, lat, lon);

        // 3. Update the Global Location Context
        // This will automatically trigger your 'Discover' page to refresh!
        setLocation({
          latitude: lat,
          longitude: lon,
          address: result.display_name // Optional: if your context supports storing address text
        });

        toast.success(`Location updated to: ${result.name || query}`);
        setQuery(''); // Clear search bar
      } else {
        toast.error("Location not found. Try a broader area (e.g., 'Kanpur').");
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Could not search location.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-sm">
      <div className="relative">
        <input
          type="text"
          placeholder="Enter delivery location (e.g. Civil Lines)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/90 backdrop-blur-sm shadow-sm text-sm"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <MapPin size={16} />
        </div>
        
        <button 
          type="submit" 
          disabled={isSearching}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-orange-500 rounded-full text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        </button>
      </div>
    </form>
  );
};