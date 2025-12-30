import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Hijri month names in Arabic and English
const HIJRI_MONTHS = [
  { arabic: 'محرم', english: 'Muharram' },
  { arabic: 'صفر', english: 'Safar' },
  { arabic: 'ربيع الأول', english: 'Rabi al-Awwal' },
  { arabic: 'ربيع الثاني', english: 'Rabi al-Thani' },
  { arabic: 'جمادى الأولى', english: 'Jumada al-Awwal' },
  { arabic: 'جمادى الآخرة', english: 'Jumada al-Thani' },
  { arabic: 'رجب', english: 'Rajab' },
  { arabic: 'شعبان', english: 'Shaban' },
  { arabic: 'رمضان', english: 'Ramadan' },
  { arabic: 'شوال', english: 'Shawwal' },
  { arabic: 'ذو القعدة', english: 'Dhul Qadah' },
  { arabic: 'ذو الحجة', english: 'Dhul Hijjah' },
];

// Islamic events with Hijri dates
const ISLAMIC_EVENTS = [
  { month: 1, day: 1, name: 'Islamic New Year', arabic: 'رأس السنة الهجرية', icon: '🌙', color: '#4CAF50' },
  { month: 1, day: 10, name: 'Day of Ashura', arabic: 'يوم عاشوراء', icon: '🕋', color: '#9C27B0' },
  { month: 3, day: 12, name: 'Mawlid al-Nabi', arabic: 'المولد النبوي', icon: '🌟', color: '#2196F3' },
  { month: 7, day: 27, name: 'Isra and Miraj', arabic: 'الإسراء والمعراج', icon: '✨', color: '#FF9800' },
  { month: 8, day: 15, name: 'Shab-e-Barat', arabic: 'ليلة البراءة', icon: '🌕', color: '#00BCD4' },
  { month: 9, day: 1, name: 'Ramadan Begins', arabic: 'بداية رمضان', icon: '🌙', color: '#4CAF50' },
  { month: 9, day: 27, name: 'Laylat al-Qadr', arabic: 'ليلة القدر', icon: '⭐', color: '#FFD700' },
  { month: 10, day: 1, name: 'Eid al-Fitr', arabic: 'عيد الفطر', icon: '🎉', color: '#E91E63' },
  { month: 12, day: 8, name: 'Day of Tarwiyah', arabic: 'يوم التروية', icon: '🏔️', color: '#795548' },
  { month: 12, day: 9, name: 'Day of Arafah', arabic: 'يوم عرفة', icon: '🤲', color: '#FF5722' },
  { month: 12, day: 10, name: 'Eid al-Adha', arabic: 'عيد الأضحى', icon: '🐑', color: '#E91E63' },
];

// Convert Gregorian to Hijri (approximate algorithm)
function gregorianToHijri(date: Date): { year: number; month: number; day: number } {
  const jd = Math.floor((date.getTime() - new Date(1970, 0, 1).getTime()) / 86400000) + 2440588;
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

// Convert Hijri to Gregorian (approximate algorithm)
function hijriToGregorian(year: number, month: number, day: number): Date {
  const jd = Math.floor((11 * year + 3) / 30) + 354 * year + 30 * month - Math.floor((month - 1) / 2) + day + 1948440 - 385;
  const l = jd + 68569;
  const n = Math.floor((4 * l) / 146097);
  const l2 = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l2 + 1)) / 1461001);
  const l3 = l2 - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l3) / 2447);
  const gDay = l3 - Math.floor((2447 * j) / 80);
  const l4 = Math.floor(j / 11);
  const gMonth = j + 2 - 12 * l4;
  const gYear = 100 * (n - 49) + i + l4;
  return new Date(gYear, gMonth - 1, gDay);
}

