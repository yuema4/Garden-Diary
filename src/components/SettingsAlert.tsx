import { useEffect, useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Key, HelpCircle, Loader2 } from 'lucide-react';
import { getCustomApiConfig, saveCustomApiConfig, getCustomApiHeaders } from '../utils/customApi';

export default function SettingsAlert() {
  const [apiKeyAvailable, setApiKeyAvailable] = useState<boolean | null>(null);
  const [customActive, setCustomActive] = useState<boolean>(false);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [apiKey, setApiKey] = useState('');
  const [apiBase, setApiBase] = useState('');
  const [apiModel, setApiModel] = useState('');
  const [useAlternate, setUseAlternate] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Connection testing states
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const fillTemplate = (provider: string) => {
    switch (provider) {
      case 'deepseek':
        setApiBase('https://api.deepseek.com/v1');
        setApiModel('deepseek-chat');
        break;
      case 'siliconflow-v3':
        setApiBase('https://api.siliconflow.cn/v1');
        setApiModel('deepseek-ai/DeepSeek-V3');
        break;
      case 'siliconflow-r1':
        setApiBase('https://api.siliconflow.cn/v1');
        setApiModel('deepseek-ai/DeepSeek-R1');
        break;
      case 'openai':
        setApiBase('https://api.openai.com/v1');
        setApiModel('gpt-4o-mini');
        break;
      case 'kimi':
        setApiBase('https://api.moonshot.cn/v1');
        setApiModel('moonshot-v1-8k');
        break;
      default:
        break;
    }
    setUseAlternate(true);
  };

  const checkStatus = () => {
    fetch('/api/gemini/status', {
      headers: getCustomApiHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        setApiKeyAvailable(data.available);
        setCustomActive(data.customActive);
      })
      .catch((err) => {
        console.error('Failed to check API status:', err);
        setApiKeyAvailable(false);
        setCustomActive(false);
      });
  };

  useEffect(() => {
    // Load config on mount
    const config = getCustomApiConfig();
    setApiKey(config.apiKey);
    setApiBase(config.apiBase);
    setApiModel(config.apiModel);
    setUseAlternate(config.useAlternate);

    checkStatus();
  }, []);

  const handleTestConnection = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setTestLoading(true);
    setTestResult(null);
    setTestError(null);
    try {
      const response = await fetch('/api/gemini/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getCustomApiHeaders()
        }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || '测试返回异常，请核对您的 API Key 是否配置且确实可供此大模型使用。');
      }
      setTestResult(data.reply);
    } catch (err: any) {
      console.error(err);
      setTestError(err.message || '大模型连通测试遇到网络或密钥授权异常。');
    } finally {
      setTestLoading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomApiConfig({
      apiKey,
      apiBase,
      apiModel,
      useAlternate,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    checkStatus();
    // Refresh to force other components using API to immediately notice
    window.location.reload();
  };

  if (apiKeyAvailable === null) {
    return (
      <div className="animate-pulse bg-white border border-[#E0E7DE] rounded-[24px] p-4 flex justify-between items-center text-xs text-[#6B7B6A] shadow-xs">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-[#F0F4EF] rounded-full"></div>
          <span>正在检测 AI 智能模块配置环境...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      id="settings-container-block"
      className="space-y-3"
    >
      <div
        id="settings-alert-banner"
        className={`rounded-[24px] border p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 transition-all duration-300 shadow-xs ${
          apiKeyAvailable
            ? 'bg-[#E9F0E6] border-[#DCE4DB] text-[#2D3436]'
            : 'bg-white border-[#E0E7DE] text-[#2D3436]'
        }`}
      >
        <div className="flex items-start gap-3">
          {apiKeyAvailable ? (
            <div className="p-1.5 bg-white rounded-xl border border-[#DCE4DB] shrink-0">
              <Sparkles className="h-4 w-4 text-[#4A6741]" />
            </div>
          ) : (
            <div className="p-1.5 bg-amber-50 rounded-xl border border-amber-100 shrink-0">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
          )}
          <div>
            <h4 className="font-extrabold text-sm flex items-center gap-1.5 text-[#3A4D39]">
              {customActive ? '已连接第三方自定义 API (OpenAI/DeepSeek...)' : apiKeyAvailable ? 'Gemini AI 园艺专家就绪' : '发现 Gemini API 未连接'}
            </h4>
            <p className="text-xs text-[#6B7B6A] mt-1 leading-relaxed">
              {customActive
                ? `您已开启自定义模型接口 (${apiModel || '默认'})，花园诊断与常青医生将由自配置模型驱动。`
                : apiKeyAvailable
                ? '您的小花园已完美对接 Google Gemini！支持一键精准诊断，精准科学分析植物施肥浇水阶段参数。'
                : '默认正采用离线预设模式。谷歌API无服务？若您拥有其他的 AI 密钥，点击下方齿轮可以自助填入其他厂商密钥。'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3.5 py-1.5 bg-white hover:bg-[#F7F9F5] text-[#3A4D39] border border-[#DCE4DB] text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <span>⚙️ 第三方密钥接入</span>
            {showForm ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {customActive ? (
            <span className="shrink-0 text-[10px] px-2.5 py-1 bg-[#3A4D39] text-white font-black rounded-full shadow-sm flex items-center gap-1 uppercase">
              <CheckCircle2 className="h-3 w-3 text-emerald-300" />
              自定义LLM启用
            </span>
          ) : apiKeyAvailable ? (
            <span className="shrink-0 text-[10px] px-2.5 py-1 bg-emerald-700 text-white font-black rounded-full shadow-sm flex items-center gap-1 uppercase">
              <CheckCircle2 className="h-3 w-3 text-emerald-100" />
              Gemini就绪
            </span>
          ) : (
            <span className="shrink-0 text-[10px] px-2.5 py-1 bg-[#F0F4EF] text-[#4A6741] font-black rounded-full border border-[#DCE4DB] flex items-center gap-1.5 uppercase">
              离线模式
            </span>
          )}
        </div>
      </div>

      {/* Expandable Configuration Form */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-[#E0E7DE] rounded-[24px] p-5 shadow-sm space-y-4 animate-scale-up"
        >
          <div className="flex items-center gap-2 border-b border-[#F0F4EF] pb-2.5">
            <Key className="h-4.5 w-4.5 text-[#4A6741]" />
            <h5 className="text-xs font-black text-[#3A4D39]">接入其他 AI 密钥 (兼容 OpenAI / DeepSeek / 阿里 / 百度各种 API)</h5>
          </div>

          <div className="bg-[#F7F9F5] border border-[#E0E7DE] p-3.5 rounded-2xl">
            <span className="text-[10px] text-[#6B7B6A] font-black uppercase tracking-wider block mb-2">💡 快捷一键配置模版 (自动填写代理端点 Base URL 和项目模型代号)</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillTemplate('deepseek')}
                className="text-[11px] font-bold px-3 py-2 bg-white hover:border-[#3A4D39] hover:bg-[#F2F6F1] text-[#3A4D39] border border-[#DCE4DB] rounded-xl transition-all cursor-pointer"
              >
                🔵 DeepSeek 官方
              </button>
              <button
                type="button"
                onClick={() => fillTemplate('siliconflow-v3')}
                className="text-[11px] font-bold px-3 py-2 bg-white hover:border-[#3A4D39] hover:bg-[#F2F6F1] text-[#3A4D39] border border-[#DCE4DB] rounded-xl transition-all cursor-pointer"
              >
                ⚡ 硅基流动 DeepSeek V3
              </button>
              <button
                type="button"
                onClick={() => fillTemplate('siliconflow-r1')}
                className="text-[11px] font-bold px-3 py-2 bg-white hover:border-[#3A4D39] hover:bg-[#F2F6F1] text-[#3A4D39] border border-[#DCE4DB] rounded-xl transition-all cursor-pointer"
              >
                🧠 硅基流动 R1 深度推导
              </button>
              <button
                type="button"
                onClick={() => fillTemplate('openai')}
                className="text-[11px] font-bold px-3 py-2 bg-white hover:border-[#3A4D39] hover:bg-[#F2F6F1] text-[#3A4D39] border border-[#DCE4DB] rounded-xl transition-all cursor-pointer"
              >
                💚 OpenAI gpt-4o-mini
              </button>
              <button
                type="button"
                onClick={() => fillTemplate('kimi')}
                className="text-[11px] font-bold px-3 py-2 bg-white hover:border-[#3A4D39] hover:bg-[#F2F6F1] text-[#3A4D39] border border-[#DCE4DB] rounded-xl transition-all cursor-pointer"
              >
                🌙 Kimi 官方
              </button>
            </div>
            <p className="text-[10px] text-[#6B7B6A]/80 mt-2 font-medium">配置模版后，您只需要在下方填入该厂商对应的 API Key & 勾选激活并保存，即可无缝全局代替谷歌官方 AI 服务。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-[#6B7B6A] mb-1.5">
                API Key *
              </label>
              <input
                type="password"
                required={useAlternate}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="请输入您的 API Key (SK-... 或其它)"
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#DCE4DB] focus:outline-hidden focus:ring-1 focus:ring-[#4A6741] placeholder-[#A1ACA0]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-[#6B7B6A] mb-1.5 flex items-center gap-1">
                API Base URL (自定义代理端点)
                <span className="text-[10px] text-[#A1ACA0] font-medium" title="不填默认使用 OpenAI">可选</span>
              </label>
              <input
                type="text"
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                placeholder="例如: https://api.deepseek.com/v1"
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#DCE4DB] focus:outline-hidden focus:ring-1 focus:ring-[#4A6741] placeholder-[#A1ACA0]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-[#6B7B6A] mb-1.5 flex items-center gap-1">
                模型自定义代号 (Model Name)
                <span className="text-[10px] text-[#A1ACA0] font-medium" title="不填将根据端点智能猜测">可选</span>
              </label>
              <input
                type="text"
                value={apiModel}
                onChange={(e) => setApiModel(e.target.value)}
                placeholder="例如: deepseek-chat, deepseek-v4-pro, gpt-4o-mini"
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#DCE4DB] focus:outline-hidden focus:ring-1 focus:ring-[#4A6741] placeholder-[#A1ACA0]"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-[#8CA18A] self-center mr-0.5">常用模型一键填入:</span>
                <button
                  type="button"
                  onClick={() => setApiModel('deepseek-v4-pro')}
                  className="text-[10px] font-bold px-2 py-1 bg-[#F4F7F3] hover:bg-[#E9EFE7] border border-[#D1DDD0] rounded-lg text-[#3A4D39] cursor-pointer"
                >
                  deepseek-v4-pro 🔵
                </button>
                <button
                  type="button"
                  onClick={() => setApiModel('deepseek-v4-flash')}
                  className="text-[10px] font-bold px-2 py-1 bg-[#F4F7F3] hover:bg-[#E9EFE7] border border-[#D1DDD0] rounded-lg text-[#3A4D39] cursor-pointer"
                >
                  deepseek-v4-flash ⚡
                </button>
                <button
                  type="button"
                  onClick={() => setApiModel('deepseek-chat')}
                  className="text-[10px] font-bold px-2 py-1 bg-[#F4F7F3] hover:bg-[#E9EFE7] border border-[#D1DDD0] rounded-lg text-[#3A4D39] cursor-pointer"
                >
                  deepseek-chat
                </button>
                <button
                  type="button"
                  onClick={() => setApiModel('gpt-4o-mini')}
                  className="text-[10px] font-bold px-2 py-1 bg-[#F4F7F3] hover:bg-[#E9EFE7] border border-[#D1DDD0] rounded-lg text-[#3A4D39] cursor-pointer"
                >
                  gpt-4o-mini
                </button>
              </div>
            </div>

            <div className="flex items-center h-full pt-1.5 md:pt-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useAlternate}
                  onChange={(e) => setUseAlternate(e.target.checked)}
                  className="rounded-md border-[#DCE4DB] text-[#4A6741] focus:ring-[#4A6741] h-4 w-4"
                />
                <div>
                  <span className="text-xs font-black text-[#3A4D39]">激活该第三方自备大模型</span>
                  <p className="text-[10px] text-[#6B7B6A] mt-0.5">勾选并在保存后，软件全局将通过该渠道与 AI 连线</p>
                </div>
              </label>
            </div>
          </div>

          {/* Connection Test Diagnostics Display if any */}
          {(testLoading || testResult || testError) && (
            <div className="p-3 bg-stone-50 border border-[#E0E7DE] rounded-2xl text-xs space-y-1 animate-fade-in">
              {testLoading && (
                <div className="flex items-center gap-2 text-[#4A6741] p-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-bold">正在往返连接人工智能中台以进行实时消息对齐测试...</span>
                </div>
              )}
              {testError && (
                <div className="text-rose-700 bg-rose-50 border border-rose-100 p-2.5 rounded-xl font-bold">
                  ❌ 连通常规对齐异常: {testError}
                </div>
              )}
              {testResult && (
                <div className="text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl font-bold space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-950 font-black">
                    <span role="img" aria-label="handshake">🤝</span> API 连通极速握手成功 (Ping Success!)
                  </div>
                  <div className="text-[12px] bg-white p-2 rounded-lg border border-emerald-200/40 text-stone-700 font-semibold italic">
                    AI 响应说：“{testResult}”
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-[#F0F4EF] flex items-center justify-between">
            <div className="text-[10px] text-[#6B7B6A] flex items-center gap-1 bg-[#F7F9F5] p-2 rounded-lg border border-[#E0E7DE]">
              <HelpCircle className="h-3 w-3 text-[#4A6741]" />
              提示：此密钥仅保存在您本地浏览器的 localStorage 中，安全可靠，决不发送给第三方服务器。
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={testLoading}
                onClick={handleTestConnection}
                className="px-4 py-2.5 bg-[#F0F4EF] hover:bg-[#DCE4DB] disabled:opacity-50 text-[#3A4D39] border border-[#DCE4DB] text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {testLoading ? '正在核对连通...' : '🔌 极速测试连通性'}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#3A4D39] hover:bg-[#4A6741] text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {saveSuccess ? '✔ 保存成功' : '保存并应用'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
