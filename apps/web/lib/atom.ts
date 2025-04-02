import { ContextContent } from '@/components/input-box';
import { atom } from 'jotai';

export interface ILoaclCard {
    key: number;
    original_text: string;
    context_url: string;
    contextContent: ContextContent | null;
}

export const localCardListAtom = atom<ILoaclCard[]>([]);

export const cardIdAtom = atom<string>("");