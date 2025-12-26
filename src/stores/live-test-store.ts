import { create } from 'zustand'

interface LiveTestStore {
  // Is any live test currently active?
  isLiveTestActive: boolean
  setLiveTestActive: (active: boolean) => void
  
  // Active test info
  activeTestTitle: string | null
  setActiveTestTitle: (title: string | null) => void
  
  // Tab to navigate to
  targetTab: 'personal' | 'group' | null
  setTargetTab: (tab: 'personal' | 'group' | null) => void
}

export const useLiveTestStore = create<LiveTestStore>((set) => ({
  isLiveTestActive: false,
  setLiveTestActive: (active) => set({ isLiveTestActive: active }),
  
  activeTestTitle: null,
  setActiveTestTitle: (title) => set({ activeTestTitle: title }),
  
  targetTab: null,
  setTargetTab: (tab) => set({ targetTab: tab }),
}))
