import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Droplet, 
  Sparkles, 
  Bug, 
  CheckCircle2, 
  Target, 
  Info, 
  Clock,
  Grid,
  ListTodo
} from 'lucide-react';
import { Plant, CareLog, CareTask } from '../types';
import { 
  parseLocalDate, 
  formatLocalDate, 
  addDays, 
  diffDays 
} from '../utils/dateHelpers';

interface CalendarViewProps {
  plants: Plant[];
  logs: CareLog[];
  simulatedToday: string;
  onCareAction: (plantId: string, type: 'water' | 'fertilize' | 'pest') => void;
}

export default function CalendarView({ 
  plants, 
  logs, 
  simulatedToday, 
  onCareAction 
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
  // viewDate controls what range the calendar is currently showing.
  const [viewDate, setViewDate] = useState<Date>(() => parseLocalDate(simulatedToday));
  
  // Selected date is the date the user has clicked inside the grid.
  const [selectedDateStr, setSelectedDateStr] = useState<string>(simulatedToday);

  // Sync viewDate to simulatedToday when simulatedToday moves, 
  // so the calendar automatically steps forward if time accelerates.
  useEffect(() => {
    setViewDate(parseLocalDate(simulatedToday));
    setSelectedDateStr(simulatedToday);
  }, [simulatedToday]);

  // Jump calendar back to simulatedToday
  const handleJumpToToday = () => {
    const today = parseLocalDate(simulatedToday);
    setViewDate(today);
    setSelectedDateStr(simulatedToday);
  };

  // Navigate to previous month or week
  const handlePrev = () => {
    setViewDate((prev) => {
      const copy = new Date(prev);
      if (viewMode === 'month') {
        copy.setMonth(copy.getMonth() - 1);
      } else {
        copy.setDate(copy.getDate() - 7);
      }
      return copy;
    });
  };

  // Navigate to next month or week
  const handleNext = () => {
    setViewDate((prev) => {
      const copy = new Date(prev);
      if (viewMode === 'month') {
        copy.setMonth(copy.getMonth() + 1);
      } else {
        copy.setDate(copy.getDate() + 7);
      }
      return copy;
    });
  };

  // Compute all calendar days to display in monthly view
  const monthlyDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth(); // 0-11
    
    // First day of current month
    const firstDayOfMonth = new Date(year, month, 1);
    // Day of the week for first day (0 = Sun, 6 = Sat)
    const startDayOfWeek = firstDayOfMonth.getDay();
    
    // Total days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Total days in previous month
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    
    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];
    
    // 1. Fill previous month's trailing days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const d = new Date(year, month - 1, dayNum);
      days.push({
        date: d,
        dateStr: formatLocalDate(d),
        isCurrentMonth: false,
      });
    }
    
    // 2. Fill current month's days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dateStr: formatLocalDate(d),
        isCurrentMonth: true,
      });
    }
    
    // 3. Fill next month's leading days to make complete weeks grid (usually 42 cells)
    const totalCells = days.length > 35 ? 42 : 35;
    const nextMonthDaysNeeded = totalCells - days.length;
    for (let i = 1; i <= nextMonthDaysNeeded; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dateStr: formatLocalDate(d),
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [viewDate]);

  // Compute calendar days to display in weekly view (7 days)
  const weeklyDays = useMemo(() => {
    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];
    const currentWeekDay = viewDate.getDay(); // 0 = Sun, 6 = Sat
    
    // Determine the Sunday of the current week
    const startOfWeek = new Date(viewDate);
    startOfWeek.setDate(viewDate.getDate() - currentWeekDay);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push({
        date: d,
        dateStr: formatLocalDate(d),
        isCurrentMonth: d.getMonth() === viewDate.getMonth(),
      });
    }
    
    return days;
  }, [viewDate]);

  const displayedDays = viewMode === 'month' ? monthlyDays : weeklyDays;

  // Generate scheduled/overdue tasks for a given date
  const getTasksForDate = (dateStr: string) => {
    const list: CareTask[] = [];
    
    plants.forEach((plant) => {
      // 1. Water Schedule:
      // Due on lastWatered + waterInterval. Also schedule recurrences optionally?
      // Since it's a calendar, recurring events are shown. Let's show:
      // - If dateStr > plant.lastWatered, and diffDays(lastWatered, dateStr) % interval == 0
      const diffWater = diffDays(plant.lastWatered, dateStr);
      if (diffWater > 0 && diffWater % plant.waterInterval === 0) {
        list.push({
          id: `${plant.id}-water-${dateStr}`,
          plantId: plant.id,
          plantName: plant.name,
          plantImageUrl: plant.imageUrl,
          type: 'water',
          dueDate: dateStr,
          daysRemaining: diffDays(simulatedToday, dateStr),
          isOverdue: dateStr < simulatedToday,
        });
      } else if (dateStr === addDays(plant.lastWatered, plant.waterInterval) && diffWater <= 0) {
        // Fallback for overdue water tasks where dateStr is before simulatedToday or matches
        list.push({
          id: `${plant.id}-water-${dateStr}`,
          plantId: plant.id,
          plantName: plant.name,
          plantImageUrl: plant.imageUrl,
          type: 'water',
          dueDate: dateStr,
          daysRemaining: diffDays(simulatedToday, dateStr),
          isOverdue: dateStr < simulatedToday,
        });
      }

      // 2. Fertilize Schedule:
      if (plant.fertilizeInterval > 0) {
        const diffFert = diffDays(plant.lastFertilized, dateStr);
        if (diffFert > 0 && diffFert % plant.fertilizeInterval === 0) {
          list.push({
            id: `${plant.id}-fertilize-${dateStr}`,
            plantId: plant.id,
            plantName: plant.name,
            plantImageUrl: plant.imageUrl,
            type: 'fertilize',
            dueDate: dateStr,
            daysRemaining: diffDays(simulatedToday, dateStr),
            isOverdue: dateStr < simulatedToday,
          });
        } else if (dateStr === addDays(plant.lastFertilized, plant.fertilizeInterval) && diffFert <= 0) {
          list.push({
            id: `${plant.id}-fertilize-${dateStr}`,
            plantId: plant.id,
            plantName: plant.name,
            plantImageUrl: plant.imageUrl,
            type: 'fertilize',
            dueDate: dateStr,
            daysRemaining: diffDays(simulatedToday, dateStr),
            isOverdue: dateStr < simulatedToday,
          });
        }
      }

      // 3. Pest Schedule:
      if (plant.pestInterval > 0) {
        const diffPest = diffDays(plant.lastPestControl, dateStr);
        if (diffPest > 0 && diffPest % plant.pestInterval === 0) {
          list.push({
            id: `${plant.id}-pest-${dateStr}`,
            plantId: plant.id,
            plantName: plant.name,
            plantImageUrl: plant.imageUrl,
            type: 'pest',
            dueDate: dateStr,
            daysRemaining: diffDays(simulatedToday, dateStr),
            isOverdue: dateStr < simulatedToday,
          });
        } else if (dateStr === addDays(plant.lastPestControl, plant.pestInterval) && diffPest <= 0) {
          list.push({
            id: `${plant.id}-pest-${dateStr}`,
            plantId: plant.id,
            plantName: plant.name,
            plantImageUrl: plant.imageUrl,
            type: 'pest',
            dueDate: dateStr,
            daysRemaining: diffDays(simulatedToday, dateStr),
            isOverdue: dateStr < simulatedToday,
          });
        }
      }
    });

    return list;
  };

  // Find all care tasks for the currently selected date
  const selectedDateTasks = useMemo(() => {
    return getTasksForDate(selectedDateStr);
  }, [plants, selectedDateStr, simulatedToday]);

  const getTaskIconColor = (type: 'water' | 'fertilize' | 'pest') => {
    switch (type) {
      case 'water':
        return 'text-blue-500 bg-blue-50 border-blue-100';
      case 'fertilize':
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'pest':
        return 'text-amber-700 bg-amber-50 border-amber-100';
    }
  };

  const getTaskColorDot = (type: 'water' | 'fertilize' | 'pest') => {
    switch (type) {
      case 'water':
        return 'bg-blue-500';
      case 'fertilize':
        return 'bg-emerald-500';
      case 'pest':
        return 'bg-amber-500';
    }
  };

  const getTaskLabel = (type: 'water' | 'fertilize' | 'pest') => {
    switch (type) {
      case 'water':
        return '浇水灌溉';
      case 'fertilize':
        return '补充肥料';
      case 'pest':
        return '驱虫防黑腐';
    }
  };

  // Format month title
  const currentMonthTitle = useMemo(() => {
    const dict = [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];
    return `${viewDate.getFullYear()}年 ${dict[viewDate.getMonth()]}`;
  }, [viewDate]);

  return (
    <div id="botanical-calendar-manager" className="bento-tile p-6 border-[#E0E7DE] bg-white animate-fade-in space-y-6">
      
      {/* 1. Header with details and Month Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E0E7DE]">
        <div>
          <h2 className="text-md sm:text-lg font-black font-display text-[#3A4D39] flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-[#4A6741]" />
            <span>智能照料日历</span>
            <span className="text-[10px] bg-[#E9F0E6] text-[#4A6741] px-2.5 py-0.5 border border-[#DCE4DB] rounded-full font-bold">
              可视化排期
            </span>
          </h2>
          <p className="text-xs text-[#6B7B6A] mt-1">滚动预测植物日常需水/施肥/驱虫周期，点击任意日期处理任务</p>
        </div>

        {/* View Mode & Time Travel Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Calendar Navigation Buttons */}
          <div className="flex items-center bg-[#F0F4EF] p-1 rounded-2xl border border-[#DCE4DB] text-xs font-bold text-[#3A4D39]">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-[#DCE4DB] rounded-xl transition-colors cursor-pointer"
              title={viewMode === 'month' ? '上个月' : '上周'}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 font-black min-w-[100px] text-center select-none">
              {viewMode === 'month' ? currentMonthTitle : `周视图 (${formatLocalDate(viewDate)})`}
            </span>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-[#DCE4DB] rounded-xl transition-colors cursor-pointer"
              title={viewMode === 'month' ? '下个月' : '下周'}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Jump to Today Accelerator */}
          <button
            onClick={handleJumpToToday}
            className="p-2 px-3 bg-[#E9F0E6] hover:bg-[#DCE4DB] text-[#3A4D39] text-xs font-extrabold rounded-2xl transition-all border border-[#DCE4DB] flex items-center gap-1 cursor-pointer"
            title="回到时空控制器对应的今日日期"
          >
            <Target className="h-3.5 w-3.5" />
            <span>定位今日 ({simulatedToday})</span>
          </button>

          {/* Week/Month Mode Selectors */}
          <div className="flex bg-[#F0F4EF] p-1 rounded-2xl border border-[#DCE4DB] select-none text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                viewMode === 'month'
                  ? 'bg-white text-[#3A4D39] shadow-inner font-black'
                  : 'text-[#6B7B6A] hover:text-[#3A4D39]'
              }`}
            >
              <Grid className="h-3 w-3" />
              月历
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                viewMode === 'week'
                  ? 'bg-white text-[#3A4D39] shadow-inner font-black'
                  : 'text-[#6B7B6A] hover:text-[#3A4D39]'
              }`}
            >
              <ListTodo className="h-3 w-3" />
              周历
            </button>
          </div>
        </div>
      </div>

      {/* Legend Banner */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 p-3 px-4 bg-[#F7F9F5] rounded-2xl border border-[#E0E7DE] text-[11px] font-bold text-[#6B7B6A] select-none">
        <span className="text-[#3A4D39]">养护图例：</span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> 💧 浇水灌溉
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> 🧪 施肥补料
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> 🐛 驱虫防病
        </span>
        <span className="ml-auto text-[#A1ACA0] font-medium hidden sm:inline flex items-center gap-1">
          <Info className="h-3 w-3" /> 双击或单击特定日期来查看详细任务
        </span>
      </div>

      {/* 2. Grid Visualizer */}
      <div className="border border-[#E0E7DE] rounded-[24px] overflow-hidden bg-stone-50/50 shadow-inner">
        {/* Days of week titles */}
        <div className="grid grid-cols-7 bg-[#F0F4EF] border-b border-[#E0E7DE] py-2.5 text-center text-[11px] font-black tracking-wider text-[#4A6741] uppercase">
          <div>周日</div>
          <div>周一</div>
          <div>周二</div>
          <div>周三</div>
          <div>周四</div>
          <div>周五</div>
          <div>周六</div>
        </div>

        {/* Days grid layout */}
        <div className="grid grid-cols-7 bg-white divide-x divide-y divide-[#E0E7DE] border-l border-t border-[#E0E7DE]">
          {displayedDays.map(({ date, dateStr, isCurrentMonth }, idx) => {
            const isToday = dateStr === simulatedToday;
            const isSelected = dateStr === selectedDateStr;
            const tasks = getTasksForDate(dateStr);
            const truncatedTasks = tasks.slice(0, 3);
            const extraTasksCount = Math.max(0, tasks.length - 3);

            return (
              <div
                key={`${dateStr}-${idx}`}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`min-h-[92px] sm:min-h-[112px] p-2 flex flex-col justify-between transition-all duration-200 cursor-pointer relative group select-none ${
                  isCurrentMonth ? 'bg-white' : 'bg-stone-50/50 text-[#A1ACA0]'
                } ${
                  isToday 
                    ? 'ring-2 ring-inset ring-[#4A6741] bg-[#F4F9F2]' 
                    : isSelected 
                    ? 'bg-[#E9F0E6]/60 border-indigo-200/50' 
                    : 'hover:bg-[#F7F9F5]'
                }`}
                title={`日期: ${dateStr}, 共 ${tasks.length} 项护理周期计划`}
              >
                {/* Day Header with indicator badges */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                    isToday 
                      ? 'bg-[#3A4D39] text-white shadow-xs' 
                      : isSelected 
                      ? 'bg-[#DCE4DB] text-[#3A4D39]'
                      : 'text-[#3A4D39] font-black'
                  }`}>
                    {date.getDate()}
                  </span>
                  
                  {isToday && (
                    <span className="text-[8px] bg-emerald-600 text-stone-50 px-1 py-0.2 rounded-md font-black select-none tracking-widest leading-none scale-90 translate-x-1">
                      今日
                    </span>
                  )}
                </div>

                {/* Task Indicators list space */}
                <div className="mt-1.5 space-y-1 overflow-hidden">
                  {truncatedTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`text-[9px] px-1.5 py-0.5 rounded-md border flex items-center gap-1 font-bold ${
                        task.isOverdue 
                          ? 'border-rose-100 bg-rose-50/40 text-rose-700' 
                          : 'border-stone-100 bg-stone-50 text-[#6B7B6A] group-hover:bg-white'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${getTaskColorDot(task.type)}`} />
                      <span className="truncate max-w-[85%]">{task.plantName}</span>
                    </div>
                  ))}

                  {extraTasksCount > 0 && (
                    <div className="text-[8.5px] font-extrabold text-stone-400 pl-1">
                      +{extraTasksCount} 更多项目
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Selective Day Panel Details */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDateStr}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="p-5 border border-[#E0E7DE] bg-[#F7F9F5] rounded-[24px] shadow-xs space-y-4"
        >
          {/* Title bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E0E7DE]">
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#3A4D39] font-display flex items-center gap-1.5">
                <span>🗓️</span>
                <span>已选定日期护理安排 ({selectedDateStr})</span>
              </h3>
              <p className="text-[11px] text-[#6B7B6A] font-bold">
                {selectedDateStr === simulatedToday 
                  ? '这是当前加速器指向的模拟当天。您可以点击快速标记完成！' 
                  : selectedDateStr < simulatedToday 
                  ? '这是已逝去的日期。列表中显示的任务如果是历史遗留，会被标记为超时延误。' 
                  : '这是对未来的预计排期。您可以提前处理它们！'}
              </p>
            </div>
            {selectedDateTasks.length > 0 && (
              <span className="text-xs bg-[#4A6741] text-stone-50 font-black px-3 py-1 rounded-full shrink-0 border border-[#3A4D39]">
                共 {selectedDateTasks.length} 项要约
              </span>
            )}
          </div>

          {/* Interactive tasks roster */}
          {selectedDateTasks.length === 0 ? (
            <div className="text-center py-10 rounded-2xl bg-white border border-[#DCE4DB] p-6 max-w-md mx-auto">
              <span className="text-2xl block mb-2">🍃</span>
              <h4 className="text-xs font-black text-[#3A4D39]">此处无日程计划</h4>
              <p className="text-[10px] text-[#6B7B6A] mt-2 leading-relaxed">
                今天和计划周期的前后，盆栽植物土壤湿度、有机追肥肥效、除病杀菌环境都处于舒适的最佳阈值，无需重复追加。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {selectedDateTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-3xl border bg-white flex items-center justify-between gap-3.5 transition-all hover:shadow-xs group ${
                    task.isOverdue 
                      ? 'border-rose-100 hover:border-rose-200' 
                      : 'border-[#E0E7DE] hover:border-[#DCE4DB]'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={task.plantImageUrl || 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=100'}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 bg-[#F0F4EF] border border-[#DCE4DB]"
                      alt={task.plantName}
                      referrerPolicy="no-referrer"
                    />
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-extrabold text-xs text-[#1A2419] truncate">{task.plantName}</span>
                        {task.isOverdue && (
                          <span className="text-[9px] bg-rose-500 text-stone-50 px-1.5 py-0.2 rounded-md font-extrabold animate-pulse">
                            延误
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#6B7B6A]">
                        <span className={`inline-block px-1.5 py-0.2 rounded-md border text-[9px] font-black ${getTaskIconColor(task.type)}`}>
                          {getTaskLabel(task.type)}
                        </span>
                        <span>
                          {task.daysRemaining === 0 
                            ? '今日当值' 
                            : task.daysRemaining < 0 
                            ? `滞后 ${-task.daysRemaining} 天` 
                            : `还剩 ${task.daysRemaining} 天`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onCareAction(task.plantId, task.type)}
                    className="p-2.5 px-3.5 bg-[#3A4D39] hover:bg-[#4A6741] text-[#F7F9F5] hover:text-white rounded-2xl text-[11px] font-black transition-all flex items-center gap-1 shadow-xs shrink-0 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>完成</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
