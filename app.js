/**
 * MARGIN - Local Knowledge Retrieval Tool for Writers
 * Zero-backend, single-page application using HTML, CSS, and Vanilla JavaScript.
 * Runs completely client-side. All clips stored in localStorage under 'collider_clips'.
 */

// ============================================================================
// 1. HARDCODED STOP-WORDS (50+ Common English Stop-Words)
// ============================================================================
const STOP_WORDS = [
  "the", "and", "is", "in", "about", "a", "an", "of", "to", "it",
  "that", "with", "as", "for", "was", "on", "are", "by", "this", "be",
  "or", "from", "at", "which", "but", "not", "have", "has", "had", "they",
  "you", "we", "can", "will", "all", "were", "there", "their", "what", "so",
  "up", "out", "if", "who", "get", "go", "me", "when", "make", "like",
  "time", "no", "just", "him", "know", "take", "people", "into", "year", "your",
  "good", "some", "could", "them", "see", "other", "than", "then", "now", "look",
  "only", "come", "its", "over", "think", "also", "back", "after", "use", "two",
  "how", "our", "work", "first", "well", "way", "even", "new", "want", "because",
  "any", "these", "give", "day", "most", "us"
];

const STOP_WORDS_SET = new Set(STOP_WORDS.map(word => word.toLowerCase()));

// ============================================================================
// 2. CURATED SEED / SAMPLE CLIPS (For instant out-of-the-box testing)
// ============================================================================
const SAMPLE_CLIPS = [
  {
    id: "clip-seed-1",
    url: "https://www.theatlantic.com/magazine/archive/1945/07/as-we-may-think/303881/",
    highlighted_text: "Consider a future device for individual use, which is a sort of mechanized private file and library. It needs a name, and to coin one at random, 'memex' will do. A memex is a device in which an individual stores all his books, records, and communications, and which is mechanized so that it may be consulted with exceeding speed and flexibility. It is an enlarged intimate supplement to his memory.",
    date_saved: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: "clip-seed-2",
    url: "https://paulgraham.com/words.html",
    highlighted_text: "Writing doesn't just communicate ideas; it generates them. If you're thinking without writing, you only think you're thinking. Putting ideas into words forces you to confront vagueness, discover unexpected connections, and build logical structure.",
    date_saved: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: "clip-seed-3",
    url: "https://fortelabs.com/blog/basb/",
    highlighted_text: "Your mind is for having ideas, not holding them. A personal knowledge management system creates serendipity by surfacing relevant notes, highlights, and insights right at the moment you are writing or solving problems.",
    date_saved: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "clip-seed-4",
    url: "https://stevenberlinjohnson.com/where-good-ideas-come-from-2010/",
    highlighted_text: "Innovative ideas rarely happen in isolation. They are collisions between slow hunches, accidental juxtapositions, and the serendipitous cross-pollination of diverse disciplines and archived research.",
    date_saved: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "clip-seed-5",
    url: "https://andymatuschak.org/evergreen-notes/",
    highlighted_text: "Evergreen notes should be concept-oriented and densely linked. By creating associational trails across disparate reading notes, writers develop durable intellectual compound interest over decades.",
    date_saved: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: "clip-seed-6",
    url: "https://theamericanscholar.org/why-i-write/",
    highlighted_text: "I write entirely to find out what I'm thinking, what I'm looking at, what I see and what it means. What I want and what I fear. The grammar is a tool to rearrange reality.",
    date_saved: new Date(Date.now() - 3600000 * 10).toISOString()
  },
  {
    id: "clip-seed-7",
    url: "https://www.harpercollins.com/products/on-writing-well-william-zinsser",
    highlighted_text: "Clutter is the disease of American writing. We are a society strangling in unnecessary words, circular constructions, pompous frills, and meaningless jargon. Simplify, prune, and clear the weeds.",
    date_saved: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

// Sample drafts for quick demonstration
const SAMPLE_DRAFTS = {
  memex: `When building modern tools for writers, the primary ambition must be cognitive augmentation. We need systems that function like an associational memex, connecting our active thinking with serendipitous reading notes and memory archives. Rather than holding complex ideas entirely in working memory, digital environments should synthesize connections automatically, turning disparate hunches into rich intellectual trails.`,
  thinking: `Writing is not simply transcribing finished thoughts onto the page. The act of putting raw concepts into clear words forces the mind to confront clutter, jargon, and vague intuition. Through the friction of composition, we discover what we actually believe and generate unexpected conceptual links.`,
  serendipity: `Great creative breakthroughs emerge from the collision of slow hunches. When an author creates a dense web of linked notes, accidental juxtapositions occur. A second brain is valuable not because it acts as a passive repository, but because it triggers unexpected cross-pollination across disciplines at the precise moment of writing.`
};

// ============================================================================
// 3. STORAGE & STATE MANAGEMENT (`collider_clips`)
// ============================================================================
const STORAGE_KEY = 'collider_clips';
const DEBOUNCE_DELAY_MS = 500;

let debounceTimeout = null;

/**
 * Retrieve saved clips from localStorage.
 * Initializes with curated sample clips if localStorage is empty or uninitialized.
 */
function getSavedClips() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First run: seed sample clips
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_CLIPS));
      return [...SAMPLE_CLIPS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error("Failed to read clips from localStorage:", err);
    return [];
  }
}

