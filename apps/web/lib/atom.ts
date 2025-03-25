import { atom } from 'jotai';

export interface ILoaclCard {
    key: number;
    original_text: string;
    context_url: string;
}

export const localCardListAtom = atom<ILoaclCard[]>([]);

export const cardIdAtom = atom<string>("");