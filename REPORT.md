# TableRunner Hub — System Report

Date: 2025-11-17

---

## Purpose

This report documents the TableRunner Hub application: its use case, features, data model, high-level architecture, how the system works end-to-end, and a yearly maintenance plan. The style and section order follow the attached PDF as a template; images and additional resources are left as placeholders you can replace later.

> Note: The sections about security and vulnerability have been intentionally omitted per your request.

---

## Executive summary

TableRunner Hub is a lightweight POS + Inventory + Admin dashboard built with React + TypeScript and Tailwind primitives. It supports point-of-sale order creation and printing, inventory receipt recording (multi-section: Dairy, Bakery, Kirana, Vegetables), and a small admin area for analytics and staff payroll. It stores Inventory state in localStorage (client-side) and persists Orders, Menu items, and analytics to Supabase via existing hooks.

This document describes the app from the operator's perspective (use case), from the developer's perspective (data model and architecture), and from the maintainer's perspective (yearly operations & maintenance).

---

## Contents

- Use case
- Key features
- Database structure (ER / schema)
- System architecture and components
- How the system works (user flows)
- Yearly maintenance plan
- Placeholders for images and resources
- Next steps & recommendations

---

## Use case

Primary users:

- Shop staff (POS operators): Create orders, print receipts, accept payments.
- Store manager / owner: Track sales, orders, and inventory receipts; mark supplier bills paid; reconcile daily/weekly totals.
- Admin users: Edit menu, run reports and analytics.

Primary scenarios:

1. POS flow (take orders, optionally mark paid, print receipts on 78mm thermal printers without opening new tabs).
2. Inventory intake (add supplier receipts for Dairy, Bakery, Kirana, Vegetables). Dairy receipts are quantity-based (litres) with per-supplier rates; Kirana supports item name + price.
3. Mark day-level payments: bills are shown in an Excel-like daily tally and a single "Mark paid" per day marks all visible receipts paid.
4. View cleared receipts (consolidated table) and delete faulty receipts when necessary.

Business goals fulfilled:

- Faster order entry and printing.
- Simple supplier bill tracking with daily aggregation and bulk payment operations.
- Light-weight analytics and sales-by-item ranking (POS menu ordering uses historical sales counts).

---

## Key features (app-level)

- POS
  - Menu browsing and search
  - Add items (menu items and one-off items)
  - Keyboard shortcut for quick-add (e.g., 'T' for milk tea)
  - Discounts (fixed or percentage)
  - Print receipts optimized for 78mm thermal paper (hidden iframe printing)
  - Mark paid & Close workflow for orders

- Inventory
  - Sections: Dairy, Bakery, Kirana, Vegetables
  - Add receipts modal (date, bill, paid, due, source, dairy quantity/rate, kirana item name/price)
  - Dairy-specific: quantity (litres) and supplier-specific rates (Mama=110, Bhim uncle=120 by default) and computed bill = qty * rate
  - Per-section source filters (All / Mama / Bhim uncle / One-off / Main)
  - Daily grouped Excel-like view with per-date Mark paid (bulk) and Totals footer
  - Consolidated cleared receipts view (all-time) and per-receipt delete
  - Clear receipts (destructive) option for starting fresh

- Staff & Payroll
  - Add staff, record advances and extra expenses
  - Mark salary paid for month; after marking paid the UI displays the "Next salary" amount (undo available)

- Dashboard and Analytics
  - Sales-by-item sorted by total quantity sold
  - Orders list default to unpaid (recent) with Paid toggle

---

## Database structure (recommended / existing)

Notes: The app currently uses Supabase for Orders/Menu persistence and localStorage for Inventory. Below is a recommended schema that maps to the current app behavior and is suitable if you want to move Inventory to persistent storage in future.

ER high level:

- users (id, name, email, role)
- menu_items (id, name, category, price, image_url, owner_id)
- orders (id, order_number, owner_id, subtotal, discount, total, paid, paid_amount, customer_name, table_group, table_number, payment_method, created_at)
- order_items (id, order_id, item_id (nullable for one-off), name (nullable for one-off), quantity, price, total)
- inventory_sections (id, name)
- receipts (id, section_id, date, bill_amount, paid_amount, due_amount, source_type ('firm'|'one-off'), source_name, unit, quantity, rate, item_name, item_price, paid_at, created_at)
- staff (id, name, role, salary, advance, reduced, paid_this_month (bool), paid_this_month_amount, created_at)

Example SQL (simplified):

```sql
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  price numeric not null,
  image_url text,
  owner_id uuid references users(id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number int,
  owner_id uuid references users(id),
  subtotal numeric,
  discount numeric,
  total numeric,
  paid boolean default false,
  paid_amount numeric default 0,
  customer_name text,
  table_group text,
  table_number text,
  payment_method text,
  created_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  item_id uuid references menu_items(id),
  name text,
  quantity int,
  price numeric,
  total numeric
);

create table receipts (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  date timestamptz not null,
  bill_amount numeric,
  paid_amount numeric default 0,
  due_amount numeric default 0,
  source_type text,
  source_name text,
  unit text,
  quantity numeric,
  rate numeric,
  item_name text,
  item_price numeric,
  paid_at timestamptz
);

create table staff (
  id uuid primary key default gen_random_uuid(),
  name text,
  role text,
  salary numeric,
  advance numeric default 0,
  reduced numeric default 0,
  paid_this_month boolean default false,
  paid_this_month_amount numeric default 0
);
```

If you move Inventory from localStorage to the DB, receipts will map into the `receipts` table and the UI logic remains the same with server-side persistence.

---

## System architecture and components

