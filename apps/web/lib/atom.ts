import { ContextContent } from '@/components/input-box';
import { atom } from 'jotai';

export interface ILoaclCard {
    key: number;
    original_text: string;
    context_url: string;
    contextContent: ContextContent | null;
}

export type LocalCardListState = 'idle' | 'adding' | 'added';

export interface ILocalCardState {
    state: LocalCardListState;
    localCardList: ILoaclCard[];
}

export const localCardAtom = atom<ILocalCardState>({
    state: 'idle',
    localCardList: []
});

export const cardIdAtom = atom<string>("");