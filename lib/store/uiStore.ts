import { create } from 'zustand';

interface UIState {
  selectedMonth: string; // 'YYYY-MM'
  setSelectedMonth: (month: string) => void;
}

const currentMonth = () => new Date().toISOString().slice(0, 7);

export const useUIStore = create<UIState>((set) => ({
  selectedMonth: currentMonth(),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
}));
