// store.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

const usersStore = create(
  persist(
    (set) => ({
      user: {
        _id: null,
        name: "",
        username: "",
        profile_picture: "",
      },
      setUser: (userData) => set({ user: userData }),
      conversations: [],
      addConversation: (newMessage) =>
        set((state) => ({
          conversations: [...state.conversations, newMessage],
        })),
    }),
    {
      name: "users-store", // Key for localStorage
      getStorage: () => localStorage, // Optional: Use sessionStorage or localStorage
    }
  )
);

export default usersStore;
