# Ore Breaker Incremental 仕様書 v3.0（現行実装準拠）

## 1. ゲーム概要

### タイトル
**Ore Breaker Incremental**

### ジャンル
クリック型インクリメンタルゲーム

### コンセプト
鉱山フィールド上の複数鉱石を破壊し、資源を集めて施設・スキル・強化を解放。
Cookie Clickerの「施設DPS」と、クリッカーの「アクション性」を融合。
**放置でも成長、操作すればもっと成長** を実現。

### デザイン原則
1. **序盤は軽快に** — 最初の数分で成長を実感
2. **選択の楽しさ** — 施設 or 強化 or 鉱石強化、何に投資するか
3. **解放の喜び** — 新要素が次々アンロック
4. **放置でも成長** — DPSによるアイドル進行（フォーカスターゲットに集中）
5. **操作の爽快感** — コンボ・クリティカル・スキル

---

## 2. 画面レイアウト

### 設計方針
- **ノースクロール**: 全要素を1画面に収める（100vh）
- **ダークテーマ**: 鉱山の暗い雰囲気
- **ピクセルアート風**: 個別PNG画像によるレトロゲームUI
- **モーダル**: 画面に収まらない情報はポップアップ表示

### メインレイアウト

```
┌──────────────────────────────────────────────────────────────────┐
│ 💎 12.3K  ⚡ 85/100  Lv.15 [████░░] 24/50  DPS:156/s  PWR:8  │  ← トップバー(40px)
├──────────────────────────────────────────────┬───────────────────┤
│                                              │ [施設][強化][鉱石] │
│       ┌──┐  ┌──┐                             │                   │
│       │石│  │銅│    ┌──┐                      │  🖱️ 自動ｸﾘｯｶｰ x3│
│       └──┘  └──┘    │鉄│◀フォーカス           │     1.5 DPS  [25]│
│               ⛏️→    └──┘                     │                   │
│    ┌──┐         ┌──┐                          │  👷 見習い鉱夫 x2 │
│    │★銅│  ✨   │銀│                          │     2.0 DPS [138] │
│    └──┘        └──┘                           │                   │
│                                              │  ??? 🔒            │
│         [鉱山背景：岩肌テクスチャ]              │  累計500で解放     │
│                                              │                   │
├──────────────────────────────────────────────┴───────────────────┤
│ [⚔️] [💥] [👁️] [🔥] [⚡]                          💾 📊 ⚙ │  ← ボトムバー(50px)
└──────────────────────────────────────────────────────────────────┘
```

### レイアウト詳細

| エリア | サイズ | CSS | 内容 |
|--------|--------|-----|------|
| トップバー | 高さ40px | grid-template-rows | 資源、エネルギー、レベル、経験値バー、DPS、PWR、コンボ |
| メインフィールド | 1fr × 1fr | grid-template-columns: 1fr 260px | 鉱石の散らばり配置エリア |
| 右サイドバー | 幅260px | 同上 | 3タブ（施設/強化/鉱石） |
| ボトムバー | 高さ50px | grid-template-rows | スキルボタン＋メニューボタン |

### トップバー表示項目
- 💎 資源量
- ⚡ エネルギー（現在/最大）
- Lv. レベル
- 経験値バー（緑色、幅80px）+ テキスト（現在EXP/次レベル必要EXP）
- DPS: 総DPS/秒
- PWR: クリックダメージ
- コンボ表示（右寄せ）

---

## 3. 画像アセット

### 使用方式
個別PNG画像ファイル（`output/`フォルダ内）

### 画像一覧

