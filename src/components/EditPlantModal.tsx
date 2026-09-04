import { useState, useEffect, FormEvent } from 'react';
import { X, Sparkles, AlertTriangle, Droplet, Leaf, ShieldAlert, ListFilter, HelpCircle, Loader } from 'lucide-react';
import { Plant, CarePlanRecommendation } from '../types';
import { getCustomApiHeaders } from '../utils/customApi';

interface EditPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  plant: Plant | null;
  onSave: (updatedPlant: Plant) => void;
  simulatedToday: string;
}

export default function EditPlantModal({ isOpen, onClose, plant, onSave, simulatedToday }: EditPlantModalProps) {
  // Fields state
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [location, setLocation] = useState('客厅 (Living Room)');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePosition, setImagePosition] = useState('center');
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'dormant'>('healthy');
  const [petSafety, setPetSafety] = useState<'safe' | 'toxic'>('safe');
  const [petSafetyNotes, setPetSafetyNotes] = useState('');

  // Schedulers (Intervals in days)
  const [waterInterval, setWaterInterval] = useState(7);
  const [fertilizeInterval, setFertilizeInterval] = useState(30);
  const [pestInterval, setPestInterval] = useState(90);

  // Completed Action Date references
  const [lastWatered, setLastWatered] = useState(simulatedToday);
  const [lastFertilized, setLastFertilized] = useState(simulatedToday);
  const [lastPestControl, setLastPestControl] = useState(simulatedToday);

  // AI-Assisted Planner state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState<CarePlanRecommendation | null>(null);

  // Sync state with selected plant when opened
  useEffect(() => {
    if (isOpen && plant) {
      setName(plant.name || '');
      setSpecies(plant.species || '');
      setLocation(plant.location || '客厅 (Living Room)');
      setNotes(plant.notes || '');
      setImageUrl(plant.imageUrl || '');
      setImagePosition(plant.imagePosition || 'center');
      setHealthStatus(plant.healthStatus || 'healthy');
      setWaterInterval(plant.waterInterval ?? 7);
      setFertilizeInterval(plant.fertilizeInterval ?? 30);
      setPestInterval(plant.pestInterval ?? 90);
      setLastWatered(plant.lastWatered || simulatedToday);
      setLastFertilized(plant.lastFertilized || simulatedToday);
      setLastPestControl(plant.lastPestControl || simulatedToday);
      setPetSafety(plant.petSafety || 'safe');
      setPetSafetyNotes(plant.petSafetyNotes || '');
      setAiRecommendation(null);
      setAiError('');
    }
  }, [isOpen, plant, simulatedToday]);

  // Run AI schedule architect call
  const handleAiPlanGeneration = async () => {
    if (!name.trim()) {
      setAiError('请先输入植物的名字（如：“白鹤芋” 或 “兰花”）以便 AI 处理');
      return;
    }
    setAiLoading(true);
    setAiError('');
    setAiRecommendation(null);

    try {
      const response = await fetch('/api/gemini/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCustomApiHeaders()
        },
        body: JSON.stringify({ plantName: name, location, notes }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'AI 一键制定养护日程计划失败，请确认第三方大模型 API Key 格式正确并已开通该模型访问权。');
      }
      const data: CarePlanRecommendation = await response.json();
      setAiRecommendation(data);
      
      // Update fields based on AI recommendations
      setSpecies(data.species || '');
      setWaterInterval(data.waterInterval || 7);
      setFertilizeInterval(data.fertilizeInterval || 30);
      setPestInterval(data.pestInterval || 90);
      if ((data as any).petSafety) setPetSafety((data as any).petSafety);
      if ((data as any).petSafetyNotes) setPetSafetyNotes((data as any).petSafetyNotes);
      
      // Update note containing AI secrets
      const infoTips = data.tips ? data.tips.join('。') : '';
      setNotes(`【AI防虫建议】：${data.pestMeasures || '无'}。\n【AI养护秘诀】：${infoTips}。\n【光照需求】：${data.sunlightNeed || '正常'}`);
    } catch (err: any) {
      console.error(err);
      setAiError(`AI 制定计划出错: ${err.message || '请检查 API Key 配置。'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!plant || !name.trim()) return;

    onSave({
      ...plant,
      name: name.trim(),
      species: species.trim() || '室内植物',
      location,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600',
      imagePosition,
      waterInterval,
      fertilizeInterval,
      pestInterval,
      lastWatered,
      lastFertilized: fertilizeInterval > 0 ? lastFertilized : lastWatered,
      lastPestControl: lastPestControl,
      healthStatus,
      petSafety,
      petSafetyNotes: petSafetyNotes.trim(),
      notes: notes.trim(),
    });
    onClose();
  };

  if (!isOpen || !plant) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl border border-[#E0E7DE] max-h-[90vh] flex flex-col transition-all">
        {/* Modal Header */}
        <div className="p-5 bg-[#F0F4EF] border-b border-[#E0E7DE] flex items-center justify-between shrink-0">
          <h3 className="text-md sm:text-lg font-black text-[#3A4D39] font-display flex items-center gap-1.5">
            📝 编辑绿植档案与预设参数
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[#DCE4DB] text-[#6B7B6A] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1 scrollbar-thin">
          {/* Name & AI tool */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-[#3A4D39] mb-1.5">
                绿植昵称 / 标号 <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="如：客厅的发财树、我的琴叶榕"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="grow text-xs bg-[#F7F9F5] border border-[#E0E7DE] px-3.5 py-2.5 rounded-2xl focus:outline-none focus:bg-white focus:border-[#4A6741] text-[#2D3436] transition-all"
                />

                <button
                  type="button"
                  onClick={handleAiPlanGeneration}
                  disabled={aiLoading}
                  className="px-4 py-2.5 bg-[#3A4D39] hover:bg-[#4A6741] text-white rounded-2xl text-xs font-black hover:shadow-sm transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  title="让AI制定推荐养护频次"
                >
                  {aiLoading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>AI重算</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#3A4D39] mb-1.5">
                植物健康状态
              </label>
              <select
                value={healthStatus}
                onChange={(e) => setHealthStatus(e.target.value as any)}
                className="w-full text-xs font-bold bg-[#F7F9F5] border border-[#E0E7DE] text-[#3A4D39] px-3.5 py-2.5 rounded-2xl cursor-pointer focus:outline-none focus:border-[#4A6741] transition-all"
              >
                <option value="healthy">🌱 状态: 健康良好 (Healthy)</option>
                <option value="warning">⚠️ 状态: 黄叶关注 (Warning)</option>
                <option value="dormant">❄️ 状态: 冬季休眠 (Dormant)</option>
              </select>
            </div>
          </div>

          {/* AI Output Result Box */}
          {aiLoading && (
            <div className="p-5 bg-[#F0F4EF] border border-[#DCE4DB] rounded-2xl text-center flex flex-col items-center justify-center gap-3 animate-pulse">
              <Loader className="h-7 w-7 animate-spin text-[#4A6741]" />
              <p className="text-xs font-black text-[#3A4D39]">
                AI 正在为本植物重新规划科学养护周期...
              </p>
            </div>
          )}

          {aiError && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2 text-xs text-rose-700">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold font-display">AI 预配方案由于密钥发生异常</p>
                <p className="mt-1 text-[11px] text-rose-600/90 leading-relaxed">{aiError}</p>
              </div>
            </div>
          )}

          {aiRecommendation && (
            <div className="p-4.5 bg-[#E9F0E6] border border-[#DCE4DB] rounded-[24px] space-y-3 animate-fade-in">
              <div className="flex justify-between items-center text-xs gap-3 flex-wrap">
                <span className="font-black text-[#3A4D39] flex items-center gap-1.5 font-display">
                  <Sparkles className="h-4 w-4 text-[#4A6741]" />
                  已确定 【{aiRecommendation.species}】 的科学养护大纲：
                </span>
                <span className="text-[10px] bg-white text-[#4A6741] px-2.5 py-1 font-black rounded-lg border border-[#DCE4DB]">
                  光照需求：{aiRecommendation.sunlightNeed}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5 py-1 text-center font-mono">
                <div className="bg-white p-2 rounded-xl border border-[#DCE4DB]">
                  <div className="text-[9px] text-[#6B7B6A] font-black uppercase">平均浇水</div>
                  <div className="text-sm font-black text-blue-600 mt-1">{waterInterval} 天</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-[#DCE4DB]">
                  <div className="text-[9px] text-[#6B7B6A] font-black uppercase">施大营养液</div>
                  <div className="text-sm font-black text-emerald-600 mt-1">
                    {fertilizeInterval > 0 ? `${fertilizeInterval} 天` : '无需肥料'}
                  </div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-[#DCE4DB]">
                  <div className="text-[9px] text-[#6B7B6A] font-black uppercase">多菌灵杀菌</div>
                  <div className="text-sm font-black text-amber-700 mt-1">{pestInterval} 天</div>
                </div>
              </div>
            </div>
          )}

          {/* Species & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-[#3A4D39] mb-1.5">
                学名属类 / 科研分类
              </label>
              <input
                type="text"
                placeholder="如：Ficus lyrata、多肉植物、马齿苋科"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full text-xs bg-[#F7F9F5] border border-[#E0E7DE] px-3.5 py-2.5 rounded-2xl focus:outline-none focus:bg-white focus:border-[#4A6741] text-[#2D3436] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[#3A4D39] mb-1.5">
                摆放具体地理环境 & 透光分布
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs bg-[#F7F9F5] border border-[#E0E7DE] text-[#3A4D39] px-3.5 py-2.5 rounded-2xl cursor-pointer focus:outline-none focus:border-[#4A6741] transition-all"
              >
                <option value="阳台 (Balcony)">阳光散射阳台 (Balcony)</option>
                <option value="客厅窗旁 (Living Room)">温暖通风客厅 (Living Room)</option>
                <option value="卧室飘白 (Bedroom)">向阳朝南卧室 (Bedroom)</option>
                <option value="书房角落 (Study)">雅致半凉书房 (Study)</option>
                <option value="办公室 (Office)">办公室工位隔断 (Office)</option>
                <option value="其他阴凉处 (shaded)">其他纯荫蔽处 (Shaded)</option>
              </select>
            </div>
          </div>

          {/* Pet Friendly Status Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4.5 bg-[#F9FBFA] border border-[#E0E7DE] rounded-[24px]">
            <div>
              <label className="block text-xs font-black text-[#3A4D39] mb-1.5 flex items-center gap-1.5">
                <span>🐈 宠物友好度安全属性</span>
              </label>
              <select
                value={petSafety}
                onChange={(e) => {
                  const val = e.target.value as 'safe' | 'toxic';
                  setPetSafety(val);
                  if (val === 'safe') {
                    setPetSafetyNotes('对猫狗友好安全无毒。');
                  } else if (val === 'toxic') {
                    setPetSafetyNotes('有毒/对宠物有健康危害。');
                  }
                }}
                className="w-full text-xs font-bold bg-[#F7F9F5] border border-[#E0E7DE] text-[#3A4D39] px-3.5 py-2.5 rounded-2xl cursor-pointer focus:outline-none focus:border-[#4A6741] transition-all"
              >
                <option value="safe">🟢 宠物安全友好型 (Pet Safe)</option>
                <option value="toxic">⚠️ 对猫狗有害/需避雷防护 (Toxic)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-[#3A4D39] mb-1.5">
                宠物过敏/毒性症状或隔离备忘
              </label>
              <input
                type="text"
                placeholder="如：对猫狗友好安全；误食易致消化道红肿呕吐"
                value={petSafetyNotes}
                onChange={(e) => setPetSafetyNotes(e.target.value)}
                className="w-full text-xs bg-[#F7F9F5] border border-[#E0E7DE] px-3.5 py-2.5 rounded-2xl focus:outline-none focus:bg-white focus:border-[#4A6741] text-[#2D3436] transition-all font-semibold"
              />
            </div>
          </div>

          {/* Sliders for Care Intervals */}
          <div className="p-5 bg-[#F7F9F5] border border-[#E0E7DE] rounded-3xl space-y-5">
            <h4 className="text-xs font-black text-[#3A4D39] border-b border-[#E0E7DE] pb-2 flex items-center gap-1.5 uppercase font-display">
              <ListFilter className="h-4 w-4 text-[#4A6741]" />
              设置定时循环周期频率 (天)
            </h4>

            {/* Water interval slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5 font-bold font-display">
                <span className="flex items-center gap-1.5 text-blue-700">
                  <Droplet className="h-4 w-4 shrink-0" />
                  浇水干透周期
                </span>
                <span className="font-mono text-[#3A4D39] bg-white px-2.5 py-0.5 rounded-lg border border-[#DCE4DB] font-bold">
                  每 {waterInterval} 天
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="45"
                value={waterInterval}
                onChange={(e) => setWaterInterval(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#E0E7DE] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Fertilize interval slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5 font-bold font-display">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Leaf className="h-4 w-4 shrink-0" />
                  施底肥/叶面追营养液循环
                </span>
                <span className="font-mono text-[#3A4D39] bg-white px-2.5 py-0.5 rounded-lg border border-[#DCE4DB] font-bold">
                  {fertilizeInterval === 0 ? '暂停安排施肥' : `每 ${fertilizeInterval} 天`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={fertilizeInterval}
                onChange={(e) => setFertilizeInterval(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#E0E7DE] rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Pest interval slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5 font-bold font-display">
                <span className="flex items-center gap-1.5 text-amber-800">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  清虫药液 / 多菌灵菌防面循环
                </span>
                <span className="font-mono text-[#3A4D39] bg-white px-2.5 py-0.5 rounded-lg border border-[#DCE4DB] font-bold">
                  每 {pestInterval} 天
                </span>
              </div>
              <input
                type="range"
                min="7"
                max="180"
                step="7"
                value={pestInterval}
                onChange={(e) => setPestInterval(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#E0E7DE] rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
            </div>
          </div>

          {/* Action dates (allow correction of historic actions) */}
          <div className="p-4 bg-[#F0F4EF] border border-[#E0E7DE] rounded-3xl space-y-3">
            <h4 className="text-xs font-black text-[#3A4D39] flex items-center gap-1 font-display">
              上次物理照料历史纪录校正 (精确规划下一次倒计时点)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-black text-[#6B7B6A] block mb-1">
                  最末一次浇水
                </label>
                <input
                  type="date"
                  value={lastWatered}
                  onChange={(e) => setLastWatered(e.target.value)}
                  className="w-full text-xs bg-white border border-[#DCE4DB] p-2 rounded-xl focus:outline-none focus:border-[#4A6741] text-[#2D3436] font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#6B7B6A] block mb-1">
                  最末一次授肥
                </label>
                <input
                  type="date"
                  value={lastFertilized}
                  disabled={fertilizeInterval === 0}
                  onChange={(e) => setLastFertilized(e.target.value)}
                  className="w-full text-xs bg-white border border-[#DCE4DB] p-2 rounded-xl focus:outline-none focus:border-[#4A6741] text-[#2D3436] font-bold disabled:opacity-40"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#6B7B6A] block mb-1">
                  最末一次药物理
                </label>
                <input
                  type="date"
                  value={lastPestControl}
                  onChange={(e) => setLastPestControl(e.target.value)}
                  className="w-full text-xs bg-white border border-[#DCE4DB] p-2 rounded-xl focus:outline-none focus:border-[#4A6741] text-[#2D3436] font-bold"
                />
              </div>
            </div>
          </div>

          {/* Image & Notes */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-[#3A4D39] mb-1.5">
                  绿植美图网络地址 (URL)
                </label>
                <input
                  type="url"
                  placeholder="粘贴网络中该绿植的高清大图连接"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full text-xs bg-[#F7F9F5] border border-[#E0E7DE] px-3.5 py-2.5 rounded-2xl focus:outline-none focus:bg-white focus:border-[#4A6741] text-[#2D3436] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#3A4D39] mb-1.5">
                  封面肖像照对焦/显示位置 (Position)
                </label>
                <select
                  value={imagePosition}
                  onChange={(e) => setImagePosition(e.target.value)}
                  className="w-full text-xs bg-[#F7F9F5] border border-[#E0E7DE] text-[#3A4D39] px-3.5 py-2.5 rounded-2xl cursor-pointer focus:outline-none focus:bg-white focus:border-[#4A6741] transition-all font-bold"
                >
                  <option value="center">🎯 居中对焦 (Default Center)</option>
                  <option value="top">⬆️ 靠上对焦 (Align Top)</option>
                  <option value="bottom">⬇️ 靠下对焦 (Align Bottom)</option>
                  <option value="left">⬅️ 偏左对焦 (Align Left)</option>
                  <option value="right">➡️ 偏右对焦 (Align Right)</option>
                  <option value="center 25%">🔍 中上部对焦</option>
                  <option value="center 75%">🔍 中下部对焦</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#3A4D39] mb-1.5">
                特别避雷/摆放注意事项或养护备忘 (AI 指导可在此手动重述)
              </label>
              <textarea
                rows={3}
                placeholder="手动附加照顾细则，如水温、散光等..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs bg-[#F7F9F5] border border-[#E0E7DE] px-3.5 py-2.5 rounded-2xl focus:outline-none focus:bg-white focus:border-[#4A6741] text-[#2D3436] transition-all leading-relaxed"
              />
            </div>
          </div>

          {/* Actions Bar */}
          <div className="pt-4 border-t border-[#E0E7DE] flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#F0F4EF] hover:bg-[#DCE4DB] text-[#3A4D39] text-xs font-black rounded-2xl transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#3A4D39] hover:bg-[#4A6741] text-white text-xs font-black rounded-2xl shadow-xs transition-all"
            >
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
