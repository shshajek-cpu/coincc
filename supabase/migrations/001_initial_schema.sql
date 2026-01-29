-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{"notifications": {"dailyLoss": true, "monthlyLoss": true, "targetProfit": false}, "theme": "dark", "currency": "KRW"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Trade type enum
CREATE TYPE trade_type AS ENUM ('BUY', 'SELL');

-- Trades table
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coin_symbol TEXT NOT NULL,
  trade_type trade_type NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 2) NOT NULL,
  total_amount DECIMAL(20, 2) NOT NULL,
  fee DECIMAL(20, 2) DEFAULT 0,
  exchange TEXT DEFAULT '업비트',
  trade_at TIMESTAMP WITH TIME ZONE NOT NULL,
  memo TEXT,
  emotion INTEGER CHECK (emotion >= 1 AND emotion <= 5),
  strategy TEXT,
  screenshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Holdings table
CREATE TABLE IF NOT EXISTS public.holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coin_symbol TEXT NOT NULL,
  avg_price DECIMAL(20, 2) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  total_invested DECIMAL(20, 2) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, coin_symbol)
);

-- Daily stats table
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_asset DECIMAL(20, 2) DEFAULT 0,
  realized_pnl DECIMAL(20, 2) DEFAULT 0,
  unrealized_pnl DECIMAL(20, 2) DEFAULT 0,
  trade_count INTEGER DEFAULT 0,
  win_count INTEGER DEFAULT 0,
  loss_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Trade rules table
CREATE TABLE IF NOT EXISTS public.trade_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rule_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  order_num INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Alert type enum
CREATE TYPE alert_type AS ENUM ('DAILY_LOSS', 'MONTHLY_LOSS', 'TARGET_PROFIT');

-- Alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  alert_type alert_type NOT NULL,
  threshold DECIMAL(20, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, alert_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_trade_at ON public.trades(trade_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_coin_symbol ON public.trades(coin_symbol);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON public.holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.daily_stats(user_id, date DESC);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for trades table
CREATE POLICY "Users can view own trades" ON public.trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trades" ON public.trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON public.trades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades" ON public.trades
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for holdings table
CREATE POLICY "Users can view own holdings" ON public.holdings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own holdings" ON public.holdings
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for daily_stats table
CREATE POLICY "Users can view own stats" ON public.daily_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own stats" ON public.daily_stats
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for trade_rules table
CREATE POLICY "Users can view own rules" ON public.trade_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own rules" ON public.trade_rules
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for alerts table
CREATE POLICY "Users can view own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own alerts" ON public.alerts
  FOR ALL USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update holdings after trade
CREATE OR REPLACE FUNCTION public.update_holdings_after_trade()
RETURNS TRIGGER AS $$
DECLARE
  existing_holding public.holdings%ROWTYPE;
  new_quantity DECIMAL(20, 8);
  new_total_invested DECIMAL(20, 2);
  new_avg_price DECIMAL(20, 2);
BEGIN
  -- Get existing holding
  SELECT * INTO existing_holding
  FROM public.holdings
  WHERE user_id = NEW.user_id AND coin_symbol = NEW.coin_symbol;

  IF NEW.trade_type = 'BUY' THEN
    IF existing_holding IS NOT NULL THEN
      -- Update existing holding
      new_quantity := existing_holding.quantity + NEW.quantity;
      new_total_invested := existing_holding.total_invested + NEW.total_amount;
      new_avg_price := new_total_invested / new_quantity;

      UPDATE public.holdings
      SET quantity = new_quantity,
          total_invested = new_total_invested,
          avg_price = new_avg_price,
          updated_at = NOW()
      WHERE id = existing_holding.id;
    ELSE
      -- Create new holding
      INSERT INTO public.holdings (user_id, coin_symbol, avg_price, quantity, total_invested)
      VALUES (NEW.user_id, NEW.coin_symbol, NEW.price, NEW.quantity, NEW.total_amount);
    END IF;
  ELSIF NEW.trade_type = 'SELL' THEN
    IF existing_holding IS NOT NULL THEN
      new_quantity := existing_holding.quantity - NEW.quantity;

      IF new_quantity <= 0 THEN
        -- Remove holding if sold all
        DELETE FROM public.holdings WHERE id = existing_holding.id;
      ELSE
        -- Update remaining holding
        new_total_invested := existing_holding.avg_price * new_quantity;

        UPDATE public.holdings
        SET quantity = new_quantity,
            total_invested = new_total_invested,
            updated_at = NOW()
        WHERE id = existing_holding.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update holdings
DROP TRIGGER IF EXISTS on_trade_created ON public.trades;
CREATE TRIGGER on_trade_created
  AFTER INSERT ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.update_holdings_after_trade();

-- Function to update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
