PROJECT_GUIDE.md
Ore Breaker（インクリメント採掘ゲーム）開発引き継ぎ資料
1. プロジェクト概要
ゲームジャンル

インクリメントゲーム（クリック＋放置）

採掘テーマ（鉱石・施設・自動化）

プラットフォーム

Web（ブラウザ）

スマホ縦画面を主軸、PC対応

将来的に PWA 化を想定

現在の開発状況

v3.0 相当の機能が実装済み

クリック採掘

自動DPS（施設）

クリティカル・コンボ

オフライン進行

転生（Prestige）

画像素材（32x32ドット絵）完備

2. 今後の開発方針（最重要）
採用する拡張軸

以下の3本柱を中心に開発を進める

深度（Depth）システム

ボス（低頻度・節目型）

図鑑（Dex / Collection）

⚠️

PvP / ソーシャル要素は入れない

課金・広告は現時点では考慮しない

3. フォルダ構成（正）
ore-breaker/
  index.html
  src/
    main.js
    state.js
    save.js

    data/
      ores.js
      buildings.js
      upgrades.js
      skills.js
      depth.js        # 深度テーブル
      bosses.js       # ボス定義
      dex.js          # 図鑑定義

    systems/
      mining.js
      combat.js
      economy.js
      depth.js        # 深度進行ロジック
      boss.js         # ボス出現/報酬

    ui/
      render.js
      sidebar.js
      modal.js
      dex.js          # 図鑑UI

  assets/
    sprites/
      ores/
      buildings/
      characters/

  tools/
    migrate_assets.js

4. 画像資産ルール（重要）
基本ルール

画像ファイル名 = ID

ID は snake_case

将来の拡張を考え、末尾の数字は使わない

鉱石（ores）
stone.png
coal.png
copper.png
iron.png
silver.png
gold.png
aluminum.png
crystal.png
diamond.png
meteorite.png
mithril.png
orichalcum.png
dark_matter.png
philosophers_stone.png

施設（buildings）
auto_clicker.png
apprentice_miner.png
expert_miner.png
rock_drill.png
excavator.png
mine.png
dwarf_guild.png
mining_golem.png
dimensional_mining_portal.png
singularity_miner.png
super_expert_miner.png   # 後半解放用

キャラ
character_girl1.png

5. 深度（Depth）システム仕様
概要

採掘は「深度（Depth）」単位で進行する

一定数の鉱石を破壊すると次の深度へ進む

基本変数
state.depth
state.depthProgress
state.depthTarget

深度ごとの変化

出現鉱石テーブル

HP倍率

報酬倍率

ボス出現フラグ

例
{
  depth: 1,
  ores: ["stone", "coal"],
  hpMul: 1.0,
  rewardMul: 1.0
}

6. ボス仕様（低頻度）
出現条件

10深度ごとに確定出現

10, 20, 30, ...

ボス特徴

高HP

専用画像

コンボ・DPSの総合力が試される

報酬

初回撃破：

図鑑登録

永続アイテム（欠片など）

2回目以降：

通貨＋欠片

7. 図鑑（Dex）仕様
対象

鉱石

ボス

施設（任意）

フラグ
dex.seen[id]
dex.defeated[id]

表示ルール

未遭遇：シルエット表示

遭遇済：名前表示

撃破済：説明文＋画像解放

UI

モーダル表示

タブ切り替え（Ore / Boss / Facility）

8. セーブデータ方針
必須

version を必ず保持

後方互換を意識する

保存内容
{
  version: 3,
  resources,
  buildings,
  upgrades,
  skills,
  depth,
  dex,
  prestige
}

9. 実装上の注意（AI向け指示）

既存仕様を壊さないこと

数値バランスは「気持ちよさ」優先

最初は UIを増やしすぎない

データ駆動（data/ 以下で完結）を意識

魔法数は直接書かず、定数 or data に寄せる

10. 優先実装ロードマップ

assets 整理＆参照パス統一

深度システム導入

ボス実装（節目型）

図鑑（最小UI）

後半施設（super_expert_miner）解放