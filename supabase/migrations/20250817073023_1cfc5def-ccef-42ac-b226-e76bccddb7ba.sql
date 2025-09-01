
-- 1) Ensure each user has at most one security settings row
create unique index if not exists security_settings_user_id_uidx
  on public.security_settings(user_id);

-- 2) Set a default for backup codes to avoid nulls on new rows
alter table public.security_settings
  alter column two_factor_backup_codes set default '{}';

-- 3) Safety no-op for environments missing this column (your env already has it)
alter table public.security_settings
  add column if not exists two_factor_verified boolean default false;
