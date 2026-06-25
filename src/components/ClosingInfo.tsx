import React from 'react';
import { getHymnTitleByNumber, findHymnByTitle } from '../utils';

interface ClosingInfoProps {
  isFriday: boolean;
  isSunday: boolean;
  closingSong: string;
  setClosingSong: (val: string) => void;
  isLovePraiseTeam: boolean;
  setIsLovePraiseTeam: (val: boolean) => void;
  isForcedNonHymn: boolean;
  setIsForcedNonHymn: (val: boolean) => void;
}

export const ClosingInfo: React.FC<ClosingInfoProps> = ({
  isFriday,
  isSunday,
  closingSong,
  setClosingSong,
  isLovePraiseTeam,
  setIsLovePraiseTeam,
  isForcedNonHymn,
  setIsForcedNonHymn
}) => {
  const trimmed = closingSong.trim();
  const hymnTitleFromNumber = getHymnTitleByNumber(trimmed);
  const hymnMatchFromTitle = findHymnByTitle(trimmed);
  const hasHymnCandidate = Boolean(hymnTitleFromNumber || hymnMatchFromTitle);
  const canForceNonHymn = Boolean(hymnMatchFromTitle);

  return (
    <section className="glass-card">
      <h2 className="section-title">
        {isFriday ? '찬양과 기도 (금요예배)' : '헌금 (주일예배)'}
      </h2>
      <div className="flex gap-2 items-center">
        <div className="relative" style={{ flex: 1 }}>
          <input
            type="text"
            value={closingSong}
            onChange={(e) => setClosingSong(e.target.value)}
            disabled={isLovePraiseTeam}
            placeholder={
              isLovePraiseTeam
                ? "사랑찬양단"
                : (isFriday ? "찬양 제목 또는 번호" : "헌금송 제목 또는 번호")
            }
            className="w-full"
            style={isLovePraiseTeam ? { opacity: 0.5 } : {}}
          />
          {!isLovePraiseTeam && !isForcedNonHymn && hasHymnCandidate && (
            <div
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '12px',
                color: '#94a3b8',
                fontStyle: 'italic',
                pointerEvents: 'none',
                maxWidth: '150px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {hymnTitleFromNumber ? (
                `(${hymnTitleFromNumber})`
              ) : (
                `(${hymnMatchFromTitle?.numbers[0]}장)`
              )}
            </div>
          )}
        </div>

        {!isLovePraiseTeam && canForceNonHymn && (
          <button
            onClick={() => setIsForcedNonHymn(!isForcedNonHymn)}
            className={`btn ${isForcedNonHymn ? 'btn-primary' : 'btn-secondary'}`}
            title={isForcedNonHymn ? '찬송가 자동 변환 다시 사용' : '이 곡은 찬송가가 아니게 처리'}
            style={{ padding: '0 10px', minWidth: '86px', height: '40px', fontSize: '12px', whiteSpace: 'nowrap' }}
          >
            {isForcedNonHymn ? '찬송가 사용' : '찬송가 제외'}
          </button>
        )}

        {isSunday && (
          <label className="flex items-center cursor-pointer text-xs text-secondary whitespace-nowrap ml-auto">
            <input
              type="checkbox"
              checked={isLovePraiseTeam}
              onChange={(e) => setIsLovePraiseTeam(e.target.checked)}
              style={{ width: 'auto', marginRight: '6px' }}
            />
            사랑찬양단
          </label>
        )}
      </div>
    </section>
  );
};
