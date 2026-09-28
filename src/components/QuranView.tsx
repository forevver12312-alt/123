import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Search,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  MoveHorizontal,
  Columns2,
  FileText,
  Image as ImageIcon,
  Check,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Volume2,
  X,
  Sparkles,
  Users,
  Film,
  Music,
  Upload,
  AlignJustify,
  ListFilter,
  Copy,
  Repeat,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';
import { SURAH_INDEX } from '../data/quranIndex';
import { searchArabicMatches } from '../utils/arabicSearch';
import { triggerHaptic } from '../utils/soundAndHaptics';
import {
  fetchFullQuran,
  fetchMushafPages,
  MushafPage,
  PageEntry,
  getSurahStartPage,
} from '../utils/quranLoader';

export interface ReciterInfo {
  id: string;
  name: string;
  style: string;
  subFolder: string;
  category: 'muallim' | 'murattal' | 'mujawwad' | 'famous' | 'kids';
  badge: string;
}

export const RECITERS_LIST: ReciterInfo[] = [
  {
    id: 'minshawi_muallim',
    name: 'المصحف المعلم - الشيخ محمد صديق المنشاوي',
    style: 'تلاوة تعليمية مع ترديد أطفال آية بآية للتحفيظ وإتقان التجويد',
    subFolder: 'Minshawy_Teacher_128kbps',
    category: 'muallim',
    badge: 'المصحف المعلم 🎓',
  },
  {
    id: 'husary_muallim',
    name: 'المصحف المعلم - الشيخ محمود خليل الحصري',
    style: 'إتقان تام لمخارج الحروف والتجويد مع ترديد تعليمي',
    subFolder: 'Husary_Muallim_128kbps',
    category: 'muallim',
    badge: 'المصحف المعلم 🎓',
  },
  {
    id: 'husary',
    name: 'الشيخ محمود خليل الحصري (مرتل)',
    style: 'مرتل متقن مخارج الحروف وأحكام التجويد',
    subFolder: 'Husary_128kbps',
    category: 'murattal',
    badge: 'المرتل المتقن 🎙️',
  },
  {
    id: 'minshawi',
    name: 'الشيخ محمد صديق المنشاوي (مرتل)',
    style: 'صوت باكي رقيق يلامس القلوب والأفئدة',
    subFolder: 'Minshawy_Murattal_128kbps',
    category: 'murattal',
    badge: 'المرتل الباكي 🎙️',
  },
  {
    id: 'minshawi_mujawwad',
    name: 'الشيخ محمد صديق المنشاوي (المجود)',
    style: 'تلاوة مجودة خاشعة بالمقامات والأنغام القرآنية',
    subFolder: 'Minshawy_Mujawwad_192kbps',
    category: 'mujawwad',
    badge: 'المصحف المجود 📜',
  },
  {
    id: 'husary_mujawwad',
    name: 'الشيخ محمود خليل الحصري (المجود)',
    style: 'المصحف المجود بقمة الإتقان والضبط والترتيل',
    subFolder: 'Husary_128kbps_Mujawwad',
    category: 'mujawwad',
    badge: 'المصحف المجود 📜',
  },
  {
    id: 'dosari',
    name: 'الشيخ ياسر الدوسري',
    style: 'تلاوة حجازية نجدية خاشعة ومؤثرة',
    subFolder: 'Yasser_Ad-Dussary_128kbps',
    category: 'murattal',
    badge: 'خاشع ومؤثر 🎙️',
  },
  {
    id: 'muaiqly',
    name: 'الشيخ ماهر المعيقلي',
    style: 'إمام الحرم المكي الشريف بصوت هادئ',
    subFolder: 'MaherAlMuaiqly128kbps',
    category: 'murattal',
    badge: 'الحرم المكي 🎙️',
  },
  {
    id: 'afasy',
    name: 'الشيخ مشاري راشد العفاسي',
    style: 'صوت شجي وندي عذب النغمات',
    subFolder: 'Alafasy_128kbps',
    category: 'murattal',
    badge: 'عذب وندي 🎙️',
  },
  {
    id: 'abdulbasit',
    name: 'الشيخ عبد الباسط عبد الصمد (مرتل)',
    style: 'المصحف المرتل برواية حفص عن عاصم',
    subFolder: 'Abdul_Basit_Murattal_192kbps',
    category: 'murattal',
    badge: 'صوت مكة 🎙️',
  },
  {
    id: 'ghamdi',
    name: 'الشيخ سعد الغامدي',
    style: 'تلاوة عذبة وسلسة تريح النفس',
    subFolder: 'Ghamadi_40kbps',
    category: 'murattal',
    badge: 'تلاوة هادئة 🎙️',
  },
  {
    id: 'ajmi',
    name: 'الشيخ أحمد بن علي العجمي',
    style: 'نبرة حماسية وجزلة محبوبة',
    subFolder: 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net',
    category: 'murattal',
    badge: 'صوت مميز 🎙️',
  },
  // Aliases for backward compatibility
  {
    id: 'minshawi_kids',
    name: 'المصحف المعلم (المنشاوي وترديد الأطفال)',
    style: 'قراءة آية بآية مع ترديد جماعي لأطفال للتحفيظ',
    subFolder: 'Minshawy_Teacher_128kbps',
    category: 'muallim',
    badge: 'المصحف المعلم 🎓',
  },
  {
    id: 'husary_kids',
    name: 'المصحف المعلم (الحصري وترديد الأطفال)',
    style: 'تعليم التجويد للأطفال خطوة بخطوة',
    subFolder: 'Husary_Muallim_128kbps',
    category: 'muallim',
    badge: 'المصحف المعلم 🎓',
  },
];

export const getReciterShortName = (r: ReciterInfo): string => {
  if (r.id.includes('minshawi_muallim') || r.id === 'minshawi_kids') return 'المنشاوي (معلم) 🎓';
  if (r.id.includes('husary_muallim') || r.id === 'husary_kids') return 'الحصري (معلم) 🎓';
  if (r.id.includes('minshawi_mujawwad')) return 'المنشاوي (مجود) 📜';
  if (r.id.includes('husary_mujawwad')) return 'الحصري (مجود) 📜';
  if (r.id.includes('husary')) return 'الحصري (مرتل)';
  if (r.id.includes('minshawi')) return 'المنشاوي (مرتل)';
  if (r.id.includes('abdulbasit')) return 'عبد الباسط';
  if (r.id.includes('dosari')) return 'ياسر الدوسري';
  if (r.id.includes('muaiqly')) return 'المعيقلي';
  if (r.id.includes('afasy')) return 'العفاسي';
  if (r.id.includes('ghamdi')) return 'سعد الغامدي';
  if (r.id.includes('ajmi')) return 'العجمي';
  return r.name.replace('الشيخ ', '');
};

export const getReciterIcon = (category: string): string => {
  if (category === 'muallim' || category === 'kids') return '🎓';
  if (category === 'mujawwad') return '📜';
  return '🎙️';
};

interface QuranViewProps {
  fontSize: number;
  lastReadSurah: number | null;
  lastReadAyah: number | null;
  onSetLastRead: (surahNumber: number, ayahNumber: number) => void;
  initialSurahNumber?: number | null;
}

interface PlayingAyah {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  isPlaying: boolean;
}

interface CustomMediaTrack {
  url: string;
  fileName: string;
  isExtractedFromVideo: boolean;
  isPlaying: boolean;
}

export interface RecitationRangeConfig {
  enabled: boolean;
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  repeatCount: number; // 1, 2, 3, 5, 7, 10, or 0 for infinite (∞)
  currentRepeat: number;
  repeatMode: 'range' | 'each_ayah';
  eachAyahRepeatCount: number;
  currentAyahRepeat: number;
}

