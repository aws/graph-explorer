import { atom } from "recoil";

export type OverDateFlag = {
    overDate: boolean;
};

export const overdateAtom = atom<boolean>({
    key: "over-date",
    default: false,
});