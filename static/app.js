// Release Notes State
let state = {
    releases: [],
    filteredReleases: [],
    activeType: 'all',
    searchQuery: '',
    sortBy: 'newest',
    selectedItem: null
};

// Elements
const elements = {
    refreshBtn: document.getElementById('refresh-btn'),
    refreshSpinner: document.getElementById('refresh-spinner'),
    lastUpdatedTime: document.getElementById('last-updated-time'),
    
    // Stats
    statTotal: document.getElementById('stat-total'),
    statFeatures: document.getElementById('stat-features'),
    statIssues: document.getElementById('stat-issues'),
    statDeprecations: document.getElementById('stat-deprecations'),
    
    // Controls
    searchInput: document.getElementById('search-input'),
    filterContainer: document.getElementById('filter-categories-container'),
    sortSelect: document.getElementById('sort-select'),
    
    // List states
    releaseList: document.getElementById('release-list'),
    loadingState: document.getElementById('release-loading'),
    errorState: document.getElementById('release-error'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    emptyState: document.getElementById('release-empty'),
    
    // Modal
    tweetModal: document.getElementById('tweet-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    modalBadge: document.getElementById('modal-update-badge'),
    modalDate: document.getElementById('modal-update-date'),
    modalContent: document.getElementById('modal-update-content'),
    tweetTemplate: document.getElementById('tweet-template'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCount: document.getElementById('char-count'),
    charProgressCircle: document.getElementById('char-progress-circle'),
    sendTweetBtn: document.getElementById('send-tweet-btn')
};

// Initialize character progress ring constants
let ringCircumference = 0;
if (elements.charProgressCircle) {
    const radius = elements.charProgressCircle.r.baseVal.value;
    ringCircumference = radius * 2 * Math.PI;
    elements.charProgressCircle.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
    elements.charProgressCircle.style.strokeDashoffset = ringCircumference;
}

// Set character progress circle percent
function setCharProgress(percent, status) {
    if (!elements.charProgressCircle) return;
    
    const offset = ringCircumference - (percent / 100 * ringCircumference);
    elements.charProgressCircle.style.strokeDashoffset = Math.max(0, offset);
    
    // Color states
    if (status === 'danger') {
        elements.charProgressCircle.style.stroke = '#ef4444'; // Red
    } else if (status === 'warning') {
        elements.charProgressCircle.style.stroke = '#f59e0b'; // Amber
    } else {
        elements.charProgressCircle.style.stroke = '#00f2fe'; // Cyan / Teal
    }
}

// Fetch Release Notes
async function fetchReleaseNotes() {
    toggleLoading(true);
    elements.refreshSpinner.classList.add('spinning');
    elements.refreshBtn.disabled = true;
    
    try {
        const response = await fetch('/api/releases');
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        state.releases = data.releases || [];
        updateStats();
        renderFilters();
        applyFiltersAndRender();
        
        // Update synced timestamp
        const now = new Date();
        elements.lastUpdatedTime.textContent = `Last synced: ${now.toLocaleTimeString()}`;
        
        toggleError(false);
    } catch (error) {
        console.error('Error syncing feed:', error);
        elements.errorMessage.textContent = error.message || 'Failed to connect to Flask API.';
        toggleError(true);
    } finally {
        toggleLoading(false);
        elements.refreshSpinner.classList.remove('spinning');
        elements.refreshBtn.disabled = false;
    }
}

// Show/Hide Loading Skeleton
function toggleLoading(show) {
    if (show) {
        elements.loadingState.classList.remove('hidden');
        elements.releaseList.classList.add('hidden');
        elements.emptyState.classList.add('hidden');
    } else {
        elements.loadingState.classList.add('hidden');
        elements.releaseList.classList.remove('hidden');
    }
}

// Show/Hide Error State
function toggleError(show) {
    if (show) {
        elements.errorState.classList.remove('hidden');
        elements.loadingState.classList.add('hidden');
        elements.releaseList.classList.add('hidden');
        elements.emptyState.classList.add('hidden');
    } else {
        elements.errorState.classList.add('hidden');
    }
}

// Render statistical counters
function updateStats() {
    const total = state.releases.length;
    const features = state.releases.filter(r => r.type.toLowerCase() === 'feature').length;
    const issues = state.releases.filter(r => r.type.toLowerCase() === 'issue').length;
    const deprecations = state.releases.filter(r => r.type.toLowerCase() === 'deprecation').length;
    
    elements.statTotal.textContent = total;
    elements.statFeatures.textContent = features;
    elements.statIssues.textContent = issues;
    elements.statDeprecations.textContent = deprecations;
}

// Dynamically generate category filter pills based on parsed release types
function renderFilters() {
    const types = new Set(state.releases.map(r => r.type));
    
    // Clear dynamic pills (keep the first 'All Releases' pill)
    const allPill = elements.filterContainer.querySelector('[data-type="all"]');
    elements.filterContainer.innerHTML = '';
    elements.filterContainer.appendChild(allPill);
    
    types.forEach(type => {
        if (!type) return;
        const btn = document.createElement('button');
        btn.className = `filter-pill ${state.activeType === type ? 'active' : ''}`;
        btn.setAttribute('data-type', type);
        btn.textContent = type;
        
        elements.filterContainer.appendChild(btn);
    });
}

// Apply searches, filters and sort
function applyFiltersAndRender() {
    let results = [...state.releases];
    
    // 1. Filter by category pill
    if (state.activeType !== 'all') {
        results = results.filter(r => r.type === state.activeType);
    }
    
    // 2. Filter by search query
    if (state.searchQuery.trim()) {
        const query = state.searchQuery.toLowerCase();
        results = results.filter(r => 
            r.date.toLowerCase().includes(query) ||
            r.type.toLowerCase().includes(query) ||
            r.content_text.toLowerCase().includes(query)
        );
    }
    
    // 3. Sort logic
    if (state.sortBy === 'newest') {
        results.sort((a, b) => new Date(b.updated || b.date) - new Date(a.updated || a.date));
    } else if (state.sortBy === 'oldest') {
        results.sort((a, b) => new Date(a.updated || a.date) - new Date(b.updated || b.date));
    } else if (state.sortBy === 'category') {
        results.sort((a, b) => a.type.localeCompare(b.type) || new Date(b.updated || b.date) - new Date(a.updated || a.date));
    }
    
    state.filteredReleases = results;
    renderReleaseList();
}

// Render the release cards onto the DOM
function renderReleaseList() {
    elements.releaseList.innerHTML = '';
    
    if (state.filteredReleases.length === 0) {
        elements.emptyState.classList.remove('hidden');
        return;
    }
    
    elements.emptyState.classList.add('hidden');
    
    let currentGroupHeader = '';
    
    state.filteredReleases.forEach(item => {
        // Group heading if sorted by category
        if (state.sortBy === 'category' && item.type !== currentGroupHeader) {
            currentGroupHeader = item.type;
            const headerDiv = document.createElement('div');
            headerDiv.className = 'release-group-title';
            headerDiv.innerHTML = `<span>${currentGroupHeader}</span>`;
            elements.releaseList.appendChild(headerDiv);
        }
        
        const card = document.createElement('article');
        card.className = 'release-card';
        
        const typeClass = item.type.toLowerCase().replace(/\s+/g, '-');
        
        card.innerHTML = `
            <div class="card-header">
                <div class="header-left">
                    <span class="card-badge ${typeClass}">${item.type}</span>
                    <span class="card-date">${item.date}</span>
                </div>
                <div class="card-actions">
                    <button class="card-btn card-btn-tweet" title="Tweet this update" data-id="${item.id}">
                        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                    </button>
                    <a href="${item.link}" target="_blank" class="card-btn" title="View official release notes source">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                        </svg>
                    </a>
                </div>
            </div>
            <div class="card-content">
                ${item.content_html}
            </div>
        `;
        
        // Add event listener to the specific Tweet button
        const tweetBtn = card.querySelector('.card-btn-tweet');
        tweetBtn.addEventListener('click', () => openTweetModal(item));
        
        elements.releaseList.appendChild(card);
    });
}

// Tweet Composer Modal Management
function openTweetModal(item) {
    state.selectedItem = item;
    
    // Set Preview Content
    elements.modalBadge.className = `preview-badge ${item.type.toLowerCase().replace(/\s+/g, '-')}`;
    elements.modalBadge.textContent = item.type;
    elements.modalDate.textContent = item.date;
    elements.modalContent.innerHTML = item.content_html;
    
    // Reset Template Dropdown
    elements.tweetTemplate.value = 'announcement';
    
    // Render default tweet draft
    generateTweetDraft();
    
    // Show Modal
    elements.tweetModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Lock background scroll
    elements.tweetTextarea.focus();
}

function closeTweetModal() {
    elements.tweetModal.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scroll
    state.selectedItem = null;
}

// Preload templates for tweeting
function generateTweetDraft() {
    if (!state.selectedItem) return;
    
    const item = state.selectedItem;
    
    // Truncate description text slightly to fit within Twitter limits alongside templates
    let textSummary = item.content_text.replace(/\s+/g, ' ');
    if (textSummary.length > 150) {
        textSummary = textSummary.substring(0, 147) + '...';
    }
    
    let draftText = '';
    const templateType = elements.tweetTemplate.value;
    
    if (templateType === 'announcement') {
        draftText = `📢 BigQuery Update [${item.date}]:\n\n${textSummary}\n\nRead more details here:\n${item.link} #GoogleCloud #BigQuery`;
    } else if (templateType === 'spotlight') {
        draftText = `💡 New BigQuery ${item.type}!\n\n"${textSummary}"\n\nCheck out the official notes:\n${item.link} #GCP #DataAnalytics`;
    } else if (templateType === 'minimal') {
        draftText = `New Google Cloud #BigQuery release note (${item.date}): ${textSummary} ${item.link}`;
    } else {
        draftText = ''; // Let user type completely custom
    }
    
    elements.tweetTextarea.value = draftText;
    updateCharCount();
}

// Real-time character count and circle progress updates
function updateCharCount() {
    const textLength = elements.tweetTextarea.value.length;
    const remaining = 280 - textLength;
    elements.charCount.textContent = remaining;
    
    const percent = Math.min(100, (textLength / 280) * 100);
    
    let status = 'normal';
    elements.charCount.className = 'char-count';
    elements.sendTweetBtn.disabled = textLength === 0 || remaining < 0;
    
    if (remaining <= 20 && remaining >= 0) {
        status = 'warning';
        elements.charCount.classList.add('warning');
    } else if (remaining < 0) {
        status = 'danger';
        elements.charCount.classList.add('danger');
    }
    
    setCharProgress(percent, status);
}

// Redirect to Twitter Web Intent
function sendTweet() {
    const tweetText = elements.tweetTextarea.value.trim();
    if (!tweetText) return;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank');
    closeTweetModal();
}

// Event Listeners
function setupEventListeners() {
    // Refresh feed
    elements.refreshBtn.addEventListener('click', fetchReleaseNotes);
    if (elements.retryBtn) {
        elements.retryBtn.addEventListener('click', fetchReleaseNotes);
    }
    
    // Search
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        applyFiltersAndRender();
    });
    
    // Filters Event Delegation
    elements.filterContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;
        
        // Remove active class from previous
        elements.filterContainer.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
        
        // Add active to current
        pill.classList.add('active');
        state.activeType = pill.getAttribute('data-type');
        applyFiltersAndRender();
    });
    
    // Sort Select
    elements.sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        applyFiltersAndRender();
    });
    
    // Modal Close
    elements.closeModalBtn.addEventListener('click', closeTweetModal);
    elements.tweetModal.addEventListener('click', (e) => {
        if (e.target === elements.tweetModal) {
            closeTweetModal();
        }
    });
    
    // Template Change
    elements.tweetTemplate.addEventListener('change', generateTweetDraft);
    
    // Textarea Input
    elements.tweetTextarea.addEventListener('input', updateCharCount);
    
    // Share Tweet
    elements.sendTweetBtn.addEventListener('click', sendTweet);
    
    // Escape key modal dismiss
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !elements.tweetModal.classList.contains('hidden')) {
            closeTweetModal();
        }
    });
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchReleaseNotes();
});
