-- Drop the old policy with the misleading name
drop policy if exists "Praises are viewable by everyone." on public.praises;

-- Recreate the same policy with a clearer name
create policy "Praises visibility policy" on public.praises
  for select using (
    exists (
      select 1 from public.users u
      where u.id = receiver_id
        and (u.is_public = true OR u.id = (select auth.uid()))
    )
  );
