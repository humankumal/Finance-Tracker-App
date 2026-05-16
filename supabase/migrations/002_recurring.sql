-- Recurring transaction rules
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users NOT NULL,
  account_id     UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount         DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  type           TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description    TEXT,
  frequency      TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_due_date  DATE NOT NULL,
  last_run_date  DATE,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recurring"
  ON recurring_transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_recurring_user_due ON recurring_transactions (user_id, next_due_date)
  WHERE is_active = TRUE;
