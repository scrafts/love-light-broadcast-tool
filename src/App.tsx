import React, { useState, useEffect } from 'react';
import { BIBLE_STRUCTURE } from './data/bibleData';
import { CHURCH_NAME_KO, CHURCH_NAME_EN, FRIDAY_NOTICE } from './constants';
import { getWeekday, formatDate, formatSongTitle, formatClosingSong } from './utils';

// Components
import { WorshipInfo } from './components/WorshipInfo';
import { SongList } from './components/SongList';
import { ClosingInfo } from './components/ClosingInfo';
import { ResultDisplay } from './components/ResultDisplay';

type Passage = {
    book: string;
    chapter: string | number;
    verseStart: string | number;
    verseEnd: string | number;
};

const formatVerseRange = (passage: Passage) => {
    const vStart = String(passage.verseStart).trim();
    const vEnd = String(passage.verseEnd).trim();
    const isSingle = vStart === vEnd || vEnd === '';

    return isSingle ? vStart : `${vStart}~${vEnd}`;
};

const formatPassages = (passages: Passage[]) => {
    return passages.map((passage, index) => {
        const verseRange = formatVerseRange(passage);
        const chapter = String(passage.chapter).trim();
        const previous = passages[index - 1];

        if (previous?.book === passage.book) {
            const previousChapter = String(previous.chapter).trim();

            if (previousChapter === chapter) {
                return verseRange;
            }

            return `${chapter}:${verseRange}`;
        }

        return `${passage.book} ${chapter}:${verseRange}`;
    }).join(', ');
};