| スプライトID | ファイル | 用途 |
|-------------|---------|------|
| player | output/character_girl1.png | プレイヤー |
| stone | output/stone1.png | 石 |
| copper | output/copper.png | 銅鉱石 |
| iron | output/iron.png | 鉄鉱石 |
| coal | output/coal.png | 石炭 |
| silver | output/silver.png | 銀鉱石 |
| gold | output/gold.png | 金鉱石 |
| aluminum | output/aluminum1.png | アルミ |
| crystal | output/crystal.png | 水晶 |
| diamond | output/diamond.png | ダイヤ |
| meteorite | output/meteorite.png | 隕石 |
| mithril | output/mithril.png | ミスリル |
| orichalcum | output/orichalcum1.png | オリハルコン |
| darkmatter | output/dark_matter.png | ダークマター |
| philosopher | output/philosophers_stone.png | 賢者の石 |
| cursor | output/auto_clicker.png | 自動クリッカー |
| apprentice | output/apprentice_miner.png | 見習い鉱夫 |
| miner | output/expert_miner.png | 熟練鉱夫 |
| drill | output/rock_drill.png | 削岩機 |
| excavator | output/excavator.png | 掘削機 |
| mineshaft | output/mine.png | 採掘坑 |
| golem | output/mining_golem.png | 採掘ゴーレム |
| dwarf_guild | output/dwarf_guild.png | ドワーフギルド |
| portal | output/dimensional_mining_portal.png | 異次元ポータル |
| singularity | output/singularity_miner.png | 特異点採掘機 |

### 表示方法
```css
background-image: url('output/xxx.png');
background-size: contain;
background-repeat: no-repeat;
background-position: center;
image-rendering: pixelated;
```

---

## 4. 通貨・リソース

| 通貨名 | 用途 | 獲得方法 |
|--------|------|----------|
| **鉱石資源** 💎 | 施設・強化購入 | 鉱石破壊 |
| **経験値(EXP)** | レベルアップ | 鉱石破壊 |
| **エネルギー** ⚡ | スキル発動 | 自然回復(2/s)、鉱石破壊(通常+2/レア+10)、石炭特殊(+5) |

### 数値表記
```js
const SUFFIXES = ["", "K", "M", "B", "T", "Qa"];
function fmt(num) {
    if (num < 1) return num > 0 ? num.toFixed(1) : '0';
    if (num < 1000) return Math.floor(num).toString();
    const exp = Math.floor(Math.log10(num) / 3);
    const suffix = SUFFIXES[Math.min(exp, SUFFIXES.length - 1)];
    const scaled = num / Math.pow(1000, exp);
    return scaled.toFixed(exp >= 2 ? 2 : 1) + suffix;
}
```

---

## 5. 数学的基盤

### 5.1 施設コスト計算式（Cookie Clicker準拠）
```
コスト(n) = ceil(基礎コスト × 1.15^n)
n = 現在の所持数
```

### 5.2 強化コスト計算式（レベル制）
```
コスト(Lv) = ceil(基礎コスト × コスト倍率^Lv)
```

### 5.3 レベルアップ経験値
```
必要EXP(Lv) = floor(10 × 1.5^(Lv-1))
```

### 5.4 クリックダメージ計算
```
基礎ダメージ = 1 + (レベル-1) × 0.5 + クリック強化Lv
DPSボーナス = 総DPS × 0.01
クリックダメージ = max(1, floor(基礎ダメージ + DPSボーナス))
                  × コンボ倍率
                  × クリティカル倍率（発動時）
                  × 連撃スキル倍率（発動時: ×2）
```

### 5.5 総DPS計算
```
総DPS = Σ(施設数 × 基礎DPS) × DPS倍率スキル効果(通常1, 狂乱時5)
```

---

## 6. フォーカスターゲットシステム

### 6.1 仕様
- プレイヤーがクリックした鉱石が「フォーカスターゲット」になる
- 全DPSはフォーカスターゲットに集中攻撃（分散しない）
- フォーカス鉱石が壊れたら、「最もHP割合が低い鉱石」に自動移行
- フォーカスターゲットがない場合（全て満タン）、自動で1つ選択
- 新しい鉱石がスポーンした時、フォーカスがなければ自動設定

### 6.2 視覚表現
```
フォーカス中の鉱石:
- 緑色の光る枠（border + box-shadow パルスアニメーション）
- z-index: 10 で前面表示

ピッケルエフェクト:
- DPS > 0 かつフォーカス中: 約800msごとに「⛏️」が飛来
- ランダム方向から鉱石に向かって飛ぶアニメーション（0.6s）
- 最大同時3個
```

