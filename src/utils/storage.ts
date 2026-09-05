import { GameDatabase, HeadsUpItem, ImposterWord, WheelCategory } from '../types';
import { DEFAULT_HEADS_UP_ITEMS, DEFAULT_IMPOSTER_WORDS, DEFAULT_WHEEL_CATEGORIES } from './defaultData';

const STORAGE_KEY = 'tableplay_restaurant_games_v1';

export const DEFAULT_TABLES: string[] = [
  'Table 1',
  'Table 2',
  'Table 3',
  'Table 4',
  'Table 5',
  'Table 6',
  'Table 7',
  'Table 8',
  'Patio 1',
  'Patio 2',
  'Bar 1',
];

export function loadGameDatabase(): GameDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        headsUpItems: DEFAULT_HEADS_UP_ITEMS,
        imposterWords: DEFAULT_IMPOSTER_WORDS,
        wheelCategories: DEFAULT_WHEEL_CATEGORIES,
        tables: DEFAULT_TABLES,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      headsUpItems: Array.isArray(parsed.headsUpItems) && parsed.headsUpItems.length > 0 ? parsed.headsUpItems : DEFAULT_HEADS_UP_ITEMS,
      imposterWords: Array.isArray(parsed.imposterWords) && parsed.imposterWords.length > 0 ? parsed.imposterWords : DEFAULT_IMPOSTER_WORDS,
      wheelCategories: Array.isArray(parsed.wheelCategories) && parsed.wheelCategories.length > 0 ? parsed.wheelCategories : DEFAULT_WHEEL_CATEGORIES,
      tables: Array.isArray(parsed.tables) && parsed.tables.length > 0 ? parsed.tables : DEFAULT_TABLES,
    };
  } catch {
    return {
      headsUpItems: DEFAULT_HEADS_UP_ITEMS,
      imposterWords: DEFAULT_IMPOSTER_WORDS,
      wheelCategories: DEFAULT_WHEEL_CATEGORIES,
      tables: DEFAULT_TABLES,
    };
  }
}

export function saveGameDatabase(db: GameDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Failed to save to local storage', err);
  }
}

export function resetGameDatabase(): GameDatabase {
  const initial: GameDatabase = {
    headsUpItems: DEFAULT_HEADS_UP_ITEMS,
    imposterWords: DEFAULT_IMPOSTER_WORDS,
    wheelCategories: DEFAULT_WHEEL_CATEGORIES,
    tables: DEFAULT_TABLES,
  };
  saveGameDatabase(initial);
  return initial;
}
