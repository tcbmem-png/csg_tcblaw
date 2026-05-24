-- Explicit deny-by-default policies so the linter sees that browser access is
-- intentionally locked down. Service role bypasses RLS, so server functions
-- continue to work normally.
create policy "no client read"   on public.orders for select  to anon, authenticated using (false);
create policy "no client insert" on public.orders for insert  to anon, authenticated with check (false);
create policy "no client update" on public.orders for update  to anon, authenticated using (false) with check (false);
create policy "no client delete" on public.orders for delete  to anon, authenticated using (false);