### 6.3 自動ターゲット選択ロジック
```js
function selectNextFocusTarget() {
    // HP割合が最も低い鉱石を選択
    let best = null, bestRatio = Infinity;
    ores.forEach(ore => {
        const ratio = ore.hp / ore.maxHp;
        if (ratio < bestRatio) { bestRatio = ratio; best = ore; }
    });
    return best;
}
```

---

## 7. 鉱石システム

### 7.1 フィールド仕様
- **散らばり配置**: ランダム座標（重複防止: 70px以上離す）
- **初期スロット**: 4個
- **最大スロット**: 12個（累計資源+アップグレード）
- **スロット拡張条件**: 累計資源 200/1000/5000/20000 で+1ずつ（基本8まで）
- **鉱石サイズ**: 64×64px（スプライト48×48 + HP/名前）
- **破壊後**: 300ms後に新鉱石スポーン

### 7.2 鉱石データテーブル

| # | ID | 鉱石名 | HP | 資源 | EXP | 出現条件(累計) | レア | 特殊 |
|---|-------|--------|-----|------|-----|----------|------|------|
| 1 | stone | 石 | 3 | 1 | 1 | 0 | - | - |
| 2 | coal | 石炭 | 5 | 2 | 1 | 50 | - | エネルギー+5 |
| 3 | copper | 銅鉱石 | 8 | 3 | 2 | 20 | - | - |
| 4 | iron | 鉄鉱石 | 15 | 6 | 4 | 100 | - | - |
| 5 | silver | 銀鉱石 | 10 | 15 | 8 | 100 | 8% | - |
| 6 | gold | 金鉱石 | 20 | 30 | 15 | 500 | 5% | - |
| 7 | aluminum | アルミ | 25 | 12 | 8 | 800 | - | - |
| 8 | crystal | 水晶 | 35 | 25 | 18 | 2000 | - | - |
| 9 | diamond | ダイヤ | 80 | 100 | 60 | 10000 | - | - |
| 10 | meteorite | 隕石 | 60 | 200 | 120 | 25000 | 2% | - |
| 11 | mithril | ミスリル | 120 | 180 | 100 | 50000 | - | - |
| 12 | orichalcum | オリハルコン | 200 | 400 | 250 | 100000 | - | - |
| 13 | darkmatter | ダークマター | 500 | 1500 | 800 | 300000 | 1% | - |
| 14 | philosopher | 賢者の石 | 1000 | 5000 | 3000 | 1000000 | 0.5% | - |

### 7.3 出現ロジック
```js
function selectOreType() {
    const pool = oreTypes.filter(o => totalResources >= o.unlockAt);
    const htBonus = getHighTierBonus(); // 高価値鉱石率アップグレード
    const weights = pool.map((ore, i) => {
        let w = max(100 - i * 12, 5);
        if (i > 0 && htBonus > 0) w += (i * htBonus * 0.5); // 高ランクブースト
        if (ore.isRare) w = ore.rareChance * 100 * rareBonus + htBonus * 0.2;
        return w;
    });
    return weightedRandom(pool, weights);
}
```

### 7.4 レアバリアントシステム
- **どの鉱石でも** レアバリアントになる可能性がある
- **基本確率**: 3%（強化で+1%/Lv、最大+15%）
- **報酬**: 通常の10倍
- **表示**: 名前に「★」接頭辞、✨エフェクト、brightness(1.3) saturate(1.5)
- **ポップアップ**: ピンク色（#ff69b4）で獲得資源表示

### 7.5 報酬計算
```
報酬 = floor(鉱石基本報酬 × コンボ倍率 × レア倍率(10x) × 資源ボーナス倍率)
```

### 7.6 破壊時演出
- **ダメージポップアップ**: 黄色（#ffeb3b）で「-数値」フロートアップ
- **クリティカル**: 大きめ赤色（#ff5722）
- **獲得資源ポップアップ**: 緑色（#4ecca3）で「+数値💎」フロートアップ
- **レアバリアント獲得**: ピンク色（#ff69b4）で大きめ表示

---

## 8. 施設システム

### 8.1 設計思想
- 施設は **フォーカスターゲットにDPSダメージ** を与える
- 購入ごとに価格が **15%上昇**
- 全施設は最初から「???」としてサイドバーに表示

### 8.2 施設データ

