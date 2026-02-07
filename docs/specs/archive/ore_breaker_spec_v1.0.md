# 鉱石破壊クリッカーゲーム 詳細仕様書（v1.0）

## 1. ゲーム概要

### タイトル（仮）
**Ore Breaker Incremental**

### ジャンル
クリック型インクリメンタルゲーム

### コンセプト
鉱山フィールド上の複数の鉱石を破壊し、資源を集めて成長していく。
クッキークリッカーの「Building」システムを参考に、
**自動採掘施設**を購入して DPS（Damage Per Second）を増やしていく。

### デザイン原則
1. **序盤は軽快に** - 最初の数分で成長を実感
2. **選択の楽しさ** - 何を買うか考える余地
3. **解放の喜び** - 新要素が次々アンロック
4. **放置でも成長** - アイドル要素で継続プレイ

---

## 2. コアシステム概要

### 通貨システム
| 通貨名 | 用途 | 獲得方法 |
|--------|------|----------|
| **鉱石資源** | メイン通貨。施設・強化購入 | 鉱石破壊 |
| **経験値(EXP)** | レベルアップ用 | 鉱石破壊 |
| **星の欠片** | 転生後の恒久強化 | 転生時に獲得 |

### 生産システム（クッキークリッカー準拠）
```
総DPS = Σ(施設数 × 基礎DPS × アップグレード倍率 × グローバル倍率)
```

---

## 3. 数学的基盤

### 3.1 施設コスト計算式（Cookie Clicker準拠）

```
コスト(n) = 基礎コスト × 成長率^n

n = 現在の所持数
成長率 = 1.15（Cookie Clickerと同じ）
```

**例：見習い鉱夫（基礎コスト15）**
| 購入数 | コスト | 累計コスト |
|--------|--------|------------|
| 1個目  | 15     | 15         |
| 2個目  | 17     | 32         |
| 3個目  | 20     | 52         |
| 5個目  | 26     | 93         |
| 10個目 | 61     | 304        |
| 20個目 | 245    | 1,538      |
| 50個目 | 16,135 | 123,192    |

### 3.2 レベルアップ経験値計算式

レベルと資源獲得の関係を滑らかにするため、以下の式を採用：

```
必要EXP(Lv) = floor(10 × 1.5^(Lv-1))
```

| レベル | 必要EXP | 累計EXP | 目安プレイ時間 |
|--------|---------|---------|----------------|
| 1→2   | 10      | 10      | 30秒           |
| 2→3   | 15      | 25      | 1分            |
| 3→4   | 22      | 47      | 2分            |
| 4→5   | 34      | 81      | 3分            |
| 5→6   | 51      | 132     | 5分            |
| 10→11 | 384     | 1,135   | 15分           |
| 15→16 | 2,892   | 8,687   | 45分           |
| 20→21 | 21,792  | 65,923  | 2時間          |
| 30→31 | 1,235,020| 3,740,368| 8時間         |

### 3.3 資源とEXPの獲得バランス

鉱石破壊時の報酬設計：

```
資源獲得 = 基礎報酬 × (1 + コンボボーナス) × グローバル倍率
EXP獲得 = ceil(資源獲得 × 0.5)
```

**設計目標**：
- Lv5到達時に「見習い鉱夫」が買える程度の資源
- Lv10到達時に「熟練鉱夫」解放 + 購入可能
- Lv20到達時に転生可能な累計資源

### 3.4 DPS効率の計算

施設の「効率」= DPS / コスト で評価。
プレイヤーが直感的に「何を買うべきか」判断できるよう設計。

```
効率 = (基礎DPS × 全倍率) / 次の購入コスト
```

---

## 4. フィールドシステム

### 4.1 基本仕様

画面に **4〜8個** の鉱石を同時配置。
破壊すると即座に補充される。

```js
const fieldConfig = {
  baseSlots: 4,           // 初期スロット数
  maxSlots: 8,            // 最大スロット数
  slotUnlockCost: [       // 追加スロット解放コスト
    500,    // 5個目
    2000,   // 6個目
    10000,  // 7個目
    50000   // 8個目
  ]
};
```

### 4.2 鉱石出現システム

**重み付きランダム抽選**：

```js
function spawnOre() {
  const pool = ores.filter(ore => 
    state.totalResources >= ore.unlockAt
  );
  
  // 重み計算（後半の鉱石ほど出にくい）
  const weights = pool.map((ore, i) => {
    const baseWeight = 100 - (i * 15);
    const rareBonus = ore.isRare ? 0.1 : 1;
    return Math.max(baseWeight * rareBonus, 5);
  });
  
  return weightedRandom(pool, weights);
}
```

### 4.3 鉱石データ（調整版）

**設計方針**：
- 最初の鉱石は **3〜5クリック** で破壊
- 報酬は HP の約 1/3 程度
- レア鉱石は HP 低め・報酬高め

