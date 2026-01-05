import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Camera, X } from 'lucide-react';

export default function EditFood() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'veg',
    image_url: '',
    is_active: true
  });

  useEffect(() => {
    fetchDish();
  }, [id]);

  const fetchDish = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setFormData({
        title: data.title,
        description: data.description,
        price: data.price.toString(),
        category: data.category,
        image_url: data.image_url,
        is_active: data.is_active
      });
      if (data.image_url) setPreviewUrl(data.image_url);
    } catch (err) {
      toast.error("Could not load dish details");
      navigate('/cook-dashboard'); // Fixed fallback route
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('food-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('food-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Storage upload failed:", error);
      throw new Error("Failed to upload image to storage.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
  
    try {
      let urlToSave = formData.image_url;
  
      // If a NEW file was picked, upload it. Otherwise, keep the existing urlToSave.
      if (selectedFile) {
        const permanentUrl = await uploadImage(selectedFile);
        if (!permanentUrl) throw new Error("Upload failed to return a valid URL.");
        urlToSave = permanentUrl;
      } 
  
      // Update database
      const { error } = await supabase
        .from('listings')
        .update({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          image_url: urlToSave, 
          is_active: formData.is_active
        })
        .eq('id', id);
  
      if (error) throw error;
      
      toast.success("Dish updated permanently! ✅");
      
      // Changed navigation to /cook-dashboard to fix 404
      setTimeout(() => navigate('/cook-dashboard'), 500);
  
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin text-orange-600 w-10 h-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl font-sans">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/cook-dashboard')} // Fixed back button route
          className="mb-4 gap-2 pl-0 hover:bg-transparent hover:text-orange-600 text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Dish ✏️</h1>
        
        <Card className="p-8 bg-white shadow-sm border-none rounded-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Dish Photo</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-64 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-orange-300 transition-all group"
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Camera className="text-white w-10 h-10" />
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-3 mx-auto w-fit">
                      <Camera className="h-8 w-8 text-orange-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Change Photo</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dish Title</label>
                <Input 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="rounded-xl h-12 bg-gray-50 border-gray-200"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  className="w-full p-4 border border-gray-200 bg-gray-50 rounded-xl text-sm min-h-[120px] focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <Input 
                    type="number" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                    className="rounded-xl h-12 bg-gray-50 border-gray-200"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    className="w-full h-12 border border-gray-200 rounded-xl px-4 text-sm bg-gray-50"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="veg">Veg</option>
                    <option value="non-veg">Non-Veg</option>
                    <option value="snacks">Snacks</option>
                    <option value="sweets">Sweets</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
              <input 
                type="checkbox" 
                id="active"
                checked={formData.is_active}
                onChange={e => setFormData({...formData, is_active: e.target.checked})}
                className="w-5 h-5 text-orange-600 rounded-lg cursor-pointer"
              />
              <label htmlFor="active" className="text-sm font-bold text-gray-700 cursor-pointer">
                Available for Order
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full py-7 text-lg font-bold bg-orange-600 hover:bg-orange-700 rounded-2xl" 
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Update Dish'}
            </Button>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  );
}