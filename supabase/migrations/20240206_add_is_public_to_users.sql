-- Add is_public column to users table
alter table public.users add column is_public boolean default true;