/**
 * Save array of clips to localStorage.
 */
function saveClips(clips) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clips));
    updateHeaderStats();
    renderManageClipsList();
  } catch (err) {
    console.error("Failed to save clips to localStorage:", err);
    showToast("Storage error: Failed to save clip.", "error");
  }
}

/**
 * Add a new clip to localStorage.
 */
function addClip(url, highlighted_text) {
  const clips = getSavedClips();
  const newClip = {
    id: "clip_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    url: url.trim(),
    highlighted_text: highlighted_text.trim(),
    date_saved: new Date().toISOString()
  };
  clips.unshift(newClip);
  saveClips(clips);
  return newClip;
}

/**
 * Delete a clip by id.
 */
function deleteClip(id) {
  const clips = getSavedClips();
  const filtered = clips.filter(c => c.id !== id);
  saveClips(filtered);
  runCollisionEngine();
}

/**
 * Reset clips to default sample data.
 */
function resetToSampleClips() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_CLIPS));
  updateHeaderStats();
  renderManageClipsList();
  runCollisionEngine();
  showToast("Restored 7 sample highlights.");
}

/**
 * Clear all clips from localStorage.
 */
function clearAllClips() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  updateHeaderStats();
  renderManageClipsList();
  runCollisionEngine();
  showToast("All clips cleared.");
}

// ============================================================================
// 4. THE COLLISION ENGINE (Local Math & Logic)
// ============================================================================

/**
 * Step 1 & 2:
 * - Strip punctuation and stop-words from draft text.
 * - Extract the remaining "heavy" words.
 */
function extractHeavyWords(text) {
  if (!text || typeof text !== 'string') return [];

  // Strip punctuation and special characters, keep letters and digits
  const cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ');

  // Split into tokens
  const tokens = cleaned.split(/\s+/).filter(Boolean);

  // Filter out stop words and short noise (words of length <= 2)
  const heavy = tokens.filter(token => {
    return token.length > 2 && !STOP_WORDS_SET.has(token);
  });

  // Return distinct list of heavy words
  return Array.from(new Set(heavy));
}

/**
 * Step 3:
 * Loop through saved snippet text. Count how many heavy words from the draft
 * appear in each saved snippet.
 */
function calculateOverlap(draftHeavyWords, snippetText) {
  if (!draftHeavyWords.length || !snippetText) {
    return { count: 0, matchedWords: [] };
  }

  // Tokenize snippet text with the same clean rules
  const cleanedSnippet = snippetText.toLowerCase().replace(/[^\w\s]/g, ' ');
  const snippetTokens = new Set(cleanedSnippet.split(/\s+/).filter(Boolean));

  // Find overlapping words
  const matchedWords = draftHeavyWords.filter(word => snippetTokens.has(word));

  return {
    count: matchedWords.length,
    matchedWords
  };
}