```js
const ores = [
  // === 序盤（累計0〜100）===
  {
    id: "stone",
    name: "石",
    maxHp: 3,
    reward: 1,
    exp: 1,
    unlockAt: 0,
    isRare: false,
    color: "#8B8B8B",
    description: "どこにでもある普通の石"
  },
  {
    id: "copper",
    name: "銅鉱石",
    maxHp: 8,
    reward: 3,
    exp: 2,
    unlockAt: 20,
    isRare: false,
    color: "#B87333",
    description: "加工しやすい金属鉱石"
  },
  
  // === 前半（累計100〜1000）===
  {
    id: "iron",
    name: "鉄鉱石",
    maxHp: 15,
    reward: 6,
    exp: 4,
    unlockAt: 100,
    isRare: false,
    color: "#434343",
    description: "文明の基礎となる金属"
  },
  {
    id: "silver",
    name: "銀鉱石",
    maxHp: 10,
    reward: 15,
    exp: 8,
    unlockAt: 100,
    isRare: true,        // レア！
    rareChance: 0.08,
    color: "#C0C0C0",
    description: "美しく輝く貴金属"
  },
  {
    id: "coal",
    name: "石炭",
    maxHp: 5,
    reward: 2,
    exp: 1,
    unlockAt: 50,
    isRare: false,
    color: "#1A1A1A",
    description: "エネルギー源として重要",
    special: "energyBonus"  // 特殊効果
  },
  
  // === 中盤（累計1000〜10000）===
  {
    id: "gold",
    name: "金鉱石",
    maxHp: 20,
    reward: 30,
    exp: 15,
    unlockAt: 500,
    isRare: true,
    rareChance: 0.05,
    color: "#FFD700",
    description: "永遠に輝く黄金"
  },
  {
    id: "aluminum",
    name: "アルミ鉱石",
    maxHp: 25,
    reward: 12,
    exp: 8,
    unlockAt: 800,
    isRare: false,
    color: "#A8A8A8",
    description: "軽くて丈夫な現代金属"
  },
  {
    id: "crystal",
    name: "水晶",
    maxHp: 35,
    reward: 25,
    exp: 18,
    unlockAt: 2000,
    isRare: false,
    color: "#E8E8F0",
    description: "神秘的な力を秘めた結晶"
  },
  {
    id: "ruby",
    name: "ルビー",
    maxHp: 30,
    reward: 60,
    exp: 35,
    unlockAt: 3000,
    isRare: true,
    rareChance: 0.03,
    color: "#E0115F",
    description: "情熱の赤い宝石"
  },
  
  // === 後半（累計10000〜100000）===
  {
    id: "diamond",
    name: "ダイヤモンド",
    maxHp: 80,
    reward: 100,
    exp: 60,
    unlockAt: 10000,
    isRare: false,
    color: "#B9F2FF",
    description: "地球上で最も硬い鉱物"
  },
  {
    id: "meteorite",
    name: "隕石",
    maxHp: 60,
    reward: 200,
    exp: 120,
    unlockAt: 25000,
    isRare: true,
    rareChance: 0.02,
    color: "#4A4A6A",
    description: "宇宙からの贈り物"
  },
  {
    id: "mithril",
    name: "ミスリル",
    maxHp: 120,
    reward: 180,
    exp: 100,
    unlockAt: 50000,
    isRare: false,
    color: "#7DF9FF",
    description: "伝説の軽金属"
  },
  
  // === 終盤（累計100000〜）===
  {
    id: "orichalcum",
    name: "オリハルコン",
    maxHp: 200,
    reward: 400,
    exp: 250,
    unlockAt: 100000,
    isRare: false,
    color: "#FF6B6B",
    description: "失われた古代金属"
  },
  {
    id: "darkmatter",
    name: "ダークマター",
    maxHp: 500,
    reward: 1500,
    exp: 800,
    unlockAt: 300000,
    isRare: true,
    rareChance: 0.01,
    color: "#2C0033",
    description: "宇宙の神秘を凝縮した物質"
  },
  {
    id: "philosopher_stone",
    name: "賢者の石",
    maxHp: 1000,
    reward: 5000,
    exp: 3000,
    unlockAt: 1000000,
    isRare: true,
    rareChance: 0.005,
    color: "#FF00FF",
    description: "あらゆる物質を変換する究極の石"
  }
];
```

---

## 5. 施設システム（Buildings）

### 5.1 設計思想（Cookie Clicker参考）

- 施設は **自動でダメージを与える**（DPS）
- 購入ごとに価格が **15%上昇**
- 上位施設ほど **効率が良い**が高価
- 各施設に **専用アップグレード**が存在

### 5.2 施設データ

