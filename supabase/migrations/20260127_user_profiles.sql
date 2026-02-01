-- Create a table for public user profiles
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text default 'ENGINEER' check (role in ('ADMIN', 'ENGINEER', 'MANAGER', 'VIEWER')),
  organization text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.user_profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.user_profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.user_profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.user_profiles for update
  using ( auth.uid() = id );

-- Create a trigger to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    'ENGINEER' -- Default role
  );
  return new;
end;
$$;

-- Trigger checks
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