- Frontend: React + TypeScript + Vite (project files indicate a Vite/React app). Tailwind-based UI primitives and small UI components (buttons, cards, modals). The repo contains pages: `src/pages/Inventory.tsx`, POS `src/components/pos/OrdersTab.tsx`, hooks `useSupabase`, `useAnalytics`, etc.
- Backend / Data store: Supabase (Postgres + Realtime) for Orders/Menu; localStorage used for Inventory receipts and small client caches.
- Printing: hidden iframe approach to render and print HTML tailored for 78mm thermal printers.

Data flow (high-level):

1. POS operator adds items → frontend builds order payload → create order via `createOrder` mutation (Supabase) → saved order returns final order_number → frontend prints receipt using hidden iframe.
2. Inventory receipts are added via AddReceiptModal → stored to `sections` state and persisted to localStorage. (Optional future step: call an API to persist into `receipts` table.)
3. Analytics & menu sorting: frontend fetches `orders` and `menu_items` via hooks, computes sales counts (salesCountMap) to order menu items by popularity.

---

## How the system works (detailed flows)

POS flow (typical):

1. Staff chooses menu items (or adds one-off items) and builds the order.
2. Optionally apply discount (fixed or %), select payment method, and mark paid.
3. Save order → `createOrder` mutation persists order + items in Supabase.
4. On successful save, the app generates a printable receipt HTML (78mm focused) and prints it using a hidden iframe (so no new tabs are opened).
5. Order is cleared from the UI and next order number increments.

Inventory / Supplier flow:

1. Expand a section (e.g., Dairy) and click Add Receipt.
2. For Dairy: enter date, quantity (litres), select supplier (Mama/Bhim uncle/One-off) — rates can default (Mama 110, Bhim uncle 120) or be typed manually. Bill is computed as qty * rate.
3. Save → receipt is inserted into `sections` state and persisted to localStorage; paidAmount and paidAt are set if fully paid.
4. In expanded section, receipts are grouped per-date and the UI shows daily totals; the footer has a single "Mark paid" action for the visible receipts. Clicking that sets paidAmount=bill and paidAt timestamp for all visible receipts.
5. By default the UI hides fully-paid receipts older than 15 days; use the "Show cleared records" view to inspect all cleared receipts (consolidated table), with delete actions for faulty entries.

Staff payroll flow:

1. Add staff and record advances or extra expenses.
2. Mark staff as paid for the month — the UI will show "Next salary: NRs ..." and record paidThisMonth and paidThisMonthAmount. Undo is available.

---

## Yearly maintenance plan

The following checklist is a recommended yearly maintenance plan for operational continuity and reliability.

1. Quarterly backups (minimum)
   - Full database backup (Supabase snapshots) every quarter; weekly incremental backups if possible.
2. Annual data retention review
   - Archive receipts older than X years (if regulatory requirements or disk space concerns). Move archived data to cold storage if needed.
3. Upgrade dependencies & audit
   - Annually review major upgrades of React, TypeScript, and Supabase client packages. Test upgrades on a staging environment.
4. Print templates review
   - Annually verify receipt templates for compatibility with thermal paper/printer firmware updates.
5. Business continuity
   - Run a restore drill annually to ensure backups can be restored and app workflow recovers.
6. Analytics & report review
   - Review top-selling items and supplier costs every year to update default rates and procurement decisions.

---

## Placeholders for images & resources

Replace the following placeholders with real images/screenshots when available:

- [ ] PLACEHOLDER: app_screenshot_pos.png — POS screen with order open
- [ ] PLACEHOLDER: app_screenshot_inventory.png — Inventory expanded (Dairy) with daily grouping
- [ ] PLACEHOLDER: db_schema_diagram.png — ER diagram for database
- [ ] PLACEHOLDER: print_template_78mm.png — Sample 78mm receipt layout

If you have images you want embedded in the final PDF or docs, attach them and I will update the report to include them and adjust captions.

---

## All features (consolidated)

This is a consolidated feature list derived from the codebase and UI behavior:

- POS: add/remove items, one-off items, quantity edits, keyboard shortcuts, discounts, subtotal/total calculation.
- Printing: hidden-iframe printing tailored to 78mm thermal receipts, optimized CSS for readability.
- Orders: persistence to Supabase, next-order number generation, paid/unpaid flags.
- Menu management: create/update/delete menu items, categories, image support.
- Inventory: sections, AddReceipt modal, dairy quantity/rate computation, kirana item name/price, per-section source filters, daily grouped tallies, footer totals, per-date Mark paid (bulk), cleared-records view, delete (single/date bulk), clear receipts.
- Staff: add/edit staff, advances, extra expenses, mark paid/undo, display next salary post-mark paid.
- Analytics: sales-by-item sorted by quantity, dashboard orders default to unpaid; sales counts used to order menu items in POS.
- UX details: collapse/expand sections, per-section source filters, persistence to localStorage for inventory, optimistic UI behaviors.

---

## Next steps & deliverables

1. If you want this report exported to PDF with the same typography/visuals as your attached PDF, tell me which fonts or assets to use; I can generate a PDF in the repo or give you a downloadable file.
2. If you want Inventory persisted server-side, I can:
   - add API hooks to persist receipts to Supabase `receipts` table and migrate existing localStorage receipts into the DB via a one-time import script.
3. If you want visual diagrams (ER diagram, architecture diagram), attach any diagrams or allow me to generate simple SVG placeholders; I'll insert them into the report.

---

If you'd like any changes to the structure or additional sections (for example, an operations runbook, install/run steps, or a printable one-page summary for staff), tell me which and I'll add them.

