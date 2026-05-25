CREATE TABLE public.beta_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  state text NOT NULL CHECK (state IN ('TN','MS')),
  matter_name text,
  worksheet_hash text,
  order_id uuid,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_beta_leads_email ON public.beta_leads (email);
CREATE INDEX idx_beta_leads_created_at ON public.beta_leads (created_at DESC);
CREATE UNIQUE INDEX uq_beta_leads_email_hash ON public.beta_leads (email, worksheet_hash);

ALTER TABLE public.beta_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "no client read" ON public.beta_leads FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "no client insert" ON public.beta_leads FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "no client update" ON public.beta_leads FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "no client delete" ON public.beta_leads FOR DELETE TO anon, authenticated USING (false);