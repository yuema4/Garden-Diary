import { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, Send, Leaf, HelpCircle, Loader2, RefreshCw } from 'lucide-react';
import { Plant } from '../types';
import { getCustomApiHeaders } from '../utils/customApi';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface PlantDoctorProps {
  plants: Plant[];
  selectedContextPlant: Plant | null;
  onClearContextPlant: () => void;
  onSelectContextPlant: (plant: Plant | null) => void;
}

export default function PlantDoctor({
  plants,
  selectedContextPlant,
  onClearContextPlant,
  onSelectContextPlant,
}: PlantDoctorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: '你好！我是你的专属 AI 植物医生。我可以帮你诊断花枯叶黄、黑腐干瘪、各种病虫害等问题。\n\n**您可以直接向我提问，或者在上方下拉框选择您的某一株盆栽，我将针对它的摆放位置和护理日期为您进行专属病因诊断！**',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (messageText = inputMessage) => {
    if (!messageText.trim() || loading) return;

    setError('');
    const userMessage = messageText.trim();
    setInputMessage('');
    
    // Add user message to state
    const newMessages = [...messages, { role: 'user' as const, text: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCustomApiHeaders()
        },
        body: JSON.stringify({
          message: userMessage,
          history: newMessages.slice(1, -1), // skip first model greeting & current query
          plantInfo: selectedContextPlant
            ? {
                name: selectedContextPlant.name,
                species: selectedContextPlant.species,
                location: selectedContextPlant.location,
                waterInterval: selectedContextPlant.waterInterval,
                fertilizeInterval: selectedContextPlant.fertilizeInterval,
                pestInterval: selectedContextPlant.pestInterval,
                healthStatus: selectedContextPlant.healthStatus,
                notes: selectedContextPlant.notes,
              }
            : null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || '植物医生问诊服务器似乎有些拥挤，请检测自备 API Key 与代理端点是否正确。');
      }

      const data = await response.json();
      setMessages([...newMessages, { role: 'model', text: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '问诊失败，请检查您的网络与 API key。');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question: string, displayLabel: string) => {
    const prependContext = selectedContextPlant 
      ? `针对我的这棵【${selectedContextPlant.name}】：` 
      : '';
    handleSend(`${prependContext}${question}`);
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'model',
        text: '聊天历史已重置。请问对于哪些花草盆栽，有需要我帮忙诊断并提供浇水/施肥/配药治虫方案的吗？',
      },
    ]);
    setError('');
  };

  return (
    <div
      id="botanical-ai-doctor-chat"
      className="bento-tile p-6 flex flex-col h-[580px] border-[#E0E7DE]"
    >
      {/* Header and Context selector */}
      <div className="pb-4 border-b border-[#E0E7DE] shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[#3A4D39] flex items-center gap-1.5 font-display">
            <Sparkles className="h-4 w-4 text-[#4A6741] animate-pulse" />
            <span>AI 植物医生问诊台</span>
          </h2>
          <button
            onClick={clearChat}
            className="text-[11px] text-[#6B7B6A] hover:text-[#3A4D39] flex items-center gap-1 font-extrabold transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            重置诊断
          </button>
        </div>
        <p className="text-xs text-[#6B7B6A] mt-1">加载绿植信息，一键为您问诊叶斑、虫蛀、水害</p>

        {/* Dynamic Context Selector */}
        <div className="mt-4 grid grid-cols-1 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#6B7B6A] font-bold shrink-0">会诊盆栽:</span>
            <select
              value={selectedContextPlant ? selectedContextPlant.id : ''}
              onChange={(e) => {
                const id = e.target.value;
                const found = plants.find((p) => p.id === id);
                onSelectContextPlant(found || null);
              }}
              className="grow text-xs bg-[#F0F4EF] hover:bg-[#DCE4DB] transition-all text-[#3A4D39] font-black border border-[#E0E7DE] px-3 py-2 rounded-2xl cursor-pointer focus:outline-none"
            >
              <option value="">-- 全局通用咨询 (无特定植物) --</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  🪴 {p.name} - 养在 {p.location}
                </option>
              ))}
            </select>
          </div>
          
          {selectedContextPlant && (
            <div className="text-[10px] bg-[#F0F4EF] text-[#4A6741] border border-[#DCE4DB] rounded-2xl p-3 flex justify-between items-center animate-fade-in mt-1 font-semibold">
              <span>
                <strong>正在会诊:</strong> 自动附带该 <strong>{selectedContextPlant.name}</strong> 的养护参数：{selectedContextPlant.waterInterval}天周期。
              </span>
              <button
                onClick={onClearContextPlant}
                className="text-[#4A6741] font-extrabold px-1.5 hover:bg-[#E0E7DE] rounded-md text-[11px]"
              >
                清除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Content */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4 scrollbar-thin">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] text-xs rounded-2xl p-3.5 shadow-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#3A4D39] text-[#F7F9F5] font-medium rounded-tr-none'
                  : 'bg-[#F4F7F3] text-[#2C3A2B] border border-[#DCE4DB] rounded-tl-none whitespace-pre-wrap font-semibold'
              }`}
            >
              {msg.role === 'model' ? (
                // Simplistic markdown-like highlight parser
                msg.text.split('\n').map((line, lIdx) => {
                  let formatted = line;
                  const parts = [];
                  let lastIndex = 0;
                  
                  // Match **term** and style as bolder elements
                  const customBoldRegex = /\*\*(.*?)\*\*/g;
                  let match;
                  while ((match = customBoldRegex.exec(formatted)) !== null) {
                    if (match.index > lastIndex) {
                      parts.push(formatted.substring(lastIndex, match.index));
                    }
                    parts.push(
                      <strong key={match.index} className="text-[#3A4D39] font-black bg-[#E0E7DE]/60 px-1 py-0.5 rounded border border-[#DCE4DB]/70">
                        {match[1]}
                      </strong>
                    );
                    lastIndex = customBoldRegex.lastIndex;
                  }
                  if (lastIndex < formatted.length) {
                    parts.push(formatted.substring(lastIndex));
                  }

                  return (
                    <p key={lIdx} className={line.trim() === '' ? 'h-2' : 'my-1'}>
                      {parts.length > 0 ? parts : line}
                    </p>
                  );
                })
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#F0F4EF] border border-[#E0E7DE] text-[#4A6741] rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2 text-xs font-bold">
              <Loader2 className="h-4 w-4 animate-spin text-[#4A6741]" />
              <span>植物医生正在严谨出诊和配药，请稍候...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-[11px] text-center">
            {error}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested chips based on context */}
      <div className="py-2.5 flex flex-wrap gap-1.5 shrink-0 select-none border-t border-[#E0E7DE]">
        <button
          onClick={() => handleQuickQuestion('叶子发黄、干瘪干枯，最可能是什么原因？如何对症紧急救治？', '发黄救治')}
          className="text-[10px] bg-[#F4F7F3] hover:bg-[#E0E7DE] text-[#4A6741] font-extrabold border border-[#DCE4DB] px-3 py-1.5 rounded-full text-left transition-colors truncate max-w-[155px]"
          title="叶子发黄原因"
        >
          🍂 黄叶烂叶救治
        </button>
        <button
          onClick={() => handleQuickQuestion('植物上发现小白飞虫、红蜘蛛或土里开始飞小黑飞，应该怎么安全对症配药治虫？', '消灭小黑飞')}
          className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold border border-amber-200 px-3 py-1.5 rounded-full text-left transition-colors truncate max-w-[155px]"
          title="病虫害防除"
        >
          🐛 驱虫除病除黑
        </button>
        <button
          onClick={() => handleQuickQuestion('如何评估并设置合理的浇水和施肥规律？针对我的摆放位置有哪些环境通风提议？', '避免烧根')}
          className="text-[10px] bg-sky-50 hover:bg-sky-100 text-sky-700 font-extrabold border border-sky-200 px-3 py-1.5 rounded-full text-left transition-colors truncate max-w-[155px]"
          title="新手配肥规律"
        >
          🧪 配施肥防烧根
        </button>
      </div>

      {/* Input Message panel */}
      <div className="mt-2 flex gap-2 shrink-0">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={selectedContextPlant ? `向医生问诊这健康度需提升的 ${selectedContextPlant.name}...` : "输入发黄烂叶、黑腐救助、如何稀释营养液..."}
          className="grow text-xs bg-white border border-[#E0E7DE] px-4 py-3 rounded-2xl focus:outline-none focus:border-[#3A4D39] transition-all text-[#2D3436]"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !inputMessage.trim()}
          className="px-4 py-3 bg-[#3A4D39] hover:bg-[#4A6741] disabled:opacity-40 transition-all text-white rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