export const QuranView: React.FC<QuranViewProps> = ({
  fontSize,
  lastReadSurah,
  lastReadAyah,
  onSetLastRead,
  initialSurahNumber,
}) => {
  // Mode: 'mushaf_pages' or 'surah_index'
  const [viewMode, setViewMode] = useState<'mushaf_pages' | 'surah_index'>('mushaf_pages');

  // Page Orientation: 'vertical' (single page) or 'horizontal' (two pages side-by-side / wide open mushaf)
  const [pageOrientation, setPageOrientation] = useState<'vertical' | 'horizontal'>('vertical');

  // Render Type: 'printed' (exact King Fahd 15-line Medina Mushaf layout) or 'text' (interactive justified vector text)
  const [displayType, setDisplayType] = useState<'printed' | 'text'>('text');

  // Text Ayah Layout: 'separated' (each ayah separated in its own distinct card) or 'continuous' (classic mushaf paragraph)
  const [ayahLayout, setAyahLayout] = useState<'separated' | 'continuous'>('separated');

  // Current page in the Mushaf (1 to 604)
  const [currentPage, setCurrentPage] = useState<number>(() => {
    try {
      const savedPage = localStorage.getItem('nur_last_read_page');
      if (savedPage) return Number(savedPage);
    } catch {
      // Ignore
    }
    if (initialSurahNumber) return getSurahStartPage(initialSurahNumber);
    return 1;
  });

  const [pagesData, setPagesData] = useState<Record<number, MushafPage>>({});
  const [loadingPages, setLoadingPages] = useState(true);
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJuz, setFilterJuz] = useState<number | 'all'>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [showJumpModal, setShowJumpModal] = useState(false);
  const [pageTurnAnim, setPageTurnAnim] = useState<'next' | 'prev' | null>(null);

  // Selected Reciter (المصحف المعلم المنشاوي، الحصري، ياسر الدوسري، إلخ)
  const [selectedReciterId, setSelectedReciterId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('nur_selected_reciter');
      if (saved) {
        if (saved === 'husary_kids') return 'husary_muallim';
        if (saved === 'minshawi_kids') return 'minshawi_muallim';
        if (RECITERS_LIST.some((r) => r.id === saved)) return saved;
      }
    } catch {
      // Ignore
    }
    return 'minshawi_muallim';
  });

  // Modal Dialogs
  const [showReciterModal, setShowReciterModal] = useState(false);
  const [reciterCategoryFilter, setReciterCategoryFilter] = useState<'all' | 'muallim' | 'murattal' | 'mujawwad'>('all');
  const [reciterSearchTerm, setReciterSearchTerm] = useState('');
  const [showMediaUploadModal, setShowMediaUploadModal] = useState(false);
  const [showRangeModal, setShowRangeModal] = useState(false);

  // Optional Recitation Range & Repeat State (تحديد نطاق وتكرار للتحفيظ لكافة الشيوخ)
  const [rangeConfig, setRangeConfig] = useState<RecitationRangeConfig>(() => {
    try {
      const saved = localStorage.getItem('nur_recitation_range');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return {
      enabled: false,
      surahNumber: 1,
      fromAyah: 1,
      toAyah: 7,
      repeatCount: 3,
      currentRepeat: 1,
      repeatMode: 'range',
      eachAyahRepeatCount: 3,
      currentAyahRepeat: 1,
    };
  });

  const rangeConfigRef = useRef<RecitationRangeConfig>(rangeConfig);
  useEffect(() => {
    rangeConfigRef.current = rangeConfig;
  }, [rangeConfig]);

  // Persist range config
  useEffect(() => {
    try {
      localStorage.setItem('nur_recitation_range', JSON.stringify(rangeConfig));
    } catch {
      // Ignore
    }
  }, [rangeConfig]);

  // Recitation Audio State
  const [currentRecitation, setCurrentRecitation] = useState<PlayingAyah | null>(null);
  const [isSidePlayerOpen, setIsSidePlayerOpen] = useState(true);
  const [audioLoading, setAudioLoading] = useState(false);
  const [selectedAyahAction, setSelectedAyahAction] = useState<PageEntry | null>(null);

  // Custom Device Audio / Video Track State
  const [customMedia, setCustomMedia] = useState<CustomMediaTrack | null>(null);
  const [customMediaTime, setCustomMediaTime] = useState<{ current: number; duration: number }>({
    current: 0,
    duration: 0,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const customMediaAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);

  const pageContainerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const currentReciter = useMemo(() => {
    return RECITERS_LIST.find((r) => r.id === selectedReciterId) || RECITERS_LIST[0];
  }, [selectedReciterId]);

  // Load pages data on mount
  useEffect(() => {
    let isMounted = true;
    fetchMushafPages().then((data) => {
      if (isMounted) {
        setPagesData(data);
        setLoadingPages(false);
      }
    });
    fetchFullQuran();
    return () => {
      isMounted = false;
    };
  }, []);

  // Jump to surah start page if initialSurahNumber changes
  useEffect(() => {
    if (initialSurahNumber) {
      const targetPage = getSurahStartPage(initialSurahNumber);
      setCurrentPage(targetPage);
      setViewMode('mushaf_pages');
    }
  }, [initialSurahNumber]);

  // Persist current page & reciter
  useEffect(() => {
    try {
      localStorage.setItem('nur_last_read_page', currentPage.toString());
    } catch {
      // Ignore
    }
  }, [currentPage]);

  useEffect(() => {
    try {
      localStorage.setItem('nur_selected_reciter', selectedReciterId);
    } catch {
      // Ignore
    }
  }, [selectedReciterId]);

  // Stop audio when unmounting
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (customMediaAudioRef.current) {
        customMediaAudioRef.current.pause();
        customMediaAudioRef.current = null;
      }
    };
  }, []);

  // Find which page an Ayah is located on
  const findAyahPage = (surahNum: number, ayahNum: number): number | null => {
    for (const [pNum, page] of Object.entries(pagesData)) {
      const hasAyah = page.entries.some(
        (e) => e.type === 'ayah' && e.surahNumber === surahNum && e.numberInSurah === ayahNum
      );
      if (hasAyah) return Number(pNum);
    }
    return null;
  };

  /**
   * Play specific Ayah with the selected Sheikh / Qari (المصحف المعلم المنشاوي، الحصري، ياسر الدوسري، إلخ)
   */
  const playAyahRecitation = (
    surahNumber: number,
    ayahNumber: number,
    surahName?: string,
    reciterOverride?: ReciterInfo
  ) => {
    // If custom media is playing, pause it first
    if (customMediaAudioRef.current) {
      customMediaAudioRef.current.pause();
      setCustomMedia((prev) => (prev ? { ...prev, isPlaying: false } : null));
    }

    const activeReciter = reciterOverride || currentReciter;
    const pad3 = (n: number) => n.toString().padStart(3, '0');
    const url = `https://everyayah.com/data/${activeReciter.subFolder}/${pad3(surahNumber)}${pad3(ayahNumber)}.mp3`;
    const sName = surahName || SURAH_INDEX.find((s) => s.number === surahNumber)?.name || '';

    setAudioLoading(true);

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.src = url;
    audio.crossOrigin = 'anonymous';

    audio
      .play()
      .then(() => {
        setAudioLoading(false);
        setCurrentRecitation({
          surahNumber,
          ayahNumber,
          surahName: sName,
          isPlaying: true,
        });

        // Smoothly scroll the separated Ayah block into view
        setTimeout(() => {
          const el = document.getElementById(`ayah-block-${surahNumber}-${ayahNumber}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      })
      .catch((err) => {
        setAudioLoading(false);
        console.warn('Audio playback error:', err);
      });

    // Check if the reciting Ayah is on another page, and automatically flip the page if needed
    const targetPage = findAyahPage(surahNumber, ayahNumber);
    if (targetPage && targetPage !== currentPage) {
      if (pageOrientation === 'horizontal') {
        if (targetPage !== currentPage && targetPage !== currentPage + 1) {
          setCurrentPage(targetPage % 2 === 0 ? targetPage - 1 : targetPage);
        }
      } else {
        setCurrentPage(targetPage);
      }
    }

    // When the Ayah audio finishes, advance to the next Ayah automatically!
    audio.onended = () => {
      handleNextAyah(surahNumber, ayahNumber);
    };
  };

  /**
   * Helper to switch reciter and optionally seamlessly switch playback
   */
  const selectReciter = (reciterId: string) => {
    setSelectedReciterId(reciterId);
    try {
      localStorage.setItem('nur_selected_reciter', reciterId);
    } catch {
      // Ignore
    }
    triggerHaptic(20);
    const targetReciter = RECITERS_LIST.find((r) => r.id === reciterId);
    if (currentRecitation && targetReciter) {
      playAyahRecitation(
        currentRecitation.surahNumber,
        currentRecitation.ayahNumber,
        currentRecitation.surahName,
        targetReciter
      );
    }
  };

  /**
   * Advance to Next Ayah (with optional range & repetition support for all reciters)
   */
  const handleNextAyah = (currentSurah?: number, currentAyah?: number) => {
    const sNum = currentSurah ?? currentRecitation?.surahNumber ?? 1;
    const aNum = currentAyah ?? currentRecitation?.ayahNumber ?? 1;
    const surahMeta = SURAH_INDEX.find((s) => s.number === sNum);
    const activeRange = rangeConfigRef.current;

    // OPTIONAL: Range & Repeat mode active
    if (activeRange.enabled && activeRange.surahNumber === sNum) {
      if (activeRange.repeatMode === 'each_ayah') {
        if (activeRange.currentAyahRepeat < activeRange.eachAyahRepeatCount) {
          const nextAyahRep = activeRange.currentAyahRepeat + 1;
          setRangeConfig((prev) => {
            const up = { ...prev, currentAyahRepeat: nextAyahRep };
            rangeConfigRef.current = up;
            return up;
          });
          triggerHaptic(20);
          playAyahRecitation(sNum, aNum, surahMeta?.name);
          return;
        } else {
          setRangeConfig((prev) => {
            const up = { ...prev, currentAyahRepeat: 1 };
            rangeConfigRef.current = up;
            return up;
          });
          if (aNum < activeRange.toAyah) {
            playAyahRecitation(sNum, aNum + 1, surahMeta?.name);
            return;
          } else {
            if (activeRange.repeatCount === 0 || activeRange.currentRepeat < activeRange.repeatCount) {
              const nextRep = activeRange.currentRepeat + 1;
              setRangeConfig((prev) => {
                const up = {
                  ...prev,
                  currentRepeat: nextRep,
                  currentAyahRepeat: 1,
                };
                rangeConfigRef.current = up;
                return up;
              });
              triggerHaptic(40);
              setCopiedText(`🔁 إعادة تكرار المقطع (التكرار ${nextRep} من ${activeRange.repeatCount === 0 ? '∞' : activeRange.repeatCount})`);
              setTimeout(() => setCopiedText(null), 3000);
              playAyahRecitation(sNum, activeRange.fromAyah, surahMeta?.name);
              return;
            } else {
              triggerHaptic(80);
              setCopiedText(`🎉 تم إكمال التكرار (${activeRange.repeatCount} مرات) بنجاح!`);
              setTimeout(() => setCopiedText(null), 4000);
              setCurrentRecitation(null);
              setRangeConfig((prev) => {
                const up = { ...prev, currentRepeat: 1, currentAyahRepeat: 1 };
                rangeConfigRef.current = up;
                return up;
              });
              return;
            }
          }
        }
      }

      // Mode: Repeat whole range
      if (aNum < activeRange.toAyah) {
        playAyahRecitation(sNum, aNum + 1, surahMeta?.name);
        return;
      } else {
        if (activeRange.repeatCount === 0 || activeRange.currentRepeat < activeRange.repeatCount) {
          const nextRep = activeRange.currentRepeat + 1;
          setRangeConfig((prev) => {
            const up = {
              ...prev,
              currentRepeat: nextRep,
            };
            rangeConfigRef.current = up;
            return up;
          });
          triggerHaptic(40);
          setCopiedText(`🔁 إعادة المقطع (التكرار ${nextRep} من ${activeRange.repeatCount === 0 ? '∞' : activeRange.repeatCount})`);
          setTimeout(() => setCopiedText(null), 3000);
          playAyahRecitation(sNum, activeRange.fromAyah, surahMeta?.name);
          return;
        } else {
          triggerHaptic(80);
          setCopiedText(`🎉 تم إكمال تكرار المقطع (${activeRange.repeatCount} مرات) بنجاح!`);
          setTimeout(() => setCopiedText(null), 4000);
          setCurrentRecitation(null);
          setRangeConfig((prev) => {
            const up = { ...prev, currentRepeat: 1 };
            rangeConfigRef.current = up;
            return up;
          });
          return;
        }
      }
    }

    // Default continuous progression
    const totalInSurah = surahMeta?.numberOfAyahs || 7;

    if (aNum < totalInSurah) {
      playAyahRecitation(sNum, aNum + 1, surahMeta?.name);
    } else if (sNum < 114) {
      const nextSurahMeta = SURAH_INDEX.find((s) => s.number === sNum + 1);
      playAyahRecitation(sNum + 1, 1, nextSurahMeta?.name);
    } else {
      // Reached the end of the Quran
      setCurrentRecitation(null);
    }
  };

  /**
   * Go back to Previous Ayah
   */
  const handlePrevAyah = () => {
    if (!currentRecitation) return;
    const { surahNumber, ayahNumber } = currentRecitation;

    if (ayahNumber > 1) {
      playAyahRecitation(surahNumber, ayahNumber - 1, currentRecitation.surahName);
    } else if (surahNumber > 1) {
      const prevSurahMeta = SURAH_INDEX.find((s) => s.number === surahNumber - 1);
      const totalInPrev = prevSurahMeta?.numberOfAyahs || 7;
      playAyahRecitation(surahNumber - 1, totalInPrev, prevSurahMeta?.name);
    }
  };

  /**
   * Play / Pause Toggle for Reciter
   */
  const togglePlayPause = () => {
    if (!audioRef.current) {
      startRecitationFromCurrentPage();
      return;
    }

    if (currentRecitation?.isPlaying) {
      audioRef.current.pause();
      setCurrentRecitation((prev) => (prev ? { ...prev, isPlaying: false } : null));
    } else {
      if (currentRecitation) {
        audioRef.current.play();
        setCurrentRecitation((prev) => (prev ? { ...prev, isPlaying: true } : null));
      } else {
        startRecitationFromCurrentPage();
      }
    }
    triggerHaptic(20);
  };

  /**
   * Stop Recitation
   */
  const stopRecitation = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentRecitation(null);
    triggerHaptic(20);
  };

  /**
   * Start Range Recitation (المقطع المكرر للتحفيظ)
   */
  const startRangeRecitation = (customConfig?: Partial<RecitationRangeConfig>) => {
    const activeCfg = { ...rangeConfigRef.current, ...(customConfig || {}), enabled: true };
    const targetSurah = activeCfg.surahNumber;
    const surahMeta = SURAH_INDEX.find((s) => s.number === targetSurah);
    const totalAyahs = surahMeta?.numberOfAyahs || 7;

    const fromA = Math.max(1, Math.min(totalAyahs, activeCfg.fromAyah));
    const toA = Math.max(fromA, Math.min(totalAyahs, activeCfg.toAyah));

    const finalCfg: RecitationRangeConfig = {
      ...activeCfg,
      surahNumber: targetSurah,
      fromAyah: fromA,
      toAyah: toA,
      currentRepeat: 1,
      currentAyahRepeat: 1,
      enabled: true,
    };

    setRangeConfig(finalCfg);
    rangeConfigRef.current = finalCfg;

    setShowRangeModal(false);
    triggerHaptic(30);

    setCopiedText(`بدء تلاوة من آية ${fromA} إلى ${toA} مع التكرار بصوت ${currentReciter.name}`);
    setTimeout(() => setCopiedText(null), 3500);

    playAyahRecitation(targetSurah, fromA, surahMeta?.name);
  };

  const cancelRangeRecitation = () => {
    setRangeConfig((prev) => {
      const updated = { ...prev, enabled: false };
      rangeConfigRef.current = updated;
      return updated;
    });
    triggerHaptic(20);
    setCopiedText('تم إيقاف وضع التكرار والعودة للتلاوة العادية');
    setTimeout(() => setCopiedText(null), 3000);
  };

  /**
   * Start recitation from the first Ayah visible on the current page
   */
  const startRecitationFromCurrentPage = () => {
    const pData = pagesData[currentPage];
    if (pData) {
      const firstAyah = pData.entries.find((e) => e.type === 'ayah' && e.surahNumber && e.numberInSurah);
      if (firstAyah && firstAyah.surahNumber && firstAyah.numberInSurah) {
        playAyahRecitation(firstAyah.surahNumber, firstAyah.numberInSurah, firstAyah.surahName);
        return;
      }
    }
    const surahOnPage = SURAH_INDEX.find((s) => s.page === currentPage) || SURAH_INDEX[0];
    playAyahRecitation(surahOnPage.number, 1, surahOnPage.name);
  };

  /**
   * Long-Press Detection on Ayah:
   * Starts chosen Sheikh recitation directly from the pressed Ayah
   */
  const handleAyahTouchStart = (ayahEntry: PageEntry) => {
    isLongPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      triggerHaptic(60);
      if (ayahEntry.surahNumber && ayahEntry.numberInSurah) {
        playAyahRecitation(ayahEntry.surahNumber, ayahEntry.numberInSurah, ayahEntry.surahName);
        setCopiedText(`بدء تلاوة ${currentReciter.name} من سورة ${ayahEntry.surahName}: آية ${ayahEntry.numberInSurah}`);
        setTimeout(() => setCopiedText(null), 3000);
      }
    }, 450);
  };

  const handleAyahTouchEnd = (ayahEntry: PageEntry) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleAyahClick = (ayahEntry: PageEntry) => {
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }
    setSelectedAyahAction(ayahEntry);
    triggerHaptic(15);
  };

  // ================= DEVICE AUDIO / VIDEO EXTRACTION HANDLERS =================
  /**
   * 1. Import Audio File from Device (MP3, M4A, WAV, etc.)
   */
  const handleDeviceAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopRecitation();

    const fileUrl = URL.createObjectURL(file);
    const mediaTrack: CustomMediaTrack = {
      url: fileUrl,
      fileName: file.name,
      isExtractedFromVideo: false,
      isPlaying: true,
    };

    setCustomMedia(mediaTrack);
    setShowMediaUploadModal(false);
    playCustomMedia(mediaTrack);

    setCopiedText(`تم تحميل الصوت من جهازك: ${file.name}`);
    setTimeout(() => setCopiedText(null), 3500);
  };

  /**
   * 2. Extract Audio from Video File on Device (MP4, MOV, WEBM, MKV, etc.)
   */
  const handleDeviceVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopRecitation();

    const fileUrl = URL.createObjectURL(file);
    const mediaTrack: CustomMediaTrack = {
      url: fileUrl,
      fileName: file.name,
      isExtractedFromVideo: true,
      isPlaying: true,
    };

    setCustomMedia(mediaTrack);
    setShowMediaUploadModal(false);
    playCustomMedia(mediaTrack);

    setCopiedText(`تم استخراج الصوت من الفيديو بنجاح: ${file.name}`);
    setTimeout(() => setCopiedText(null), 4000);
  };

  const playCustomMedia = (track: CustomMediaTrack) => {
    if (!customMediaAudioRef.current) {
      customMediaAudioRef.current = new Audio();
    }
    const audio = customMediaAudioRef.current;
    audio.src = track.url;
    audio.play().then(() => {
      setCustomMedia((prev) => (prev ? { ...prev, isPlaying: true } : null));
    });

    audio.ontimeupdate = () => {
      setCustomMediaTime({
        current: audio.currentTime,
        duration: audio.duration || 0,
      });
    };

    audio.onended = () => {
      setCustomMedia((prev) => (prev ? { ...prev, isPlaying: false } : null));
    };
  };

  const toggleCustomMediaPlayPause = () => {
    if (!customMediaAudioRef.current) return;
    if (customMedia?.isPlaying) {
      customMediaAudioRef.current.pause();
      setCustomMedia((prev) => (prev ? { ...prev, isPlaying: false } : null));
    } else {
      customMediaAudioRef.current.play();
      setCustomMedia((prev) => (prev ? { ...prev, isPlaying: true } : null));
    }
  };

  const stopCustomMedia = () => {
    if (customMediaAudioRef.current) {
      customMediaAudioRef.current.pause();
      customMediaAudioRef.current.currentTime = 0;
    }
    setCustomMedia(null);
  };

  const formatAudioTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Page Navigation
  const goToNextPage = () => {
    const step = pageOrientation === 'horizontal' ? 2 : 1;
    if (currentPage < 604) {
      setPageTurnAnim('next');
      setCurrentPage((p) => Math.min(604, p + step));
      triggerHaptic(20);
      pageContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setPageTurnAnim(null), 300);
    }
  };

  const goToPrevPage = () => {
    const step = pageOrientation === 'horizontal' ? 2 : 1;
    if (currentPage > 1) {
      setPageTurnAnim('prev');
      setCurrentPage((p) => Math.max(1, p - step));
      triggerHaptic(20);
      pageContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setPageTurnAnim(null), 300);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'mushaf_pages') return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'PageDown') {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === 'ArrowRight' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrevPage();
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (customMedia) {
          toggleCustomMediaPlayPause();
        } else {
          togglePlayPause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentPage, pageOrientation, currentRecitation, customMedia]);

  // Touch Swipe Gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartXRef.current;
    const deltaY = touchEndY - touchStartYRef.current;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) {
        goToNextPage();
      } else {
        goToPrevPage();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const handleJumpToPage = (pageNum: number) => {
    const p = Math.max(1, Math.min(604, pageNum));
    setCurrentPage(p);
    setShowJumpModal(false);
    setViewMode('mushaf_pages');
    triggerHaptic(20);
    pageContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSurahFromIndex = (surahNumber: number) => {
    const startPage = getSurahStartPage(surahNumber);
    setCurrentPage(startPage);
    setViewMode('mushaf_pages');
    triggerHaptic(20);
    pageContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyAyah = (ayahText: string, surahName: string, numInSurah: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const formatted = `﴿${ayahText}﴾ [سورة ${surahName}: ${numInSurah}]`;
      navigator.clipboard.writeText(formatted);
      setCopiedText(formatted);
      triggerHaptic(15);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  const filteredSurahs = useMemo(() => {
    return SURAH_INDEX.filter((surah) => {
      const matchesSearch =
        !searchQuery.trim() ||
        searchArabicMatches(surah.name, searchQuery) ||
        surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surah.number.toString() === searchQuery.trim();

      const matchesJuz = filterJuz === 'all' || surah.juz === filterJuz;

      return matchesSearch && matchesJuz;
    });
  }, [searchQuery, filterJuz]);

  const rightPageNum = currentPage;
  const leftPageNum = Math.min(604, currentPage + 1);

  const getPageData = (pNum: number) => pagesData[pNum];

  const getHeaderSurahName = (pNum: number) => {
    const pData = getPageData(pNum);
    if (pData && pData.surahs.length > 0) return pData.surahs.join(' و ');
    const meta = SURAH_INDEX.find((s) => s.page === pNum);
    return meta ? meta.name : '';
  };

  /**
   * Real scanned King Fahd Medina Mushaf image URLs with fallbacks
   */
  const getPageImageUrl = (pNum: number) => {
    const pad = pNum.toString().padStart(3, '0');
    return `https://raw.githubusercontent.com/GlobalQuran/images/master/width/1000/page${pad}.png`;
  };

  const getFallbackPageImageUrl = (pNum: number) => {
    const pad = pNum.toString().padStart(3, '0');
    return `https://quran.islam-db.com/public/data/pages/quranpages_1024/images/page${pad}.png`;
  };

  /**
   * Single Mushaf Page Renderer
   */
  const renderSinglePage = (pageNum: number, isRightOfSpread = false, isLeftOfSpread = false) => {
    const pData = getPageData(pageNum);
    const surahName = getHeaderSurahName(pageNum);
    const juzNum = pData?.juz || 1;
    const hasImageError = imageErrorMap[pageNum];
    const shouldUseImage = displayType === 'printed' && !hasImageError;

    return (
      <div
        key={`page-${pageNum}`}
        className={`relative bg-[#fffdf7] dark:bg-[#0c1f1c] rounded-3xl shadow-xl border-4 border-emerald-800/20 dark:border-emerald-700/30 p-3 sm:p-6 min-h-[580px] sm:min-h-[640px] flex flex-col justify-between overflow-hidden transition-all duration-200 ${
          isRightOfSpread ? 'border-l-2 sm:rounded-l-none' : ''
        } ${isLeftOfSpread ? 'border-r-2 sm:rounded-r-none' : ''}`}
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(217, 119, 6, 0.02) 0%, transparent 80%)',
        }}
      >
        {/* Double Gold Ornamental Frame */}
        <div className="absolute inset-1.5 sm:inset-2.5 border border-amber-600/30 dark:border-amber-500/20 rounded-2xl pointer-events-none" />
        <div className="absolute inset-2.5 sm:inset-3.5 border border-dashed border-emerald-600/20 dark:border-emerald-500/15 rounded-[14px] pointer-events-none" />

        {/* Page Top Header Bar */}
        <div className="relative z-10 border-b border-amber-600/30 dark:border-amber-500/20 pb-2 mb-3 flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>الجزء {juzNum}</span>
          </div>

          <div className="text-center font-quran text-sm sm:text-base text-amber-700 dark:text-amber-400">
            {surahName ? `سورة ${surahName}` : ''}
          </div>

          <div className="flex items-center gap-1">
            <span>الحزب {Math.floor((juzNum - 1) * 2) + 1}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          </div>
        </div>

        {/* Page Content Body */}
        <div className="relative z-10 flex-1 flex flex-col justify-center my-auto py-1">
          {shouldUseImage ? (
            /* EXACT PRINTED MEDINA MUSHAF PAGE (المصحف الورقي الحقيقي) */
            <div className="w-full flex items-center justify-center relative min-h-[460px]">
              <img
                src={getPageImageUrl(pageNum)}
                alt={`مصحف المدينة صفحة ${pageNum}`}
                loading="eager"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.fallbackTried) {
                    target.dataset.fallbackTried = 'true';
                    target.src = getFallbackPageImageUrl(pageNum);
                  } else {
                    setImageErrorMap((prev) => ({ ...prev, [pageNum]: true }));
                  }
                }}
                className="max-h-[740px] w-auto max-w-full object-contain filter contrast-[1.04] brightness-[0.99] dark:invert dark:contrast-125 select-none rounded-lg"
              />
            </div>
          ) : (
            /* TEXT VECTOR ENGINE */
            <div className="space-y-3.5 text-justify select-text">
              {pData ? (
                <>
                  {/* Surah headers & Bismillah */}
                  {pData.entries.map((entry: PageEntry, index: number) => {
                    if (entry.type === 'surah_header') {
                      return (
                        <div
                          key={`hdr-${index}`}
                          className="my-3 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-amber-200 text-center border-2 border-amber-500/40 shadow-sm"
                        >
                          <h3 className="font-quran text-base sm:text-lg font-bold tracking-wide">
                            سورة {entry.surahName}
                          </h3>
                          <p className="text-[10px] text-emerald-200/80">
                            {entry.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {entry.numberOfAyahs} آيات
                          </p>
                        </div>
                      );
                    }

                    if (entry.type === 'bismillah') {
                      return (
                        <div key={`bsm-${index}`} className="my-2 text-center">
                          <p className="font-quran text-base sm:text-lg text-amber-700 dark:text-amber-300 font-bold select-none">
                            {entry.text}
                          </p>
                        </div>
                      );
                    }

                    return null;
                  })}

                  {/* SEPARATED AYAHS MODE (الآيات منفصلة في بطاقات مميزة كما طلب المستخدم) */}
                  {ayahLayout === 'separated' ? (
                    <div className="space-y-3 my-2">
                      {pData.entries
                        .filter((e) => e.type === 'ayah')
                        .map((ayahEntry, idx) => {
                          const isCurrentReciting =
                            currentRecitation &&
                            currentRecitation.surahNumber === ayahEntry.surahNumber &&
                            currentRecitation.ayahNumber === ayahEntry.numberInSurah;

                          const isInConfiguredRange =
                            rangeConfig.enabled &&
                            rangeConfig.surahNumber === ayahEntry.surahNumber &&
                            (ayahEntry.numberInSurah || 0) >= rangeConfig.fromAyah &&
                            (ayahEntry.numberInSurah || 0) <= rangeConfig.toAyah;

                          return (
                            <div
                              key={`ayah-sep-${idx}`}
                              id={`ayah-block-${ayahEntry.surahNumber}-${ayahEntry.numberInSurah}`}
                              onClick={() => handleAyahClick(ayahEntry)}
                              onTouchStart={() => handleAyahTouchStart(ayahEntry)}
                              onTouchEnd={() => handleAyahTouchEnd(ayahEntry)}
                              onMouseDown={() => handleAyahTouchStart(ayahEntry)}
                              onMouseUp={() => handleAyahTouchEnd(ayahEntry)}
                              className={`p-3 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer text-right ${
                                isCurrentReciting
                                  ? 'bg-amber-100/90 dark:bg-amber-950/80 border-amber-400 ring-2 ring-amber-400 shadow-md scale-[1.01]'
                                  : isInConfiguredRange
                                  ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-300/80 dark:border-amber-700/60 shadow-xs'
                                  : 'bg-white/80 dark:bg-[#071311]/80 border-gray-200/80 dark:border-emerald-950 hover:border-emerald-400 dark:hover:border-emerald-700'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-emerald-950/60 pb-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-bold text-amber-700 dark:text-amber-300 text-xs font-quran">
                                    {ayahEntry.numberInSurah}
                                  </span>
                                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400">
                                    سورة {ayahEntry.surahName}
                                  </span>
                                  {isInConfiguredRange && !isCurrentReciting && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-400/30">
                                      نطاق التكرار 🔁
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-[10px]">
                                  {isCurrentReciting ? (
                                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                                      <Volume2 className="w-3.5 h-3.5" />
                                      <span>يتلو الآن: {currentReciter.name.split(' ')[1] || ''}</span>
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">اضغط مطولاً للبدء</span>
                                  )}
                                </div>
                              </div>

                              <p
                                className="font-quran text-gray-900 dark:text-gray-100 leading-[2.6] sm:leading-[2.8] text-right"
                                style={{ fontSize: `${Math.max(17, fontSize + 1)}px` }}
                              >
                                {ayahEntry.text}{' '}
                                <span className="inline-flex items-center justify-center font-bold text-amber-600 dark:text-amber-400 mx-1 text-base select-none">
                                  ۝{ayahEntry.numberInSurah}
                                </span>
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    /* CONTINUOUS TEXT MODE (عرض النص المتصل) */
                    <p
                      className="font-quran text-gray-900 dark:text-gray-100 leading-[2.5] sm:leading-[2.7] text-justify antialiased"
                      style={{ fontSize: `${Math.max(16, fontSize + (pageOrientation === 'horizontal' ? 0 : 2))}px` }}
                    >
                      {pData.entries
                        .filter((e) => e.type === 'ayah')
                        .map((ayahEntry, idx) => {
                          const isCurrentReciting =
                            currentRecitation &&
                            currentRecitation.surahNumber === ayahEntry.surahNumber &&
                            currentRecitation.ayahNumber === ayahEntry.numberInSurah;

                          const isInConfiguredRange =
                            rangeConfig.enabled &&
                            rangeConfig.surahNumber === ayahEntry.surahNumber &&
                            (ayahEntry.numberInSurah || 0) >= rangeConfig.fromAyah &&
                            (ayahEntry.numberInSurah || 0) <= rangeConfig.toAyah;

                          return (
                            <span
                              key={`ayah-${idx}`}
                              onClick={() => handleAyahClick(ayahEntry)}
                              onTouchStart={() => handleAyahTouchStart(ayahEntry)}
                              onTouchEnd={() => handleAyahTouchEnd(ayahEntry)}
                              onMouseDown={() => handleAyahTouchStart(ayahEntry)}
                              onMouseUp={() => handleAyahTouchEnd(ayahEntry)}
                              className={`inline cursor-pointer rounded-lg transition-all duration-300 px-1 py-0.5 ${
                                isCurrentReciting
                                  ? 'bg-amber-300/90 dark:bg-amber-500/30 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500 font-bold shadow-md scale-[1.02] inline-block'
                                  : isInConfiguredRange
                                  ? 'bg-amber-100/60 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 border-b-2 border-amber-400'
                                  : 'hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-gray-900 dark:text-gray-100'
                              }`}
                              title={`سورة ${ayahEntry.surahName}: آية ${ayahEntry.numberInSurah} (اضغط مطولاً لبدء تلاوة ${currentReciter.name})`}
                            >
                              {ayahEntry.text}{' '}
                              <span
                                className={`inline-flex items-center justify-center font-bold mx-0.5 text-[0.82em] select-none ${
                                  isCurrentReciting
                                    ? 'text-amber-700 dark:text-amber-300 font-extrabold scale-110'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                ۝{ayahEntry.numberInSurah}
                              </span>{' '}
                            </span>
                          );
                        })}
                    </p>
                  )}
                </>
              ) : (
                <div className="py-20 text-center text-gray-400">
                  <p>جارٍ تحميل الصفحة {pageNum}...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Page Footer (Page Number Medallion) */}
        <div className="relative z-10 border-t border-amber-600/30 dark:border-amber-500/20 pt-2 mt-3 text-center">
          <div className="inline-flex w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-800/10 dark:bg-emerald-800/30 border border-amber-500/40 items-center justify-center font-bold text-amber-700 dark:text-amber-300 font-quran text-xs sm:text-sm shadow-inner">
            {pageNum}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-28 select-none relative">
      {/* Hidden file inputs for audio & video extraction from device */}
      <input
        ref={audioFileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleDeviceAudioUpload}
      />
      <input
        ref={videoFileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleDeviceVideoUpload}
      />

      {/* ================= TOP CONTROLS & SWITCHERS BAR ================= */}
      <div className="bg-white dark:bg-[#0c1f1c] rounded-2xl p-2.5 sm:p-3 shadow-sm border border-emerald-100 dark:border-emerald-950/80 space-y-2.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Main View Mode (Mushaf Pages vs Index) */}
          <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('mushaf_pages')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'mushaf_pages'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>المصحف ({currentPage}/604)</span>
            </button>

            <button
              onClick={() => setViewMode('surah_index')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'surah_index'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <Search className="w-4 h-4 text-emerald-400" />
              <span>فهرس السور (114)</span>
            </button>
          </div>

          {/* Quick Controls Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Direct Quick Button: المصحف المعلم (المنشاوي والحصري) */}
            <button
              onClick={() => {
                if (currentReciter.category === 'muallim') {
                  const nextId =
                    selectedReciterId === 'minshawi_muallim' || selectedReciterId === 'minshawi_kids'
                      ? 'husary_muallim'
                      : 'minshawi_muallim';
                  selectReciter(nextId);
                  setCopiedText(
                    nextId === 'husary_muallim'
                      ? 'تم التبديل إلى: المصحف المعلم - الشيخ الحصري 🎓'
                      : 'تم التبديل إلى: المصحف المعلم - الشيخ المنشاوي 🎓'
                  );
                } else {
                  selectReciter('minshawi_muallim');
                  setCopiedText('تم تفعيل: المصحف المعلم - الشيخ المنشاوي مع ترديد الأطفال 🎓');
                }
                setTimeout(() => setCopiedText(null), 3000);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 ${
                currentReciter.category === 'muallim'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-400 font-extrabold'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900'
              }`}
              title="المصحف المعلم (المنشاوي والحصري وترديد الأطفال) - انقر للتبديل السريع"
            >
              <GraduationCap className="w-4 h-4 text-amber-500" />
              <span>
                {currentReciter.category === 'muallim'
                  ? `المعلم: ${selectedReciterId.includes('minshawi') ? 'المنشاوي 🎓' : 'الحصري 🎓'}`
                  : 'المصحف المعلم 🎓'}
              </span>
            </button>

            {/* Reciter Selector Trigger Button */}
            <button
              onClick={() => setShowReciterModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
              title="تغيير القارئ (المصحف المعلم المنشاوي والحصري، المعيقلي، الدوسري...)"
            >
              <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="truncate max-w-[130px] sm:max-w-[160px]">{getReciterShortName(currentReciter)}</span>
            </button>

            {/* Optional Range & Repeat Button (تحديد نطاق وتكرار للتحفيظ) */}
            <button
              onClick={() => {
                const pData = getPageData(currentPage);
                const sNum = pData?.entries.find((e) => e.type === 'ayah')?.surahNumber || rangeConfig.surahNumber;
                setRangeConfig((prev) => ({ ...prev, surahNumber: sNum }));
                setShowRangeModal(true);
                triggerHaptic(15);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                rangeConfig.enabled
                  ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-400 shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900'
              }`}
              title="تحديد نطاق وتكرار الآيات للتحفيظ لكافة الشيوخ (اختياري)"
            >
              <Repeat className={`w-3.5 h-3.5 ${rangeConfig.enabled ? 'animate-spin' : ''}`} />
              <span>{rangeConfig.enabled ? `تكرار (${rangeConfig.fromAyah}-${rangeConfig.toAyah})` : 'نطاق وتكرار'}</span>
            </button>

            {/* Custom Audio/Video Upload Trigger Button */}
            <button
              onClick={() => setShowMediaUploadModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900 text-xs font-bold transition cursor-pointer"
              title="استيراد صوت أو استخراج صوت من فيديو بهاتفك"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>صوت/فيديو</span>
            </button>

            {/* SEGMENTED 1: Vertical vs Horizontal (صفحة واحدة vs صفحتان) */}
            <div className="flex items-center bg-gray-100 dark:bg-emerald-950/60 p-1 rounded-xl border border-gray-200 dark:border-emerald-900/60">
              <button
                onClick={() => {
                  setPageOrientation('vertical');
                  triggerHaptic(15);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  pageOrientation === 'vertical'
                    ? 'bg-white dark:bg-emerald-700 text-emerald-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
                }`}
                title="عرض صفحة واحدة فقط (نمط عمودي)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>صفحة واحدة</span>
              </button>

              <button
                onClick={() => {
                  setPageOrientation('horizontal');
                  triggerHaptic(15);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  pageOrientation === 'horizontal'
                    ? 'bg-white dark:bg-emerald-700 text-emerald-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
                }`}
                title="عرض صفحتين متقابلتين كالمصحف المفتوح (نمط أفقي)"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>صفحتان</span>
              </button>
            </div>

            {/* SEGMENTED 2: Printed vs Text (ورقي vs نصي) */}
            <div className="flex items-center bg-gray-100 dark:bg-emerald-950/60 p-1 rounded-xl border border-gray-200 dark:border-emerald-900/60">
              <button
                onClick={() => {
                  setDisplayType('printed');
                  triggerHaptic(15);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  displayType === 'printed'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
                }`}
                title="مصحف المدينة المنورة المصور الحقيقي (ورقي)"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>ورقي</span>
              </button>

              <button
                onClick={() => {
                  setDisplayType('text');
                  triggerHaptic(15);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  displayType === 'text'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
                }`}
                title="مصحف الآيات المرمز بالنص وتحديد التلاوة (نصي)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>نصي</span>
              </button>
            </div>

            {/* Quick Page Jump & Bookmark */}
            <button
              onClick={() => setShowJumpModal(true)}
              className="p-1.5 rounded-xl bg-gray-100 dark:bg-emerald-950/60 hover:bg-emerald-100 text-gray-700 dark:text-gray-200 text-xs font-semibold border border-gray-200 dark:border-emerald-950 transition cursor-pointer"
              title="انتقال سريع برقم الصفحة"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const pData = getPageData(currentPage);
                if (pData && pData.entries.length > 0) {
                  const firstAyah = pData.entries.find((e) => e.type === 'ayah');
                  if (firstAyah && firstAyah.surahNumber) {
                    onSetLastRead(firstAyah.surahNumber, firstAyah.numberInSurah || 1);
                  }
                }
                triggerHaptic(25);
              }}
              className="p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition cursor-pointer"
              title="حفظ موضع القراءة"
            >
              <Bookmark className="w-4 h-4 text-amber-500" />
            </button>
          </div>
        </div>
      </div>

      {/* ===================== VIEW 1: MUSHAF PAGES MODE ===================== */}
      {viewMode === 'mushaf_pages' && (
        <div className="space-y-4">
          {/* Top Page Info Bar */}
          <div className="bg-white dark:bg-[#0c1f1c] rounded-2xl p-2.5 px-4 shadow-xs border border-emerald-100 dark:border-emerald-950/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-200">
              {pageOrientation === 'horizontal' ? (
                <>
                  <span>صفحتا {rightPageNum} و {leftPageNum} من 604</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    الجزء {getPageData(rightPageNum)?.juz || 1}
                  </span>
                </>
              ) : (
                <>
                  <span>صفحة {currentPage} من 604</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    الجزء {getPageData(currentPage)?.juz || 1}
                  </span>
                </>
              )}
            </div>

            {/* In Text Mode: Ayah Separation Switcher */}
            {displayType === 'text' && (
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-emerald-950/40 p-1 rounded-xl">
                <button
                  onClick={() => {
                    setAyahLayout('separated');
                    triggerHaptic(15);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    ayahLayout === 'separated'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                  title="عرض كل آية منفصلة في بطاقة واضحة"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>آيات منفصلة</span>
                </button>

                <button
                  onClick={() => {
                    setAyahLayout('continuous');
                    triggerHaptic(15);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    ayahLayout === 'continuous'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                  title="عرض الآيات مدمجة كنص مصحف متصل"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                  <span>نص متصل</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setShowJumpModal(true)}
              className="px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg hover:bg-emerald-100 cursor-pointer"
            >
              انتقال لصفحة
            </button>
          </div>

          {/* Active Repetition Range Banner (عند تفعيل هذا الخيار الاختياري) */}
          {rangeConfig.enabled && (
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 border-2 border-amber-400/80 rounded-2xl p-2.5 px-4 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" />
                <span className="font-bold text-gray-900 dark:text-white">
                  وضع التكرار نشط: سورة {SURAH_INDEX.find((s) => s.number === rangeConfig.surahNumber)?.name} (الآيات {rangeConfig.fromAyah} إلى {rangeConfig.toAyah})
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px]">
                  التكرار {rangeConfig.currentRepeat} من {rangeConfig.repeatCount === 0 ? '∞' : rangeConfig.repeatCount}
                </span>
                <span className="text-emerald-700 dark:text-emerald-300 font-medium hidden sm:inline">
                  • بصوت {currentReciter.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRangeModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] transition cursor-pointer shadow-xs"
                >
                  تعديل النطاق
                </button>
                <button
                  onClick={cancelRangeRecitation}
                  className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-emerald-950/80 text-rose-600 dark:text-rose-400 font-bold text-[11px] hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-gray-200 dark:border-emerald-900 transition cursor-pointer"
                >
                  إلغاء التكرار
                </button>
              </div>
            </div>
          )}

          {/* ================= THE MUSHAF CONTAINER ================= */}
          <div
            ref={pageContainerRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`transition-opacity duration-200 ${
              pageTurnAnim ? 'opacity-70 scale-[0.99]' : 'opacity-100 scale-100'
            }`}
          >
            {pageOrientation === 'horizontal' ? (
              /* HORIZONTAL TWO-PAGE SPREAD */
              <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-0 bg-amber-900/10 p-1 lg:p-3 rounded-3xl border-4 border-amber-800/30 shadow-2xl">
                <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-black/15 via-black/35 to-black/15 z-20 pointer-events-none rounded-sm" />
                <div className="relative">
                  {renderSinglePage(rightPageNum, true, false)}
                </div>
                <div className="relative">
                  {leftPageNum <= 604 && renderSinglePage(leftPageNum, false, true)}
                </div>
              </div>
            ) : (
              /* VERTICAL SINGLE PAGE MODE */
              <div>{renderSinglePage(currentPage)}</div>
            )}
          </div>

          {/* ================= PROMINENT BOTTOM CONTROLS ================= */}
          <div className="bg-white dark:bg-[#0c1f1c] rounded-2xl p-3 shadow-lg border-2 border-emerald-500/30 flex items-center justify-between gap-3">
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer ${
                currentPage <= 1
                  ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-emerald-950/20 text-gray-400'
                  : 'bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white active:scale-95'
              }`}
            >
              <ChevronRight className="w-5 h-5 text-amber-300" />
              <span>
                {pageOrientation === 'horizontal' ? 'الصفحتان السابقتان' : 'الصفحة السابقة'}
              </span>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowJumpModal(true)}
                className="px-3.5 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="انتقال برقم الصفحة أو الجزء"
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                <span>
                  {pageOrientation === 'horizontal'
                    ? `صفحة ${rightPageNum} - ${leftPageNum}`
                    : `صفحة ${currentPage}`}
                </span>
              </button>
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage >= 604}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer ${
                currentPage >= 604
                  ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-emerald-950/20 text-gray-400'
                  : 'bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white active:scale-95'
              }`}
            >
              <span>
                {pageOrientation === 'horizontal' ? 'الصفحتان التاليتان' : 'الصفحة التالية'}
              </span>
              <ChevronLeft className="w-5 h-5 text-amber-300" />
            </button>
          </div>

          {/* Swipe helper on mobile */}
          <div className="text-center text-[11px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2 py-1">
            <MoveHorizontal className="w-3.5 h-3.5 text-amber-500" />
            <span>اضغط مطولاً على أي آية للبدء بصوت {currentReciter.name}، أو اسحب بإصبعك لتقليب الصفحات</span>
          </div>

          {/* Toast Notification */}
          {copiedText && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-900 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-amber-400" />
              <span>{copiedText}</span>
            </div>
          )}
        </div>
      )}

      {/* ================= 2. CUSTOM DEVICE AUDIO / EXTRACTED VIDEO PLAYER BAR ================= */}
      {customMedia && (
        <div className="fixed left-3 right-3 sm:left-auto sm:right-6 bottom-24 sm:bottom-28 z-40 max-w-sm w-full bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white p-3.5 rounded-2xl shadow-2xl border-2 border-emerald-400 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-800/60 mb-2">
            <div className="flex items-center gap-2 overflow-hidden">
              {customMedia.isExtractedFromVideo ? (
                <Film className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Music className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <div className="truncate">
                <span className="text-[10px] text-amber-300 font-bold block">
                  {customMedia.isExtractedFromVideo ? 'صوت مستخرج من فيديو:' : 'ملف صوتي من جهازك:'}
                </span>
                <p className="text-xs font-bold truncate text-white">{customMedia.fileName}</p>
              </div>
            </div>

            <button
              onClick={stopCustomMedia}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white"
              title="إغلاق الصوت"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Time & Play Controls */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={toggleCustomMediaPlayPause}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              {customMedia.isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{customMedia.isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}</span>
            </button>

            <span className="text-[11px] font-mono text-emerald-200">
              {formatAudioTime(customMediaTime.current)} / {formatAudioTime(customMediaTime.duration)}
            </span>
          </div>
        </div>
      )}

      {/* ================= 3. FLOATING SIDE RECITATION CONTROLS (زرار القارئ في الجنب) ================= */}
      {viewMode === 'mushaf_pages' && !customMedia && (
        <div className="fixed right-3 sm:right-6 bottom-24 sm:bottom-8 z-40 flex flex-col items-end gap-2">
          {/* Expanded Recitation Dock */}
          {isSidePlayerOpen ? (
            <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl border-2 border-amber-400/80 max-w-[320px] sm:max-w-xs w-full animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-sm">
                    {getReciterIcon(currentReciter.category)}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-amber-200">{currentReciter.name}</h5>
                    <p className="text-[10px] text-emerald-300">{currentReciter.style}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowReciterModal(true)}
                    className="p-1 rounded-lg hover:bg-white/10 text-amber-300"
                    title="تغيير القارئ"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsSidePlayerOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/10 text-emerald-300 cursor-pointer"
                    title="تصغير المشغل"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Current Active Ayah Indicator */}
              <div className="p-2 rounded-xl bg-black/25 border border-emerald-700/50 mb-3 text-center">
                {currentRecitation ? (
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-amber-300 font-bold block">
                      {currentRecitation.isPlaying ? 'يتلو الآن:' : 'متوقف مؤقتاً عند:'}
                    </span>
                    <h6 className="font-quran text-sm font-bold text-white">
                      سورة {currentRecitation.surahName} - الآية {currentRecitation.ayahNumber}
                    </h6>
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-200">
                    انقر تشغيل أو اضغط مطولاً على أي آية للبدء منها
                  </p>
                )}

                {/* Range & Repeat Status Badge if Active */}
                {rangeConfig.enabled && (
                  <div className="mt-2 pt-1.5 border-t border-emerald-800/60 flex items-center justify-between text-[10px] text-amber-300">
                    <span className="flex items-center gap-1">
                      <Repeat className="w-3 h-3 text-amber-400 animate-spin" />
                      <span>تكرار آيات {rangeConfig.fromAyah} - {rangeConfig.toAyah}</span>
                    </span>
                    <span className="bg-amber-500/20 px-1.5 py-0.5 rounded-md font-mono text-white">
                      تكرار {rangeConfig.currentRepeat}/{rangeConfig.repeatCount === 0 ? '∞' : rangeConfig.repeatCount}
                    </span>
                  </div>
                )}
              </div>

              {/* Player Control Buttons */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handlePrevAyah}
                  disabled={!currentRecitation}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition cursor-pointer"
                  title="الآية السابقة"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePlayPause}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-lg flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  {audioLoading ? (
                    <span>جارٍ التحميل...</span>
                  ) : currentRecitation?.isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>إيقاف مؤقت</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>{currentRecitation ? 'متابعة' : 'بدء التلاوة'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleNextAyah()}
                  disabled={!currentRecitation}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition cursor-pointer"
                  title="الآية التالية"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {currentRecitation && (
                  <button
                    onClick={stopRecitation}
                    className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition cursor-pointer"
                    title="إنهاء التلاوة"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                )}
              </div>

              {/* Optional Range & Repeat Toggle in Player */}
              <div className="mt-2.5 pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => {
                    const pData = getPageData(currentPage);
                    const sNum = pData?.entries.find((e) => e.type === 'ayah')?.surahNumber || rangeConfig.surahNumber;
                    setRangeConfig((prev) => ({ ...prev, surahNumber: sNum }));
                    setShowRangeModal(true);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition cursor-pointer font-bold ${
                    rangeConfig.enabled
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-white/10 hover:bg-white/20 text-emerald-200'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>{rangeConfig.enabled ? 'تعديل النطاق والتكرار' : '🔁 تكرار ونطاق محدد'}</span>
                </button>

                {rangeConfig.enabled && (
                  <button
                    onClick={cancelRangeRecitation}
                    className="text-rose-300 hover:text-rose-200 text-[10px] cursor-pointer"
                  >
                    إلغاء التكرار
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Minimized Side Button */
            <button
              onClick={() => setIsSidePlayerOpen(true)}
              className={`p-3 rounded-2xl shadow-2xl flex items-center gap-2 font-bold text-xs transition-all cursor-pointer border-2 active:scale-95 ${
                currentRecitation?.isPlaying
                  ? 'bg-amber-500 text-slate-950 border-white ring-4 ring-amber-400/40 animate-pulse'
                  : 'bg-emerald-900 text-white border-amber-400 hover:bg-emerald-800'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                {getReciterIcon(currentReciter.category)}
              </div>
              <span className="hidden sm:inline">{getReciterShortName(currentReciter)}</span>
              {currentRecitation?.isPlaying && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
          )}
        </div>
      )}

      {/* ================= 4. RECITERS SELECTION MODAL ================= */}
      {showReciterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c1f1c] rounded-3xl p-4 sm:p-5 shadow-2xl border border-emerald-600/30 text-right space-y-3.5 max-h-[88vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-emerald-950 pb-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    اختر قارئ القرآن الكريم المفضل
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    المصحف المعلم للتحفيظ، المصاحف المرتلة، والمصاحف المجودة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReciterModal(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-emerald-950/60 text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={reciterSearchTerm}
                onChange={(e) => setReciterSearchTerm(e.target.value)}
                placeholder="ابحث عن قارئك (المنشاوي، الحصري، المعلم، المعيقلي، الدوسري...)"
                className="w-full pr-9 pl-3 py-2 rounded-xl bg-gray-50 dark:bg-[#071311] border border-gray-200 dark:border-emerald-950 text-xs font-semibold text-gray-900 dark:text-white outline-hidden focus:border-emerald-500"
              />
              {reciterSearchTerm && (
                <button
                  onClick={() => setReciterSearchTerm('')}
                  className="absolute left-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => {
                  setReciterCategoryFilter('all');
                  triggerHaptic(10);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  reciterCategoryFilter === 'all'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-emerald-950/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                الكل
              </button>

              <button
                onClick={() => {
                  setReciterCategoryFilter('muallim');
                  triggerHaptic(10);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  reciterCategoryFilter === 'muallim'
                    ? 'bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-400 font-extrabold'
                    : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/20'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>المصحف المعلم (المنشاوي والحصري) 🎓</span>
              </button>

              <button
                onClick={() => {
                  setReciterCategoryFilter('murattal');
                  triggerHaptic(10);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  reciterCategoryFilter === 'murattal'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-emerald-950/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                🎙️ المصاحف المرتلة
              </button>

              <button
                onClick={() => {
                  setReciterCategoryFilter('mujawwad');
                  triggerHaptic(10);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  reciterCategoryFilter === 'mujawwad'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-emerald-950/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                📜 المصاحف المجودة
              </button>
            </div>

            {/* Spotlight Banner: المصحف المعلم (المنشاوي والحصري) */}
            {(reciterCategoryFilter === 'all' || reciterCategoryFilter === 'muallim') && !reciterSearchTerm && (
              <div className="p-3 rounded-2xl bg-linear-to-r from-emerald-900 to-teal-900 text-white border-2 border-amber-400/60 shadow-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎓</span>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-amber-300">
                        المصحف المعلم (للتحفيظ وترديد الآيات)
                      </h4>
                      <p className="text-[10.5px] text-emerald-200">
                        قراءة متقنة آية بآية مع ترديد وترتيل تعليمي
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/40 font-bold shrink-0">
                    موصى به للتحفيظ ⭐
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Minshawi Muallim Button */}
                  <button
                    onClick={() => {
                      selectReciter('minshawi_muallim');
                      setShowReciterModal(false);
                      setCopiedText('تم تفعيل: المصحف المعلم - الشيخ المنشاوي مع ترديد الأطفال 🎓');
                      setTimeout(() => setCopiedText(null), 3000);
                    }}
                    className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between cursor-pointer active:scale-98 ${
                      selectedReciterId === 'minshawi_muallim' || selectedReciterId === 'minshawi_kids'
                        ? 'bg-amber-500 text-slate-950 font-bold border-white ring-2 ring-amber-300'
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1">
                        <span>🎓 المنشاوي (المعلم)</span>
                        {(selectedReciterId === 'minshawi_muallim' || selectedReciterId === 'minshawi_kids') && (
                          <span className="text-[9px] bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-md font-bold">
                            المفعل
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5">ترديد الأطفال آية بآية</div>
                    </div>
                    {(selectedReciterId === 'minshawi_muallim' || selectedReciterId === 'minshawi_kids') ? (
                      <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                    ) : (
                      <Play className="w-3.5 h-3.5 opacity-70" />
                    )}
                  </button>

                  {/* Husary Muallim Button */}
                  <button
                    onClick={() => {
                      selectReciter('husary_muallim');
                      setShowReciterModal(false);
                      setCopiedText('تم تفعيل: المصحف المعلم - الشيخ الحصري مع التجويد والترديد 🎓');
                      setTimeout(() => setCopiedText(null), 3000);
                    }}
                    className={`p-2.5 rounded-xl border text-right transition flex items-center justify-between cursor-pointer active:scale-98 ${
                      selectedReciterId === 'husary_muallim' || selectedReciterId === 'husary_kids'
                        ? 'bg-amber-500 text-slate-950 font-bold border-white ring-2 ring-amber-300'
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1">
                        <span>🎓 الحصري (المعلم)</span>
                        {(selectedReciterId === 'husary_muallim' || selectedReciterId === 'husary_kids') && (
                          <span className="text-[9px] bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-md font-bold">
                            المفعل
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5">إتقان مخارج الحروف وأحكام التجويد</div>
                    </div>
                    {(selectedReciterId === 'husary_muallim' || selectedReciterId === 'husary_kids') ? (
                      <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                    ) : (
                      <Play className="w-3.5 h-3.5 opacity-70" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Reciters List */}
            <div className="overflow-y-auto space-y-2 p-1 scrollbar-thin flex-1 max-h-80">
              {RECITERS_LIST.filter((reciter) => {
                // Exclude legacy duplicates
                if (['minshawi_kids', 'husary_kids'].includes(reciter.id)) return false;

                // Category filter
                if (reciterCategoryFilter !== 'all') {
                  if (reciterCategoryFilter === 'muallim' && reciter.category !== 'muallim') return false;
                  if (reciterCategoryFilter === 'murattal' && reciter.category !== 'murattal') return false;
                  if (reciterCategoryFilter === 'mujawwad' && reciter.category !== 'mujawwad') return false;
                }

                // Search query filter
                if (reciterSearchTerm.trim()) {
                  const q = reciterSearchTerm.trim().toLowerCase();
                  const matchName = reciter.name.toLowerCase().includes(q);
                  const matchStyle = reciter.style.toLowerCase().includes(q);
                  const matchBadge = reciter.badge.toLowerCase().includes(q);
                  return matchName || matchStyle || matchBadge;
                }

                return true;
              }).map((reciter) => {
                const isSelected =
                  selectedReciterId === reciter.id ||
                  (reciter.id === 'minshawi_muallim' && selectedReciterId === 'minshawi_kids') ||
                  (reciter.id === 'husary_muallim' && selectedReciterId === 'husary_kids');

                const isMuallim = reciter.category === 'muallim';

                return (
                  <div
                    key={reciter.id}
                    onClick={() => {
                      selectReciter(reciter.id);
                      setShowReciterModal(false);
                      setCopiedText(`تم اختيار: ${reciter.name}`);
                      setTimeout(() => setCopiedText(null), 2500);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between active:scale-[0.99] ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                        : isMuallim
                        ? 'bg-emerald-50/60 dark:bg-[#071311] border-emerald-300 dark:border-emerald-900 hover:border-amber-400'
                        : 'bg-gray-50 dark:bg-[#071311] border-gray-200 dark:border-emerald-950/60 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg ${
                          isMuallim
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold'
                            : 'bg-emerald-500/10 border-emerald-500/30'
                        }`}
                      >
                        {getReciterIcon(reciter.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                            {reciter.name}
                          </h4>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                              isMuallim
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {reciter.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{reciter.style}</p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500 text-slate-950'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional Range & Repeat Section for all Sheikhs */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Repeat className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                    تحديد نطاق الآيات والتكرار (اختياري)
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {rangeConfig.enabled
                      ? `مفعل: سورة ${SURAH_INDEX.find((s) => s.number === rangeConfig.surahNumber)?.name || ''} (آية ${rangeConfig.fromAyah} - ${rangeConfig.toAyah}) • تكرار ${rangeConfig.repeatCount === 0 ? '∞' : rangeConfig.repeatCount} مرات`
                      : 'تحديد من آية كذا لكذا مع التكرار لأي قارئ تختاره'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowReciterModal(false);
                  setShowRangeModal(true);
                  triggerHaptic(20);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shrink-0 shadow-xs"
              >
                {rangeConfig.enabled ? 'تعديل النطاق' : 'تحديد وتكرار'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. MEDIA UPLOAD & VIDEO EXTRACTION MODAL ================= */}
      {showMediaUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1f1c] rounded-3xl p-6 shadow-2xl border border-emerald-600/30 text-right space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-emerald-950 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  استيراد صوت أو استخراج صوت من فيديو
                </h3>
              </div>
              <button
                onClick={() => setShowMediaUploadModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-emerald-950/60 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              يمكنك تشغيل أي تلاوة أو تسجيل من هاتفك، أو استخراج الصوت من أي مقطع فيديو مسجل على جهازك للاستماع له أثناء قراءة المصحف:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => videoFileInputRef.current?.click()}
                className="p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border-2 border-amber-500/40 text-center space-y-2 transition cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-md group-hover:scale-105 transition">
                  <Film className="w-5 h-5" />
                </div>
                <h5 className="font-bold text-xs text-gray-900 dark:text-white">استخراج الصوت من فيديو</h5>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">اختر فيديو من ألبوم الكاميرا أو الملفات</p>
              </button>

              <button
                onClick={() => audioFileInputRef.current?.click()}
                className="p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border-2 border-emerald-500/40 text-center space-y-2 transition cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-md group-hover:scale-105 transition">
                  <Music className="w-5 h-5" />
                </div>
                <h5 className="font-bold text-xs text-gray-900 dark:text-white">ملف صوتي من جهازك</h5>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">اختر ملف MP3 أو WAV أو M4A مسجل</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 6. AYAH QUICK ACTION MODAL (CLICK POPUP) ================= */}
      {selectedAyahAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#0c1f1c] rounded-3xl p-5 shadow-2xl border border-emerald-600/30 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center mx-auto text-xl">
              📖
            </div>

            <div>
              <h4 className="font-bold text-base font-quran text-gray-900 dark:text-white">
                سورة {selectedAyahAction.surahName} - الآية {selectedAyahAction.numberInSurah}
              </h4>
              <p className="text-xs font-quran text-gray-600 dark:text-gray-300 mt-2 p-3 bg-gray-50 dark:bg-[#071311] rounded-xl border border-gray-200 dark:border-emerald-950 max-h-28 overflow-y-auto leading-relaxed">
                ﴿{selectedAyahAction.text}﴾
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  if (selectedAyahAction.surahNumber && selectedAyahAction.numberInSurah) {
                    playAyahRecitation(
                      selectedAyahAction.surahNumber,
                      selectedAyahAction.numberInSurah,
                      selectedAyahAction.surahName
                    );
                    setSelectedAyahAction(null);
                    triggerHaptic(30);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Play className="w-4 h-4 fill-current text-amber-300" />
                <span>بدء التلاوة بصوت {currentReciter.name}</span>
              </button>

              <button
                onClick={() => {
                  if (selectedAyahAction.surahNumber && selectedAyahAction.numberInSurah) {
                    const sNum = selectedAyahAction.surahNumber;
                    const aNum = selectedAyahAction.numberInSurah;
                    const surahMeta = SURAH_INDEX.find((s) => s.number === sNum);
                    const totalA = surahMeta?.numberOfAyahs || 7;
                    setRangeConfig((prev) => ({
                      ...prev,
                      surahNumber: sNum,
                      fromAyah: aNum,
                      toAyah: Math.min(totalA, aNum + 4),
                    }));
                    setSelectedAyahAction(null);
                    setShowRangeModal(true);
                    triggerHaptic(20);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-900 dark:text-amber-200 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Repeat className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>تحديد نطاق وتكرار بدءاً من هذه الآية</span>
              </button>

              <button
                onClick={() => {
                  if (selectedAyahAction.text && selectedAyahAction.surahName && selectedAyahAction.numberInSurah) {
                    handleCopyAyah(
                      selectedAyahAction.text,
                      selectedAyahAction.surahName,
                      selectedAyahAction.numberInSurah
                    );
                    setSelectedAyahAction(null);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-emerald-950/60 hover:bg-gray-200 text-gray-800 dark:text-gray-200 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ الآية الكريمة</span>
              </button>

              <button
                onClick={() => setSelectedAyahAction(null)}
                className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: SURAH INDEX ================= */}
      {viewMode === 'surah_index' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0c1f1c] rounded-2xl p-4 shadow-sm border border-emerald-100 dark:border-emerald-950/80 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute right-3 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن أي سورة من الـ 114 سورة..."
                  className="w-full pr-9 pl-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#071311] border border-gray-200 dark:border-emerald-950 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  الجزء:
                </span>
                <select
                  value={filterJuz}
                  onChange={(e) => setFilterJuz(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-[#071311] border border-gray-200 dark:border-emerald-950 text-xs font-semibold text-gray-800 dark:text-gray-200 outline-hidden cursor-pointer"
                >
                  <option value="all">جميع الأجزاء (30 جزء)</option>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                    <option key={j} value={j}>
                      الجزء {j}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSurahs.map((surah) => {
              const isCurrentPageSurah = surah.page === currentPage;

              return (
                <div
                  key={surah.number}
                  onClick={() => handleSelectSurahFromIndex(surah.number)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md flex items-center justify-between group ${
                    isCurrentPageSurah
                      ? 'bg-amber-50/90 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/40'
                      : 'bg-white dark:bg-[#0c1f1c] border-emerald-100 dark:border-emerald-950/70 hover:border-emerald-300 dark:hover:border-emerald-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-700 group-hover:text-white transition shadow-xs">
                      {surah.number}
                    </div>

                    <div>
                      <h3 className="font-bold text-base font-quran text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition">
                        سورة {surah.name}
                      </h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {surah.numberOfAyahs} آية • صفحة {surah.page}
                      </p>
                    </div>
                  </div>

                  <div className="text-left flex flex-col items-end">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                        surah.revelationType === 'Meccan'
                          ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                      افتح صفحة {surah.page} ←
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK JUMP MODAL */}
      {showJumpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1f1c] rounded-3xl p-6 shadow-2xl border border-emerald-600/30 text-right space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-amber-500" />
              <span>الانتقال السريع في المصحف الشريف</span>
            </h3>

            {/* Jump by Page Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                أدخل رقم الصفحة (1 إلى 604):
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="604"
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  placeholder="مثال: 562"
                  className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#071311] border border-gray-200 dark:border-emerald-950 text-sm font-bold text-gray-900 dark:text-white outline-hidden"
                />
                <button
                  onClick={() => {
                    const num = parseInt(jumpPageInput, 10);
                    if (!isNaN(num)) handleJumpToPage(num);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition cursor-pointer"
                >
                  انتقال
                </button>
              </div>
            </div>

            {/* Quick Juz Jump */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-emerald-950">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                الانتقال إلى جزء محدد:
              </label>
              <div className="grid grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-1 scrollbar-thin">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
                  const juzStartPage = (juzNum - 1) * 20 + 2;
                  return (
                    <button
                      key={juzNum}
                      onClick={() => handleJumpToPage(juzNum === 1 ? 1 : juzStartPage)}
                      className="py-1.5 rounded-lg bg-gray-100 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold text-gray-700 dark:text-gray-200 transition cursor-pointer"
                    >
                      جزء {juzNum}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setShowJumpModal(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-gray-100 dark:bg-emerald-950/80 text-gray-700 dark:text-gray-300 font-semibold text-xs hover:bg-gray-200 transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* ================= 7. RECITATION RANGE & REPETITION MODAL (تحديد النطاق والتكرار لجميع الشيوخ - اختياري) ================= */}
      {showRangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c1f1c] rounded-3xl p-5 sm:p-6 shadow-2xl border border-emerald-600/30 text-right space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-emerald-950 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    تحديد نطاق الآيات والتكرار (اختياري)
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    متاح لكافة الشيوخ المشهورين وقراءة الأطفال
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRangeModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-emerald-950/60 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Optional Activation Toggle Card */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#071311] border border-gray-200 dark:border-emerald-950 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                  تفعيل التكرار والنطاق المحدد
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  خيار اختياري؛ عند إيقافه تستمر التلاوة الطبيعية دون توقف
                </p>
              </div>
              <button
                onClick={() => {
                  setRangeConfig((prev) => {
                    const up = { ...prev, enabled: !prev.enabled };
                    rangeConfigRef.current = up;
                    return up;
                  });
                  triggerHaptic(20);
                }}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  rangeConfig.enabled ? 'bg-amber-500' : 'bg-gray-300 dark:bg-emerald-950'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    rangeConfig.enabled ? 'translate-x-1 sm:translate-x-1' : '-translate-x-6'
                  }`}
                />
              </button>
            </div>

            {/* Reciter Selector in Modal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  القارئ المختار للتلاوة والتكرار:
                </label>
                <span className="text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                  {currentReciter.name}
                </span>
              </div>

              {/* Spotlight: Teacher Quran (المصحف المعلم للتحفيظ) */}
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                    <span>المصحف المعلم (موصى به للتحفيظ وترديد الآيات):</span>
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">ترديد أطفال 👶</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      selectReciter('minshawi_muallim');
                      triggerHaptic(15);
                    }}
                    className={`p-2 rounded-xl text-right border transition text-xs flex items-center justify-between cursor-pointer ${
                      selectedReciterId === 'minshawi_muallim' || selectedReciterId === 'minshawi_kids'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-[#071311] border-gray-200 dark:border-emerald-950 text-gray-800 dark:text-gray-200 hover:border-amber-400'
                    }`}
                  >
                    <span>🎓 المنشاوي (معلم)</span>
                    {(selectedReciterId === 'minshawi_muallim' || selectedReciterId === 'minshawi_kids') && (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      selectReciter('husary_muallim');
                      triggerHaptic(15);
                    }}
                    className={`p-2 rounded-xl text-right border transition text-xs flex items-center justify-between cursor-pointer ${
                      selectedReciterId === 'husary_muallim' || selectedReciterId === 'husary_kids'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-[#071311] border-gray-200 dark:border-emerald-950 text-gray-800 dark:text-gray-200 hover:border-amber-400'
                    }`}
                  >
                    <span>🎓 الحصري (معلم)</span>
                    {(selectedReciterId === 'husary_muallim' || selectedReciterId === 'husary_kids') && (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </button>
                </div>
              </div>

              {/* All Other Reciters (مرتل ومجود) */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
                  أو اختر قارئاً آخر من المصاحف المرتلة والمجودة:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-1 scrollbar-thin">
                  {RECITERS_LIST.filter(
                    (r) => !['minshawi_kids', 'husary_kids', 'minshawi_muallim', 'husary_muallim'].includes(r.id)
                  ).map((reciter) => {
                    const isChosen = selectedReciterId === reciter.id;
                    return (
                      <button
                        key={reciter.id}
                        onClick={() => {
                          selectReciter(reciter.id);
                          triggerHaptic(15);
                        }}
                        className={`p-2 rounded-xl text-right border transition text-[11px] flex items-center justify-between gap-1 cursor-pointer ${
                          isChosen
                            ? 'bg-emerald-700 text-white font-bold border-emerald-800 shadow-xs'
                            : 'bg-gray-50 dark:bg-[#071311] border-gray-200 dark:border-emerald-950 text-gray-800 dark:text-gray-300 hover:border-emerald-400'
                        }`}
                      >
                        <span className="truncate">{reciter.name.replace('الشيخ ', '')}</span>
                        {isChosen && <Check className="w-3 h-3 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Surah Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                اختر السورة الكريمة:
              </label>
              <select
                value={rangeConfig.surahNumber}
                onChange={(e) => {
                  const sNum = Number(e.target.value);
                  const surahMeta = SURAH_INDEX.find((s) => s.number === sNum);
                  const maxAyahs = surahMeta?.numberOfAyahs || 7;
                  setRangeConfig((prev) => {
                    const up = {
                      ...prev,
                      surahNumber: sNum,
                      fromAyah: 1,
                      toAyah: Math.min(prev.toAyah > 0 ? prev.toAyah : 7, maxAyahs),
                    };
                    rangeConfigRef.current = up;
                    return up;
                  });
                }}
                className="w-full py-2.5 px-3.5 rounded-xl bg-gray-50 dark:bg-[#071311] border border-gray-200 dark:border-emerald-950 text-xs sm:text-sm font-bold text-gray-900 dark:text-white outline-hidden cursor-pointer"
              >
                {SURAH_INDEX.map((s) => (
                  <option key={s.number} value={s.number}>
                    سورة {s.number}. {s.name} ({s.numberOfAyahs} آية - الجزء {s.juz})
                  </option>
                ))}
              </select>
            </div>

            {/* Ayah Range Pickers (من آية كذا إلى آية كذا) */}
            {(() => {
              const selectedSurahMeta = SURAH_INDEX.find((s) => s.number === rangeConfig.surahNumber);
              const maxAyahsInSurah = selectedSurahMeta?.numberOfAyahs || 7;

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* From Ayah */}
                    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#071311] border border-gray-200 dark:border-emerald-950 space-y-2">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400 block">
                        من آية:
                      </span>
                      <div className="flex items-center justify-between gap-1">
                        <button
                          onClick={() => {
                            setRangeConfig((prev) => {
                              const up = { ...prev, fromAyah: Math.max(1, prev.fromAyah - 1) };
                              rangeConfigRef.current = up;
                              return up;
                            });
                          }}
                          className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-emerald-950 hover:bg-amber-500 hover:text-slate-950 text-gray-800 dark:text-gray-200 font-bold transition flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={rangeConfig.toAyah}
                          value={rangeConfig.fromAyah}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              setRangeConfig((prev) => {
                                const up = {
                                  ...prev,
                                  fromAyah: Math.max(1, Math.min(prev.toAyah, val)),
                                };
                                rangeConfigRef.current = up;
                                return up;
                              });
                            }
                          }}
                          className="w-14 text-center font-bold text-base text-gray-900 dark:text-white bg-transparent outline-hidden"
                        />
                        <button
                          onClick={() => {
                            setRangeConfig((prev) => {
                              const up = {
                                ...prev,
                                fromAyah: Math.min(prev.toAyah, prev.fromAyah + 1),
                              };
                              rangeConfigRef.current = up;
                              return up;
                            });
                          }}
                          className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-emerald-950 hover:bg-amber-500 hover:text-slate-950 text-gray-800 dark:text-gray-200 font-bold transition flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* To Ayah */}
                    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#071311] border border-gray-200 dark:border-emerald-950 space-y-2">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400 block">
                        إلى آية:
                      </span>
                      <div className="flex items-center justify-between gap-1">
                        <button
                          onClick={() => {
                            setRangeConfig((prev) => {
                              const up = {
                                ...prev,
                                toAyah: Math.max(prev.fromAyah, prev.toAyah - 1),
                              };
                              rangeConfigRef.current = up;
                              return up;
                            });
                          }}
                          className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-emerald-950 hover:bg-amber-500 hover:text-slate-950 text-gray-800 dark:text-gray-200 font-bold transition flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={rangeConfig.fromAyah}
                          max={maxAyahsInSurah}
                          value={rangeConfig.toAyah}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              setRangeConfig((prev) => {
                                const up = {
                                  ...prev,
                                  toAyah: Math.max(prev.fromAyah, Math.min(maxAyahsInSurah, val)),
                                };
                                rangeConfigRef.current = up;
                                return up;
                              });
                            }
                          }}
                          className="w-14 text-center font-bold text-base text-gray-900 dark:text-white bg-transparent outline-hidden"
                        />
                        <button
                          onClick={() => {
                            setRangeConfig((prev) => {
                              const up = {
                                ...prev,
                                toAyah: Math.min(maxAyahsInSurah, prev.toAyah + 1),
                              };
                              rangeConfigRef.current = up;
                              return up;
                            });
                          }}
                          className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-emerald-950 hover:bg-amber-500 hover:text-slate-950 text-gray-800 dark:text-gray-200 font-bold transition flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Range Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-1">
                      خيارات سريعة:
                    </span>
                    <button
                      onClick={() => {
                        setRangeConfig((prev) => {
                          const up = {
                            ...prev,
                            fromAyah: 1,
                            toAyah: maxAyahsInSurah,
                          };
                          rangeConfigRef.current = up;
                          return up;
                        });
                        triggerHaptic(15);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-emerald-950/60 hover:bg-amber-100 text-[11px] font-bold text-gray-700 dark:text-gray-300 transition cursor-pointer"
                    >
                      كامل السورة ({maxAyahsInSurah} آية)
                    </button>
                    <button
                      onClick={() => {
                        setRangeConfig((prev) => {
                          const up = {
                            ...prev,
                            fromAyah: 1,
                            toAyah: Math.min(5, maxAyahsInSurah),
                          };
                          rangeConfigRef.current = up;
                          return up;
                        });
                        triggerHaptic(15);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-emerald-950/60 hover:bg-amber-100 text-[11px] font-bold text-gray-700 dark:text-gray-300 transition cursor-pointer"
                    >
                      أول 5 آيات
                    </button>
                    <button
                      onClick={() => {
                        setRangeConfig((prev) => {
                          const up = {
                            ...prev,
                            fromAyah: 1,
                            toAyah: Math.min(10, maxAyahsInSurah),
                          };
                          rangeConfigRef.current = up;
                          return up;
                        });
                        triggerHaptic(15);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-emerald-950/60 hover:bg-amber-100 text-[11px] font-bold text-gray-700 dark:text-gray-300 transition cursor-pointer"
                    >
                      10 آيات
                    </button>
                    {/* Current Page Ayahs Preset */}
                    {(() => {
                      const pData = getPageData(currentPage);
                      const pageAyahs = pData?.entries.filter(
                        (e) => e.type === 'ayah' && e.surahNumber === rangeConfig.surahNumber
                      );
                      if (pageAyahs && pageAyahs.length > 0) {
                        const firstA = pageAyahs[0].numberInSurah || 1;
                        const lastA = pageAyahs[pageAyahs.length - 1].numberInSurah || maxAyahsInSurah;
                        return (
                          <button
                            onClick={() => {
                              setRangeConfig((prev) => {
                                const up = {
                                  ...prev,
                                  fromAyah: firstA,
                                  toAyah: lastA,
                                };
                                rangeConfigRef.current = up;
                                return up;
                              });
                              triggerHaptic(15);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 transition cursor-pointer border border-emerald-300/40"
                          >
                            آيات الصفحة الحالية ({firstA}-{lastA})
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              );
            })()}

            {/* Repetition Count Selector (تكرار كام مرة لكل الشيوخ) */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-emerald-950">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>تكرار كم مرة لكل الشيوخ:</span>
                <span className="text-amber-600 dark:text-amber-400 text-[11px] font-mono font-bold">
                  {rangeConfig.repeatCount === 0 ? '∞ مستمر بلا انقطاع' : `${rangeConfig.repeatCount} مرات`}
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { count: 1, label: 'مرة واحدة (1)' },
                  { count: 2, label: 'مرتان (2)' },
                  { count: 3, label: '3 مرات (تحفيظ)' },
                  { count: 5, label: '5 مرات' },
                  { count: 7, label: '7 مرات' },
                  { count: 10, label: '10 مرات' },
                  { count: 0, label: '∞ مستمر' },
                ].map((item) => {
                  const isSelected = rangeConfig.repeatCount === item.count;
                  return (
                    <button
                      key={item.count}
                      onClick={() => {
                        setRangeConfig((prev) => {
                          const up = { ...prev, repeatCount: item.count };
                          rangeConfigRef.current = up;
                          return up;
                        });
                        triggerHaptic(15);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-400'
                          : 'bg-gray-100 dark:bg-emerald-950/60 hover:bg-gray-200 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Repetition Mode (نمط التكرار) */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-emerald-950">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                أسلوب التكرار والترديد:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setRangeConfig((prev) => {
                      const up = { ...prev, repeatMode: 'range' as const };
                      rangeConfigRef.current = up;
                      return up;
                    });
                    triggerHaptic(15);
                  }}
                  className={`p-3 rounded-2xl border text-right transition cursor-pointer space-y-1 ${
                    rangeConfig.repeatMode === 'range'
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                      : 'bg-gray-50 dark:bg-[#071311] border-gray-200 dark:border-emerald-950 text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تكرار المقطع بالكامل</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
                    يقرأ الشيخ المقطع كاملاً من آية {rangeConfig.fromAyah} إلى {rangeConfig.toAyah} ثم يعيده كاملاً.
                  </p>
                </button>

                <button
                  onClick={() => {
                    setRangeConfig((prev) => {
                      const up = { ...prev, repeatMode: 'each_ayah' as const };
                      rangeConfigRef.current = up;
                      return up;
                    });
                    triggerHaptic(15);
                  }}
                  className={`p-3 rounded-2xl border text-right transition cursor-pointer space-y-1 ${
                    rangeConfig.repeatMode === 'each_ayah'
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                      : 'bg-gray-50 dark:bg-[#071311] border-gray-200 dark:border-emerald-950 text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Repeat className="w-3.5 h-3.5 text-amber-500" />
                    <span>تكرار كل آية منفردة</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
                    يكرر كل آية على حدة قبل الانتقال إلى الآية التي تليها (ممتاز جداً للتحفيظ والأطفال).
                  </p>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-emerald-950">
              <button
                onClick={() => startRangeRecitation()}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  بدء التلاوة والتكرار الآن بصوت {currentReciter.name.split(' ')[1] || currentReciter.name}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setRangeConfig((prev) => {
                      const up = { ...prev, enabled: true };
                      rangeConfigRef.current = up;
                      return up;
                    });
                    setShowRangeModal(false);
                    triggerHaptic(20);
                    setCopiedText('تم حفظ وتفعيل وضع التكرار');
                    setTimeout(() => setCopiedText(null), 2500);
                  }}
                  className="py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer"
                >
                  ✓ حفظ وتفعيل
                </button>

                <button
                  onClick={() => {
                    cancelRangeRecitation();
                    setShowRangeModal(false);
                  }}
                  className="py-2.5 rounded-xl bg-gray-100 dark:bg-emerald-950/80 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 transition cursor-pointer"
                >
                  إلغاء التكرار
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
