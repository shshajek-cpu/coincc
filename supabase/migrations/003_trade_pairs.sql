-- Add pair-related columns to trades
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS paired_trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS realized_pnl DECIMAL(20, 2);
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS pnl_percentage DECIMAL(10, 4);

-- Index for pair lookups
CREATE INDEX IF NOT EXISTS idx_trades_paired_trade_id ON public.trades(paired_trade_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_coin_type ON public.trades(user_id, coin_symbol, trade_type);