```js
const buildings = [
  {
    id: "cursor",
    name: "自動クリッカー",
    description: "自動でクリックしてくれる装置",
    baseCost: 15,
    baseDps: 0.1,
    costMultiplier: 1.15,
    unlockAt: { totalResources: 0 },
    flavorText: "カチカチカチ..."
  },
  {
    id: "apprentice",
    name: "見習い鉱夫",
    description: "採掘を始めたばかりの若者",
    baseCost: 100,
    baseDps: 1,
    costMultiplier: 1.15,
    unlockAt: { level: 3 },
    flavorText: "いつか一人前になるんだ！"
  },
  {
    id: "miner",
    name: "熟練鉱夫",
    description: "経験豊富なプロの鉱夫",
    baseCost: 1100,
    baseDps: 8,
    costMultiplier: 1.15,
    unlockAt: { level: 8 },
    flavorText: "この岩の音で鉱脈がわかる"
  },
  {
    id: "drill",
    name: "削岩機",
    description: "岩を砕く機械式ドリル",
    baseCost: 12000,
    baseDps: 47,
    costMultiplier: 1.15,
    unlockAt: { level: 15 },
    flavorText: "ドドドドド..."
  },
  {
    id: "excavator",
    name: "掘削機",
    description: "大型の採掘機械",
    baseCost: 130000,
    baseDps: 260,
    costMultiplier: 1.15,
    unlockAt: { level: 22 },
    flavorText: "一度に大量の鉱石を掘り出す"
  },
  {
    id: "mineshaft",
    name: "採掘坑",
    description: "地下深くまで続く坑道",
    baseCost: 1400000,
    baseDps: 1400,
    costMultiplier: 1.15,
    unlockAt: { level: 30 },
    flavorText: "深く掘れば宝が眠っている"
  },
  {
    id: "dwarf_guild",
    name: "ドワーフギルド",
    description: "伝説の鉱夫集団を雇用",
    baseCost: 20000000,
    baseDps: 7800,
    costMultiplier: 1.15,
    unlockAt: { level: 40, prestige: 1 },
    flavorText: "我らが掘れぬ岩はない！"
  },
  {
    id: "golem",
    name: "採掘ゴーレム",
    description: "魔法で動く岩の巨人",
    baseCost: 330000000,
    baseDps: 44000,
    costMultiplier: 1.15,
    unlockAt: { level: 50, prestige: 2 },
    flavorText: "疲れを知らぬ労働者"
  },
  {
    id: "portal",
    name: "異次元採掘ポータル",
    description: "別次元の鉱脈から資源を吸い上げる",
    baseCost: 5100000000,
    baseDps: 260000,
    costMultiplier: 1.15,
    unlockAt: { level: 65, prestige: 3 },
    flavorText: "無限の資源が眠る世界へ"
  },
  {
    id: "singularity",
    name: "特異点採掘機",
    description: "ブラックホールの力で採掘",
    baseCost: 75000000000,
    baseDps: 1600000,
    costMultiplier: 1.15,
    unlockAt: { level: 80, prestige: 5 },
    flavorText: "宇宙の法則を超えた採掘"
  }
];
```

### 5.3 施設のDPS計算

```js
function calculateBuildingDps(building) {
  const owned = state.buildings[building.id] || 0;
  if (owned === 0) return 0;
  
  // 基礎DPS × 所持数
  let dps = building.baseDps * owned;
  
  // アップグレード倍率を適用
  const upgrades = getUpgradesForBuilding(building.id);
  upgrades.forEach(upg => {
    if (state.upgrades[upg.id]) {
      dps *= upg.multiplier;
    }
  });
  
  // グローバル倍率（転生ボーナス等）
  dps *= state.globalMultiplier;
  
  return dps;
}

function calculateTotalDps() {
  return buildings.reduce((total, b) => 
    total + calculateBuildingDps(b), 0
  );
}
```

### 5.4 施設コスト計算

```js
function getBuildingCost(building, amount = 1) {
  const owned = state.buildings[building.id] || 0;
  const r = building.costMultiplier;
  
  if (amount === 1) {
    return Math.ceil(building.baseCost * Math.pow(r, owned));
  }
  
  // 複数購入の場合（等比級数の和）
  // Cost = baseCost × (r^owned) × (r^amount - 1) / (r - 1)
  const cost = building.baseCost 
    * Math.pow(r, owned) 
    * (Math.pow(r, amount) - 1) 
    / (r - 1);
  
  return Math.ceil(cost);
}

// 現在の資源で買える最大数を計算
function getMaxAffordable(building) {
  const owned = state.buildings[building.id] || 0;
  const r = building.costMultiplier;
  const c = state.resources;
  const b = building.baseCost;
  
  // n = floor(log_r(c × (r-1) / (b × r^owned) + 1))
  const n = Math.floor(
    Math.log(c * (r - 1) / (b * Math.pow(r, owned)) + 1) 
    / Math.log(r)
  );
  
  return Math.max(0, n);
}
```

---

## 6. アップグレードシステム

### 6.1 アップグレードの種類

| カテゴリ | 効果 | 解放条件 |
|----------|------|----------|
| **施設強化** | 特定施設のDPS×2 | 施設を一定数購入 |
| **クリック強化** | クリックダメージ増加 | レベル・累計資源 |
| **グローバル強化** | 全体倍率増加 | 実績・転生 |
| **シナジー** | 施設間の相乗効果 | 複数施設を所持 |

### 6.2 施設アップグレード（Cookie Clicker方式）

各施設に対して、所持数に応じてアップグレードが解放：

```js
const buildingUpgrades = [
  // 自動クリッカー用
  {
    id: "cursor_1",
    name: "強化クリック",
    description: "自動クリッカーの効率2倍",
    buildingId: "cursor",
    cost: 100,
    multiplier: 2,
    unlockCondition: { building: "cursor", count: 1 }
  },
  {
    id: "cursor_2",
    name: "高速クリック",
    description: "自動クリッカーの効率2倍",
    buildingId: "cursor",
    cost: 500,
    multiplier: 2,
    unlockCondition: { building: "cursor", count: 5 }
  },
  {
    id: "cursor_3",
    name: "連射クリック",
    description: "自動クリッカーの効率2倍",
    buildingId: "cursor",
    cost: 10000,
    multiplier: 2,
    unlockCondition: { building: "cursor", count: 25 }
  },
  {
    id: "cursor_4",
    name: "マシンガンクリック",
    description: "自動クリッカーの効率2倍",
    buildingId: "cursor",
    cost: 100000,
    multiplier: 2,
    unlockCondition: { building: "cursor", count: 50 }
  },
  // 施設ごとに同様のパターンで定義
  // 1個目、5個目、25個目、50個目、100個目、150個目...
  
  // 見習い鉱夫用
  {
    id: "apprentice_1",
    name: "採掘入門書",
    description: "見習い鉱夫の効率2倍",
    buildingId: "apprentice",
    cost: 1000,
    multiplier: 2,
    unlockCondition: { building: "apprentice", count: 1 }
  },
  {
    id: "apprentice_2",
    name: "鉄のつるはし",
    description: "見習い鉱夫の効率2倍",
    buildingId: "apprentice",
    cost: 5000,
    multiplier: 2,
    unlockCondition: { building: "apprentice", count: 5 }
  },
  // ... 以下同様
];
```

