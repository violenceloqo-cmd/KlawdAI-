-- Restrict theme to light/dark only; map legacy system → dark.
-- Add sans chat font option.

alter table public.profiles drop constraint if exists profiles_theme_check;
update public.profiles set theme = 'dark' where theme = 'system';
alter table public.profiles
  add constraint profiles_theme_check check (theme in ('light', 'dark'));
alter table public.profiles alter column theme set default 'dark';

alter table public.profiles drop constraint if exists profiles_chat_font_check;
alter table public.profiles
  add constraint profiles_chat_font_check
  check (chat_font in ('default', 'sans', 'system', 'dyslexic'));
