-- Update is_public column on users table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_public') THEN
    ALTER TABLE public.users ADD COLUMN is_public boolean DEFAULT true;
  END IF;
END $$;

UPDATE public.users SET is_public = true WHERE is_public IS NULL;
ALTER TABLE public.users ALTER COLUMN is_public SET DEFAULT true;
ALTER TABLE public.users ALTER COLUMN is_public SET NOT NULL;
