import { useState, useEffect } from 'react';
import { 
  CloudRain, 
  Sun, 
  Wind, 
  Snowflake, 
  AlertTriangle, 
  Home, 
  ShieldAlert, 
  Sparkles,
  RefreshCw,
  Gauge,
  Thermometer,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Eye,
  Settings,
  ArrowRightLeft,
  MapPin,
  Compass,
  Bell,
  CloudSun
} from 'lucide-react';
import { Plant, CareLog } from '../types';

interface WeatherWarningEngineProps {
  plants: Plant[];
  simulatedToday: string;
  daysElapsed: number;
  onUpdatePlants: (updatedPlants: Plant[]) => void;
  onAddLog: (log: CareLog) => void;
}

interface WeatherState {
  id: string;
  name: string;
  iconName: 'sun' | 'rain' | 'wind' | 'snow' | 'clear';
  temp: number;
  humidity: number;
  windSpeed: string;
  warningTitle: string;
  warningLevel: 'none' | 'blue' | 'yellow' | 'red';
  warningDesc: string;
  advice: string;
  outdoorModifierDesc: string;
}

interface PresetCity {
  name: string;
  lat: number;
  lon: number;
  desc: string;
}

const PRESET_CITIES: PresetCity[] = [
  { name: '北京', lat: 39.90, lon: 116.41, desc: '北临温带季风区，空气干燥且昼夜温差大' },
  { name: '昆明', lat: 25.04, lon: 102.71, desc: '高原春城，紫外线强但环境四季温和' },
  { name: '广州', lat: 23.13, lon: 113.26, desc: '华南湿热带季风区，空气湿度大且多风雨' },
  { name: '哈尔滨', lat: 45.75, lon: 126.63, desc: '寒温带大陆季风，极端气温冷害及冰雪明显' },
  { name: '三亚', lat: 18.25, lon: 109.51, desc: '热带海洋性气候，终年常夏，高温强晒' }
];

