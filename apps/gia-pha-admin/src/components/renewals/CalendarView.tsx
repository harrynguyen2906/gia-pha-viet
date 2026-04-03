"use client";

import { useState } from "react";
import useSWR from "swr";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from "date-fns";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const { data, isLoading } = useSWR(`/api/admin/renewals/calendar?month=${month}&year=${year}`, fetcher);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const startingDayIndex = getDay(startOfMonth(currentDate));
  const blankDays = Array.from({ length: startingDayIndex }).map((_, i) => i);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface-container-low border border-outline-variant/30 p-4 rounded-sm text-secondary">
        <button onClick={prevMonth} className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-secondary"><ChevronLeft className="w-6 h-6" /></button>
        <h2 className="text-xl font-bold font-['Noto_Serif'] text-secondary uppercase tracking-widest">{format(currentDate, "MMMM yyyy")}</h2>
        <button onClick={nextMonth} className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-secondary"><ChevronRight className="w-6 h-6" /></button>
      </div>

      <div className="border border-outline-variant/30 rounded-sm overflow-hidden bg-surface-container-lowest">
        <div className="grid grid-cols-7 border-b border-outline-variant/30 bg-surface-container-high">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-4 text-center text-sm font-bold font-['Noto_Serif'] text-on-surface-variant tracking-widest uppercase">
              {day}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-on-surface-variant flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-secondary" />
            Đang tải lịch trình...
          </div>
        ) : (
          <div className="grid grid-cols-7 grid-rows-5 gap-[1px] bg-outline-variant/20">
            {blankDays.map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[120px] bg-surface-container-lowest p-2"></div>
            ))}
            
            {daysInMonth.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayData = data?.[dateStr] || { count: 0, atRisk: 0, totalRevenue: 0 };
              
              const intensity = dayData.count === 0 ? "" 
                              : dayData.count < 3 ? "bg-secondary-container/20 border-secondary/30" 
                              : dayData.count < 10 ? "bg-secondary-container/40 border-secondary/50" 
                              : "bg-secondary-container/60 border-secondary/70";

              return (
                <div key={dateStr} className={cn("min-h-[120px] p-3 flex flex-col transition-colors relative group", "bg-surface-container-low hover:bg-surface-container-highest", isToday(day) && "ring-2 ring-inset ring-secondary shadow-[inset_0_0_15px_rgba(233,193,118,0.2)]")}>
                  <div className={cn("text-right text-sm font-medium mb-2", isToday(day) ? "font-bold text-secondary text-lg" : "text-on-surface-variant")}>
                    {format(day, "d")}
                  </div>
                  
                  {dayData.count > 0 && (
                    <div className={cn("flex-1 flex flex-col items-center justify-center rounded-sm border backdrop-blur-sm", intensity)}>
                      <span className="text-2xl font-bold font-display text-secondary drop-shadow-md">{dayData.count}</span>
                      <span className="text-xs text-secondary/80 font-['Noto_Serif'] uppercase tracking-wider mt-1">Gia Hạn</span>
                      {dayData.atRisk > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-widest text-[#EA580C] bg-[#EA580C]/10 px-2 py-1 rounded-sm border border-[#EA580C]/20 font-bold">
                          {dayData.atRisk} Rủi Ro
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