### 6.3 クリック強化アップグレード

```js
const clickUpgrades = [
  {
    id: "click_1",
    name: "握力強化",
    description: "クリックダメージ +1",
    cost: 50,
    effect: { type: "clickDamage", value: 1 },
    unlockCondition: { level: 2 }
  },
  {
    id: "click_2",
    name: "鋼の拳",
    description: "クリックダメージ +3",
    cost: 300,
    effect: { type: "clickDamage", value: 3 },
    unlockCondition: { level: 5 }
  },
  {
    id: "click_3",
    name: "正確な一撃",
    description: "クリックダメージ +10",
    cost: 2000,
    effect: { type: "clickDamage", value: 10 },
    unlockCondition: { level: 10 }
  },
  {
    id: "click_percent_1",
    name: "熟練の技",
    description: "クリックダメージ +1% of DPS",
    cost: 5000,
    effect: { type: "clickDpsPercent", value: 0.01 },
    unlockCondition: { level: 15 }
  },
  {
    id: "click_percent_2",
    name: "達人の技",
    description: "クリックダメージ +5% of DPS",
    cost: 50000,
    effect: { type: "clickDpsPercent", value: 0.05 },
    unlockCondition: { level: 25 }
  }
];
```

### 6.4 シナジーアップグレード

施設間の相乗効果（Cookie Clickerの上級要素）：

```js
const synergyUpgrades = [
  {
    id: "synergy_miner_apprentice",
    name: "師弟関係",
    description: "熟練鉱夫1人につき見習い鉱夫のDPS+5%\n見習い鉱夫1人につき熟練鉱夫のDPS+0.1%",
    cost: 50000,
    effects: [
      { base: "miner", boosted: "apprentice", perBase: 0.05 },
      { base: "apprentice", boosted: "miner", perBase: 0.001 }
    ],
    unlockCondition: { 
      buildings: { miner: 15, apprentice: 15 }
    }
  },
  {
    id: "synergy_drill_excavator",
    name: "機械化採掘",
    description: "掘削機1台につき削岩機のDPS+5%\n削岩機1台につき掘削機のDPS+0.1%",
    cost: 500000,
    effects: [
      { base: "excavator", boosted: "drill", perBase: 0.05 },
      { base: "drill", boosted: "excavator", perBase: 0.001 }
    ],
    unlockCondition: { 
      buildings: { drill: 15, excavator: 15 }
    }
  }
];
```

---

## 7. プレイヤー成長システム

### 7.1 レベルシステム詳細

```js
const levelSystem = {
  // 必要経験値計算
  getExpForLevel(level) {
    return Math.floor(10 * Math.pow(1.5, level - 1));
  },
  
  // 累計必要経験値
  getTotalExpForLevel(level) {
    // 等比級数の和: a(r^n - 1)/(r - 1)
    const a = 10;
    const r = 1.5;
    return Math.floor(a * (Math.pow(r, level - 1) - 1) / (r - 1));
  },
  
  // 現在のEXPからレベルを逆算
  getLevelFromExp(totalExp) {
    // level = 1 + log_1.5((totalExp × 0.5 / 10) + 1)
    return 1 + Math.floor(
      Math.log((totalExp * 0.5 / 10) + 1) / Math.log(1.5)
    );
  }
};
```

### 7.2 レベルアップ報酬

| レベル | 解放内容 |
|--------|----------|
| 1 | ゲーム開始 |
| 2 | アップグレード「握力強化」 |
| 3 | 施設「見習い鉱夫」解放 |
| 5 | スキル「連撃」解放 |
| 8 | 施設「熟練鉱夫」解放 |
| 10 | スキル「粉砕」解放、クリティカル機能解放 |
| 15 | 施設「削岩機」解放、スキル「黄金の目」解放 |
| 20 | 転生システム解放 |
| 22 | 施設「掘削機」解放 |
| 25 | スキル「一撃必殺」解放 |
| 30 | 施設「採掘坑」解放 |
| 40 | 施設「ドワーフギルド」解放（転生1回必要） |

### 7.3 レベルアップ時の処理

```js
function checkLevelUp() {
  const currentLevel = state.player.level;
  const expNeeded = levelSystem.getExpForLevel(currentLevel);
  
  if (state.player.exp >= expNeeded) {
    state.player.exp -= expNeeded;
    state.player.level++;
    
    // 自動強化（少しずつ基礎能力UP）
    state.player.baseClickDamage += 0.5;
    
    // 解放チェック
    checkUnlocks();
    
    // 演出
    showLevelUpEffect(state.player.level);
    
    // 連続レベルアップ対応
    checkLevelUp();
  }
}
```

---

## 8. スキルシステム

### 8.1 スキル一覧