| # | ID | 施設名 | 基礎コスト | 基礎DPS | 解放条件(累計) | 説明 |
|---|-----|--------|------------|---------|----------|------|
| 1 | cursor | 自動クリッカー | 15 | 0.5 | 0 | 自動でクリック |
| 2 | apprentice | 見習い鉱夫 | 100 | 1 | 50 | 若い鉱夫 |
| 3 | miner | 熟練鉱夫 | 1,100 | 8 | 500 | プロの鉱夫 |
| 4 | drill | 削岩機 | 12,000 | 47 | 5,000 | 機械式ドリル |
| 5 | excavator | 掘削機 | 130,000 | 260 | 50,000 | 大型採掘機械 |
| 6 | mineshaft | 採掘坑 | 1,400,000 | 1,400 | 500,000 | 地下坑道 |
| 7 | dwarf_guild | ドワーフギルド | 20,000,000 | 7,800 | 5,000,000 | 伝説の鉱夫集団 |
| 8 | golem | 採掘ゴーレム | 330,000,000 | 44,000 | 50,000,000 | 魔法の巨人 |
| 9 | portal | 異次元ポータル | 5,100,000,000 | 260,000 | 500,000,000 | 別次元から採掘 |
| 10 | singularity | 特異点採掘機 | 75,000,000,000 | 1,600,000 | 5,000,000,000 | ブラックホール |

### 8.3 サイドバーUI
- **購入可能**: 緑背景ハイライト（can-afford）
- **資源不足**: コスト表示がグレー（not-afford）
- **未解放**: 全体が薄く、名前は「???」、コストは「🔒」
- **所持数**: 右上に「x数」表示

---

## 9. 強化システム（レベル制）

### 9.1 設計思想
- 全強化は **何度でもレベルアップ可能**（maxLevelがある場合を除く）
- レベルごとにコスト上昇（baseCost × costMult^Lv）
- 3タブ構成: **施設** / **強化** / **鉱石**
- 未解放の強化は「???」として表示
- 購入不可の強化はコストがグレーアウト

### 9.2 強化タブ（攻撃系）

| ID | 名前 | emoji | 効果/Lv | 基礎コスト | 倍率 | 最大Lv | 解放条件 |
|----|------|-------|---------|-----------|------|--------|----------|
| click_power | クリック強化 | 👊 | クリック +1 | 50 | ×1.5 | 無制限 | 累計0 |
| crit_chance | クリティカル率 | 🎯 | クリ率 +2% | 500 | ×2.0 | 25(50%) | 累計200 |
| crit_mult | クリティカル倍率 | 💥 | クリ倍率 +0.5 | 3,000 | ×2.5 | 無制限 | 累計2000 |
| energy_cap | エネルギー容量 | 🔋 | 最大エネルギー +20 | 200 | ×1.8 | 無制限 | 累計100 |

### 9.3 鉱石タブ（鉱石系）

| ID | 名前 | emoji | 効果/Lv | 基礎コスト | 倍率 | 最大Lv | 解放条件 |
|----|------|-------|---------|-----------|------|--------|----------|
| ore_slots | 出現数アップ | ⬆️ | 鉱石スロット +1 | 300 | ×3.0 | 8 | 累計100 |
| rare_chance | レア出現率 | ✨ | レアバリアント率 +1% | 1,000 | ×2.5 | 15 | 累計500 |
| high_tier | 高価値鉱石率 | 💎 | 高ランク出現率 +5% | 800 | ×2.2 | 無制限 | 累計300 |
| reward_bonus | 資源ボーナス | 💰 | 獲得資源 +10% | 500 | ×2.0 | 無制限 | 累計150 |

### 9.4 効果の計算
```js
baseClickDamage = 1 + (level - 1) * 0.5 + click_power_Lv
critChance = crit_chance_Lv * 2  // %
critMultiplier = 2.0 + crit_mult_Lv * 0.5
maxEnergy = 100 + energy_cap_Lv * 20
fieldSlots = min(12, baseSlots + ore_slots_Lv)
rareVariantChance = 0.03 + rare_chance_Lv * 0.01
rewardMultiplier = 1 + reward_bonus_Lv * 0.10
```

---

## 10. スキルシステム

### 10.1 スキル一覧

