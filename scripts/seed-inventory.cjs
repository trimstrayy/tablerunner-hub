#!/usr/bin/env node
// Simple seed script to insert inventory rows for bakery and hookah flavors
// Usage: node scripts/seed-inventory.cjs

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function seed() {
  try {
    const items = [
      { name: 'Bread Loaf', quantity: 50, unit: 'pcs' },
      { name: 'Croissant', quantity: 40, unit: 'pcs' },
      { name: 'Muffin', quantity: 60, unit: 'pcs' },
      { name: 'Donut', quantity: 80, unit: 'pcs' },
      { name: 'Hookah: Apple', quantity: 20, unit: 'pack' },
      { name: 'Hookah: Mint', quantity: 20, unit: 'pack' },
      { name: 'Hookah: Grape', quantity: 15, unit: 'pack' },
    ];

    const { data, error } = await supabase.from('inventory').insert(items).select();
    if (error) {
      console.error('Insert error:', error.message || error);
      process.exit(1);
    }

    console.log('Inserted rows:', data.length);
    console.table(data);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding inventory:', err);
    process.exit(1);
  }
}

seed();