export default function App() {
    // --- State Management ---

    // 예배 정보
    const [title, setTitle] = useState('');

    // 다중 본문 관리
    const [passages, setPassages] = useState([{
        book: '창세기',
        chapter: 1,
        verseStart: 1,
        verseEnd: 1
    }]);

    const [leaderSelection, setLeaderSelection] = useState('송윤명 목사');
    const [leaderCustom, setLeaderCustom] = useState('');

    const [date, setDate] = useState(new Date());

    const [worshipTypeSelection, setWorshipTypeSelection] = useState('주일예배');
    const [worshipTypeCustom, setWorshipTypeCustom] = useState('');

    // 찬양 목록
    const [songs, setSongs] = useState<string[]>(['']);
    const [forcedNonHymnSongs, setForcedNonHymnSongs] = useState<boolean[]>([false]);

    // 후반부 찬양/헌금
    const [closingSong, setClosingSong] = useState('');
    const [isLovePraiseTeam, setIsLovePraiseTeam] = useState(false);
    const [isClosingSongForcedNonHymn, setIsClosingSongForcedNonHymn] = useState(false);

    // UI 상태
    const [copyStatus, setCopyStatus] = useState<string>('');

    // --- Effects ---

    // 날짜 변경 시 예배 형태 자동 설정
    useEffect(() => {
        const day = getWeekday(date);
        if (day === 0) setWorshipTypeSelection('주일예배');
        else if (day === 3) setWorshipTypeSelection('수요예배');
        else if (day === 5) setWorshipTypeSelection('금요예배');
    }, [date]);

    // 예배 형태 변경 시 사랑찬양단 초기화
    useEffect(() => {
        setIsLovePraiseTeam(false);
    }, [worshipTypeSelection, worshipTypeCustom]);

    // --- Handlers ---

    const handleSongChange = (index: number, value: string) => {
        const newSongs = [...songs];
        newSongs[index] = value;
        setSongs(newSongs);
    };

    const handleSongForceNonHymnChange = (index: number, value: boolean) => {
        const newForced = [...forcedNonHymnSongs];
        newForced[index] = value;
        setForcedNonHymnSongs(newForced);
    };

    const addSong = (index?: number) => {
        if (typeof index === 'number') {
            const newSongs = [...songs];
            newSongs.splice(index + 1, 0, ''); // 해당 인덱스 바로 뒤에 추가
            setSongs(newSongs);

            const newForced = [...forcedNonHymnSongs];
            newForced.splice(index + 1, 0, false);
            setForcedNonHymnSongs(newForced);
        } else {
            setSongs([...songs, '']); // 맨 뒤에 추가
            setForcedNonHymnSongs([...forcedNonHymnSongs, false]);
        }
    };

    const removeSong = (index: number) => {
        if (songs.length === 1) {
            setSongs(['']);
            setForcedNonHymnSongs([false]);
            return;
        }
        setSongs(songs.filter((_, i) => i !== index));
        setForcedNonHymnSongs(forcedNonHymnSongs.filter((_, i) => i !== index));
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyStatus(`${label} 복사 완료!`);
            setTimeout(() => setCopyStatus(''), 3000);
        } catch (err) {
            setCopyStatus('복사 실패');
            console.error(err);
        }
    };

    // --- Generators ---

    // 실제 사용할 값
    const effectiveLeader = leaderSelection === '기타' ? leaderCustom : leaderSelection;
    const effectiveWorshipType = worshipTypeSelection === '기타' ? worshipTypeCustom : worshipTypeSelection;

    const isFriday = effectiveWorshipType.includes('금요');
    const isSunday = effectiveWorshipType.includes('주일');
    const isFridayOrSunday = isFriday || isSunday;

    const generateTitleString = () => {
        const formattedDate = formatDate(date);
        const verseParts = formatPassages(passages);

        return `[LIVE] ${title} | ${verseParts} | ${effectiveLeader} | ${formattedDate} | ${CHURCH_NAME_KO} ${effectiveWorshipType}`;
    };

    const generateDescriptionString = () => {
        const formattedSongs = songs
            .map((song, songIndex) => ({ song, songIndex }))
            .filter(({ song }) => song.trim() !== '')
            .map(({ song, songIndex }, displayIndex) =>
                `${displayIndex + 1}. ${formatSongTitle(song, { forceNonHymn: forcedNonHymnSongs[songIndex] })}`
            )
            .join('\n\n');

        let formattedClosing = '';

        if (isLovePraiseTeam) {
            formattedClosing = '사랑찬양단';
        } else if (closingSong.trim()) {
            formattedClosing = formatClosingSong(closingSong, { forceNonHymn: isClosingSongForcedNonHymn });
        }

        let sectionHeader = '';
        if (isFriday) {
            sectionHeader = '[찬양과 기도]';
        } else if (isSunday) {
            sectionHeader = '[헌금]';
        }

        const fridayNotice = isFriday ? `\n\n${FRIDAY_NOTICE}` : '';
        const verseParts = formatPassages(passages);
        const sections = [
            `[경배와 찬양]\n\n${formattedSongs}`,
            `[성경 봉독 및 말씀 선포]\n\n` +
            `제목: ${title}\n\n` +
            `본문: ${verseParts}`,
        ];

        if (sectionHeader && formattedClosing) {
            sections.push(`${sectionHeader}\n\n${formattedClosing}`);
        }

        return `교회/단체 명 : ${CHURCH_NAME_EN}${fridayNotice}\n\n\n` +
            sections.join('\n\n\n');
    };

    return (
        <div className="app-container">
            <div className="flex flex-column gap-20 top-input-stack">
                <WorshipInfo
                    title={title} setTitle={setTitle}
                    leaderSelection={leaderSelection} setLeaderSelection={setLeaderSelection}
                    leaderCustom={leaderCustom} setLeaderCustom={setLeaderCustom}
                    passages={passages} setPassages={setPassages}
                    date={date} setDate={setDate}
                    worshipTypeSelection={worshipTypeSelection} setWorshipTypeSelection={setWorshipTypeSelection}
                    worshipTypeCustom={worshipTypeCustom} setWorshipTypeCustom={setWorshipTypeCustom}
                />

                <div className="bottom-tools-row">
                    <SongList
                        songs={songs}
                        forcedNonHymnSongs={forcedNonHymnSongs}
                        onSongChange={handleSongChange}
                        onForceNonHymnChange={handleSongForceNonHymnChange}
                        onAddSong={addSong}
                        onRemoveSong={removeSong}
                    />

                    {isFridayOrSunday && (
                        <ClosingInfo
                            isFriday={isFriday}
                            isSunday={isSunday}
                            closingSong={closingSong}
                            setClosingSong={setClosingSong}
                            isLovePraiseTeam={isLovePraiseTeam}
                            setIsLovePraiseTeam={setIsLovePraiseTeam}
                            isForcedNonHymn={isClosingSongForcedNonHymn}
                            setIsForcedNonHymn={setIsClosingSongForcedNonHymn}
                        />
                    )}

                    <ResultDisplay
                        date={date}
                        worshipType={effectiveWorshipType}
                        titleResult={generateTitleString()}
                        descriptionResult={generateDescriptionString()}
                        onCopy={copyToClipboard}
                        copyStatus={copyStatus}
                    />
                </div>
            </div>
        </div>
    );
}