export default function WeatherWarningEngine({
  plants,
  simulatedToday,
  daysElapsed,
  onUpdatePlants,
  onAddLog
}: WeatherWarningEngineProps) {
  // Mode selection: 'simulation' (synced with daysElapsed / sandbox) or 'real' (geolocation weather API)
  const [engineMode, setEngineMode] = useState<'simulation' | 'real'>('simulation');
  
  // Geolocation & Live API states
  const [selectedCity, setSelectedCity] = useState<PresetCity>(PRESET_CITIES[1]); // Default to Kunming (Flora paradise)
  const [apiLoading, setApiLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [customCoordinates, setCustomCoordinates] = useState<{lat: number, lon: number} | null>(null);
  const [customCityName, setCustomCityName] = useState<string>('');
  
  // Real weather state fetched via Open-Meteo
  const [liveWeather, setLiveWeather] = useState<WeatherState | null>(null);

  // Available protective measures
  const [protections, setProtections] = useState({
    canopy: false,       // Anti-rain / waterlogging awning
    sunshade: false,     // Anti-sunburn mesh
    windBracing: false,   // Anti-toppling anchors
    thermalWrap: false   // Anti-frost wraps
  });

  // Track original locations before moving plants indoors so they can be moved back
  const [originalLocations, setOriginalLocations] = useState<Record<string, string>>({});

  // Drill Weather Override State (null means sync with daysElapsed, otherwise override index)
  const [drillOverrideIndex, setDrillOverrideIndex] = useState<number | null>(null);

  // Weather schedule array (used for simulation scale / sandboxing)
  const weatherSchedule: WeatherState[] = [
    {
      id: 'clear',
      name: '晴朗明媚',
      iconName: 'sun',
      temp: 26,
      humidity: 45,
      windSpeed: '2 级微风',
      warningTitle: '暂无活动灾害性预警',
      warningLevel: 'none',
      warningDesc: '风和日丽，户外散射日光非常舒适，极为适合室外植物进行高效率的光合作用。',
      advice: '可一键将室内花草搬置阳台晒太阳，促进根茎木质化。建议适时添加轻度液态复合肥。',
      outdoorModifierDesc: '无。户外植物长势优秀，代谢水平处于最优区间。'
    },
    {
      id: 'rain',
      name: '狂风暴雨',
      iconName: 'rain',
      temp: 18,
      humidity: 95,
      windSpeed: '6 级强阵风',
      warningTitle: '暴雨黄色预警 ⚡️',
      warningLevel: 'yellow',
      warningDesc: '短时间降雨量充沛，盆土将极快饱和并囤积酸性雨水（空气湿度升至95%之上）。',
      advice: '防止露天盆景在过剩水分中缺氧窒息、滋生立枯病。请立刻撑起「户外防雨遮罩」或将花草一键移入大厅避险。',
      outdoorModifierDesc: '🌧️ 泥土过饱和：未受遮蔽的户外植物土壤湿度已强制饱水。雨淋在一定程度上相当于灌溉，但对于仙人掌等沙生多肉是灾难。'
    },
    {
      id: 'heatwave',
      name: '地表酷暑',
      iconName: 'sun',
      temp: 39,
      humidity: 30,
      windSpeed: '3 级干热风',
      warningTitle: '高温橙色预警 🥵',
      warningLevel: 'red',
      warningDesc: '烈日极速炙烤，地表突破40°C。植物蒸腾脱水速率激增达平时 2.5 倍！容易导致叶面晒伤、黑腐、萎蔫。',
      advice: '必须拉起室外「防烈日遮阳遮阳网」遮挡直射强光，对于户外植物，建议将倒计时折半处理，时刻检查叶脉水合度。',
      outdoorModifierDesc: '🔥 极速脱水：户外植物蒸腾系数翻倍。未采取遮阳防爆晒保护的绿植长势可能严重衰弱，水分需求紧迫。'
    },
    {
      id: 'wind',
      name: '强风大作',
      iconName: 'wind',
      temp: 20,
      humidity: 50,
      windSpeed: '8 级烈风大作',
      warningTitle: '大风黄色预警 🌀',
      warningLevel: 'yellow',
      warningDesc: '阵风时速达到60+公里。高植株盆栽、攀援月季极易被大风倾倒砸翻、折断娇嫩枝条与萌新花骨朵。',
      advice: '户外高大植物应即刻施加「防风加固绳」以免倒伏。或者一键移入温暖安稳的客厅。',
      outdoorModifierDesc: '🍃 强力拉扯：强劲的侧风极易压坏或扯断户外未做力学加固的高干植物。'
    },
    {
      id: 'freeze',
      name: '强寒潮降温',
      iconName: 'snow',
      temp: -2,
      humidity: 40,
      windSpeed: '5 级阴冷北风',
      warningTitle: '寒潮霜冻蓝色预警 ❄️',
      warningLevel: 'blue',
      warningDesc: '气温骤降，露天结冰。热带观叶绿植（绿萝、龟背竹）和多肉作物如遭受霜冻，细胞壁将直接产生不可逆冰裂。',
      advice: '非耐寒耐受科植物处于高度坏死风险中！请务必「全副套袋防低温」或在一分钟内全部抱回温暖大厅中。',
      outdoorModifierDesc: '❄️ 细胞冰损：热带植物面临零下局部冻伤和组织坏死风险。无包裹的户外植物将受到严重冷害胁迫。'
    },
    {
      id: 'cloudy',
      name: '阴天密云',
      iconName: 'clear',
      temp: 22,
      humidity: 60,
      windSpeed: '1 级微风',
      warningTitle: '暂无活动灾害性预警',
      warningLevel: 'none',
      warningDesc: '散射光线柔和度较高，紫外线一般，水分消耗非常平缓，适合各种阴生观叶大叶绿植。',
      advice: '属于休生养息的极佳时机。无需强力防晒挡雨措施，可正常开展浇水或剪枝作业。',
      outdoorModifierDesc: '无。蒸腾压力温和，盆土干透速度适当减慢。'
    }
  ];

  // Calculated active weather index based on simulation mode keys
  const activeWeatherIndex = drillOverrideIndex !== null 
    ? drillOverrideIndex 
    : (daysElapsed % weatherSchedule.length);

  const currentSimulatedWeather = weatherSchedule[activeWeatherIndex];

  // Active consolidated weather based on mode state
  const currentWeather = engineMode === 'real' && liveWeather 
    ? liveWeather 
    : currentSimulatedWeather;

  // Derive outdoor plants
  const getOutdoorPlants = () => {
    return plants.filter(p => {
      const loc = p.location.toLowerCase();
      return loc.includes('阳台') || loc.includes('庭院') || loc.includes('露天') || loc.includes('户外') || loc.includes('室外') || loc.includes('屋顶') || loc.includes('花架');
    });
  };

  const outdoorPlants = getOutdoorPlants();

  // Helper render weather icons
  const getWeatherIcon = (name: 'sun' | 'rain' | 'wind' | 'snow' | 'clear', size: string = 'h-6 w-6') => {
    switch (name) {
      case 'sun':
        return <Sun className={`${size} text-amber-500 animate-spin-slow`} />;
      case 'rain':
        return <CloudRain className={`${size} text-indigo-500 animate-pulse`} />;
      case 'wind':
        return <Wind className={`${size} text-teal-400 animate-pulse`} />;
      case 'snow':
        return <Snowflake className={`${size} text-blue-400 animate-bounce`} />;
      default:
        return <CloudSun className={`${size} text-emerald-600 opacity-80`} />;
    }
  };

  // Live Location & Weather Fetch using Open-Meteo REST API (completely free and bypasses API credentials!)
  const fetchRealTimeWeather = async (lat: number, lon: number, locationName: string) => {
    setApiLoading(true);
    setApiError('');
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('气象核心服务器响应异常，请稍后刷新重试。');
      }
      const data = await response.json();
      const cur = data.current;
      
      const temp = Math.round(cur.temperature_2m);
      const humidity = Math.round(cur.relative_humidity_2m);
      const precipitation = cur.precipitation || 0;
      const windKmh = cur.wind_speed_10m || 0;
      const code = cur.weather_code || 0;

      // Classify the code according to global WMO weather code rules
      // Rain: 51-67, 80-82, 95-99
      // Snow: 71-77, 85-86
      // Wind: check windKmh > 25 km/h (approx force 4-5+)
      // Heatwave: temp > 35
      // Cold/Freeze: temp < 5
      let icon: 'sun' | 'rain' | 'wind' | 'snow' | 'clear' = 'clear';
      let name = '阴天多云';
      let warningTitle = '暂无活动灾害性预警';
      let warningLevel: 'none' | 'blue' | 'yellow' | 'red' = 'none';
      let warningDesc = `实时获取自 [${locationName}] 物理气象站数据。日温约${temp}°C，无严重天气冲击威胁。`;
      let advice = '处于舒适气候带，可在上午或傍晚安排常规的枝繁叶茂水分供给。';
      let modifier = '各项气候数值均衡。室外植物水分代谢符合黄金生物学稳态比例。';

      if (code === 0 || code === 1) {
        icon = 'sun';
        name = '烈日当空';
      } else if (code === 2 || code === 3) {
        icon = 'clear';
        name = '阴晴相间';
      } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99) || precipitation > 1.0) {
        icon = 'rain';
        name = '阴雨绵绵';
        if (precipitation > 3.0) {
          name = '雷雨大作';
          warningTitle = '暴雨黄色预警 ⛈️';
          warningLevel = 'yellow';
          warningDesc = `大中雨级降水量(${precipitation}mm/h)，容易造成花盆底层排水孔排堵不畅积水伤根。`;
          advice = '迅速支起「防雨遮雨棚」拦截暴雨直冲，或者紧急搬放温室大厅深处！';
          modifier = '🌧️ 泥土过饱和：高降雨强度。未遮挡的户外多肉具有烂根风险，需要密切盯着盆土透气排能状态。';
        }
      } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86) || temp <= 2) {
        icon = 'snow';
        name = '雨雪霜冻';
        warningTitle = '霜冻蓝色预警 ❄️';
        warningLevel = 'blue';
        warningDesc = `野外气温临近或跌破零度(${temp}°C)，空气极度冰冷。热带原生阔叶树如龟背竹等遭遇细胞冰损几率大。`;
        advice = '立即在阳台套上「保暖透光薄膜」抵御夜间急剧散热，或一键转移回温和的客厅。';
        modifier = '❄️ 细胞冰损：冷空气深度渗透，严防露天绿萝、马齿苋等柔嫩科热带植物冻成冰裂受损。';
      }

      // Wind override checked
      if (windKmh > 30) {
        icon = 'wind';
        name = '狂风猎猎';
        warningTitle = '强风黄色预警 🌀';
        warningLevel = 'yellow';
        warningDesc = `区域出现 ${Math.round(windKmh)} km/h 高速烈风（约6-7级）。盆栽花苞承受极高撕扯横向应力。`;
        advice = '在庭院使用多组「防风拉索架」物理锚固，建议移回室内，避免重盆栽侧翻损伤娇嫩新花。';
        modifier = '🍃 强力拉扯：大风高风振频率下，注意防止大型龟背竹、长藤月季被摧折倾倒。';
      }

      // Heatwave override checked
      if (temp >= 35) {
        icon = 'sun';
        name = '极端热浪';
        warningTitle = '酷暑高温橙色预警 🔥';
        warningLevel = 'red';
        warningDesc = `实时气温飙升至 ${temp}°C！水分蒸腾率呈乘数级暴涨，极易导致植物因供水速度远跟不上缺水而迅速枯萎、暴晒灼伤。`;
        advice = '拉开室外「轻质遮阳网」进行柔和散射遮阴！室外挂晒植物浇水频次可酌情多增加2/3量。';
        modifier = '🔥 极速脱水：超高温烈日照射，户外绿色多叶植物水分代谢速率已增达最高。';
      }

      const state: WeatherState = {
        id: 'api-live',
        name,
        iconName: icon,
        temp,
        humidity,
        windSpeed: `${Math.round(windKmh)} km/h`,
        warningTitle,
        warningLevel,
        warningDesc,
        advice,
        outdoorModifierDesc: modifier
      };

      setLiveWeather(state);

      // Create log showing location acquisition success
      const logObj: CareLog = {
        id: `weather-api-${Date.now()}`,
        plantId: 'weather-geoloc',
        plantName: `气象局卫星云图 [${locationName}]`,
        type: 'pest',
        date: simulatedToday,
        notes: `📡 [实况气象同步]：成功连通位置 [${locationName}] (经纬度: ${lat.toFixed(2)}, ${lon.toFixed(2)})，获取今日真实环境气象！温度：${temp}°C，湿度：${humidity}%，气流速度：${Math.round(windKmh)}km/h。`
      };
      onAddLog(logObj);

    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'GPS获取超时，网络受限或气象接口响应超时。已平滑采用模拟沙盘模式保证无断点体验。');
    } finally {
      setApiLoading(false);
    }
  };

  // Detect GPS geolocation securely from browser
  const handleDetectBrowserGPS = () => {
    setGpsLoading(true);
    setApiError('');
    if (!navigator.geolocation) {
      setApiError('您的浏览器不支持或未开启 HTML5 Geolocation 定位。');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCustomCoordinates({ lat: latitude, lon: longitude });
        setEngineMode('real');
        
        let resolvedCityName = '您的物理定位';
        try {
          // Fetch reverse-geocoding from a completely free, speed-oriented public geocoder client
          const reverseGeoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`;
          const response = await fetch(reverseGeoUrl);
          if (response.ok) {
            const geoData = await response.json();
            const province = geoData.principalSubdivision || '';
            const city = geoData.city || geoData.locality || '';
            if (city) {
              if (province && !city.includes(province)) {
                resolvedCityName = `${province}${city}`;
              } else {
                resolvedCityName = city;
              }
            } else if (province) {
              resolvedCityName = province;
            }
          }
        } catch (geoErr) {
          console.warn('Reverse geocoding failed, falling back to default:', geoErr);
        }

        setCustomCityName(resolvedCityName);
        fetchRealTimeWeather(latitude, longitude, resolvedCityName);
        setGpsLoading(false);
      },
      (error) => {
        console.warn('GPS location permission denied or timed out:', error);
        setApiError('物理GPS定位授权受阻（iFrame 容器权限沙盒或用户未点允许）。推荐在此随时一键切换为预设主要城市快捷联动！');
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  // Change preset city
  const handleSelectPreset = (city: PresetCity) => {
    setSelectedCity(city);
    setCustomCoordinates(null);
    setEngineMode('real');
    fetchRealTimeWeather(city.lat, city.lon, city.name);
  };

  // Sync simulatedAdvanced or days advance with safety linkages
  useEffect(() => {
    if (plants.length === 0) return;

    // Run rules automatically on day advancement ONLY when simulation mode is active (consistent behavior)
    if (engineMode === 'simulation') {
      let hasChanges = false;
      const updatedPlants = plants.map(plant => {
        const loc = plant.location.toLowerCase();
        const isOutdoor = loc.includes('阳台') || loc.includes('庭院') || loc.includes('露天') || loc.includes('户外') || loc.includes('室外') || loc.includes('屋顶') || loc.includes('花架');
        
        if (!isOutdoor) return plant;

        // Rainstorm automatic watering
        if (currentWeather.id === 'rain' && !protections.canopy) {
          if (plant.healthStatus === 'healthy' && (plant.species.toLowerCase().includes('succulent') || plant.name.includes('多肉') || plant.name.includes('仙人掌'))) {
            hasChanges = true;
            return {
              ...plant,
              lastWatered: simulatedToday,
              healthStatus: 'warning' as const,
              notes: `${plant.notes}\n⚠️ [天气预警触发]：遭受大雨灌溉冲刷淋雨，该多肉植物根茎水分极度饱和，高度警惕土壤水涝导致烂根黄叶。`
            };
          } else {
            hasChanges = true;
            return {
              ...plant,
              lastWatered: simulatedToday
            };
          }
        }

        // Scorching sun sunburn
        if (currentWeather.id === 'heatwave' && !protections.sunshade) {
          if (plant.healthStatus === 'healthy' && (plant.name.includes('绿萝') || plant.name.includes('铁线蕨'))) {
            hasChanges = true;
            return {
              ...plant,
              healthStatus: 'warning' as const,
              notes: `${plant.notes}\n⚠️ [天气预警触发]：暴露于酷暑烈日没有遮光网，薄质绿叶在高温强晒下被暴晒枯萎、发焦黄边。`
            };
          }
        }

        // Strong winds
        if (currentWeather.id === 'wind' && !protections.windBracing) {
          if (plant.healthStatus === 'healthy' && (plant.name.includes('玫瑰') || plant.name.includes('月季') || plant.name.includes('龟背竹'))) {
            hasChanges = true;
            return {
              ...plant,
              healthStatus: 'warning' as const,
              notes: `${plant.notes}\n⚠️ [天气预警触发]：未加装物理固定支撑件，强风高弯力倾斜盆土倒地，嫩弱枝繁出现局部风压损断。`
            };
          }
        }

        // Freeze frost damage!
        if (currentWeather.id === 'freeze' && !protections.thermalWrap) {
          if (plant.healthStatus === 'healthy' && !plant.name.includes('松') && !plant.name.includes('柏') && !plant.name.includes('梅')) {
            hasChanges = true;
            return {
              ...plant,
              healthStatus: 'dormant' as const,
              notes: `${plant.notes}\n⚠️ [天气预警触发]：零下霜冻气温下未套袋防寒，热带茎叶冷感萎蔫结霜，已被迫挂起严重冷害红牌，进入防冻休眠。`
            };
          }
        }

        return plant;
      });

      if (hasChanges) {
        onUpdatePlants(updatedPlants);
        const autoLog: CareLog = {
          id: `weather-auto-sim-${Date.now()}`,
          plantId: 'weather-engine',
          plantName: '户外气象站传感器',
          type: 'pest',
          date: simulatedToday,
          notes: `🤖 [时光机天气联动]：时间流转至今日，当前天气为【${currentWeather.name}】，检测到位于户外的多盆绿植受大自然物理作用产生状态异动！`
        };
        onAddLog(autoLog);
      }
    }
  }, [simulatedToday, activeWeatherIndex, engineMode, protections]);

  // Shield Toggling
  const handleToggleProtection = (key: keyof typeof protections, label: string) => {
    const nextVal = !protections[key];
    setProtections(prev => ({
      ...prev,
      [key]: nextVal
    }));

    const log: CareLog = {
      id: `protect-log-${Date.now()}`,
      plantId: 'weather-shield',
      plantName: '防灾金钟罩防护舱',
      type: 'pest',
      date: simulatedToday,
      notes: `🛡️ [防灾指令]：在 ${simulatedToday} 为户外区域${nextVal ? '部署启动' : '一键收归'}了 「${label}」 装置。`
    };
    onAddLog(log);
  };

  // Migrate plants Indoors
  const handleMigrateAllIndoors = () => {
    if (outdoorPlants.length === 0) return;

    const locCache: Record<string, string> = { ...originalLocations };
    const updated = plants.map(plant => {
      const loc = plant.location.toLowerCase();
      const isOutdoor = loc.includes('阳台') || loc.includes('庭院') || loc.includes('露天') || loc.includes('户外') || loc.includes('室外') || loc.includes('屋顶') || loc.includes('花架');
      if (isOutdoor) {
        locCache[plant.id] = plant.location;
        return {
          ...plant,
          location: '大厅避风港 (室内避险)',
          notes: `${plant.notes}\n🚪 [联动避灾移入]：气象站拉响 ${currentWeather.name} 警报，已紧急搬入室内避风港以求自保。`
        };
      }
      return plant;
    });

    setOriginalLocations(locCache);
    onUpdatePlants(updated);

    const log: CareLog = {
      id: `migrate-in-log-${Date.now()}`,
      plantId: 'weather-migrate',
      plantName: '植物紧急安全疏散小分队',
      type: 'water',
      date: simulatedToday,
      notes: `🚪 [安全迁徙]：在当前【${currentWeather.name}】灾害气候下，已将所有暴露于户外的盆栽一键安全疏回大厅。`
    };
    onAddLog(log);
  };

  // Migrate back outdoors
  const handleMigrateAllOutdoors = () => {
    let migratedCount = 0;
    const updated = plants.map(plant => {
      const originalLoc = originalLocations[plant.id];
      if (originalLoc && plant.location.includes('大厅避风港')) {
        migratedCount++;
        return {
          ...plant,
          location: originalLoc,
          notes: `${plant.notes}\n🏡 [联动返场移出]：预警阶段解除，本盆栽已安心重归原先心爱的户外露养。`
        };
      }
      return plant;
    });

    if (migratedCount === 0) return;

    onUpdatePlants(updated);
    setOriginalLocations({});

    const log: CareLog = {
      id: `migrate-out-log-${Date.now()}`,
      plantId: 'weather-migrate',
      plantName: '植物出舱管理员',
      type: 'water',
      date: simulatedToday,
      notes: `🏡 [重归原位]：常规阳光普照，已一键快速安全返还原先在大厅挂单避难的所有植物回户外阳台或花园原位。`
    };
    onAddLog(log);
  };

  // Manual rain simulator
  const handleManualNutrientRain = () => {
    if (outdoorPlants.length === 0) return;

    const updated = plants.map(plant => {
      const loc = plant.location.toLowerCase();
      const isOutdoor = loc.includes('阳台') || loc.includes('庭院') || loc.includes('露天') || loc.includes('户外') || loc.includes('室外') || loc.includes('屋顶') || loc.includes('花架');
      if (isOutdoor) {
        return {
          ...plant,
          lastWatered: simulatedToday,
          healthStatus: 'healthy' as const
        };
      }
      return plant;
    });

    onUpdatePlants(updated);

    const log: CareLog = {
      id: `rain-drill-log-${Date.now()}`,
      plantId: 'weather-drill',
      plantName: '植物加湿洗尘洒水机',
      type: 'water',
      date: simulatedToday,
      notes: `🛩️ [人工降雨洗尘]：触发户外云端飞播！给户外处于 ${currentWeather.name} 气象下的所有盆景均匀补充饱满的营养级喷淋，一网扫光附尘！`
    };
    onAddLog(log);
  };

  // Color mappings
  const getBannerStyles = (level: 'none' | 'blue' | 'yellow' | 'red') => {
    switch (level) {
      case 'red':
        return {
          bg: 'bg-rose-50 border-rose-200 text-[#7F1D1D]',
          badge: 'bg-rose-600 text-white',
          pulseBadge: 'text-rose-500',
          textMuted: 'text-rose-800'
        };
      case 'yellow':
        return {
          bg: 'bg-amber-50 border-amber-200 text-[#78350F]',
          badge: 'bg-amber-500 text-amber-950',
          pulseBadge: 'text-amber-500',
          textMuted: 'text-amber-800'
        };
      case 'blue':
        return {
          bg: 'bg-blue-50 border-blue-200 text-[#1E3A8A]',
          badge: 'bg-blue-600 text-white',
          pulseBadge: 'text-blue-550',
          textMuted: 'text-blue-800'
        };
      default:
        return {
          bg: 'bg-emerald-50/60 border-[#DCE4DB] text-[#3A4D39]',
          badge: 'bg-[#4A6741] text-white',
          pulseBadge: 'text-emerald-500',
          textMuted: 'text-[#6B7B6A]'
        };
    }
  };

  const currentStyles = getBannerStyles(currentWeather.warningLevel);

  // Generate customized warnings for specific currently owned plants
  const generateBotanicalPushAlerts = () => {
    const alerts: string[] = [];
    const hasSucculents = plants.some(p => p.species.toLowerCase().includes('succulent') || p.name.includes('多肉') || p.name.includes('山影') || p.name.includes('仙人角') || p.name.includes('乙女心'));
    const hasBroadleaves = plants.some(p => p.name.includes('龟背竹') || p.name.includes('琴叶榕') || p.name.includes('黄金葛') || p.name.includes('春羽') || p.species.toLowerCase().includes('monstera'));
    const hasVulnerableGreenery = plants.some(p => p.name.includes('绿萝') || p.name.includes('铁线蕨') || p.name.includes('网纹草'));
    const hasTallPlants = plants.some(p => p.name.includes('月季') || p.name.includes('玫瑰') || p.name.includes('三角梅') || p.name.includes('竹') || p.name.includes('茉莉'));

    if (currentWeather.iconName === 'rain' || (currentWeather.humidity > 85 && currentWeather.id !== 'freeze')) {
      if (hasSucculents) {
        alerts.push('👉【防积水警告】您的多肉家族 (如 乙女心 等) 最忌讳高湿淋酸雨。建议快速拉起防雨布，或挪动到遮雨篷下。');
      }
      alerts.push('👉【排水促根】潮湿高频连绵雨，请检查户外植物托盘。积水不能过夜，谨防闷根缺氧窒息。');
    }

    if (currentWeather.temp >= 35) {
      if (hasVulnerableGreenery) {
        alerts.push('👉【防焦烤日灼】大热天切忌暴晒！您的 绿萝/铁线蕨 极脆嫩。如果挂在朝南阳台暴晒，极易脱水焦黄。请立即开启「柔光遮阳网」！');
      }
      if (hasBroadleaves) {
        alerts.push('👉【增湿降温】琴叶榕/龟背竹 处于重度蒸腾高代谢。建议于清晨在叶片周围喷施微细喷雾，补充环境微湿。');
      }
    }

    if (currentWeather.temp <= 5) {
      if (hasBroadleaves || hasVulnerableGreenery) {
        alerts.push('👉【低温霜冻预警】当前接近冻伤点！由于您拥有多株热带雨林观叶作物 (如 龟背竹 / 绿萝)，请务必今夜一键把其「迁至室内大厅」保暖。');
      }
      alerts.push('👉【断水保暖】北方或寒潮来临，室外盆栽必须停止夜晚施肥浇水，让其维持盆土颗粒呈微干燥状态以此提高细胞抗寒渗透势。');
    }

    if (currentWeather.iconName === 'wind' || (currentWeather.warningTitle.includes('大风') || currentWeather.warningTitle.includes('风'))) {
      if (hasTallPlants) {
        alerts.push('👉【抗拉防倒伏】您的高干多花月季/爬藤三角梅迎风面大，极易被狂烈秋风横割、吹翻陶瓦盆。建议立即展开「侧翼防风索绑扎」物理绑定。');
      }
    }

    if (alerts.length === 0) {
      alerts.push('👉【今日大吉】天气非常舒适安逸。温湿度均处于植物日常完美生长的金黄色黄金期，可以大刀阔斧浇灌稀释液体有机营养肥。');
    }

    return alerts;
  };

  const currentBotanicalPushes = generateBotanicalPushAlerts();

  return (
    <div 
      className="bento-tile bg-white border border-[#E0E7DE] p-6 rounded-[32px] shadow-sm relative overflow-hidden transition-all duration-300 space-y-6"
      id="weather-linkage-engine-widget"
    >
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#3A4D39_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Head Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#F0F4EF] pb-4 gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-[#3A4D39] to-emerald-950 text-white rounded-2xl shadow-sm">
            <Compass className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-[#1E251C] font-display">户外气象地理联动与「智能发布推送预警中心」</h3>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black uppercase tracking-wide">
                Live Radar V3.0
              </span>
            </div>
            <p className="text-xs text-[#6B7B6A] mt-0.5">
              根据您的 **具体地理位置及真实气候参数**，智能测算温湿度条件，并为您当前拥有的特定花草量身推送护理防灾指南。
            </p>
          </div>
        </div>

        {/* Engine switcher bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#F0F4EF] rounded-2xl p-0.5 flex border border-[#DCE4DB]">
            <button
              onClick={() => {
                setEngineMode('simulation');
                setApiError('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                engineMode === 'simulation' 
                  ? 'bg-[#3A4D39] text-white shadow-xs' 
                  : 'text-[#6B7B6A] hover:bg-[#E0E7DE]/50'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>沙盘演练模式</span>
            </button>
            <button
              onClick={() => {
                setEngineMode('real');
                // Auto trigger fetch when activating real weather
                fetchRealTimeWeather(selectedCity.lat, selectedCity.lon, selectedCity.name);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                engineMode === 'real' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-[#6B7B6A] hover:bg-[#E0E7DE]/50'
              }`}
            >
              <MapPin className="h-3 w-3 animate-pulse" />
              <span>真实位置气象同步</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Selector Panel based on Active Mode selection */}
      <div className="relative z-10 bg-slate-50/50 p-4 rounded-3xl border border-[#F0F4EF] transition-all grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        
        {/* If Simulated Mode */}
        {engineMode === 'simulation' ? (
          <>
            <div className="md:col-span-5 space-y-1">
              <span className="text-[10px] uppercase font-black text-amber-600 block flex items-center gap-1.5">
                <Settings className="h-3 w-3 animate-spin-slow" />
                当前运行: 沙盘数值演绎状态
              </span>
              <p className="text-xs text-[#556953] leading-snug">
                天气随 **天数时光机（+1天）** 自动前进轮播，点击右侧的快捷天气可以直接插塞特殊灾害进行压力演练。
              </p>
            </div>
            
            <div className="md:col-span-7 flex flex-wrap gap-1.5 items-center justify-end">
              <button
                onClick={() => setDrillOverrideIndex(null)}
                className={`text-[9px] font-black tracking-wide px-3 py-2 rounded-xl border transition-all ${
                  drillOverrideIndex === null 
                    ? 'bg-slate-800 text-white border-transparent' 
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-slate-50'
                }`}
              >
                📆 时光推进轮播
              </button>
              
              <div className="flex bg-white border border-stone-200 p-0.5 rounded-xl gap-0.5 shadow-2xs">
                {weatherSchedule.map((w, idx) => (
                  <button
                    key={w.id}
                    onClick={() => setDrillOverrideIndex(idx)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                      drillOverrideIndex === idx 
                        ? 'bg-[#3A4D39] text-white shadow-2xs scale-105' 
                        : 'text-stone-500 hover:text-stone-900 hover:bg-slate-100'
                    }`}
                    title={`沙盘天气: ${w.name}`}
                  >
                    {w.iconName === 'sun' && '☀️'}
                    {w.iconName === 'rain' && '🌧️'}
                    {w.iconName === 'wind' && '💨'}
                    {w.iconName === 'snow' && '❄️'}
                    {w.iconName === 'clear' && '☁️'}
                    <span className="ml-0.5 hidden sm:inline">{w.name.slice(0, 2)}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* If Real GPS/Meteo API Mode */
          <>
            <div className="md:col-span-6 space-y-2">
              <span className="text-[10px] uppercase font-black text-blue-600 block flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 animate-bounce" />
                当前运行: 地理定位真实气象雷达
              </span>
              <p className="text-xs text-stone-600 leading-snug">
                支持 **一键自动获取当地的物理GPS坐标**，或在右侧点选您在国内的大致温气候所属中心城市，无API限流秒级即时拉取。
              </p>
              
              {apiError && (
                <p className="text-[10px] text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-150 font-medium">
                  ⚠️ {apiError}
                </p>
              )}
            </div>

            <div className="md:col-span-6 flex flex-wrap gap-2 items-center justify-end">
              {/* Browser active localization */}
              <button
                type="button"
                onClick={handleDetectBrowserGPS}
                disabled={gpsLoading || apiLoading}
                className="px-3.5 py-2 text-[10px] font-black tracking-wide bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1 disabled:opacity-40"
              >
                <Compass className={`h-3.5 w-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>📍 浏览器自动定位</span>
              </button>

              {/* City selector dropdown */}
              <div className="flex bg-white border border-stone-200 p-0.5 rounded-xl gap-0.5 shadow-2xs">
                {PRESET_CITIES.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => handleSelectPreset(c)}
                    disabled={apiLoading}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                      selectedCity.name === c.name && !customCoordinates
                        ? 'bg-blue-600 text-white shadow-2xs' 
                        : 'text-stone-600 hover:bg-slate-150'
                    }`}
                    title={c.desc}
                  >
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Meteorological Matrix (Left Panel) + Personalized Targeted Dynamic Pushes (Right Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
        
        {/* Column A: Local Metrics Board (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#F7F9F5] to-slate-50 border border-[#DCE4DB] p-5 rounded-3xl flex flex-col justify-between space-y-4 shadow-3xs relative">
          
          {/* Loading shroud overlay */}
          {apiLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center rounded-3xl z-20 space-y-2">
              <RefreshCw className="h-7 w-7 text-blue-600 animate-spin" />
              <span className="text-xs font-black text-blue-800">卫星云图实时加载同步中...</span>
            </div>
          )}

          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
                  {engineMode === 'real' ? 'Real Time' : 'Simulated'}
                </span>
                <span className="text-[10px] font-bold text-gray-500">
                  {engineMode === 'real' ? (customCoordinates ? `🚀 ${customCityName || '自定位辖区'}` : `🇨🇳 ${selectedCity.name}`) : '虚拟气象沙盒'}
                </span>
              </div>
              <span className="text-2xl font-black text-[#1E251C] mt-2 block flex items-center gap-1">
                {currentWeather.name}
                <span className="text-xs font-mono font-medium text-stone-400">({currentWeather.humidity > 80 ? '极度湿润' : '中等均衡'})</span>
              </span>
            </div>
            {getWeatherIcon(currentWeather.iconName, 'h-11 w-11')}
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-[#E0E7DE] text-center">
            <div className="p-2 bg-white rounded-2xl border border-stone-100/80">
              <span className="text-[9px] font-black text-gray-400 block tracking-wide">环境气温</span>
              <strong className="text-base font-mono text-[#3A4D39] block mt-0.5">{currentWeather.temp}°C</strong>
            </div>
            <div className="p-2 bg-white rounded-2xl border border-stone-100/80">
              <span className="text-[9px] font-black text-gray-400 block tracking-wide">空气湿度</span>
              <strong className="text-base font-mono text-[#3A4D39] block mt-0.5">{currentWeather.humidity}%</strong>
            </div>
            <div className="p-2 bg-white rounded-2xl border border-stone-100/80">
              <span className="text-[9px] font-black text-gray-400 block tracking-wide">强风速率</span>
              <strong className="text-xs font-mono font-black text-indigo-950 block mt-1.5 truncate" title={currentWeather.windSpeed}>
                {currentWeather.windSpeed}
              </strong>
            </div>
          </div>

          <div className="text-[10px] text-gray-600 leading-normal font-semibold italic bg-slate-100 px-3 py-2 rounded-2xl border border-slate-200">
            🌳 {currentWeather.outdoorModifierDesc}
          </div>
        </div>

        {/* Column B: Primary Warning Broadcast + Personalized Target Push Recommendations (7 cols) */}
        <div className={`lg:col-span-7 rounded-3xl border p-5 flex flex-col justify-between ${currentStyles.bg} hover:border-black/10 transition-all duration-300 relative`}>
          <div className="space-y-4">
            {/* Header Title Alert */}
            <div className="flex items-center gap-1.5">
              <AlertTriangle className={`h-5 w-5 ${currentWeather.warningLevel !== 'none' ? 'animate-bounce text-rose-600' : 'text-[#4A6741]'}`} />
              <span className="text-xs font-extrabold tracking-wide uppercase flex items-center gap-2">
                {currentWeather.warningTitle}
                {currentWeather.warningLevel !== 'none' && (
                  <span className="text-[8px] bg-rose-600 outline-1 text-white font-black px-1.5 py-0.5 rounded animate-pulse">
                    🚨 气流预警触发中
                  </span>
                )}
              </span>
            </div>

            {/* Warning narrative body */}
            <p className="text-xs font-bold leading-normal text-stone-700 bg-white/40 p-3 rounded-2xl border border-black/5">
              {currentWeather.warningDesc}
            </p>

            {/* Micro-targeted Alerts Box tailored specifically to owned inventory! */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-1 text-[#3A4D39] font-black">
                <Bell className="h-3.5 w-3.5 text-blue-600" />
                <span>基于「{plants.length}盆在库植物」智能匹配的管家精细推送建议：</span>
              </div>
              <div className="space-y-1.5 bg-white/85 p-3.5 rounded-2xl border border-[#DCE4DB] max-h-32 overflow-y-auto">
                {currentBotanicalPushes.map((p, idx) => (
                  <p key={idx} className="text-[11px] text-stone-700 leading-relaxed font-semibold transition hover:text-emerald-950">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Banner bottom details */}
          <div className="mt-4 pt-3.5 border-t border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className={`font-black ${currentStyles.textMuted} truncate max-w-md`}>
              ⚡ 联动防御建议: {currentWeather.advice}
            </span>
            <span className="text-[9px] font-mono opacity-50 shrink-0 font-bold self-end bg-black/5 px-2 py-0.5 rounded">
              时间: {simulatedToday} ({daysElapsed}天)
            </span>
          </div>
        </div>

      </div>

      {/* Operations defense panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
        
        {/* Anti-disaster active shield switchboards */}
        <div className="p-5 bg-stone-50/70 border border-[#DCE4DB] rounded-3xl space-y-4 shadow-3xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4.5 w-4.5 text-[#4A6741]" />
            <span className="text-xs font-black text-[#1E251C]">户外整体保护区 “安全结界防御罩” 开关柜</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Canopy */}
            <button
              onClick={() => handleToggleProtection('canopy', '防雨遮布')}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                protections.canopy 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-950 ring-2 ring-indigo-300 shadow-3xs' 
                  : 'bg-white border-[#DCE4DB] hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex justify-between w-full items-start">
                <span className="text-xs font-black">防雨塑料遮篷</span>
                <span className="text-xs">{protections.canopy ? '🐳 开启防积水' : '💤 待命'}</span>
              </div>
              <span className="text-[9px] text-stone-400 font-medium">适合雷雨天截留酸雨</span>
            </button>

            {/* Sunshade */}
            <button
              onClick={() => handleToggleProtection('sunshade', '防晒遮光网')}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                protections.sunshade 
                  ? 'bg-amber-50 border-amber-200 text-amber-950 ring-2 ring-amber-300 shadow-3xs' 
                  : 'bg-white border-[#DCE4DB] hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex justify-between w-full items-start">
                <span className="text-xs font-black">轻质遮阳网</span>
                <span className="text-xs">{protections.sunshade ? '☀️ 展开散射' : '💤 待命'}</span>
              </div>
              <span className="text-[9px] text-stone-400 font-medium">酷晒高温过滤强直射日光</span>
            </button>

            {/* Wind protection */}
            <button
              onClick={() => handleToggleProtection('windBracing', '重盆防风支撑绑扎组')}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                protections.windBracing 
                  ? 'bg-teal-50 border-teal-200 text-teal-950 ring-2 ring-teal-300 shadow-3xs' 
                  : 'bg-white border-[#DCE4DB] hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex justify-between w-full items-start">
                <span className="text-xs font-black">防风物理拉索</span>
                <span className="text-xs">{protections.windBracing ? '🌪️ 物理撑起' : '💤 待命'}</span>
              </div>
              <span className="text-[9px] text-stone-400 font-medium">防止高盆栽跌落折枝</span>
            </button>

            {/* Freeze thermal */}
            <button
              onClick={() => handleToggleProtection('thermalWrap', '防寒透光保暖薄膜')}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                protections.thermalWrap 
                  ? 'bg-sky-50 border-sky-300 text-sky-950 ring-2 ring-sky-300 shadow-3xs' 
                  : 'bg-white border-[#DCE4DB] hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex justify-between w-full items-start">
                <span className="text-xs font-black">保暖微温套膜</span>
                <span className="text-xs">{protections.thermalWrap ? '❄️ 套防霜冻袋' : '💤 待命'}</span>
              </div>
              <span className="text-[9px] text-stone-400 font-medium">热带植物抗击冬日冻冰损害</span>
            </button>
          </div>
        </div>

        {/* Physical Placement & Batch Fleet Operations Panel */}
        <div className="p-5 bg-[#FBFDF9] border border-[#DCE4DB] rounded-3xl flex flex-col justify-between space-y-4 shadow-3xs">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 justify-between">
              <div className="flex items-center gap-1.5">
                <Home className="h-4.5 w-4.5 text-[#4A6741]" />
                <span className="text-xs font-black text-[#1E251C]">户外多株快捷批量调度避灾</span>
              </div>
              <span className="text-[10px] font-mono font-black text-[#4A6741] bg-[#E9F0E6] px-2 py-0.5 rounded">
                目前处于露天: {outdoorPlants.length} 盆
              </span>
            </div>

            {/* Micro roster of outdoor plants with warning signals */}
            {outdoorPlants.length === 0 ? (
              <div className="text-center py-5 bg-white border border-dashed border-[#DCE4DB] rounded-2xl text-stone-400 select-none">
                <CheckCircle className="h-5 w-5 mx-auto text-emerald-500 opacity-60 mb-1" />
                <p className="text-[10px] font-bold">无暴露在暴风暴雨威胁下的户外花草</p>
                <p className="text-[8px] text-stone-400">所有花草均温存在无风雨的客厅大厅</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-3 border border-[#E0E7DE] max-h-24 overflow-y-auto space-y-1">
                {outdoorPlants.map(p => {
                  let alertSuffix = '';
                  if (currentWeather.iconName === 'rain' && !protections.canopy) alertSuffix = '🌧️ 泥土饱水淋雨';
                  if (currentWeather.temp >= 35 && !protections.sunshade) alertSuffix = '🥵 强紫暴晒威胁';
                  if (currentWeather.iconName === 'wind' && !protections.windBracing) alertSuffix = '💨 风压拉扯风险';
                  if (currentWeather.temp <= 5 && !protections.thermalWrap) alertSuffix = '❄️ 细胞壁冻伤警告';

                  return (
                    <div key={p.id} className="flex justify-between items-center text-[10px] border-b border-[#F0F4EF] py-1 last:border-b-0">
                      <span className="font-extrabold text-[#3A4D39]">🍀 {p.name} <span className="font-normal text-stone-400">({p.species})</span></span>
                      <span className="text-[9px] text-[#6B7B6A] bg-stone-100 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                        <span>{p.location}</span>
                        {alertSuffix && <span className="text-rose-600 font-black text-[8.5px] font-sans">{alertSuffix}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Row buttons */}
          <div className="flex gap-2 flex-wrap pt-1">
            {outdoorPlants.length > 0 ? (
              <button
                onClick={handleMigrateAllIndoors}
                className="grow text-[10px] font-black tracking-wide py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 text-center flex items-center justify-center gap-1"
              >
                <ArrowRightLeft className="h-3 w-3" />
                <span>一键搬入客厅避危险物</span>
              </button>
            ) : Object.keys(originalLocations).length > 0 ? (
              <button
                onClick={handleMigrateAllOutdoors}
                className="grow text-[10px] font-black tracking-wide py-2.5 bg-[#4A6741] hover:bg-[#3D5535] text-white rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 text-center flex items-center justify-center gap-1"
              >
                <Home className="h-3 w-3" />
                <span>预警解除：迁回户外原摆放架</span>
              </button>
            ) : (
              <div className="grow text-[9px] font-bold text-center py-2.5 bg-[#F0F4EF] rounded-xl text-[#6B7B6A]">
                💡 所有盆栽摆放得当，防灾设施运作健全中。
              </div>
            )}

            {outdoorPlants.length > 0 && (
              <button
                onClick={handleManualNutrientRain}
                className="text-[10px] space-x-1 font-black px-3 py-2.5 bg-[#F0F4EF] hover:bg-[#DCE4DB] text-[#4A6741] border border-[#DCE4DB] rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                title="人工干预开启飞降小细雨"
              >
                <CloudRain className="h-3 w-3" />
                <span>人工微小增雨</span>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
