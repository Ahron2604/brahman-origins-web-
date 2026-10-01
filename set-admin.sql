-- =============================================================================
-- SET ADMIN ROLE
-- Replace the UUID below with the one from Dashboard → Authentication → Users
-- Then run this file alone in SQL Editor → New query
-- =============================================================================

do $$
declare
  raw_id    text := '5eab0237-e27f-4d31-9555-e21f49b73fef';   -- ← paste UUID here, keep the quotes
  admin_uid uuid;
begin
  begin
    admin_uid := raw_id::uuid;
  exception when invalid_text_representation then
    raise exception 'Invalid UUID: "%". Copy it from Dashboard → Authentication → Users.', raw_id;
  end;

  insert into public.profiles (id, role, display_name)
  values (admin_uid, 'admin', 'System Administrator')
  on conflict (id) do update
    set role         = 'admin',
        display_name = 'System Administrator';

  raise notice 'Done — admin role granted to %', admin_uid;
end;
$$;
