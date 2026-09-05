export type ActiveTab =
  | 'heads-up'
  | 'imposter'
  | 'spin-wheel'
  | 'snakes-ladders'
  | 'chess'
  | 'ludo'
  | 'fruit-snake'
  | 'flapping-bird'
  | 'manage';

export type GameCategory = 'all' | 'party' | 'family' | 'solo' | 'manage';

export interface Player {
  id: string;
  name: string;
  score: number;
}

export type HeadsUpCategory = 'movies' | 'characters' | 'animals' | 'food' | 'all';

export interface HeadsUpItem {
  id: string;
  text: string;
  category: 'movies' | 'characters' | 'animals' | 'food' | 'custom';
  hint?: string;
}

export interface ImposterWord {
  id: string;
  category: string;
  word: string;
  hintForImposter?: string;
}

export interface WheelCategory {
  id: string;
  name: string;
  color: string;
  iconName: string;
  questions: string[];
}

export interface GameDatabase {
  headsUpItems: HeadsUpItem[];
  imposterWords: ImposterWord[];
  wheelCategories: WheelCategory[];
  tables?: string[];
}
