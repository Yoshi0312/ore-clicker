# Ore Breaker 仕様書 v3.2

最終更新: 2026-02-07

## 1. 概要
- ジャンル: インクリメンタル採掘ゲーム（クリック + 放置）
- プラットフォーム: Webブラウザ（`index.html` 単体実行）
- 主な進行軸:
  - クリック採掘
  - 施設DPS
  - クリティカル
  - コンボ
  - オフライン報酬
  - 転生（Prestige）

## 2. 現在の実装範囲
### 2.1 採掘・戦闘ループ
- 鉱石クリックでダメージ
- DPSはフォーカスターゲットに継続ダメージ
- クリティカル率/倍率アップグレードあり
- コンボ段階に応じたボーナスあり
- スキル（連撃/破砕/レア率上昇/狂化/即死）あり

### 2.2 経済
- 通常通貨（資源）で施設・アップグレード購入
- 施設は累計資源で解放
- 転生ポイントで永続スキル購入

### 2.3 オフライン
- 最低30秒離脱で報酬計算
- 最大24時間まで
- 係数: DPSの20%

### 2.4 深度（Depth）
- `DEPTH_TABLE` に帯（startDepth/endDepth）定義
- 深度倍率反映:
  - 鉱石最大HP: `hpMul`
  - 破壊報酬: `rewardMul`
- 深度1帯は `hpMul=1.0`, `rewardMul=1.0`

### 2.5 図鑑（Dex）
- モーダル導線あり（メニューボタン）
- タブ: 鉱石 / ボス / 施設
- 表示ルール:
  - 未発見: シルエット + `???`
  - 発見済み: 名前表示
  - 討伐/取得数1以上: 説明文表示
- フィルタ:
  - ソート: 未発見優先 / レアリティ順
  - テキスト検索: 名前部分一致

### 2.6 ボス関連データ
- `src/data/bosses.js` に節目ボス定義あり（10/20/30...）
- ボス図鑑データあり
- `onBossDefeated(bossId, shardReward)` フック実装済み
  - `bossShards` 加算
  - ボス図鑑の seen/defeated 更新

### 2.7 後半施設（super_expert_miner）
- `super_expert_miner` 実装済み
- 通常通貨では購入不可
- `bossShards` 専用で購入
- 施設一覧でロック時に必要欠片/現在欠片を表示
- `bossShards` はセーブ対象

## 3. データ構造（主要）
- `state.resources`: 通常通貨
- `state.bossShards`: ボス欠片通貨
- `state.depth`: 深度
- `state.buildings`: 施設所持数
- `state.upgrades`: 強化レベル
- `state.dex`: 図鑑進行（ores/bosses/buildings）
- `state.prestige`: 転生データ

## 4. アセット配置
- `assets/sprites/ores`
- `assets/sprites/buildings`
- `assets/sprites/characters`
- 移行ツール: `tools/migrate_assets.js`

## 5. 既知の未接続/今後課題
- ボス戦本体（深度節目での自動出現/戦闘フェーズ）はデータ主導で未接続
- 深度進行（`state.depthProgress`, `state.depthTarget`）の完全導入は未完
- `src/` 分割モジュールは雛形中心で、実行本体は `index.html`

## 6. 互換性メモ
- 既存セーブとの互換維持のため、追加フィールドはデフォルト補完する
- 既存コアループ（クリック採掘 / 施設DPS / クリティカル / コンボ / オフライン / 転生）は維持