import { Plant, CareLog, GrowthRecord } from '../types';

export const INITIAL_PLANTS: Plant[] = [
  {
    id: 'plant-1',
    name: '绿萝',
    species: 'Epipremnum aureum',
    location: '客厅窗旁',
    imageUrl: 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=600&auto=format&fit=crop&q=80',
    waterInterval: 6,
    fertilizeInterval: 30,
    pestInterval: 60,
    lastWatered: '2026-05-22',
    lastFertilized: '2026-05-10',
    lastPestControl: '2026-05-01',
    healthStatus: 'healthy',
    petSafety: 'toxic',
    petSafetyNotes: '含有草酸钙结晶，误食会导致宠物口腔红肿、强烈刺痛、流涎和呕吐。',
    notes: '喜湿润环境，避免暴晒，注意定期擦拭叶片。',
    createdAt: '2026-05-01'
  },
  {
    id: 'plant-2',
    name: '龟背竹',
    species: 'Monstera deliciosa',
    location: '书房角落',
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&auto=format&fit=crop&q=80',
    waterInterval: 8,
    fertilizeInterval: 25,
    pestInterval: 90,
    lastWatered: '2026-05-18',
    lastFertilized: '2026-05-15',
    lastPestControl: '2026-04-20',
    healthStatus: 'healthy',
    petSafety: 'toxic',
    petSafetyNotes: '叶片与汁液含有不溶性草酸钙结晶，对猫狗有毒，误食可致口部吞咽困难。',
    notes: '适度散射光。长出气生根时可引导插入泥土或捆绑在椰糠柱上。',
    createdAt: '2026-05-02'
  },
  {
    id: 'plant-3',
    name: '多肉景天 (乙女心)',
    species: 'Sedum pachyphyllum',
    location: '南面阳台',
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80',
    waterInterval: 14,
    fertilizeInterval: 90,
    pestInterval: 60,
    lastWatered: '2026-05-10',
    lastFertilized: '2026-04-15',
    lastPestControl: '2026-05-05',
    healthStatus: 'warning',
    petSafety: 'safe',
    petSafetyNotes: '景天属植物对猫狗非常友好无毒，即使稍微啃啃叶尖也不用担心。',
    notes: '极耐旱的多姿萌物，需要充足阳光，叶缘在强光下会染上娇羞的粉红色。完全干透后再灌入水分，梅雨季需控水。',
    createdAt: '2026-05-05'
  },
  {
    id: 'plant-4',
    name: '绯红月季',
    species: 'Rosa chinensis',
    location: '阳台 (Balcony)',
    imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
    waterInterval: 5,
    fertilizeInterval: 15,
    pestInterval: 45,
    lastWatered: '2026-05-24',
    lastFertilized: '2026-05-20',
    lastPestControl: '2026-05-15',
    healthStatus: 'healthy',
    petSafety: 'safe',
    petSafetyNotes: '无毒植物，但枝条带刺，需小心戳伤猫狗好奇乱咬的动作及肉垫。',
    notes: '喜阳、通风高要求的花中皇后。见干见湿，花期前需勤快补充磷钾肥。注意提防白粉病与粉虱。',
    createdAt: '2026-05-10'
  },
  {
    id: 'plant-5',
    name: '红茶花 (五宝茶)',
    species: 'Camellia japonica',
    location: '客厅窗旁 (Living Room)',
    imageUrl: 'https://images.unsplash.com/photo-1610444379933-28f73fe0009c?w=600&auto=format&fit=crop&q=80',
    waterInterval: 7,
    fertilizeInterval: 30,
    pestInterval: 60,
    lastWatered: '2026-05-22',
    lastFertilized: '2026-05-18',
    lastPestControl: '2026-05-10',
    healthStatus: 'healthy',
    petSafety: 'safe',
    petSafetyNotes: '山茶科名花对猫咪和狗狗完全安全，属于环保无毒品类，可在室内放心栽种。',
    notes: '半阴温暖的经典东方名花。喜欢微酸性土壤与偏湿润的环境氛围。忌烈日晒爆和泥土过度积水。',
    createdAt: '2026-05-12'
  }
];

export const INITIAL_LOGS: CareLog[] = [
  {
    id: 'log-1',
    plantId: 'plant-1',
    plantName: '绿萝',
    type: 'water',
    date: '2026-05-22',
    notes: '土壤表面微干，进行了浇透。'
  },
  {
    id: 'log-2',
    plantId: 'plant-2',
    plantName: '龟背竹',
    type: 'fertilize',
    date: '2026-05-15',
    notes: '施加了稀释的通用氮磷钾液体肥料。'
  },
  {
    id: 'log-3',
    plantId: 'plant-3',
    plantName: '多肉景天 (乙女心)',
    type: 'pest',
    date: '2026-05-05',
    notes: '喷洒了稀释后的吡虫啉溶液，预防红蜘蛛和蚧壳虫。'
  },
  {
    id: 'log-4',
    plantId: 'plant-4',
    plantName: '绯红月季',
    type: 'water',
    date: '2026-05-24',
    notes: '盆土表面有干燥白痕，进行充分灌注浇至盆底漏水。'
  }
];

