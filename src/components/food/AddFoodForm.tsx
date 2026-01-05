import { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface AddFoodFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddFoodForm = ({ onSuccess, onCancel }: AddFoodFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'veg', // Default
    image: null as File | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let imageUrl = '';

      // 1. Upload Image (if provided)
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('food-images')
          .upload(filePath, formData.image);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('food-images').getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }

      // 2. Insert into Database
      const { error: dbError } = await supabase
        .from('listings')
        .insert([
          {
            cook_id: user.id,
            title: formData.title,
            description: formData.description,
            price: parseFloat(formData.price),
            category: formData.category,
            image_url: imageUrl,
            is_active: true
          }
        ]);

      if (dbError) throw dbError;

      toast.success('Dish added to your menu! 🍲');
      onSuccess();

    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to add food');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background p-6 rounded-xl border shadow-lg max-w-md w-full mx-auto animate-in fade-in zoom-in duration-300">
      <h2 className="text-2xl font-bold mb-4 font-display">Add New Dish</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Dish Name</label>
          <Input 
            required 
            placeholder="e.g. Matar Paneer"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Price (₹)</label>
            <Input 
              required 
              type="number" 
              placeholder="120"
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Category</label>
            <select 
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              <option value="veg">Veg 🟢</option>
              <option value="non-veg">Non-Veg 🔴</option>
              <option value="snacks">Snacks 🥪</option>
              <option value="sweets">Sweets 🍬</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Textarea 
            placeholder="Describe your dish..."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Food Photo</label>
          <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-accent/50 transition-colors relative">
            <Input 
              type="file" 
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={e => e.target.files && setFormData({...formData, image: e.target.files[0]})}
            />
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="w-8 h-8" />
              <span className="text-sm">
                {formData.image ? formData.image.name : "Click to upload photo"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="default" className="flex-1" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Publish
          </Button>
        </div>
      </form>
    </div>
  );
};