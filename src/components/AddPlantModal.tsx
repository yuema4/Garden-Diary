import { useState, useEffect, useRef, FormEvent } from 'react';
import { X, Sparkles, AlertTriangle, Droplet, Leaf, ShieldAlert, ListFilter, HelpCircle, Loader, Camera, Upload, RefreshCw, Check, Image as ImageIcon } from 'lucide-react';
import { Plant, CarePlanRecommendation } from '../types';
import { PLANT_SPECIES_PRESETS } from '../utils/initialData';
import { getCustomApiHeaders } from '../utils/customApi';

interface AddPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlant: (plant: Omit<Plant, 'id' | 'createdAt'>) => void;
  simulatedToday: string;
}

export default function AddPlantModal({ isOpen, onClose, onAddPlant, simulatedToday }: AddPlantModalProps) {
  // Manual / Preset fields
  const [name, setName] = useState('');
  const [presetIndex, setPresetIndex] = useState('-1');
  const [species, setSpecies] = useState('');
  const [location, setLocation] = useState('客厅 (Living Room)');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePosition, setImagePosition] = useState('center');
  const [petSafety, setPetSafety] = useState<'safe' | 'toxic'>('safe');
  const [petSafetyNotes, setPetSafetyNotes] = useState('');

  // Schedulers (Intervals in days)
  const [waterInterval, setWaterInterval] = useState(7);
  const [fertilizeInterval, setFertilizeInterval] = useState(30);
  const [pestInterval, setPestInterval] = useState(90);

  // Completed Action Date references (default to simulatedToday)
  const [lastWatered, setLastWatered] = useState(simulatedToday);
  const [lastFertilized, setLastFertilized] = useState(simulatedToday);
  const [lastPestControl, setLastPestControl] = useState(simulatedToday);

  // AI-Assisted Planner state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState<CarePlanRecommendation | null>(null);

  // AI Camera & Photo Identify state
  const [activeCamera, setActiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedBase64, setCapturedBase64] = useState('');
  const [identifyLoading, setIdentifyLoading] = useState(false);
  const [identifyError, setIdentifyError] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean raw media tracks on modal change or unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Reset fields when opening modal
  useEffect(() => {
    if (isOpen) {
      setName('');
      setPresetIndex('-1');
      setSpecies('');
      setLocation('客厅 (Living Room)');
      setNotes('');
      setImageUrl('');
      setImagePosition('center');
      setWaterInterval(7);
      setFertilizeInterval(30);
      setPestInterval(90);
      setLastWatered(simulatedToday);
      setLastFertilized(simulatedToday);
      setLastPestControl(simulatedToday);
      setAiRecommendation(null);
      setAiError('');
      setActiveCamera(false);
      setCameraError('');
      setCapturedBase64('');
      setIdentifyLoading(false);
      setIdentifyError('');
      setPetSafety('safe');
      setPetSafetyNotes('');
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [isOpen, simulatedToday]);

  // Turn on device physical camera preview
  const startCamera = async () => {
    setCameraError('');
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' } // focus back lens on mobile
        });
      } catch (innerErr) {
        console.warn('Could not acquire environment-facing camera, falling back to any standard camera device:', innerErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      streamRef.current = stream;
      setActiveCamera(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('无法调用摄像头：' + (err.message || '请确保已授予本网页摄像头访问权限，并且设备包含可用摄像头（如前置摄像头）。您可以直接使用右侧“选择/拍照文件”从相册上传或现场连拍进行识别。'));
    }
  };

  // Stop device physical camera preview
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setActiveCamera(false);
  };

  // Capture canvas frame from HTML5 video rendering element
  const captureImage = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedBase64(dataUrl);
        stopCamera();
      }
    }
  };

  // Handle system local image files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCapturedBase64(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Run multimodality model classifier on user image base64 raw binary
  const startIdentify = async () => {
    if (!capturedBase64) return;
    setIdentifyLoading(true);
    setIdentifyError('');
    try {
      const response = await fetch('/api/gemini/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCustomApiHeaders()
        },
        body: JSON.stringify({ base64Image: capturedBase64 }),
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'AI 视觉分析植物失败，请检查 API 配置状态。');
      }

      const data = await response.json();
      
      if (data.isFallback) {
        setIdentifyError(`⚠️ 现场照片云端识别受阻（系统已安全切换至「本地经典花卉参数兜底模式」，依然为您填充好了基础天数与备注，不影响您的录入！您可以点击卡片进一步自定义配置）。\n\n具体报错原因：${data.rawError || 'API配置未就绪。'}`);
      }
      
      // Auto-populate states
      setName(data.name || '');
      setSpecies(data.species || '');
      if (data.waterInterval) setWaterInterval(data.waterInterval);
      if (data.fertilizeInterval !== undefined) setFertilizeInterval(data.fertilizeInterval);
      if (data.pestInterval) setPestInterval(data.pestInterval);
      if (data.petSafety) setPetSafety(data.petSafety);
      if (data.petSafetyNotes) setPetSafetyNotes(data.petSafetyNotes);
      
      // Assign real taken/captured picture url as the cover image so it feels extremely personalized!
      setImageUrl(capturedBase64);
      
      // Format notes containing insights
      const tipsStr = data.tips ? data.tips.join('。') : '';
      setNotes(`【AI防虫建议】：${data.pestMeasures || '无'}。\n【AI养护秘诀】：${tipsStr}。\n【光照需求】：${data.sunlightNeed || '正常'}\n\n【视觉识别学名分类与栽培指导】：\n${data.notes || '暂无，适合室温养护。'}`);
      
      setAiRecommendation({
        species: data.species,
        waterInterval: data.waterInterval,
        fertilizeInterval: data.fertilizeInterval,
        pestInterval: data.pestInterval,
        tips: data.tips || [],
        pestMeasures: data.pestMeasures || '',
        sunlightNeed: data.sunlightNeed || '散射光'
      });
    } catch (err: any) {
      console.error(err);
      setIdentifyError(`AI 视觉识别解析遇到不可抗力异常: ${err.message || '请在 Settings > Secrets 面板检查 GEMINI_API_KEY。'}`);
    } finally {
      setIdentifyLoading(false);
    }
  };

  // Handle plant preset selection
  const handlePresetChange = (indexStr: string) => {
    setPresetIndex(indexStr);
    const index = parseInt(indexStr);
    if (!isNaN(index) && index >= 0) {
      const preset = PLANT_SPECIES_PRESETS[index];
      // Strip brackets for primary display
      const simpleName = preset.name.split(' (')[0];
      setName(simpleName);
      setSpecies(preset.species);
      setWaterInterval(preset.water);
      setFertilizeInterval(preset.fertilize);
      setPestInterval(preset.pest);
      setPetSafety((preset as any).petSafety || 'safe');
      setPetSafetyNotes((preset as any).petSafetyNotes || '');
      
      // Select appropriate Unsplash cover based on species keywords
      let searchKeyword = preset.species.split(' ')[0] || simpleName;
      setImageUrl(`https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80`); // default
      if (simpleName.includes('多肉')) {
        setImageUrl('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80');
      } else if (simpleName.includes('月季')) {
        setImageUrl('https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80');
      } else if (simpleName.includes('茶花') || simpleName.includes('山茶')) {
        setImageUrl('https://images.unsplash.com/photo-1610444379933-28f73fe0009c?w=600&auto=format&fit=crop&q=80');
      } else if (simpleName.includes('琴叶榕')) {
        setImageUrl('https://images.unsplash.com/photo-1597055181300-e3633a207518?w=600');
      } else if (simpleName.includes('绿萝')) {
        setImageUrl('https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=600&auto=format&fit=crop&q=80');
      } else if (simpleName.includes('一帆风顺') || simpleName.includes('白掌')) {
        setImageUrl('https://images.unsplash.com/photo-1593696140826-c58b021acf8b?w=600');
      } else if (simpleName.includes('龟背竹')) {
        setImageUrl('https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600');
      } else if (simpleName.includes('发财树')) {
        setImageUrl('https://images.unsplash.com/photo-1512428813824-f7253df4e167?w=600');
      } else if (simpleName.includes('虎皮兰')) {
        setImageUrl('https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=600');
      } else if (simpleName.includes('茉莉')) {
        setImageUrl('https://images.unsplash.com/photo-1508717272800-9fff97da7e8f?w=600');
      } else if (simpleName.includes('蝴蝶兰')) {
        setImageUrl('https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=600');
      }
    }
  };

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
      
      // Add a note containing AI secrets
      const infoTips = data.tips ? data.tips.join('。') : '';
      setNotes(`【AI防虫建议】：${data.pestMeasures || '无'}。\n【AI养护秘诀】：${infoTips}。\n【光照需求】：${data.sunlightNeed || '正常'}`);

      // Auto load some matching Unsplash cover based on AI classification strings
      setImageUrl(`https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600&q=80&sig=${Math.floor(Math.random() * 1000)}`);
    } catch (err: any) {
      console.error(err);
      setAiError(`AI 制定计划出错: ${err.message || '请检查 GEMINI_API_KEY 配置。'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddPlant({
      name: name.trim(),
      species: species.trim() || '室内植物',
      location,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600',
      imagePosition,
      waterInterval,
      fertilizeInterval,
      pestInterval,
      lastWatered,
      lastFertilized: fertilizeInterval > 0 ? lastFertilized : lastWatered, // fallbacks
      lastPestControl: lastPestControl,
      healthStatus: 'healthy',
      petSafety,
      petSafetyNotes: petSafetyNotes.trim(),
      notes: notes.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl border border-[#E0E7DE] max-h-[90vh] flex flex-col transition-all">
        {/* Modal Header */}
        <div className="p-5 bg-[#F0F4EF] border-b border-[#E0E7DE] flex items-center justify-between shrink-0">
          <h3 className="text-md sm:text-lg font-black text-[#3A4D39] font-display flex items-center gap-1.5">
            🪴 购入全新的生命体归档
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[#DCE4DB] text-[#6B7B6A] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1 scrollbar-thin">
          {/* AI Plant Vision identification block */}
          <div className="bg-[#F0F5EE] border border-dashed border-[#BCD4B4] rounded-[24px] p-4.5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="bg-[#4A6741] p-1.5 rounded-lg text-white">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#3A4D39]">AI 智能视觉拍照/识别区</h4>
                  <p className="text-[10px] text-[#6B7B6A]">使用设备摄像头拍摄或直接上传图片，由 AI 解析品种并自动填表</p>
                </div>
              </div>
              <div className="flex gap-2 text-[10px] font-black shrink-0 justify-end">
                {!activeCamera ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4A6741] text-white rounded-xl hover:bg-[#3D5535] transition-all cursor-pointer"
                  >
                    <Camera className="h-3 w-3" />
                    <span>调用摄像头</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                    <span>关闭相机</span>
                  </button>
                )}

                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE4DB] text-[#4A6741] rounded-xl hover:bg-[#F7F9F5] transition-all cursor-pointer">
                  <Upload className="h-3 w-3" />
                  <span>选择/拍照文件</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Live Camera Feed display */}
            {activeCamera && (
              <div className="relative rounded-2xl overflow-hidden bg-black border border-[#DCE4DB] max-w-lg mx-auto">
                <video
                  ref={videoRef}
                  playsInline
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={captureImage}
                    className="px-5 py-2.5 bg-[#4A6741] hover:bg-[#3D5535] text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Camera className="h-4 w-4" />
                    <span>拍照截图</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2 bg-black/60 hover:bg-black/80 text-white text-xs rounded-xl border border-white/20 transition-all cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* Display camera access/permission errors */}
            {cameraError && (
              <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl leading-relaxed">
                ⚠️ {cameraError}
              </div>
            )}

            {/* Capture Preview or Upload Preview with AI Actions */}
            {capturedBase64 && (
              <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-3 rounded-2xl border border-[#DCE4DB] animate-fade-in text-left">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-[#EBEBEB] shrink-0 bg-gray-50">
                  <img
                    src={capturedBase64}
                    alt="captured plant"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setCapturedBase64('')}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all cursor-pointer"
                    title="移除并重新拍摄"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grow space-y-1.5 text-center sm:text-left min-w-0">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E9F0E6] text-[#4A6741] text-[9.5px] font-extrabold uppercase">
                      🪴 肖像图片就绪
                    </span>
                  </div>
                  <h5 className="text-xs font-black text-[#3A4D39] truncate">已捕捉并预存绿植实时肖像</h5>
                  <p className="text-[10px] text-[#6B7B6A] leading-relaxed">
                    点击下方按钮将图片发送给 <strong>Gemini Multimodal AI</strong> 深度诊断与鉴定。
                  </p>
                  <div className="pt-1.5 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={startIdentify}
                      disabled={identifyLoading}
                      className="px-4 py-2 bg-[#3A4D39] hover:bg-[#4A6741] text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {identifyLoading ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      <span>🧬 AI 识别并一键填表</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCapturedBase64('')}
                      className="px-3.5 py-2 bg-[#F0F4EF] hover:bg-[#DCE4DB] text-[#3A4D39] rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      清除图片
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Display AI recognition state */}
            {identifyLoading && (
              <div className="p-4 bg-white border border-[#DCE4DB] rounded-xl text-center flex items-center justify-center gap-2.5 animate-pulse text-xs font-extrabold text-[#3A4D39]">
                <Loader className="h-4 w-4 animate-spin text-[#4A6741]" />
                <span>AI 植物学家正解构绿植图片、识别学名和全套周期数据中...</span>
              </div>
            )}

            {identifyError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-700 leading-relaxed text-left">
                ❌ {identifyError}
              </div>
            )}
          </div>

          {/* Preset Select & Name Field */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-[#3A4D39] mb-1.5 uppercase">
                植物百科预设 (快速填充)
              </label>
              <select
                value={presetIndex}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full text-xs font-bold bg-[#F7F9F5] border border-[#E0E7DE] text-[#3A4D39] px-3.5 py-2.5 rounded-2xl cursor-pointer focus:outline-none focus:border-[#4A6741] transition-all"
              >
                <option value="-1">-- 自定义配置 (手动设限) --</option>
                {PLANT_SPECIES_PRESETS.map((preset, idx) => (
                  <option key={idx} value={idx}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-[#3A4D39] mb-1.5">
                自定义绿植昵称 / 标号 <span className="text-rose-500">*</span>
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
                  <span>AI制定</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Output Result Box */}
          {aiLoading && (
            <div className="p-5 bg-[#F0F4EF] border border-[#DCE4DB] rounded-2xl text-center flex flex-col items-center justify-center gap-3 animate-pulse">
              <Loader className="h-7 w-7 animate-spin text-[#4A6741]" />
              <p className="text-xs font-black text-[#3A4D39]">
                AI 正在撰写深度绿植养护纲领，请稍候...
              </p>
              <p className="text-[10px] text-[#6B7B6A] max-w-sm leading-normal">
                正在智能匹配：生长原产地环境、所需散光比例、防虫大药配比、最适干透浇水周数等。
              </p>
            </div>
          )}

          {aiError && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2 text-xs text-rose-700">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">AI 预配方案由于秘钥发生异常</p>
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
              <p className="text-[11px] text-[#4A6741] leading-relaxed font-semibold">
                “已将参数导入！下方特别备注栏中自动为您扩写了土壤配方、如何发现并处理红蜘蛛、以及稀释营养液的指南。”
              </p>
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
            <h4 className="text-xs font-black text-[#3A4D39] border-b border-[#E0E7DE] pb-2 flex items-center gap-1.5 uppercase">
              <ListFilter className="h-4 w-4 text-[#4A6741]" />
              设置定时循环周期守护频率 (天)
            </h4>

            {/* Water interval slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
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
              <span className="text-[10px] text-[#6B7B6A] block mt-1 font-medium">草本盆花经常浇 (2-5天), 木本温润偏干 (7-10天), 沙漠多肉及仙人掌极耐旱 (15-25天)</span>
            </div>

            {/* Fertilize interval slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
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
              <span className="text-[10px] text-[#6B7B6A] block mt-1 font-medium">数值为0代表暂时不肥。春夏季生长旺季推荐 20-30 天用薄水溶肥进行大盆浇灌。</span>
            </div>

            {/* Pest interval slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
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
              <span className="text-[10px] text-[#6B7B6A] block mt-1 font-medium">密闭不透风环境下容易起蚜虫、玄叶螨。建议 60-90 天于盆土中预埋多菌灵菌盾防护。</span>
            </div>
          </div>

          {/* Starting state action dates selection */}
          <div className="p-4 bg-[#F0F4EF] border border-[#E0E7DE] rounded-3xl space-y-3">
            <h4 className="text-xs font-black text-[#3A4D39] flex items-center gap-1">
              设定最末一次物理操作历史 (开始时间推导)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-black text-[#6B7B6A] block mb-1">
                  上次浇水
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
                  上次授肥
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
                  上次药物理
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

          {/* Image input and Notes */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-[#3A4D39] mb-1.5">
                  绿植肖像照网络连接 (图片 URL)
                </label>
                <input
                  type="url"
                  placeholder="粘贴网络中该绿植的高清大图连接，默认为温室植物美图"
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
                自拟特别注意事项 (承接自 AI 养绿植秘诀)
              </label>
              <textarea
                rows={3}
                placeholder="手动配比水温；或者承载AI诊断得出的土壤、追肥、配方大药使用说明..."
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
              录入常青绿植
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
