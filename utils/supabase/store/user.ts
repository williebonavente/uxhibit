import { create } from "zustand";
// Might implement later as the application really grows!

// validation schema or something Zod? I don't even know!
type User = {
    id: string;
    name: string;
    email: string;
    age: number;
    // Insert here too the  avatar!!!
};

type UserStore = {
    user: User | null;
    setUser: (user: User | null) => void;
};
export const useUserStore = create<UserStore>((set) => ({
    user: null,
    setUser: (user) => set({ user })
}));