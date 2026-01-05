import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Camera, UtensilsCrossed, Sparkles, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AddFood = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    pickup_time: '',
    is_veg: false,
    image_url: '' 
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, image_url: '' })); 
  };

  const uploadImage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('food-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('food-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error("Storage upload failed:", error);
      throw new Error("Failed to upload image to storage.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to add food.');

      const { data: profile } = await supabase
        .from('profiles')
        .select('location')
        .eq('id', user.id)
        .single();

      if (!profile?.location) {
        toast.error("Please set your Kitchen Address in your Profile first!", {
            action: {
                label: "Go to Profile",
                onClick: () => navigate('/profile')
            }
        });
        setLoading(false);
        return;
      }

      let finalImageUrl = formData.image_url;
      if (selectedFile) {
        finalImageUrl = await uploadImage(selectedFile);
      }

      if (!finalImageUrl || finalImageUrl.startsWith('blob:')) {
        throw new Error("Invalid image. Please upload a photo or provide a valid URL.");
      }

      const fullDescription = `${formData.description}\n\nQuantity: ${formData.quantity}\nPickup Time: ${formData.pickup_time}`;

      const { error } = await supabase
        .from('listings')
        .insert([{
          title: formData.name,
          description: fullDescription,
          price: parseFloat(formData.price) || 0,
          image_url: finalImageUrl,
          cook_id: user.id,
          category: formData.is_veg ? 'Veg' : 'Non-Veg', 
          is_active: true
        }]);

      if (error) throw error;

      setStatusMessage({ type: 'success', text: 'Food posted successfully! Redirecting...' });
      toast.success("Food live! Neighbors can now see it.");
      setTimeout(() => navigate('/'), 1500);

    } catch (error: any) {
      console.error(error);
      setStatusMessage({ type: 'error', text: error.message || 'Failed to post food.' });
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
            <UtensilsCrossed className="h-6 w-6 text-orange-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Share Food</h2>
          <p className="mt-2 text-sm text-gray-600">Upload a photo and details to help feed your hood</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {statusMessage && (
            <div className={`p-4 flex items-center gap-3 ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {statusMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm font-medium">{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="space-y-4">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              {previewUrl ? (
                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => {setPreviewUrl(null); setSelectedFile(null);}} className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-sm hover:bg-white text-gray-700">
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                  <Camera className="h-6 w-6 text-orange-500 mb-4" />
                  <h3 className="text-sm font-semibold text-gray-900">Upload Food Photo</h3>
                  <p className="text-xs text-gray-500">Tap to select image</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Food Name</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="block w-full rounded-lg border-gray-200 bg-gray-50 px-4 py-3" placeholder="e.g., Butter Chicken" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                <input type="number" name="price" required value={formData.price} onChange={handleChange} className="block w-full rounded-lg border-gray-200 bg-gray-50 px-4 py-3" placeholder="0 for Free" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="block w-full rounded-lg border-gray-200 bg-gray-50 px-4 py-3" placeholder="Ingredients, details..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quantity Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <input type="text" name="quantity" required value={formData.quantity} onChange={handleChange} className="block w-full rounded-lg border-gray-200 bg-gray-50 px-4 py-3" placeholder="e.g. 2 servings" />
                </div>
                
                {/* Pickup Time Input (Added this!) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Time</label>
                  <input type="text" name="pickup_time" required value={formData.pickup_time} onChange={handleChange} className="block w-full rounded-lg border-gray-200 bg-gray-50 px-4 py-3" placeholder="e.g. 7 PM" />
                </div>
              </div>

              {/* Veg Checkbox */}
              <div>
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 w-full hover:bg-gray-50">
                    <input type="checkbox" name="is_veg" checked={formData.is_veg} onChange={(e) => setFormData({...formData, is_veg: e.target.checked})} className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700">Vegetarian?</span>
                  </label>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Post Food</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddFood;