import React, { useRef, useEffect } from 'react';
import { getHymnTitleByNumber, findHymnByTitle } from '../utils';

interface SongListProps {
  songs: string[];
  forcedNonHymnSongs: boolean[];
  onSongChange: (index: number, value: string) => void;
  onForceNonHymnChange: (index: number, value: boolean) => void;
  onAddSong: (index?: number) => void;
  onRemoveSong: (index: number) => void;
}

export const SongList: React.FC<SongListProps> = ({
  songs,
  forcedNonHymnSongs,
  onSongChange,
  onForceNonHymnChange,
  onAddSong,
  onRemoveSong
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const prevLengthRef = useRef(songs.length);
  const focusIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (songs.length > prevLengthRef.current) {
      // 추가된 위치로 포커스 이동 (지정된 인덱스가 있으면 거기, 없으면 마지막)
      const targetIndex = focusIndexRef.current !== null ? focusIndexRef.current : songs.length - 1;
      inputRefs.current[targetIndex]?.focus();
      focusIndexRef.current = null;
    }
    prevLengthRef.current = songs.length;
  }, [songs.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === songs.length - 1) {
        onAddSong(); // 마지막이면 맨 뒤 추가
      } else {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleAddClick = (index: number) => {
    focusIndexRef.current = index + 1;
    onAddSong(index);
  };

  return (
    <section className="glass-card">
      <h2 className="section-title">찬양 목록</h2>
      <div style={{ marginBottom: '0', overflowY: 'auto' }}>
        {songs.map((song, idx) => {
          const trimmed = song.trim();
          const isForcedNonHymn = forcedNonHymnSongs[idx] ?? false;
          const hymnTitleByNumber = getHymnTitleByNumber(trimmed);
          const hymnMatch = findHymnByTitle(trimmed);
          const hasHymnCandidate = Boolean(hymnMatch || hymnTitleByNumber);
          const canForceNonHymn = Boolean(hymnMatch);
          const showDropdown = !isForcedNonHymn && hymnMatch && hymnMatch.numbers.length > 1 && !song.includes('(새찬송가');

          return (
            <div key={idx} className="mb-4">
              <div className="flex gap-2 items-center">
                <span style={{ color: 'var(--text-secondary)', width: '20px', fontSize: '13px', textAlign: 'right' }}>{idx + 1}.</span>
                <input
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  value={song}
                  onChange={(e) => onSongChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  placeholder="찬양 제목 또는 번호"
                  style={{ flex: 1 }}
                />
                {!isForcedNonHymn && hasHymnCandidate && (
                  <span style={{
                    fontStyle: 'italic',
                    color: '#94a3b8',
                    fontSize: '12px',
                    marginLeft: '4px',
                    whiteSpace: 'nowrap',
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    ({hymnMatch ? hymnMatch.numbers[0] : hymnTitleByNumber})
                  </span>
                )}
                {canForceNonHymn && (
                  <button
                    onClick={() => onForceNonHymnChange(idx, !isForcedNonHymn)}
                    className={`btn ${isForcedNonHymn ? 'btn-primary' : 'btn-secondary'}`}
                    title={isForcedNonHymn ? '찬송가 자동 변환 다시 사용' : '이 곡은 찬송가가 아니게 처리'}
                    style={{ padding: '0 10px', minWidth: '86px', height: '40px', fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    {isForcedNonHymn ? '찬송가 사용' : '찬송가 제외'}
                  </button>
                )}
                <button
                  onClick={() => handleAddClick(idx)}
                  className="btn btn-secondary"
                  title="이 줄 아래에 추가"
                  style={{ width: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  +
                </button>
                <button
                  onClick={() => onRemoveSong(idx)}
                  className="btn btn-icon"
                  style={{ width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="삭제"
                >
                  ✕
                </button>
              </div>
              {showDropdown && (
                <div style={{ marginTop: '8px', paddingLeft: '30px' }}>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        onSongChange(idx, `${trimmed} (새찬송가 ${val}장)`);
                      }
                    }}
                    defaultValue=""
                    style={{ width: '100%', borderColor: '#f59e0b', color: '#f59e0b' }}
                  >
                    <option value="" disabled>⚠️ 중복된 찬양입니다. 장수를 선택해주세요.</option>
                    {hymnMatch!.numbers.map(num => (
                      <option key={num} value={num}>{num}장</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
