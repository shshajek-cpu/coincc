import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Trade, Holding, DashboardSummary, User } from '@/types'

interface AppState {
  // User
  user: User | null
  setUser: (user: User | null) => void

  // Trades
  trades: Trade[]
  setTrades: (trades: Trade[]) => void
  addTrade: (trade: Trade) => void
  updateTrade: (id: string, trade: Partial<Trade>) => void
  deleteTrade: (id: string) => void

  // Holdings
  holdings: Holding[]
  setHoldings: (holdings: Holding[]) => void
  updateHolding: (id: string, holding: Partial<Holding>) => void

  // Dashboard
  dashboardSummary: DashboardSummary | null
  setDashboardSummary: (summary: DashboardSummary) => void

  // UI State
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Filters
  tradeFilter: {
    type: 'all' | 'BUY' | 'SELL'
    exchange: string
    dateRange: { from: Date | null; to: Date | null }
  }
  setTradeFilter: (filter: Partial<AppState['tradeFilter']>) => void
  resetTradeFilter: () => void
}

const defaultTradeFilter = {
  type: 'all' as const,
  exchange: 'all',
  dateRange: { from: null, to: null },
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),

      // Trades
      trades: [],
      setTrades: (trades) => set({ trades }),
      addTrade: (trade) => set((state) => ({ trades: [trade, ...state.trades] })),
      updateTrade: (id, tradeUpdate) =>
        set((state) => ({
          trades: state.trades.map((t) =>
            t.id === id ? { ...t, ...tradeUpdate } : t
          ),
        })),
      deleteTrade: (id) =>
        set((state) => ({
          trades: state.trades.filter((t) => t.id !== id),
        })),

      // Holdings
      holdings: [],
      setHoldings: (holdings) => set({ holdings }),
      updateHolding: (id, holdingUpdate) =>
        set((state) => ({
          holdings: state.holdings.map((h) =>
            h.id === id ? { ...h, ...holdingUpdate } : h
          ),
        })),

      // Dashboard
      dashboardSummary: null,
      setDashboardSummary: (summary) => set({ dashboardSummary: summary }),

      // UI State
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Filters
      tradeFilter: defaultTradeFilter,
      setTradeFilter: (filter) =>
        set((state) => ({
          tradeFilter: { ...state.tradeFilter, ...filter },
        })),
      resetTradeFilter: () => set({ tradeFilter: defaultTradeFilter }),
    }),
    {
      name: 'coincc-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        tradeFilter: state.tradeFilter,
      }),
    }
  )
)

// Selectors
export const selectUser = (state: AppState) => state.user
export const selectTrades = (state: AppState) => state.trades
export const selectHoldings = (state: AppState) => state.holdings
export const selectDashboardSummary = (state: AppState) => state.dashboardSummary
export const selectTradeFilter = (state: AppState) => state.tradeFilter