| ID | スキル名 | emoji | 効果 | エネルギー | CT | 解放条件(累計) |
|----|---------|-------|------|-----------|-----|----------|
| multi_strike | 連撃 | ⚔️ | 5秒間クリック2倍 | 30 | 20s | 100 |
| shatter | 粉砕 | 💥 | 全鉱石にHP25%ダメージ | 50 | 30s | 500 |
| golden_eye | 黄金の目 | 👁️ | 15秒間レア率3倍 | 40 | 60s | 2,000 |
| frenzy | 採掘狂乱 | 🔥 | 10秒間DPS5倍 | 80 | 120s | 10,000 |
| instant_kill | 一撃必殺 | ⚡ | 1つの鉱石を即破壊 | 60 | 90s | 5,000 |

### 10.2 エネルギーシステム
- **最大値**: 100（+ energy_cap × 20）
- **自然回復**: 2/秒
- **鉱石破壊回復**: 通常+2、レア系+10
- **石炭特殊回復**: +5

### 10.3 スキルUI（ボトムバー）
- **使用可能(ready)**: 緑枠 + 光
- **発動中(active)**: 金枠 + パルスアニメーション
- **クールダウン中(cooldown)**: 半透明 + 残秒表示
- **未解放(locked)**: 暗い表示

---

## 11. コンボシステム

### 11.1 仕様
- 鉱石を破壊するとコンボ +1
- **2秒以内** に次の破壊がないとリセット

### 11.2 コンボテーブル

| コンボ | ボーナス | ラベル | 色コード |
|--------|----------|--------|---------|
| 1-4 | +0% | (数字のみ) | #888 |
| 5-9 | +10% | COMBO! | #4ecca3 |
| 10-19 | +25% | GREAT! | #3498db |
| 20-49 | +50% | EXCELLENT! | #ffc107 |
| 50-99 | +100% | FEVER!! | #e74c3c |
| 100-199 | +150% | SUPER FEVER!!! | #9b59b6 |
| 200+ | +200% | ULTRA FEVER!!!! | #ff69b4 |

---

## 12. レベルシステム

### 12.1 レベルアップ
- **必要EXP**: `floor(10 × 1.5^(Lv-1))`
- **レベルアップ効果**: baseClickDamage再計算（+0.5/Lv）
- **演出**: 画面中央にゴールド色のトースト「⬆ LEVEL X!」（1.2秒表示）

### 12.2 経験値バー
- トップバーに表示（幅80px、緑色グラデーション）
- テキスト表示: 「現在EXP/必要EXP」

---

## 13. セーブ・ロード

### 13.1 仕様
- **localStorage** キー: `oreBreaker_v2`
- **30秒ごと** に自動保存
- **エクスポート**: Base64エンコード → クリップボード
- **インポート**: Base64文字列 → デコードして復元

### 13.2 保存データ
```js
{
    version: '2.0',
    timestamp: Date.now(),
    state: {
        resources, totalResources,
        level, exp, expToNext,
        baseClickDamage, critChance, critMultiplier,
        energy, energyRegen,
        combo,
        field: { slots },
        buildings: { cursor: 3, apprentice: 2, ... },
        upgrades: { click_power: 5, rare_chance: 3, ... },
        stats: { totalClicks, totalBroken, maxCombo }
    }
}
```

### 13.3 ロード時処理
- 状態復元後に `applyUpgradeEffects()` を呼び出し
- 派生ステータス（critChance等）をアップグレードLvから再計算

---

## 14. ゲームループ

### 14.1 タイミング
- **setInterval(gameTick, 200)**: 200msごとに実行
- **オートセーブ**: 30秒ごと

### 14.2 毎ティック処理
```
1. エネルギー回復 (+2/秒 × dt)
2. DPSダメージ適用（フォーカスターゲットに全集中）
   - フォーカスなければ自動選択
   - HP <= 0 なら breakOre()
3. コンボタイマー（2秒超過でリセット）
4. スキルクールダウン更新
5. ピッケルエフェクト生成（800msごと）
6. 鉱石補充（slots数まで）
7. UI更新（updateDisplay, renderSkills, renderSidebar）
```

---

## 15. UI/UXデザイン

