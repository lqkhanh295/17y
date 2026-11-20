#!/usr/bin/env node
/**
 * UI/UX Pro Max Search (Node.js engine)
 * BM25 search over UI/UX design intelligence datasets
 * Compatible with Node.js 18+ (zero dependencies)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');

const CSV_CONFIG = {
  style: {
    file: 'styles.csv',
    searchCols: ['Style ID', 'Style Category', 'Aliases', 'Keywords', 'Best For', 'Type', 'AI Prompt Keywords'],
    outputCols: ['Style ID', 'Style Category', 'Aliases', 'Status', 'Preferred Mode', 'Type', 'Keywords', 'Primary Colors', 'Effects & Animation', 'Best For', 'Performance', 'Accessibility', 'AI Prompt Keywords', 'Implementation Checklist', 'Design System Variables']
  },
  color: {
    file: 'colors.csv',
    searchCols: ['Product Type', 'Notes'],
    outputCols: ['Product Type', 'Primary', 'On Primary', 'Secondary', 'On Secondary', 'Accent', 'On Accent', 'Background', 'Foreground', 'Card', 'Card Foreground', 'Muted', 'Muted Foreground', 'Border', 'Destructive', 'Ring', 'Notes']
  },
  chart: {
    file: 'charts.csv',
    searchCols: ['Data Type', 'Keywords', 'Best Chart Type', 'When to Use', 'When NOT to Use', 'Accessibility Notes'],
    outputCols: ['Data Type', 'Keywords', 'Best Chart Type', 'Secondary Options', 'When to Use', 'When NOT to Use', 'Color Guidance', 'Accessibility Grade', 'Accessibility Notes', 'Library Recommendation']
  },
  landing: {
    file: 'landing.csv',
    searchCols: ['Pattern ID', 'Pattern Name', 'Aliases', 'Keywords', 'Conversion Optimization', 'Section Order'],
    outputCols: ['Pattern ID', 'Pattern Name', 'Aliases', 'Keywords', 'Section Order', 'Primary CTA Placement', 'Color Strategy', 'Conversion Optimization']
  },
  product: {
    file: 'products.csv',
    searchCols: ['Product Type', 'Keywords', 'Primary Style Recommendation', 'Key Considerations'],
    outputCols: ['Product Type', 'Keywords', 'Primary Style Recommendation', 'Secondary Styles', 'Landing Page Pattern', 'Dashboard Style (if applicable)', 'Color Palette Focus']
  },
  ux: {
    file: 'ux-guidelines.csv',
    searchCols: ['Category', 'Issue', 'Description', 'Platform'],
    outputCols: ['Category', 'Issue', 'Platform', 'Description', 'Do', "Don't", 'Code Example Good', 'Code Example Bad', 'Severity']
  },
  typography: {
    file: 'typography.csv',
    searchCols: ['Font Pairing Name', 'Category', 'Mood/Style Keywords', 'Best For', 'Heading Font', 'Body Font'],
    outputCols: ['Font Pairing Name', 'Category', 'Heading Font', 'Body Font', 'Mood/Style Keywords', 'Best For', 'Google Fonts URL', 'CSS Import', 'Tailwind Config']
  },
  icons: {
    file: 'icons.csv',
    searchCols: ['Category', 'Icon Name', 'Keywords', 'Best For', 'Library'],
    outputCols: ['Category', 'Icon Name', 'Keywords', 'Library', 'Import Code', 'Usage', 'Best For', 'Style', 'Semantic Role']
  },
  gsap: {
    file: 'motion.csv',
    searchCols: ['Category', 'Intensity Tier', 'Keywords', 'Trigger'],
    outputCols: ['Category', 'Intensity Tier', 'Trigger', 'Duration', 'Easing', 'GSAP Snippet', 'Framework Notes', 'Do', "Don't"]
  },
  react: {
    file: 'react-performance.csv',
    searchCols: ['Category', 'Issue', 'Keywords', 'Description'],
    outputCols: ['Category', 'Issue', 'Platform', 'Description', 'Do', "Don't", 'Code Example Good', 'Code Example Bad', 'Severity']
  },
  web: {
    file: 'app-interface.csv',
    searchCols: ['Category', 'Issue', 'Keywords', 'Description'],
    outputCols: ['Category', 'Issue', 'Platform', 'Description', 'Do', "Don't", 'Code Example Good', 'Code Example Bad', 'Severity']
  },
  'google-fonts': {
    file: 'google-fonts.csv',
    searchCols: ['Family', 'Category', 'Stroke', 'Classifications', 'Keywords', 'Subsets', 'Designers'],
    outputCols: ['Family', 'Category', 'Stroke', 'Classifications', 'Styles', 'Subsets', 'Designers', 'Google Fonts URL']
  }
};

const STACK_MAP = {
  react: 'stacks/react.csv',
  nextjs: 'stacks/nextjs.csv',
  vue: 'stacks/vue.csv',
  svelte: 'stacks/svelte.csv',
  astro: 'stacks/astro.csv',
  swiftui: 'stacks/swiftui.csv',
  'react-native': 'stacks/react-native.csv',
  flutter: 'stacks/flutter.csv',
  nuxtjs: 'stacks/nuxtjs.csv',
  'nuxt-ui': 'stacks/nuxt-ui.csv',
  'html-tailwind': 'stacks/html-tailwind.csv',
  shadcn: 'stacks/shadcn.csv',
  'jetpack-compose': 'stacks/jetpack-compose.csv',
  threejs: 'stacks/threejs.csv',
  angular: 'stacks/angular.csv',
  laravel: 'stacks/laravel.csv'
};

const STOPWORDS = new Set([
  'to', 'in', 'on', 'at', 'is', 'of', 'by', 'or', 'an', 'if', 'no', 'so',
  'do', 'be', 'we', 'it', 'as', 'the', 'and', 'for', 'are', 'was'
]);

function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentField = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        // skip \r
      } else if (char === '\n') {
        row.push(currentField);
        lines.push(row);
        row = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  if (currentField.length > 0 || row.length > 0) {
    row.push(currentField);
    lines.push(row);
  }

  if (lines.length === 0) return [];
  const headers = lines[0].map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i];
    if (values.length === 1 && values[0].trim() === '') continue;
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j] !== undefined ? values[j].trim() : '';
    }
    rows.push(obj);
  }
  return rows;
}

function tokenize(text) {
  if (!text) return [];
  const clean = String(text).toLowerCase().replace(/[^\w\s]/g, ' ');
  return clean.split(/\s+/).filter(w => w.length >= 2 && !STOPWORDS.has(w));
}

class BM25 {
  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
    this.corpus = [];
    this.docLengths = [];
    this.avgdl = 0;
    this.idf = new Map();
    this.termFreqs = [];
  }

  fit(documents) {
    this.corpus = documents;
    this.termFreqs = [];
    this.docLengths = [];
    const docFreqs = new Map();
    const N = documents.length;
    let totalLen = 0;

    for (const doc of documents) {
      const tokens = tokenize(doc);
      this.docLengths.push(tokens.length);
      totalLen += tokens.length;
      const tf = new Map();
      const seen = new Set();
      for (const t of tokens) {
        tf.set(t, (tf.get(t) || 0) + 1);
        if (!seen.has(t)) {
          seen.add(t);
          docFreqs.set(t, (docFreqs.get(t) || 0) + 1);
        }
      }
      this.termFreqs.push(tf);
    }

    this.avgdl = N > 0 ? totalLen / N : 0;
    for (const [term, df] of docFreqs.entries()) {
      this.idf.set(term, Math.log((N - df + 0.5) / (df + 0.5) + 1));
    }
  }

  score(queryTokens) {
    const scores = new Array(this.corpus.length).fill(0);
    for (let i = 0; i < this.corpus.length; i++) {
      const tf = this.termFreqs[i];
      const docLen = this.docLengths[i];
      let score = 0;
      for (const q of queryTokens) {
        if (!tf.has(q)) continue;
        const idfVal = this.idf.get(q) || 0;
        const f = tf.get(q);
        const numerator = f * (this.k1 + 1);
        const denominator = f + this.k1 * (1 - this.b + this.b * (docLen / (this.avgdl || 1)));
        score += idfVal * (numerator / denominator);
      }
      scores[i] = score;
    }
    return scores;
  }
}

function searchDomain(query, domainKey, maxResults = 3) {
  const config = CSV_CONFIG[domainKey];
  if (!config) return { error: `Unknown domain: ${domainKey}` };

  const filePath = path.join(DATA_DIR, config.file);
  if (!fs.existsSync(filePath)) {
    return { error: `File not found: ${filePath}` };
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(raw);

  const documents = rows.map(r => {
    return config.searchCols.map(col => r[col] || '').join(' ');
  });

  const bm25 = new BM25();
  bm25.fit(documents);

  const queryTokens = tokenize(query);
  const scores = bm25.score(queryTokens);

  const ranked = rows
    .map((row, idx) => ({ row, score: scores[idx] }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return {
    query,
    domain: domainKey,
    file: config.file,
    count: ranked.length,
    results: ranked.map(r => {
      const out = {};
      for (const col of config.outputCols) {
        if (r.row[col] !== undefined) out[col] = r.row[col];
      }
      return out;
    })
  };
}

function searchStack(query, stackName, maxResults = 3) {
  const relPath = STACK_MAP[stackName];
  if (!relPath) return { error: `Unknown stack: ${stackName}` };
  const filePath = path.join(DATA_DIR, relPath);
  if (!fs.existsSync(filePath)) return { error: `File not found: ${filePath}` };

  const raw = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(raw);
  const searchCols = ['Category', 'Guideline', 'Description', 'Do', "Don't", 'Code Good', 'Code Bad'];
  const outputCols = ['Category', 'Guideline', 'Description', 'Do', "Don't", 'Code Good', 'Code Bad', 'Severity', 'Docs URL'];

  const documents = rows.map(r => searchCols.map(c => r[c] || '').join(' '));
  const bm25 = new BM25();
  bm25.fit(documents);
  const queryTokens = tokenize(query);
  const scores = bm25.score(queryTokens);

  const ranked = rows
    .map((row, idx) => ({ row, score: scores[idx] }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return {
    query,
    stack: stackName,
    file: relPath,
    count: ranked.length,
    results: ranked.map(r => {
      const out = {};
      for (const c of outputCols) {
        if (r.row[c] !== undefined) out[c] = r.row[c];
      }
      return out;
    })
  };
}

function formatOutput(res) {
  if (res.error) return `Error: ${res.error}`;
  const out = [];
  if (res.stack) {
    out.push('## UI Pro Max Stack Guidelines');
    out.push(`**Stack:** ${res.stack} | **Query:** ${res.query}`);
  } else {
    out.push('## UI Pro Max Search Results');
    out.push(`**Domain:** ${res.domain} | **Query:** ${res.query}`);
  }
  out.push(`**Source:** ${res.file} | **Found:** ${res.count} results\n`);

  if (res.count === 0) {
    out.push('No matches found. Try broader keywords.');
    return out.join('\n');
  }

  res.results.forEach((row, idx) => {
    out.push(`### Result ${idx + 1}`);
    for (const [key, val] of Object.entries(row)) {
      out.push(`- **${key}:** ${val}`);
    }
    out.push('');
  });

  return out.join('\n');
}

// CLI args parsing
const args = process.argv.slice(2);
if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
  console.log(`UI/UX Pro Max Search (Node.js engine)
Usage:
  node search.mjs "<query>" [--domain <domain>] [--stack <stack>] [--max-results <num>]
  node search.mjs "<query>" --design-system

Domains: ${Object.keys(CSV_CONFIG).join(', ')}
Stacks: ${Object.keys(STACK_MAP).join(', ')}
`);
  process.exit(0);
}

const query = args[0];
let domain = null;
let stack = null;
let maxResults = 3;
let designSystem = false;

for (let i = 1; i < args.length; i++) {
  if ((args[i] === '--domain' || args[i] === '-d') && args[i + 1]) {
    domain = args[++i];
  } else if ((args[i] === '--stack' || args[i] === '-s') && args[i + 1]) {
    stack = args[++i];
  } else if (args[i] === '--max-results' && args[i + 1]) {
    maxResults = parseInt(args[++i], 10) || 3;
  } else if (args[i] === '--design-system') {
    designSystem = true;
  }
}

if (designSystem) {
  // Aggregate design system
  console.log(`=== DESIGN SYSTEM RECOMMENDATIONS FOR: "${query}" ===\n`);
  const domainsToSearch = ['product', 'style', 'color', 'landing', 'typography'];
  for (const d of domainsToSearch) {
    const res = searchDomain(query, d, d === 'style' || d === 'color' ? 2 : 1);
    console.log(formatOutput(res));
    console.log('--------------------------------------------------\n');
  }
} else if (stack) {
  const res = searchStack(query, stack, maxResults);
  console.log(formatOutput(res));
} else {
  // Search specified domain or auto search across style/ux
  const targetDomain = domain || 'style';
  const res = searchDomain(query, targetDomain, maxResults);
  console.log(formatOutput(res));
}
