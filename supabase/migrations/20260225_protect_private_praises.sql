-- Protect private praises from being viewed by everyone
drop policy if exists "Praises are viewable by everyone." on public.praises;

create policy "Praises are viewable by everyone." on public.praises
  for select using (
    exists (
      select 1 from public.users u
      where u.id = receiver_id
        and (u.is_public = true OR u.id = (select auth.uid()))
    )
  );
