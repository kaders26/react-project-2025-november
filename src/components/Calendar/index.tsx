/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

import type { ScheduleInstance } from "../../models/schedule";
import type { UserInstance } from "../../models/user";

import { updateAssignment } from "../../store/schedule/actions";

import FullCalendar from "@fullcalendar/react";

import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";

import type { EventInput } from "@fullcalendar/core/index.js";

import "../profileCalendar.scss";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);

const COLOR_NAMES = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
  "twenty-one",
  "twenty-two",
  "twenty-three",
  "twenty-four",
  "twenty-five",
  "twenty-six",
  "twenty-seven",
  "twenty-eight",
  "twenty-nine",
  "thirty",
  "thirty-one",
  "thirty-two",
  "thirty-three",
  "thirty-four",
  "thirty-five",
  "thirty-six",
  "thirty-seven",
  "thirty-eight",
  "thirty-nine",
  "forty",
] as const;

const COLOR_COUNT = COLOR_NAMES.length;

const getColorNameByIndex = (index: number) => {
  const safeIndex =
    ((Number.isNaN(index) ? 0 : index) % COLOR_COUNT + COLOR_COUNT) % COLOR_COUNT;
  return COLOR_NAMES[safeIndex];
};

type PairDayInfo = {
  staffId: string;
  staffName: string;
  colorClass: string;
};

type CalendarContainerProps = {
  schedule: ScheduleInstance;
  auth: UserInstance;
};

type EventModalData = {
  staffName: string;
  shiftName: string;
  date: string;
  startTime: string;
  endTime: string;
  isUpdated: boolean;
} | null;