/**
 * Step 4:
 * Rank clips based on the highest overlap count and pick top 3 scoring snippets.
 */
function rankClips(draftHeavyWords, clips) {
  if (!draftHeavyWords.length || !clips.length) {
    return [];
  }

  const scoredClips = clips.map(clip => {
    const { count, matchedWords } = calculateOverlap(draftHeavyWords, clip.highlighted_text);
    return {
      clip,
      score: count,
      matchedWords
    };
  });

  // Keep only snippets with at least 1 heavy-word overlap
  const matches = scoredClips.filter(item => item.score > 0);

  // Rank by overlap count descending (highest score first)
  matches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Tie breaker: most recently saved
    return new Date(b.clip.date_saved || 0) - new Date(a.clip.date_saved || 0);
  });

  // Return top 3 scoring snippets
  return matches.slice(0, 3);
}

// ============================================================================
// 5. OUTPUT RENDERING & VISUAL FEEDBACK
// ============================================================================

/**
 * Escape HTML to prevent XSS vulnerabilities.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escape string for inclusion inside RegExp.
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlight overlapping words in snippet using regex and <mark> tags.
 */
function renderHighlightedSnippet(snippetText, matchedWords) {
  const safeText = escapeHtml(snippetText);

  if (!matchedWords || matchedWords.length === 0) {
    return safeText;
  }

  // Sort matched words by length descending so longer words match first
  const sortedWords = [...matchedWords].sort((a, b) => b.length - a.length);
  const pattern = sortedWords.map(w => escapeRegExp(w)).join('|');
  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');

  return safeText.replace(regex, '<mark class="highlight-match">$1</mark>');
}

/**
 * Format domain name from URL for clean card presentation.
 */
function formatUrlDisplay(urlString) {
  try {
    const parsed = new URL(urlString);
    return parsed.hostname.replace(/^www\./, '');
  } catch (e) {
    return urlString.replace(/^https?:\/\//, '').split('/')[0] || urlString;
  }
}

/**
 * Format saved date nicely (e.g. "Nov 8, 2026").
 */
function formatDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return '';
  }
}

/**
 * Render the collision board state.
 */
