# Manually approve a creator (launch process)

1. Run `002_member_creator_accounts.sql` in Supabase SQL Editor.
2. Make yourself admin (replace email):

```sql
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'you@example.com');
```

3. Find pending application:

```sql
select id, user_id, display_name, created_at
from public.creator_applications
where status = 'pending';
```

4. Approve (as admin, in SQL editor while logged in as admin via service role, or call from app later):

```sql
select public.approve_creator_application('APPLICATION_UUID_HERE');
```

5. Creator creates community row in Studio (or insert manually), then can publish public challenges.