### 15.1 配色
```css
--bg-main: #0a0a1a (body)
--bg-topbar: linear-gradient(#1a1a3e, #0f0f2e)
--bg-field: linear-gradient(#2d1b0e, #1a0f05, #0d0805) + radial-gradient
--bg-sidebar: linear-gradient(#1a1a2e, #12121e)
--bg-bottombar: linear-gradient(#1a1a3e, #0f0f2e)
--text-primary: #eee
--text-gold: #ffd700
--accent-green: #4ecca3
--accent-red: #e74c3c
```

### 15.2 フォント
- `'Courier New', monospace`
- 数値は太字（font-weight: bold）

### 15.3 サイドバー状態表示
| 状態 | CSS | 視覚 |
|------|-----|------|
| 購入可能 | .can-afford | 緑背景 |
| 資源不足 | .not-afford | コスト文字がグレー |
| 未解放 | .locked | 全体opacity:0.4、名前「???」 |
| 最大レベル | - | コスト欄に「✅MAX」 |

### 15.4 モーダル
- 統計（📊）: 累計資源、レベル、各種ステータス表示
- 設定（⚙）: 手動セーブ、エクスポート、インポート、リセット

---

## 16. 状態管理

```js
const state = {
    resources: 0,
    totalResources: 0,
    level: 1,
    exp: 0,
    expToNext: 10,
    baseClickDamage: 1,
    critChance: 0,        // %
    critMultiplier: 2.0,
    energy: 100,
    maxEnergy: 100,
    energyRegen: 2,
    combo: 0,
    lastBreakTime: 0,
    focusTargetId: null,

    field: { slots: 4, maxSlots: 12, ores: [] },
    buildings: { cursor: 0, apprentice: 0, ... },
    upgrades: { click_power: 0, rare_chance: 0, ... },
    skills: { multi_strike: { cooldown: 0, activeUntil: 0 }, ... },
    activeEffects: {
        multiStrike: false,
        frenzy: false,
        goldenEye: false,
        rareBonus: 1,
        dpsMultiplier: 1
    },
    stats: { totalClicks: 0, totalBroken: 0, maxCombo: 0 }
};
```

---

## 17. 技術仕様

### アーキテクチャ
- **1ファイル HTML + CSS + JS** (index.html)
- フレームワーク不使用（Vanilla JS）
- ES6+構文
- setInterval(200ms) ゲームループ

### アセット
- 個別PNG画像（output/フォルダ）
- 全25ファイル（プレイヤー1 + 鉱石14 + 施設10）

### レスポンシブ
- 100vw × 100vh 固定（overflow: hidden）
- CSS Grid ベースレイアウト
- サイドバーは内部スクロール可能

---

## 18. 未実装（将来拡張）

以下はv2.0仕様書に記載されているが現在未実装の機能:

| 機能 | 概要 | 優先度 |
|------|------|--------|
| ゴールデンオア | 定期出現の特殊鉱石（Cookie風） | 高 |
| 転生(Prestige) | リセット+永続ボーナス | 高 |
| 実績システム | 条件達成でボーナス | 中 |
| オフライン進行 | 離席中のDPS蓄積 | 中 |
| 施設アップグレード | 所持数ベースのDPS倍率 | 中 |
| シナジー | 施設間の相乗効果 | 低 |
| 深度システム | 鉱山の段階開放 | 低 |
| 装備システム | ピッケル種類 | 低 |
| 鉱石図鑑 | コレクション要素 | 低 |

---

## バージョン履歴

| バージョン | 内容 |
|-----------|------|
| v0.1 | 初期実装（基本クリック） |
| v0.2 | フィールド・スキル・仲間の設計 |
| v0.3 | Phase1-3実装完了、アイコンUI |
| v1.0 | Cookie Clicker準拠の施設設計 |
| v2.0 | v0.3とv1.0を統合。施設DPS型＋散らばりフィールド＋フルUI設計 |
| **v3.0** | **現行実装準拠。フォーカスターゲット、レベル制強化、鉱石強化タブ、レアバリアント、個別画像、経験値バー、資源獲得ポップアップ** |

---

以上、Ore Breaker Incremental v3.0 仕様書（現行実装準拠）。
