import { convertQwertyToHangul, disassemble } from 'es-hangul';
import { BIBLE_BOOK_METADATA } from './bibleData';

type BibleBookMeta = (typeof BIBLE_BOOK_METADATA)[number];

const normalize = (value: string) => value.trim();
const normalizeLower = (value: string) => normalize(value).toLowerCase();

const toHangulInput = (value: string) => {
  try {
    return convertQwertyToHangul(value);
  } catch {
    return value;
  }
};

const hangulIncludes = (target: string, searchTerm: string) => {
  if (!target || !searchTerm) return false;

  try {
    const targetParts = disassemble(target).replace(/\s/g, '');
    const searchParts = disassemble(searchTerm).replace(/\s/g, '');
    return targetParts.includes(searchParts);
  } catch {
    return false;
  }
};

export const searchBooks = (input: string): BibleBookMeta[] => {
  if (!input || input.trim() === '') return [];

  const trimmedInput = normalize(input);
  const lowerInput = normalizeLower(input);
  const convertedInput = toHangulInput(trimmedInput);

  return BIBLE_BOOK_METADATA.filter((book) =>
    hangulIncludes(book.name, trimmedInput) ||
    hangulIncludes(book.name, convertedInput) ||
    hangulIncludes(book.abbr, trimmedInput) ||
    hangulIncludes(book.abbr, convertedInput) ||
    book.enName.toLowerCase().includes(lowerInput) ||
    book.enAbbr.toLowerCase().includes(lowerInput)
  );
};

export const getExactBook = (input: string): BibleBookMeta | null => {
  if (!input || input.trim() === '') return null;

  const trimmedInput = normalize(input);
  const lowerInput = normalizeLower(input);
  const convertedInput = toHangulInput(trimmedInput);

  return BIBLE_BOOK_METADATA.find((book) =>
    book.name === trimmedInput ||
    book.name === convertedInput ||
    book.abbr === trimmedInput ||
    book.abbr === convertedInput ||
    book.enName.toLowerCase() === lowerInput ||
    book.enAbbr.toLowerCase() === lowerInput
  ) || null;
};

export const isExactMatch = (input: string) => Boolean(getExactBook(input));

export const shouldShowDropdown = (input: string) => searchBooks(input).length > 0;

export const canProceedToNextField = (input: string, selectedIndex = -1) => {
  if (!input || input.trim() === '') return false;
  if (isExactMatch(input)) return true;

  const results = searchBooks(input);
  if (results.length === 1) return true;
  if (results.length > 1) return selectedIndex >= 0 && selectedIndex < results.length;

  return false;
};

export const getValidBookName = (input: string, selectedIndex = -1) => {
  if (!input || input.trim() === '') return null;

  const exactBook = getExactBook(input);
  if (exactBook) return exactBook.name;

  const results = searchBooks(input);
  if (results.length === 1) return results[0].name;
  if (results.length > 1 && selectedIndex >= 0 && selectedIndex < results.length) {
    return results[selectedIndex].name;
  }

  return null;
};

export const getDropdownItems = (input: string) => searchBooks(input);
