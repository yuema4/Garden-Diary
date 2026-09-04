import { ScrollText, Droplet, Leaf, ShieldAlert, Calendar, Trash2 } from 'lucide-react';
import { CareLog } from '../types';

interface HistoryLogsProps {
  logs: CareLog[];
  onDeleteLog: (logId: string) => void;
  onClearLogs: () => void;
}

export default function HistoryLogs({ logs, onDeleteLog, onClearLogs }: HistoryLogsProps) {
  const getLogStyle = (type: 'water' | 'fertilize' | 'pest') => {
    switch (type) {
      case 'water':
        return {
          icon: <Droplet className="h-4 w-4 text-blue-500" />,
          bgColor: 'bg-blue-50/50 border-blue-100',
          badgeText: '已浇水'
        };
      case 'fertilize':
        return {
          icon: <Leaf className="h-4 w-4 text-emerald-500" />,
          bgColor: 'bg-emerald-50/50 border-emerald-100',
          badgeText: '已施肥'
        };
      case 'pest':
        return {
          icon: <ShieldAlert className="h-4 w-4 text-amber-600" />,
          bgColor: 'bg-amber-50/50 border-amber-100',
          badgeText: '已驱虫保护'
        };
    }
  };

  return (
    <div id="botanical-history-tracker" className="bento-tile p-6 border-[#E0E7DE] bg-white">
      <div className="flex items-center justify-between pb-3.5 border-b border-[#E0E7DE] mb-5">
        <div>
          <h2 className="text-md sm:text-lg font-black font-display text-[#3A4D39] flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-[#4A6741]" />
            <span>日常养护岁月日记</span>
          </h2>
          <p className="text-xs text-[#6B7B6A] mt-1">自动归档小温室中历经岁月模拟所堆砌的每一次精细作业足迹</p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={() => {
              if (confirm('确认清空所有历史养护记录吗？这不会重置当前绿植状态属性。')) {
                onClearLogs();
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-extrabold transition-colors"
          >
            清空日志
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#6B7B6A] bg-[#F7F9F5] rounded-2xl border border-dashed border-[#DCE4DB]">
          温室日志空舱状态，请在【花园植物】或【待办计划】中标记第一个完成！
        </div>
      ) : (
        <div className="max-h-[340px] overflow-y-auto space-y-3 pr-1">
          {logs.map((log) => {
            const config = getLogStyle(log.type);
            return (
              <div
                key={log.id}
                className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${config.bgColor}`}
              >
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-white border border-[#DCE4DB] flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                    {config.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-[#1A2419]">{log.plantName}</span>
                      <span className="text-[10px] text-[#A1ACA0] font-black flex items-center gap-1 font-mono uppercase bg-white px-2 py-0.5 rounded-full border border-[#DCE4DB]">
                        <Calendar className="h-3 w-3 text-[#6B7B6A]" />
                        {log.date}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7B6A] mt-1.5 leading-relaxed font-medium">{log.notes || `${log.plantName}完成了${config.badgeText}常规照料。`}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => onDeleteLog(log.id)}
                  className="text-gray-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition-colors"
                  title="删除此记录"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