```js
const skills = [
  {
    id: "multi_strike",
    name: "連撃",
    description: "5秒間、クリックダメージが2倍",
    icon: "⚔️",
    energyCost: 30,
    cooldown: 20,
    duration: 5,
    effect: { type: "clickMultiplier", value: 2 },
    unlockLevel: 5
  },
  {
    id: "shatter",
    name: "粉砕",
    description: "全鉱石に現在HPの25%ダメージ",
    icon: "💥",
    energyCost: 50,
    cooldown: 30,
    duration: 0,  // 即時効果
    effect: { type: "percentDamageAll", value: 0.25 },
    unlockLevel: 10
  },
  {
    id: "golden_eye",
    name: "黄金の目",
    description: "15秒間、レア鉱石出現率3倍",
    icon: "👁️",
    energyCost: 40,
    cooldown: 60,
    duration: 15,
    effect: { type: "rareMultiplier", value: 3 },
    unlockLevel: 15
  },
  {
    id: "mining_frenzy",
    name: "採掘狂乱",
    description: "10秒間、全DPSが5倍",
    icon: "🔥",
    energyCost: 80,
    cooldown: 120,
    duration: 10,
    effect: { type: "dpsMultiplier", value: 5 },
    unlockLevel: 20
  },
  {
    id: "instant_break",
    name: "一撃必殺",
    description: "1つの鉱石を即座に破壊",
    icon: "⚡",
    energyCost: 60,
    cooldown: 90,
    duration: 0,
    effect: { type: "instantKill", value: 1 },
    unlockLevel: 25
  }
];
```

### 8.2 エネルギーシステム

```js
const energySystem = {
  base: {
    maxEnergy: 100,
    regenPerSecond: 2
  },
  
  // 鉱石破壊でもエネルギー回復
  getEnergyOnBreak(ore) {
    return ore.isRare ? 10 : 2;
  },
  
  // コンボでエネルギーボーナス
  getComboEnergyBonus(combo) {
    if (combo >= 50) return 5;
    if (combo >= 20) return 3;
    if (combo >= 10) return 2;
    return 0;
  }
};
```

---

## 9. コンボシステム

### 9.1 仕様

```js
const comboSystem = {
  timeWindow: 2.0,        // 秒
  maxCombo: 999,
  
  // コンボボーナステーブル
  bonusTable: [
    { minCombo: 1, bonus: 0, label: "" },
    { minCombo: 5, bonus: 0.1, label: "COMBO!" },
    { minCombo: 10, bonus: 0.25, label: "GREAT!" },
    { minCombo: 20, bonus: 0.5, label: "EXCELLENT!" },
    { minCombo: 50, bonus: 1.0, label: "FEVER!!" },
    { minCombo: 100, bonus: 1.5, label: "SUPER FEVER!!!" },
    { minCombo: 200, bonus: 2.0, label: "ULTRA FEVER!!!!" }
  ],
  
  getBonus(combo) {
    for (let i = this.bonusTable.length - 1; i >= 0; i--) {
      if (combo >= this.bonusTable[i].minCombo) {
        return this.bonusTable[i];
      }
    }
    return this.bonusTable[0];
  }
};
```

### 9.2 コンボの適用

```js
function applyComboBonus(baseReward) {
  const comboInfo = comboSystem.getBonus(state.combo);
  return baseReward * (1 + comboInfo.bonus);
}
```

---

## 10. クリティカルシステム

### 10.1 仕様

```js
const criticalSystem = {
  baseChance: 0,           // 初期は0%、解放後に5%
  baseMultiplier: 2.0,     // 基本2倍ダメージ
  
  // クリティカル判定
  rollCritical() {
    const chance = state.player.critChance + this.baseChance;
    return Math.random() < chance;
  },
  
  // クリティカルダメージ計算
  getCritDamage(baseDamage) {
    const mult = state.player.critMultiplier + this.baseMultiplier;
    return baseDamage * mult;
  }
};
```

### 10.2 クリティカル強化アップグレード

```js
const critUpgrades = [
  {
    id: "crit_unlock",
    name: "会心の眼",
    description: "クリティカル機能解放（初期5%）",
    cost: 500,
    effect: { critChance: 0.05 },
    unlockCondition: { level: 10 }
  },
  {
    id: "crit_chance_1",
    name: "鋭い洞察",
    description: "クリティカル率 +3%",
    cost: 2000,
    effect: { critChance: 0.03 },
    unlockCondition: { level: 12 }
  },
  {
    id: "crit_mult_1",
    name: "致命的一撃",
    description: "クリティカル倍率 +0.5",
    cost: 5000,
    effect: { critMultiplier: 0.5 },
    unlockCondition: { level: 15 }
  }
];
```

---

## 11. 転生（Prestige）システム

### 11.1 設計思想

- **転生条件**: 累計資源 50,000 以上
- **リセット内容**: 資源、施設、通常アップグレード
- **維持内容**: 星の欠片、転生アップグレード、実績

### 11.2 星の欠片計算

```js
const prestigeSystem = {
  minResourcesForPrestige: 50000,
  
  // 獲得できる星の欠片を計算
  calculateStarFragments(totalResources) {
    if (totalResources < this.minResourcesForPrestige) return 0;
    
    // √(累計資源 / 1000) - 現在所持
    const potential = Math.floor(
      Math.sqrt(totalResources / 1000)
    );
    return Math.max(0, potential - state.prestige.starFragments);
  },
  
  // 転生ボーナス計算（1個あたり+5% DPS）
  getPrestigeMultiplier() {
    return 1 + (state.prestige.starFragments * 0.05);
  }
};
```

