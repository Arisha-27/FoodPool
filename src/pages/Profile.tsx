import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  User, Mail, Phone, MapPin, ChefHat, LogOut, Camera, Loader2, Edit2, Save, X, Navigation
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [locating, setLocating] = useState(false); // New state for GPS loading

  const [profile, setProfile] = useState<any>(null);
  const [userAuth, setUserAuth] = useState<any>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    address: '',
    latitude: 0,  // Store lat/long in form data too
    longitude: 0
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/auth'); return; }
      setUserAuth(user);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        phone_number: data.phone_number || user.phone || '',
        address: data.address || '',
        latitude: data.latitude,
        longitude: data.longitude
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // --- NEW: FUNCTION TO GET CURRENT GPS & ADDRESS ---
  const handleUpdateLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      // 1. Update Coordinates locally
      setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));

      // 2. Fetch Text Address (Reverse Geocoding)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        
        if (data && data.display_name) {
          // Simplify address (take first 3 parts)
          const simpleAddress = data.display_name.split(',').slice(0, 3).join(',');
          setFormData(prev => ({ ...prev, address: simpleAddress }));
          toast.success("Location updated to current spot!");
        }
      } catch (err) {
        toast.error("Could not fetch address text, but coordinates saved.");
      } finally {
        setLocating(false);
      }
    }, () => {
      toast.error("Unable to retrieve your location");
      setLocating(false);
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          address: formData.address,
          latitude: formData.latitude,   // Save new coords
          longitude: formData.longitude  // Save new coords
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, ...formData });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Avatar Upload Logic (Same as before)
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    /* ... Keep your existing avatar logic here ... */
    /* For brevity, I am assuming you kept the avatar function from previous code */
  };

  if (loading && !profile) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin w-8 h-8 text-orange-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 py-12 container mx-auto px-4 max-w-3xl">
        
        {/* HERO SECTION */}
        <Card className="p-8 mb-8 border-none shadow-sm rounded-3xl bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600" />
          
          <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-orange-50 bg-gray-100 flex items-center justify-center shadow-inner">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-300" />
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
              <button className="absolute bottom-1 right-1 p-2.5 rounded-full bg-orange-600 text-white border-4 border-white shadow-lg">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center sm:text-left flex-1 space-y-2 w-full">
              <div className="flex items-center justify-center sm:justify-between w-full">
                {isEditing ? (
                  <Input 
                    value={formData.full_name} 
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="text-2xl font-bold h-10 w-full sm:w-auto"
                    placeholder="Enter Full Name"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{profile?.full_name || 'User'}</h1>
                )}
                
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="hidden sm:flex gap-2 text-orange-600 hover:bg-orange-50 hover:text-orange-700">
                    <Edit2 className="w-4 h-4" /> Edit
                  </Button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-gray-500 justify-center sm:justify-start">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {userAuth?.email || profile?.email}</span>
                <span className="hidden sm:inline text-gray-300">•</span>
                <Badge className={profile?.is_cook ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}>
                  {profile?.is_cook ? <><ChefHat className="w-3 h-3 mr-1"/> Home Cook</> : 'Customer'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* DETAILS GRID */}
        <div className="grid gap-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-gray-900">Account Details</h2>
            {isEditing && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-gray-500">
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Save Changes</>}
                </Button>
              </div>
            )}
          </div>
          
          <Card className="p-0 border-none shadow-sm rounded-3xl bg-white overflow-hidden divide-y divide-gray-50">
            
            {/* Phone Number */}
            <div className="flex items-start gap-4 p-6 hover:bg-gray-50/50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Phone Number</p>
                {isEditing ? (
                  <Input 
                    value={formData.phone_number} 
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    placeholder="+91 00000 00000"
                  />
                ) : (
                  <p className="text-lg font-semibold text-gray-900">{profile?.phone_number || 'Not provided'}</p>
                )}
              </div>
            </div>

            {/* Address / Location - WITH GPS UPDATE BUTTON */}
            <div className="flex items-start gap-4 p-6 hover:bg-gray-50/50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Address</p>
                  
                  {/* THE MAGIC UPDATE BUTTON */}
                  {isEditing && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleUpdateLocation}
                      className="h-7 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                      disabled={locating}
                    >
                      {locating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Navigation className="w-3 h-3 mr-1" />}
                      Use Current GPS
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2 mt-2">
                    <Input 
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="e.g. 123, Civil Lines, Near Landmark"
                    />
                    <p className="text-[10px] text-gray-400 flex items-center">
                       Internal Coords: {formData.latitude?.toFixed(4)}, {formData.longitude?.toFixed(4)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {profile?.address || (profile?.latitude ? `${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)}` : 'No location set')}
                    </p>
                  </div>
                )}
              </div>
            </div>

          </Card>

          <Button 
            variant="ghost" 
            className="w-full h-14 justify-center gap-2 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600 font-medium transition-colors mt-4"
            onClick={async () => { await supabase.auth.signOut(); navigate('/'); toast.success("Signed out"); }}
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}