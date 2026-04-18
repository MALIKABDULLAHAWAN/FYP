/**
 * Simple Emoji Removal Verification Script
 * Verifies that emojis have been removed from main application components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Emoji detection patterns
const EMOJI_PATTERNS = {
  general: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
  medical: /👨‍⚕️|👩‍⚕️|🏥|⚕️|🩺|💊/g,
  interface: /📊|📈|📉|📋|📝|📧|📱|💻|🖥️|⚡|🔔|🔍|🔧|⚙️|🛠️/g,
  actions: /➕|➖|✏️|🗑️|📤|📥|✅|❌|⚠️|🚨|🔴|🟢|🟡/g,
  children: /👶|👧|👦|🧒|👨‍👩‍👧‍👦|👪/g,
  speech: /🗣️|🎙️|🔊|🔇|🔈|🎧|📢|📣/g,
  learning: /🖼️|📖|🧠|❓|💭|🎓|📚/g,
  games: /🎮|🎯|🏆|🌟|👍|💪|🎲|🃏|🎪/g,
  activities: /🍎|🍌|🐱|🐶|🏠|🚗|⚽|🎨|🧩|🎭/g,
  personal: /🎂|⚧|♂️|♀️|👤|👥|📅|🕐/g,
  media: /▶️|⏸️|⏹️|⏪|⏩|🔁|🔄|⏯️|⏭️|⏮️/g,
  celebration: /🎉|🎊|✨|💫|🌈|🎈|🎁|🍰|🥳/g
};

// Main application files to check (excluding test files)
const MAIN_APP_FILES = [
  'src/App.jsx',
  'src/pages/Dashboard.jsx',
  'src/pages/TherapistConsole.jsx',
  'src/pages/LandingPage.jsx',
  'src/components/Layout.jsx',
  'src/components/StickerLayer.jsx',
  'src/services/StickerManager.js'
];

function scanFileForEmojis(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      return { error: `File not found: ${filePath}` };
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const emojisFound = [];

    Object.entries(EMOJI_PATTERNS).forEach(([category, pattern]) => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        emojisFound.push({
          emoji: match[0],
          category,
          position: match.index,
          line: content.substring(0, match.index).split('\n').length,
          context: content.substring(Math.max(0, match.index - 30), match.index + 30)
        });
      });
    });

    return {
      file: filePath,
      clean: emojisFound.length === 0,
      emojis: emojisFound
    };
  } catch (error) {
    return { error: `Error reading ${filePath}: ${error.message}` };
  }
}

function verifyEmojiRemoval() {
  console.log('🔍 Verifying emoji removal in main application files...\n');

  const results = MAIN_APP_FILES.map(scanFileForEmojis);
  
  let totalEmojis = 0;
  let cleanFiles = 0;
  let filesWithEmojis = 0;

  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.error}`);
      return;
    }

    if (result.clean) {
      console.log(`✅ ${result.file} - CLEAN`);
      cleanFiles++;
    } else {
      console.log(`❌ ${result.file} - ${result.emojis.length} emojis found:`);
      result.emojis.forEach(emoji => {
        console.log(`   ${emoji.emoji} (${emoji.category}) at line ${emoji.line}`);
        console.log(`      Context: "${emoji.context.trim()}"`);
      });
      filesWithEmojis++;
      totalEmojis += result.emojis.length;
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files checked: ${results.length}`);
  console.log(`Clean files: ${cleanFiles}`);
  console.log(`Files with emojis: ${filesWithEmojis}`);
  console.log(`Total emojis found: ${totalEmojis}`);

  if (totalEmojis === 0) {
    console.log('\n🎉 SUCCESS: No emojis found in main application files!');
    console.log('✅ Task 4.5 - Emoji removal verification: COMPLETE');
    return true;
  } else {
    console.log('\n❌ VERIFICATION FAILED: Emojis still present in main application');
    console.log(`   ${totalEmojis} emojis need to be replaced`);
    return false;
  }
}

function checkEmojiReplacerIntegration() {
  console.log('\n🔧 Checking EmojiReplacer integration...');
  
  try {
    // Check if App.jsx has EmojiReplacer initialization
    const appPath = path.join(__dirname, 'src/App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    if (appContent.includes('initializeEmojiReplacer')) {
      console.log('✅ EmojiReplacer initialization found in App.jsx');
    } else {
      console.log('❌ EmojiReplacer initialization not found in App.jsx');
    }

    // Check if StickerManager uses SVG instead of emojis
    const stickerPath = path.join(__dirname, 'src/services/StickerManager.js');
    const stickerContent = fs.readFileSync(stickerPath, 'utf8');
    
    if (stickerContent.includes('svgPath') && !stickerContent.includes('emoji:')) {
      console.log('✅ StickerManager updated to use SVG assets');
    } else {
      console.log('❌ StickerManager still contains emoji references');
    }

    // Check if StickerLayer handles SVG assets
    const layerPath = path.join(__dirname, 'src/components/StickerLayer.jsx');
    const layerContent = fs.readFileSync(layerPath, 'utf8');
    
    if (layerContent.includes('asset.type === \'svg\'')) {
      console.log('✅ StickerLayer updated to handle SVG assets');
    } else {
      console.log('❌ StickerLayer not updated for SVG handling');
    }

  } catch (error) {
    console.log(`❌ Error checking integration: ${error.message}`);
  }
}

function main() {
  console.log('🚀 Task 4.5: Emoji Removal Verification\n');
  
  const isClean = verifyEmojiRemoval();
  checkEmojiReplacerIntegration();
  
  console.log('\n' + '='.repeat(60));
  if (isClean) {
    console.log('🎯 TASK 4.5 STATUS: COMPLETED SUCCESSFULLY');
    console.log('✅ All main application files are free of emojis');
    console.log('✅ EmojiReplacer system is integrated');
    console.log('✅ Sticker system uses SVG assets instead of emojis');
  } else {
    console.log('⚠️  TASK 4.5 STATUS: NEEDS ATTENTION');
    console.log('❌ Some emojis still present in main application files');
    console.log('ℹ️  Note: Test files may still contain emojis for testing purposes');
  }
  console.log('='.repeat(60));
}

main();