function renderCollisionBoard(topMatches, totalDraftWords, hasInput) {
  const boardBody = document.getElementById('collisionBoardBody');
  const matchCountBadge = document.getElementById('matchCountBadge');

  if (!boardBody) return;

  if (!hasInput || topMatches.length === 0) {
    matchCountBadge.textContent = '0 matches';
    matchCountBadge.classList.remove('has-matches');

    boardBody.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        </div>
        <p class="empty-state-text">Start typing to surface relevant highlights.</p>
        <p class="empty-state-subtext">
          ${hasInput 
            ? "No heavy-word overlaps found yet with your saved highlights. Keep expanding your thoughts!" 
            : "Paste or write a draft on the left. Margin automatically extracts heavy concepts and collides them with your saved clips."}
        </p>
        ${!hasInput ? `
          <div class="empty-state-action">
            <button class="ghost-btn" id="emptyStateSampleBtn" style="border: 1px solid var(--border-light); font-size: 12px; padding: 6px 12px;">
              Try a sample draft ↵
            </button>
          </div>
        ` : ''}
      </div>
    `;

    const sampleBtn = document.getElementById('emptyStateSampleBtn');
    if (sampleBtn) {
      sampleBtn.addEventListener('click', () => loadSampleDraft('memex'));
    }
    return;
  }

  // Update badge
  const matchText = `${topMatches.length} ${topMatches.length === 1 ? 'match' : 'matches'}`;
  matchCountBadge.textContent = matchText;
  matchCountBadge.classList.add('has-matches');

  // Render Top 3 Cards
  let cardsHtml = '<div class="cards-list">';

  topMatches.forEach((item, index) => {
    const clip = item.clip;
    const score = item.score;
    const matchedWords = item.matchedWords;
    const highlightedHtml = renderHighlightedSnippet(clip.highlighted_text, matchedWords);
    const domain = formatUrlDisplay(clip.url);
    const dateFormatted = formatDate(clip.date_saved);

    const keywordChips = matchedWords
      .slice(0, 6)
      .map(w => `<span class="keyword-tag">#${escapeHtml(w)}</span>`)
      .join('');

    cardsHtml += `
      <article class="collision-card" data-clip-id="${escapeHtml(clip.id)}">
        <div class="card-top-row">
          <span class="card-score-pill" title="${score} overlapping concepts with draft">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            ${score} ${score === 1 ? 'overlap' : 'overlaps'}
          </span>
          <span class="card-date">${dateFormatted}</span>
        </div>

        <blockquote class="card-snippet-text">${highlightedHtml}</blockquote>

        <div class="matched-keywords-row">
          ${keywordChips}
        </div>

        <div class="card-meta-bottom">
          <a href="${escapeHtml(clip.url)}" target="_blank" rel="noopener noreferrer" class="card-url-link" title="${escapeHtml(clip.url)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span>${escapeHtml(domain)}</span>
            <span style="font-size: 11px;">↗</span>
          </a>

          <div class="card-actions-quick">
            <button class="card-action-btn copy-quote-btn" data-quote="${escapeHtml(clip.highlighted_text)}" title="Copy highlight text">
              Copy
            </button>
            <button class="card-action-btn insert-quote-btn" data-quote="${escapeHtml(clip.highlighted_text)}" data-source="${escapeHtml(domain)}" title="Insert as citation into draft">
              Insert
            </button>
          </div>
        </div>
      </article>
    `;
  });

  cardsHtml += '</div>';
  boardBody.innerHTML = cardsHtml;

  // Attach card quick action handlers
  boardBody.querySelectorAll('.copy-quote-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const quote = e.currentTarget.getAttribute('data-quote');
      navigator.clipboard.writeText(quote).then(() => {
        showToast("Highlight copied to clipboard.");
      });
    });
  });

  boardBody.querySelectorAll('.insert-quote-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const quote = e.currentTarget.getAttribute('data-quote');
      const source = e.currentTarget.getAttribute('data-source');
      insertQuoteIntoDraft(quote, source);
    });
  });
}

/**
 * Insert a quote card directly into the draft at the end.
 */
function insertQuoteIntoDraft(quote, source) {
  const textarea = document.getElementById('draftTextarea');
  if (!textarea) return;

  const citation = `\n\n> "${quote}"\n> — ${source}\n\n`;
  textarea.value = (textarea.value.trim() ? textarea.value.trim() + "\n" : "") + citation;
  textarea.focus();
  runCollisionEngine();
  showToast("Citation inserted into draft.");
}

/**
 * Execute the Collision Engine logic on the current draft.
 */
function runCollisionEngine() {
  const draftTextarea = document.getElementById('draftTextarea');
  const statusDot = document.getElementById('engineStatusDot');
  const statusText = document.getElementById('engineStatusText');

  const draftText = draftTextarea ? draftTextarea.value.trim() : '';

  // Extract heavy words
  const draftHeavyWords = extractHeavyWords(draftText);
  const clips = getSavedClips();

  // Rank clips
  const topMatches = rankClips(draftHeavyWords, clips);

  // Render UI
  renderCollisionBoard(topMatches, draftHeavyWords.length, Boolean(draftText));

  // Update status indicators
  if (statusDot && statusText) {
    statusDot.classList.remove('pulsing');
    if (!draftText) {
      statusText.textContent = "Engine idle";
    } else if (topMatches.length > 0) {
      statusText.textContent = `Collision active (${topMatches.length} surfaced)`;
    } else {
      statusText.textContent = "Listening for overlaps";
    }
  }

  updateDraftStats(draftText);
}

