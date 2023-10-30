import { atom } from "recoil";

const now = new Date().toLocaleDateString();

export const overDateFlagAtom = atom<boolean>({
    key: "over-date-flag",
    default: false,
});

export const overDateAtom = atom<string>({
    key: "over-date-string",
    default: now
});