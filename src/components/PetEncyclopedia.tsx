import { useState } from 'react';
import { Search, Sparkles, HelpCircle, ShieldAlert, Heart, ShieldCheck, Loader2 } from 'lucide-react';
import { getCustomApiHeaders } from '../utils/customApi';

// Standardized pet safety encyclopedia dictionary entries
const ENCYCLOPEDIA_PLANTS = [
  { name: '龟背竹 (Monstera)', species: 'Monstera deliciosa', status: 'toxic', hazard: '中等毒性', notes: '不溶性草酸钙结晶。猫狗咀嚼叶片会导致口部刺痛、黏膜严重水肿、流口水和吞咽困难。', tips: '应搁置于宠物触碰不到的高架或使用栏栅隔离。' },
  { name: '绿萝 (Pothos)', species: 'Epipremnum aureum', status: 'toxic', hazard: '中等毒性', notes: '含有草酸钙结晶。摄入会导致强烈的咽喉灼烧感、呕吐以及口腔周围红肿发刺激。', tips: '绿萝藤蔓垂吊极易招致猫咪扑咬，建议高挂并在周围喷洒橙皮气味剂。' },
  { name: '琴叶榕 (Fiddle-Leaf Fig)', species: 'Ficus lyrata', status: 'toxic', hazard: '低等毒性', notes: '茎叶内流淌的白色刺激性乳状汁液。宠物接触皮肤可引发过敏或过敏性皮炎，误食引发剧烈呕吐呕吐。', tips: '修剪产生切口时应立即清理溢出的乳汁，防止宠物好奇舔舐。' },
  { name: '白掌/一帆风顺 (Peace Lily)', species: 'Spathiphyllum', status: 'toxic', hazard: '中等毒性', notes: '草酸钙结晶。虽然名为“百合（Lily）”，但防毒机理属于天南星科，摄入引起强烈口腔烧灼和胃黏膜充血。', tips: '请注意，此花不属于极具致命肾衰毒性的“真百合属（Lilium）”，但仍需绝对隔离。' },
  { name: '富贵竹 (Lucky Bamboo)', species: 'Dracaena sanderiana', status: 'toxic', hazard: '中等毒性', notes: '含有刺鼻皂苷物质。宠物咬食出现流涎、呕吐（偶发性带血）、食欲不振及瞳孔放大等神经性反应。', tips: '富贵竹一般瓶插水培，注意严禁猫狗偷喝瓶中滋生的洗叶富贵竹死水。' },
  { name: '虎尾兰/虎皮兰 (Snake Plant)', species: 'Sansevieria trifasciata', status: 'toxic', hazard: '低至中等', notes: '富含皂苷。有轻微到中等程度毒性，误食会促发宠物胃肠功能紊乱、流口水、呕吐和下痢。', tips: '虎尾兰材质粗硬坚挺，虽然它有轻微毒性，但其蜡质硬叶一般不太吸引猫咪啃食。' },
  { name: '常春藤 (English Ivy)', species: 'Hedera helix', status: 'toxic', hazard: '高毒性', notes: '常春藤皂苷。叶子相比浆果更具毒性，误食可能导致流口水、呕吐、严重腹泻、呼吸表浅和腹痛。', tips: '藤本攀爬绿植。如果在家中露台攀爬，需安装尼龙网围挡防止宠物乱扒乱咬。' },
  { name: '发财树 (Money Tree)', species: 'Pachira aquatica', status: 'safe', hazard: '安全无毒', notes: '发财树对猫咪、狗狗和马匹完全无毒友好。其粗壮的树干非常适合宠物家庭，完全没有毒性威胁。', tips: '极为皮实，虽然对宠物安全，但仍要小心幼猫将纤维化树皮当作猫抓板啃啃，可在树干包覆麻绳。' },
  { name: '景天属多肉 (Sedum Succulents)', species: 'Sedum / Echeveria', status: 'safe', hazard: '安全无毒', notes: '绝大多数景天科、拟石莲属等常见家用多肉对猫犬等家宠安全无害，即使贪玩咬碎叶瓣也无毒理大碍。', tips: '叶片肥厚易掉落，极易成为猫咪爪下玩具，应摆在平稳窗台，防跌落打碎。' },
  { name: '茉莉花 (Jasmine)', species: 'Jasminum officinale', status: 'safe', hazard: '安全无毒', notes: '素馨属真正茉莉对猫狗而言为100%环境无毒，香气怡人温和，可净化空气且不对呼吸道构成损害。', tips: '注意：必须要避开名为“夜来香/黄素馨/卡罗莱纳茉莉”的伪假茉莉，假茉莉通常剧毒致命。' },
  { name: '蝴蝶兰 (Moth Orchid)', species: 'Phalaenopsis', status: 'safe', hazard: '安全无毒', notes: '蝴蝶兰兰花对宠物极度安全。其无粉香尘、无剧毒汁液对挑剔淘气的猫和爱犬没有任何负面影响。', tips: '名贵高雅，请将其放在平稳不易倾倒的高重花托上，防止被宠物跳跃碰倒。' },
  { name: '吊兰 (Spider Plant)', species: 'Chlorophytum comosum', status: 'safe', hazard: '安全无毒', notes: '全株对家宠均安全。此外，吊兰具有轻微的拟猫草催吐、镇静排毛球幻觉作用，猫咪极其喜欢在其叶尖磨蹭。', tips: '由于其叶条形似丝线，猫咪常忍不住扑咬，不用过度担心，可以让它作为天然磨牙叶片。' },
  { name: '散尾葵/黄椰子 (Areca Palm)', species: 'Dypsis lutescens', status: 'safe', hazard: '安全无毒', notes: '被ASPCA美国防止虐待动物协会及兽医学会公认对猫狗友好。是理想的大型超高空气净化室内羽叶植物。', tips: '枝繁叶茂，很受爱躲猫猫的猫咪和在树荫下打盹的小狗喜欢，是顶奢宠物友好客厅的首选。' }
];

