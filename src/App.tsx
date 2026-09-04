import { useState, useEffect } from 'react';
import { 
  Sprout, 
  Calendar, 
  Sparkles, 
  MessageSquare, 
  Clock, 
  Plus, 
  RotateCcw, 
  Utensils, 
  CheckSquare, 
  Droplet, 
  BookOpen, 
  Heart,
  Undo2,
  ListTodo,
  Flower2
} from 'lucide-react';

import { Plant, CareLog, GrowthRecord } from './types';
import { INITIAL_PLANTS, INITIAL_LOGS, INITIAL_GROWTH_RECORDS } from './utils/initialData';
import { formatLocalDate, parseLocalDate, addDays } from './utils/dateHelpers';

// Subcomponents
import SettingsAlert from './components/SettingsAlert';
import PlantCard from './components/PlantCard';
import TaskList from './components/TaskList';
import CalendarView from './components/CalendarView';
import HistoryLogs from './components/HistoryLogs';
import AddPlantModal from './components/AddPlantModal';
import EditPlantModal from './components/EditPlantModal';
import PlantDoctor from './components/PlantDoctor';
import GardenSummary from './components/GardenSummary';
import GrowthAlbumModal from './components/GrowthAlbumModal';
import WeatherWarningEngine from './components/WeatherWarningEngine';
import PetEncyclopedia from './components/PetEncyclopedia';

