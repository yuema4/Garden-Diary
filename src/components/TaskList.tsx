import { useState, useMemo } from 'react';
import { Calendar, CheckCircle2, AlertTriangle, CheckSquare, Clock, Plus, LayoutGrid } from 'lucide-react';
import { Plant, CareTask, CareLog } from '../types';
import { getDaysRemaining, addDays } from '../utils/dateHelpers';

interface TaskListProps {
  plants: Plant[];
  logs: CareLog[];
  simulatedToday: string;
  onCareAction: (plantId: string, type: 'water' | 'fertilize' | 'pest') => void;
  onOpenAddModal: () => void;
}

export default function TaskList({ plants, logs, simulatedToday, onCareAction, onOpenAddModal }: TaskListProps) {
  const [filter, setFilter] = useState<'today' | 'upcoming'>('today');
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    plantName: string;
    taskType: 'water' | 'fertilize' | 'pest';
    logs: CareLog[];
  } | null>(null);

  const handleViewHistory = (plantId: string, taskType: 'water' | 'fertilize' | 'pest', plantName: string) => {
    const matchedLogs = (logs || [])
      .filter((log) => log.plantId === plantId && log.type === taskType)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3);
    
    setHistoryModal({
      isOpen: true,
      plantName,
      taskType,
      logs: matchedLogs,
    });
  };

  // Compute all tasks dynamically based on simulatedToday
  const allTasks = useMemo(() => {
    const list: CareTask[] = [];
    plants.forEach((plant) => {
      // 1. Water Task
      const waterDays = getDaysRemaining(plant.lastWatered, plant.waterInterval, simulatedToday);
      list.push({
        id: `${plant.id}-water`,
        plantId: plant.id,
        plantName: plant.name,
        plantImageUrl: plant.imageUrl,
        type: 'water',
        dueDate: addDays(plant.lastWatered, plant.waterInterval),
        daysRemaining: waterDays,
        isOverdue: waterDays <= 0,
      });

      // 2. Fertilize Task (only if fertilize interval is configured)
      if (plant.fertilizeInterval > 0) {
        const fertDays = getDaysRemaining(plant.lastFertilized, plant.fertilizeInterval, simulatedToday);
        list.push({
          id: `${plant.id}-fertilize`,
          plantId: plant.id,
          plantName: plant.name,
          plantImageUrl: plant.imageUrl,
          type: 'fertilize',
          dueDate: addDays(plant.lastFertilized, plant.fertilizeInterval),
          daysRemaining: fertDays,
          isOverdue: fertDays <= 0,
        });
      }

      // 3. Pest Task
      const pestDays = getDaysRemaining(plant.lastPestControl, plant.pestInterval, simulatedToday);
      list.push({
        id: `${plant.id}-pest`,
        plantId: plant.id,
        plantName: plant.name,
        plantImageUrl: plant.imageUrl,
        type: 'pest',
        dueDate: addDays(plant.lastPestControl, plant.pestInterval),
        daysRemaining: pestDays,
        isOverdue: pestDays <= 0,
      });
    });

    // Sort: Overdue first, then by days remaining
    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [plants, simulatedToday]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    if (filter === 'today') {
      // Highlight those due today or already overdue
      return allTasks.filter((t) => t.daysRemaining <= 0);
    } else {
      // Future tasks due in 1 to 7 days
      return allTasks.filter((t) => t.daysRemaining > 0 && t.daysRemaining <= 7);
    }
  }, [allTasks, filter]);

  // Count overdue metrics
  const overdueCount = useMemo(() => {
    return allTasks.filter((t) => t.daysRemaining <= 0).length;
  }, [allTasks]);

  const getTaskIcon = (type: 'water' | 'fertilize' | 'pest') => {
    switch (type) {
      case 'water':
        return <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0"></span>;
      case 'fertilize':
        return <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>;
      case 'pest':
        return <span className="h-2 w-2 rounded-full bg-amber-600 shrink-0"></span>;
    }
  };

  const getTaskLabel = (type: 'water' | 'fertilize' | 'pest') => {
    switch (type) {
      case 'water':
        return '定时浇水';
      case 'fertilize':
        return '补充施肥';
      case 'pest':
        return '防黑腐驱虫';
    }
  };

  const getTaskActionColor = (type: 'water' | 'fertilize' | 'pest') => {
    switch (type) {
      case 'water':
        return 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100';
      case 'fertilize':
        return 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100';
      case 'pest':
        return 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-100';
    }
  };

  return (
    <div id="botanical-task-manager" className="bento-tile p-6 border-[#E0E7DE] bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E0E7DE] mb-5">
        <div>
          <h2 className="text-md sm:text-lg font-black font-display text-[#3A4D39] flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-[#4A6741]" />
            <span>今日任务与日程</span>
            {overdueCount > 0 && (
              <span className="text-xs bg-rose-500 text-stone-50 px-3 py-0.5 rounded-full font-extrabold shadow-sm animate-pulse">
                {overdueCount}项需进行
              </span>
            )}
          </h2>
          <p className="text-xs text-[#6B7B6A] mt-1">智能计算当日及未来 7 天内处于临界干涸状态需要被呵护的生命体</p>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex bg-[#F0F4EF] p-1 rounded-2xl border border-[#DCE4DB] self-start sm:self-auto select-none">
          <button
            onClick={() => setFilter('today')}
            className={`text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              filter === 'today'
                ? 'bg-white text-[#3A4D39] shadow-inner font-black'
                : 'text-[#6B7B6A] hover:text-[#3A4D39]'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            今日照料 ({overdueCount})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              filter === 'upcoming'
                ? 'bg-white text-[#3A4D39] shadow-inner font-black'
                : 'text-[#6B7B6A] hover:text-[#3A4D39]'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            未来 7 天日程
          </button>
        </div>
      </div>

      {plants.length === 0 ? (
        <div className="py-16 text-center rounded-[24px] bg-[#F7F9F5] border border-dashed border-[#DCE4DB] p-6">
          <div className="h-12 w-12 bg-[#E9F0E6] text-[#4A6741] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#DCE4DB]">
            <Plus className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-[#3A4D39]">温室空空如也，请先购入生命体入账吧！</p>
          <button
            onClick={onOpenAddModal}
            className="mt-4 text-xs px-5 py-2.5 bg-[#3A4D39] hover:bg-[#4A6741] text-white rounded-xl font-bold shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            购入新绿植
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-12 text-center rounded-[24px] bg-[#E9F0E6]/55 border border-[#DCE4DB] p-6 animate-fade-in">
          <CheckCircle2 className="h-10 w-10 text-[#4A6741] mx-auto mb-3" />
          <p className="text-[#3A4D39] font-extrabold text-sm sm:text-base">
            {filter === 'today' ? '太棒了！您当前没有待处理的紧急需护生命体！' : '未来7天您的花园均生机盎然、配水配肥配料充足！'}
          </p>
          <p className="text-xs text-[#6B7B6A] mt-2 max-w-md mx-auto leading-relaxed">
            您可以通过右上方【时空模拟器】将环境时间向未来推进数日，体验花园植物的水分与养分自然代谢周期。
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${
                task.isOverdue
                  ? 'bg-rose-50/40 border-rose-100 hover:border-rose-200 hover:bg-rose-50/60'
                  : 'bg-[#F7F9F5] border-[#E0E7DE] hover:border-[#DCE4DB] hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <img
                  src={task.plantImageUrl || 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=100'}
                  className="w-12 h-12 rounded-2xl object-cover shrink-0 bg-[#F0F4EF] border border-[#DCE4DB]"
                  alt={task.plantName}
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm sm:text-base text-[#1A2419]">{task.plantName}</span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full font-bold bg-[#F0F4EF] text-[#4A6741] border border-[#DCE4DB]">
                      {getTaskIcon(task.type)}
                      {getTaskLabel(task.type)}
                    </span>
                  </div>
                  
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs">
                    {task.isOverdue ? (
                      <span className="text-rose-600 font-extrabold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 inline shrink-0 animate-bounce" />
                        已延误过限 {-task.daysRemaining} 天 (排期于 {task.dueDate})
                      </span>
                    ) : (
                      <span className="text-[#6B7B6A] font-medium">
                        {task.daysRemaining === 0 ? '就在今日需完成' : `剩余待理: ${task.daysRemaining} 天`} (排期于 {task.dueDate})
                      </span>
                    )}
                    <span className="text-stone-300 hidden sm:inline">|</span>
                    <button
                      onClick={() => handleViewHistory(task.plantId, task.type, task.plantName)}
                      className="text-[#4A6741] hover:text-[#3A4D39] font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>📋</span>
                      <span>查看养护记录</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onCareAction(task.plantId, task.type === 'water' ? 'water' : task.type === 'fertilize' ? 'fertilize' : 'pest')}
                className={`self-start sm:self-auto text-xs px-5 py-2.5 font-bold rounded-2xl text-center shadow-xs transition-all flex items-center gap-1.5 ${getTaskActionColor(task.type)}`}
              >
                <CheckCircle2 className="h-4 w-4" />
                标记护理完成
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mini Care History Dialog Modal */}
      {historyModal && historyModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[24px] border border-[#DCE4DB] max-w-md w-full shadow-2xl overflow-hidden animate-scale-up">
            {/* Header banner with natural elements */}
            <div className="p-5 border-b border-[#E0E7DE] flex items-center justify-between bg-[#F7F9F5]">
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#3A4D39] font-display">
                  🪴 {historyModal.plantName}
                </h3>
                <p className="text-[11px] font-bold text-[#6B7B6A] mt-1 flex items-center gap-1">
                  <span>{getTaskLabel(historyModal.taskType)}的历史照料记录</span>
                </p>
              </div>
              <button
                onClick={() => setHistoryModal(null)}
                className="h-8 w-8 rounded-full hover:bg-[#E9F0E6] text-[#A1ACA0] hover:text-[#3A4D39] flex items-center justify-center font-bold text-lg transition-all"
                title="关闭"
              >
                ×
              </button>
            </div>

            {/* Content list */}
            <div className="p-6 space-y-4 max-h-[320px] overflow-y-auto">
              {historyModal.logs.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-2xl bg-[#F7F9F5] border border-dashed border-[#DCE4DB]">
                  <span className="text-xl block mb-2">🍃</span>
                  <p className="text-[#3A4D39] font-bold text-xs">暂无此项任务的历史记录</p>
                  <p className="text-[10px] text-[#A1ACA0] mt-1.5 leading-relaxed">
                    当您初次或再次点击【标记护理完成】时，系统在此自动记录执行时刻与养护笔记，辅助您掌控生长周期。
                  </p>
                </div>
              ) : (
                <div className="relative border-l-2 border-[#E0E7DE] ml-3.5 pl-5 space-y-5">
                  {historyModal.logs.map((log, index) => (
                    <div key={log.id} className="relative group">
                      {/* Timeline dot custom styling */}
                      <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-white border-2 border-[#4A6741] z-10 transition-colors group-hover:bg-[#4A6741]" />
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold font-mono text-[#4A6741] bg-[#E9F0E6] border border-[#DCE4DB] px-2.5 py-0.5 rounded-full">
                            {log.date}
                          </span>
                          {index === 0 && (
                            <span className="text-[9px] font-black text-white bg-emerald-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              最近一次
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#4A5549] font-medium mt-2 bg-[#F7F9F5] p-3 rounded-xl border border-[#E0E7DE] leading-relaxed break-all">
                          {log.notes}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="p-4 bg-[#F7F9F5] border-t border-[#E0E7DE] flex justify-end">
              <button
                onClick={() => setHistoryModal(null)}
                className="px-5 py-2.5 bg-[#3A4D39] hover:bg-[#4A6741] text-white text-xs font-black rounded-xl transition-colors shadow-xs"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