// Helper of AI report response data format
interface AIReport {
  plantName: string;
  scientificName: string;
  safeStatus: 'safe' | 'toxic' | 'unknown';
  chineseStatus: string;
  hazardLevel: string;
  toxicityNotes: string;
  firstAidTips: string;
}

export default function PetEncyclopedia() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'safe' | 'toxic'>('all');
  
  // AI Consult state
  const [aiInputName, setAiInputName] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState<AIReport | null>(null);

  const filteredLocal = ENCYCLOPEDIA_PLANTS.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilter === 'safe') return matchesSearch && p.status === 'safe';
    if (activeFilter === 'toxic') return matchesSearch && p.status === 'toxic';
    return matchesSearch;
  });

  const handleAiConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInputName.trim()) return;

    setAiLoading(true);
    setAiError('');
    setAiResult(null);

    try {
      const response = await fetch('/api/gemini/pet-safety-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCustomApiHeaders()
        },
        body: JSON.stringify({ plantName: aiInputName.trim() }),
      });

      if (!response.ok) {
        throw new Error('AI 家医联网诊断通道遭遇短时波动，请确认主面板 Secrets 中是否已绑定 GEMINI_API_KEY。');
      }

      const data: AIReport = await response.json();
      setAiResult(data);
    } catch (err: any) {
      setAiError(err.message || '诊断失败，请确保大模型 API 状态正常并再次尝试。');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#2D3436]">
      {/* Intro Banner */}
      <div className="p-6 bg-gradient-to-r from-[#3A4D39] to-[#4A6741] text-white rounded-[32px] shadow-sm relative overflow-hidden">
        <div className="absolute right-[-20px] top-[-20px] opacity-10 text-[100px]">🐱🐶</div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase text-emerald-100">
            <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />
            <span>安全至上，毛孩子友好空间</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight">
            宠物宜忌花卉大百科 (Pet Plant Glossary)
          </h2>
          <p className="text-xs text-stone-200/90 leading-relaxed max-w-xl">
            科学研究指明，超过700种常见观赏花木中，其叶片、汁液或根茎含有草酸钙、皂苷等猫狗代谢物不可降解毒素。
            在这里，我们为您提供专业的本地物种库与AI在线急诊服务。
          </p>
        </div>
      </div>

      {/* Grid: 2-Column (Left: Interactive Glossary, Right: AI Real-Time Consult) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Section (2/3 cols): Encyclopedia Directory */}
        <div className="xl:col-span-2 space-y-5 bento-tile bg-white p-6 border-[#E0E7DE] flex flex-col justify-between">
          <div className="space-y-4">
            {/* Filter and search bar header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0F4EF] pb-4">
              <div>
                <h3 className="text-sm font-black text-[#3A4D39]">百科词条检索目录</h3>
                <p className="text-[10px] text-[#6B7B6A]">涵盖客厅、阳台最瞩目的13种网红盆栽安全性说明</p>
              </div>

              {/* Filtering triggers */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`text-[10px] px-3 py-2 rounded-xl border transition-all ${
                    activeFilter === 'all'
                      ? 'bg-[#3A4D39] border-[#3A4D39] text-white font-black'
                      : 'bg-white border-[#E0E7DE] text-[#6B7B6A] hover:bg-[#F0F4EF]'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setActiveFilter('safe')}
                  className={`text-[10px] px-3 py-2 rounded-xl border transition-all flex items-center gap-0.5 ${
                    activeFilter === 'safe'
                      ? 'bg-emerald-700 border-emerald-700 text-white font-black'
                      : 'bg-white border-[#E0E7DE] text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  🟢 宠物安全
                </button>
                <button
                  onClick={() => setActiveFilter('toxic')}
                  className={`text-[10px] px-3 py-2 rounded-xl border transition-all flex items-center gap-0.5 ${
                    activeFilter === 'toxic'
                      ? 'bg-amber-600 border-amber-600 text-white font-black'
                      : 'bg-white border-[#E0E7DE] text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  ⚠️ 避坑隔离
                </button>
              </div>
            </div>

            {/* Local Search input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7B6A]" />
              <input
                type="text"
                placeholder="搜索植物名称、科属定义或毒理反应关键词（例如“绿萝”、“草酸”...）"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F9F5] border border-[#E0E7DE] text-xs rounded-2xl focus:outline-none focus:bg-white focus:border-[#4A6741] transition-all font-semibold"
              />
            </div>

            {/* Encyclopedia directory list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto scrollbar-thin pr-1 pb-2">
              {filteredLocal.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                    item.status === 'safe'
                      ? 'bg-[#F2FAF2]/70 border-emerald-100 hover:bg-[#F2FAF2]'
                      : 'bg-[#FCFAF8]/70 border-amber-100 hover:bg-[#FCFAF8]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <h4 className="text-xs font-black text-[#3A4D39]">{item.name}</h4>
                      <p className="text-[9.5px]/tight font-mono text-[#6B7B6A] select-all italic mt-0.5">{item.species}</p>
                    </div>
                    <span className={`text-[10px] shrink-0 font-extrabold px-2.5 py-1 rounded-lg border shadow-3xs ${
                      item.status === 'safe'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {item.status === 'safe' ? '🟢 友好无毒' : `⚠️ ${item.hazard}`}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#555] leading-relaxed mb-3">
                    <span className="font-extrabold text-[#3A4D39]">病理机制: </span>{item.notes}
                  </p>
                  <p className="text-[10px] text-[#6B7B6A] leading-relaxed bg-white/60 p-2.5 rounded-xl border border-dashed border-[#E0E7DE] font-semibold flex items-start gap-1">
                    <span role="img" aria-label="lightbulb" className="shrink-0 text-xs">💡</span>
                    <span>{item.tips}</span>
                  </p>
                </div>
              ))}

              {filteredLocal.length === 0 && (
                <div className="col-span-full py-12 text-center text-[#6B7B6A] text-xs">
                  <span>没有在词条库中检索到匹配植物。您可以在右侧【AI 联网深度诊断】工具中输入任何物种，由人工智能向导即时判定。</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section (1/3 cols): Gemni API Realtime Pet Consult Specialist */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bento-tile bg-white p-6 border-[#E0E7DE] space-y-4">
            <div className="flex items-center gap-1.5 border-b border-[#F0F4EF] pb-3.5">
              <div className="bg-[#3A4D39] p-1.5 rounded-xl text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-[#3A4D39] uppercase">AI 联网避雷深度诊断</h3>
                <p className="text-[10px] text-[#6B7B6A]">支持冷门花木和野草的实时动物毒性分析解答</p>
              </div>
            </div>

            <form onSubmit={handleAiConsult} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-black text-[#3A4D39] mb-1.5">
                  输入想要评估的绿植/花草名字
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="如：马蹄莲、杜鹃花、变叶木、百合..."
                    value={aiInputName}
                    onChange={(e) => setAiInputName(e.target.value)}
                    className="flex-1 min-w-0 bg-[#F7F9F5] border border-[#E0E7DE] px-3 py-2 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-[#4A6741] text-[#2D3436] transition-all font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !aiInputName.trim()}
                    className="px-4 bg-[#3A4D39] hover:bg-[#4A6741] text-white text-[11px] font-black rounded-xl transition-colors disabled:opacity-45 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                  >
                    {aiLoading ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>研判中</span>
                      </span>
                    ) : '专家问诊'}
                  </button>
                </div>
              </div>
            </form>

            {/* Error panel */}
            {aiError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[10px] text-red-700 leading-relaxed font-semibold">
                ⚠️ {aiError}
              </div>
            )}

            {/* Diagnostic Report Panel */}
            {aiResult ? (
              <div className="p-4 bg-stone-50 border border-[#DCE4DB] rounded-2xl space-y-4 animate-fade-in">
                <div className="flex justify-between items-start border-b border-[#E0E7DE] pb-2.5">
                  <div>
                    <h4 className="text-xs font-black text-[#3A4D39]">{aiResult.plantName}</h4>
                    <p className="text-[9px] font-mono text-[#6B7B6A] italic">{aiResult.scientificName}</p>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border shadow-3xs ${
                    aiResult.safeStatus === 'safe'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {aiResult.chineseStatus}
                  </span>
                </div>

                <div className="space-y-3 test-xs">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#3A4D39] block mb-0.5">⚠️ 伤害级别评估:</span>
                    <span className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-md inline-block ${
                      aiResult.safeStatus === 'safe' ? 'bg-emerald-100/50 text-emerald-800' : 'bg-red-100/50 text-red-800 animate-pulse'
                    }`}>
                      {aiResult.hazardLevel}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-[#3A4D39] block mb-0.5">🧬 毒理机制与症状表现:</span>
                    <p className="text-[10.5px] text-[#555] leading-relaxed bg-white p-2.5 rounded-xl border border-[#F0F4EF] font-medium">
                      {aiResult.toxicityNotes}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-[#3A4D39] block mb-0.5 font-display flex items-center gap-1 text-[#3A4D39]">
                      🚑 兽医第一急救/安全养护贴士:
                    </span>
                    <p className="text-[10.5px] text-[#4A6741] leading-relaxed bg-[#EBF3E8] p-2.5 rounded-xl border border-emerald-200/60 font-semibold">
                      {aiResult.firstAidTips}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              !aiLoading && (
                <div className="py-8 text-center text-stone-400 border border-dashed border-[#F0F4EF] rounded-2xl flex flex-col items-center justify-center gap-2 p-4">
                  <HelpCircle className="h-6 w-6 text-stone-300" />
                  <span className="text-[10px] leading-relaxed text-[#6B7B6A]">
                    输入花卉名称开始在线诊断。您也将收到由 Gemini 专属多模态医生内核出具的【防毒症状报告】与【兽医洗胃/急救说明】。
                  </span>
                </div>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