export default function App() {
  // Base Date set in container metadata (2026-05-26)
  const BASE_DATE = '2026-05-26';

  // State
  const [plants, setPlants] = useState<Plant[]>([]);
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [simulatedToday, setSimulatedToday] = useState<string>(BASE_DATE);
  const [daysElapsed, setDaysElapsed] = useState<number>(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [activeTab, setActiveTab] = useState<'garden' | 'taskList' | 'calendar' | 'logs' | 'encyclopedia'>('garden');
  const [selectedAlbumPlant, setSelectedAlbumPlant] = useState<Plant | null>(null);
  const [petFilter, setPetFilter] = useState<'all' | 'safe' | 'toxic'>('all');

  // AI Context selection
  const [selectedContextPlant, setSelectedContextPlant] = useState<Plant | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedPlants = localStorage.getItem('flora_plants');
    const savedLogs = localStorage.getItem('flora_logs');
    const savedDays = localStorage.getItem('flora_days_elapsed');

    if (savedPlants) {
      const parsed = JSON.parse(savedPlants) as Plant[];
      let updated = [...parsed];
      let changed = false;
      INITIAL_PLANTS.forEach(initial => {
        const index = updated.findIndex(p => p.id === initial.id || p.name === initial.name);
        if (index === -1) {
          updated.push(initial);
          changed = true;
        } else {
          // Update succulent and flower images if using legacy or incorrect image URLs
          const oldImageKeywords = ['photo-1459411552884', 'photo-1518709268805', 'photo-1589146955011', 'photo-1596547609652', 'photo-1520808663317', 'photo-1518895949257'];
          const hasOldImage = oldImageKeywords.some(keyword => updated[index].imageUrl.includes(keyword));
          if (hasOldImage || (initial.id === 'plant-3' && updated[index].name.includes('黄金万年草'))) {
            updated[index] = {
              ...updated[index],
              name: initial.name,
              species: initial.species,
              imageUrl: initial.imageUrl,
              notes: initial.notes
            };
            changed = true;
          }
        }
      });

      // Pet safety auto migration for existing items
      updated = updated.map(p => {
        const initialMatch = INITIAL_PLANTS.find(i => i.species === p.species || i.name === p.name);
        if (initialMatch && (!p.petSafety || !p.petSafetyNotes)) {
          changed = true;
          return {
            ...p,
            petSafety: p.petSafety || initialMatch.petSafety,
            petSafetyNotes: p.petSafetyNotes || initialMatch.petSafetyNotes
          };
        }
        if (!p.petSafety) {
          changed = true;
          return {
            ...p,
            petSafety: 'safe' as const,
            petSafetyNotes: '对宠物友好、无毒无副反应。'
          };
        }
        return p;
      });

      setPlants(updated);
      if (changed) {
        localStorage.setItem('flora_plants', JSON.stringify(updated));
      }
    } else {
      setPlants(INITIAL_PLANTS);
      localStorage.setItem('flora_plants', JSON.stringify(INITIAL_PLANTS));
    }

    if (savedLogs) {
      const parsedLogs = JSON.parse(savedLogs) as CareLog[];
      let updatedLogs = [...parsedLogs];
      let logsChanged = false;
      INITIAL_LOGS.forEach(initial => {
        if (!updatedLogs.some(l => l.id === initial.id || (l.plantName === initial.plantName && l.type === initial.type && l.date === initial.date))) {
          updatedLogs.push(initial);
          logsChanged = true;
        }
      });
      updatedLogs.sort((a, b) => b.date.localeCompare(a.date));
      setLogs(updatedLogs);
      if (logsChanged) {
        localStorage.setItem('flora_logs', JSON.stringify(updatedLogs));
      }
    } else {
      setLogs(INITIAL_LOGS);
      localStorage.setItem('flora_logs', JSON.stringify(INITIAL_LOGS));
    }

    // Load Growth Records
    const savedGrowth = localStorage.getItem('flora_growth_records');
    if (savedGrowth) {
      setGrowthRecords(JSON.parse(savedGrowth) as GrowthRecord[]);
    } else {
      setGrowthRecords(INITIAL_GROWTH_RECORDS);
      localStorage.setItem('flora_growth_records', JSON.stringify(INITIAL_GROWTH_RECORDS));
    }

    if (savedDays) {
      const elapsed = parseInt(savedDays);
      setDaysElapsed(elapsed);
      setSimulatedToday(addDays(BASE_DATE, elapsed));
    }
  }, []);

  // Sync back to localStorage when elements modify
  const saveToStorage = (newPlants: Plant[], newLogs: CareLog[]) => {
    setPlants(newPlants);
    setLogs(newLogs);
    localStorage.setItem('flora_plants', JSON.stringify(newPlants));
    localStorage.setItem('flora_logs', JSON.stringify(newLogs));
  };

  // Quick Action triggered (water completed, fertilizer added, etc.)
  const handleCareAction = (plantId: string, type: 'water' | 'fertilize' | 'pest') => {
    const matchedPlant = plants.find((p) => p.id === plantId);
    if (!matchedPlant) return;

    let actionLabel = '浇水';
    if (type === 'fertilize') actionLabel = '施施肥料';
    if (type === 'pest') actionLabel = '驱虫防病防病害';

    // Create a new care log
    const newLog: CareLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      plantId: plantId,
      plantName: matchedPlant.name,
      type: type,
      date: simulatedToday,
      notes: `已于模拟时间 ${simulatedToday} 为【${matchedPlant.name}】完成了${actionLabel}护理，重置保养提醒倒计时。`
    };

    // Update the plant's history timestamps
    const updatedPlants = plants.map((plant) => {
      if (plant.id === plantId) {
        return {
          ...plant,
          healthStatus: 'healthy' as const, // Reset warning once standard task is checked off
          lastWatered: type === 'water' ? simulatedToday : plant.lastWatered,
          lastFertilized: type === 'fertilize' ? simulatedToday : plant.lastFertilized,
          lastPestControl: type === 'pest' ? simulatedToday : plant.lastPestControl
        };
      }
      return plant;
    });

    const updatedLogs = [newLog, ...logs];
    saveToStorage(updatedPlants, updatedLogs);

    // If active consultation is about this plant, update the state
    if (selectedContextPlant && selectedContextPlant.id === plantId) {
      setSelectedContextPlant(updatedPlants.find((p) => p.id === plantId) || null);
    }
  };

  // Delete a plant
  const handleDeletePlant = (plantId: string) => {
    const updatedPlants = plants.filter((p) => p.id !== plantId);
    const updatedLogs = logs.filter((log) => log.plantId !== plantId); // cascades
    saveToStorage(updatedPlants, updatedLogs);
    if (selectedContextPlant && selectedContextPlant.id === plantId) {
      setSelectedContextPlant(null);
    }
  };

  // Add new plant manually or via AI recommendation
  const handleAddPlant = (newPlant: Omit<Plant, 'id' | 'createdAt'>) => {
    const added: Plant = {
      ...newPlant,
      id: `plant-${Date.now()}`,
      createdAt: simulatedToday
    };

    const updatedPlants = [added, ...plants];
    // Create automatic initial record log
    const addLog: CareLog = {
      id: `log-init-${Date.now()}`,
      plantId: added.id,
      plantName: added.name,
      type: 'water',
      date: simulatedToday,
      notes: `新绿植【${added.name}】(${added.species}) 加入我的小花园！初始预设浇水频率为 ${added.waterInterval} 天。`
    };

    saveToStorage(updatedPlants, [addLog, ...logs]);
  };

  // Growth Album handlers
  const handleAddGrowthRecord = (newRec: Omit<GrowthRecord, 'id'>) => {
    const rec: GrowthRecord = {
      ...newRec,
      id: `growth-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    const updated = [rec, ...growthRecords];
    setGrowthRecords(updated);
    localStorage.setItem('flora_growth_records', JSON.stringify(updated));
  };

  const handleDeleteGrowthRecord = (recId: string) => {
    const updated = growthRecords.filter(r => r.id !== recId);
    setGrowthRecords(updated);
    localStorage.setItem('flora_growth_records', JSON.stringify(updated));
  };

  // Change health state on card
  const handleStatusChange = (plantId: string, status: 'healthy' | 'warning' | 'dormant') => {
    const updatedPlants = plants.map((p) => {
      if (p.id === plantId) {
        return { ...p, healthStatus: status };
      }
      return p;
    });
    saveToStorage(updatedPlants, logs);
    if (selectedContextPlant && selectedContextPlant.id === plantId) {
      setSelectedContextPlant(updatedPlants.find((p) => p.id === plantId) || null);
    }
  };

  // Update background image URL for a plant
  const handleUpdateImageUrl = (plantId: string, newUrl: string) => {
    const updatedPlants = plants.map((p) => {
      if (p.id === plantId) {
        return { ...p, imageUrl: newUrl || 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600' };
      }
      return p;
    });
    saveToStorage(updatedPlants, logs);
    if (selectedContextPlant && selectedContextPlant.id === plantId) {
      setSelectedContextPlant(updatedPlants.find((p) => p.id === plantId) || null);
    }
  };

  // Update objectPosition for a plant
  const handleUpdateImagePosition = (plantId: string, position: string) => {
    const updatedPlants = plants.map((p) => {
      if (p.id === plantId) {
        return { ...p, imagePosition: position };
      }
      return p;
    });
    saveToStorage(updatedPlants, logs);
    if (selectedContextPlant && selectedContextPlant.id === plantId) {
      setSelectedContextPlant(updatedPlants.find((p) => p.id === plantId) || null);
    }
  };

  // Complete update/edit for an existing plant
  const handleUpdatePlant = (updated: Plant) => {
    const updatedPlants = plants.map((p) => (p.id === updated.id ? updated : p));
    
    // Create an update log audit line
    const editLog: CareLog = {
      id: `log-edit-${Date.now()}`,
      plantId: updated.id,
      plantName: updated.name,
      type: 'water',
      date: simulatedToday,
      notes: `已于模拟时间 ${simulatedToday} 更新了【${updated.name}】(${updated.species}) 的核心养护参数与基础属性档案。`
    };

    saveToStorage(updatedPlants, [editLog, ...logs]);
    
    if (selectedContextPlant && selectedContextPlant.id === updated.id) {
      setSelectedContextPlant(updated);
    }
  };

  // Clear all log lines
  const handleClearLogs = () => {
    saveToStorage(plants, []);
  };

  // Remove a single action log line
  const handleDeleteLog = (logId: string) => {
    const updatedLogs = logs.filter((l) => l.id !== logId);
    saveToStorage(plants, updatedLogs);
  };

  // Time machine simulation controls (fast-forwarding date)
  const handleFastForward = (days: number) => {
    const nextElapsed = Math.max(0, daysElapsed + days);
    setDaysElapsed(nextElapsed);
    localStorage.setItem('flora_days_elapsed', nextElapsed.toString());
    
    const nextToday = addDays(BASE_DATE, nextElapsed);
    setSimulatedToday(nextToday);
  };

  const handleResetTimeMachine = () => {
    setDaysElapsed(0);
    localStorage.setItem('flora_days_elapsed', '0');
    setSimulatedToday(BASE_DATE);
  };

  return (
    <div className="min-h-screen bg-[#F7F9F5] text-[#2D3436] selection:bg-[#E9F0E6]">
      
      {/* Botanical Title Header Banner */}
      <header className="border-b border-[#E0E7DE] bg-white/90 backdrop-blur-md sticky top-0 z-40 px-4 py-4 sm:px-6 select-none shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 focus:outline-none">
            <div className="relative h-11 w-11 rounded-[16px] bg-gradient-to-br from-[#3A4D39] to-[#20301F] flex items-center justify-center text-white shadow-md shadow-green-900/15 shrink-0 group overflow-hidden">
              {/* Spinning background floral path */}
              <div className="absolute inset-0 border border-white/5 rounded-full scale-110 rotate-12 group-hover:rotate-180 transition-transform duration-1000 ease-in-out" />
              
              {/* Back layer: Elegant Book/Diary outline symbolizing "日记" (Diary) */}
              <BookOpen className="h-[18px] w-[18px] text-[#A1ACA0]/30 absolute -translate-x-1.5 translate-y-1 -rotate-12 transition-all duration-300 group-hover:-translate-x-2.5 group-hover:rotate-[-20deg]" />

              {/* Front layer: Vivid blooming flower symbolizing "养花" (Floriculture) */}
              <Flower2 className="h-5 w-5 text-[#E9F0E6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] relative z-10 translate-x-1 translate-y-[-1px] transition-all duration-300 group-hover:scale-115 group-hover:text-emerald-200" />

              {/* Magical growth particle sparkles */}
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping opacity-60" />
            </div>
            <div>
              <h1 className="text-md sm:text-lg font-extrabold font-display tracking-tight text-[#3A4D39] flex items-center gap-2">
                花园日记
                <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 bg-[#F0F4EF] text-[#4A6741] border border-[#DCE4DB] rounded-full font-black font-mono">
                  v2.5 Full-Stack
                </span>
              </h1>
              <p className="text-xs text-[#6B7B6A]">定时浇灌水分、点缀有机肥料、驱虫防烂根及黄叶黑腐</p>
            </div>
          </div>

          {/* Time Accelerator Tool info */}
          <div className="flex items-center gap-3 bg-white p-2 px-3 border border-[#E0E7DE] rounded-2xl shadow-xs self-start md:self-auto shrink-0">
            <div className="text-left select-none pr-3 border-r border-[#E0E7DE]">
              <div className="text-[10px] text-[#A1ACA0] font-black uppercase flex items-center gap-1">
                <Clock className="h-3 w-3 text-[#4A6741]" />
                时空加速器
              </div>
              <div className="text-xs font-black font-mono text-[#3A4D39] flex items-baseline gap-1 mt-0.5">
                {simulatedToday}
                {daysElapsed > 0 && (
                  <span className="text-[10px] text-emerald-800 bg-[#E9F0E6] px-1.5 py-0.2 rounded-full font-bold border border-[#DCE4DB]">
                    +{daysElapsed}天
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => handleFastForward(1)}
                className="text-[11px] font-bold px-2.5 py-1.5 bg-[#F0F4EF] hover:bg-[#DCE4DB] text-[#4A6741] rounded-xl transition-colors border border-[#DCE4DB]"
                title="加速 1 天"
              >
                +1 天
              </button>
              <button
                onClick={() => handleFastForward(5)}
                className="text-[11px] font-bold px-2.5 py-1.5 bg-[#F0F4EF] hover:bg-[#DCE4DB] text-[#4A6741] rounded-xl transition-colors border border-[#DCE4DB]"
                title="加速 5 天"
              >
                +5 天
              </button>
              <button
                onClick={() => handleFastForward(15)}
                className="text-[11px] font-black px-2.5 py-1.5 bg-[#3A4D39] hover:bg-[#2C3A2B] text-[#F7F9F5] rounded-xl transition-all shadow-xs"
                title="加速 15 天"
              >
                +15 天
              </button>
              {daysElapsed > 0 && (
                <button
                  onClick={handleResetTimeMachine}
                  className="p-1.5 text-[#8F6E85] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  title="重置时间为今天 (2026-05-26)"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Arena */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 space-y-6">
        
        {/* AI Today's Garden Summary Module */}
        <GardenSummary plants={plants} />

        {/* Weather Warning & Outdoor Linkage Engine */}
        <WeatherWarningEngine
          plants={plants}
          simulatedToday={simulatedToday}
          daysElapsed={daysElapsed}
          onUpdatePlants={(updatedPlants) => saveToStorage(updatedPlants, logs)}
          onAddLog={(newLog) => saveToStorage(plants, [newLog, ...logs])}
        />

        {/* Dashboard 2-Column Split: Garden Controls vs. AI Doctor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column A (Left 2/3): Garden Management Grid */}
          <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
            {/* Nav and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bento-tile bg-white border-[#E0E7DE] shrink-0">
              <div className="flex items-center gap-1 flex-wrap select-none">
                <button
                  onClick={() => setActiveTab('garden')}
                  className={`text-xs px-4 py-2.5 rounded-2xl font-black transition-all flex items-center gap-1.5 ${
                    activeTab === 'garden'
                      ? 'bg-[#3A4D39] text-white shadow-sm'
                      : 'text-[#6B7B6A] hover:text-[#3A4D39]'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>我的温室 ({plants.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('taskList')}
                  className={`text-xs px-4 py-2.5 rounded-2xl font-black transition-all flex items-center gap-1.5 relative ${
                    activeTab === 'taskList'
                      ? 'bg-[#3A4D39] text-white shadow-sm'
                      : 'text-[#6B7B6A] hover:text-[#3A4D39]'
                  }`}
                >
                  <ListTodo className="h-4 w-4" />
                  <span>待办日程</span>
                </button>

                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`text-xs px-4 py-2.5 rounded-2xl font-black transition-all flex items-center gap-1.5 ${
                    activeTab === 'calendar'
                      ? 'bg-[#3A4D39] text-white shadow-sm'
                      : 'text-[#6B7B6A] hover:text-[#3A4D39]'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <span>照料日历 Grid</span>
                </button>

                <button
                  onClick={() => setActiveTab('logs')}
                  className={`text-xs px-4 py-2.5 rounded-2xl font-black transition-all flex items-center gap-1.5 ${
                    activeTab === 'logs'
                      ? 'bg-[#3A4D39] text-white shadow-sm'
                      : 'text-[#6B7B6A] hover:text-[#3A4D39]'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  <span>日常照料足迹 ({logs.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('encyclopedia')}
                  className={`text-xs px-4 py-2.5 rounded-2xl font-black transition-all flex items-center gap-1.5 ${
                    activeTab === 'encyclopedia'
                      ? 'bg-[#3A4D39] text-white shadow-sm'
                      : 'text-[#6B7B6A] hover:text-[#3A4D39]'
                  }`}
                >
                  <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                  <span>🐈 宜忌安全百科</span>
                </button>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-2.5 bg-[#4A6741] hover:bg-[#3A4D39] text-white text-xs font-black rounded-2xl shadow-xs transition-all duration-200 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                <span>购入新生命体</span>
              </button>
            </div>

            {/* Selected Panel display */}
            <div className="flex-1 min-h-[460px]">
              {activeTab === 'garden' ? (
                plants.length === 0 ? (
                  <div className="py-24 text-center rounded-[32px] border border-dashed border-[#DCE4DB] bg-white p-6 max-w-lg mx-auto mt-10 shadow-xs">
                    <div className="h-16 w-16 bg-[#F0F4EF] text-[#4A6741] border border-[#DCE4DB] rounded-full flex items-center justify-center mx-auto mb-5 animate-pulse">
                      <Sprout className="h-8 w-8" />
                    </div>
                    <h3 className="text-md sm:text-lg font-black text-[#3A4D39] font-display">您的掌上温室尚无生命体入住</h3>
                    <p className="text-xs text-[#6B7B6A] mt-2 max-w-sm mx-auto leading-relaxed">
                      请点击右上角「购入新生命体」添加您的第一株绿萝、龟背竹或天竺葵，设定施肥和浇水防虫计划，并配制专有周数。
                    </p>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="mt-6 px-5 py-2.5 bg-[#3A4D39] hover:bg-[#4A6741] text-stone-50 text-xs font-black rounded-2xl transition-all-default"
                    >
                      立刻添加
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Pet Filter Button Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#F7F9F5] rounded-3xl border border-[#E0E7DE]" id="pet-safety-filter-bar">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🐱🐶</span>
                        <div>
                          <h4 className="text-xs font-black text-[#3A4D39]">温室作物宠物友好安全分选</h4>
                          <p className="text-[10px] text-[#6B7B6A]">支持依据猫狗无害/有损标准一键重构并分流展示温室作物</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setPetFilter('all')}
                          className={`text-[10px] px-3 py-1.5 rounded-xl border font-black transition-all ${
                            petFilter === 'all'
                              ? 'bg-[#3A4D39] border-[#3A4D39] text-white'
                              : 'bg-white border-[#E0E7DE] text-[#6B7B6A] hover:bg-[#F0F4EF]'
                          }`}
                        >
                          显示全部 ({plants.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPetFilter('safe')}
                          className={`text-[10px] px-3 py-1.5 rounded-xl border font-black transition-all flex items-center gap-0.5 ${
                            petFilter === 'safe'
                              ? 'bg-emerald-700 border-emerald-700 text-white'
                              : 'bg-white border-[#E0E7DE] text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          🟢 仅无毒安全 ({plants.filter(p => p.petSafety === 'safe').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPetFilter('toxic')}
                          className={`text-[10px] px-3 py-1.5 rounded-xl border font-black transition-all flex items-center gap-0.5 ${
                            petFilter === 'toxic'
                              ? 'bg-amber-600 border-amber-600 text-white'
                              : 'bg-white border-[#E0E7DE] text-amber-600 hover:bg-amber-50'
                          }`}
                        >
                          ⚠️ 仅有毒避坑 ({plants.filter(p => p.petSafety === 'toxic').length})
                        </button>
                      </div>
                    </div>

                    {plants.filter(p => {
                      if (petFilter === 'safe') return p.petSafety === 'safe';
                      if (petFilter === 'toxic') return p.petSafety === 'toxic';
                      return true;
                    }).length === 0 ? (
                      <div className="py-16 text-center text-xs text-[#6B7B6A] bg-white rounded-3xl border border-dashed border-[#E0E7DE] px-4 font-semibold">
                        没有在该安全分流下匹配到多余的温室植物。您可以在库区添加新品种或微调已有卡片属性。
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" id="garden-plants-grid">
                        {plants
                          .filter(p => {
                            if (petFilter === 'safe') return p.petSafety === 'safe';
                            if (petFilter === 'toxic') return p.petSafety === 'toxic';
                            return true;
                          })
                          .map((plant) => (
                            <PlantCard
                              key={plant.id}
                              plant={plant}
                              simulatedToday={simulatedToday}
                              onCareAction={handleCareAction}
                              onDelete={handleDeletePlant}
                              onSetDoctorPlant={(p) => setSelectedContextPlant(p)}
                              onStatusChange={handleStatusChange}
                              onUpdateImagePosition={handleUpdateImagePosition}
                              onEdit={(p) => setEditingPlant(p)}
                              onOpenAlbum={(p) => setSelectedAlbumPlant(p)}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                )
              ) : activeTab === 'taskList' ? (
                <TaskList
                  plants={plants}
                  logs={logs}
                  simulatedToday={simulatedToday}
                  onCareAction={handleCareAction}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                />
              ) : activeTab === 'calendar' ? (
                <CalendarView
                  plants={plants}
                  logs={logs}
                  simulatedToday={simulatedToday}
                  onCareAction={handleCareAction}
                />
              ) : activeTab === 'logs' ? (
                <HistoryLogs
                  logs={logs}
                  onDeleteLog={handleDeleteLog}
                  onClearLogs={handleClearLogs}
                />
              ) : (
                <PetEncyclopedia />
              )}
            </div>
          </div>

          {/* Column B (Right 1/3): Constant AI Plant Doctor Panel */}
          <div className="lg:col-span-1">
            <PlantDoctor
              plants={plants}
              selectedContextPlant={selectedContextPlant}
              onClearContextPlant={() => setSelectedContextPlant(null)}
              onSelectContextPlant={(p) => setSelectedContextPlant(p)}
            />
          </div>
        </div>

        {/* Environment secret alert banner */}
        <SettingsAlert />
      </main>

      {/* Adding Modal Dialogue */}
      <AddPlantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPlant={handleAddPlant}
        simulatedToday={simulatedToday}
      />

      {/* Editing Modal Dialogue */}
      <EditPlantModal
        isOpen={editingPlant !== null}
        onClose={() => setEditingPlant(null)}
        plant={editingPlant}
        onSave={handleUpdatePlant}
        simulatedToday={simulatedToday}
      />

      {/* Growth Timeline Photo Album Modal */}
      {selectedAlbumPlant && (
        <GrowthAlbumModal
          isOpen={true}
          onClose={() => setSelectedAlbumPlant(null)}
          plant={selectedAlbumPlant}
          simulatedToday={simulatedToday}
          growthRecords={growthRecords}
          onAddRecord={handleAddGrowthRecord}
          onDeleteRecord={handleDeleteGrowthRecord}
        />
      )}

      {/* Fine Botanical Footer */}
      <footer className="border-t border-[#E0E7DE] bg-white py-10 text-center text-xs text-[#6B7B6A] mt-20 select-none">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-2 text-[#3A4D39] font-black font-display text-sm">
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
            让每一片绿意优雅常青，静待岁月绽放。
          </div>
          <p className="max-w-md leading-normal text-[#6B7B6A]/85 font-semibold">
            花园日记采用离线高速缓存引擎，配制 Google Gemini AI 微智能大脑，全天候守护您的爱花盆栽。
          </p>
        </div>
      </footer>
    </div>
  );
}
