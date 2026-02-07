#!/usr/bin/env node
// tools/migrate_assets.js
// output/ から assets/sprites/ へ画像をコピーし、リネームも行う
// 使い方: node tools/migrate_assets.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'output');

// コピー定義: [コピー元ファイル名, コピー先サブディレクトリ, コピー先ファイル名]
const MAPPING = [
  // 鉱石
  ['stone1.png',                    'ores',       'stone.png'],
  ['coal.png',                      'ores',       'coal.png'],
  ['copper.png',                    'ores',       'copper.png'],
  ['iron.png',                      'ores',       'iron.png'],
  ['silver.png',                    'ores',       'silver.png'],
  ['gold.png',                      'ores',       'gold.png'],
  ['aluminum1.png',                 'ores',       'aluminum.png'],
  ['crystal.png',                   'ores',       'crystal.png'],
  ['diamond.png',                   'ores',       'diamond.png'],
  ['meteorite.png',                 'ores',       'meteorite.png'],
  ['mithril.png',                   'ores',       'mithril.png'],
  ['orichalcum1.png',               'ores',       'orichalcum.png'],
  ['dark_matter.png',               'ores',       'dark_matter.png'],
  ['philosophers_stone.png',        'ores',       'philosophers_stone.png'],
  // 施設
  ['auto_clicker.png',              'buildings',  'auto_clicker.png'],
  ['apprentice_miner.png',          'buildings',  'apprentice_miner.png'],
  ['expert_miner.png',              'buildings',  'expert_miner.png'],
  ['rock_drill.png',                'buildings',  'rock_drill.png'],
  ['excavator.png',                 'buildings',  'excavator.png'],
  ['mine.png',                      'buildings',  'mine.png'],
  ['mining_golem.png',              'buildings',  'mining_golem.png'],
  ['dwarf_guild.png',               'buildings',  'dwarf_guild.png'],
  ['dimensional_mining_portal.png', 'buildings',  'dimensional_mining_portal.png'],
  ['singularity_miner.png',         'buildings',  'singularity_miner.png'],
  // キャラクター
  ['character_girl1.png',           'characters', 'character_girl1.png'],
];

let ok = 0;
let skip = 0;
let fail = 0;

for (const [srcFile, subDir, dstFile] of MAPPING) {
  const from = path.join(SRC, srcFile);
  const toDir = path.join(ROOT, 'assets', 'sprites', subDir);
  const to = path.join(toDir, dstFile);

  if (!fs.existsSync(from)) {
    console.log(`[SKIP] ${srcFile} が見つかりません`);
    skip++;
    continue;
  }

  fs.mkdirSync(toDir, { recursive: true });

  try {
    fs.copyFileSync(from, to);
    const renamed = srcFile !== dstFile ? ` (${srcFile} → ${dstFile})` : '';
    console.log(`[OK]   ${subDir}/${dstFile}${renamed}`);
    ok++;
  } catch (e) {
    console.log(`[FAIL] ${srcFile}: ${e.message}`);
    fail++;
  }
}

console.log(`\n完了: ${ok} コピー, ${skip} スキップ, ${fail} 失敗`);
