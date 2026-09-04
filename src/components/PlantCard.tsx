import { useState } from 'react';
import { Droplet, Leaf, ShieldAlert, Heart, Calendar, MapPin, Trash2, HelpCircle, Pencil, Camera } from 'lucide-react';
import { Plant } from '../types';
import { getDaysRemaining } from '../utils/dateHelpers';

interface PlantCardProps {
  plant: Plant;
  simulatedToday: string;
  onCareAction: (plantId: string, type: 'water' | 'fertilize' | 'pest') => void;
  onDelete: (plantId: string) => void;
  onSetDoctorPlant: (plant: Plant) => void;
  onStatusChange: (plantId: string, status: 'healthy' | 'warning' | 'dormant') => void;
  onUpdateImagePosition: (plantId: string, position: string) => void;
  onEdit: (plant: Plant) => void;
  onOpenAlbum: (plant: Plant) => void;
}

export default function PlantCard({
  plant,
  simulatedToday,
  onCareAction,
  onDelete,
  onSetDoctorPlant,
  onStatusChange,
  onUpdateImagePosition,
  onEdit,
  onOpenAlbum,
}: PlantCardProps) {
  const [isPositionDropdownOpen, setIsPositionDropdownOpen] = useState(false);
  const isCrimsonRose = plant.name.includes('绯红月季') || plant.species.toLowerCase().includes('rosa chinensis');
  
  const getMonthFromSimulatedToday = (dateStrByProp: string) => {
    try {
      if (!dateStrByProp) return new Date().getMonth() + 1;
      const parts = dateStrByProp.split('-');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        if (!isNaN(m)) return m;
      }
      return new Date(dateStrByProp).getMonth() + 1;
    } catch {
      return new Date().getMonth() + 1;
    }
  };

  const currentMonth = getMonthFromSimulatedToday(simulatedToday);
  const isBloomApproaching = [3, 4, 5, 6, 9, 10, 11].includes(currentMonth);

  // Calendar countdown computations
  const waterRemaining = getDaysRemaining(plant.lastWatered, plant.waterInterval, simulatedToday);
  const fertilizeRemaining = plant.fertilizeInterval > 0 
    ? getDaysRemaining(plant.lastFertilized, plant.fertilizeInterval, simulatedToday)
    : 999;
  const pestRemaining = getDaysRemaining(plant.lastPestControl, plant.pestInterval, simulatedToday);

  // Status computation for meters
  const getProgressColor = (days: number, interval: number) => {
    if (days <= 0) return 'bg-rose-550 text-white';
    if (days <= 2) return 'bg-amber-550 text-white';
    return 'bg-[#F0F4EF] text-[#4A6741] border border-[#DCE4DB]';
  };

  const getPercentage = (days: number, interval: number) => {
    if (interval <= 0) return 100;
    const pct = (days / interval) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const getStatusBadge = (status: 'healthy' | 'warning' | 'dormant') => {
    switch (status) {
      case 'healthy':
        return { label: '健康生长', color: 'bg-[#E9F0E6] text-[#4A6741] border-[#DCE4DB]' };
      case 'warning':
        return { label: '需要关注', color: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' };
      case 'dormant':
        return { label: '冬季休眠', color: 'bg-[#F0F4EF] text-[#3b5342] border-[#E0E7DE]' };
    }
  };

  const statusInfo = getStatusBadge(plant.healthStatus);

  return (
    <div
       id={`plant-card-${plant.id}`}
       className={`bento-tile overflow-hidden flex flex-col transition-all duration-300 ${
         isCrimsonRose && isBloomApproaching 
           ? 'border-pink-300 ring-1 ring-pink-300/50 shadow-[0_0_15px_rgba(244,143,177,0.15)] bg-pink-50/5' 
           : 'border-[#E0E7DE]'
       }`}
     >
       {/* Visual Header */}
       <div className="relative h-44 w-full bg-[#F0F4EF] shrink-0">
         {/* Inner image wrapper with overflow-hidden to clip the zoom animation conforming to 32px radius */}
         <div className="absolute inset-0 overflow-hidden rounded-t-[31px]">
         <img
           src={plant.imageUrl || 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600'}
           alt={plant.name}
           className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 animate-fade-in"
           loading="lazy"
           referrerPolicy="no-referrer"
          style={{ objectPosition: plant.imagePosition || "center" }}
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
       </div>
         
         {/* Status badges */}
         <div className="absolute top-4 left-4 flex gap-1.5 flex-wrap z-10">
            {isCrimsonRose && (
              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full border border-pink-200 bg-pink-500 text-white shadow-md animate-pulse">
                高频照料
              </span>
            )}
           <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border shadow-md ${statusInfo.color}`}>
             {statusInfo.label}
           </span>
           <span className="text-[11px] bg-black/40 text-[#F7F9F5] backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 font-mono font-bold">
             <MapPin className="h-3 w-3 text-[#E0E7DE]" />
             {plant.location}
           </span>
         </div>

         {/* Image focus position controller popover */}
         <div className="absolute top-4 right-14 z-20">
           <button
             onClick={() => setIsPositionDropdownOpen(!isPositionDropdownOpen)}
             className="p-1.5 px-2.5 bg-black/50 hover:bg-[#3A4D39] text-[#F7F9F5] hover:text-white backdrop-blur-md rounded-xl transition-all duration-200 shadow-xs text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
             title="调整图片显示位置 (对焦度)"
           >
             <span>🎯</span>
             <span>对焦对齐</span>
           </button>

           {isPositionDropdownOpen && (
             <div className="absolute right-0 mt-1.5 w-32 bg-white border border-[#E0E7DE] rounded-xl shadow-xl py-1 text-left z-30 overflow-hidden animate-fade-in">
               <div className="px-2.5 py-1 text-[8.5px] font-black tracking-wider text-[#6B7B6A] border-b border-[#F0F4EF] uppercase mb-0.5">
                 设定封面中心
               </div>
               {[
                 { label: '🎯 居中对准', value: 'center' },
                 { label: '⬆️ 靠上对焦', value: 'top' },
                 { label: '⬇️ 靠下对焦', value: 'bottom' },
                 { label: '⬅️ 靠左对焦', value: 'left' },
                 { label: '➡️ 靠右对焦', value: 'right' },
                 { label: '🔍 偏上对焦', value: 'center 25%' },
                 { label: '🔍 偏下对焦', value: 'center 75%' },
               ].map((pos) => (
                 <button
                   key={pos.value}
                   type="button"
                   onClick={() => {
                     onUpdateImagePosition(plant.id, pos.value);
                     setIsPositionDropdownOpen(false);
                   }}
                   className={`w-full text-left px-2.5 py-1 text-[10px] font-bold transition-colors hover:bg-[#F0F4EF] flex items-center justify-between ${
                     (plant.imagePosition || 'center') === pos.value 
                       ? 'text-[#3A4D39] bg-[#E9F0E6]' 
                       : 'text-[#6B7B6A] hover:text-[#3A4D39]'
                   }`}
                 >
                   <span>{pos.label}</span>
                   {(plant.imagePosition || 'center') === pos.value && (
                     <span className="w-1 h-1 rounded-full bg-[#4A6741]"></span>
                   )}
                 </button>
               ))}
             </div>
           )}
         </div>

        {/* Delete button */}
        <button
          onClick={() => {
            if (confirm(`确定要移除植物 "${plant.name}" 吗？`)) {
              onDelete(plant.id);
            }
          }}
          className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-rose-600 text-stone-100 backdrop-blur-md rounded-full transition-all duration-200 shadow-xs z-10"
          title="移除植物"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        {/* Floating Plant Name Title */}
        <div className="absolute bottom-4 left-4 right-4 z-10 font-display">
          <h3 className="text-xl font-black text-white tracking-tight flex items-baseline gap-2 leading-tight">
            {plant.name}
          </h3>
        </div>
      </div>

      {/* Care Details Container */}
      <div className="p-6 flex-1 flex flex-col justify-between bg-white">
        {/* Plant Notes */}
        <p className="text-xs text-[#6B7B6A] mb-4 line-clamp-2 italic leading-relaxed">
          {plant.notes || '植物非常坚韧，静候养花人照料。'}
        </p>

        {/* Pet Safety Attribute Indicator */}
        <div className="mb-4 text-[10.5px] rounded-2xl px-3 py-2 border flex items-start gap-1.5 leading-relaxed bg-[#FBFDFB] border-[#E0E7DE]">
          <span className="text-[12px] shrink-0" role="img" aria-label="pet-safety">
            {plant.petSafety === 'toxic' ? '🐱⚠️' : '🐈🟢'}
          </span>
          <div className="flex-1 min-w-0">
            <span className="font-extrabold text-[#3A4D39]">
              {plant.petSafety === 'toxic' ? '宠物需隔离（有毒偏雷）' : '宠物安全友好型'}:{' '}
            </span>
            <span className="text-[#6B7B6A] font-medium">
              {plant.petSafetyNotes || (plant.petSafety === 'toxic' ? '对家宠有害，请摆放至高处避坑。' : '无毒无刺激性，对猫狗极其友好温和。')}
            </span>
          </div>
        </div>

        {isCrimsonRose && isBloomApproaching && (
          <div className="mb-5 text-[11px] text-pink-700 bg-pink-50 border border-pink-100 rounded-2xl px-3 py-2 flex items-center gap-1.5 animate-fade-in shadow-xs">
            <span role="img" aria-label="flower" className="animate-bounce">🌸</span>
            <span className="font-semibold">
              花期临近（{currentMonth}月处于盛开季/孕蕾期），请重点关注水分与养分供给！
            </span>
          </div>
        )}

        {/* Scientific Reminders / Counters */}
        <div className="space-y-4 mb-6 select-none" id={`plant-status-gauges-${plant.id}`}>
          {/* WATER REMINDER */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-[#3A4D39] flex items-center gap-1.5">
                <Droplet className="h-4 w-4 text-sky-500 shrink-0" />
                土壤湿度 ({plant.waterInterval}天周期)
              </span>
              <span className={`font-mono text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${getProgressColor(waterRemaining, plant.waterInterval)}`}>
                {waterRemaining <= 0 ? '需浇水' : `${waterRemaining} 天后`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#F0F4EF] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${waterRemaining <= 0 ? 'bg-rose-500' : waterRemaining <= 2 ? 'bg-amber-500' : 'bg-[#4A6741]'}`}
                style={{ width: `${getPercentage(waterRemaining, plant.waterInterval)}%` }}
              ></div>
            </div>
          </div>

          {/* FERTILIZE REMINDER */}
          {plant.fertilizeInterval > 0 ? (
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-[#3A4D39] flex items-center gap-1.5">
                  <Leaf className="h-4 w-4 text-emerald-500 shrink-0" />
                  肥料养分 ({plant.fertilizeInterval}天周期)
                </span>
                <span className={`font-mono text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${getProgressColor(fertilizeRemaining, plant.fertilizeInterval)}`}>
                  {fertilizeRemaining <= 0 ? '需养分' : `${fertilizeRemaining} 天后`}
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#F0F4EF] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${fertilizeRemaining <= 0 ? 'bg-rose-500' : fertilizeRemaining <= 3 ? 'bg-amber-500' : 'bg-[#4A6741]'}`}
                  style={{ width: `${getPercentage(fertilizeRemaining, plant.fertilizeInterval)}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-[#A1ACA0] font-bold uppercase flex items-center gap-1.5 bg-[#F0F4EF] px-3 py-2 rounded-2xl border border-dashed border-[#DCE4DB]">
              <Leaf className="h-3.5 w-3.5 text-[#6B7B6A] shrink-0" />
              当前生命阶段不需要追加特配肥料
            </div>
          )}

          {/* PEST DEFENSE REMINDER */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-[#3A4D39] flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-orange-400 shrink-0" />
                防病药效 ({plant.pestInterval}天防备)
              </span>
              <span className={`font-mono text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${getProgressColor(pestRemaining, plant.pestInterval)}`}>
                {pestRemaining <= 0 ? '急需防病' : `${pestRemaining} 天后`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#F0F4EF] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${pestRemaining <= 0 ? 'bg-rose-500' : pestRemaining <= 5 ? 'bg-amber-500' : 'bg-[#4A6741]'}`}
                style={{ width: `${getPercentage(pestRemaining, plant.pestInterval)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Buttons Action Bar */}
        <div className="space-y-3 mt-auto pt-4 border-t border-[#E0E7DE]">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onCareAction(plant.id, 'water')}
              className="text-xs font-black py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-2xl transition-all flex flex-col items-center justify-center gap-1"
            >
              <Droplet className="h-4 w-4" />
              <span>浇水</span>
            </button>
            <button
              onClick={() => onCareAction(plant.id, 'fertilize')}
              disabled={plant.fertilizeInterval <= 0}
              className="text-xs font-black py-2.5 bg-[#F0F4EF] hover:bg-[#DCE4DB] text-[#4A6741] rounded-2xl transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Leaf className="h-4 w-4" />
              <span>施肥</span>
            </button>
            <button
              onClick={() => onCareAction(plant.id, 'pest')}
              className="text-xs font-black py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-2xl transition-all flex flex-col items-center justify-center gap-1"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>防虫</span>
            </button>
          </div>

          {/* Quick Doctor / Diagnosis Action */}
          <div className="flex gap-2 items-center">
            {/* Status switcher dropdown inside card */}
            <select
              value={plant.healthStatus}
              onChange={(e) => onStatusChange(plant.id, e.target.value as any)}
              className="grow min-w-0 text-xs bg-white border border-[#E0E7DE] text-[#2D3436] px-1.5 py-2 rounded-2xl hover:bg-[#F0F4EF] cursor-pointer transition-colors focus:outline-none"
            >
              <option value="healthy">🌱 健康生长</option>
              <option value="warning">⚠️ 黄叶关注</option>
              <option value="dormant">❄️ 冬季休眠</option>
            </select>

            <button
              onClick={() => onOpenAlbum(plant)}
              className="shrink-0 p-2 bg-emerald-50 hover:bg-emerald-100 hover:text-[#3A4D39] text-[#4A6741] border border-emerald-200 rounded-2xl flex items-center justify-center transition-all"
              title="查看成长相册/撰写纪实相册记录"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => onEdit(plant)}
              className="shrink-0 p-2 bg-[#F0F4EF] hover:bg-[#DCE4DB] hover:text-[#3A4D39] text-[#6B7B6A] border border-[#DCE4DB] rounded-2xl flex items-center justify-center transition-all"
              title="编辑并重新规化植物属性参数"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => onSetDoctorPlant(plant)}
              className="shrink-0 px-3 py-2 bg-[#3A4D39] hover:bg-[#4A6741] text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1 transition-all shadow-xs"
              title="一键呼叫AI医生诊断"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              诊断
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
