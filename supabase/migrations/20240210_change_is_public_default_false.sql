-- Change default value of is_public to false
ALTER TABLE public.users ALTER COLUMN is_public SET DEFAULT false;