/**
 * Update word & character statistics below the draft canvas.
 */
function updateDraftStats(text) {
  const wordCountElem = document.getElementById('statWordCount');
  const charCountElem = document.getElementById('statCharCount');
  const readTimeElem = document.getElementById('statReadTime');

  if (!wordCountElem || !charCountElem || !readTimeElem) return;

  if (!text) {
    wordCountElem.textContent = '0 words';
    charCountElem.textContent = '0 chars';
    readTimeElem.textContent = '0 min read';
    return;
  }

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  const minutes = Math.max(1, Math.ceil(words / 200));

  wordCountElem.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
  charCountElem.textContent = `${chars} chars`;
  readTimeElem.textContent = `${minutes} min read`;
}

/**
 * Update total clips count in top bar.
 */
function updateHeaderStats() {
  const clips = getSavedClips();
  const badge = document.getElementById('headerClipCount');
  if (badge) {
    badge.textContent = `${clips.length} saved`;
  }
}

// ============================================================================
// 6. SETTINGS & TEST DATA MODAL (Mocking the Bookmarklet)
// ============================================================================

/**
 * Open Settings Modal.
 */
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (!modal) return;
  modal.classList.add('active');
  renderManageClipsList();
  const urlInput = document.getElementById('inputClipUrl');
  if (urlInput) urlInput.focus();
}

/**
 * Close Settings Modal.
 */
function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.remove('active');
}

/**
 * Render the list of saved clips inside the modal.
 */