// Get days remaining until a date
function getDaysRemaining(targetDate: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  const diff = targetDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function IslamicCalendar({ visible, onClose }: Props) {
  const [currentHijri, setCurrentHijri] = useState<{ year: number; month: number; day: number }>(() => gregorianToHijri(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const hijri = gregorianToHijri(new Date());
    return hijri.month - 1;
  });
  const [viewMode, setViewMode] = useState<'events' | 'calendar'>('events');

  // No need for useEffect since we initialize state with the values

  // Calculate upcoming events with days remaining
  const upcomingEvents = useMemo(() => {
    const events: Array<{
      event: typeof ISLAMIC_EVENTS[0];
      gregorianDate: Date;
      daysRemaining: number;
      hijriYear: number;
    }> = [];

    // Check events for current year and next year
    for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
      const targetYear = currentHijri.year + yearOffset;
      
      for (const event of ISLAMIC_EVENTS) {
        const gregorianDate = hijriToGregorian(targetYear, event.month, event.day);
        const daysRemaining = getDaysRemaining(new Date(gregorianDate));
        
        if (daysRemaining >= 0) {
          events.push({
            event,
            gregorianDate,
            daysRemaining,
            hijriYear: targetYear,
          });
        }
      }
    }

    // Sort by days remaining
    events.sort((a, b) => a.daysRemaining - b.daysRemaining);
    
    // Remove duplicates (keep the nearest occurrence)
    const seen = new Set<string>();
    return events.filter(e => {
      const key = e.event.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [currentHijri]);

  // Generate calendar days for selected month
  const calendarDays = useMemo(() => {
    const monthLength = selectedMonth % 2 === 0 ? 30 : 29; // Alternating 30/29 days
    const days: Array<{
      hijriDay: number;
      gregorianDate: Date;
      event?: typeof ISLAMIC_EVENTS[0];
      isToday: boolean;
    }> = [];

    for (let day = 1; day <= monthLength; day++) {
      const gregorianDate = hijriToGregorian(currentHijri.year, selectedMonth + 1, day);
      const event = ISLAMIC_EVENTS.find(e => e.month === selectedMonth + 1 && e.day === day);
      const isToday = currentHijri.month === selectedMonth + 1 && currentHijri.day === day;
      
      days.push({
        hijriDay: day,
        gregorianDate,
        event,
        isToday,
      });
    }

    return days;
  }, [currentHijri, selectedMonth]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeX} onPress={onClose}>
            <Text style={styles.closeXText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerIcon}>📅</Text>
          <Text style={styles.headerTitle}>Islamic Calendar</Text>
          <Text style={styles.headerArabic}>التقويم الهجري</Text>
          <Text style={styles.currentDate}>
            {currentHijri.day} {HIJRI_MONTHS[currentHijri.month - 1]?.english} {currentHijri.year} AH
          </Text>
        </View>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, viewMode === 'events' && styles.tabActive]}
              onPress={() => setViewMode('events')}
            >
              <Text style={[styles.tabText, viewMode === 'events' && styles.tabTextActive]}>
                🎉 Events
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, viewMode === 'calendar' && styles.tabActive]}
              onPress={() => setViewMode('calendar')}
            >
              <Text style={[styles.tabText, viewMode === 'calendar' && styles.tabTextActive]}>
                📆 Calendar
              </Text>
            </TouchableOpacity>
          </View>

          {viewMode === 'events' ? (
            /* Events View */
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>UPCOMING ISLAMIC EVENTS</Text>
              
              {upcomingEvents.map((item, index) => (
                <View 
                  key={`${item.event.name}-${index}`} 
                  style={[styles.eventCard, { borderLeftColor: item.event.color }]}
                >
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventIcon}>{item.event.icon}</Text>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventName}>{item.event.name}</Text>
                      <Text style={styles.eventArabic}>{item.event.arabic}</Text>
                    </View>
                    <View style={[styles.daysRemainingBadge, { backgroundColor: item.event.color }]}>
                      <Text style={styles.daysRemainingNum}>{item.daysRemaining}</Text>
                      <Text style={styles.daysRemainingLabel}>
                        {item.daysRemaining === 0 ? 'TODAY' : item.daysRemaining === 1 ? 'DAY' : 'DAYS'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.eventDates}>
                    <Text style={styles.hijriDateText}>
                      📅 {item.event.day} {HIJRI_MONTHS[item.event.month - 1]?.english} {item.hijriYear} AH
                    </Text>
                    <Text style={styles.gregorianDateText}>
                      🗓️ {item.gregorianDate.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.yearOverview}>
                <Text style={styles.yearOverviewTitle}>📖 Year Overview {currentHijri.year} AH</Text>
                <View style={styles.monthGrid}>
                  {HIJRI_MONTHS.map((month, index) => {
                    const eventsInMonth = ISLAMIC_EVENTS.filter(e => e.month === index + 1);
                    const isCurrentMonth = currentHijri.month === index + 1;
                    
                    return (
                      <TouchableOpacity
                        key={month.english}
                        style={[
                          styles.monthCard,
                          isCurrentMonth && styles.monthCardCurrent,
                          eventsInMonth.length > 0 && styles.monthCardHasEvents
                        ]}
                        onPress={() => {
                          setSelectedMonth(index);
                          setViewMode('calendar');
                        }}
                      >
                        <Text style={[styles.monthArabic, isCurrentMonth && styles.monthTextCurrent]}>
                          {month.arabic}
                        </Text>
                        <Text style={[styles.monthEnglish, isCurrentMonth && styles.monthTextCurrent]}>
                          {month.english}
                        </Text>
                        {eventsInMonth.length > 0 && (
                          <View style={styles.eventDots}>
                            {eventsInMonth.slice(0, 3).map((e, i) => (
                              <View key={i} style={[styles.eventDot, { backgroundColor: e.color }]} />
                            ))}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          ) : (
            /* Calendar View */
            <View style={styles.calendarView}>
              {/* Month Selector */}
              <View style={styles.monthSelector}>
                <TouchableOpacity
                  style={styles.monthNavBtn}
                  onPress={() => setSelectedMonth(prev => prev > 0 ? prev - 1 : 11)}
                >
                  <Text style={styles.monthNavText}>◀</Text>
                </TouchableOpacity>
                <View style={styles.monthDisplay}>
                  <Text style={styles.monthDisplayArabic}>{HIJRI_MONTHS[selectedMonth]?.arabic}</Text>
                  <Text style={styles.monthDisplayEnglish}>
                    {HIJRI_MONTHS[selectedMonth]?.english} {currentHijri.year} AH
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.monthNavBtn}
                  onPress={() => setSelectedMonth(prev => prev < 11 ? prev + 1 : 0)}
                >
                  <Text style={styles.monthNavText}>▶</Text>
                </TouchableOpacity>
              </View>

              {/* Day Headers */}
              <View style={styles.dayHeaders}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <Text key={day} style={[styles.dayHeader, day === 'Fri' && styles.dayHeaderFriday]}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <ScrollView style={styles.calendarScroll}>
                <View style={styles.calendarGrid}>
                  {/* Empty cells for alignment */}
                  {calendarDays.length > 0 && Array(calendarDays[0].gregorianDate.getDay()).fill(null).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.dayCell} />
                  ))}
                  
                  {calendarDays.map((day, index) => {
                    const isFriday = day.gregorianDate.getDay() === 5;
                    
                    return (
                      <View
                        key={index}
                        style={[
                          styles.dayCell,
                          day.isToday && styles.dayCellToday,
                          day.event && styles.dayCellEvent,
                        ]}
                      >
                        <Text style={[
                          styles.hijriDayNum,
                          day.isToday && styles.hijriDayNumToday,
                          isFriday && styles.hijriDayNumFriday
                        ]}>
                          {day.hijriDay}
                        </Text>
                        <Text style={styles.gregorianDayNum}>
                          {day.gregorianDate.getDate()}
                        </Text>
                        {day.event && (
                          <Text style={styles.eventIndicator}>{day.event.icon}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Events this month */}
                <View style={styles.monthEvents}>
                  <Text style={styles.monthEventsTitle}>Events in {HIJRI_MONTHS[selectedMonth]?.english}</Text>
                  {ISLAMIC_EVENTS.filter(e => e.month === selectedMonth + 1).map((event, index) => (
                    <View key={index} style={[styles.monthEventItem, { borderLeftColor: event.color }]}>
                      <Text style={styles.monthEventIcon}>{event.icon}</Text>
                      <View style={styles.monthEventInfo}>
                        <Text style={styles.monthEventName}>{event.name}</Text>
                        <Text style={styles.monthEventDate}>{event.day} {HIJRI_MONTHS[selectedMonth]?.english}</Text>
                      </View>
                    </View>
                  ))}
                  {ISLAMIC_EVENTS.filter(e => e.month === selectedMonth + 1).length === 0 && (
                    <Text style={styles.noEvents}>No major events this month</Text>
                  )}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a4a3a', paddingTop: 50, paddingHorizontal: 20 },
  header: { alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  closeX: { position: 'absolute', top: 0, right: 0, padding: 10, zIndex: 10 },
  closeXText: { fontSize: 24, color: '#fff', fontWeight: '300' },
  headerIcon: { fontSize: 40, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#d4af37' },
  headerArabic: { fontSize: 18, color: '#a8d5ba', marginTop: 4 },
  currentDate: { fontSize: 14, color: '#fff', marginTop: 8, opacity: 0.9 },
  tabContainer: { flexDirection: 'row', marginBottom: 15, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#d4af37' },
  tabText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  tabTextActive: { color: '#1a4a3a' },
  scrollView: { flex: 1 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: '#a8d5ba', letterSpacing: 1.5, marginBottom: 15 },
  eventCard: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
  eventHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  eventIcon: { fontSize: 32, marginRight: 12 },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  eventArabic: { fontSize: 14, color: '#a8d5ba', marginTop: 2 },
  daysRemainingBadge: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  daysRemainingNum: { fontSize: 20, fontWeight: '800', color: '#fff' },
  daysRemainingLabel: { fontSize: 8, fontWeight: '600', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5 },
  eventDates: { paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  hijriDateText: { fontSize: 13, color: '#d4af37', marginBottom: 4 },
  gregorianDateText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  yearOverview: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  yearOverviewTitle: { fontSize: 16, fontWeight: '700', color: '#d4af37', marginBottom: 15, textAlign: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  monthCard: { width: '31%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, marginBottom: 10, alignItems: 'center' },
  monthCardCurrent: { backgroundColor: '#d4af37' },
  monthCardHasEvents: { borderWidth: 1, borderColor: 'rgba(212,175,55,0.5)' },
  monthArabic: { fontSize: 14, color: '#fff', fontWeight: '600' },
  monthEnglish: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  monthTextCurrent: { color: '#1a4a3a' },
  eventDots: { flexDirection: 'row', marginTop: 6 },
  eventDot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 1 },
  calendarView: { flex: 1 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  monthNavBtn: { padding: 10 },
  monthNavText: { fontSize: 18, color: '#d4af37' },
  monthDisplay: { alignItems: 'center' },
  monthDisplayArabic: { fontSize: 20, fontWeight: '700', color: '#fff' },
  monthDisplayEnglish: { fontSize: 14, color: '#a8d5ba', marginTop: 2 },
  dayHeaders: { flexDirection: 'row', marginBottom: 10 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  dayHeaderFriday: { color: '#d4af37' },
  calendarScroll: { flex: 1 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  dayCellToday: { backgroundColor: '#d4af37', borderRadius: 10 },
  dayCellEvent: { borderWidth: 2, borderColor: '#d4af37', borderRadius: 10 },
  hijriDayNum: { fontSize: 14, fontWeight: '700', color: '#fff' },
  hijriDayNumToday: { color: '#1a4a3a' },
  hijriDayNumFriday: { color: '#d4af37' },
  gregorianDayNum: { fontSize: 9, color: 'rgba(255,255,255,0.5)' },
  eventIndicator: { fontSize: 10, position: 'absolute', bottom: 2 },
  monthEvents: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  monthEventsTitle: { fontSize: 14, fontWeight: '600', color: '#d4af37', marginBottom: 12 },
  monthEventItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3 },
  monthEventIcon: { fontSize: 24, marginRight: 12 },
  monthEventInfo: { flex: 1 },
  monthEventName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  monthEventDate: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  noEvents: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontStyle: 'italic', paddingVertical: 20 },
  closeBtn: { backgroundColor: '#d4af37', paddingVertical: 14, borderRadius: 12, marginTop: 15, marginBottom: 30 },
  closeBtnText: { fontSize: 16, fontWeight: '700', color: '#1a4a3a', textAlign: 'center' },
});
