/**
 * Emoji Removal Verification Script
 * Comprehensive scan for remaining emojis and EmojiReplacer integration test
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Comprehensive emoji detection patterns
const EMOJI_PATTERNS = {
  // Unicode emoji ranges
  general: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
  
  // Specific common emojis
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

// File extensions to scan
const SCAN_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.css', '.html'];

// Directories to scan
const SCAN_DIRECTORIES = ['src', 'public'];

// Files to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'emoji-verification-script.js'
];

class EmojiVerificationScanner {
  constructor() {
    this.results = {
      totalFiles: 0,
      scannedFiles: 0,
      emojisFound: [],
      cleanFiles: [],
      errors: [],
      summary: {}
    };
  }

  /**
   * Scan a single file for emojis
   */
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const emojisInFile = [];

      // Test each pattern
      Object.entries(EMOJI_PATTERNS).forEach(([category, pattern]) => {
        const matches = [...content.matchAll(pattern)];
        matches.forEach(match => {
          emojisInFile.push({
            emoji: match[0],
            category,
            position: match.index,
            line: this.getLineNumber(content, match.index),
            context: this.getContext(content, match.index)
          });
        });
      });

      this.results.scannedFiles++;

      if (emojisInFile.length > 0) {
        this.results.emojisFound.push({
          file: filePath,
          emojis: emojisInFile
        });
        return false; // File has emojis
      } else {
        this.results.cleanFiles.push(filePath);
        return true; // File is clean
      }
    } catch (error) {
      this.results.errors.push({
        file: filePath,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get line number for a position in text
   */
  getLineNumber(content, position) {
    return content.substring(0, position).split('\n').length;
  }

  /**
   * Get context around emoji position
   */
  getContext(content, position) {
    const start = Math.max(0, position - 50);
    const end = Math.min(content.length, position + 50);
    return content.substring(start, end);
  }

  /**
   * Recursively scan directory
   */
  scanDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      items.forEach(item => {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);

        // Skip excluded patterns
        if (EXCLUDE_PATTERNS.some(pattern => itemPath.includes(pattern))) {
          return;
        }

        if (stat.isDirectory()) {
          this.scanDirectory(itemPath);
        } else if (stat.isFile()) {
          this.results.totalFiles++;
          
          // Check if file extension should be scanned
          const ext = path.extname(itemPath);
          if (SCAN_EXTENSIONS.includes(ext)) {
            this.scanFile(itemPath);
          }
        }
      });
    } catch (error) {
      this.results.errors.push({
        directory: dirPath,
        error: error.message
      });
    }
  }

  /**
   * Run complete scan
   */
  scan() {
    console.log('🔍 Starting comprehensive emoji verification scan...\n');

    SCAN_DIRECTORIES.forEach(dir => {
      const dirPath = path.join(__dirname, dir);
      if (fs.existsSync(dirPath)) {
        console.log(`📁 Scanning directory: ${dir}`);
        this.scanDirectory(dirPath);
      }
    });

    this.generateSummary();
    this.printResults();
  }

  /**
   * Generate summary statistics
   */
  generateSummary() {
    this.results.summary = {
      totalFiles: this.results.totalFiles,
      scannedFiles: this.results.scannedFiles,
      cleanFiles: this.results.cleanFiles.length,
      filesWithEmojis: this.results.emojisFound.length,
      totalEmojis: this.results.emojisFound.reduce((sum, file) => sum + file.emojis.length, 0),
      errors: this.results.errors.length,
      cleanPercentage: this.results.scannedFiles > 0 ? 
        ((this.results.cleanFiles.length / this.results.scannedFiles) * 100).toFixed(1) : 0
    };
  }

  /**
   * Print detailed results
   */
  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 EMOJI VERIFICATION RESULTS');
    console.log('='.repeat(60));

    // Summary
    console.log('\n📈 SUMMARY:');
    console.log(`   Total files found: ${this.results.summary.totalFiles}`);
    console.log(`   Files scanned: ${this.results.summary.scannedFiles}`);
    console.log(`   Clean files: ${this.results.summary.cleanFiles}`);
    console.log(`   Files with emojis: ${this.results.summary.filesWithEmojis}`);
    console.log(`   Total emojis found: ${this.results.summary.totalEmojis}`);
    console.log(`   Clean percentage: ${this.results.summary.cleanPercentage}%`);

    // Emojis found
    if (this.results.emojisFound.length > 0) {
      console.log('\n❌ EMOJIS FOUND:');
      this.results.emojisFound.forEach(fileResult => {
        console.log(`\n   📄 ${fileResult.file}:`);
        fileResult.emojis.forEach(emoji => {
          console.log(`      ${emoji.emoji} (${emoji.category}) at line ${emoji.line}`);
          console.log(`         Context: "${emoji.context.trim()}"`);
        });
      });
    } else {
      console.log('\n✅ NO EMOJIS FOUND - All files are clean!');
    }

    // Errors
    if (this.results.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      this.results.errors.forEach(error => {
        console.log(`   ${error.file || error.directory}: ${error.error}`);
      });
    }

    // Verification status
    console.log('\n' + '='.repeat(60));
    if (this.results.summary.totalEmojis === 0 && this.results.errors.length === 0) {
      console.log('🎉 VERIFICATION PASSED: No emojis found in codebase!');
      console.log('✅ Task 4.5 - Emoji removal verification: COMPLETE');
    } else if (this.results.summary.totalEmojis > 0) {
      console.log('❌ VERIFICATION FAILED: Emojis still present in codebase');
      console.log(`   ${this.results.summary.totalEmojis} emojis need to be replaced`);
    } else {
      console.log('⚠️  VERIFICATION INCOMPLETE: Errors occurred during scan');
    }
    console.log('='.repeat(60));
  }

  /**
   * Export results to JSON file
   */
  exportResults() {
    const outputPath = path.join(__dirname, 'emoji-verification-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Results exported to: ${outputPath}`);
  }
}

