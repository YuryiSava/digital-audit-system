-- ============================================================================
-- 1. USER PROFILES
-- ============================================================================

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


-- ============================================================================
-- 2. PROJECT ASSIGNMENTS
-- ============================================================================

create table if not exists public.project_assignments (
  id uuid default gen_random_uuid() primary key,
  project_id text references public.projects(id) on delete cascade not null,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  role text default 'contributor', -- manager, contributor, viewer
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, user_id)
);

alter table public.project_assignments enable row level security;

-- Policies for project_assignments
create policy "Users can view their own assignments"
  on public.project_assignments for select
  using ( auth.uid() = user_id );

create policy "Admins/Managers can manage assignments"
  on public.project_assignments for all
  using ( 
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role in ('ADMIN', 'MANAGER')
    )
  );
