import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

function ItemModal({ item, open, onClose, onSave }: any) {
  const [quantity, setQuantity] = useState(item?.quantity || 0);

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{item.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quantity</span>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={() => setQuantity(q => Math.max(0, q - 1))}>-</Button>
                <div className="w-12 text-center">{quantity}</div>
                <Button size="sm" variant="outline" onClick={() => setQuantity(q => q + 1)}>+</Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" onClick={() => onSave(quantity)}>Save</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InventoryPage() {
  // Dummy inventory data per user request (drinks, cigarettes, snacks)
  const inventory = [
    // Drinks
    { id: 'dr-1', category: 'Drinks', name: 'Coke', quantity: 120, unit: 'bottle', note: '' },
    { id: 'dr-2', category: 'Drinks', name: 'Sprite', quantity: 100, unit: 'bottle', note: '' },
    { id: 'dr-3', category: 'Drinks', name: 'Fanta', quantity: 80, unit: 'bottle', note: '' },
    { id: 'dr-4', category: 'Drinks', name: 'Real', quantity: 60, unit: 'bottle', note: '' },

    // Cigarettes (every item is counted in bundles of 10 packs; each pack has 20 cigs)
    { id: 'cg-1', category: 'Cigarettes', name: 'Surya', quantity: 30, unit: 'bundle (10 packs)', note: 'Each pack = 20 cigs' },
    { id: 'cg-2', category: 'Cigarettes', name: 'Sikhar Ice', quantity: 25, unit: 'bundle (10 packs)', note: 'Each pack = 20 cigs' },
    { id: 'cg-3', category: 'Cigarettes', name: 'LA Mint', quantity: 20, unit: 'bundle (10 packs)', note: 'Each pack = 20 cigs' },
    { id: 'cg-4', category: 'Cigarettes', name: 'Garam', quantity: 15, unit: 'bundle (10 packs)', note: 'Each pack = 20 cigs' },
    { id: 'cg-5', category: 'Cigarettes', name: 'Black', quantity: 10, unit: 'bundle (10 packs)', note: 'Each pack = 20 cigs' },

    // Snacks
    { id: 'sn-1', category: 'Snacks', name: 'Wai Wai', quantity: 200, unit: 'pack', note: '' },
  ];

  const [selected, setSelected] = useState<any>(null);
  const [items, setItems] = useState(inventory);

  const handleSave = (id: string, newQty: number) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, quantity: newQty } : it));
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div />
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline">Refresh</Button>
            </div>
          </div>

          <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="font-medium">Inventory (WIP)</p>
            <p className="text-sm text-muted-foreground">wip : inventory is still under design and displays just the prototype for the purpose of demonstration.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="py-2">{row.name}</td>
                    <td className="py-2">{row.quantity}</td>
                    <td className="py-2">{row.unit}</td>
                    <td className="py-2">
                      <Button size="sm" variant="outline" onClick={() => setSelected(row)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ItemModal
        item={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onSave={(qty: number) => selected && handleSave(selected.id, qty)}
      />
    </div>
  );
}
