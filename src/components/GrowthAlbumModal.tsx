import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Trash2, 
  Calendar, 
  Ruler, 
  Plus, 
  Sparkles, 
  ArrowUpDown, 
  ChevronRight,
  BookOpen,
  Image as ImageIcon
} from 'lucide-react';
import { Plant, GrowthRecord } from '../types';

interface GrowthAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  plant: Plant;
  simulatedToday: string;
  growthRecords: GrowthRecord[];
  onAddRecord: (record: Omit<GrowthRecord, 'id'>) => void;
  onDeleteRecord: (recordId: string) => void;
}

export default function GrowthAlbumModal({
  isOpen,
  onClose,
  plant,
  simulatedToday,
  growthRecords,
  onAddRecord,
  onDeleteRecord
}: GrowthAlbumModalProps) {
  // Filter records for this specific plant
  const plantRecords = growthRecords.filter(r => r.plantId === plant.id);

  // States
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // Newer first by default
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // New Record Form States
  const [newDate, setNewDate] = useState(simulatedToday);
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newHeight, setNewHeight] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  
  // Camera handler states
  const [activeCamera, setActiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize newDate if simulatedToday changes
  useEffect(() => {
    if (isOpen) {
      setNewDate(simulatedToday);
      setIsAddingNew(false);
      setImageUrl('');
      setNewTitle('');
      setNewNote('');
      setNewHeight('');
      setActiveCamera(false);
    }
  }, [isOpen, simulatedToday]);

  // Clean raw tracks on exit
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  // Sorted list of records
  const sortedRecords = [...plantRecords].sort((a, b) => {
    if (sortOrder === 'desc') {
      return b.date.localeCompare(a.date);
    } else {
      return a.date.localeCompare(b.date);
    }
  });

  // Calculate highest height stats
  const heights = plantRecords.map(r => r.height).filter((h): h is number => typeof h === 'number');
  const maxRecordedHeight = heights.length > 0 ? Math.max(...heights) : null;

  // Turn on camera stream
  const startCamera = async () => {
    setCameraError('');
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setActiveCamera(true);
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setCameraError('硬件麦克/相机权限受限。请确认已授予网页相机访问权。您也可以在下方选择直接上传本地图像文件。');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setActiveCamera(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        setImageUrl(base64);
        stopCamera();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectRandomPlaceholder = () => {
    // Elegant fallback list of plant images from Unsplash to ensure perfect UX
    const defaults = [
      'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1525498128493-380d12906ef5?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80'
    ];
    const item = defaults[Math.floor(Math.random() * defaults.length)];
    setImageUrl(item);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('请填写活动或记录的主题名称 (例如：叶端抽出新枝)');
      return;
    }

    onAddRecord({
      plantId: plant.id,
      date: newDate,
      title: newTitle.trim(),
      note: newNote.trim() || '未填写特别备注。',
      height: newHeight ? parseFloat(newHeight) : undefined,
      imageUrl: imageUrl || plant.imageUrl || 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600'
    });

    // Reset Form
    setIsAddingNew(false);
    setImageUrl('');
    setNewTitle('');
    setNewNote('');
    setNewHeight('');
    stopCamera();
  };

  return (
    <div className="fixed inset-0 bg-[#1e251c]/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="growth-album-modal-backdrop">
      <div 
        id="growth-album-modal"
        className="bg-white rounded-[32px] w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-[#DCE4DB] border-b-8 border-b-[#4A6741] animate-scale-up"
      >
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#E9F0E6] to-white border-b border-[#F0F4EF] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#4A6741] text-white rounded-2xl">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display text-[#1E251C]">{plant.name} 的成长纪实</h2>
                <span className="text-[10px] font-mono font-black text-[#6B7B6A] bg-[#E0E7DE] px-2 py-0.5 rounded-md uppercase">
                  {plant.species}
                </span>
              </div>
              <p className="text-xs text-[#6B7B6A] mt-0.5">记录光阴的轨迹，见证每一次新叶萌芽与花蕾绽放</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-[#6B7B6A] hover:bg-[#F0F4EF] rounded-full transition-all cursor-pointer"
            id="close-growth-album"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Sub-stats Board */}
        <div className="px-6 py-3.5 bg-[#F7F9F5] border-b border-[#F0F4EF] flex flex-wrap gap-4 items-center justify-between shrink-0 text-xs">
          <div className="flex gap-4">
            <span className="text-[#3A4D39] font-bold">
              记录总数: <strong className="text-[#4A6741] font-mono text-sm">{plantRecords.length}</strong> 篇
            </span>
            {maxRecordedHeight ? (
              <span className="text-[#3A4D39] font-bold flex items-center gap-1">
                <Ruler className="h-3 w-3 text-[#4A6741]" />
                最高生长高度: <strong className="text-[#4A6741] font-mono text-sm">{maxRecordedHeight}</strong> cm
              </span>
            ) : (
              <span className="text-[#A1ACA0] font-semibold italic">暂无高度轨迹记录</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="text-[11px] font-black tracking-wide text-[#3A4D39] hover:bg-[#E9F0E6] px-3 py-1.5 rounded-xl border border-[#DCE4DB] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <ArrowUpDown className="h-3 w-3" />
              <span>{sortOrder === 'desc' ? '最新优先' : '最旧优先'}</span>
            </button>
            
            {!isAddingNew && (
              <button
                onClick={() => setIsAddingNew(true)}
                className="text-[11px] font-black tracking-wide bg-[#3A4D39] hover:bg-[#4A6741] text-white px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
              >
                <Plus className="h-3 w-3" />
                <span>撰写日志</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
          
          {/* Add New Growth Record Form Panel */}
          {isAddingNew && (
            <form 
              onSubmit={handleSubmit}
              className="mb-8 p-5 bg-white border-2 border-[#E0E7DE] rounded-3xl shadow-md animate-fade-in space-y-4"
              id="add-growth-record-form"
            >
              <div className="flex justify-between items-center border-b border-[#F0F4EF] pb-3 mb-1">
                <h3 className="text-sm font-black text-[#1E251C] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-500 animate-spin-slow" />
                  新增成长相册记录
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsAddingNew(false);
                  }}
                  className="text-xs text-rose-600 font-bold hover:bg-rose-50 px-2.5 py-1 rounded-lg transition"
                >
                  取消
                </button>
              </div>

              {/* Grid 2 Column fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-[#3A4D39] mb-1.5">记录标题 <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="如：抽出了两片鹅黄嫩芽"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full text-xs font-semibold px-4 py-3 border border-[#DCE4DB] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#4A6741] transition-all bg-[#F9FBF8]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-[#3A4D39] mb-1.5">记录日期 <span className="text-rose-500">*</span></label>
                      <input 
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full text-xs font-semibold font-mono px-3 py-3 border border-[#DCE4DB] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#4A6741] bg-[#F9FBF8]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#3A4D39] mb-1.5">植物高度 (cm)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        placeholder="选填"
                        value={newHeight}
                        onChange={(e) => setNewHeight(e.target.value)}
                        className="w-full text-xs font-semibold font-mono px-3 py-3 border border-[#DCE4DB] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#4A6741] bg-[#F9FBF8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#3A4D39] mb-1.5">养护日志 / 叙述详情</label>
                    <textarea 
                      rows={3}
                      placeholder="详细描述目前的叶色、开花状态、或者是观察到的长势、换盆经历等..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="w-full text-xs font-semibold px-4 py-3 border border-[#DCE4DB] rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#4A6741] transition bg-[#F9FBF8] resize-none"
                    ></textarea>
                  </div>
                </div>

                {/* Right column: Image capturing & Upload section */}
                <div className="flex flex-col">
                  <label className="block text-xs font-black text-[#3A4D39] mb-1.5">成长照片录入</label>
                  <div className="border border-[#DCE4DB] bg-[#F9FBF8] rounded-2xl p-3 flex-1 flex flex-col justify-between space-y-3">
                    
                    {/* Preview / Active camera box */}
                    <div className="relative aspect-video w-full bg-[#E0E7DE]/50 rounded-xl overflow-hidden border border-[#DCE4DB] flex items-center justify-center">
                      {activeCamera ? (
                        <video 
                          ref={videoRef} 
                          className="absolute inset-0 w-full h-full object-cover" 
                          playsInline 
                          muted 
                        />
                      ) : imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt="Growth preview" 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-3 text-[#6B7B6A] space-y-1 select-none">
                          <ImageIcon className="h-8 w-8 mx-auto opacity-40 animate-pulse text-[#4A6741]" />
                          <p className="text-[10px] font-bold">暂无选定的照片文件</p>
                          <p className="text-[8.5px] font-medium text-[#A1ACA0]">拍照、上传或选择推荐示例图</p>
                        </div>
                      )}

                      {/* Camera overlays */}
                      {activeCamera && (
                        <div className="absolute inset-0 flex items-end justify-center pb-2.5 bg-black/25 z-10">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="bg-emerald-600 hover:bg-emerald-700 text-stone-100 px-3.5 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-md transition-all active:scale-95"
                          >
                            <Camera className="h-3 w-3" />
                            捕捉画面
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Camera and file system button selectors */}
                    <div className="flex gap-2 flex-wrap text-[10px] font-black">
                      {activeCamera ? (
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="grow py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-center cursor-pointer transition-all active:scale-95"
                        >
                          关闭相机
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startCamera}
                          className="grow py-1.5 bg-[#4A6741] hover:bg-[#3D5535] text-white rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>拍张现场照</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="grow py-1.5 bg-[#F0F4EF] hover:bg-[#DCE4DB] text-[#4A6741] border border-[#DCE4DB] rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>上传本地照片</span>
                      </button>

                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />

                      <button
                        type="button"
                        onClick={selectRandomPlaceholder}
                        className="grow py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl transition-all active:scale-95"
                        title="选用我们为您挑选的绿色养眼插图示例"
                      >
                        🌟 推荐美图
                      </button>
                    </div>

                    {cameraError && (
                      <p className="text-[9px] text-rose-600 leading-normal font-medium bg-rose-50 p-2 rounded-xl border border-rose-150">
                        ⚠️ {cameraError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit footer row */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#F0F4EF]">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsAddingNew(false);
                  }}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black rounded-xl transition"
                >
                  关闭不保存
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#3A4D39] hover:bg-[#4A6741] text-white text-xs font-black rounded-xl transition shadow-sm hover:shadow-md"
                >
                  保存此光阴瞬间
                </button>
              </div>
            </form>
          )}

          {/* Records Timeline Visualization */}
          {sortedRecords.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-[#DCE4DB] rounded-[24px] px-6 select-none animate-fade-in">
              <div className="text-4xl">📸</div>
              <h3 className="text-[#3A4D39] font-black text-sm mt-3">这株植物的相册目前空空如也</h3>
              <p className="text-[11px] text-[#6B7B6A] mt-1 max-w-sm mx-auto leading-relaxed">
                照片能记录浇灌的快乐和阳光的温存。请点击右上角的「撰写日志」为它拍摄或上传生平的第一张定妆照吧！
              </p>
            </div>
          ) : (
            <div className="relative pl-6 md:pl-8 border-l border-[#DCE4DB] ml-2 space-y-8 py-2">
              {sortedRecords.map((record) => {
                return (
                  <div 
                    key={record.id}
                    id={`growth-record-${record.id}`}
                    className="relative group animate-fade-in"
                  >
                    {/* Bullet marker on timeline */}
                    <div className="absolute -left-[31px] md:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-[#4A6741] ring-4 ring-[#E9F0E6] z-10 flex items-center justify-center transition-transform group-hover:scale-125" />

                    {/* Timeline Log Card */}
                    <div className="bg-white rounded-3xl overflow-hidden border border-[#DCE4DB] shadow-xs group-hover:shadow-md transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden">
                      
                      {/* Left Block: Photographic Memory */}
                      <div className="md:col-span-4 relative aspect-video md:aspect-auto md:min-h-[160px] bg-[#F7F9F5]">
                        <img 
                          src={record.imageUrl} 
                          alt={record.title} 
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        {record.height !== undefined && (
                          <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white font-mono text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm border border-white/20">
                            <Ruler className="h-2.5 w-2.5 text-emerald-400" />
                            <span>{record.height} cm</span>
                          </div>
                        )}
                      </div>

                      {/* Right Block: Descriptive Timeline Info */}
                      <div className="md:col-span-8 p-5 flex flex-col justify-between bg-white relative">
                        {/* Delete Log button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('确认要删除此篇成长日记吗？此操作无法撤销。')) {
                              onDeleteRecord(record.id);
                            }
                          }}
                          className="absolute top-4 right-4 p-1.5 bg-stone-50 hover:bg-rose-100 text-[#A1ACA0] hover:text-rose-600 rounded-full transition-colors"
                          title="删除当前成长相册记录"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>

                        <div>
                          {/* Calendar & Date */}
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-[#6B7B6A] uppercase tracking-wide mb-1 font-mono">
                            <Calendar className="h-3.5 w-3.5 text-[#4A6741]" />
                            <span>{record.date}</span>
                            {record.date === simulatedToday && (
                              <span className="bg-emerald-100 text-emerald-850 px-1.5 py-0.5 rounded-md text-[8px] font-extrabold ml-1 font-sans">
                                今日发布
                              </span>
                            )}
                          </div>

                          {/* Record Title */}
                          <h4 className="text-sm font-extrabold text-[#1E251C] mb-2 leading-snug tracking-tight">
                            {record.title}
                          </h4>

                          {/* Record Detail Notes */}
                          <p className="text-xs text-[#556953] leading-relaxed break-words whitespace-pre-wrap">
                            {record.note}
                          </p>
                        </div>

                        {/* Plant indicator tag footer */}
                        <div className="mt-4 pt-3.5 border-t border-[#F0F4EF] flex items-center justify-between text-[10px] text-[#6B7B6A] select-none">
                          <span className="font-bold flex items-center gap-1 bg-[#F7F9F5] px-2.5 py-1 rounded-lg border border-[#F0F4EF]">
                            成员: <span className="text-[#3A4D39] font-black">{plant.name}</span>
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Modal overall Footer */}
        <div className="p-4 bg-white border-t border-[#F0F4EF] flex justify-end shrink-0">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-6 py-2 bg-[#F0F4EF] hover:bg-[#DCE4DB] text-[#4A6741] text-xs font-black rounded-lg cursor-pointer transition-colors active:scale-95"
          >
            完成纪实回顾
          </button>
        </div>

      </div>
    </div>
  );
}
