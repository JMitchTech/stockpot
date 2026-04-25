-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- RESTAURANTS
create table restaurants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  plan text not null default 'free',
  preferred_language text not null default 'en',
  timezone text not null default 'America/New_York',
  currency text not null default 'USD',
  food_cost_target_pct float not null default 30.0,
  created_at timestamptz not null default now()
);

-- USERS
create table users (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  email text not null unique,
  role text not null default 'owner',
  hashed_password text not null,
  preferred_language text not null default 'en',
  must_change_password boolean not null default false,
  last_login timestamptz,
  created_at timestamptz not null default now()
);

-- INGREDIENTS
create table ingredients (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  unit text not null,
  cost_per_unit float not null default 0.0,
  par_level float not null default 0.0,
  current_stock float not null default 0.0,
  barcode text,
  updated_at timestamptz not null default now()
);

-- MENU ITEMS
create table menu_items (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  category text,
  sale_price float not null default 0.0,
  food_cost_cached float,
  margin_cached float,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- RECIPE LINES
create table recipe_lines (
  id uuid primary key default uuid_generate_v4(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  quantity float not null,
  unit text not null
);

-- ALLERGEN FLAGS (on ingredients)
create table allergen_flags (
  id uuid primary key default uuid_generate_v4(),
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  allergen text not null
);

-- MENU ITEM ALLERGENS (auto-compiled from recipe)
create table menu_item_allergens (
  id uuid primary key default uuid_generate_v4(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  allergen text not null
);

-- VENDORS
create table vendors (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  rep_name text,
  phone text,
  email text,
  delivery_days text,
  payment_terms text,
  min_order float
);

-- VENDOR ORDERS
create table vendor_orders (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete cascade,
  status text not null default 'draft',
  total_cost float,
  ordered_at timestamptz,
  delivered_at timestamptz
);

-- VENDOR ORDER LINES
create table vendor_order_lines (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references vendor_orders(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  quantity_ordered float not null,
  unit_cost float not null,
  quantity_received float
);

-- PRICE HISTORY
create table price_history (
  id uuid primary key default uuid_generate_v4(),
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete set null,
  unit_cost float not null,
  recorded_at timestamptz not null default now()
);

-- WASTE LOGS
create table waste_logs (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete set null,
  quantity float not null,
  unit text not null,
  reason text,
  notes text,
  logged_at timestamptz not null default now()
);

-- SALES DATA
create table sales_data (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  source text not null default 'manual',
  external_id text,
  total_revenue float,
  sale_date timestamptz not null default now()
);

-- SALE LINE ITEMS
create table sale_line_items (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid not null references sales_data(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  quantity int not null,
  unit_price float not null
);

-- INVENTORY COUNTS
create table inventory_counts (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  quantity_counted float not null,
  counted_by text,
  counted_at timestamptz not null default now()
);

-- EVENTS
create table events (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  type text,
  event_date date not null,
  notes text
);

-- Enable RLS on all tables
alter table restaurants enable row level security;
alter table users enable row level security;
alter table ingredients enable row level security;
alter table menu_items enable row level security;
alter table recipe_lines enable row level security;
alter table allergen_flags enable row level security;
alter table menu_item_allergens enable row level security;
alter table vendors enable row level security;
alter table vendor_orders enable row level security;
alter table vendor_order_lines enable row level security;
alter table price_history enable row level security;
alter table waste_logs enable row level security;
alter table sales_data enable row level security;
alter table sale_line_items enable row level security;
alter table inventory_counts enable row level security;
alter table events enable row level security;