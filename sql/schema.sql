-- Ejecutar en Supabase > SQL Editor

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  phone_number text unique not null,
  name text,
  created_at timestamptz default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('income', 'expense')),
  unique (name, type)
);

create table if not exists movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  category_id uuid references categories(id),
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  description text,
  created_at timestamptz default now()
);

-- Categorías base para arrancar
insert into categories (name, type) values
  ('comida', 'expense'),
  ('transporte', 'expense'),
  ('servicios', 'expense'),
  ('entretenimiento', 'expense'),
  ('salud', 'expense'),
  ('otros', 'expense'),
  ('sueldo', 'income'),
  ('freelance', 'income'),
  ('otros', 'income')
on conflict do nothing;

create index if not exists idx_movements_user_date on movements (user_id, created_at);
