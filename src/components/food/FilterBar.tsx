import { useState } from 'react';
import { Search, SlidersHorizontal, MapPin, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/contexts/LocationContext';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
}

const CATEGORIES = ['Veg', 'Non-Veg', 'Snacks', 'Sweets'];
const DISTANCES = [0.5, 1, 2, 5]; // km

export default function FilterBar({ 
  searchQuery, 
  setSearchQuery, 
  selectedCategory, 
  setSelectedCategory 
}: FilterBarProps) {
  
  const { distanceFilter, setDistanceFilter, location } = useLocation();
  const [isOpen, setIsOpen] = useState(false); // State to toggle filter panel

  return (
    <div className="space-y-4">
      {/* 1. TOP ROW: Search + Filter Button + Location */}
      <div className="flex flex-col md:flex-row gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input 
            placeholder="Search for Matar Paneer, Biryani..." 
            className="pl-10 h-12 bg-white border-gray-200 text-base rounded-xl shadow-sm focus-visible:ring-orange-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <Button 
          variant={isOpen ? "secondary" : "outline"}
          onClick={() => setIsOpen(!isOpen)}
          className={`h-12 px-6 rounded-xl border-gray-200 gap-2 font-semibold transition-all ${isOpen ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          <SlidersHorizontal className="w-4 h-4" /> 
          Filters
          {isOpen ? <ChevronUp className="w-4 h-4 ml-1 opacity-50" /> : <ChevronDown className="w-4 h-4 ml-1 opacity-50" />}
        </Button>
        
        {/* Real-Time Location Badge */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-700 whitespace-nowrap min-w-[140px] justify-center">
           <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
           <span className="truncate max-w-[180px]">
             {/* Uses the actual context address, falls back to 'Locating...' if null */}
             {location?.address ? location.address : "Locating..."}
           </span>
        </div>
      </div>

      {/* 2. EXPANDABLE FILTER PANEL (Conditional Render) */}
      {isOpen && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-lg space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <span className="text-sm font-bold text-gray-900">Refine Results</span>
              {(selectedCategory || searchQuery || distanceFilter !== 5) && (
                  <button 
                    onClick={() => { setSelectedCategory(null); setSearchQuery(''); setDistanceFilter(5); }}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700"
                  >
                      Reset All
                  </button>
              )}
          </div>

          {/* Categories */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                    selectedCategory === cat 
                      ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-orange-200 hover:text-orange-600'
                  }`}
                >
                  {cat === 'Veg' ? '🥬' : cat === 'Non-Veg' ? '🍖' : cat === 'Snacks' ? '🍿' : '🍬'} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Distances */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Max Distance</p>
            <div className="flex flex-wrap gap-2">
              {DISTANCES.map(dist => (
                <button
                  key={dist}
                  onClick={() => setDistanceFilter(dist)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                    distanceFilter === dist
                      ? 'bg-gray-900 border-gray-900 text-white shadow-md' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {dist >= 1 ? `${dist} km` : `${dist * 1000}m`}
                </button>
              ))}
               <button
                  onClick={() => setDistanceFilter(50)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                    distanceFilter > 5
                      ? 'bg-orange-500 border-orange-500 text-white shadow-md' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-orange-500 hover:text-orange-600'
                  }`}
              >
                  Anywhere
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
