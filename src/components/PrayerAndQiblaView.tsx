import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Compass,
  Clock,
  MapPin,
  BellRing,
  BellOff,
  Calendar,
  Volume2,
  VolumeX,
  Search,
  Crosshair,
  Check,
  RefreshCw,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Play,
  Square,
  Sparkles,
  Upload,
  Film,
  Music,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import {
  POPULAR_CITIES,
  calculatePrayerTimes,
  calculateQibla,
  getHijriDate,
  fetchLiveOnlinePrayerTimes,
  LivePrayerTimesResult,
} from '../utils/prayerTimes';
import { CityLocation, PrayerTimeData } from '../types';
import {
  playAlarmSound,
  stopAdhanAudio,
  triggerHaptic,
} from '../utils/soundAndHaptics';
import { searchArabicMatches } from '../utils/arabicSearch';

interface PrayerAndQiblaViewProps {
  onCityChange?: (city: CityLocation) => void;
}

interface CustomAlarmTrack {
  url: string;
  name: string;
  isFromVideo: boolean;
}

export const PrayerAndQiblaView: React.FC<PrayerAndQiblaViewProps> = ({ onCityChange }) => {
  // Current time state that ticks automatically every minute to update the day & times
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [activeDateTab, setActiveDateTab] = useState<'today' | 'tomorrow'>('today');

  // Selected City / Region
  const [selectedCity, setSelectedCity] = useState<CityLocation>(() => {
    try {
      const saved = localStorage.getItem('nur_selected_city');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return POPULAR_CITIES[0]; // Makkah default
  });

  // Search input for region/city typing
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  // Compass orientation
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);

  // Prayer Alarm Settings
  const [alarmEnabled, setAlarmEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('nur_prayer_alarm');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  // Custom Alarm Tone (صوت مسجل من الهاتف أو مستخرج من فيديو)
  const [customAlarm, setCustomAlarm] = useState<CustomAlarmTrack | null>(() => {
    try {
      const meta = localStorage.getItem('nur_custom_alarm_meta');
      const url = localStorage.getItem('nur_custom_alarm_url');
      if (meta && url) {
        return { ...JSON.parse(meta), url };
      }
    } catch {
      // Ignore
    }
    return null;
  });

  // Live Online Prayer Times data (via Google Coordinates / AlAdhan API)
  const [livePrayerData, setLivePrayerData] = useState<LivePrayerTimesResult | null>(null);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const [isPlayingAdhanTest, setIsPlayingAdhanTest] = useState(false);
  const [activeAdhanAlert, setActiveAdhanAlert] = useState<{ prayerName: string; time: string } | null>(null);

  const stopAudioRef = useRef<(() => void) | null>(null);
  const customAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const alarmAudioInputRef = useRef<HTMLInputElement>(null);
  const alarmVideoInputRef = useRef<HTMLInputElement>(null);

  // Automatically tick every 30 seconds to update daily times, countdowns, and detect day change (midnight)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Save selected city & propagate to parent
  useEffect(() => {
    try {
      localStorage.setItem('nur_selected_city', JSON.stringify(selectedCity));
    } catch {
      // Ignore
    }
    if (onCityChange) {
      onCityChange(selectedCity);
    }
  }, [selectedCity, onCityChange]);

  // Save alarm setting
  useEffect(() => {
    try {
      localStorage.setItem('nur_prayer_alarm', alarmEnabled.toString());
    } catch {
      // Ignore
    }
  }, [alarmEnabled]);

  // Request browser notification permission if alarm is enabled
  useEffect(() => {
    if (alarmEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [alarmEnabled]);

  // Compass device orientation
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setDeviceHeading(360 - e.alpha);
      } else if ((e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading !== undefined) {
        setDeviceHeading((e as unknown as { webkitCompassHeading: number }).webkitCompassHeading);
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  // Filter cities by user search query
  const matchingCities = useMemo(() => {
    if (!citySearchQuery.trim()) return POPULAR_CITIES.slice(0, 15);
    return POPULAR_CITIES.filter(
      (c) =>
        searchArabicMatches(c.name, citySearchQuery) ||
        searchArabicMatches(c.country, citySearchQuery)
    );
  }, [citySearchQuery]);

  // Date for calculation (Today or Tomorrow)
  const calculationDate = useMemo(() => {
    if (activeDateTab === 'tomorrow') {
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    return currentDate;
  }, [activeDateTab, currentDate]);

  // Fetch / Sync Live Official Prayer Times (AlAdhan API / Google coordinates)
  const fetchLiveTimes = async (showToast = false) => {
    setIsSyncingLive(true);
    try {
      const res = await fetchLiveOnlinePrayerTimes(selectedCity, calculationDate);
      if (res) {
        setLivePrayerData(res);
        if (showToast) {
          setSyncStatusMsg(`تم تحديث المواقيت رسمياً بدقة وفق ${res.source}`);
          setTimeout(() => setSyncStatusMsg(null), 4000);
        }
      } else {
        if (showToast) {
          setSyncStatusMsg('تم اعتماد أدق حساب فلكي معتمد للمدينة');
          setTimeout(() => setSyncStatusMsg(null), 3500);
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsSyncingLive(false);
    }
  };

  // Automatically fetch live times when city or calculationDate changes
  useEffect(() => {
    fetchLiveTimes(false);
  }, [selectedCity, calculationDate]);

  // Calculate offline fallback
  const offlineCalculation = useMemo(() => {
    return calculatePrayerTimes(selectedCity, calculationDate);
  }, [selectedCity, calculationDate]);

  // Effective prayers & next prayer (live data preferred if available)
  const prayers: PrayerTimeData[] = livePrayerData?.prayers || offlineCalculation.prayers;
  const nextPrayer = livePrayerData?.nextPrayer || offlineCalculation.nextPrayer;
  const hijriStr = livePrayerData?.hijri || getHijriDate(calculationDate);
  const qiblaAngle = Math.round(calculateQibla(selectedCity.lat, selectedCity.lng));

  // Auto-check for Adhan time arrival
  useEffect(() => {
    if (!alarmEnabled) return;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const currentHM = `${pad(currentDate.getHours())}:${pad(currentDate.getMinutes())}`;

    // Check if current minute matches any prayer time
    const matchingPrayer = prayers.find(
      (p) => p.name !== 'Sunrise' && (p.rawTime24 === currentHM || p.time === currentHM)
    );

    if (matchingPrayer) {
      const alertKey = `nur_alert_${matchingPrayer.name}_${currentDate.toDateString()}`;
      if (!sessionStorage.getItem(alertKey)) {
        sessionStorage.setItem(alertKey, 'true');
        setActiveAdhanAlert({ prayerName: matchingPrayer.arabicName, time: matchingPrayer.time });
        playActiveAlarm();
        triggerHaptic(100);

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(`حان الآن موعد صلاة ${matchingPrayer.arabicName}`, {
            body: `الله أكبر، حان الآن موعد أذان صلاة ${matchingPrayer.arabicName} بحسب توقيت ${selectedCity.name}`,
            icon: '/pwa-192x192.png',
          });
        }
      }
    }
  }, [alarmEnabled, currentDate, prayers, selectedCity]);

  /**
   * Play the active alarm: either custom uploaded/extracted audio or standard Makkah Adhan
   */
  const playActiveAlarm = () => {
    if (customAlarm?.url) {
      if (!customAudioPlayerRef.current) {
        customAudioPlayerRef.current = new Audio();
      }
      const audio = customAudioPlayerRef.current;
      audio.src = customAlarm.url;
      audio.play().catch(console.warn);
      stopAudioRef.current = () => {
        audio.pause();
        audio.currentTime = 0;
      };
    } else {
      const stop = playAlarmSound('adhan_makkah', true);
      stopAudioRef.current = stop;
    }
  };

  const stopActiveAlarm = () => {
    if (stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
    }
    if (customAudioPlayerRef.current) {
      customAudioPlayerRef.current.pause();
      customAudioPlayerRef.current.currentTime = 0;
    }
    stopAdhanAudio();
  };

  // GPS Auto-detect handler
  const handleGPSDetect = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsMessage('خاصية تحديد الموقع غير مدعومة في متصفحك.');
      return;
    }

    setGpsLoading(true);
    setGpsMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const timezone = Math.round(-new Date().getTimezoneOffset() / 60);

        let closest = POPULAR_CITIES[0];
        let minDistance = Number.MAX_VALUE;

        for (const city of POPULAR_CITIES) {
          const dist = Math.hypot(city.lat - latitude, city.lng - longitude);
          if (dist < minDistance) {
            minDistance = dist;
            closest = city;
          }
        }

        if (minDistance < 0.6) {
          setSelectedCity(closest);
          setGpsMessage(`تم تحديد موقعك بدقة: ${closest.name} (${closest.country})`);
        } else {
          const customLocation: CityLocation = {
            name: `موقعي الحالي (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
            country: 'محدد بنظام GPS',
            lat: latitude,
            lng: longitude,
            timezone,
          };
          setSelectedCity(customLocation);
          setGpsMessage('تم ضبط مواقيت الصلاة والقبلة بدقة على إحداثيات موقعك الحالي.');
        }

        setGpsLoading(false);
        triggerHaptic(30);
        setTimeout(() => setGpsMessage(null), 4000);
      },
      (error) => {
        setGpsLoading(false);
        setGpsMessage('تعذر الوصول إلى الموقع (تأكد من تفعيل خدمة الموقع في جهازك).');
        setTimeout(() => setGpsMessage(null), 4000);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  /**
   * Handle Custom Audio Upload from Device (MP3, WAV, M4A, etc.)
   */
  const handleAlarmAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopActiveAlarm();

    const fileUrl = URL.createObjectURL(file);
    const track: CustomAlarmTrack = {
      url: fileUrl,
      name: file.name,
      isFromVideo: false,
    };

    setCustomAlarm(track);
    try {
      localStorage.setItem('nur_custom_alarm_meta', JSON.stringify({ name: file.name, isFromVideo: false }));
      localStorage.setItem('nur_custom_alarm_url', fileUrl);
    } catch {
      // Ignore
    }

    // Play test immediately
    setIsPlayingAdhanTest(true);
    if (!customAudioPlayerRef.current) customAudioPlayerRef.current = new Audio();
    const a = customAudioPlayerRef.current;
    a.src = fileUrl;
    a.play().catch(console.warn);
    stopAudioRef.current = () => {
      a.pause();
      a.currentTime = 0;
    };
    setTimeout(() => setIsPlayingAdhanTest(false), 12000);

    triggerHaptic(35);
  };

  /**
   * Handle Extract Audio from Video File on Device (MP4, MOV, WEBM, MKV, etc.)
   */
  const handleAlarmVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopActiveAlarm();

    const fileUrl = URL.createObjectURL(file);
    const track: CustomAlarmTrack = {
      url: fileUrl,
      name: file.name,
      isFromVideo: true,
    };

    setCustomAlarm(track);
    try {
      localStorage.setItem('nur_custom_alarm_meta', JSON.stringify({ name: file.name, isFromVideo: true }));
      localStorage.setItem('nur_custom_alarm_url', fileUrl);
    } catch {
      // Ignore
    }

    // Play test immediately
    setIsPlayingAdhanTest(true);
    if (!customAudioPlayerRef.current) customAudioPlayerRef.current = new Audio();
    const a = customAudioPlayerRef.current;
    a.src = fileUrl;
    a.play().catch(console.warn);
    stopAudioRef.current = () => {
      a.pause();
      a.currentTime = 0;
    };
    setTimeout(() => setIsPlayingAdhanTest(false), 12000);

    triggerHaptic(35);
  };

  /**
   * Reset Custom Alarm to Default Makkah Adhan
   */
  const handleResetToDefaultAlarm = () => {
    stopActiveAlarm();
    setCustomAlarm(null);
    try {
      localStorage.removeItem('nur_custom_alarm_meta');
      localStorage.removeItem('nur_custom_alarm_url');
    } catch {
      // Ignore
    }
    triggerHaptic(20);
  };

  const handleTestSelectedAlarm = () => {
    if (isPlayingAdhanTest) {
      stopActiveAlarm();
      setIsPlayingAdhanTest(false);
    } else {
      setIsPlayingAdhanTest(true);
      playActiveAlarm();
      triggerHaptic(40);
      setTimeout(() => {
        setIsPlayingAdhanTest(false);
      }, 15000);
    }
  };

  const formatRemaining = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h} ساعة و ${m} دقيقة`;
    return `${m} دقيقة`;
  };

  const needleRotation =
    deviceHeading !== null ? (qiblaAngle - deviceHeading + 360) % 360 : qiblaAngle;

  const gregorianDateStr = new Intl.DateTimeFormat('ar-SA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(calculationDate);

  return (
    <div className="space-y-6 pb-24 select-none">
      {/* Hidden file inputs for picking recorded audio or extracting video audio */}
      <input
        ref={alarmAudioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleAlarmAudioUpload}
      />
      <input
        ref={alarmVideoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleAlarmVideoUpload}
      />

      {/* ================= 1. REGION SELECTION & SEARCH BOX ================= */}
      <div className="bg-white dark:bg-[#0c1f1c] rounded-3xl p-5 sm:p-6 shadow-sm border border-emerald-100 dark:border-emerald-950/80 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-emerald-950 pb-3">
          <div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
              تحديد المنطقة والمدينة (اكتب منطقتك وتتحدث المواقيت يومياً)
            </span>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg sm:text-xl font-bold font-quran text-gray-900 dark:text-white">
                {selectedCity.name} <span className="text-xs text-gray-400 font-sans font-normal">({selectedCity.country})</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Live Sync with Google / AlAdhan API */}
            <button
              onClick={() => fetchLiveTimes(true)}
              disabled={isSyncingLive}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
              title="تحديث وتدقيق المواقيت من جوجل والإنترنت"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isSyncingLive ? 'animate-spin' : ''}`} />
              <span>{isSyncingLive ? 'جارٍ التدقيق...' : 'تدقيق وتحديث من جوجل'}</span>
            </button>

            {/* GPS Auto-Detect */}
            <button
              onClick={handleGPSDetect}
              disabled={gpsLoading}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900 text-xs font-bold transition cursor-pointer"
              title="تحديد المدينة بنظام GPS"
            >
              <Crosshair className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">موقعي الحالي</span>
            </button>

            <button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-100 dark:bg-emerald-950/40 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-xs font-bold transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>تغيير المدينة</span>
            </button>
          </div>
        </div>

        {/* Sync message confirmation */}
        {syncStatusMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
        )}

        {/* GPS Message */}
        {gpsMessage && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{gpsMessage}</span>
          </div>
        )}

        {/* Search Input Accordion */}
        {isSearchOpen && (
          <div className="pt-2 space-y-3 animate-in fade-in duration-200">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                placeholder="ابحث عن مدينتك (مثل: القاهرة، مكة، الرياض، دبي، الإسكندرية، طنطا، المنصورة...)"
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#071311] border border-gray-300 dark:border-emerald-950 text-xs font-semibold text-gray-900 dark:text-white outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
              {matchingCities.map((city) => {
                const isSelected = selectedCity.name === city.name;
                return (
                  <button
                    key={`${city.name}-${city.country}`}
                    onClick={() => {
                      setSelectedCity(city);
                      setIsSearchOpen(false);
                      setCitySearchQuery('');
                      triggerHaptic(20);
                    }}
                    className={`p-2.5 rounded-xl text-right transition border cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-xs'
                        : 'bg-gray-50 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/70 border-gray-200 dark:border-emerald-950 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <div className="font-bold text-xs truncate">{city.name}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                      {city.country}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {livePrayerData?.source ? (
                <>المواقيت موثقة ومعتمدة من: <strong className="text-emerald-700 dark:text-emerald-300">{livePrayerData.source}</strong></>
              ) : (
                <>مواقيت فلكية معتمدة وفق التوقيت المحلي لـ {selectedCity.name}</>
              )}
            </span>
          </span>
          <span className="hidden sm:inline text-[11px] text-gray-400">{gregorianDateStr}</span>
        </div>
      </div>

      {/* ================= 2. ADHAN ALARM WITH VIDEO & AUDIO EXTRACTION ================= */}
      <div className="bg-white dark:bg-[#0c1f1c] rounded-3xl p-5 sm:p-6 shadow-sm border border-emerald-100 dark:border-emerald-950/80 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-emerald-950 pb-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                alarmEnabled
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-gray-100 dark:bg-emerald-950/60 text-gray-400'
              }`}
            >
              {alarmEnabled ? <BellRing className="w-5 h-5 animate-bounce" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                  منبه الأذان والتنبيه بدخول وقت الصلاة
                </h4>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    alarmEnabled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {alarmEnabled ? 'مفعّل' : 'معطّل'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                تنبيه فوري عند حلول كل صلاة بحسب توقيت {selectedCity.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleTestSelectedAlarm}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isPlayingAdhanTest
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              {isPlayingAdhanTest ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isPlayingAdhanTest ? 'إيقاف التجربة' : 'تجربة المنبه'}</span>
            </button>

            <button
              onClick={() => {
                setAlarmEnabled(!alarmEnabled);
                triggerHaptic(20);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                alarmEnabled
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-gray-200 dark:bg-emerald-950/40 text-gray-700 dark:text-gray-300'
              }`}
            >
              {alarmEnabled ? 'تعطيل المنبه' : 'تشغيل المنبه'}
            </button>
          </div>
        </div>

        {/* CUSTOM ALARM AUDIO & VIDEO EXTRACTION CONTROLS */}
        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>نغمة الأذان والمنبه (يمكنك استخراج الصوت من أي فيديو أو اختيار صوت من جهازك):</span>
              </span>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {customAlarm ? (
                  <>
                    النغمة المحددة الآن: <strong className="text-amber-700 dark:text-amber-300 font-bold">{customAlarm.name}</strong> ({customAlarm.isFromVideo ? 'صوت مستخرج من الفيديو' : 'صوت مسجل من الهاتف'})
                  </>
                ) : (
                  <>النغمة المحددة: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">أذان الحرم المكي الشريف الافتراضي</strong></>
                )}
              </p>
            </div>

            {customAlarm && (
              <button
                onClick={handleResetToDefaultAlarm}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-emerald-950/80 text-gray-600 dark:text-gray-300 transition cursor-pointer"
                title="استعادة أذان الحرم المكي"
              >
                <RotateCcw className="w-3 h-3 text-amber-600" />
                <span>استعادة الأذان الافتراضي</span>
              </button>
            )}
          </div>

          {/* Action Upload Buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => alarmVideoInputRef.current?.click()}
              className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-xs cursor-pointer active:scale-95"
            >
              <Film className="w-4 h-4" />
              <span>استخراج الصوت من فيديو بالهاتف</span>
            </button>

            <button
              onClick={() => alarmAudioInputRef.current?.click()}
              className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition shadow-xs cursor-pointer active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>اختيار صوت مسجل من الجهاز</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 3. TODAY / TOMORROW DATE SWITCHER ================= */}
      <div className="flex items-center justify-between bg-white dark:bg-[#0c1f1c] rounded-2xl p-2 shadow-xs border border-emerald-100 dark:border-emerald-950/80">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveDateTab('today')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeDateTab === 'today'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-emerald-50'
            }`}
          >
            مواقيت اليوم ({gregorianDateStr.split(' ')[0]})
          </button>
          <button
            onClick={() => setActiveDateTab('tomorrow')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeDateTab === 'tomorrow'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:bg-emerald-50'
            }`}
          >
            مواقيت الغد
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold">
          <Calendar className="w-3.5 h-3.5" />
          <span>{hijriStr}</span>
        </div>
      </div>

      {/* ================= 4. NEXT PRAYER COUNTDOWN CARD ================= */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-950 text-white p-6 sm:p-8 shadow-xl border border-emerald-600/40 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-right">
        <div>
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5 mb-1">
            <Clock className="w-4 h-4" />
            الصلاة القادمة في {selectedCity.name}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-quran text-amber-100">
            صلاة {nextPrayer.arabicName}
          </h2>
          <p className="text-xs text-emerald-200/80 mt-1">
            يحين موعدها في تمام الساعة <strong className="text-white text-sm">{nextPrayer.time}</strong>
          </p>
        </div>

        <div className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20">
          <span className="text-[11px] text-emerald-200 block">الوقت المتبقي للأذان</span>
          <span className="text-2xl sm:text-3xl font-bold font-quran text-amber-300">
            {formatRemaining(nextPrayer.remainingMinutes)}
          </span>
        </div>
      </div>

      {/* ================= 5. PRAYER TIMES 6-BOX GRID (12-HOUR FORMAT) ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {prayers.map((p) => {
          const getPrayerIcon = () => {
            if (p.name === 'Fajr') return <Sunrise className="w-4 h-4 text-amber-400" />;
            if (p.name === 'Sunrise') return <Sun className="w-4 h-4 text-amber-500" />;
            if (p.name === 'Dhuhr') return <Sun className="w-4 h-4 text-amber-400" />;
            if (p.name === 'Asr') return <Sun className="w-4 h-4 text-amber-500" />;
            if (p.name === 'Maghrib') return <Sunset className="w-4 h-4 text-rose-400" />;
            return <Moon className="w-4 h-4 text-indigo-400" />;
          };

          return (
            <div
              key={p.name}
              className={`p-4 rounded-2xl border text-center transition-all ${
                p.isNext && activeDateTab === 'today'
                  ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/30 shadow-md scale-[1.02]'
                  : 'bg-white dark:bg-[#0c1f1c] border-emerald-100 dark:border-emerald-950/70'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                {getPrayerIcon()}
                <span
                  className={`text-xs font-bold ${
                    p.isNext && activeDateTab === 'today'
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {p.arabicName}
                </span>
              </div>

              <span className="text-base sm:text-xl font-bold font-quran text-gray-900 dark:text-white">
                {p.time}
              </span>

              {p.isNext && activeDateTab === 'today' && (
                <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                  القادمة
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ================= 6. INTERACTIVE 360° QIBLA COMPASS ================= */}
      <div className="bg-white dark:bg-[#0c1f1c] rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100 dark:border-emerald-950/80 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 space-y-3 text-center md:text-right">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <Compass className="w-3.5 h-3.5" />
            <span>بوصلة القبلة الدقيقة</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-quran text-gray-900 dark:text-white">
            اتجاه القبلة الشريفة نحو الكعبة المشرفة
          </h3>

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
            زاوية القبلة من الشمال الجغرافي لـ {selectedCity.name} هي <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{qiblaAngle}°</strong>. ضع هاتفك بشكل أفقي مستوٍ وقم بتوجيهه باتجاه رمز الكعبة المشرفة.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
            <div className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-emerald-950/40 border border-gray-200 dark:border-emerald-950 text-xs">
              <span className="text-gray-400 block text-[10px]">انحراف القبلة</span>
              <span className="font-bold font-quran text-emerald-700 dark:text-emerald-300 text-base">
                {qiblaAngle}° من الشمال
              </span>
            </div>

            <div className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-emerald-950/40 border border-gray-200 dark:border-emerald-950 text-xs">
              <span className="text-gray-400 block text-[10px]">حساس البوصلة</span>
              <span className="font-bold text-gray-700 dark:text-gray-300 text-xs">
                {deviceHeading !== null ? 'نشط ومتصل تلقائياً' : 'محدد بزاوية ثابتة'}
              </span>
            </div>
          </div>
        </div>

        {/* Circular Compass Visualizer */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-emerald-800/30 dark:border-emerald-700/40 flex items-center justify-center shadow-xl bg-gradient-to-br from-emerald-950/10 via-amber-500/5 to-emerald-950/20">
          {/* Compass Rose Markings */}
          <div className="absolute top-2 text-xs font-bold text-gray-500">ش (N)</div>
          <div className="absolute bottom-2 text-xs font-bold text-gray-500">ج (S)</div>
          <div className="absolute right-2 text-xs font-bold text-gray-500">ش (E)</div>
          <div className="absolute left-2 text-xs font-bold text-gray-500">غ (W)</div>

          {/* Concentric rings */}
          <div className="w-48 h-48 rounded-full border border-dashed border-emerald-600/30 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border border-emerald-600/20 flex items-center justify-center" />
          </div>

          {/* Compass Needle pointing to Kaaba */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out pointer-events-none"
            style={{ transform: `rotate(${needleRotation}deg)` }}
          >
            <div className="relative w-1 h-full flex flex-col items-center justify-between py-5">
              {/* Pointer to Kaaba */}
              <div className="flex flex-col items-center -translate-y-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg font-bold text-xs border-2 border-white">
                  🕋
                </div>
                <div className="w-0.5 h-16 bg-amber-500 shadow-sm" />
              </div>

              {/* Counter-weight bottom pointer */}
              <div className="w-0.5 h-16 bg-gray-400/60" />
            </div>
          </div>

          {/* Center Pin */}
          <div className="w-6 h-6 rounded-full bg-emerald-900 border-2 border-amber-400 z-10 shadow-md" />
        </div>
      </div>
    </div>
  );
};