### 11.3 転生アップグレード（Heavenly Upgrades風）

```js
const prestigeUpgrades = [
  {
    id: "prestige_start_bonus",
    name: "熟練の記憶",
    description: "転生後、初期資源+100",
    cost: 1,  // 星の欠片
    effect: { startingResources: 100 }
  },
  {
    id: "prestige_click",
    name: "魂の打撃",
    description: "クリックダメージ +50%",
    cost: 3,
    effect: { clickMultiplier: 0.5 }
  },
  {
    id: "prestige_dps",
    name: "永久機関",
    description: "全DPS +25%",
    cost: 5,
    effect: { globalDpsMultiplier: 0.25 }
  },
  {
    id: "prestige_exp",
    name: "悟りの境地",
    description: "経験値獲得 +50%",
    cost: 10,
    effect: { expMultiplier: 0.5 }
  },
  {
    id: "prestige_rare",
    name: "幸運の星",
    description: "レア鉱石出現率 +10%",
    cost: 15,
    effect: { rareChanceBonus: 0.1 }
  },
  {
    id: "prestige_offline",
    name: "夢の採掘",
    description: "オフライン生産効率 +50%",
    cost: 20,
    effect: { offlineEfficiency: 0.5 }
  }
];
```

---

## 12. ゴールデンオア（Golden Cookie風）

### 12.1 仕様

定期的に画面上に **光る鉱石** が出現。
クリックすると特殊効果を得られる。

```js
const goldenOreSystem = {
  spawnInterval: { min: 60, max: 180 },  // 秒
  duration: 13,                           // 表示時間
  
  effects: [
    {
      id: "frenzy",
      name: "フィーバー",
      description: "30秒間、DPSが7倍！",
      weight: 50,
      duration: 30,
      effect: { dpsMultiplier: 7 }
    },
    {
      id: "lucky",
      name: "ラッキー",
      description: "現在の所持資源の10%を獲得",
      weight: 30,
      duration: 0,
      effect: { type: "percentResources", value: 0.1 }
    },
    {
      id: "click_frenzy",
      name: "クリックフィーバー",
      description: "20秒間、クリックダメージ777倍！",
      weight: 10,
      duration: 20,
      effect: { clickMultiplier: 777 }
    },
    {
      id: "combo_boost",
      name: "コンボブースト",
      description: "コンボが即座に+50",
      weight: 10,
      duration: 0,
      effect: { type: "addCombo", value: 50 }
    }
  ]
};
```

---

## 13. 実績システム

### 13.1 実績カテゴリ

```js
const achievements = [
  // 資源系
  { id: "res_100", name: "採掘入門", desc: "累計100資源獲得", condition: { totalResources: 100 }, reward: { multiplier: 0.01 } },
  { id: "res_1000", name: "順調な採掘", desc: "累計1,000資源獲得", condition: { totalResources: 1000 }, reward: { multiplier: 0.01 } },
  { id: "res_10000", name: "鉱山長", desc: "累計10,000資源獲得", condition: { totalResources: 10000 }, reward: { multiplier: 0.02 } },
  
  // 施設系
  { id: "building_10", name: "小さな会社", desc: "施設を合計10個所持", condition: { totalBuildings: 10 }, reward: { multiplier: 0.01 } },
  { id: "building_50", name: "採掘企業", desc: "施設を合計50個所持", condition: { totalBuildings: 50 }, reward: { multiplier: 0.02 } },
  { id: "building_100", name: "採掘帝国", desc: "施設を合計100個所持", condition: { totalBuildings: 100 }, reward: { multiplier: 0.03 } },
  
  // クリック系
  { id: "click_100", name: "クリッカー", desc: "100回クリック", condition: { totalClicks: 100 }, reward: { multiplier: 0.01 } },
  { id: "click_1000", name: "連打マスター", desc: "1,000回クリック", condition: { totalClicks: 1000 }, reward: { multiplier: 0.01 } },
  
  // コンボ系
  { id: "combo_10", name: "コンボ入門", desc: "10コンボ達成", condition: { maxCombo: 10 }, reward: { multiplier: 0.01 } },
  { id: "combo_50", name: "コンボマスター", desc: "50コンボ達成", condition: { maxCombo: 50 }, reward: { multiplier: 0.02 } },
  { id: "combo_100", name: "コンボ神", desc: "100コンボ達成", condition: { maxCombo: 100 }, reward: { multiplier: 0.03 } },
  
  // レベル系
  { id: "level_10", name: "成長中", desc: "レベル10到達", condition: { level: 10 }, reward: { multiplier: 0.02 } },
  { id: "level_25", name: "ベテラン", desc: "レベル25到達", condition: { level: 25 }, reward: { multiplier: 0.03 } },
  { id: "level_50", name: "伝説の鉱夫", desc: "レベル50到達", condition: { level: 50 }, reward: { multiplier: 0.05 } },
  
  // 特殊
  { id: "rare_all", name: "コレクター", desc: "全種類のレア鉱石を破壊", condition: { special: "allRares" }, reward: { multiplier: 0.05 } },
  { id: "prestige_1", name: "新たな始まり", desc: "初めての転生", condition: { prestiges: 1 }, reward: { multiplier: 0.05 } }
];
```