function renderManageClipsList() {
  const container = document.getElementById('clipsManageList');
  const countBadge = document.getElementById('modalClipsCount');
  if (!container) return;

  const clips = getSavedClips();
  if (countBadge) countBadge.textContent = `(${clips.length})`;

  if (clips.length === 0) {
    container.innerHTML = `
      <div style="padding: 18px; text-align: center; color: var(--text-muted); font-size: 12px;">
        No highlights stored in localStorage. Add one above or reset to sample highlights.
      </div>
    `;
    return;
  }

  let html = '';
  clips.forEach(clip => {
    html += `
      <div class="clip-manage-item">
        <div class="clip-manage-info">
          <div class="clip-manage-text" title="${escapeHtml(clip.highlighted_text)}">"${escapeHtml(clip.highlighted_text)}"</div>
          <div class="clip-manage-url">${escapeHtml(clip.url)}</div>
          <div class="clip-manage-date">${formatDate(clip.date_saved)}</div>
        </div>
        <button class="clip-delete-btn" data-id="${escapeHtml(clip.id)}" title="Delete clip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.clip-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      deleteClip(id);
      showToast("Clip removed.");
    });
  });
}

/**
 * Handle submission of the Test Data form.
 */
function handleAddClipForm(e) {
  e.preventDefault();
  const urlInput = document.getElementById('inputClipUrl');
  const textInput = document.getElementById('inputClipText');

  const url = urlInput ? urlInput.value.trim() : '';
  const text = textInput ? textInput.value.trim() : '';

  if (!url || !text) {
    showToast("Please provide both a URL and highlight text.", "error");
    return;
  }

  // Ensure URL has protocol
  let formattedUrl = url;
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = 'https://' + formattedUrl;
  }

  addClip(formattedUrl, text);

  // Clear inputs
  if (urlInput) urlInput.value = '';
  if (textInput) textInput.value = '';

  showToast("Highlight clip added to localStorage.");
  runCollisionEngine();
}

/**
 * Load a pre-written sample draft into the left textarea.
 */
function loadSampleDraft(key) {
  const sample = SAMPLE_DRAFTS[key];
  if (!sample) return;

  const textarea = document.getElementById('draftTextarea');
  if (textarea) {
    textarea.value = sample;
    textarea.focus();
    runCollisionEngine();
    showToast("Sample draft loaded.");
  }
}

/**
 * Toast notifications.
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${type === 'error' ? '#FEB2B2' : '#68D391'};"></span>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  }, 2600);
}

// ============================================================================
// 7. INITIALIZATION & EVENT LISTENERS
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize storage & stats
  getSavedClips();
  updateHeaderStats();

  const draftTextarea = document.getElementById('draftTextarea');
  const statusDot = document.getElementById('engineStatusDot');
  const statusText = document.getElementById('engineStatusText');

  // Trigger: 500ms debounce event listener on Left Panel <textarea> per spec
  if (draftTextarea) {
    draftTextarea.addEventListener('input', () => {
      // Visual feedback that debounce is waiting / processing
      if (statusDot) statusDot.classList.add('pulsing');
      if (statusText) statusText.textContent = "Colliding...";

      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        runCollisionEngine();
      }, DEBOUNCE_DELAY_MS);
    });

    // Immediate run on paste
    draftTextarea.addEventListener('paste', () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        runCollisionEngine();
      }, 50);
    });
  }

  // Clear draft button
  const clearDraftBtn = document.getElementById('clearDraftBtn');
  if (clearDraftBtn && draftTextarea) {
    clearDraftBtn.addEventListener('click', () => {
      if (draftTextarea.value.trim() && confirm("Clear current draft?")) {
        draftTextarea.value = '';
        runCollisionEngine();
        showToast("Draft cleared.");
      }
    });
  }

  // Sample prompt dropdown toggle
  const samplePromptsBtn = document.getElementById('samplePromptsBtn');
  const sampleDropdown = document.getElementById('sampleDropdown');
  if (samplePromptsBtn && sampleDropdown) {
    samplePromptsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sampleDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!sampleDropdown.contains(e.target)) {
        sampleDropdown.classList.remove('active');
      }
    });

    sampleDropdown.querySelectorAll('.dropdown-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const draftKey = e.currentTarget.getAttribute('data-draft');
        loadSampleDraft(draftKey);
        sampleDropdown.classList.remove('active');
      });
    });
  }

  // Settings Modal toggles
  const settingsBtn = document.getElementById('settingsBtn');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalOverlay = document.getElementById('settingsModal');

  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettingsModal);
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeSettingsModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeSettingsModal();
      }
    });
  }

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
      closeSettingsModal();
    }
  });

  // Test Data Form handler
  const addClipForm = document.getElementById('addClipForm');
  if (addClipForm) {
    addClipForm.addEventListener('submit', handleAddClipForm);
  }

  // Reset to samples button
  const resetSamplesBtn = document.getElementById('resetSamplesBtn');
  if (resetSamplesBtn) {
    resetSamplesBtn.addEventListener('click', () => {
      if (confirm("Reset clips back to curated sample highlights?")) {
        resetToSampleClips();
      }
    });
  }

  // Clear all clips button
  const clearAllClipsBtn = document.getElementById('clearAllClipsBtn');
  if (clearAllClipsBtn) {
    clearAllClipsBtn.addEventListener('click', () => {
      if (confirm("Delete all saved clips from localStorage?")) {
        clearAllClips();
      }
    });
  }

  // Copy bookmarklet code helper
  const copyBookmarkletBtn = document.getElementById('copyBookmarkletBtn');
  if (copyBookmarkletBtn) {
    copyBookmarkletBtn.addEventListener('click', () => {
      const code = `javascript:(function(){const s=window.getSelection().toString().trim();if(!s){alert('Please highlight some text first!');return;}const url=window.location.href;const clips=JSON.parse(localStorage.getItem('collider_clips')||'[]');clips.unshift({id:'clip_'+Date.now(),url:url,highlighted_text:s,date_saved:new Date().toISOString()});localStorage.setItem('collider_clips',JSON.stringify(clips));alert('Saved to Margin!');})();`;
      navigator.clipboard.writeText(code).then(() => {
        showToast("Bookmarklet code copied to clipboard!");
      });
    });
  }

  // Initial engine execution (shows empty state)
  runCollisionEngine();
});