export const PLANT_SPECIES_PRESETS = [
  { name: '龟背竹', species: 'Monstera deliciosa', water: 8, fertilize: 30, pest: 90, petSafety: 'toxic' as const, petSafetyNotes: '对猫狗有毒，误食叶片会导致流涎、口腔红肿和呕吐。' },
  { name: '琴叶榕', species: 'Ficus lyrata', water: 10, fertilize: 45, pest: 60, petSafety: 'toxic' as const, petSafetyNotes: '含有刺激性白乳汁液，对猫狗有毒，接触产生皮炎、误食刺激胃肠。' },
  { name: '绿萝', species: 'Epipremnum aureum', water: 6, fertilize: 30, pest: 60, petSafety: 'toxic' as const, petSafetyNotes: '含有草酸钙结晶，猫狗摄入会产生口腔强烈刺痛、流涎和红肿。' },
  { name: '虎皮兰', species: 'Sansevieria trifasciata', water: 20, fertilize: 60, pest: 120, petSafety: 'toxic' as const, petSafetyNotes: '含有大量皂苷物质，宠物接触或误饮洗叶水易起胃呕吐或腹泻。' },
  { name: '白掌/一帆风顺', species: 'Spathiphyllum', water: 5, fertilize: 30, pest: 60, petSafety: 'toxic' as const, petSafetyNotes: '含草酸钙水合物针晶，对宠物具有刺激毒性，吞食有灼热刺痛。' },
  { name: '发财树', species: 'Pachira aquatica', water: 14, fertilize: 45, pest: 90, petSafety: 'safe' as const, petSafetyNotes: '完全无毒安全。发财树对猫咪和狗狗非常温和，家庭友好。' },
  { name: '多肉景天', species: 'Succulent', water: 14, fertilize: 90, pest: 60, petSafety: 'safe' as const, petSafetyNotes: '常见的景天科多肉多属无毒品种，对猫犬安全放心。' },
  { name: '月季花', species: 'Rosa chinensis', water: 5, fertilize: 15, pest: 45, petSafety: 'safe' as const, petSafetyNotes: '月季花本身安全无毒；主要留心锋利的尖刺戳伤猫咪细嫩的脸庞。' },
  { name: '山茶花', species: 'Camellia japonica', water: 7, fertilize: 30, pest: 60, petSafety: 'safe' as const, petSafetyNotes: '山茶花对家兔、猫狗无毒，是传统且安全的观赏型木本盆栽。' },
  { name: '茉莉花', species: 'Jasminum', water: 3, fertilize: 15, pest: 45, petSafety: 'safe' as const, petSafetyNotes: '纯真茉莉对宠物无危害。注意防止猫狗跳跃撞翻盆土。' },
  { name: '蝴蝶兰', species: 'Phalaenopsis', water: 9, fertilize: 20, pest: 60, petSafety: 'safe' as const, petSafetyNotes: '无毒环保，即使猫科动物好奇啃咬叶片也完全不会引起毒性不适。' }
];

export const INITIAL_GROWTH_RECORDS: GrowthRecord[] = [
  {
    id: 'growth-1-1',
    plantId: 'plant-1',
    date: '2026-05-01',
    title: '搬入新家第一天',
    imageUrl: 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=600&auto=format&fit=crop&q=80',
    height: 15,
    note: '刚从花卉市场带回家的绿萝，挂在客厅窗台上。叶色鲜绿，希望能顺利长成一面瀑布墙！'
  },
  {
    id: 'growth-1-2',
    plantId: 'plant-1',
    date: '2026-05-15',
    title: '爆出了两枚鹅黄新叶',
    imageUrl: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=600&auto=format&fit=crop&q=80',
    height: 22,
    note: '精心培育了两周，叶心抽出了两片淡黄色娇嫩新叶，气生根也扎进了水土之中，真令人兴奋！'
  },
  {
    id: 'growth-2-1',
    plantId: 'plant-2',
    date: '2026-05-02',
    title: '书房一角极简之美',
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&auto=format&fit=crop&q=80',
    height: 35,
    note: '把它放置在新刷的混凝土花架旁。挑选的这株带有小叶洞，希望能早日开出大气宏伟的开背。'
  },
  {
    id: 'growth-3-1',
    plantId: 'plant-3',
    date: '2026-05-05',
    title: '泛起粉红腮红的乙女心',
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80',
    height: 8,
    note: '高强度散射日照滋养，叶梢的小红尖在紫外线下顺利上色了！好像抹了胭脂红，肉嘟嘟超可爱。'
  }
];
