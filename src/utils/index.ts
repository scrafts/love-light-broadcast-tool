import { HYMN_DATA } from '../data/hymnData';

export const getWeekday = (date: Date) => date.getDay(); // 0:Sun, 1:Mon, ..., 6:Sat

// YYYY.MM.DD 포맷
export const formatDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
};

// 찬송가 번호 -> 제목 역방향 매핑 생성 (모듈 로드 시 1회 실행)
const HYMN_NUMBER_TO_TITLE: { [key: number]: string } = {};
// 공백 제거 제목 -> 정식 제목 매핑 (띄어쓰기 무시 검색용)
const HYMN_NOSPACE_TO_TITLE: { [key: string]: string } = {};

Object.entries(HYMN_DATA).forEach(([title, numbers]) => {
  numbers.forEach(num => {
    HYMN_NUMBER_TO_TITLE[num] = title;
  });
  // 공백을 모두 제거한 키로도 조회 가능하게 등록
  HYMN_NOSPACE_TO_TITLE[title.replace(/\s/g, '')] = title;
});

// 번호로 제목 찾기 (미리보기용)
export const getHymnTitleByNumber = (numStr: string): string | null => {
  const num = parseInt(numStr, 10);
  if (isNaN(num)) return null;
  return HYMN_NUMBER_TO_TITLE[num] || null;
};

// 제목으로 HYMN_DATA 번호 배열 찾기 (띄어쓰기 무시)
export const findHymnByTitle = (input: string): { title: string; numbers: number[] } | null => {
  const trimmed = input.trim();
  // 1순위: 정확히 일치
  if (HYMN_DATA[trimmed]) return { title: trimmed, numbers: HYMN_DATA[trimmed] };
  // 2순위: 공백 제거 후 일치
  const noSpace = trimmed.replace(/\s/g, '');
  const matchedTitle = HYMN_NOSPACE_TO_TITLE[noSpace];
  if (matchedTitle) return { title: matchedTitle, numbers: HYMN_DATA[matchedTitle] };
  return null;
};


// 찬양 제목 포맷팅 함수
export const formatSongTitle = (title: string): string => {
  if (!title) return "";
  const trimmedTitle = title.trim();

  // 이미 변환되었거나 포맷팅된 경우 건너뜀
  if (trimmedTitle.includes('(새찬송가')) return title;

  // 0. 숫자만 입력된 경우 (번호로 찾기)
  if (/^\d+$/.test(trimmedTitle)) {
    const num = parseInt(trimmedTitle, 10);
    const foundTitle = HYMN_NUMBER_TO_TITLE[num];
    if (foundTitle) {
      return `${foundTitle} (새찬송가 ${num}장)`;
    }
  }

  // 1. 새찬송가 DB 조회 (띄어쓰기 무시 포함)
  const hymnMatch = findHymnByTitle(trimmedTitle);
  if (hymnMatch) {
    const { title: officialTitle, numbers } = hymnMatch;
    if (numbers.length === 1) {
      return `${officialTitle} (새찬송가 ${numbers[0]}장)`;
    }
    // 장수가 여러 개면 변환하지 않음
    return title;
  }

  const parts = trimmedTitle.split(' ');
  if (parts.length < 2) return title;

  const lastPart = parts[parts.length - 1];
  // 2. 마지막 부분이 숫자인 경우 (기존 방식: 수동 입력 '제목 123')
  if (/^\d+$/.test(lastPart)) {
    const base = parts.slice(0, -1).join(' ');
    return `${base} (새찬송가 ${lastPart}장)`;
  }

  return title;
};

// 마무리 찬양 포맷팅 (특수문자 처리 - 호환성 유지)
export const formatClosingSong = (input: string): string => {
  if (input === '!') return '사랑찬양단';
  if (input.endsWith('!')) {
    return `${input.slice(0, -1).trim()} 사랑찬양단`;
  }
  return formatSongTitle(input);
};