### 13.2 実績ボーナス

実績解除数に応じて **ミルク** のようなボーナス：

```js
function getAchievementBonus() {
  const unlocked = achievements.filter(a => 
    state.achievements[a.id]
  ).length;
  
  // 基礎ボーナス + 各実績の個別報酬
  let bonus = 1;
  
  // 解除数ボーナス（5個ごとに+2%）
  bonus += Math.floor(unlocked / 5) * 0.02;
  
  // 個別報酬
  achievements.forEach(a => {
    if (state.achievements[a.id] && a.reward?.multiplier) {
      bonus += a.reward.multiplier;
    }
  });
  
  return bonus;
}
```

---

## 14. 状態管理

### 14.1 完全な状態オブジェクト

```js
const initialState = {
  // プレイヤー基本
  player: {
    level: 1,
    exp: 0,
    resources: 0,
    totalResources: 0,
    baseClickDamage: 1,
    critChance: 0,
    critMultiplier: 0
  },
  
  // フィールド
  field: {
    slots: 4,
    ores: [],      // 現在表示中の鉱石
    combo: 0,
    comboTimer: 0
  },
  
  // 施設
  buildings: {
    // cursor: 0, apprentice: 0, ...
  },
  
  // アップグレード購入済み
  upgrades: {
    // upgrade_id: true/false
  },
  
  // スキル
  skills: {
    // skill_id: { cooldown: 0, active: false }
  },
  energy: 100,
  maxEnergy: 100,
  
  // 転生
  prestige: {
    count: 0,
    starFragments: 0,
    upgrades: {}
  },
  
  // 実績
  achievements: {},
  
  // 統計
  stats: {
    totalClicks: 0,
    totalOresBroken: 0,
    totalCriticals: 0,
    maxCombo: 0,
    playTime: 0,
    goldenOresClicked: 0
  },
  
  // 設定
  settings: {
    soundEnabled: true,
    particlesEnabled: true,
    notationsType: "standard" // standard, scientific, engineering
  },
  
  // メタ
  lastSaveTime: Date.now(),
  gameVersion: "1.0.0"
};
```

---

## 15. 画面レイアウト詳細

```
┌────────────────────────────────────────────────────────────┐
│ Ore Breaker        Lv.15 ████████░░ 1,234/2,892 EXP       │
│ 💎 12,345 資源     ⚡ 85/100 エネルギー    DPS: 156.7/s   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│    ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐                  │
│    │ 石  │   │ 銅  │   │ 鉄  │   │ 銀✨│  ← フィールド   │
│    │ 2/3 │   │ 5/8 │   │12/15│   │ 8/10│                  │
│    └─────┘   └─────┘   └─────┘   └─────┘                  │
│                                                            │
│         コンボ: 23   GREAT! +25%                          │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ スキル: [⚔️連撃 30] [💥粉砕 50] [👁️黄金 40] [🔥狂乱 80]   │
├──────────────────────────┬─────────────────────────────────┤
│ ステータス               │ 強化・施設                      │
│ ─────────────────────── │ ──────────────────────────────  │
│ クリックダメージ: 5.5    │ 【施設】                        │
│ クリティカル: 8%         │  🖱️ 自動クリッカー x10  [25]    │
│ クリティカル倍率: 2.5x   │  👷 見習い鉱夫 x5       [173]   │
│ 総DPS: 156.7/s          │  ⛏️ 熟練鉱夫 x2        [1,521]  │
│                         │                                  │
│ 【グローバル倍率】       │ 【アップグレード】               │
│  実績ボーナス: x1.12    │  🔨 高速クリック       [500]    │
│  転生ボーナス: x1.15    │  💪 握力強化II        [2,000]   │
│                         │  ⭐ 師弟関係          [50,000]  │
├──────────────────────────┴─────────────────────────────────┤
│ [保存] [転生 ★7獲得可能] [設定] [統計]                     │
└────────────────────────────────────────────────────────────┘
```

---

## 16. ゲームループ処理

```js
// メインゲームループ（60FPS）
function gameLoop(timestamp) {
  const deltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  
  // DPSダメージ適用
  applyDpsDamage(deltaTime);
  
  // エネルギー回復
  regenEnergy(deltaTime);
  
  // コンボタイマー
  updateComboTimer(deltaTime);
  
  // スキルクールダウン
  updateSkillCooldowns(deltaTime);
  
  // アクティブスキル効果
  updateActiveSkills(deltaTime);
  
  // ゴールデンオア処理
  updateGoldenOre(deltaTime);
  
  // 解放チェック
  checkUnlocks();
  
  // 実績チェック
  checkAchievements();
  
  // 統計更新
  state.stats.playTime += deltaTime;
  
  // UI更新
  updateUI();
  
  // 自動保存（30秒ごと）
  if (Date.now() - state.lastSaveTime > 30000) {
    saveGame();
  }
  
  requestAnimationFrame(gameLoop);
}

function applyDpsDamage(deltaTime) {
  const totalDps = calculateTotalDps();
  const damage = totalDps * deltaTime;
  
  // ダメージを全鉱石に均等分配 or ランダム
  state.field.ores.forEach(ore => {
    const oreDamage = damage / state.field.ores.length;
    damageOre(ore, oreDamage, false);  // DPSはコンボ非加算
  });
}
```

---

## 17. バランスシミュレーション

### 17.1 想定プレイ進行

