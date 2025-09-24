import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit3, Trash2, Save, X } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
}

const initialMenuItems: MenuItem[] = [
  { id: '1', name: 'Masala Tea', category: 'Tea', price: 15, image: '🫖' },
  { id: '2', name: 'Black Coffee', category: 'Drinks', price: 20, image: '☕' },
  { id: '3', name: 'Samosa', category: 'Snacks', price: 25, image: '🥟' },
  { id: '4', name: 'Sandwich', category: 'Snacks', price: 40, image: '🥪' },
  { id: '5', name: 'Chai Latte', category: 'Tea', price: 35, image: '🍵' },
  { id: '6', name: 'Cold Coffee', category: 'Drinks', price: 45, image: '🥤' },
];

const categories = ['Tea', 'Drinks', 'Snacks', 'Main Course', 'Desserts'];

interface MenuManagementTabProps {
  userRole: 'admin' | 'owner';
}

export function MenuManagementTab({ userRole }: MenuManagementTabProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    image: ''
  });
  const { toast } = useToast();

  // Only owners can manage menu (unless admin)
  if (userRole !== 'admin' && userRole !== 'owner') {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">You don't have permission to manage menu items.</p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newItem: MenuItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      image: formData.image || '🍽️'
    };

    if (editingItem) {
      setMenuItems(prev => prev.map(item => 
        item.id === editingItem.id ? newItem : item
      ));
      toast({
        title: "Item updated",
        description: `${newItem.name} has been updated successfully.`,
      });
    } else {
      setMenuItems(prev => [...prev, newItem]);
      toast({
        title: "Item added",
        description: `${newItem.name} has been added to the menu.`,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', category: '', price: '', image: '' });
    setIsAddingItem(false);
    setEditingItem(null);
  };

  const handleEdit = (item: MenuItem) => {
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      image: item.image
    });
    setEditingItem(item);
    setIsAddingItem(true);
  };

  const handleDelete = (itemId: string) => {
    const item = menuItems.find(item => item.id === itemId);
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "Item deleted",
      description: `${item?.name} has been removed from the menu.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Menu Management</h2>
          <p className="text-muted-foreground">Add, edit, or remove menu items</p>
        </div>
        {!isAddingItem && (
          <Button 
            onClick={() => setIsAddingItem(true)}
            className="bg-gradient-to-r from-primary to-primary-hover"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAddingItem && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter item name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Emoji/Icon</Label>
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="🍽️"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="bg-gradient-to-r from-success to-accent text-white">
                  <Save className="w-4 h-4 mr-2" />
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Menu Items Grid */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Current Menu Items ({menuItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map(item => (
              <Card key={item.id} className="shadow-card hover:shadow-elevated transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">{item.image}</span>
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-primary">₹{item.price}</p>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                        className="w-8 h-8 p-0"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item.id)}
                        className="w-8 h-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {menuItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No menu items found.</p>
              <p className="text-sm">Click "Add Item" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}