// Test EmojiReplacer integration
async function testEmojiReplacerIntegration() {
  console.log('\n🧪 Testing EmojiReplacer integration...');
  
  try {
    // Try to import the EmojiReplacer system
    const { initializeEmojiReplacer, processComponent, getSystemStatus } = await import('./src/services/EmojiReplacer/index.js');
    
    console.log('✅ EmojiReplacer system imported successfully');
    
    // Initialize the system
    const initResult = await initializeEmojiReplacer();
    console.log(`✅ EmojiReplacer initialization: ${initResult.success ? 'SUCCESS' : 'FAILED'}`);
    
    if (initResult.success) {
      // Test processing a component with emojis
      const testComponent = `
        function TestComponent() {
          return (
            <div>
              <h1>👨‍⚕️ Therapist Console</h1>
              <button>➕ Add Child</button>
              <span>📊 Analytics</span>
            </div>
          );
        }
      `;
      
      console.log('🧪 Testing emoji replacement on sample component...');
      const result = await processComponent(testComponent, 'TestComponent');
      
      if (result.replacements && result.replacements.length > 0) {
        console.log(`✅ Successfully replaced ${result.replacements.length} emojis`);
        result.replacements.forEach(replacement => {
          console.log(`   ${replacement.emoji} → ${replacement.replacedWith}`);
        });
      } else {
        console.log('ℹ️  No emojis found in test component');
      }
      
      // Get system status
      const status = getSystemStatus();
      console.log(`✅ System status: ${status.initialized ? 'INITIALIZED' : 'NOT INITIALIZED'}`);
      console.log(`   Health: ${status.health.status}`);
      
    } else {
      console.log(`❌ EmojiReplacer initialization failed: ${initResult.message}`);
    }
    
  } catch (error) {
    console.log(`❌ EmojiReplacer integration test failed: ${error.message}`);
    console.log('   This may indicate the system is not properly integrated');
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Task 4.5: Emoji Removal Verification\n');
  
  // Step 1: Scan for remaining emojis
  const scanner = new EmojiVerificationScanner();
  scanner.scan();
  scanner.exportResults();
  
  // Step 2: Test EmojiReplacer integration
  await testEmojiReplacerIntegration();
  
  console.log('\n🏁 Verification complete!');
}

// Run the verification
main().catch(console.error);