| 時間 | レベル | 総資源 | DPS | 主な出来事 |
|------|--------|--------|-----|------------|
| 0分 | 1 | 0 | 0 | ゲーム開始 |
| 1分 | 2 | ~30 | 0 | 握力強化購入 |
| 3分 | 4 | ~100 | 0.5 | 自動クリッカー購入 |
| 5分 | 5 | ~200 | 2 | 連撃スキル解放 |
| 10分 | 8 | ~600 | 10 | 熟練鉱夫解放 |
| 20分 | 12 | ~2,000 | 50 | クリティカル解放 |
| 45分 | 18 | ~10,000 | 200 | 転生可能に近づく |
| 1時間 | 20 | ~30,000 | 500 | 転生解放 |
| 2時間 | 25 | ~100,000 | 2,000 | 初回転生推奨 |

### 17.2 転生後の加速

1回目の転生（★7獲得想定）：
- グローバル倍率 +35%
- 転生アップグレード購入可能
- 2回目の転生まで約1時間

---

## 18. 保存・ロード

```js
function saveGame() {
  const saveData = {
    state: state,
    timestamp: Date.now(),
    version: "1.0.0"
  };
  
  const encoded = btoa(JSON.stringify(saveData));
  localStorage.setItem("oreBreaker_save", encoded);
  state.lastSaveTime = Date.now();
}

function loadGame() {
  const saved = localStorage.getItem("oreBreaker_save");
  if (!saved) return false;
  
  try {
    const decoded = JSON.parse(atob(saved));
    
    // バージョン互換性チェック
    if (decoded.version !== "1.0.0") {
      migrateData(decoded);
    }
    
    // オフライン進行計算
    const offlineTime = (Date.now() - decoded.timestamp) / 1000;
    applyOfflineProgress(decoded.state, offlineTime);
    
    state = decoded.state;
    return true;
  } catch (e) {
    console.error("Load failed:", e);
    return false;
  }
}

function applyOfflineProgress(savedState, seconds) {
  // 最大8時間分
  const cappedSeconds = Math.min(seconds, 8 * 60 * 60);
  
  // オフライン効率（デフォルト50%、転生アップグレードで増加）
  const efficiency = 0.5 + (savedState.prestige.upgrades.prestige_offline ? 0.5 : 0);
  
  const offlineDps = calculateTotalDps() * efficiency;
  const offlineResources = offlineDps * cappedSeconds;
  
  savedState.player.resources += offlineResources;
  savedState.player.totalResources += offlineResources;
  
  // オフライン報告
  showOfflineReport(cappedSeconds, offlineResources);
}
```

---

## 19. 実装優先度

### Phase 1: MVP（1日目標）
- [x] 基本クリック処理
- [ ] フィールドシステム（4スロット固定）
- [ ] 鉱石5種類（石、銅、鉄、銀、金）
- [ ] 施設3種類（自動クリッカー、見習い、熟練）
- [ ] 基本アップグレード5種類
- [ ] レベルシステム（Lv1-20）
- [ ] セーブ/ロード

### Phase 2: コア機能（3日目標）
- [ ] コンボシステム
- [ ] クリティカルシステム
- [ ] スキル3種類
- [ ] 施設アップグレード（各施設3段階）
- [ ] 鉱石10種類まで拡張
- [ ] 演出強化（アニメーション、エフェクト）

### Phase 3: 拡張機能（1週間目標）
- [ ] 転生システム
- [ ] 転生アップグレード
- [ ] ゴールデンオア
- [ ] 実績システム（50種）
- [ ] シナジーアップグレード
- [ ] フィールド拡張

### Phase 4: 完成（2週間目標）
- [ ] 全施設実装（10種）
- [ ] 全鉱石実装（15種）
- [ ] 全実績実装
- [ ] バランス調整
- [ ] オフライン進行
- [ ] インポート/エクスポート

---

## 20. 技術仕様

- **構成**: 1ファイル HTML + インラインCSS/JS
- **フレームワーク**: なし（Vanilla JS）
- **ES6+構文**: class, arrow function, template literal等
- **ゲームループ**: requestAnimationFrame（60FPS）
- **数値表示**: 大きな数値は suffix 表記（K, M, B, T...）
- **保存**: localStorage（Base64エンコード）

---

## 付録A: 数値の suffix 表記

```js
const suffixes = [
  "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"
];

function formatNumber(num) {
  if (num < 1000) return Math.floor(num).toString();
  
  const exp = Math.floor(Math.log10(num) / 3);
  const suffix = suffixes[Math.min(exp, suffixes.length - 1)];
  const scaled = num / Math.pow(1000, exp);
  
  return scaled.toFixed(2) + suffix;
}
```

---

## 付録B: 色定義（CSS変数）

```css
:root {
  /* 鉱石カラー */
  --ore-stone: #8B8B8B;
  --ore-copper: #B87333;
  --ore-iron: #434343;
  --ore-silver: #C0C0C0;
  --ore-gold: #FFD700;
  --ore-diamond: #B9F2FF;
  --ore-rare-glow: 0 0 15px #FFD700;
  
  /* UIカラー */
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --text-primary: #eee;
  --text-secondary: #aaa;
  --accent: #e94560;
  --success: #4ecca3;
  --warning: #ffc107;
  
  /* コンボカラー */
  --combo-normal: #fff;
  --combo-great: #4ecca3;
  --combo-excellent: #ffc107;
  --combo-fever: #e94560;
}
```
