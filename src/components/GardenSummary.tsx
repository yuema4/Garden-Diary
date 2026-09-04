import { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, RefreshCw, Loader2, ShieldCheck, HeartPulse } from 'lucide-react';
import { Plant } from '../types';
import { getCustomApiHeaders } from '../utils/customApi';

interface GardenSummaryProps {
  plants: Plant[];
}

interface SummaryData {
  healthScore: number;
  healthGrade: string;
  summary: string;
  dailyAdvice: string;
  attentionPlants: Array<{
    plantName: string;
    reason: string;
  }>;
}

export default function GardenSummary({ plants }: GardenSummaryProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  // Calculate a hash of plant states to detect changes
  const plantsHash = plants
    .map((p) => `${p.id}-${p.healthStatus}-${p.lastWatered}-${p.lastFertilized}`)
    .join('|');

  // Check if API key is available
  useEffect(() => {
    fetch('/api/gemini/status', {
      headers: getCustomApiHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        setApiAvailable(data.available);
      })
      .catch(() => {
        setApiAvailable(false);
      });
  }, []);

  // Check cache on mount or plants list status change
  useEffect(() => {
    const cached = localStorage.getItem('flora_garden_summary_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.hash === plantsHash) {
          setSummary(parsed.data);
          setError(null);
          return;
        } else {
          // If hash mismatch, we keep the stale data but we don't clear it yet
          // so the user can see previous data while keeping an option to refresh.
          setSummary(parsed.data);
        }
      } catch (e) {
        // Safe to ignore
      }
    }

    // Auto-fetch if no cache exists and we have plants and API is available
    if (!cached && plants.length > 0 && apiAvailable === true) {
      fetchSummary();
    }
  }, [plantsHash, apiAvailable]);

  const fetchSummary = async () => {
    if (plants.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/gemini/garden-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCustomApiHeaders()
        },
        body: JSON.stringify({ plants }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || '网络请求异常，无法获取智能综合摘要。请核验 API 密钥及代理端点是否可行。');
      }

      const data = (await response.json()) as SummaryData;
      setSummary(data);
      // Cache the result
      localStorage.setItem(
        'flora_garden_summary_cache',
        JSON.stringify({ hash: plantsHash, data })
      );
    } catch (err: any) {
      console.error('Failed to fetch garden summary:', err);
      setError(err.message || 'AI 摘要生成失败，请稍后刷新重试。');
    } finally {
      setLoading(false);
    }
  };

  const getCachedHash = () => {
    try {
      const cached = localStorage.getItem('flora_garden_summary_cache');
      return cached ? JSON.parse(cached).hash : '';
    } catch {
      return '';
    }
  };

  const isStale = summary && getCachedHash() !== plantsHash;

  if (plants.length === 0) {
    return null; // Don't show anything when there are no plants
  }

  // Get score style classes
  const getScoreColor = (score: number) => {
    if (score >= 90) return { text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' };
    if (score >= 75) return { text: 'text-[#4A6741]', bg: 'bg-[#F7F9F5] border-[#DCE4DB]' };
    return { text: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' };
  };

  const scoreStyle = summary ? getScoreColor(summary.healthScore) : { text: 'text-[#6B7B6A]', bg: 'bg-stone-50 border-stone-100' };

  return (
    <div
      id="ai-garden-summary-module"
      className="bento-tile bg-white border border-[#E0E7DE] p-6 rounded-[32px] shadow-sm relative overflow-hidden transition-all duration-300"
    >
      {/* Upper Subtle Leaf Background Glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-50/40 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header and Controls */}
      <div className="flex items-center justify-between border-b border-[#E0E7DE] pb-4 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
            <Sparkles className="h-4.5 w-4.5 text-[#4A6741] animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-[#A1ACA0] font-black uppercase tracking-wider block">Garden Dashboard</span>
            <h3 className="text-sm sm:text-base font-black text-[#3A4D39] font-display">AI 今日花园综合诊断</h3>
          </div>
        </div>

        {apiAvailable !== false && (
          <div className="flex items-center gap-2">
            {isStale && !loading && (
              <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-bold animate-pulse">
                数据已更新
              </span>
            )}
            <button
              onClick={fetchSummary}
              disabled={loading}
              className={`p-2 rounded-xl border border-[#DCE4DB] hover:bg-[#F7F9F5] text-[#4A6741] transition-all flex items-center gap-1.5 text-xs font-bold disabled:opacity-50 cursor-pointer`}
              title="重新诊断诊断生成最新花园摘要"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">重新诊断</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Board */}
      {loading && !summary ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="relative flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-[#4A6741] animate-spin" />
            <Sparkles className="h-4 w-4 text-emerald-600 absolute animate-ping" />
          </div>
          <div>
            <p className="text-xs text-[#3A4D39] font-black">正在调配 Gemini 园艺主管对您的绿植会诊...</p>
            <p className="text-[10px] text-[#A1ACA0] mt-1">计算水土配比、肥料吸收和预防性驱虫排期数据中</p>
          </div>
        </div>
      ) : error && !summary ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-rose-800">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-black">诊断失败</p>
            <p className="text-[10px] mt-1 text-rose-700/90 leading-relaxed">{error}</p>
            {apiAvailable === false ? (
              <p className="text-[10px] mt-1.5 text-stone-500 font-medium">请在上方配置您的 API 密钥以解除离线模式限制。</p>
            ) : (
              <button
                onClick={fetchSummary}
                className="mt-2 text-[10px] font-bold underline text-[#4A6741] hover:text-[#3A4D39]"
              >
                重试一下
              </button>
            )}
          </div>
        </div>
      ) : summary ? (
        <div className="space-y-5">
          {/* Summary Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            {/* Health Rating Block (3 cols) */}
            <div className={`md:col-span-4 rounded-2xl border p-4 flex flex-col items-center justify-center text-center ${scoreStyle.bg} transition-all`}>
              <span className="text-[10px] text-[#A1ACA0] font-black uppercase tracking-wider">Garden Rating</span>
              
              <div className="my-3 relative flex items-center justify-center">
                {/* Score Big Circle Inner Badge */}
                <span className={`text-4xl font-extrabold font-mono tracking-tight ${scoreStyle.text}`}>
                  {summary.healthScore}
                </span>
                <span className="text-xs font-bold text-stone-400 self-end mb-1 ml-0.5">/100</span>
              </div>

              <div className="flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded-full border border-[#DCE4DB]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#4A6741]" />
                <span className="text-[11px] font-black text-[#3A4D39] truncate max-w-[120px]">{summary.healthGrade}</span>
              </div>
            </div>

            {/* AI Summary Texts block (8 cols) */}
            <div className="md:col-span-8 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] text-[#A1ACA0] font-black uppercase tracking-wider">Botanist Summary</span>
                <p className="text-xs text-[#4A5549] font-medium leading-relaxed">
                  {summary.summary}
                </p>
              </div>

              <div className="p-3 bg-[#F7F9F5] border border-[#E0E7DE] rounded-xl flex items-start gap-2.5">
                <span className="text-sm shrink-0">💡</span>
                <div>
                  <span className="text-[10px] text-[#4A6741] font-black uppercase block">今日最佳行动</span>
                  <p className="text-xs text-[#3A4D39] font-black mt-0.5">{summary.dailyAdvice}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attention Checklist if any */}
          {summary.attentionPlants && summary.attentionPlants.length > 0 && (
            <div className="pt-3 border-t border-[#E0E7DE] space-y-2.5">
              <span className="text-[10px] text-[#A1ACA0] font-black uppercase tracking-wider block">
                🚨 需重点留意对象
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {summary.attentionPlants.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-gradient-to-r from-amber-50/50 to-white hover:from-amber-50 border border-amber-100/70 hover:border-amber-100 rounded-2xl flex gap-2.5 items-start transition-all"
                  >
                    <span className="text-xs text-amber-600 font-extrabold shrink-0 mt-0.5">
                      {idx === 0 ? '❶' : '❷'}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-[#3A4D39]">{item.plantName}</h4>
                      <p className="text-[11px] text-[#6B7B6A] font-semibold leading-relaxed mt-1">
                        {item.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Unconfigured display */
        <div className="p-4 rounded-2xl bg-[#F7F9F5] border border-[#E0E7DE] text-center py-8">
          <span className="text-2xl block mb-2">🌿</span>
          <p className="text-xs font-black text-[#3A4D39]">AI 自动诊断已经连接</p>
          <p className="text-[10px] text-[#6B7B6A] mt-1 max-w-sm mx-auto leading-relaxed">
            请点击【重新诊断】或设置 API Key，系统将智能提取您的小温室里所有绿色生物的状态、摆放位置以及计划排期，生成实时花园每日大纲。
          </p>
          {apiAvailable !== false && (
            <button
              onClick={fetchSummary}
              className="mt-4 px-4.5 py-2 bg-[#3A4D39] hover:bg-[#4A6741] text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer"
            >
              立刻诊断
            </button>
          )}
        </div>
      )}
    </div>
  );
}
