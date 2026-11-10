/**
 * ============================================================================
 * FLUFFY BIRD – Fly With Your Own Photo!
 * Complete, responsive browser game inspired by Flappy Bird.
 * HTML5 Canvas, Web Audio API, MediaRecorder, IndexedDB & LocalStorage.
 * ============================================================================
 */

(function () {
  'use strict';

  // Polyfill roundRect for canvas if needed in older browser engines
  if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (typeof r === 'undefined') r = 4;
      if (typeof r === 'number') r = [r, r, r, r];
      const [tl, tr, br, bl] = r;
      this.beginPath();
      this.moveTo(x + tl, y);
      this.lineTo(x + w - tr, y);
      this.quadraticCurveTo(x + w, y, x + w, y + tr);
      this.lineTo(x + w, y + h - br);
      this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
      this.lineTo(x + bl, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - bl);
      this.lineTo(x, y + tl);
      this.quadraticCurveTo(x, y, x + tl, y);
      this.closePath();
      return this;
    };
  }

  /* ==========================================================================
     CONSTANTS & PALETTES
     ========================================================================== */
  const V_WIDTH = 420;
  const V_HEIGHT = 640;
  const GROUND_HEIGHT = 90;

  const PLUMAGE_COLORS = [
    { id: 'yellow', label: 'Sunny Yellow', main: '#fde047', dark: '#eab308', highlight: '#fef9c3' },
    { id: 'blue', label: 'Sky Blue', main: '#67e8f9', dark: '#06b6d4', highlight: '#cffafe' },
    { id: 'pink', label: 'Blossom Pink', main: '#f472b6', dark: '#db2777', highlight: '#fce7f3' },
    { id: 'mint', label: 'Mint Green', main: '#6ee7b7', dark: '#059669', highlight: '#d1fae5' },
    { id: 'lavender', label: 'Lavender', main: '#c084fc', dark: '#9333ea', highlight: '#f3e8ff' },
    { id: 'coral', label: 'Coral Orange', main: '#fb923c', dark: '#ea580c', highlight: '#ffedd5' },
    { id: 'white', label: 'Snow Fluff', main: '#f8fafc', dark: '#cbd5e1', highlight: '#ffffff' }
  ];

  const WING_COLORS = [
    { id: 'match', label: 'Match Body', color: null },
    { id: 'white', label: 'Snow White', color: '#ffffff' },
    { id: 'gold', label: 'Golden Wings', color: '#f59e0b' },
    { id: 'sky', label: 'Sky Blue', color: '#38bdf8' },
    { id: 'rose', label: 'Ruby Pink', color: '#f43f5e' },
    { id: 'violet', label: 'Deep Violet', color: '#8b5cf6' },
    { id: 'emerald', label: 'Emerald', color: '#10b981' }
  ];

  const BEAK_COLORS = [
    { id: 'orange', label: 'Sunny Orange', upper: '#f97316', lower: '#ea580c' },
    { id: 'gold', label: 'Golden Yellow', upper: '#facc15', lower: '#ca8a04' },
    { id: 'pink', label: 'Cute Coral', upper: '#fb7185', lower: '#e11d48' },
    { id: 'black', label: 'Sleek Obsidian', upper: '#334155', lower: '#1e293b' }
  ];

  const ACCESSORIES = [
    { id: 'none', name: 'None', icon: '❌', category: 'hats', price: 0, desc: 'Natural fluffy bird style' },
    { id: 'party_hat', name: 'Party Cone', icon: '🎉', category: 'hats', price: 0, desc: 'Celebration party hat' },
    { id: 'crown', name: 'Golden Crown', icon: '👑', category: 'hats', price: 300, desc: 'Fit for bird royalty' },
    { id: 'top_hat', name: 'Gentleman Top Hat', icon: '🎩', category: 'hats', price: 150, desc: 'Dapper and classy' },
    { id: 'aviator_goggles', name: 'Pilot Goggles', icon: '🥽', category: 'glasses', price: 120, desc: 'Aerodynamic flight goggles' },
    { id: 'sunglasses', name: 'Cool Shades', icon: '🕶️', category: 'glasses', price: 60, desc: 'Too cool for low altitudes' },
    { id: 'nerd_glasses', name: 'Nerd Specs', icon: '👓', category: 'glasses', price: 80, desc: 'Calculates the best angles' },
    { id: 'pink_bow', name: 'Ribbon Bow', icon: '🎀', category: 'special', price: 50, desc: 'A lovely satin ribbon' },
    { id: 'superhero_cape', name: 'Hero Cape', icon: '🦸', category: 'special', price: 200, desc: 'Fluttering red cape' },
    { id: 'angel_halo', name: 'Angel Halo', icon: '😇', category: 'special', price: 250, desc: 'Holy golden floating ring' },
    { id: 'rainbow_aura', name: 'Rainbow Aura', icon: '🌈', category: 'special', price: 400, desc: 'Shimmering magical glow' }
  ];

  const ACHIEVEMENTS_DEF = [
    { id: 'first_flight', name: 'First Flight', icon: '🐣', desc: 'Play your first game of Fluffy Bird', reward: 50 },
    { id: 'create_bird', name: 'Flock Creator', icon: '🎨', desc: 'Create or customize a bird character', reward: 100 },
    { id: 'custom_voice', name: 'Voice Actor', icon: '🎙️', desc: 'Record or upload a custom voice sound', reward: 100 },
    { id: 'score_10', name: 'Pipe Hopper', icon: '🥉', desc: 'Reach a score of 10 in Classic mode', reward: 50 },
    { id: 'score_25', name: 'Sky Acrobat', icon: '🥈', desc: 'Reach a score of 25 in Classic mode', reward: 150 },
    { id: 'score_50', name: 'Feather Legend', icon: '🥇', desc: 'Reach a score of 50 in Classic mode', reward: 300 },
    { id: 'coins_50', name: 'Pocket Full of Gold', icon: '🪙', desc: 'Collect 50 coins total', reward: 80 },
    { id: 'coins_200', name: 'Treasure Hoarder', icon: '💰', desc: 'Collect 200 coins total', reward: 200 },
    { id: 'fashionista', name: 'Bird Fashionista', icon: '🛍️', desc: 'Unlock and equip any shop accessory', reward: 100 },
    { id: 'flock_3', name: 'Full Nest', icon: '🐥', desc: 'Have at least 3 bird characters in your roster', reward: 150 }
  ];

  /* ==========================================================================
     SYNCHRONOUS PROCEDURAL PORTRAIT GENERATOR
     ========================================================================== */
  function generatePresetPortrait(type) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const cx = 128;
      const cy = 128;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 126, 0, Math.PI * 2);
      ctx.fill();

      if (type === 'cat') {
        const bg = ctx.createRadialGradient(cx, cy, 30, cx, cy, 126);
        bg.addColorStop(0, '#fef3c7');
        bg.addColorStop(1, '#fde68a');
        ctx.fillStyle = bg;
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(50, 80); ctx.lineTo(70, 15); ctx.lineTo(110, 65); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(206, 80); ctx.lineTo(186, 15); ctx.lineTo(146, 65); ctx.fill();

        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.moveTo(60, 75); ctx.lineTo(72, 30); ctx.lineTo(100, 68); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(196, 75); ctx.lineTo(184, 30); ctx.lineTo(156, 68); ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, 85, 75, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.ellipse(cx - 38, cy - 8, 16, 22, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 38, cy - 8, 16, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(cx - 38, cy - 8, 7, 18, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 38, cy - 8, 7, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 42, cy - 14, 5, 0, Math.PI * 2);
        ctx.arc(cx + 34, cy - 14, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(cx - 9, cy + 16); ctx.lineTo(cx + 9, cy + 16); ctx.lineTo(cx, cy + 26);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx - 10, cy + 28, 10, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 10, cy + 28, 10, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(cx - 55, cy + 15); ctx.lineTo(cx - 105, cy + 8);
        ctx.moveTo(cx - 55, cy + 25); ctx.lineTo(cx - 105, cy + 28);
        ctx.moveTo(cx + 55, cy + 15); ctx.lineTo(cx + 105, cy + 8);
        ctx.moveTo(cx + 55, cy + 25); ctx.lineTo(cx + 105, cy + 28);
        ctx.stroke();

      } else if (type === 'dog') {
        const bg = ctx.createRadialGradient(cx, cy, 30, cx, cy, 126);
        bg.addColorStop(0, '#e0f2fe');
        bg.addColorStop(1, '#bae6fd');
        ctx.fillStyle = bg;
        ctx.fill();

        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.ellipse(cx - 75, cy, 35, 65, -0.2, 0, Math.PI * 2);
        ctx.ellipse(cx + 75, cy, 35, 65, 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(cx, cy, 78, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 24, 45, 36, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(cx - 32, cy - 12, 14, 0, Math.PI * 2);
        ctx.arc(cx + 32, cy - 12, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 36, cy - 16, 5, 0, Math.PI * 2);
        ctx.arc(cx + 28, cy - 16, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 14, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(cx, cy + 42, 12, 0, Math.PI);
        ctx.fill();

      } else if (type === 'hamster') {
        const bg = ctx.createRadialGradient(cx, cy, 30, cx, cy, 126);
        bg.addColorStop(0, '#fed7aa');
        bg.addColorStop(1, '#fdba74');
        ctx.fillStyle = bg;
        ctx.fill();

        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(cx - 60, cy - 65, 26, 0, Math.PI * 2);
        ctx.arc(cx + 60, cy - 65, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(cx - 60, cy - 65, 15, 0, Math.PI * 2);
        ctx.arc(cx + 60, cy - 65, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.ellipse(cx - 50, cy + 20, 42, 38, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 50, cy + 20, 42, 38, 0, 0, Math.PI * 2);
        ctx.arc(cx, cy, 70, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(cx - 36, cy - 10, 12, 0, Math.PI * 2);
        ctx.arc(cx + 36, cy - 10, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 39, cy - 14, 4, 0, Math.PI * 2);
        ctx.arc(cx + 33, cy - 14, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(cx, cy + 12, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 7, cy + 22, 6, 9);
        ctx.fillRect(cx + 1, cy + 22, 6, 9);

      } else if (type === 'panda') {
        const bg = ctx.createRadialGradient(cx, cy, 30, cx, cy, 126);
        bg.addColorStop(0, '#e2e8f0');
        bg.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = bg;
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(cx - 65, cy - 65, 30, 0, Math.PI * 2);
        ctx.arc(cx + 65, cy - 65, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 82, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(cx - 36, cy - 6, 24, 20, -0.2, 0, Math.PI * 2);
        ctx.ellipse(cx + 36, cy - 6, 24, 20, 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 34, cy - 6, 8, 0, Math.PI * 2);
        ctx.arc(cx + 34, cy - 6, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(cx - 33, cy - 6, 4.5, 0, Math.PI * 2);
        ctx.arc(cx + 35, cy - 6, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 20, 16, 11, 0, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Default: Sunny Pip Chick face
        const bg = ctx.createRadialGradient(cx, cy, 30, cx, cy, 126);
        bg.addColorStop(0, '#fef08a');
        bg.addColorStop(1, '#fde047');
        ctx.fillStyle = bg;
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(cx, cy, 80, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(cx - 36, cy - 12, 16, 22, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 36, cy - 12, 16, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 40, cy - 20, 7, 0, Math.PI * 2);
        ctx.arc(cx + 32, cy - 20, 7, 0, Math.PI * 2);
        ctx.arc(cx - 30, cy - 4, 3, 0, Math.PI * 2);
        ctx.arc(cx + 42, cy - 4, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(244, 114, 182, 0.45)';
        ctx.beginPath();
        ctx.arc(cx - 52, cy + 14, 14, 0, Math.PI * 2);
        ctx.arc(cx + 52, cy + 14, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 12, 14, 9, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      return canvas.toDataURL('image/png');
    } catch (e) {
      console.warn('Canvas generatePresetPortrait error:', e);
      return '';
    }
  }

  // Pre-instantiated Fallback Bird Characters (Instant in-memory readiness)
  const FALLBACK_DEFAULT_BIRDS = [
    {
      id: 'preset_pip',
      name: 'Sunny Pip',
      photoData: generatePresetPortrait('chick'),
      plumageId: 'yellow',
      wingId: 'white',
      beakId: 'orange',
      hasCheeks: true,
      accessoryId: 'none',
      customVoices: {},
      createdAt: 1000
    },
    {
      id: 'preset_kitty',
      name: 'Captain Whiskers',
      photoData: generatePresetPortrait('cat'),
      plumageId: 'coral',
      wingId: 'gold',
      beakId: 'pink',
      hasCheeks: true,
      accessoryId: 'party_hat',
      customVoices: {},
      createdAt: 1001
    },
    {
      id: 'preset_doggo',
      name: 'Buster the Pup',
      photoData: generatePresetPortrait('dog'),
      plumageId: 'blue',
      wingId: 'sky',
      beakId: 'black',
      hasCheeks: true,
      accessoryId: 'sunglasses',
      customVoices: {},
      createdAt: 1002
    }
  ];

  /* ==========================================================================
     1. ROBUST STORAGE MANAGER (Triple-Layer: IndexedDB -> LocalStorage -> Memory)
     Never hangs, never throws, works under file:/// and strict security contexts.
     ========================================================================== */
  const Storage = {
    db: null,
    dbName: 'FluffyBirdDB_v3',
    memoryMap: new Map(),

    init() {
      // Seed memory map immediately with default birds
      FALLBACK_DEFAULT_BIRDS.forEach(b => this.memoryMap.set(b.id, b));

      // Load from LocalStorage if available
      try {
        const savedRaw = localStorage.getItem('fluffy_chars_json');
        if (savedRaw) {
          const list = JSON.parse(savedRaw);
          if (Array.isArray(list)) {
            list.forEach(b => this.memoryMap.set(b.id, b));
          }
        }
      } catch (e) {
        // localStorage blocked or restricted
      }

      return new Promise((resolve) => {
        let isDone = false;
        const finish = () => {
          if (!isDone) {
            isDone = true;
            resolve();
          }
        };

        // Safety timeout: if IndexedDB doesn't respond within 400ms, proceed with memory
        setTimeout(finish, 400);

        try {
          if (!window.indexedDB) {
            finish();
            return;
          }

          const req = indexedDB.open(this.dbName, 1);
          req.onupgradeneeded = (e) => {
            try {
              const db = e.target.result;
              if (!db.objectStoreNames.contains('characters')) {
                db.createObjectStore('characters', { keyPath: 'id' });
              }
            } catch (err) {
              console.warn('onupgradeneeded err', err);
            }
          };

          req.onsuccess = (e) => {
            this.db = e.target.result;
            // Load items from IndexedDB into memoryMap
            try {
              const tx = this.db.transaction('characters', 'readonly');
              const store = tx.objectStore('characters');
              const getReq = store.getAll();
              getReq.onsuccess = () => {
                const items = getReq.result || [];
                if (items.length > 0) {
                  items.forEach(b => this.memoryMap.set(b.id, b));
                } else {
                  // Save default birds to IndexedDB
                  FALLBACK_DEFAULT_BIRDS.forEach(b => this.saveCharacter(b));
                }
                finish();
              };
              getReq.onerror = () => finish();
            } catch (err) {
              finish();
            }
          };

          req.onerror = () => finish();
          req.onblocked = () => finish();
        } catch (e) {
          finish();
        }
      });
    },

    syncToLocalStorage() {
      try {
        const list = Array.from(this.memoryMap.values());
        localStorage.setItem('fluffy_chars_json', JSON.stringify(list));
      } catch (e) {}
    },

    async saveCharacter(character) {
      if (!character || !character.id) return false;
      this.memoryMap.set(character.id, character);
      this.syncToLocalStorage();

      if (!this.db) return true;
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction('characters', 'readwrite');
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(true);
          tx.onabort = () => resolve(true);
          const store = tx.objectStore('characters');
          store.put(character);
        } catch (e) {
          resolve(true);
        }
      });
    },

    async getCharacter(id) {
      if (this.memoryMap.has(id)) {
        return this.memoryMap.get(id);
      }
      return FALLBACK_DEFAULT_BIRDS[0];
    },

    async getAllCharacters() {
      const list = Array.from(this.memoryMap.values());
      return list.length > 0 ? list : FALLBACK_DEFAULT_BIRDS;
    },

    async deleteCharacter(id) {
      this.memoryMap.delete(id);
      this.syncToLocalStorage();
      if (!this.db) return true;
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction('characters', 'readwrite');
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(true);
          tx.onabort = () => resolve(true);
          const store = tx.objectStore('characters');
          store.delete(id);
        } catch (e) {
          resolve(true);
        }
      });
    },

    // Safe LocalStorage getters and setters
    getCoins() {
      try {
        const val = localStorage.getItem('fluffy_coins');
        return val !== null ? parseInt(val, 10) : 50;
      } catch (e) {
        return 50;
      }
    },
    setCoins(coins) {
      try {
        localStorage.setItem('fluffy_coins', Math.max(0, coins).toString());
      } catch (e) {}
    },
    addCoins(delta) {
      const total = this.getCoins() + delta;
      this.setCoins(total);
      return total;
    },

    getActiveBirdId() {
      try {
        return localStorage.getItem('fluffy_active_bird_id') || 'preset_pip';
      } catch (e) {
        return 'preset_pip';
      }
    },
    setActiveBirdId(id) {
      try {
        localStorage.setItem('fluffy_active_bird_id', id);
      } catch (e) {}
    },

    getHighScores() {
      try {
        const data = localStorage.getItem('fluffy_highscores');
        return data ? JSON.parse(data) : { classic: 0, endless: 0, challenge: 0, relax: 0 };
      } catch (e) {
        return { classic: 0, endless: 0, challenge: 0, relax: 0 };
      }
    },
    setHighScore(mode, score) {
      try {
        const scores = this.getHighScores();
        if ((score || 0) > (scores[mode] || 0)) {
          scores[mode] = score;
          localStorage.setItem('fluffy_highscores', JSON.stringify(scores));
          return true;
        }
      } catch (e) {}
      return false;
    },

    getUnlockedItems() {
      try {
        const data = localStorage.getItem('fluffy_unlocked_items');
        return data ? JSON.parse(data) : ['none', 'party_hat'];
      } catch (e) {
        return ['none', 'party_hat'];
      }
    },
    unlockItem(id) {
      try {
        const items = this.getUnlockedItems();
        if (!items.includes(id)) {
          items.push(id);
          localStorage.setItem('fluffy_unlocked_items', JSON.stringify(items));
          return true;
        }
      } catch (e) {}
      return false;
    },

    getAchievements() {
      try {
        const data = localStorage.getItem('fluffy_achievements');
        return data ? JSON.parse(data) : {};
      } catch (e) {
        return {};
      }
    },
    unlockAchievement(id) {
      try {
        const achs = this.getAchievements();
        if (!achs[id]) {
          achs[id] = Date.now();
          localStorage.setItem('fluffy_achievements', JSON.stringify(achs));
          return true;
        }
      } catch (e) {}
      return false;
    },

    getDailyRewardInfo() {
      try {
        const data = localStorage.getItem('fluffy_daily_reward');
        return data ? JSON.parse(data) : { lastClaimTime: 0, streak: 0 };
      } catch (e) {
        return { lastClaimTime: 0, streak: 0 };
      }
    },
    setDailyRewardInfo(info) {
      try {
        localStorage.setItem('fluffy_daily_reward', JSON.stringify(info));
      } catch (e) {}
    },

    getSettings() {
      try {
        const data = localStorage.getItem('fluffy_settings');
        return data ? JSON.parse(data) : { bgmMuted: false, sfxMuted: false };
      } catch (e) {
        return { bgmMuted: false, sfxMuted: false };
      }
    },
    setSettings(settings) {
      try {
        localStorage.setItem('fluffy_settings', JSON.stringify(settings));
      } catch (e) {}
    }
  };

  /* ==========================================================================
     2. SOUND & CUSTOM VOICE ENGINE (Web Audio API + MediaRecorder)
     ========================================================================== */
  const Sound = {
    ctx: null,
    bgmInterval: null,
    bgmStep: 0,
    bgmMuted: false,
    sfxMuted: false,

    init() {
      const settings = Storage.getSettings();
      this.bgmMuted = !!settings.bgmMuted;
      this.sfxMuted = !!settings.sfxMuted;
    },

    unlockAudio() {
      try {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            this.ctx = new AudioCtx();
          }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      } catch (e) {
        // AudioContext disabled or unsupported
      }
    },

    playFlap() {
      if (this.sfxMuted) return;
      this.unlockAudio();
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(740, now + 0.12);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
      } catch (e) {}
    },

    playScore() {
      if (this.sfxMuted) return;
      this.unlockAudio();
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        [1046.5, 1318.5].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.22, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.32);
        });
      } catch (e) {}
    },

    playCoin() {
      if (this.sfxMuted) return;
      this.unlockAudio();
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.08);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.36);
      } catch (e) {}
    },

    playCrash() {
      if (this.sfxMuted) return;
      this.unlockAudio();
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.28);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.32);
      } catch (e) {}
    },

    playStart() {
      if (this.sfxMuted) return;
      this.unlockAudio();
      if (!this.ctx) return;

      try {
        const notes = [392, 523.25, 659.25, 783.99];
        const now = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);

          gain.gain.setValueAtTime(0.24, now + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.25);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + idx * 0.09);
          osc.stop(now + idx * 0.09 + 0.28);
        });
      } catch (e) {}
    },

    playGameOver() {
      if (this.sfxMuted) return;
      this.unlockAudio();
      if (!this.ctx) return;

      try {
        const notes = [349.23, 329.63, 311.13, 293.66];
        const now = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.18);

          gain.gain.setValueAtTime(0.25, now + idx * 0.18);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.24);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + idx * 0.18);
          osc.stop(now + idx * 0.18 + 0.26);
        });
      } catch (e) {}
    },

    playBoing() {
      if (this.sfxMuted) return;
      this.unlockAudio();
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.18);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.3);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.36);
      } catch (e) {}
    },

    playClick() {
      if (this.sfxMuted) return;
      this.unlockAudio();
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(850, now + 0.04);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.07);
      } catch (e) {}
    },

    startBGM() {
      if (this.bgmMuted || this.bgmInterval) return;
      this.unlockAudio();
      if (!this.ctx) return;

      const melody = [
        261.63, 0, 329.63, 392.00, 523.25, 392.00, 329.63, 0,
        293.66, 0, 349.23, 440.00, 587.33, 440.00, 349.23, 0,
        220.00, 0, 261.63, 329.63, 440.00, 329.63, 261.63, 0,
        196.00, 246.94, 293.66, 392.00, 523.25, 0, 0, 0
      ];

      this.bgmStep = 0;
      this.bgmInterval = setInterval(() => {
        if (this.bgmMuted || !this.ctx || this.ctx.state !== 'running') return;
        const freq = melody[this.bgmStep % melody.length];
        this.bgmStep++;

        if (freq > 0) {
          try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.045, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.18);
          } catch (e) {}
        }
      }, 160);
    },

    stopBGM() {
      if (this.bgmInterval) {
        clearInterval(this.bgmInterval);
        this.bgmInterval = null;
      }
    },

    toggleBGM() {
      this.bgmMuted = !this.bgmMuted;
      Storage.setSettings({ bgmMuted: this.bgmMuted, sfxMuted: this.sfxMuted });
      if (this.bgmMuted) {
        this.stopBGM();
      } else {
        this.startBGM();
      }
      return !this.bgmMuted;
    },

    toggleSFX() {
      this.sfxMuted = !this.sfxMuted;
      Storage.setSettings({ bgmMuted: this.bgmMuted, sfxMuted: this.sfxMuted });
      return !this.sfxMuted;
    },

    playCharacterEvent(character, eventName) {
      if (this.sfxMuted) return;

      const customAudioData = character && character.customVoices && character.customVoices[eventName];
      if (customAudioData) {
        try {
          const audio = new Audio(customAudioData);
          audio.volume = 1.0;
          audio.play().catch(() => {
            this.playFallbackSynth(eventName);
          });
          return;
        } catch (e) {
          this.playFallbackSynth(eventName);
          return;
        }
      }

      this.playFallbackSynth(eventName);
    },

    playFallbackSynth(eventName) {
      switch (eventName) {
        case 'flap': this.playFlap(); break;
        case 'score': this.playScore(); break;
        case 'crash': this.playCrash(); break;
        case 'start': this.playStart(); break;
        case 'gameover': this.playGameOver(); break;
        case 'boing': this.playBoing(); break;
        default: this.playClick(); break;
      }
    }
  };

  /* ==========================================================================
     3. BIRD PROCEDURAL & TEXTURE RENDERER (Turns photo into the flying bird)
     ========================================================================== */
  const BirdRenderer = {
    imageCache: new Map(),

    getImage(dataUrl) {
      if (!dataUrl) return null;
      if (this.imageCache.has(dataUrl)) {
        return this.imageCache.get(dataUrl);
      }
      const img = new Image();
      img.src = dataUrl;
      this.imageCache.set(dataUrl, img);
      return img;
    },

    drawBird(ctx, character, x, y, radius = 26, angle = 0, wingPhase = 0, mouthOpen = 0) {
      const bird = character || FALLBACK_DEFAULT_BIRDS[0];

      const plum = PLUMAGE_COLORS.find(c => c.id === bird.plumageId) || PLUMAGE_COLORS[0];
      const beak = BEAK_COLORS.find(b => b.id === bird.beakId) || BEAK_COLORS[0];
      const wingConf = WING_COLORS.find(w => w.id === bird.wingId) || WING_COLORS[0];
      const wingColor = wingConf.color || plum.main;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // 1. Rainbow Aura (Special Accessory)
      if (bird.accessoryId === 'rainbow_aura') {
        const auraTime = Date.now() * 0.005;
        const grad = ctx.createRadialGradient(0, 0, radius * 0.8, 0, 0, radius * 1.5);
        grad.addColorStop(0, `hsla(${Math.sin(auraTime) * 180 + 180}, 90%, 65%, 0.7)`);
        grad.addColorStop(0.5, `hsla(${Math.cos(auraTime) * 180 + 180}, 90%, 65%, 0.4)`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Superhero Cape (Drawn behind body)
      if (bird.accessoryId === 'superhero_cape') {
        const capeFlutter = Math.sin(wingPhase * 1.5) * 6;
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(-radius * 0.5, -radius * 0.3);
        ctx.quadraticCurveTo(-radius * 1.8, -radius * 0.2 + capeFlutter, -radius * 2.1, radius * 0.6 + capeFlutter);
        ctx.lineTo(-radius * 1.4, radius * 0.8);
        ctx.lineTo(-radius * 0.5, radius * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 3. Fluffy Tail Feathers
      const tailWiggle = Math.sin(wingPhase) * 4;
      ctx.fillStyle = plum.dark;
      for (let i = -1; i <= 1; i++) {
        ctx.save();
        ctx.rotate((-0.2 + i * 0.15) + (tailWiggle * 0.02));
        ctx.beginPath();
        ctx.ellipse(-radius * 1.05, i * 4, radius * 0.45, radius * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Little Cute Feet
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(-radius * 0.25, radius * 0.95, 6, 3.5, 0.2, 0, Math.PI * 2);
      ctx.ellipse(radius * 0.2, radius * 0.95, 6, 3.5, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // 5. Fluffy Feather Scallops / Plumage Outline
      ctx.fillStyle = plum.main;
      const puffCount = 10;
      for (let i = 0; i < puffCount; i++) {
        const a = (i / puffCount) * Math.PI * 2;
        const px = Math.cos(a) * (radius * 0.9);
        const py = Math.sin(a) * (radius * 0.9);
        ctx.beginPath();
        ctx.arc(px, py, radius * 0.36, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = plum.dark;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 6. User Photo As Bird Face & Body (or adorable procedural chick face)
      const img = this.getImage(bird.photoData);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
        ctx.clip();
        const faceSize = radius * 1.76;
        ctx.drawImage(img, -faceSize / 2, -faceSize / 2, faceSize, faceSize);
        ctx.restore();
      } else {
        const grad = ctx.createRadialGradient(0, -radius * 0.2, 4, 0, 0, radius * 0.88);
        grad.addColorStop(0, plum.highlight);
        grad.addColorStop(1, plum.main);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(-radius * 0.28, -radius * 0.1, radius * 0.12, 0, Math.PI * 2);
        ctx.arc(radius * 0.28, -radius * 0.1, radius * 0.12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-radius * 0.32, -radius * 0.14, radius * 0.05, 0, Math.PI * 2);
        ctx.arc(radius * 0.24, -radius * 0.14, radius * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }

      // 7. Optional Rosy Cheeks
      if (bird.hasCheeks !== false) {
        ctx.fillStyle = 'rgba(244, 114, 182, 0.45)';
        ctx.beginPath();
        ctx.ellipse(radius * 0.45, radius * 0.25, radius * 0.22, radius * 0.14, 0.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // 8. Cute Beak
      ctx.save();
      ctx.translate(radius * 0.72, radius * 0.05);

      // Upper Beak
      ctx.fillStyle = beak.upper;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(radius * 0.55, 1);
      ctx.lineTo(0, 3 + mouthOpen * 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Lower Beak
      ctx.fillStyle = beak.lower;
      ctx.beginPath();
      ctx.moveTo(0, 3 + mouthOpen * 4);
      ctx.lineTo(radius * 0.4, 4 + mouthOpen * 6);
      ctx.lineTo(0, 7 + mouthOpen * 7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 9. Fluffy Animated Wing
      const flapAngle = Math.sin(wingPhase) * 0.7;
      ctx.save();
      ctx.translate(-radius * 0.2, radius * 0.05);
      ctx.rotate(flapAngle);

      ctx.fillStyle = wingColor;
      ctx.strokeStyle = plum.dark;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.ellipse(-radius * 0.35, 0, radius * 0.55, radius * 0.3, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = plum.highlight || '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-radius * 0.25, -2, radius * 0.35, radius * 0.18, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 10. Equipped Accessories
      this.drawAccessory(ctx, bird.accessoryId, radius);

      ctx.restore();
    },

    drawAccessory(ctx, accId, radius) {
      if (!accId || accId === 'none') return;

      switch (accId) {
        case 'party_hat': {
          ctx.save();
          ctx.translate(0, -radius * 0.85);
          ctx.rotate(0.1);
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.moveTo(-radius * 0.32, 0);
          ctx.lineTo(0, -radius * 0.9);
          ctx.lineTo(radius * 0.32, 0);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-radius * 0.2, -radius * 0.3);
          ctx.lineTo(radius * 0.2, -radius * 0.3);
          ctx.moveTo(-radius * 0.1, -radius * 0.6);
          ctx.lineTo(radius * 0.1, -radius * 0.6);
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, -radius * 0.95, radius * 0.14, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }

        case 'crown': {
          ctx.save();
          ctx.translate(0, -radius * 0.85);
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(-radius * 0.5, 0);
          ctx.lineTo(-radius * 0.5, -radius * 0.45);
          ctx.lineTo(-radius * 0.25, -radius * 0.2);
          ctx.lineTo(0, -radius * 0.55);
          ctx.lineTo(radius * 0.25, -radius * 0.2);
          ctx.lineTo(radius * 0.5, -radius * 0.45);
          ctx.lineTo(radius * 0.5, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, -radius * 0.25, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(-radius * 0.3, -radius * 0.18, 2.5, 0, Math.PI * 2);
          ctx.arc(radius * 0.3, -radius * 0.18, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }

        case 'top_hat': {
          ctx.save();
          ctx.translate(-radius * 0.05, -radius * 0.82);
          ctx.rotate(0.08);
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.ellipse(0, 0, radius * 0.6, radius * 0.14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(-radius * 0.38, -radius * 0.65, radius * 0.76, radius * 0.65);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-radius * 0.38, -radius * 0.18, radius * 0.76, radius * 0.18);
          ctx.restore();
          break;
        }

        case 'aviator_goggles': {
          ctx.save();
          ctx.translate(radius * 0.15, -radius * 0.2);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(-radius * 0.9, -2);
          ctx.lineTo(radius * 0.6, -2);
          ctx.stroke();

          ctx.fillStyle = '#e0f2fe';
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 3;

          ctx.beginPath();
          ctx.arc(-radius * 0.18, 0, radius * 0.26, 0, Math.PI * 2);
          ctx.arc(radius * 0.28, 0, radius * 0.26, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-radius * 0.22, -4, 4, 0, Math.PI * 2);
          ctx.arc(radius * 0.24, -4, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }

        case 'sunglasses': {
          ctx.save();
          ctx.translate(radius * 0.2, -radius * 0.12);
          ctx.fillStyle = '#0f172a';
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(-radius * 0.45, -radius * 0.15, radius * 0.42, radius * 0.3, 4);
            ctx.roundRect(0, -radius * 0.15, radius * 0.42, radius * 0.3, 4);
            ctx.fill();
          } else {
            ctx.fillRect(-radius * 0.45, -radius * 0.15, radius * 0.42, radius * 0.3);
            ctx.fillRect(0, -radius * 0.15, radius * 0.42, radius * 0.3);
          }

          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-radius * 0.05, -radius * 0.05);
          ctx.lineTo(0, -radius * 0.05);
          ctx.moveTo(-radius * 0.45, -radius * 0.05);
          ctx.lineTo(-radius * 0.8, -radius * 0.15);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-radius * 0.35, -radius * 0.08);
          ctx.lineTo(-radius * 0.15, radius * 0.08);
          ctx.moveTo(radius * 0.1, -radius * 0.08);
          ctx.lineTo(radius * 0.3, radius * 0.08);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case 'nerd_glasses': {
          ctx.save();
          ctx.translate(radius * 0.15, -radius * 0.12);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2.5;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';

          ctx.beginPath();
          ctx.arc(-radius * 0.2, 0, radius * 0.26, 0, Math.PI * 2);
          ctx.arc(radius * 0.25, 0, radius * 0.26, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(-radius * 0.02, 0);
          ctx.lineTo(radius * 0.07, 0);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-radius * 0.02, -3, 8, 6);
          ctx.restore();
          break;
        }

        case 'pink_bow': {
          ctx.save();
          ctx.translate(-radius * 0.1, -radius * 0.8);
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-radius * 0.4, -radius * 0.25);
          ctx.lineTo(-radius * 0.4, radius * 0.25);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(radius * 0.4, -radius * 0.25);
          ctx.lineTo(radius * 0.4, radius * 0.25);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#db2777';
          ctx.beginPath();
          ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }

        case 'angel_halo': {
          ctx.save();
          ctx.translate(0, -radius * 1.15);
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#fde047';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.ellipse(0, 0, radius * 0.65, radius * 0.2, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          break;
        }
      }
    }
  };

  /* ==========================================================================
     4. GAME ENGINE & PHYSICS (Flappy Bird mechanics, pipes, coins, particles)
     ========================================================================== */
  const Game = {
    canvas: null,
    ctx: null,
    animFrameId: null,

    state: 'READY',
    mode: 'classic',

    score: 0,
    coinsCollected: 0,
    activeBird: null,

    birdX: 110,
    birdY: 280,
    velocity: 0,
    gravity: 0.38,
    jumpImpulse: -7.4,
    rotation: 0,
    wingPhase: 0,
    mouthTimer: 0,

    pipes: [],
    coins: [],
    pipeTimer: 0,
    pipeInterval: 105,
    pipeSpeed: 2.2,
    pipeGap: 135,

    clouds: [],
    hills: [],
    groundX: 0,

    particles: [],

    init(canvasEl) {
      this.canvas = canvasEl;
      this.ctx = this.canvas.getContext('2d');
      this.setupParallaxElements();
      this.bindInputs();
    },

    setupParallaxElements() {
      this.clouds = [
        { x: 40, y: 50, scale: 1.0, speed: 0.3 },
        { x: 220, y: 110, scale: 0.8, speed: 0.2 },
        { x: 360, y: 40, scale: 1.2, speed: 0.4 }
      ];

      this.hills = [
        { x: 0, y: V_HEIGHT - GROUND_HEIGHT - 60, r: 120 },
        { x: 180, y: V_HEIGHT - GROUND_HEIGHT - 45, r: 90 },
        { x: 320, y: V_HEIGHT - GROUND_HEIGHT - 70, r: 140 }
      ];
    },

    setMode(modeName) {
      this.mode = modeName || 'classic';
      switch (this.mode) {
        case 'endless':
          this.gravity = 0.28;
          this.jumpImpulse = -6.5;
          this.pipeGap = 165;
          this.pipeSpeed = 1.8;
          break;
        case 'challenge':
          this.gravity = 0.42;
          this.jumpImpulse = -7.8;
          this.pipeGap = 120;
          this.pipeSpeed = 2.6;
          break;
        case 'relax':
          this.gravity = 0.22;
          this.jumpImpulse = -5.8;
          this.pipeGap = 175;
          this.pipeSpeed = 1.8;
          break;
        default: // classic
          this.gravity = 0.38;
          this.jumpImpulse = -7.4;
          this.pipeGap = 135;
          this.pipeSpeed = 2.2;
          break;
      }
    },

    startFlight(character) {
      // Ensure bird is never null
      this.activeBird = character || UI.activeBird || FALLBACK_DEFAULT_BIRDS[0];

      this.score = 0;
      this.coinsCollected = 0;
      this.birdX = 110;
      this.birdY = 280;
      this.velocity = -6.5; // Immediate cheerful upward leap into flight!
      this.rotation = -0.2;
      this.wingPhase = 0;
      this.mouthTimer = 10;
      this.pipes = [];
      this.coins = [];
      this.particles = [];
      this.pipeTimer = 0;

      this.setMode(this.mode);
      this.state = 'PLAYING'; // Launch straight into live gameplay!

      Sound.playCharacterEvent(this.activeBird, 'start');
      Sound.playCharacterEvent(this.activeBird, 'flap');
      Sound.startBGM();

      UI.updateInGameHud(0, 0, this.mode);
      UI.hideReadyPrompt(); // Hide any blocker overlay

      // Starting feather burst
      this.addFeatherPuff(this.birdX - 10, this.birdY + 10);

      // Guarantee single running loop
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
      this.loop();
    },

    flap() {
      if (this.state === 'READY') {
        this.state = 'PLAYING';
        UI.hideReadyPrompt();
      }

      if (this.state !== 'PLAYING') return;

      this.velocity = this.jumpImpulse;
      this.mouthTimer = 12;

      this.addFeatherPuff(this.birdX - 10, this.birdY + 10);
      Sound.playCharacterEvent(this.activeBird, 'flap');
    },

    pause() {
      if (this.state === 'PLAYING') {
        this.state = 'PAUSED';
        UI.showPauseOverlay();
      }
    },

    resume() {
      if (this.state === 'PAUSED') {
        this.state = 'PLAYING';
        UI.hidePauseOverlay();
      }
    },

    restart() {
      this.startFlight(this.activeBird);
    },

    gameOver() {
      if (this.state === 'GAMEOVER') return;
      this.state = 'GAMEOVER';

      const isNewRecord = Storage.setHighScore(this.mode, this.score);

      if (this.coinsCollected > 0) {
        Storage.addCoins(this.coinsCollected);
        UI.updateCoinsBadge();
      }

      if (this.mode === 'classic') {
        if (this.score >= 10) UI.checkAchievement('score_10');
        if (this.score >= 25) UI.checkAchievement('score_25');
        if (this.score >= 50) UI.checkAchievement('score_50');
      }
      UI.checkAchievement('first_flight');

      this.addCrashBurst(this.birdX, this.birdY);

      Sound.playCharacterEvent(this.activeBird, 'crash');
      setTimeout(() => {
        Sound.playCharacterEvent(this.activeBird, 'gameover');
      }, 350);

      UI.showGameOverOverlay(this.score, this.coinsCollected, this.mode, isNewRecord, this.activeBird);
    },

    update() {
      for (const c of this.clouds) {
        c.x -= c.speed;
        if (c.x < -100) c.x = V_WIDTH + 80;
      }
      this.groundX = (this.groundX - this.pipeSpeed) % 24;

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity || 0.1;
        p.alpha -= p.decay || 0.025;
        p.rotation += p.vRot || 0.05;
        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }

      if (this.state === 'READY') {
        this.wingPhase += 0.12;
        this.birdY = 280 + Math.sin(this.wingPhase * 0.7) * 9;
        this.rotation = Math.sin(this.wingPhase * 0.7) * 0.08;
        return;
      }

      if (this.state !== 'PLAYING') return;

      this.velocity += this.gravity;
      this.birdY += this.velocity;
      this.wingPhase += 0.28;

      if (this.mouthTimer > 0) {
        this.mouthTimer--;
      }

      const targetAngle = Math.max(-0.45, Math.min(1.2, this.velocity * 0.08));
      this.rotation += (targetAngle - this.rotation) * 0.18;

      const birdRadius = 24;
      const groundY = V_HEIGHT - GROUND_HEIGHT;
      if (this.birdY + birdRadius >= groundY) {
        this.birdY = groundY - birdRadius;
        if (this.mode === 'relax') {
          this.velocity = -6;
          Sound.playBoing();
          this.addBubbleEffect(this.birdX, this.birdY);
        } else {
          this.gameOver();
          return;
        }
      }

      if (this.birdY - birdRadius <= 0) {
        this.birdY = birdRadius;
        this.velocity = 0;
      }

      this.pipeTimer++;
      if (this.pipeTimer >= this.pipeInterval) {
        this.pipeTimer = 0;
        this.spawnPipePair();
      }

      for (let i = this.pipes.length - 1; i >= 0; i--) {
        const p = this.pipes[i];
        p.x -= this.pipeSpeed;

        if (p.isMoving) {
          p.topHeight += Math.sin(Date.now() * 0.003 + p.movePhase) * 1.2;
          p.bottomY = p.topHeight + p.gap;
        }

        if (!p.scored && p.x + p.width < this.birdX) {
          p.scored = true;
          this.score++;
          Sound.playCharacterEvent(this.activeBird, 'score');
          UI.updateInGameHud(this.score, this.coinsCollected, this.mode);
          this.addScoreFloatingText(this.birdX + 15, this.birdY - 20, '+1');

          if (this.mode === 'classic' && this.score % 5 === 0) {
            this.pipeSpeed = Math.min(4.0, this.pipeSpeed + 0.15);
          }
        }

        if (this.checkPipeCollision(p, this.birdX, this.birdY, birdRadius)) {
          if (this.mode === 'relax') {
            p.x += 12;
            this.velocity = -5.5;
            Sound.playBoing();
            this.addBubbleEffect(this.birdX, this.birdY);
            this.addScoreFloatingText(this.birdX, this.birdY - 20, 'BOING! 🎈');
          } else {
            this.gameOver();
            return;
          }
        }

        if (p.x + p.width < -60) {
          this.pipes.splice(i, 1);
        }
      }

      for (let i = this.coins.length - 1; i >= 0; i--) {
        const c = this.coins[i];
        c.x -= this.pipeSpeed;
        c.spin += 0.08;

        const dx = (this.birdX) - (c.x);
        const dy = (this.birdY) - (c.y);
        const dist = Math.hypot(dx, dy);

        if (dist < birdRadius + c.radius) {
          const coinValue = this.mode === 'challenge' ? 2 : 1;
          this.coinsCollected += coinValue;
          Sound.playCoin();
          this.addSparkleBurst(c.x, c.y);
          this.addScoreFloatingText(c.x, c.y - 15, `+${coinValue} 🪙`);
          UI.updateInGameHud(this.score, this.coinsCollected, this.mode);

          const totalInBank = Storage.getCoins() + this.coinsCollected;
          if (totalInBank >= 50) UI.checkAchievement('coins_50');
          if (totalInBank >= 200) UI.checkAchievement('coins_200');

          this.coins.splice(i, 1);
          continue;
        }

        if (c.x < -30) {
          this.coins.splice(i, 1);
        }
      }
    },

    spawnPipePair() {
      const minHeight = 70;
      const maxHeight = V_HEIGHT - GROUND_HEIGHT - this.pipeGap - minHeight;
      const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
      const pipeWidth = 64;

      const pipePair = {
        x: V_WIDTH + 10,
        width: pipeWidth,
        topHeight: topHeight,
        gap: this.pipeGap,
        bottomY: topHeight + this.pipeGap,
        bottomHeight: V_HEIGHT - GROUND_HEIGHT - (topHeight + this.pipeGap),
        scored: false,
        isMoving: this.mode === 'challenge' && Math.random() > 0.4,
        movePhase: Math.random() * Math.PI * 2
      };

      this.pipes.push(pipePair);

      this.coins.push({
        x: pipePair.x + pipeWidth / 2,
        y: topHeight + this.pipeGap / 2,
        radius: 13,
        spin: 0
      });

      if (this.mode === 'endless' && Math.random() > 0.6) {
        this.coins.push({
          x: pipePair.x + pipeWidth + 45,
          y: topHeight + this.pipeGap / 2 + (Math.random() * 40 - 20),
          radius: 13,
          spin: 0.5
        });
      }
    },

    checkPipeCollision(pipe, bx, by, br) {
      const grace = 4;
      const effectiveR = br - grace;

      if (bx + effectiveR > pipe.x && bx - effectiveR < pipe.x + pipe.width) {
        if (by - effectiveR < pipe.topHeight) {
          return true;
        }
        if (by + effectiveR > pipe.bottomY) {
          return true;
        }
      }
      return false;
    },

    addFeatherPuff(x, y) {
      for (let i = 0; i < 4; i++) {
        this.particles.push({
          type: 'feather',
          x: x + (Math.random() * 8 - 4),
          y: y + (Math.random() * 8 - 4),
          vx: -(Math.random() * 1.5 + 1.2),
          vy: Math.random() * 1.5 - 0.7,
          alpha: 0.9,
          decay: 0.04,
          size: Math.random() * 5 + 3,
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.2
        });
      }
    },

    addSparkleBurst(x, y) {
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const spd = Math.random() * 3 + 2;
        this.particles.push({
          type: 'sparkle',
          x: x,
          y: y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          alpha: 1.0,
          decay: 0.035,
          size: Math.random() * 4 + 3
        });
      }
    },

    addCrashBurst(x, y) {
      for (let i = 0; i < 16; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 4 + 2;
        this.particles.push({
          type: 'star',
          x: x,
          y: y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 2,
          gravity: 0.15,
          alpha: 1.0,
          decay: 0.02,
          size: Math.random() * 7 + 4,
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.3
        });
      }
    },

    addBubbleEffect(x, y) {
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          type: 'bubble',
          x: x + (Math.random() * 30 - 15),
          y: y + (Math.random() * 30 - 15),
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2 - 1,
          alpha: 0.8,
          decay: 0.03,
          size: Math.random() * 10 + 6
        });
      }
    },

    addScoreFloatingText(x, y, text) {
      this.particles.push({
        type: 'text',
        x: x,
        y: y,
        text: text,
        vx: 0,
        vy: -1.4,
        alpha: 1.0,
        decay: 0.025
      });
    },

    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

      // Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.65, '#bae6fd');
      skyGrad.addColorStop(1, '#dcfce7');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (const c of this.clouds) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(c.scale, c.scale);
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.arc(20, -8, 28, 0, Math.PI * 2);
        ctx.arc(46, 0, 24, 0, Math.PI * 2);
        ctx.arc(22, 10, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Distant Hills
      ctx.fillStyle = '#86efac';
      for (const h of this.hills) {
        ctx.beginPath();
        ctx.arc(h.x, h.y + h.r, h.r, Math.PI, 0);
        ctx.fill();
      }

      // Pipes
      for (const p of this.pipes) {
        this.drawPipePair(ctx, p);
      }

      // Coins
      for (const c of this.coins) {
        this.drawCoin(ctx, c);
      }

      // Bird Character
      const mouthOpenRatio = this.mouthTimer > 0 ? 0.6 : 0;
      BirdRenderer.drawBird(ctx, this.activeBird, this.birdX, this.birdY, 26, this.rotation, this.wingPhase, mouthOpenRatio);

      // Ground
      this.drawGround(ctx);

      // Particles
      this.drawParticles(ctx);
    },

    drawPipePair(ctx, p) {
      const rimH = 24;
      const rimOverhang = 5;

      const pipeBodyGrad = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
      pipeBodyGrad.addColorStop(0, '#22c55e');
      pipeBodyGrad.addColorStop(0.25, '#86efac');
      pipeBodyGrad.addColorStop(0.65, '#22c55e');
      pipeBodyGrad.addColorStop(1, '#15803d');

      const strokeCol = '#14532d';

      // Top Pipe
      ctx.fillStyle = pipeBodyGrad;
      ctx.fillRect(p.x, 0, p.width, Math.max(0, p.topHeight - rimH));
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(p.x, -2, p.width, Math.max(0, p.topHeight - rimH + 2));

      ctx.fillRect(p.x - rimOverhang, p.topHeight - rimH, p.width + rimOverhang * 2, rimH);
      ctx.strokeRect(p.x - rimOverhang, p.topHeight - rimH, p.width + rimOverhang * 2, rimH);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(p.x + 8, p.topHeight - rimH + 3, 6, rimH - 6);

      // Bottom Pipe
      ctx.fillStyle = pipeBodyGrad;
      ctx.fillRect(p.x, p.bottomY + rimH, p.width, p.bottomHeight - rimH);
      ctx.strokeRect(p.x, p.bottomY + rimH, p.width, p.bottomHeight - rimH);

      ctx.fillRect(p.x - rimOverhang, p.bottomY, p.width + rimOverhang * 2, rimH);
      ctx.strokeRect(p.x - rimOverhang, p.bottomY, p.width + rimOverhang * 2, rimH);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(p.x + 8, p.bottomY + 3, 6, rimH - 6);
    },

    drawCoin(ctx, c) {
      ctx.save();
      ctx.translate(c.x, c.y);

      const scaleX = Math.cos(c.spin);
      ctx.scale(scaleX, 1);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, 0, c.radius * 0.75, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 1);

      ctx.restore();
    },

    drawGround(ctx) {
      const gy = V_HEIGHT - GROUND_HEIGHT;

      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, gy, V_WIDTH, 14);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, gy + 14, V_WIDTH, 4);

      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, gy + 18, V_WIDTH, GROUND_HEIGHT - 18);

      ctx.fillStyle = '#22c55e';
      const spacing = 24;
      for (let x = this.groundX - 30; x < V_WIDTH + 30; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + 12, gy + 14);
        ctx.lineTo(x + 6, gy + 14);
        ctx.lineTo(x - 6, gy);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(V_WIDTH, gy);
      ctx.stroke();
    },

    drawParticles(ctx) {
      for (const p of this.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);

        if (p.type === 'feather') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'sparkle') {
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'star') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'bubble') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (p.type === 'text') {
          ctx.font = 'bold 20px "Fredoka", sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 3;
          ctx.strokeText(p.text, p.x, p.y);
          ctx.fillText(p.text, p.x, p.y);
        }
        ctx.restore();
      }
    },

    loop() {
      this.update();
      this.render();
      this.animFrameId = requestAnimationFrame(() => this.loop());
    },

    bindInputs() {
      const onFlapTrigger = (e) => {
        if (e && e.target && e.target.closest && e.target.closest('#btnPauseGame')) {
          return; // Don't flap if clicking the pause button
        }
        Sound.unlockAudio();
        if (this.state === 'READY') {
          this.state = 'PLAYING';
          UI.hideReadyPrompt();
        }
        this.flap();
      };

      // Listen on entire screen game area, canvas, and wrapper across pointer, mouse, and touch
      const wrapper = document.getElementById('canvasWrapper');
      if (wrapper) {
        wrapper.addEventListener('pointerdown', onFlapTrigger);
        wrapper.addEventListener('mousedown', onFlapTrigger);
        wrapper.addEventListener('touchstart', onFlapTrigger, { passive: true });
      }
      if (this.canvas) {
        this.canvas.addEventListener('pointerdown', onFlapTrigger);
        this.canvas.addEventListener('mousedown', onFlapTrigger);
        this.canvas.addEventListener('touchstart', onFlapTrigger, { passive: true });
      }

      const readyEl = document.getElementById('readyOverlay');
      if (readyEl) {
        readyEl.addEventListener('pointerdown', onFlapTrigger);
        readyEl.addEventListener('click', onFlapTrigger);
      }

      // Keyboard Spacebar / Up Arrow / W
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          Sound.unlockAudio();
          this.flap();
        } else if (e.code === 'Escape' || e.code === 'KeyP') {
          if (this.state === 'PLAYING') this.pause();
          else if (this.state === 'PAUSED') this.resume();
        }
      });
    }
  };

  /* ==========================================================================
     5. INTERACTIVE PHOTO CROPPER TOOL
     ========================================================================== */
  const CropTool = {
    canvas: null,
    ctx: null,
    container: null,

    rawImg: null,
    zoom: 1.0,
    rotation: 0,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,

    init(canvasEl, containerEl) {
      this.canvas = canvasEl;
      this.ctx = this.canvas.getContext('2d');
      this.container = containerEl;
      this.bindEvents();
    },

    loadImage(src) {
      if (!src) return;
      const img = new Image();
      img.onload = () => {
        this.rawImg = img;
        this.zoom = 1.0;
        this.rotation = 0;
        this.panX = 0;
        this.panY = 0;

        const minDim = Math.min(img.naturalWidth, img.naturalHeight);
        if (minDim > 0) {
          this.zoom = 220 / minDim;
        }

        const zoomSlider = document.getElementById('cropZoomSlider');
        if (zoomSlider) {
          zoomSlider.value = this.zoom.toFixed(2);
          document.getElementById('zoomValDisplay').textContent = `${this.zoom.toFixed(1)}x`;
        }
        const rotSlider = document.getElementById('cropRotateSlider');
        if (rotSlider) {
          rotSlider.value = '0';
          document.getElementById('rotateValDisplay').textContent = '0°';
        }

        this.render();
        Workshop.updateLivePreview();
      };
      img.src = src;
    },

    render() {
      if (!this.canvas || !this.ctx) return;
      const w = this.canvas.width;
      const h = this.canvas.height;
      this.ctx.clearRect(0, 0, w, h);

      if (!this.rawImg) {
        this.ctx.fillStyle = '#64748b';
        this.ctx.font = '14px "Fredoka", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('No image loaded', w / 2, h / 2);
        return;
      }

      this.ctx.save();
      this.ctx.translate(w / 2 + this.panX, h / 2 + this.panY);
      this.ctx.rotate((this.rotation * Math.PI) / 180);
      this.ctx.scale(this.zoom, this.zoom);

      const nw = this.rawImg.naturalWidth;
      const nh = this.rawImg.naturalHeight;
      this.ctx.drawImage(this.rawImg, -nw / 2, -nh / 2, nw, nh);
      this.ctx.restore();
    },

    getCroppedDataURL(size = 256) {
      try {
        const outCanvas = document.createElement('canvas');
        outCanvas.width = size;
        outCanvas.height = size;
        const outCtx = outCanvas.getContext('2d');

        outCtx.save();
        outCtx.beginPath();
        outCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        outCtx.clip();

        if (this.rawImg) {
          const scaleFactor = size / 210;
          outCtx.translate(size / 2 + this.panX * scaleFactor, size / 2 + this.panY * scaleFactor);
          outCtx.rotate((this.rotation * Math.PI) / 180);
          outCtx.scale(this.zoom * scaleFactor, this.zoom * scaleFactor);

          const nw = this.rawImg.naturalWidth;
          const nh = this.rawImg.naturalHeight;
          outCtx.drawImage(this.rawImg, -nw / 2, -nh / 2, nw, nh);
        }
        outCtx.restore();

        return outCanvas.toDataURL('image/png');
      } catch (e) {
        return '';
      }
    },

    bindEvents() {
      let previewDebounce = null;
      const triggerPreview = () => {
        if (previewDebounce) return;
        previewDebounce = setTimeout(() => {
          previewDebounce = null;
          Workshop.updateLivePreview();
        }, 50);
      };

      const getPos = (e) => {
        if (e.touches && e.touches[0]) {
          return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
      };

      const onStart = (e) => {
        this.isDragging = true;
        const p = getPos(e);
        this.dragStartX = p.x - this.panX;
        this.dragStartY = p.y - this.panY;
      };

      const onMove = (e) => {
        if (!this.isDragging) return;
        const p = getPos(e);
        this.panX = p.x - this.dragStartX;
        this.panY = p.y - this.dragStartY;
        this.render();
        triggerPreview();
      };

      const onEnd = () => {
        if (this.isDragging) {
          this.isDragging = false;
          Workshop.updateLivePreview();
        }
      };

      this.container.addEventListener('mousedown', onStart);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);

      this.container.addEventListener('touchstart', onStart, { passive: true });
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('touchend', onEnd);

      this.container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        this.zoom = Math.max(0.3, Math.min(3.5, this.zoom + delta));
        document.getElementById('cropZoomSlider').value = this.zoom.toFixed(2);
        document.getElementById('zoomValDisplay').textContent = `${this.zoom.toFixed(1)}x`;
        this.render();
        triggerPreview();
      }, { passive: false });
    }
  };

  /* ==========================================================================
     6. BIRD WORKSHOP CONTROLLER (Creation, customization & voice recording)
     ========================================================================== */
  const Workshop = {
    currentBird: null,
    isNew: false,
    mediaRecorder: null,
    recordedChunks: [],
    recTimerInterval: null,
    recSecondsLeft: 3,
    activeRecEvent: null,

    livePreviewCanvas: null,
    livePreviewCtx: null,
    livePreviewWingPhase: 0,
    livePreviewAnimId: null,

    init() {
      this.livePreviewCanvas = document.getElementById('workshopBirdCanvas');
      this.livePreviewCtx = this.livePreviewCanvas.getContext('2d');

      CropTool.init(
        document.getElementById('cropCanvas'),
        document.getElementById('cropContainer')
      );

      this.bindInputs();
      this.renderPalettes();
      this.startLivePreviewLoop();
    },

    open(character = null) {
      if (character) {
        this.currentBird = JSON.parse(JSON.stringify(character));
        this.isNew = false;
        document.getElementById('workshopTitle').textContent = `Edit ${this.currentBird.name} 🎨`;
      } else {
        this.isNew = true;
        this.currentBird = {
          id: `bird_${Date.now()}`,
          name: 'My Fluffy Bird',
          photoData: generatePresetPortrait('chick'),
          plumageId: 'yellow',
          wingId: 'white',
          beakId: 'orange',
          hasCheeks: true,
          accessoryId: 'none',
          customVoices: {},
          createdAt: Date.now()
        };
        document.getElementById('workshopTitle').textContent = 'Create New Bird 🐣';
      }

      document.getElementById('birdNameInput').value = this.currentBird.name || 'My Bird';
      document.getElementById('chkRosyCheeks').checked = this.currentBird.hasCheeks !== false;

      CropTool.loadImage(this.currentBird.photoData);

      this.selectSwatch('plumage', this.currentBird.plumageId);
      this.selectSwatch('wing', this.currentBird.wingId);
      this.selectSwatch('beak', this.currentBird.beakId);

      this.renderAccessoriesGrid();
      this.updateVoiceStatusLabels();

      UI.switchScreen('screenWorkshop');
      this.updateLivePreview();
    },

    save() {
      const nameInput = document.getElementById('birdNameInput').value.trim();
      this.currentBird.name = nameInput || 'Fluffy Bird';
      this.currentBird.hasCheeks = document.getElementById('chkRosyCheeks').checked;
      this.currentBird.photoData = CropTool.getCroppedDataURL(256);

      Storage.saveCharacter(this.currentBird).then(() => {
        Storage.setActiveBirdId(this.currentBird.id);
        UI.checkAchievement('create_bird');

        Storage.getAllCharacters().then(birds => {
          if (birds.length >= 3) UI.checkAchievement('flock_3');
        });

        UI.showToast(`Saved "${this.currentBird.name}"! 🐦`, 'toast-achievement');
        UI.refreshActiveBirdDisplay();
        UI.switchScreen('screenHome');
      });
    },

    renderPalettes() {
      const plumContainer = document.getElementById('plumageColorGrid');
      plumContainer.innerHTML = '';
      PLUMAGE_COLORS.forEach(c => {
        const div = document.createElement('div');
        div.className = 'color-swatch';
        div.style.background = c.main;
        div.dataset.id = c.id;
        div.title = c.label;
        div.addEventListener('click', () => {
          this.currentBird.plumageId = c.id;
          this.selectSwatch('plumage', c.id);
          this.updateLivePreview();
        });
        plumContainer.appendChild(div);
      });

      const wingContainer = document.getElementById('wingColorGrid');
      wingContainer.innerHTML = '';
      WING_COLORS.forEach(w => {
        const div = document.createElement('div');
        div.className = 'color-swatch';
        div.style.background = w.color || '#fde047';
        div.dataset.id = w.id;
        div.title = w.label;
        div.addEventListener('click', () => {
          this.currentBird.wingId = w.id;
          this.selectSwatch('wing', w.id);
          this.updateLivePreview();
        });
        wingContainer.appendChild(div);
      });

      const beakContainer = document.getElementById('beakColorGrid');
      beakContainer.innerHTML = '';
      BEAK_COLORS.forEach(b => {
        const div = document.createElement('div');
        div.className = 'color-swatch';
        div.style.background = b.upper;
        div.dataset.id = b.id;
        div.title = b.label;
        div.addEventListener('click', () => {
          this.currentBird.beakId = b.id;
          this.selectSwatch('beak', b.id);
          this.updateLivePreview();
        });
        beakContainer.appendChild(div);
      });
    },

    selectSwatch(type, id) {
      let selector = '';
      if (type === 'plumage') selector = '#plumageColorGrid .color-swatch';
      else if (type === 'wing') selector = '#wingColorGrid .color-swatch';
      else if (type === 'beak') selector = '#beakColorGrid .color-swatch';

      document.querySelectorAll(selector).forEach(el => {
        el.classList.toggle('active', el.dataset.id === id);
      });
    },

    renderAccessoriesGrid() {
      const container = document.getElementById('workshopAccessoryGrid');
      container.innerHTML = '';
      const unlocked = Storage.getUnlockedItems();

      ACCESSORIES.forEach(acc => {
        const isUnlocked = unlocked.includes(acc.id);
        const isEquipped = (this.currentBird.accessoryId || 'none') === acc.id;

        const card = document.createElement('div');
        card.className = `acc-option-chip ${isEquipped ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;
        card.innerHTML = `
          <div class="acc-option-icon">${acc.icon}</div>
          <div class="acc-option-name">${acc.name}</div>
        `;

        card.addEventListener('click', () => {
          if (!isUnlocked) {
            UI.showToast(`Locked! Unlock in Shop for ${acc.price} 🪙`, 'toast');
            return;
          }
          this.currentBird.accessoryId = acc.id;
          this.renderAccessoriesGrid();
          this.updateLivePreview();
        });

        container.appendChild(card);
      });
    },

    updateVoiceStatusLabels() {
      const events = ['flap', 'score', 'crash', 'start', 'gameover'];
      events.forEach(ev => {
        const label = document.getElementById(`voiceStatus_${ev}`);
        if (!label) return;
        if (this.currentBird.customVoices && this.currentBird.customVoices[ev]) {
          label.textContent = 'Custom Voice Active 🎙️';
          label.style.color = '#15803d';
        } else {
          label.textContent = 'Using: Built-in Sound 🎵';
          label.style.color = '#0284c7';
        }
      });
    },

    bindInputs() {
      const photoInput = document.getElementById('photoFileInput');
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            CropTool.loadImage(re.target.result);
            UI.showToast('Photo loaded! Drag and zoom to fit face 📸', 'toast');
          };
          reader.readAsDataURL(file);
        }
      });

      const btnPreset = document.getElementById('btnPickPreset');
      const presetMenu = document.getElementById('presetMenu');
      btnPreset.addEventListener('click', (e) => {
        e.stopPropagation();
        presetMenu.style.display = presetMenu.style.display === 'none' ? 'flex' : 'none';
      });

      window.addEventListener('click', () => {
        presetMenu.style.display = 'none';
      });

      document.querySelectorAll('.preset-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const presetKey = btn.dataset.preset;
          const dataUrl = generatePresetPortrait(presetKey);
          CropTool.loadImage(dataUrl);
          presetMenu.style.display = 'none';
        });
      });

      document.getElementById('btnRemovePhoto').addEventListener('click', () => {
        const dataUrl = generatePresetPortrait('chick');
        CropTool.loadImage(dataUrl);
      });

      const zoomSlider = document.getElementById('cropZoomSlider');
      zoomSlider.addEventListener('input', (e) => {
        CropTool.zoom = parseFloat(e.target.value);
        document.getElementById('zoomValDisplay').textContent = `${CropTool.zoom.toFixed(1)}x`;
        CropTool.render();
        this.updateLivePreview();
      });

      const rotSlider = document.getElementById('cropRotateSlider');
      rotSlider.addEventListener('input', (e) => {
        CropTool.rotation = parseInt(e.target.value, 10);
        document.getElementById('rotateValDisplay').textContent = `${CropTool.rotation}°`;
        CropTool.render();
        this.updateLivePreview();
      });

      document.getElementById('btnCenterCrop').addEventListener('click', () => {
        CropTool.panX = 0;
        CropTool.panY = 0;
        CropTool.rotation = 0;
        rotSlider.value = '0';
        document.getElementById('rotateValDisplay').textContent = '0°';
        CropTool.render();
        this.updateLivePreview();
      });

      document.getElementById('chkRosyCheeks').addEventListener('change', (e) => {
        this.currentBird.hasCheeks = e.target.checked;
        this.updateLivePreview();
      });

      document.querySelectorAll('.workshop-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.workshop-tabs .tab-btn').forEach(b => b.classList.remove('active'));
          document.querySelectorAll('.workshop-scroll-content .tab-pane').forEach(p => p.classList.remove('active'));

          btn.classList.add('active');
          const target = document.getElementById(btn.dataset.tab);
          if (target) target.classList.add('active');
        });
      });

      document.querySelectorAll('.btn-record').forEach(btn => {
        btn.addEventListener('click', () => {
          const ev = btn.dataset.event;
          this.startVoiceRecording(ev);
        });
      });

      document.querySelectorAll('.audio-file-input').forEach(input => {
        input.addEventListener('change', (e) => {
          const ev = input.dataset.event;
          const file = e.target.files && e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
              if (!this.currentBird.customVoices) this.currentBird.customVoices = {};
              this.currentBird.customVoices[ev] = re.target.result;
              this.updateVoiceStatusLabels();
              UI.checkAchievement('custom_voice');
              UI.showToast(`Custom voice uploaded for ${ev}! 🎙️`, 'toast-achievement');
            };
            reader.readAsDataURL(file);
          }
        });
      });

      document.querySelectorAll('.btn-preview-audio').forEach(btn => {
        btn.addEventListener('click', () => {
          const ev = btn.dataset.event;
          Sound.playCharacterEvent(this.currentBird, ev);
        });
      });

      document.querySelectorAll('.btn-clear-audio').forEach(btn => {
        btn.addEventListener('click', () => {
          const ev = btn.dataset.event;
          if (this.currentBird.customVoices) {
            delete this.currentBird.customVoices[ev];
          }
          this.updateVoiceStatusLabels();
          UI.showToast(`Reset ${ev} to default built-in sound.`, 'toast');
        });
      });

      document.getElementById('btnStopRecording').addEventListener('click', () => {
        this.stopVoiceRecording();
      });

      document.getElementById('btnWorkshopFlapTest').addEventListener('click', () => {
        this.livePreviewWingPhase += Math.PI;
        Sound.playCharacterEvent(this.currentBird, 'flap');
      });

      document.getElementById('btnSaveBird').addEventListener('click', () => this.save());
      document.getElementById('btnCancelWorkshop').addEventListener('click', () => {
        UI.switchScreen('screenHome');
      });
      document.getElementById('btnBackFromWorkshop').addEventListener('click', () => {
        UI.switchScreen('screenHome');
      });
    },

    startVoiceRecording(eventName) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        UI.showToast('Microphone access is not supported in this browser.', 'toast');
        return;
      }

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          this.activeRecEvent = eventName;
          this.recordedChunks = [];
          this.mediaRecorder = new MediaRecorder(stream);

          this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              this.recordedChunks.push(e.data);
            }
          };

          this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onload = (re) => {
              if (!this.currentBird.customVoices) this.currentBird.customVoices = {};
              this.currentBird.customVoices[this.activeRecEvent] = re.target.result;
              this.updateVoiceStatusLabels();
              UI.checkAchievement('custom_voice');
              UI.showToast(`Recorded voice saved for ${this.activeRecEvent}! 🎉`, 'toast-achievement');
            };
            reader.readAsDataURL(blob);

            stream.getTracks().forEach(track => track.stop());
          };

          this.mediaRecorder.start();

          const modal = document.getElementById('recordingModal');
          const timerDisplay = document.getElementById('recTimerDisplay');
          modal.style.display = 'flex';

          this.recSecondsLeft = 3;
          timerDisplay.textContent = `00:0${this.recSecondsLeft}`;

          this.recTimerInterval = setInterval(() => {
            this.recSecondsLeft--;
            timerDisplay.textContent = `00:0${this.recSecondsLeft}`;
            if (this.recSecondsLeft <= 0) {
              this.stopVoiceRecording();
            }
          }, 1000);
        })
        .catch(err => {
          console.warn('Microphone permission denied or unavailable:', err);
          UI.showToast('Microphone permission was denied or unavailable.', 'toast');
        });
    },

    stopVoiceRecording() {
      if (this.recTimerInterval) {
        clearInterval(this.recTimerInterval);
        this.recTimerInterval = null;
      }
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      document.getElementById('recordingModal').style.display = 'none';
    },

    startLivePreviewLoop() {
      const render = () => {
        this.livePreviewWingPhase += 0.1;
        this.renderLivePreview();
        this.livePreviewAnimId = requestAnimationFrame(render);
      };
      this.livePreviewAnimId = requestAnimationFrame(render);
    },

    updateLivePreview() {
      if (!this.currentBird) return;
      this.currentBird.photoData = CropTool.getCroppedDataURL(160);
    },

    renderLivePreview() {
      if (!this.livePreviewCtx || !this.currentBird) return;
      const ctx = this.livePreviewCtx;
      const w = this.livePreviewCanvas.width;
      const h = this.livePreviewCanvas.height;
      ctx.clearRect(0, 0, w, h);

      const bobY = Math.sin(this.livePreviewWingPhase * 0.7) * 5;
      BirdRenderer.drawBird(ctx, this.currentBird, w / 2, h / 2 + bobY, 44, 0, this.livePreviewWingPhase, 0);
    }
  };

  /* ==========================================================================
     7. UI & SCREEN NAVIGATION MANAGER
     ========================================================================== */
  const UI = {
    activeScreenId: 'screenHome',
    activeBird: FALLBACK_DEFAULT_BIRDS[0],
    homeAnimId: null,
    homeWingPhase: 0,

    init() {
      // 1. Bind buttons & DOM immediately (Instant synchronous readiness)
      UI.bindButtons();
      UI.updateCoinsBadge();
      UI.updateDailyRewardUI();
      UI.updateAudioIcons();
      UI.startHomeBirdLoop();

      // 2. Initialize Audio & Game Canvas & Workshop
      Sound.init();
      Game.init(document.getElementById('gameCanvas'));
      Workshop.init();

      // 3. Render immediate fallback bird display
      UI.refreshActiveBirdDisplay();

      // 4. Asynchronously sync persistent data from storage
      Storage.init().then(() => {
        UI.refreshActiveBirdDisplay();
        UI.updateCoinsBadge();
        UI.updateDailyRewardUI();
      });
    },

    startHomeBirdLoop() {
      if (this.homeAnimId) cancelAnimationFrame(this.homeAnimId);
      const homeCanvas = document.getElementById('homeBirdCanvas');
      if (!homeCanvas) return;
      const ctx = homeCanvas.getContext('2d');

      const loop = () => {
        if (this.activeScreenId === 'screenHome') {
          this.homeWingPhase += 0.08;
          ctx.clearRect(0, 0, homeCanvas.width, homeCanvas.height);
          const bobY = Math.sin(this.homeWingPhase * 0.7) * 4;
          BirdRenderer.drawBird(ctx, this.activeBird, homeCanvas.width / 2, homeCanvas.height / 2 + bobY, 36, 0, this.homeWingPhase, 0);
        }
        this.homeAnimId = requestAnimationFrame(loop);
      };
      this.homeAnimId = requestAnimationFrame(loop);
    },

    async refreshActiveBirdDisplay() {
      const activeId = Storage.getActiveBirdId();
      let bird = await Storage.getCharacter(activeId);
      if (!bird) {
        const list = await Storage.getAllCharacters();
        bird = list[0] || FALLBACK_DEFAULT_BIRDS[0];
        if (bird) Storage.setActiveBirdId(bird.id);
      }
      this.activeBird = bird || FALLBACK_DEFAULT_BIRDS[0];

      if (this.activeBird) {
        const nameEl = document.getElementById('homeBirdName');
        if (nameEl) nameEl.textContent = this.activeBird.name;
        this.renderPreviewCanvas(document.getElementById('homeBirdCanvas'), this.activeBird, 38);
      }
    },

    renderPreviewCanvas(canvasEl, character, radius = 35) {
      if (!canvasEl) return;
      const ctx = canvasEl.getContext('2d');
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      BirdRenderer.drawBird(ctx, character || FALLBACK_DEFAULT_BIRDS[0], canvasEl.width / 2, canvasEl.height / 2, radius, 0, 0, 0);
    },

    updateCoinsBadge() {
      const coins = Storage.getCoins();
      const pCoins = document.getElementById('playerCoins');
      if (pCoins) pCoins.textContent = coins;
      const shopCoins = document.getElementById('shopCoinsDisplay');
      if (shopCoins) shopCoins.textContent = coins;
    },

    switchScreen(screenId) {
      document.querySelectorAll('.game-screen').forEach(s => {
        s.classList.remove('active');
        s.style.setProperty('display', 'none', 'important');
      });
      const target = document.getElementById(screenId);
      if (target) {
        target.classList.add('active');
        target.style.setProperty('display', 'flex', 'important');
        this.activeScreenId = screenId;
      }
    },

    showToast(message, extraClass = '') {
      const container = document.getElementById('toastContainer');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = `toast ${extraClass}`;
      toast.textContent = message;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(15px)';
        setTimeout(() => toast.remove(), 300);
      }, 2600);
    },

    checkAchievement(id) {
      const def = ACHIEVEMENTS_DEF.find(a => a.id === id);
      if (!def) return;
      if (Storage.unlockAchievement(id)) {
        Storage.addCoins(def.reward);
        this.updateCoinsBadge();
        Sound.playScore();
        this.showToast(`🏆 Badge Unlocked: ${def.name} (+${def.reward} 🪙)`, 'toast-achievement');
      }
    },

    updateDailyRewardUI() {
      const info = Storage.getDailyRewardInfo();
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const elapsed = now - (info.lastClaimTime || 0);

      const rewardDot = document.getElementById('rewardDot');
      const btnClaim = document.getElementById('btnClaimDaily');
      const countdown = document.getElementById('dailyCountdown');

      const canClaim = elapsed >= oneDayMs || !info.lastClaimTime;

      if (rewardDot) {
        rewardDot.classList.toggle('show', canClaim);
      }

      if (btnClaim) {
        btnClaim.disabled = !canClaim;
        btnClaim.textContent = canClaim ? '🎁 Claim Daily Coins!' : 'Claimed for Today';
      }

      if (countdown) {
        if (canClaim) {
          countdown.textContent = 'Ready to claim right now!';
        } else {
          const remainingMs = oneDayMs - elapsed;
          const hrs = Math.floor(remainingMs / (1000 * 60 * 60));
          const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          countdown.textContent = `Next bonus in: ${hrs}h ${mins}m`;
        }
      }

      const track = document.getElementById('dailyStreakTrack');
      if (track) {
        track.innerHTML = '';
        const rewards = [50, 75, 100, 150, 200, 250, 500];
        const currentDayIndex = (info.streak || 0) % 7;

        for (let i = 0; i < 7; i++) {
          const cell = document.createElement('div');
          const isClaimed = i < currentDayIndex;
          const isCurrent = i === currentDayIndex;
          cell.className = `streak-day-cell ${isClaimed ? 'claimed' : ''} ${isCurrent ? 'current' : ''}`;
          cell.innerHTML = `
            <span class="streak-day-num">D${i + 1}</span>
            <span class="streak-day-reward">+${rewards[i]}</span>
          `;
          track.appendChild(cell);
        }
      }
    },

    claimDailyReward() {
      const info = Storage.getDailyRewardInfo();
      const rewards = [50, 75, 100, 150, 200, 250, 500];
      const streakIdx = (info.streak || 0) % 7;
      const bonus = rewards[streakIdx];

      Storage.addCoins(bonus);
      info.lastClaimTime = Date.now();
      info.streak = (info.streak || 0) + 1;
      Storage.setDailyRewardInfo(info);

      this.updateCoinsBadge();
      this.updateDailyRewardUI();
      Sound.playScore();
      this.showToast(`🎁 Claimed Day ${streakIdx + 1} bonus: +${bonus} Coins!`, 'toast-achievement');
    },

    async openGallery() {
      const rosterGrid = document.getElementById('birdRosterGrid');
      rosterGrid.innerHTML = '';
      const birds = await Storage.getAllCharacters();
      const activeId = Storage.getActiveBirdId();

      birds.forEach(bird => {
        const isActive = bird.id === activeId;
        const card = document.createElement('div');
        card.className = `roster-card ${isActive ? 'active-bird' : ''}`;

        const canvasId = `roster_canvas_${bird.id}`;
        card.innerHTML = `
          ${isActive ? '<span class="roster-equipped-badge">FLYING NOW</span>' : ''}
          <div class="roster-card-canvas-wrap">
            <canvas id="${canvasId}" width="90" height="90"></canvas>
          </div>
          <div class="roster-bird-name">${bird.name}</div>
          <div class="roster-bird-meta">Best: ${(Storage.getHighScores().classic) || 0} pts</div>
          <div class="roster-card-actions">
            ${!isActive ? `<button class="btn btn-primary btn-sm btn-select-bird" data-id="${bird.id}">Fly With Bird</button>` : ''}
            <div class="roster-secondary-btns">
              <button class="btn btn-ghost btn-sm btn-edit-bird" data-id="${bird.id}">✏️ Edit</button>
              ${birds.length > 1 ? `<button class="btn btn-ghost btn-sm text-danger btn-delete-bird" data-id="${bird.id}">🗑️</button>` : ''}
            </div>
          </div>
        `;

        rosterGrid.appendChild(card);

        setTimeout(() => {
          const c = document.getElementById(canvasId);
          if (c) this.renderPreviewCanvas(c, bird, 34);
        }, 10);
      });

      rosterGrid.querySelectorAll('.btn-select-bird').forEach(btn => {
        btn.addEventListener('click', () => {
          Storage.setActiveBirdId(btn.dataset.id);
          this.refreshActiveBirdDisplay();
          this.openGallery();
          this.showToast('Bird selected! Ready to fly! 🚀', 'toast');
        });
      });

      rosterGrid.querySelectorAll('.btn-edit-bird').forEach(btn => {
        btn.addEventListener('click', async () => {
          const bird = await Storage.getCharacter(btn.dataset.id);
          if (bird) Workshop.open(bird);
        });
      });

      rosterGrid.querySelectorAll('.btn-delete-bird').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Delete this fluffy bird?')) {
            await Storage.deleteCharacter(btn.dataset.id);
            await this.refreshActiveBirdDisplay();
            this.openGallery();
          }
        });
      });

      this.switchScreen('screenGallery');
    },

    openShop(category = 'hats') {
      const itemsGrid = document.getElementById('shopItemsGrid');
      itemsGrid.innerHTML = '';
      const unlocked = Storage.getUnlockedItems();
      const coins = Storage.getCoins();
      const currentAcc = (this.activeBird && this.activeBird.accessoryId) || 'none';

      document.getElementById('shopCoinsDisplay').textContent = coins;

      const items = ACCESSORIES.filter(a => a.category === category || a.id === 'none');

      items.forEach(item => {
        const isUnlocked = unlocked.includes(item.id);
        const isEquipped = currentAcc === item.id;
        const canAfford = coins >= item.price;

        const card = document.createElement('div');
        card.className = `shop-item-card ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="shop-item-icon">${item.icon}</div>
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.desc}</div>
          <div class="shop-item-price">${item.price === 0 ? 'Free' : `${item.price} 🪙`}</div>
          ${isEquipped 
            ? '<button class="btn btn-ghost btn-sm" disabled>Equipped</button>'
            : isUnlocked
              ? `<button class="btn btn-secondary btn-sm btn-equip" data-id="${item.id}">Equip</button>`
              : `<button class="btn btn-primary btn-sm btn-buy" data-id="${item.id}" ${!canAfford ? 'disabled' : ''}>Buy (${item.price} 🪙)</button>`
          }
        `;
        itemsGrid.appendChild(card);
      });

      document.querySelectorAll('.shop-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.shoptab === category);
      });

      itemsGrid.querySelectorAll('.btn-equip').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this.activeBird) {
            this.activeBird.accessoryId = btn.dataset.id;
            Storage.saveCharacter(this.activeBird);
            this.refreshActiveBirdDisplay();
            this.openShop(category);
            UI.checkAchievement('fashionista');
            UI.showToast(`Equipped ${btn.dataset.id}! ✨`, 'toast');
          }
        });
      });

      itemsGrid.querySelectorAll('.btn-buy').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = ACCESSORIES.find(a => a.id === btn.dataset.id);
          if (item && Storage.getCoins() >= item.price) {
            Storage.addCoins(-item.price);
            Storage.unlockItem(item.id);
            if (this.activeBird) {
              this.activeBird.accessoryId = item.id;
              Storage.saveCharacter(this.activeBird);
            }
            this.updateCoinsBadge();
            this.refreshActiveBirdDisplay();
            this.openShop(category);
            UI.checkAchievement('fashionista');
            Sound.playCoin();
            UI.showToast(`Unlocked ${item.name}! 🎉`, 'toast-achievement');
          }
        });
      });

      this.switchScreen('screenShop');
    },

    openAchievements() {
      const listContainer = document.getElementById('achievementsList');
      listContainer.innerHTML = '';
      const unlocked = Storage.getAchievements();

      ACHIEVEMENTS_DEF.forEach(ach => {
        const isUnlocked = !!unlocked[ach.id];
        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;
        card.innerHTML = `
          <div class="ach-icon">${ach.icon}</div>
          <div class="ach-details">
            <div class="ach-name">${ach.name}</div>
            <div class="ach-desc">${ach.desc}</div>
          </div>
          <div class="ach-reward">${isUnlocked ? '✅ Claimed' : `+${ach.reward} 🪙`}</div>
        `;
        listContainer.appendChild(card);
      });

      this.updateDailyRewardUI();
      this.switchScreen('screenAchievements');
    },

    async openLeaderboard(mode = 'classic') {
      const tbody = document.getElementById('leaderboardTbody');
      tbody.innerHTML = '';
      const scores = Storage.getHighScores();
      const birds = await Storage.getAllCharacters();

      document.querySelectorAll('.lb-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lbmode === mode);
      });

      const rows = [
        { rank: '🥇 1st', bird: birds[0] || FALLBACK_DEFAULT_BIRDS[0], name: (birds[0] && birds[0].name) || 'Pip', score: scores[mode] || 0 },
        { rank: '🥈 2nd', bird: birds[1] || FALLBACK_DEFAULT_BIRDS[1], name: (birds[1] && birds[1].name) || 'Whiskers', score: Math.max(0, (scores[mode] || 0) - 4) },
        { rank: '🥉 3rd', bird: birds[2] || FALLBACK_DEFAULT_BIRDS[2], name: (birds[2] && birds[2].name) || 'Buster', score: Math.max(0, (scores[mode] || 0) - 8) }
      ];

      rows.forEach(r => {
        const tr = document.createElement('tr');
        const thumbId = `lb_thumb_${Math.random().toString(36).substr(2, 6)}`;
        tr.innerHTML = `
          <td class="lb-rank">${r.rank}</td>
          <td class="lb-bird-cell">
            <div class="lb-bird-thumb">
              <canvas id="${thumbId}" width="36" height="36"></canvas>
            </div>
          </td>
          <td><strong>${r.name}</strong></td>
          <td class="lb-score">${r.score}</td>
        `;
        tbody.appendChild(tr);

        setTimeout(() => {
          const c = document.getElementById(thumbId);
          if (c && r.bird) this.renderPreviewCanvas(c, r.bird, 14);
        }, 10);
      });

      this.switchScreen('screenLeaderboard');
    },

    showReadyPrompt(birdName) {
      document.getElementById('readyOverlay').style.display = 'flex';
      document.getElementById('pauseOverlay').style.display = 'none';
      document.getElementById('gameOverOverlay').style.display = 'none';
      document.getElementById('readyBirdTag').textContent = `Flying as ${birdName || 'Sunny Pip'}`;
    },

    hideReadyPrompt() {
      document.getElementById('readyOverlay').style.display = 'none';
    },

    showPauseOverlay() {
      document.getElementById('pauseOverlay').style.display = 'flex';
      document.getElementById('chkPauseBgm').checked = !Sound.bgmMuted;
      document.getElementById('chkPauseSfx').checked = !Sound.sfxMuted;
    },

    hidePauseOverlay() {
      document.getElementById('pauseOverlay').style.display = 'none';
    },

    showGameOverOverlay(score, coinsEarned, mode, isNewRecord, bird) {
      const overlay = document.getElementById('gameOverOverlay');
      overlay.style.display = 'flex';

      document.getElementById('goFinalScore').textContent = score;
      const bestScore = Storage.getHighScores()[mode] || score;
      document.getElementById('goBestScore').textContent = bestScore;
      document.getElementById('goCoinsEarned').textContent = coinsEarned;

      const recordBadge = document.getElementById('goNewRecordBadge');
      recordBadge.style.display = isNewRecord ? 'inline-block' : 'none';

      const medalIcon = document.getElementById('goMedalIcon');
      const medalText = document.getElementById('goMedalText');
      if (score >= 50) {
        medalIcon.textContent = '🥇';
        medalText.textContent = 'Gold Flapper Legend!';
      } else if (score >= 25) {
        medalIcon.textContent = '🥈';
        medalText.textContent = 'Silver Sky Master';
      } else if (score >= 10) {
        medalIcon.textContent = '🥉';
        medalText.textContent = 'Bronze Pipe Hopper';
      } else {
        medalIcon.textContent = '🐣';
        medalText.textContent = 'Baby Bird Flight';
      }

      const goCanvas = document.getElementById('gameOverBirdCanvas');
      if (goCanvas && bird) {
        this.renderPreviewCanvas(goCanvas, bird, 40);
      }
    },

    updateInGameHud(score, coins, mode) {
      document.getElementById('hudScore').textContent = score;
      document.getElementById('hudCoins').textContent = coins;
      document.getElementById('hudModeTag').textContent = mode;
      const mult = document.getElementById('hudMultiplier');
      mult.style.display = mode === 'challenge' ? 'inline-block' : 'none';
    },

    updateAudioIcons() {
      document.getElementById('btnMuteBgmTop').textContent = Sound.bgmMuted ? '🔇' : '🎵';
      document.getElementById('btnMuteSfxTop').textContent = Sound.sfxMuted ? '🔈' : '🔊';
    },

    bindButtons() {
      document.getElementById('btnMuteBgmTop').addEventListener('click', () => {
        Sound.toggleBGM();
        UI.updateAudioIcons();
      });
      document.getElementById('btnMuteSfxTop').addEventListener('click', () => {
        Sound.toggleSFX();
        UI.updateAudioIcons();
      });

      document.getElementById('btnDailyRewardTop').addEventListener('click', () => {
        UI.openAchievements();
      });

      document.querySelectorAll('.mode-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          document.querySelectorAll('.mode-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          Game.setMode(pill.dataset.mode);
        });
      });

      document.getElementById('btnPlayGame').addEventListener('click', () => {
        Sound.unlockAudio();
        UI.switchScreen('screenGame');
        Game.startFlight(UI.activeBird);
      });

      document.getElementById('btnOpenWorkshop').addEventListener('click', () => {
        Workshop.open(UI.activeBird);
      });
      document.getElementById('btnQuickEditBird').addEventListener('click', () => {
        Workshop.open(UI.activeBird);
      });

      document.getElementById('btnOpenGallery').addEventListener('click', () => UI.openGallery());
      document.getElementById('btnOpenShop').addEventListener('click', () => UI.openShop('hats'));
      document.getElementById('btnOpenAchievements').addEventListener('click', () => UI.openAchievements());
      document.getElementById('btnOpenLeaderboard').addEventListener('click', () => UI.openLeaderboard('classic'));

      document.getElementById('btnBackFromGallery').addEventListener('click', () => UI.switchScreen('screenHome'));
      document.getElementById('btnBackFromShop').addEventListener('click', () => UI.switchScreen('screenHome'));
      document.getElementById('btnBackFromAchievements').addEventListener('click', () => UI.switchScreen('screenHome'));
      document.getElementById('btnBackFromLeaderboard').addEventListener('click', () => UI.switchScreen('screenHome'));

      document.getElementById('btnCreateNewFromGallery').addEventListener('click', () => {
        Workshop.open(null);
      });

      document.querySelectorAll('.shop-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          UI.openShop(btn.dataset.shoptab);
        });
      });

      document.querySelectorAll('.lb-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          UI.openLeaderboard(btn.dataset.lbmode);
        });
      });

      document.getElementById('btnClaimDaily').addEventListener('click', () => {
        UI.claimDailyReward();
      });

      const pauseBtn = document.getElementById('btnPauseGame');
      pauseBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
      pauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        Game.pause();
      });

      document.getElementById('btnResumeGame').addEventListener('click', () => {
        Game.resume();
      });
      document.getElementById('btnRestartGame').addEventListener('click', () => {
        UI.hidePauseOverlay();
        Game.restart();
      });
      document.getElementById('btnQuitToHome').addEventListener('click', () => {
        UI.hidePauseOverlay();
        Sound.stopBGM();
        UI.switchScreen('screenHome');
      });

      document.getElementById('chkPauseBgm').addEventListener('change', () => {
        Sound.toggleBGM();
        UI.updateAudioIcons();
      });
      document.getElementById('chkPauseSfx').addEventListener('change', () => {
        Sound.toggleSFX();
        UI.updateAudioIcons();
      });

      document.getElementById('btnPlayAgain').addEventListener('click', () => {
        document.getElementById('gameOverOverlay').style.display = 'none';
        Game.restart();
      });
      document.getElementById('btnChangeBirdGo').addEventListener('click', () => {
        document.getElementById('gameOverOverlay').style.display = 'none';
        Sound.stopBGM();
        UI.openGallery();
      });
      document.getElementById('btnHomeFromGo').addEventListener('click', () => {
        document.getElementById('gameOverOverlay').style.display = 'none';
        Sound.stopBGM();
        UI.refreshActiveBirdDisplay();
        UI.switchScreen('screenHome');
      });
    }
  };

  // Expose on window for accessibility, debugging and test automation
  window.Game = Game;
  window.UI = UI;
  window.Sound = Sound;
  window.Storage = Storage;
  window.BirdRenderer = BirdRenderer;
  window.Workshop = Workshop;

  // Immediate and DOM-ready launch protection
  function bootApp() {
    UI.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootApp);
  } else {
    bootApp();
  }

})();
