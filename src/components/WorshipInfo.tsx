import React, { useState, useEffect, useRef } from 'react';
import { BIBLE_STRUCTURE } from '../data/bibleData';
import { canProceedToNextField, getDropdownItems, getValidBookName, shouldShowDropdown } from '../data/bibleSearch';

interface Passage {
  book: string;
  chapter: string | number;
  verseStart: string | number;
  verseEnd: string | number;
}

interface WorshipInfoProps {
  title: string;
  setTitle: (val: string) => void;
  leaderSelection: string;
  setLeaderSelection: (val: string) => void;
  leaderCustom: string;
  setLeaderCustom: (val: string) => void;
  passages: Passage[];
  setPassages: React.Dispatch<React.SetStateAction<Passage[]>>;
  date: Date;
  setDate: (val: Date) => void;
  worshipTypeSelection: string;
  setWorshipTypeSelection: (val: string) => void;
  worshipTypeCustom: string;
  setWorshipTypeCustom: (val: string) => void;
}

const BibleBookSearch: React.FC<{
  value: string;
  onSelect: (book: string) => void;
}> = ({ value, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const results = getDropdownItems(searchTerm);

  useEffect(() => {
    setSelectedIndex(results.length === 1 ? 0 : -1);
  }, [searchTerm, results.length]);

  const commitSelection = (nextIndex = selectedIndex) => {
    if (!canProceedToNextField(searchTerm, nextIndex)) return false;

    const validBookName = getValidBookName(searchTerm, nextIndex);
    if (!validBookName) return false;

    setSearchTerm(validBookName);
    onSelect(validBookName);
    setShowResults(false);
    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      setShowResults(true);
      setSelectedIndex(prev => (prev + 1) % results.length);
      return;
    }

    if (e.key === 'ArrowUp' && results.length > 0) {
      e.preventDefault();
      setShowResults(true);
      setSelectedIndex(prev => (prev <= 0 ? results.length - 1 : prev - 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      commitSelection();
      return;
    }

    if (e.key === 'Tab') {
      if (!commitSelection() && searchTerm.trim() !== '') {
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => {
          commitSelection();
          setShowResults(false);
        }, 200)}
        placeholder="책 이름 또는 약어"
      />
      {showResults && shouldShowDropdown(searchTerm) && (
        <ul className="search-results-dropdown">
          {results.map((b, index) => (
            <li
              key={b.name}
              className={index === selectedIndex ? 'selected' : undefined}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => {
                setSearchTerm(b.name);
                onSelect(b.name);
                setShowResults(false);
              }}
            >
              {b.name} ({b.abbr})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const WorshipInfo: React.FC<WorshipInfoProps> = ({
  title, setTitle,
  leaderSelection, setLeaderSelection,
  leaderCustom, setLeaderCustom,
  passages, setPassages,
  date, setDate,
  worshipTypeSelection, setWorshipTypeSelection,
  worshipTypeCustom, setWorshipTypeCustom
}) => {
  const [errors, setErrors] = useState<{ [key: number]: string }>({});
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
  const isMetadataEditable = isMetadataExpanded;

  const dateValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const [year, month, day] = val.split('-').map(Number);
    setDate(new Date(year, month - 1, day));
  };

  const updatePassage = (index: number, updates: Partial<Passage>) => {
    const newPassages = [...passages];
    newPassages[index] = { ...newPassages[index], ...updates };
    setPassages(newPassages);
  };

  const digitsOnly = (value: string) => value.replace(/\D/g, '');

  const getMaxVerses = (passage: Passage) => {
    const chapter = Number(passage.chapter);
    return BIBLE_STRUCTURE[passage.book]?.[chapter - 1] || 0;
  };

  const handleVerseStartChange = (index: number, value: string) => {
    const numericValue = digitsOnly(value);
    const maxVerses = getMaxVerses(passages[index]);
    const verseStart = Number(numericValue);
    const nextValue = maxVerses > 0 && Number.isFinite(verseStart) && verseStart > maxVerses
      ? maxVerses
      : numericValue;

    updatePassage(index, {
      verseStart: nextValue,
      verseEnd: nextValue
    });
  };

  const handleVerseEndChange = (index: number, value: string) => {
    const numericValue = digitsOnly(value);
    const maxVerses = getMaxVerses(passages[index]);
    const verseEnd = Number(numericValue);

    if (maxVerses > 0 && Number.isFinite(verseEnd) && verseEnd > maxVerses) {
      updatePassage(index, { verseEnd: maxVerses });
      return;
    }

    updatePassage(index, { verseEnd: numericValue });
  };

  const addPassage = () => {
    const lastPassage = passages[passages.length - 1];
    setPassages([...passages, { ...lastPassage }]);
  };

  const removePassage = (index: number) => {
    if (passages.length > 1) {
      setPassages(passages.filter((_, i) => i !== index));
    }
  };

  const validatePassage = (index: number) => {
    const p = passages[index];
    const maxChapters = BIBLE_STRUCTURE[p.book]?.length || 0;
    const chapter = Number(p.chapter);
    const vStart = Number(p.verseStart);
    const vEnd = Number(p.verseEnd);

    if (!p.book || !BIBLE_STRUCTURE[p.book]) return "유효한 성경 책을 선택하세요.";
    if (chapter < 1 || chapter > maxChapters) return `존재하지 않는 장입니다. (최대 ${maxChapters}장)`;

    const maxVerses = BIBLE_STRUCTURE[p.book][chapter - 1];
    if (vStart < 1 || vStart > maxVerses) return `시작 절이 범위를 벗어났습니다. (최대 ${maxVerses}절)`;

    // 끝 절이 있고 시작 절과 다를 때만 유효성 검사 (단일 절이면 pass)
    if (p.verseEnd && vStart !== vEnd) {
      if (vEnd < vStart || vEnd > maxVerses) return "끝 절이 시작 절보다 작거나 범위를 벗어났습니다.";
    }

    return "";
  };

  const handleBlur = (index: number) => {
    const error = validatePassage(index);
    setErrors(prev => ({ ...prev, [index]: error }));
  };

  return (
    <section className="glass-card">
      <h2 className="section-title">예배 정보</h2>

      <div className="input-group">
        <label className="input-label">말씀 제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
        />
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <div className="flex justify-end items-center mb-2">
          <button onClick={addPassage} className="btn btn-secondary text-xs" style={{ padding: '4px 8px' }}>+ 본문 추가</button>
        </div>

        {passages.map((p, idx) => (
          <div key={idx} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: idx < passages.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
            <div className="input-group grid-cols-5 items-end">
              <div>
                <label className="input-label">본문(책)</label>
                <BibleBookSearch value={p.book} onSelect={(book) => updatePassage(idx, { book })} />
              </div>
              <div>
                <label className="input-label">장</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={p.chapter}
                  onChange={(e) => updatePassage(idx, { chapter: digitsOnly(e.target.value) })}
                  onBlur={() => handleBlur(idx)}
                />
              </div>
              <div>
                <label className="input-label">시작 절</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={p.verseStart}
                  onChange={(e) => handleVerseStartChange(idx, e.target.value)}
                  onBlur={() => handleBlur(idx)}
                />
              </div>
              <div>
                <label className="input-label">끝 절</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={p.verseEnd}
                  onChange={(e) => handleVerseEndChange(idx, e.target.value)}
                  onBlur={() => handleBlur(idx)}
                  placeholder={String(p.verseStart)}
                />
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => removePassage(idx)}
                  className="btn btn-icon"
                  style={{ opacity: passages.length > 1 ? 1 : 0.3, visibility: passages.length > 1 ? 'visible' : 'hidden' }}
                  title="삭제"
                >
                  ✕
                </button>
              </div>
            </div>
            {errors[idx] && <p className="text-error mt-1" style={{ fontSize: '11px', color: '#ff6b6b' }}>{errors[idx]}</p>}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-2 mt-4">
        <label className="input-label" style={{ marginBottom: 0 }}>기본 예배 정보</label>
        <button
          onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
          className="btn btn-secondary text-xs"
          style={{ padding: '4px 8px' }}
        >
          {isMetadataExpanded ? '접기' : '펼치기'}
        </button>
      </div>

      {isMetadataExpanded && (
      <div className="input-group grid-cols-3">
        <div>
          <label className="input-label">인도자</label>
          <div className="flex flex-column gap-2">
            <select
              value={leaderSelection}
              onChange={(e) => setLeaderSelection(e.target.value)}
              style={{ flex: 1, minWidth: 0, cursor: isMetadataEditable ? 'default' : 'not-allowed' }}
              disabled={!isMetadataEditable}
            >
              <option value="송윤명 목사">송윤명 목사</option>
              <option value="김성연 목사">김성연 목사</option>
              <option value="기타">기타</option>
            </select>
            <input
              type="text"
              value={leaderCustom}
              onChange={(e) => setLeaderCustom(e.target.value)}
              placeholder="이름"
              disabled={!isMetadataEditable || leaderSelection !== '기타'}
              style={{
                flex: 1,
                minWidth: 0,
                display: leaderSelection !== '기타' ? 'none' : 'block'
              }}
            />
          </div>
        </div>

        <div>
          <label className="input-label">날짜</label>
          <input
            type="date"
            value={dateValue}
            onChange={handleDateChange}
            disabled={!isMetadataEditable}
            style={{ cursor: isMetadataEditable ? 'default' : 'not-allowed' }}
          />
        </div>

        <div>
          <label className="input-label">예배 형태</label>
          <div className="flex flex-column gap-2">
            <select
              value={worshipTypeSelection}
              onChange={(e) => setWorshipTypeSelection(e.target.value)}
              style={{ flex: 1, minWidth: 0, cursor: isMetadataEditable ? 'default' : 'not-allowed' }}
              disabled={!isMetadataEditable}
            >
              <option value="주일예배">주일예배</option>
              <option value="수요예배">수요예배</option>
              <option value="금요예배">금요예배</option>
              <option value="기타">기타</option>
            </select>
            <input
              type="text"
              value={worshipTypeCustom}
              onChange={(e) => setWorshipTypeCustom(e.target.value)}
              placeholder="입력"
              disabled={!isMetadataEditable || worshipTypeSelection !== '기타'}
              style={{
                flex: 1,
                minWidth: 0,
                display: worshipTypeSelection !== '기타' ? 'none' : 'block'
              }}
            />
          </div>
        </div>
      </div>
      )}
    </section>
  );
};