const CalendarContainer = ({ schedule, auth }: CalendarContainerProps) => {
  const calendarRef = useRef<FullCalendar>(null);
  const dispatch = useDispatch();

  const [events, setEvents] = useState<EventInput[]>([]);
  const [highlightedDates, setHighlightedDates] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [initialDate, setInitialDate] = useState<Date>(
    schedule?.scheduleStartDate 
      ? dayjs(schedule.scheduleStartDate).toDate() 
      : new Date()
  );
  const [eventModalData, setEventModalData] = useState<EventModalData>(null);
  const [pairDates, setPairDates] = useState<Map<string, PairDayInfo[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Filtrelenmiş personel listesi
  const filteredStaffs = schedule?.staffs?.filter((staff: any) =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Yükleme durumu gösterimi
  const LoadingSpinner = () => (
    <div className="calendar-loading">
      <div className="spinner"></div>
      <p>Takvim yükleniyor...</p>
    </div>
  );

  // Boş durum gösterimi
  const EmptyState = () => (
    <div className="calendar-empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" height="64px" viewBox="0 -960 960 960" width="64px" fill="#cccccc">
        <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Z"/>
      </svg>
      <h3>Henüz Vardiya Atanmamış</h3>
      <p>Seçili personel için gösterilecek vardiya bulunmuyor.</p>
    </div>
  );

  const getPlugins = () => {
    const plugins = [dayGridPlugin];

    plugins.push(interactionPlugin);
    return plugins;
  };

  const getShiftById = (id: string) => {
    return schedule?.shifts?.find((shift: { id: string }) => id === shift.id);
  };

  const getAssignmentById = (id: string) => {
    return schedule?.assignments?.find((assign) => id === assign.id);
  };

  const getStaffById = (id: string) => {
    return schedule?.staffs?.find((staff: { id: string }) => staff.id === id);
  };

  // Shift ve staff bazlı renk belirleme fonksiyonu
  const getEventColorClass = (shiftId: string, staffId: string): string => {
    const shiftIndex = schedule?.shifts?.findIndex((s) => s.id === shiftId) ?? 0;
    const staffIndex = schedule?.staffs?.findIndex((s) => s.id === staffId) ?? 0;
    const staffCount = schedule?.staffs?.length ?? 1;

    const colorName = getColorNameByIndex(shiftIndex * staffCount + staffIndex);
    return `bg-${colorName}`;
  };

  // Staff bazlı renk belirleme fonksiyonu (pair renklendirmesi için)
  const getStaffColorClass = (staffId: string): string => {
    const staffIndex = schedule?.staffs?.findIndex((s) => s.id === staffId) ?? 0;
    return getColorNameByIndex(staffIndex);
  };

  const validDates = () => {
    const dates = [];
    let currentDate = dayjs(schedule.scheduleStartDate);
    while (
      currentDate.isBefore(schedule.scheduleEndDate) ||
      currentDate.isSame(schedule.scheduleEndDate)
    ) {
      dates.push(currentDate.format("YYYY-MM-DD"));
      currentDate = currentDate.add(1, "day");
    }

    return dates;
  };

  const getDatesBetween = (startDate: string, endDate: string) => {
    const dates = [];
    const start = dayjs(startDate, "DD.MM.YYYY").toDate();
    const end = dayjs(endDate, "DD.MM.YYYY").toDate();
    const current = new Date(start);

    while (current <= end) {
      dates.push(dayjs(current).format("DD-MM-YYYY"));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const generateStaffBasedCalendar = () => {
    setIsLoading(true);
    const works: EventInput[] = [];

    // Schedule veya assignments yoksa boş döndür
    if (!schedule || !schedule.assignments || !selectedStaffId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    // Seçili staff'a göre assignment'ları filtrele
    const filteredAssignments = schedule.assignments.filter(
      (assign) => assign.staffId === selectedStaffId
    );

    for (let i = 0; i < filteredAssignments.length; i++) {
      const assignment = filteredAssignments[i];
      const shift = getShiftById(assignment.shiftId);
      const staff = getStaffById(assignment.staffId);
      
      if (!shift || !staff) continue;

      // Tarih değerlerini güvenli bir şekilde parse et
      // Geçersiz tarih formatlarını düzelt (örn: "T017" -> "T17:00")
      const normalizeDateTime = (dateTimeStr: string): string => {
        if (!dateTimeStr) return dateTimeStr;
        // "T017" veya "T0017" gibi geçersiz formatları düzelt
        // Örnek: "2025-10-11T017:30:00.000Z" -> "2025-10-11T17:30:00.000Z"
        return dateTimeStr.replace(/T0+(\d+):/, (match, hourStr) => {
          const normalizedHour = parseInt(hourStr, 10);
          // Saat 0-23 arasında olmalı
          if (normalizedHour >= 0 && normalizedHour <= 23) {
            return `T${normalizedHour.toString().padStart(2, '0')}:`;
          }
          return match; // Geçersizse olduğu gibi bırak
        });
      };

      const normalizedShiftStart = normalizeDateTime(assignment.shiftStart);
      const normalizedShiftEnd = normalizeDateTime(assignment.shiftEnd);

      // Assignment'ın başlangıç ve bitiş zamanlarını al
      let startDateTime = dayjs.utc(normalizedShiftStart);
      let endDateTime = dayjs.utc(normalizedShiftEnd);

      // Geçersiz tarih kontrolü
      if (!startDateTime.isValid() || !endDateTime.isValid()) {
        continue; // Geçersiz tarihli assignment'ı atla
      }

      const assignmentDate = startDateTime.format("YYYY-MM-DD");
      const isValidDate = validDates().includes(assignmentDate);

      // Shift ve staff bazlı renk sınıfı
      const colorClass = getEventColorClass(assignment.shiftId, assignment.staffId);

      const work: EventInput = {
        id: assignment.id,
        title: shift.name || 'Shift',
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        allDay: false,
        extendedProps: {
          staffId: assignment.staffId,
          shiftId: assignment.shiftId,
          date: assignmentDate,
          staffName: staff.name,
          shiftName: shift.name,
          startTime: startDateTime.format("HH:mm"),
          endTime: endDateTime.format("HH:mm"),
          isUpdated: assignment.isUpdated,
        },
        classNames: [`event`, colorClass, 
          assignment.isUpdated ? "highlight" : "",
          !isValidDate ? "invalid-date" : ""
        ].filter(Boolean),
      };
      
      works.push(work);
    }

    // Off days ve highlighted dates işleme
    if (schedule?.scheduleStartDate && schedule?.scheduleEndDate) {
      const selectedStaff = schedule?.staffs?.find(
        (staff) => staff.id === selectedStaffId
      );
      
      const offDays = selectedStaff?.offDays;
      
      const dates = getDatesBetween(
        dayjs(schedule.scheduleStartDate).format("DD.MM.YYYY"),
        dayjs(schedule.scheduleEndDate).format("DD.MM.YYYY")
      );
      let highlightedDates: string[] = [];

      dates.forEach((date) => {
        const transformedDate = dayjs(date, "DD-MM-YYYY").format("DD.MM.YYYY");
        if (offDays?.includes(transformedDate)) highlightedDates.push(date);
      });

      setHighlightedDates(highlightedDates);
    }

    // Pair günlerini hesapla ve renklendir (schedule tarih aralığından bağımsız)
    // ÇİFT YÖNLÜ PAIR KONTROLÜ: Hem seçili personelin pairList'i, hem de diğer personellerin pairList'lerinde seçili personel aranır
    const pairDatesMap = new Map<string, PairDayInfo[]>();
    
    if (selectedStaffId) {
      const selectedStaff = schedule?.staffs?.find(
        (staff) => staff.id === selectedStaffId
      );
      
      // 1. Seçili personelin kendi pairList'i (Örn: Esra'nın pairList'i)
      if (selectedStaff?.pairList && selectedStaff.pairList.length > 0) {
        selectedStaff.pairList.forEach((pair: any) => {
          const pairPartner = getStaffById(pair.staffId);
          if (!pairPartner) {
            return;
          }

          processPairDates(pair, pairPartner, pairDatesMap);
        });
      }
      
      // 2. DİĞER personellerin pairList'lerinde seçili personeli ara (ÇİFT YÖNLÜ KONTROL)
      // Örn: Seda seçiliyken, Esra'nın pairList'inde Seda var mı?
      schedule?.staffs?.forEach((otherStaff: any) => {
        // Kendini atlama
        if (otherStaff.id === selectedStaffId) return;
        
        if (otherStaff.pairList && otherStaff.pairList.length > 0) {
          otherStaff.pairList.forEach((pair: any) => {
            // Bu pair seçili personel için mi?
            if (pair.staffId === selectedStaffId) {
              // Evet! O halde bu pair'i de ekle ama rengi diğer personelin rengi olsun
              const pairPartner = otherStaff; // Diğer personel (örn: Esra)
              
              processPairDates(pair, pairPartner, pairDatesMap);
            }
          });
        }
      });
    }
    
    // Pair tarihlerini işleyen yardımcı fonksiyon
    function processPairDates(pair: any, pairPartner: any, pairDatesMap: Map<string, PairDayInfo[]>) {
      // Tarihleri parse et - farklı formatları dene
      // 1. Önce DD.MM.YYYY formatını dene (strict)
      let pairStartDate = dayjs(pair.startDate, "DD.MM.YYYY", true);
      let pairEndDate = dayjs(pair.endDate, "DD.MM.YYYY", true);
      
      // 2. Eğer strict parse başarısız olduysa, customParseFormat plugin olmadan dene
      if (!pairStartDate.isValid()) {
        // Manuel parse: "DD.MM.YYYY" -> "YYYY-MM-DD"
        if (typeof pair.startDate === 'string' && /^\d{2}\.\d{2}\.\d{4}$/.test(pair.startDate)) {
          const parts = pair.startDate.split('.');
          const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
          pairStartDate = dayjs(isoDate);
        } else {
          pairStartDate = dayjs(pair.startDate);
        }
      }
      
      if (!pairEndDate.isValid()) {
        // Manuel parse: "DD.MM.YYYY" -> "YYYY-MM-DD"
        if (typeof pair.endDate === 'string' && /^\d{2}\.\d{2}\.\d{4}$/.test(pair.endDate)) {
          const parts = pair.endDate.split('.');
          const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
          pairEndDate = dayjs(isoDate);
        } else {
          pairEndDate = dayjs(pair.endDate);
        }
      }
      
      // Geçersiz tarih kontrolü
      if (!pairStartDate.isValid() || !pairEndDate.isValid()) {
        return;
      }
      
      // Tarihleri normalize et
      pairStartDate = pairStartDate.startOf('day');
      pairEndDate = pairEndDate.startOf('day');
      
      // Tarih aralığı kontrolü - çok geniş aralıkları engelle (max 365 gün)
      const daysDiff = pairEndDate.diff(pairStartDate, 'day');
      if (daysDiff < 0) {
        return;
      }
      
      if (daysDiff > 365) {
        // Çok geniş aralıkları atla veya sınırla
        return;
      }
      
      // Pair tarih aralığındaki tüm günleri işle (başlangıç ve bitiş dahil)
      let currentPairDate = pairStartDate.clone();
      const pairDatesList: string[] = [];
      let dayCount = 0;
      const MAX_DAYS = 365; // Güvenlik limiti
      
      while (currentPairDate.isSameOrBefore(pairEndDate, 'day') && dayCount < MAX_DAYS) {
        const dateKey = currentPairDate.format("YYYY-MM-DD");
        const colorClass = getStaffColorClass(pairPartner.id); // pairPartner'ın ID'sini kullan
        const existingPairs = pairDatesMap.get(dateKey) ?? [];
        
        // Aynı pair'i tekrar eklememek için kontrol et
        const alreadyExists = existingPairs.some(
          (p) => p.staffId === pairPartner.id && p.staffName === pairPartner.name
        );
        
        if (!alreadyExists) {
          pairDatesMap.set(dateKey, [
            ...existingPairs,
            {
              staffId: pairPartner.id,
              staffName: pairPartner.name,
              colorClass,
            },
          ]);
        }

        pairDatesList.push(dateKey);
        currentPairDate = currentPairDate.add(1, 'day');
        dayCount++;
      }
    }

    setPairDates(pairDatesMap);

    setEvents(works);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!schedule || !schedule.staffs || schedule.staffs.length === 0) {
      return;
    }
    const firstStaffId = schedule.staffs[0]?.id;
    if (firstStaffId) {
      setSelectedStaffId(firstStaffId);
    }
  }, [schedule]);

  useEffect(() => {
    if (schedule && selectedStaffId) {
      generateStaffBasedCalendar();
    } else {
      // Eğer schedule veya selectedStaffId yoksa, pairDates'i temizle
      setPairDates(new Map());
    }
  }, [selectedStaffId, schedule]);

  const handleEventClick = (clickInfo: any) => {
    // FullCalendar'ın eventClick'inden gelen format: { event, ... }
    const event = clickInfo.event;
    
    if (!event) {
      return;
    }
    
    const extendedProps = event.extendedProps || {};
    
    const modalData = {
      staffName: extendedProps.staffName || 'N/A',
      shiftName: extendedProps.shiftName || event.title || 'N/A',
      date: dayjs(event.start).format("DD.MM.YYYY"),
      startTime: extendedProps.startTime || dayjs(event.start).format("HH:mm"),
      endTime: extendedProps.endTime || dayjs(event.end).format("HH:mm"),
      isUpdated: extendedProps.isUpdated || false,
    };
    
    setEventModalData(modalData);
  };

  const closeModal = () => {
    setEventModalData(null);
  };

  // Event sürükle-bırak handler'ı
  const handleEventDrop = (dropInfo: any) => {
    const event = dropInfo.event;
    const assignmentId = event.id;
    
    if (!assignmentId) {
      dropInfo.revert();
      return;
    }

    // Yeni başlangıç zamanını al
    const oldStart = dropInfo.oldEvent.start;
    const newStart = event.start;

    if (!newStart || !oldStart) {
      dropInfo.revert();
      return;
    }

    // Gün farkını hesapla
    const daysDiff = dayjs(newStart).diff(dayjs(oldStart), 'day');
    
    // Orijinal assignment'ı bul
    const assignment = getAssignmentById(assignmentId);
    if (!assignment) {
      dropInfo.revert(); // Değişikliği geri al
      return;
    }

    // Tarih normalizasyonu (T017 -> T17 gibi hataları düzelt)
    const normalizeDateTime = (dateTimeStr: string): string => {
      if (!dateTimeStr) return dateTimeStr;
      return dateTimeStr.replace(/T0+(\d+):/, (match, hourStr) => {
        const normalizedHour = parseInt(hourStr, 10);
        if (normalizedHour >= 0 && normalizedHour <= 23) {
          return `T${normalizedHour.toString().padStart(2, '0')}:`;
        }
        return match;
      });
    };
    
    // Eski tarihlerden gün farkını ekleyerek yeni tarihleri hesapla
    const normalizedShiftStart = normalizeDateTime(assignment.shiftStart);
    const normalizedShiftEnd = normalizeDateTime(assignment.shiftEnd);
    
    const oldShiftStart = dayjs.utc(normalizedShiftStart);
    const oldShiftEnd = dayjs.utc(normalizedShiftEnd);
    
    if (!oldShiftStart.isValid() || !oldShiftEnd.isValid()) {
      dropInfo.revert();
      return;
    }
    
    const newShiftStart = oldShiftStart.add(daysDiff, 'day').toISOString();
    const newShiftEnd = oldShiftEnd.add(daysDiff, 'day').toISOString();

    // Redux'a güncelleme dispatch et
    dispatch(updateAssignment({
      assignmentId,
      newStart: newShiftStart,
      newEnd: newShiftEnd,
    }) as any);
  };

  return (
    <div className="calendar-section">
      {/* Kontrol Paneli */}
      <div className="calendar-controls">
        <div className="staff-search-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
          </svg>
          <input
            type="text"
            placeholder="Personel ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="staff-search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>

        <div className="view-toggle">
          <button
            className={viewMode === 'month' ? 'active' : ''}
            onClick={() => {
              setViewMode('month');
              calendarRef.current?.getApi().changeView('dayGridMonth');
            }}
          >
            Ay
          </button>
          <button
            className={viewMode === 'week' ? 'active' : ''}
            onClick={() => {
              setViewMode('week');
              calendarRef.current?.getApi().changeView('dayGridWeek');
            }}
          >
            Hafta
          </button>
        </div>
      </div>

      <div className="calendar-wrapper">
        <div className="staff-list">
          {filteredStaffs.length === 0 ? (
            <div className="no-staff-found">
              <p>Personel bulunamadı</p>
            </div>
          ) : (
            filteredStaffs.map((staff: any) => {
            const staffColorClass = getStaffColorClass(staff.id);
            const isActive = staff.id === selectedStaffId;
            
            // Renk mapping - SCSS'teki renklerle eşleşiyor
            const colorMap: Record<string, string> = {
              'one': '#fcc729',
              'two': '#ff8847',
              'three': '#c0c033',
              'four': '#32a852',
              'five': '#32a8a2',
              'six': '#327ba8',
              'seven': '#3244a8',
              'eight': '#5a32a8',
              'nine': '#a832a4',
              'ten': '#fffe88',
              'eleven': '#c2068a',
              'twelve': '#c28d06',
              'thirteen': '#a2c206',
              'fourteen': '#3bc206',
              'fifteen': '#108f7c',
              'sixteen': '#10278f',
              'seventeen': '#51108f',
              'eighteen': '#118f22',
              'nineteen': '#620878',
              'twenty': '#40690a',
              'twenty-one': '#81f4cf',
              'twenty-two': '#09aa1d',
              'twenty-three': '#60d3e1',
              'twenty-four': '#8de149',
              'twenty-five': '#74db6c',
              'twenty-six': '#47216b',
              'twenty-seven': '#447804',
              'twenty-eight': '#933862',
              'twenty-nine': '#7ff932',
              'thirty': '#2a7626',
              'thirty-one': '#b6065f',
              'thirty-two': '#52e6d3',
              'thirty-three': '#c8b062',
              'thirty-four': '#a749b7',
              'thirty-five': '#c1e87c',
              'thirty-six': '#13249d',
              'thirty-seven': '#01c40b',
              'thirty-eight': '#2e6332',
              'thirty-nine': '#70ae19',
              'forty': '#b3524c',
            };
            
            const staffColor = colorMap[staffColorClass] || '#19979c';

            return (
              <div
                key={staff.id}
                onClick={() => setSelectedStaffId(staff.id)}
                className={`staff staff-color-${staffColorClass} ${
                  isActive ? "active" : ""
                }`}
                style={{
                  '--staff-color': staffColor,
                } as React.CSSProperties}
              >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
              >
                <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17-62.5t47-43.5q60-30 124.5-46T480-440q67 0 131.5 16T736-378q30 15 47 43.5t17 62.5v112H160Zm320-400q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm160 228v92h80v-32q0-11-5-20t-15-14q-14-8-29.5-14.5T640-332Zm-240-21v53h160v-53q-20-4-40-5.5t-40-1.5q-20 0-40 1.5t-40 5.5ZM240-240h80v-92q-15 5-30.5 11.5T260-306q-10 5-15 14t-5 20v32Zm400 0H320h320ZM480-640Z" />
              </svg>
                <span>{staff.name}</span>
                {isActive && (
                  <svg className="check-icon" xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                    <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
                  </svg>
                )}
              </div>
            );
          })
          )}
        </div>

        {/* Takvim */}
        {isLoading ? (
          <LoadingSpinner />
        ) : events.length === 0 && selectedStaffId ? (
          <EmptyState />
        ) : (
          <FullCalendar
            ref={calendarRef}
            locale={auth.language}
            plugins={getPlugins()}
            contentHeight={550}
          handleWindowResize={true}
          selectable={true}
          editable={true}
          eventOverlap={true}
          eventDurationEditable={false}
          eventStartEditable={true}
          eventConstraint={undefined}
          selectConstraint={undefined}
          initialView="dayGridMonth"
          initialDate={initialDate}
          events={(_fetchInfo, successCallback) => {
            // Event'lere editable ekle
            const editableEvents = events.map(event => ({
              ...event,
              editable: true,
              startEditable: true,
              durationEditable: false,
            }));
            successCallback(editableEvents);
          }}
          firstDay={1}
          dayMaxEventRows={4}
          fixedWeekCount={true}
          showNonCurrentDates={true}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventAllow={() => {
            return true; // HER ZAMAN izin ver
          }}
          eventDidMount={(arg: any) => {
            // Event mount olduğunda editable yap
            if (arg.event) {
              arg.event.setProp('editable', true);
              arg.event.setProp('startEditable', true);
              arg.event.setProp('durationEditable', false);
            }
            
            // Sadece cursor stilini değiştir - FullCalendar'ın kendi drag sistemini kullan
            if (arg.el) {
              arg.el.style.cursor = 'move';
              arg.el.title = 'Sürükleyerek taşıyabilirsiniz';
              
              // Manuel click handler
              const manualClickHandler = (e: MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                handleEventClick(arg);
              };
              
              arg.el.addEventListener('click', manualClickHandler, { capture: true });
              (arg.el as any).__manualClickHandler = manualClickHandler;
            }
          }}
          eventWillUnmount={(arg: any) => {
            // Cleanup
            if (arg.el && (arg.el as any).__manualClickHandler) {
              arg.el.removeEventListener('click', (arg.el as any).__manualClickHandler, { capture: true });
            }
          }}
          datesSet={() => {
            // Takvimde görünen tarihi güncelle
            if (
              calendarRef?.current?.getApi().getDate() &&
              !dayjs(schedule?.scheduleStartDate).isSame(
                calendarRef?.current?.getApi().getDate(),
                'month'
              )
            ) {
              setInitialDate(calendarRef?.current?.getApi().getDate());
            }

            // Navigasyon butonlarını her zaman aktif tut (sınırsız ileri/geri gidebilme)
            const prevButton = document.querySelector(
              ".fc-prev-button"
            ) as HTMLButtonElement;
            const nextButton = document.querySelector(
              ".fc-next-button"
            ) as HTMLButtonElement;

            if (prevButton) {
              prevButton.disabled = false;
            }
            if (nextButton) {
              nextButton.disabled = false;
            }
          }}
          dayCellClassNames={({ date }) => {
            // pairDates Map'inin boş olup olmadığını kontrol et
            if (!pairDates || pairDates.size === 0) {
              return "";
            }
            
            const normalizedDate = dayjs(date).startOf("day");
            const dateKey = normalizedDate.format("YYYY-MM-DD");
            const pairInfo = pairDates.get(dateKey);
            
            // pairInfo yoksa veya boşsa, sınıf ekleme
            if (!pairInfo || !Array.isArray(pairInfo) || pairInfo.length === 0) {
              return "";
            }
            
            const classes = ["has-pair-day"];
            // Her pair için ayrı sınıf ekle
            pairInfo.forEach((pair) => {
              if (pair && pair.colorClass && typeof pair.colorClass === 'string') {
                classes.push(`pair-day-${pair.colorClass}`);
              }
            });
            
            return classes.join(" ");
          }}
          dayCellContent={({ date }) => {
            const normalizedDate = dayjs(date).startOf("day");
            const dateKey = normalizedDate.format("YYYY-MM-DD");

            const found = validDates().includes(dateKey);
            const isHighlighted = highlightedDates.includes(
              normalizedDate.format("DD-MM-YYYY")
            );

            // Pair bilgisini al - sadece pair olan günler için dolu olacak
            // pairDates Map'inin boş olup olmadığını kontrol et
            let pairInfo: PairDayInfo[] = [];
            if (pairDates && pairDates.size > 0) {
              const info = pairDates.get(dateKey);
              if (info && Array.isArray(info) && info.length > 0) {
                pairInfo = info;
              }
            }

            const hasPair = pairInfo.length > 0;

            const pairTitle = hasPair
              ? pairInfo
                  .map((pair) => pair?.staffName)
                  .filter(Boolean)
                  .join(", ")
              : undefined;

            const classes = [
              "calendar-day",
              found ? "" : "date-range-disabled",
              isHighlighted ? "highlighted-date-orange" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                className={classes}
                title={pairTitle ? `Pair: ${pairTitle}` : undefined}
              >
                <span className="calendar-day-number">
                  {normalizedDate.date()}
                </span>
                {/* SADECE pair olan günlerde çizgi göster - koşullu render */}
                {hasPair ? (
                  <div className="pair-highlight-wrapper">
                    {pairInfo
                      .filter((pair) => pair && pair.colorClass)
                      .map((pair, index) => (
                        <span
                          key={`${dateKey}-${pair.staffId}-${index}`}
                          className={`highlightedPair pair-day-${pair.colorClass}`}
                          aria-label={`Pair: ${pair.staffName || 'Unknown'}`}
                        />
                      ))}
                  </div>
                ) : null}
              </div>
            );
          }}
          dayCellDidMount={(arg: any) => {
            // FullCalendar'ın gün numarasına alt çizgi eklenmesini engelle
            if (arg.el) {
              const dayNumber = arg.el.querySelector('.fc-daygrid-day-number');
              if (dayNumber) {
                (dayNumber as HTMLElement).style.textDecoration = 'none';
                (dayNumber as HTMLElement).style.borderBottom = 'none';
              }
            }
          }}
        />
        )}
      </div>
      
      {/* Event Detay Modal - Gelişmiş Versiyon */}
      {eventModalData && (
        <div className="event-modal-overlay" onClick={closeModal}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <div className="event-modal-header">
              <div className="modal-title-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                  <path d="M200-640h560v-80H200v80Zm0 0v-80 80Zm0 560q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Z"/>
                </svg>
                <h3>Vardiya Detayları</h3>
              </div>
              <button className="event-modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>
            
            <div className="event-modal-body">
              <div className="event-modal-row">
                <span className="event-modal-label">
                  <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                    <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17-62.5t47-43.5q60-30 124.5-46T480-440q67 0 131.5 16T736-378q30 15 47 43.5t17 62.5v112H160Z"/>
                  </svg>
                  Personel
                </span>
                <span className="event-modal-value">{eventModalData.staffName}</span>
              </div>
              
              <div className="event-modal-row">
                <span className="event-modal-label">
                  <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                    <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Z"/>
                  </svg>
                  Vardiya
                </span>
                <span className="event-modal-value shift-name">{eventModalData.shiftName}</span>
              </div>
              
              <div className="event-modal-divider"></div>
              
              <div className="event-modal-row">
                <span className="event-modal-label">
                  <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                    <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Z"/>
                  </svg>
                  Tarih
                </span>
                <span className="event-modal-value date-value">{eventModalData.date}</span>
              </div>
              
              <div className="event-modal-time-row">
                <div className="time-block">
                  <span className="time-label">Başlangıç</span>
                  <span className="time-value">{eventModalData.startTime}</span>
                </div>
                <div className="time-arrow">→</div>
                <div className="time-block">
                  <span className="time-label">Bitiş</span>
                  <span className="time-value">{eventModalData.endTime}</span>
                </div>
              </div>
              
              {eventModalData.isUpdated && (
                <div className="event-modal-footer">
                  <div className="updated-badge-large">
                    <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                      <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
                    </svg>
                    Güncellenmiş Vardiya
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarContainer;
