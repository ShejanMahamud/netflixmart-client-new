import { create } from "zustand";

const leftbarVisibility = create((set) => ({
  leftbarVisible: false,
  setLeftbarVisible: (visible) => set({ leftbarVisible: visible }),
}));

export default leftbarVisibility;
