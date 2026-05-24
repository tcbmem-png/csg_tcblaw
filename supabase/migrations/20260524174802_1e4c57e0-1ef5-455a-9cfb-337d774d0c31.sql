update public.orders
  set status = 'paid',
      pdf_official_storage_path = null,
      paid_at = now() - interval '6 minutes'
where id = 'e327a75f-c29e-42af-84c7-813af09181fa';