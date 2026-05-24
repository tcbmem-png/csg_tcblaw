CREATE TABLE IF NOT EXISTS public.checkout_rate_limits (
  ip text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0
);

ALTER TABLE public.checkout_rate_limits ENABLE ROW LEVEL SECURITY;

-- No client access — service role only (RLS denies all by default with no policies).

CREATE INDEX IF NOT EXISTS checkout_rate_limits_window_idx
  ON public.checkout_rate_limits (window_start);