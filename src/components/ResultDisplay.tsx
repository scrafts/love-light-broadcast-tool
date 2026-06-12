import React, { useEffect, useState } from 'react';

interface ResultDisplayProps {
  date: Date;
  worshipType: string;
  titleResult: string;
  descriptionResult: string;
  onCopy: (text: string, label: string) => void;
  copyStatus: string;
}

const padTime = (value: number) => String(value).padStart(2, '0');

const formatClockTime = (date: Date) => {
  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}:${padTime(date.getSeconds())}`;
};

const formatOffset = (offsetMilliseconds: number) => {
  const offsetSeconds = Math.round(offsetMilliseconds / 1000);
  const absSeconds = Math.abs(offsetSeconds);

  if (offsetSeconds > 0) return `디지털 시계가 컴퓨터보다 ${absSeconds}초 빠릅니다.`;
  if (offsetSeconds < 0) return `디지털 시계가 컴퓨터보다 ${absSeconds}초 느립니다.`;
  return '디지털 시계와 컴퓨터 시간이 일치합니다.';
};

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `예배 시작까지 ${minutes}분 ${seconds}초`;
};

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ date, worshipType, titleResult, descriptionResult, onCopy, copyStatus }) => {
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState('');
  const [isBasicOnly, setIsBasicOnly] = useState(false);
  const [youtubeLinkError, setYoutubeLinkError] = useState('');
  const [showDvrReminder, setShowDvrReminder] = useState(false);
  const [isClockCalibrationActive, setIsClockCalibrationActive] = useState(false);
  const [clockOffsetMilliseconds, setClockOffsetMilliseconds] = useState(0);
  const [hasClockCalibration, setHasClockCalibration] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [customWorshipTime, setCustomWorshipTime] = useState('');
  const [showWorshipTimeEditor, setShowWorshipTimeEditor] = useState(false);
  const [showWorshipClockFullScreen, setShowWorshipClockFullScreen] = useState(false);

  const isWednesdayWorship = worshipType.includes('수요');
  const isFridayWorship = worshipType.includes('금요');
  const defaultWorshipTime = isWednesdayWorship ? '20:00' : isFridayWorship ? '21:00' : '11:30';
  const effectiveWorshipTime = customWorshipTime || defaultWorshipTime;
  const [worshipHour, worshipMinute] = effectiveWorshipTime.split(':').map(Number);
  const adjustedNow = new Date(now.getTime() + clockOffsetMilliseconds);
  const worshipStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), worshipHour, worshipMinute, 0, 0);
  const timeUntilWorship = worshipStart.getTime() - adjustedNow.getTime();

  useEffect(() => {
    setCustomWorshipTime('');
    setShowWorshipTimeEditor(false);
    setShowWorshipClockFullScreen(false);
  }, [worshipType, date]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 250);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!isClockCalibrationActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;

      event.preventDefault();

      const pressedAt = new Date();
      const nearestMinute = Math.round(pressedAt.getTime() / 60000) * 60000;
      const offsetMilliseconds = nearestMinute - pressedAt.getTime();

      setClockOffsetMilliseconds(offsetMilliseconds);
      setHasClockCalibration(true);
      setNow(pressedAt);
      setIsClockCalibrationActive(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isClockCalibrationActive]);

  const handleKakaoCopy = () => {
    if (!youtubeLink.trim()) {
      setYoutubeLinkError('유튜브 링크를 입력해주세요.');
      return;
    }

    // 유튜브 링크 전처리 (?feature=share 등 제거)
    const cleanLink = youtubeLink.split('?')[0];

    const month = date.getMonth() + 1;
    const day = date.getDate();

    const instruction = isBasicOnly ? "" : "\n(유튜브에서 목사님 성함을 검색하셔서 들어오실 수 있습니다.)";
    const kakaoMessage = `${cleanLink}\n\n${month}월 ${day}일 ${worshipType} 링크입니다.${instruction}`;

    onCopy(kakaoMessage, '카카오톡 공유 메시지');
    setShowYoutubeInput(false);
    setYoutubeLink('');
    setYoutubeLinkError('');
    setIsBasicOnly(false); // 초기화
    setShowDvrReminder(true);
  };

  return (
    <>
      <section className="glass-card">
      <div className="flex gap-2 flex-wrap copy-actions">
        <button
          onClick={() => onCopy(titleResult, '방송 제목')}
          className="btn btn-primary"
          style={{ flex: 1, minWidth: '120px' }}
        >
          방송 제목 복사
        </button>

        <button
          onClick={() => onCopy(descriptionResult, '방송 설명')}
          className="btn btn-primary"
          style={{ flex: 1, minWidth: '120px' }}
        >
          방송 설명 복사
        </button>

        <button
          onClick={() => {
            setShowYoutubeInput(prev => !prev);
            setYoutubeLinkError('');
          }}
          className="btn btn-primary"
          style={{ flex: 1, minWidth: '120px' }}
        >
          {showYoutubeInput ? '복사 취소' : '카톡 링크 복사'}
        </button>

        <button
          onClick={() => setShowWorshipClockFullScreen(true)}
          className="btn btn-secondary"
          style={{ flex: 1, minWidth: '120px' }}
        >
          시계 보기
        </button>
      </div>

      {showYoutubeInput && (
        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div className="flex justify-between items-center mb-2">
            <label className="input-label" style={{ marginBottom: 0 }}>유튜브 링크 입력</label>
            <label className="flex items-center cursor-pointer text-xs" style={{ color: '#64748b' }}>
              <input
                type="checkbox"
                checked={isBasicOnly}
                onChange={(e) => setIsBasicOnly(e.target.checked)}
                style={{ width: 'auto', marginRight: '6px' }}
              />
              기본 정보만 보내기
            </label>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={youtubeLink}
              onChange={(e) => {
                setYoutubeLink(e.target.value);
                setYoutubeLinkError('');
              }}
              placeholder="https://youtu.be/..."
              style={{ flex: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && handleKakaoCopy()}
            />
            <button
              onClick={handleKakaoCopy}
              className="btn btn-primary"
              style={{ padding: '10px 16px' }}
            >
              완료
            </button>
          </div>
          {youtubeLinkError && (
            <div style={{ marginTop: '10px', color: '#fca5a5', fontSize: '12px', fontWeight: 700 }}>
              {youtubeLinkError}
            </div>
          )}
        </div>
      )}

      {copyStatus && (
        <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '8px', textAlign: 'center', fontWeight: '600', fontSize: '13px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          {copyStatus}
        </div>
      )}

      {showDvrReminder && (
        <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: 'rgba(239, 68, 68, 0.16)', color: '#fca5a5', borderRadius: '8px', fontWeight: '700', fontSize: '13px', border: '1px solid rgba(239, 68, 68, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span>DVR 해제하셨나요?</span>
          <button
            onClick={() => setShowDvrReminder(false)}
            className="btn"
            style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#ffffff', fontSize: '12px' }}
          >
            예
          </button>
        </div>
      )}

      </section>

      {showWorshipClockFullScreen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, minHeight: '100vh', background: '#020617', color: '#f8fafc', display: 'flex', flexDirection: 'column', padding: '32px', boxSizing: 'border-box' }}>
          <div className="flex justify-between items-start" style={{ marginBottom: '24px', gap: '16px' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>예배당 디지털 시계</div>
              <div style={{ color: '#38bdf8', fontSize: '16px', fontWeight: 700 }}>{worshipType}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
              <div className="flex gap-2 items-center justify-end">
                <button
                  onClick={() => setShowWorshipTimeEditor(prev => !prev)}
                  className="btn btn-secondary"
                  style={{ padding: '12px 18px', fontSize: '15px' }}
                >
                  {showWorshipTimeEditor ? '수정 닫기' : '시작 시간 수정'}
                </button>
                <button
                  onClick={() => {
                    setShowWorshipClockFullScreen(false);
                    setIsClockCalibrationActive(false);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '12px 18px', fontSize: '15px' }}
                >
                  닫기
                </button>
              </div>

              {showWorshipTimeEditor && (
                <div className="flex gap-2 items-center justify-end flex-wrap" style={{ padding: '10px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}>
                  <label className="input-label" style={{ marginBottom: 0, whiteSpace: 'nowrap', fontSize: '15px' }}>예배 시작</label>
                  <input
                    type="time"
                    value={effectiveWorshipTime}
                    onChange={(e) => setCustomWorshipTime(e.target.value)}
                    style={{ width: '150px', padding: '10px 12px', fontSize: '18px' }}
                  />
                  {customWorshipTime && (
                    <button
                      onClick={() => setCustomWorshipTime('')}
                      className="btn btn-secondary"
                      style={{ padding: '10px 12px', fontSize: '14px' }}
                    >
                      기본값
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '28px' }}>
            <div style={{ fontSize: 'clamp(84px, 15vw, 220px)', lineHeight: 0.9, fontWeight: 900, letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums' }}>
              {formatClockTime(adjustedNow)}
            </div>

            {timeUntilWorship > 0 && (
              <div style={{ color: '#e2e8f0', fontWeight: 900, fontSize: 'clamp(34px, 5vw, 72px)' }}>
                {formatCountdown(timeUntilWorship)}
              </div>
            )}

            <div className="flex gap-2 flex-wrap justify-center" style={{ maxWidth: '760px' }}>
              <button
                onClick={() => setIsClockCalibrationActive(prev => !prev)}
                className={`btn ${isClockCalibrationActive ? 'btn-danger' : 'btn-secondary'}`}
                style={{ padding: '14px 20px', fontSize: '16px' }}
              >
                {isClockCalibrationActive ? '측정 중' : '오차 측정'}
              </button>
            </div>

            <div style={{ color: isClockCalibrationActive ? '#fbbf24' : '#94a3b8', fontSize: '18px', lineHeight: 1.5, minHeight: '40px' }}>
              {isClockCalibrationActive
                ? '뒤 시계의 분이 바뀌는 순간 스페이스바를 누르세요.'
                : hasClockCalibration
                  ? (
                    <div className="flex gap-2 items-center justify-center flex-wrap">
                      <span>{formatOffset(clockOffsetMilliseconds)}</span>
                      <button
                        onClick={() => setClockOffsetMilliseconds(prev => prev + 60000)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '14px' }}
                      >
                        1분 +
                      </button>
                      <button
                        onClick={() => setClockOffsetMilliseconds(prev => prev - 60000)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '14px' }}
                      >
                        1분 -
                      </button>
                      <button
                        onClick={() => {
                          setClockOffsetMilliseconds(0);
                          setHasClockCalibration(false);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '14px' }}
                      >
                        초기화
                      </button>
                    </div>
                  )
                  : '오차 측정 전입니다.'}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
