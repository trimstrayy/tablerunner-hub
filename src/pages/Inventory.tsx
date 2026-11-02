import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Receipt = {
  id: string;
  date: string; // ISO
  billAmount: number;
  paidAmount: number;
  dueAmount: number;
  source?: { type: 'firm' | 'one-off'; name: string };
  // optional for quantity-based receipts (e.g., dairy litres)
  unit?: string; // e.g., 'ltr'
  quantity?: number;
  rate?: number;
  // optional for kirana item receipts
  itemName?: string;
  itemPrice?: number;
  // timestamp when this receipt was fully paid (ISO)
  paidAt?: string | null;
};

type Section = {
  name: string;
  receipts: Receipt[];
};

const DEFAULT_SECTIONS = ['Dairy', 'Bakery', 'Kirana', 'Vegetables'];

function AddReceiptModal({ open, onClose, onSave, section }: any) {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [bill, setBill] = useState<number>(0);
  const [paid, setPaid] = useState<number>(0);
  const [due, setDue] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [rate, setRate] = useState<number | ''>('');
  const [kiranaItemName, setKiranaItemName] = useState('');
  const [kiranaItemPrice, setKiranaItemPrice] = useState<number | ''>('');
  const [selectedSource, setSelectedSource] = useState<{ type: 'firm' | 'one-off'; name: string } | null>(null);
  const [oneOffName, setOneOffName] = useState('');

  const SOURCES: Record<string, string[]> = {
    Dairy: ['Mama', 'Bhim uncle', 'One-off'],
    Bakery: ['Main', 'One-off'],
    Vegetables: ['Main', 'One-off'],
    Kirana: ['Main', 'One-off'],
  };

  useEffect(() => {
    if (!open) {
      setDate(new Date().toISOString().slice(0,10)); setBill(0); setPaid(0); setDue(0);
      setQuantity(0); setRate(''); setSelectedSource(null); setOneOffName('');
      setKiranaItemName(''); setKiranaItemPrice('');
    }
  }, [open]);

  useEffect(() => {
    setDue(Math.max(0, Number(bill) - Number(paid)));
  }, [bill, paid]);

  // When quantity or rate changes for dairy, compute bill automatically
  useEffect(() => {
    if (section === 'Dairy') {
      const q = Number(quantity || 0);
      const r = Number(rate || 0);
      if (q > 0 && r > 0) {
        setBill(q * r);
      }
    }
  }, [quantity, rate, section]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add receipt to {section}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Bill amount (total)</Label>
              {/* For Dairy we compute bill from quantity and rate; for others allow manual entry */}
              {section === 'Dairy' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Quantity (litres)</Label>
                      <Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value || 0))} />
                    </div>
                    <div className="w-40">
                      <Label className="text-xs">Rate (NRs / Ltr)</Label>
                      <Input type="number" value={rate === '' ? '' : String(rate)} onChange={(e) => setRate(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Computed bill</div>
                    <div className="mt-1 p-2 border rounded bg-background/50 min-h-[42px] flex items-center justify-between">
                      <div className="text-sm">NRs {bill}</div>
                    </div>
                  </div>
                </div>
              ) : (
                section === 'Kirana' ? (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Item name</Label>
                      <Input placeholder="Item name" value={kiranaItemName} onChange={(e) => setKiranaItemName(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Price (NRs)</Label>
                      <Input type="number" value={kiranaItemPrice === '' ? '' : String(kiranaItemPrice)} onChange={(e) => setKiranaItemPrice(e.target.value === '' ? '' : Number(e.target.value))} onBlur={() => { if (kiranaItemPrice !== '') setBill(Number(kiranaItemPrice || 0)); }} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Source</div>
                      <div className="mt-1 p-2 border rounded bg-background/50 min-h-[42px] flex items-center justify-between">
                        <div className="text-sm">{selectedSource ? (selectedSource.type === 'one-off' ? `One-off${oneOffName ? ` — ${oneOffName}` : ''}` : selectedSource.name) : 'Select a source'}</div>
                        {selectedSource && selectedSource.type === 'one-off' ? (
                          <Input placeholder="One-off name" value={oneOffName} onChange={(e) => setOneOffName(e.target.value)} className="w-48 ml-2" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input type="number" value={bill} onChange={(e) => setBill(Number(e.target.value) || 0)} />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">Source</div>
                        <div className="mt-1 p-2 border rounded bg-background/50 min-h-[42px] flex items-center justify-between">
                          <div className="text-sm">{selectedSource ? (selectedSource.type === 'one-off' ? `One-off${oneOffName ? ` — ${oneOffName}` : ''}` : selectedSource.name) : 'Select a source'}</div>
                          {selectedSource && selectedSource.type === 'one-off' ? (
                            <Input placeholder="One-off name" value={oneOffName} onChange={(e) => setOneOffName(e.target.value)} className="w-48 ml-2" />
                          ) : null}
                        </div>
                    </div>
                  </div>
                )
              )}
              <div className="mt-2 flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {(SOURCES[section] ?? ['One-off']).map(s => (
                    <Button key={s} size="sm" variant={selectedSource?.name === s ? 'default' : 'outline'} onClick={() => {
                      // set default rates for dairy (Mama/Bhim uncle), otherwise set Main/One-off
                      if (section === 'Dairy' && s === 'Mama') {
                        setSelectedSource({ type: 'firm', name: s });
                        setRate(110);
                      } else if (section === 'Dairy' && s === 'Bhim uncle') {
                        setSelectedSource({ type: 'firm', name: s });
                        setRate(120);
                      } else if (s === 'One-off') {
                        setSelectedSource({ type: 'one-off', name: 'One-off' });
                        setRate('');
                      } else {
                        // Main or other firm-like source
                        setSelectedSource({ type: 'firm', name: s });
                      }
                    }}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">Paid amount</Label>
              <Input type="number" value={paid} onChange={(e) => setPaid(Number(e.target.value) || 0)} />
            </div>
            <div>
              <Label className="text-xs">Due amount</Label>
              <Input type="number" value={due} onChange={(e) => setDue(Number(e.target.value) || 0)} />
            </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button className="flex-1" onClick={() => {
                  const source = selectedSource ? (selectedSource.type === 'one-off' ? { type: 'one-off' as const, name: oneOffName || 'One-off' } : { type: 'firm' as const, name: selectedSource.name }) : undefined;
                  const payload: any = { date, bill, paid, due, source };
                  if (section === 'Dairy') {
                    payload.unit = 'ltr';
                    payload.quantity = Number(quantity || 0);
                    payload.rate = Number(rate || 0);
                  }
                  if (section === 'Kirana') {
                    payload.itemName = kiranaItemName;
                    payload.itemPrice = Number(kiranaItemPrice || 0);
                    // ensure bill reflects price entered
                    if (payload.itemPrice > 0) payload.bill = payload.itemPrice;
                  }
                  onSave(payload);
                }}>Save</Button>
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InventoryPage() {
  const [view, setView] = useState<'inventory' | 'staffs'>('inventory');
  const STORAGE_KEYS = {
    sections: 'inventory_sections',
    items: 'inventory_items',
    staffs: 'inventory_staffs',
  };

  const [sections, setSections] = useState<Section[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.sections);
      if (raw) return JSON.parse(raw) as Section[];
    } catch (e) {
      // ignore
    }
    return DEFAULT_SECTIONS.map(s => ({ name: s, receipts: [] }));
  });
  const [addOpen, setAddOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showReceiptsFor, setShowReceiptsFor] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [sourceFilter, setSourceFilter] = useState<Record<string, 'all' | 'firm1' | 'firm2' | 'oneoff' | 'main'>>({});
  // view mode: recent (unpaid) or paid receipts
  const [receiptView, setReceiptView] = useState<'recent' | 'paid'>('recent');
  // single toggle to show all past cleared records in a consolidated table
  const [showClearedRecords, setShowClearedRecords] = useState(false);
  // confirmDeleteTarget format: 'id|<receiptId>' or 'date|<sectionName>|<dateString>'
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  

  // Items and Staffs separate blocks
  const [items, setItems] = useState<Array<{ id: string; name: string; qty?: number }>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.items);
      if (raw) return JSON.parse(raw) as Array<{ id: string; name: string; qty?: number }>;
    } catch (e) {}
    return [];
  });
  const { toast } = useToast();
  type Staff = { id: string; name: string; role?: string; salary: number; advance: number; reduced: number; reduceNextMonth?: boolean; paidThisMonth?: boolean; paidThisMonthAmount?: number };
  const [staffs, setStaffs] = useState<Staff[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.staffs);
      if (raw) return JSON.parse(raw) as Staff[];
    } catch (e) {}
    return [
  { id: 's-ayush', name: 'ayush', role: '', salary: 20000, advance: 0, reduced: 0, reduceNextMonth: false, paidThisMonth: false, paidThisMonthAmount: 0 },
  { id: 's-umangs', name: 'umangs', role: '', salary: 20000, advance: 0, reduced: 6000, reduceNextMonth: false, paidThisMonth: false, paidThisMonthAmount: 0 },
  { id: 's-arogya', name: 'arogya', role: '', salary: 20000, advance: 0, reduced: 0, reduceNextMonth: false, paidThisMonth: false, paidThisMonthAmount: 0 },
  { id: 's-giri', name: 'giri', role: '', salary: 20000, advance: 0, reduced: 0, reduceNextMonth: false, paidThisMonth: false, paidThisMonthAmount: 0 },
  { id: 's-koju', name: 'koju', role: '', salary: 20000, advance: 0, reduced: 0, reduceNextMonth: false, paidThisMonth: false, paidThisMonthAmount: 0 },
    ];
  });
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState<number | ''>('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [newStaffSalary, setNewStaffSalary] = useState<number | ''>(20000);
  const [confirmDeleteStaffId, setConfirmDeleteStaffId] = useState<string | null>(null);
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const [draftAdvance, setDraftAdvance] = useState<Record<string, string>>({});
  const [draftExpense, setDraftExpense] = useState<Record<string, string>>({});
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editingSalary, setEditingSalary] = useState<number | ''>('');

  const openAdd = (sectionName: string) => { setActiveSection(sectionName); setAddOpen(true); };

  const handleAddReceipt = ({ date, bill, paid, due, source }: any) => {
    if (!activeSection) return;
    // if quantity/rate present (e.g., Dairy), use them to compute billAmount and store unit/quantity/rate
    const quantity = Number((arguments[0] as any)?.quantity || 0);
    const rate = Number((arguments[0] as any)?.rate || 0);
    const unit = (arguments[0] as any)?.unit;
    const itemName = (arguments[0] as any)?.itemName;
    const itemPrice = Number((arguments[0] as any)?.itemPrice || 0);
    const computedBill = (quantity > 0 && rate > 0) ? (quantity * rate) : Number(bill);
    const receipt: Receipt = {
      id: `r-${Date.now()}`,
      date: new Date(date).toISOString(),
      billAmount: Number(computedBill),
      paidAmount: Number(paid),
      dueAmount: Number(due),
      source,
      unit: unit || undefined,
      quantity: quantity > 0 ? quantity : undefined,
      rate: rate > 0 ? rate : undefined,
      itemName: itemName || undefined,
      itemPrice: itemPrice > 0 ? itemPrice : undefined,
      paidAt: (Number(paid) >= Number(computedBill)) ? new Date().toISOString() : undefined,
    };
    setSections(prev => prev.map(sec => sec.name === activeSection ? ({ ...sec, receipts: [receipt, ...sec.receipts] }) : sec));
    setAddOpen(false); setActiveSection(null);
  };

  // Persist sections/items/staffs to localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.sections, JSON.stringify(sections)); } catch (e) {}
  }, [sections]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(items)); } catch (e) {}
  }, [items]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.staffs, JSON.stringify(staffs)); } catch (e) {}
  }, [staffs]);

  const sectionTotals = (sec: Section) => {
    const totalBill = sec.receipts.reduce((s, r) => s + (r.billAmount || 0), 0);
    const totalPaid = sec.receipts.reduce((s, r) => s + (r.paidAmount || 0), 0);
    const totalDue = sec.receipts.reduce((s, r) => s + (r.dueAmount || 0), 0);
    return { totalBill, totalPaid, totalDue };
  };

  // Date filtering removed — main view hides old cleared receipts automatically.
  const matchesDateFilter = (_isoDate: string) => true;

  // helper: whether a receipt is considered paid
  const isPaidReceipt = (r: Receipt) => (Number(r.paidAmount || 0) >= Number(r.billAmount || 0));

  const overallTotals = sections.reduce((acc, sec) => {
    // apply global view filters (receiptView + dateFilter)
    const filtered = sec.receipts.filter(r => {
      if (!matchesDateFilter(r.date)) return false;
      if (receiptView === 'recent') return !isPaidReceipt(r);
      return isPaidReceipt(r);
    });
    const t = filtered.reduce((s, r) => ({ totalBill: s.totalBill + (r.billAmount || 0), totalPaid: s.totalPaid + (r.paidAmount || 0), totalDue: s.totalDue + (r.dueAmount || 0) }), { totalBill: 0, totalPaid: 0, totalDue: 0 });
    acc.bill += t.totalBill; acc.paid += t.totalPaid; acc.due += t.totalDue; return acc;
  }, { bill: 0, paid: 0, due: 0 });

  // Make expansion exclusive: only one section expanded at a time
  const toggleSection = (name: string) => {
    setExpandedSections(prev => {
      const isOpen = !!prev[name];
      if (isOpen) return { ...prev, [name]: false };
      // close others, open this one
      const next: Record<string, boolean> = {};
      // include sections + Items + Staffs as possible expandable keys
      sections.forEach(s => { next[s.name] = s.name === name; });
      next['Items'] = name === 'Items';
      next['Staffs'] = name === 'Staffs';
      return next;
    });
  };

  const PlusIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const TrashIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant={view === 'inventory' ? 'default' : 'ghost'} onClick={() => setView('inventory')}>Inventory</Button>
        <Button variant={view === 'staffs' ? 'default' : 'ghost'} onClick={() => setView('staffs')}>Staffs</Button>
      </div>
      {view === 'inventory' ? (
        <Card>
        <CardHeader>
          <CardTitle>Inventory Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm">Totals — Bill: NRs {overallTotals.bill} • Paid: NRs {overallTotals.paid} • Due: NRs {overallTotals.due}</div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" onClick={() => { /* placeholder for refresh */ }}>Refresh</Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Button size="sm" variant={receiptView === 'recent' ? 'default' : 'outline'} onClick={() => setReceiptView('recent')}>Recent</Button>
              <Button size="sm" variant={receiptView === 'paid' ? 'default' : 'outline'} onClick={() => setReceiptView('paid')}>Paid</Button>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant={showClearedRecords ? 'default' : 'outline'} onClick={() => setShowClearedRecords(prev => !prev)}>{showClearedRecords ? 'Hide cleared' : 'Show cleared records'}</Button>
              <Button size="sm" variant="destructive" onClick={() => {
                // clear all receipts data
                setSections(DEFAULT_SECTIONS.map(s => ({ name: s, receipts: [] })));
                try { localStorage.removeItem(STORAGE_KEYS.sections); } catch (e) {}
                toast({ title: 'Receipts cleared', description: 'All receipts have been removed.' });
              }}>Clear receipts</Button>
            </div>
          </div>

          {/* Cleared records consolidated table - shown when user toggles Show cleared records */}
          {showClearedRecords ? (
            <Card className="mb-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Cleared receipts (all time)</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowClearedRecords(false)}>Close</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th>Date</th>
                        <th>Section</th>
                        <th className="text-right">Bill</th>
                        <th className="text-right">Paid</th>
                        <th className="text-right">Paid at</th>
                        <th>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sections.flatMap(sec => sec.receipts.map(r => ({ ...r, __section: sec.name }))).filter(r => isPaidReceipt(r)).sort((a, b) => {
                        const ta = new Date(a.paidAt ?? a.date).getTime();
                        const tb = new Date(b.paidAt ?? b.date).getTime();
                        return tb - ta;
                      }).map((r) => (
                        <tr key={r.id} className="border-t">
                                <td className="py-2">{new Date(r.date).toDateString()}</td>
                                <td className="py-2">{(r as any).__section}</td>
                                <td className="py-2 text-right">NRs {r.billAmount}</td>
                                <td className="py-2 text-right">NRs {r.paidAmount}</td>
                                <td className="py-2 text-right">{r.paidAt ? new Date(r.paidAt).toLocaleString() : '-'}</td>
                                <td className="py-2">{r.source ? (r.source.type === 'one-off' ? r.source.name : r.source.name) : '—'}</td>
                                <td className="py-2 text-right">
                                  <Button size="sm" variant="destructive" onClick={() => setConfirmDeleteTarget(`id|${r.id}`)}>
                                    <TrashIcon />
                                  </Button>
                                </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* If no section is expanded, render the original two-column grid of all sections */}
          {Object.values(expandedSections).every(v => !v) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sections.map(section => {
                return (
                  <div key={section.name} className="border rounded-lg p-3 flex items-center justify-between" role="button" onClick={() => toggleSection(section.name)} aria-pressed={!!expandedSections[section.name]}>
                    <h4 className="font-medium">{section.name}</h4>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openAdd(section.name); }} aria-label={`Add receipt to ${section.name}`}>
                      <PlusIcon />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* One section expanded: non-expanded (left) | expanded (right) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                {sections.map(section => {
                  if (expandedSections[section.name]) return null;
                  return (
                    <div key={section.name} className="border rounded-lg p-3 flex items-center justify-between" role="button" onClick={() => toggleSection(section.name)} aria-pressed={!!expandedSections[section.name]}>
                      <h4 className="font-medium">{section.name}</h4>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openAdd(section.name); }} aria-label={`Add receipt to ${section.name}`}>
                        <PlusIcon />
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div>
                  {sections.map(section => {
                    if (!expandedSections[section.name]) return null;
                    // source filter for this section (all | firm1 | firm2 | oneoff | main)
                    const filterKey = sourceFilter[section.name] || 'all';
                    const filteredReceipts = section.receipts.filter(r => {
                      // supplier filter
                      if (filterKey === 'all') {
                        // ok
                      } else if (filterKey === 'firm1') {
                        if (!(r.source?.type === 'firm' && r.source?.name === 'Mama')) return false;
                      } else if (filterKey === 'firm2') {
                        if (!(r.source?.type === 'firm' && r.source?.name === 'Bhim uncle')) return false;
                      } else if (filterKey === 'main') {
                        if (!(r.source?.type === 'firm' && r.source?.name === 'Main')) return false;
                      } else if (filterKey === 'oneoff') {
                        if (!(r.source?.type === 'one-off' || !r.source)) return false;
                      }
                      // date filter
                      if (!matchesDateFilter(r.date)) return false;
                      // paid/unpaid view filter
                      if (receiptView === 'recent' && isPaidReceipt(r)) return false;
                      if (receiptView === 'paid' && !isPaidReceipt(r)) return false;
                      // Hide fully-paid receipts older than 15 days in the main view.
                      // Past cleared receipts are accessible via the 'Show cleared records' button.
                      {
                        const paidTime = r.paidAt ? new Date(r.paidAt) : new Date(r.date);
                        try {
                          const ageMs = Date.now() - paidTime.getTime();
                          const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
                          if (isPaidReceipt(r) && ageMs > fifteenDaysMs) return false;
                        } catch (e) {
                          // ignore parse errors
                        }
                      }
                      return true;
                    });
                  const totals = filteredReceipts.reduce((acc, r) => ({ totalBill: acc.totalBill + (r.billAmount || 0), totalPaid: acc.totalPaid + (r.paidAmount || 0), totalDue: acc.totalDue + (r.dueAmount || 0) }), { totalBill: 0, totalPaid: 0, totalDue: 0 });
                  // group receipts by date for an Excel-like daily tally and per-day "Mark paid" action
                  const groupedByDate: Record<string, Receipt[]> = {};
                  filteredReceipts.forEach(r => {
                    const key = new Date(r.date).toDateString();
                    if (!groupedByDate[key]) groupedByDate[key] = [];
                    groupedByDate[key].push(r);
                  });
                  const dateKeys = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

                  // Mark all visible receipts for this section as paid
                  const markPaidForAllVisible = () => {
                    const nowIso = new Date().toISOString();
                    // filteredReceipts contains the visible receipts for this section under current filters
                    const visibleIds = new Set(filteredReceipts.map(r => r.id));
                    setSections(prev => prev.map(sec => {
                      if (sec.name !== section.name) return sec;
                      return {
                        ...sec,
                        receipts: sec.receipts.map(r => {
                          if (!visibleIds.has(r.id)) return r;
                          return { ...r, paidAmount: r.billAmount, dueAmount: 0, paidAt: nowIso };
                        })
                      };
                    }));
                    toast({ title: 'Marked paid', description: `All visible receipts for ${section.name} marked paid.` });
                  };

                  return (
                    <div key={section.name} className="border rounded-lg p-3 cursor-pointer" role="button" onClick={() => toggleSection(section.name)} aria-pressed={!!expandedSections[section.name]}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{section.name}</h4>
                          <div className="text-xs text-muted-foreground">{section.receipts.length} receipts</div>
                        </div>
                        <div className="text-right text-sm">
                          <div>Bill: <span className="font-medium">NRs {totals.totalBill}</span></div>
                          <div>Paid: <span className="font-medium">NRs {totals.totalPaid}</span></div>
                          <div>Due: <span className="font-medium text-rose-600">NRs {totals.totalDue}</span></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end mb-2 space-x-2">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openAdd(section.name); }} aria-label={`Add receipt to ${section.name}`}>
                          <PlusIcon />
                        </Button>
                      </div>

                          {/* removed the 15-day dairy summary; using per-day aggregates below instead */}

                      {/* Source filter controls (per-section) */}
                      <div className="flex items-center gap-2 mb-3">
                        {((section.name === 'Dairy') ? ['all', 'firm1', 'firm2', 'oneoff'] : ['all', 'main', 'oneoff']).map(key => {
                          const label = key === 'all' ? 'All' : key === 'firm1' ? 'Mama' : key === 'firm2' ? 'Bhim uncle' : key === 'main' ? 'Main' : 'One-off';
                          const isSelected = (sourceFilter[section.name] || 'all') === key;
                          return (
                            <Button key={key} size="sm" variant={isSelected ? 'default' : 'outline'} onClick={(e) => { e.stopPropagation(); setSourceFilter(prev => ({ ...prev, [section.name]: key as any })); }}>
                              {label}
                            </Button>
                          );
                        })}
                      </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-xs text-muted-foreground">
                                      <th>Date</th>
                                      {section.name === 'Dairy' ? (
                                        <>
                                          <th className="text-right">Ltrs</th>
                                          <th className="text-right">Rate</th>
                                        </>
                                      ) : null}
                                      <th className="text-right">Bill</th>
                                      <th className="text-right">Paid</th>
                                      <th className="text-right">Due</th>
                                      <th />
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {dateKeys.map(dateKey => {
                                      const dayReceipts = groupedByDate[dateKey];
                                      const dayTotals = dayReceipts.reduce((s, rr) => ({ totalBill: s.totalBill + (rr.billAmount || 0), totalPaid: s.totalPaid + (rr.paidAmount || 0), totalDue: s.totalDue + (rr.dueAmount || 0) }), { totalBill: 0, totalPaid: 0, totalDue: 0 });
                                      // compute dairy-specific aggregates when needed
                                      const dayLitres = dayReceipts.reduce((s, rr) => s + (Number(rr.quantity || 0)), 0);
                                      const avgRate = dayLitres > 0 ? (dayTotals.totalBill / dayLitres) : undefined;
                                      return (
                                        <tr key={dateKey} className="border-t">
                                          <td className="py-2">
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <div>{dateKey}</div>
                                                {section.name === 'Dairy' ? (
                                                  <div className="text-xs text-muted-foreground">{dayLitres} Ltrs • Rate: {avgRate ? `NRs ${avgRate.toFixed(2)}` : '—'}</div>
                                                ) : null}
                                              </div>
                                              <div>
                                                {section.name === 'Dairy' ? null : (
                                                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] })); }}>{expandedDates[dateKey] ? 'Hide' : 'Details'}</Button>
                                                )}
                                              </div>
                                            </div>
                                          </td>
                                          {section.name === 'Dairy' ? (
                                            <>
                                              <td className="py-2 text-right">{dayLitres}</td>
                                              <td className="py-2 text-right">{avgRate ? `NRs ${avgRate.toFixed(2)}` : '—'}</td>
                                            </>
                                          ) : null}
                                          <td className="py-2 text-right">NRs {dayTotals.totalBill}</td>
                                          <td className="py-2 text-right">NRs {dayTotals.totalPaid}</td>
                                          <td className="py-2 text-right">NRs {dayTotals.totalDue}</td>
                                          <td className="py-2 text-right">
                                            {/* Per-day buttons removed — single footer "Mark paid" will mark all visible receipts */}
                                            {dayTotals.totalDue > 0 ? null : (
                                              <div className="text-xs text-muted-foreground">Cleared</div>
                                            )}
                                          </td>
                                          <td className="py-2 text-right">
                                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setConfirmDeleteTarget(`date|${section.name}|${dateKey}`); }} aria-label={`Delete all receipts for ${dateKey}`}>
                                              <TrashIcon />
                                            </Button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                    {/* footer totals */}
                                    <tr className="border-t font-semibold">
                                      <td className="py-2">Total</td>
                                      <td className="py-2 text-right">NRs {totals.totalBill}</td>
                                      <td className="py-2 text-right">NRs {totals.totalPaid}</td>
                                      <td className="py-2 text-right">NRs {totals.totalDue}</td>
                                      <td className="py-2 text-right">
                                        {totals.totalDue > 0 ? (
                                          <Button size="sm" onClick={(e) => { e.stopPropagation(); markPaidForAllVisible(); }}>Mark paid</Button>
                                        ) : (
                                          <div className="text-xs text-muted-foreground">All cleared</div>
                                        )}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              {/* Render per-date details (individual receipts) below the table for expanded dates */}
                              {dateKeys.map(dateKey => {
                                if (!expandedDates[dateKey]) return null;
                                const receipts = groupedByDate[dateKey];
                                return (
                                  <div key={`details-${dateKey}`} className="mt-2 border rounded p-2 bg-muted/5">
                                    {receipts.map(r => (
                                      <div key={r.id} className="flex items-center justify-between py-1 border-b last:border-b-0">
                                        <div>
                                          <div className="font-medium">{r.itemName ?? r.source?.name ?? (r.unit ? `${r.quantity} ${r.unit}` : 'Receipt')}</div>
                                          <div className="text-xs text-muted-foreground">NRs {r.billAmount} • Paid: NRs {r.paidAmount} • Due: NRs {r.dueAmount}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button size="sm" variant="destructive" onClick={() => setConfirmDeleteTarget(`id|${r.id}`)}>
                                            <TrashIcon />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
        </Card>
      ) : null}

      {view === 'inventory' ? (
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm">Total items: {items.length}</div>
              <div>
                <Button size="sm" onClick={() => setAddItemOpen(true)}>Add Item</Button>
              </div>
            </div>

            <div className="space-y-2">
              {items.map(it => (
                <div key={it.id} className="flex items-center justify-between border rounded p-2">
                  <div>
                    <div className="font-medium">{it.name}</div>
                    {it.qty !== undefined ? <div className="text-xs text-muted-foreground">Qty: {it.qty}</div> : null}
                  </div>
                  <div className="text-sm text-muted-foreground">ID: {it.id}</div>
                </div>
              ))}
              {items.length === 0 ? <div className="text-sm text-muted-foreground">No items yet</div> : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {view === 'staffs' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div />
            <div>
              {/* Add employee button */}
              <Button size="sm" onClick={() => setAddStaffOpen(true)}>+ Add Employee</Button>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Total Employees</div>
                <div className="mt-2 text-2xl font-semibold">{staffs.length}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Total Payroll</div>
                <div className="mt-2 text-2xl font-semibold">NRs {staffs.reduce((s, x) => s + (x.salary || 0), 0).toLocaleString()}</div>
              </div>
            </div>

            <div className="space-y-2">
                {staffs.map((s) => {
                const baseRemaining = s.salary - (s.advance + s.reduced);
                const remaining = Math.max(0, baseRemaining - (s.paidThisMonthAmount || 0));
                const isOpen = expandedStaffId === s.id;
                return (
                  <Card key={s.id} className="overflow-hidden">
                    <CardHeader className="p-3 flex flex-row items-center justify-between cursor-pointer space-y-0" onClick={() => setExpandedStaffId(prev => prev === s.id ? null : s.id)}>
                      <div className="flex items-center space-x-3 text-left">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm">{s.name?.[0]?.toUpperCase() || '?'}</div>
                        <div>
                          <div className="font-medium text-sm">{s.name}</div>
                          {s.role ? <div className="text-xs text-muted-foreground">{s.role}</div> : null}
                        </div>
                      </div>

                      <div className="text-right">
                        {isOpen ? (
                          <>
                            <div className="text-lg font-semibold">NRs {remaining.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Remaining</div>
                          </>
                        ) : (
                          <>
                            <div className="text-lg font-semibold">NRs {s.salary.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Current Salary</div>
                          </>
                        )}
                      </div>
                    </CardHeader>

                    {isOpen ? (
                      <CardContent className="p-4 bg-card">
                        <div className="grid grid-cols-2 gap-4 mb-4 items-center">
                          <div>
                            <div className="text-xs text-muted-foreground">JOIN DATE</div>
                            <div className="font-medium">{(s as any).joinDate || new Date().toISOString().slice(0,10)}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-muted-foreground">CURRENT SALARY</div>
                              <div className="font-medium">NRs {s.salary.toLocaleString()}</div>
                              <div className={`mt-1 font-semibold ${remaining < 0 ? 'text-rose-600' : ''}`}>Remaining: NRs {remaining}</div>
                            </div>
                            <div>
                                  {s.paidThisMonth ? (
                                    <div className="flex items-center gap-2">
                                      <div className="text-sm font-medium">Next salary: NRs {s.salary.toLocaleString()}</div>
                                      <Button size="sm" variant="outline" onClick={(e) => {
                                        e.stopPropagation();
                                        // undo paid mark for this month
                                        setStaffs(prev => prev.map(p => p.id === s.id ? ({ ...p, paidThisMonth: false, paidThisMonthAmount: 0 }) : p));
                                      }}>Undo</Button>
                                    </div>
                                  ) : (
                                    <Button size="sm" variant="default" onClick={(e) => {
                                      e.stopPropagation();
                                      setStaffs(prev => prev.map(p => {
                                        if (p.id !== s.id) return p;
                                        const base = p.salary - (p.advance + p.reduced);
                                        // mark paid -> record paid amount equal to remaining at this moment
                                        const amt = Math.max(0, base);
                                        return { ...p, paidThisMonth: true, paidThisMonthAmount: amt };
                                      }));
                                    }}>Mark paid</Button>
                                  )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="text-sm font-medium mb-2">Advance Salary</div>
                            <div className="flex items-center gap-2">
                              <Input placeholder="Amount" value={draftAdvance[s.id] ?? ''} onChange={(e) => setDraftAdvance(prev => ({ ...prev, [s.id]: e.target.value }))} />
                              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                                const amt = Number(draftAdvance[s.id]) || 0;
                                if (amt <= 0) return;
                                setStaffs(prev => prev.map(p => p.id === s.id ? ({ ...p, advance: (p.advance || 0) + amt }) : p));
                                setDraftAdvance(prev => ({ ...prev, [s.id]: '' }));
                              }}>+ Add</Button>
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-medium mb-2">Extra Expenses</div>
                            <div className="flex items-center gap-2">
                              <Input placeholder="Amount" value={draftExpense[s.id] ?? ''} onChange={(e) => setDraftExpense(prev => ({ ...prev, [s.id]: e.target.value }))} />
                              <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => {
                                const amt = Number(draftExpense[s.id]) || 0;
                                if (amt <= 0) return;
                                setStaffs(prev => prev.map(p => p.id === s.id ? ({ ...p, reduced: (p.reduced || 0) + amt }) : p));
                                setDraftExpense(prev => ({ ...prev, [s.id]: '' }));
                              }}>+ Add</Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <AddReceiptModal open={addOpen} section={activeSection} onClose={() => setAddOpen(false)} onSave={handleAddReceipt} />

      {/* Delete confirmation modal for receipts (single id or date bulk) */}
      {confirmDeleteTarget ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm">Are you sure you want to delete the selected record(s)? This action cannot be undone.</div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteTarget(null)}>Cancel</Button>
                  <Button variant="destructive" className="flex-1" onClick={() => {
                    const target = confirmDeleteTarget;
                    if (!target) return;
                    if (target.startsWith('id|')) {
                      const idToDelete = target.split('|')[1];
                      setSections(prev => prev.map(sec => ({ ...sec, receipts: sec.receipts.filter(r => r.id !== idToDelete) })));
                    } else if (target.startsWith('date|')) {
                      const parts = target.split('|');
                      const sectionName = parts[1];
                      const dateKey = parts[2];
                      setSections(prev => prev.map(sec => {
                        if (sec.name !== sectionName) return sec;
                        return { ...sec, receipts: sec.receipts.filter(r => new Date(r.date).toDateString() !== dateKey) };
                      }));
                    }
                    setConfirmDeleteTarget(null);
                    toast({ title: 'Deleted', description: 'Record(s) removed.' });
                  }}>Delete</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Items block */}
      

      {/* Add Item modal (simple) */}
      {addItemOpen ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Item</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Item name</Label>
                  <Input placeholder="Item name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Qty (optional)</Label>
                  <Input type="number" placeholder="Qty" value={newItemQty === '' ? '' : String(newItemQty)} onChange={(e) => setNewItemQty(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setAddItemOpen(false); setNewItemName(''); setNewItemQty(''); }}>Cancel</Button>
                  <Button className="flex-1" onClick={() => {
                    const name = newItemName.trim();
                    if (!name) return;
                    const item = { id: `i-${Date.now()}`, name, qty: newItemQty === '' ? undefined : Number(newItemQty) };
                    setItems(prev => [item, ...prev]);
                    setAddItemOpen(false);
                    setNewItemName(''); setNewItemQty('');
                  }}>Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Add Staff modal (simple) */}
      {addStaffOpen ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onMouseDown={(e) => e.stopPropagation()}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Add Staff</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                <div>
                  <Label className="text-xs">Staff name</Label>
                  <Input placeholder="Staff name" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} autoFocus />
                </div>
                <div>
                  <Label className="text-xs">Role (optional)</Label>
                  <Input placeholder="Role (optional)" value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Salary (NRs)</Label>
                  <Input type="number" placeholder="Salary" value={newStaffSalary === '' ? '' : String(newStaffSalary)} onChange={(e) => setNewStaffSalary(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setAddStaffOpen(false); setNewStaffName(''); setNewStaffRole(''); setNewStaffSalary(20000); }}>Cancel</Button>
                  <Button className="flex-1" onClick={() => {
                    const name = newStaffName.trim();
                    const role = newStaffRole.trim();
                    if (!name) return;
                    const salary = newStaffSalary === '' ? 20000 : Number(newStaffSalary) || 20000;
                    setStaffs(prev => [{ id: `s-${Date.now()}`, name, role, salary, advance: 0, reduced: 0, reduceNextMonth: false }, ...prev]);
                    setAddStaffOpen(false);
                    setNewStaffName(''); setNewStaffRole(''); setNewStaffSalary(20000);
                  }}>Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Confirm delete staff modal */}
      {confirmDeleteStaffId ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onMouseDown={(e) => e.stopPropagation()}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Remove employee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm">Are you sure you want to remove <span className="font-medium">{staffs.find(s => s.id === confirmDeleteStaffId)?.name}</span>? This action cannot be undone.</div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteStaffId(null)}>Cancel</Button>
                  <Button className="flex-1" variant="destructive" onClick={() => {
                    setStaffs(prev => prev.filter(p => p.id !== confirmDeleteStaffId));
                    setConfirmDeleteStaffId(null);
                  }}>Remove</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Edit Salary Modal */}
      {editingStaffId ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Update Salary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">Current salary</div>
                  <div className="font-medium">NRs {staffs.find(s => s.id === editingStaffId)?.salary?.toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-xs">New salary</Label>
                  <Input type="number" value={editingSalary === '' ? '' : String(editingSalary)} onChange={(e) => setEditingSalary(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setEditingStaffId(null); setEditingSalary(''); }}>Cancel</Button>
                  <Button className="flex-1" onClick={() => {
                    const amt = Number(editingSalary) || 0;
                    if (amt <= 0) return;
                    setStaffs(prev => prev.map(p => p.id === editingStaffId ? ({ ...p, salary: amt }) : p));
                    setEditingStaffId(null); setEditingSalary('');
                  }}>Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
