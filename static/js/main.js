// JavaScript code for BigQuery Release Notes Explorer

document.addEventListener('DOMContentLoaded', () => {
    // State management
    let releaseUpdates = [];
    let selectedUpdate = null;
    let currentFilter = 'all';

    // DOM Elements
    const releasesContainer = document.getElementById('releases-container');
    const detailPlaceholder = document.getElementById('detail-placeholder');
    const detailContent = document.getElementById('detail-content');
    
    // Detail View Elements
    const detailBadge = document.getElementById('detail-category-badge');
    const detailDate = document.getElementById('detail-date-text');
    const detailTitle = document.getElementById('detail-title-text');
    const detailBody = document.getElementById('detail-body-html');
    const detailSourceLink = document.getElementById('detail-source-link');
    
    // Tweet Composer Elements
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCount = document.getElementById('char-count');
    const charCounter = document.getElementById('char-counter');
    const btnTweet = document.getElementById('btn-tweet');
    const btnResetTweet = document.getElementById('btn-reset-tweet');
    
    // Header Actions Elements
    const btnRefresh = document.getElementById('btn-refresh');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    
    // Filters
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Fetch releases on load
    fetchReleases();

    // Event Listeners
    btnRefresh.addEventListener('click', () => {
        fetchReleases(true);
    });

    tweetTextarea.addEventListener('input', updateCharCount);

    btnTweet.addEventListener('click', () => {
        if (!selectedUpdate) return;
        const tweetText = tweetTextarea.value;
        const encodedText = encodeURIComponent(tweetText);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        window.open(twitterUrl, '_blank');
    });

    btnResetTweet.addEventListener('click', () => {
        if (selectedUpdate) {
            populateTweetComposer(selectedUpdate);
        }
    });

    // Setup filter button events
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            e.currentTarget.classList.add('active');
            
            currentFilter = e.currentTarget.dataset.category;
            renderReleases();
        });
    });

    // Main fetch function
    async function fetchReleases(forceRefresh = false) {
        setLoadingState(true);
        try {
            const url = forceRefresh ? '/api/releases?force_refresh=true' : '/api/releases';
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === 'success' || data.status === 'warning') {
                releaseUpdates = data.updates;
                updateStatusIndicator(data);
                renderReleases();
                
                // Keep the selection if it exists and is still in the list, otherwise reset detail view
                if (selectedUpdate) {
                    const stillExists = releaseUpdates.find(u => u.id === selectedUpdate.id);
                    if (stillExists) {
                        selectRelease(stillExists);
                    } else {
                        resetDetailView();
                    }
                }
            } else {
                showErrorState(data.message || 'Failed to fetch release notes.');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showErrorState('Network error occurred. Please check your connection and try again.');
        } finally {
            setLoadingState(false);
        }
    }

    // Set UI loading state
    function setLoadingState(isLoading) {
        if (isLoading) {
            btnRefresh.classList.add('loading');
            btnRefresh.disabled = true;
            if (releaseUpdates.length === 0) {
                releasesContainer.innerHTML = `
                    <div class="skeleton-card"></div>
                    <div class="skeleton-card"></div>
                    <div class="skeleton-card"></div>
                `;
            }
        } else {
            btnRefresh.classList.remove('loading');
            btnRefresh.disabled = false;
        }
    }

    // Update status bar in header
    function updateStatusIndicator(data) {
        statusIndicator.className = 'status-indicator';
        
        const lastFetchedDate = new Date(data.last_fetched * 1000);
        const timeString = lastFetchedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (data.status === 'warning') {
            statusIndicator.classList.add('offline');
            statusText.textContent = `Using cached data (Failed to refresh at ${timeString})`;
        } else {
            statusIndicator.classList.add('online');
            statusText.textContent = `Last updated: ${timeString} (${data.source === 'network' ? 'Fresh' : 'Cached'})`;
        }
    }

    // Show error state in card container
    function showErrorState(message) {
        statusIndicator.className = 'status-indicator error';
        statusText.textContent = 'Connection Error';
        
        releasesContainer.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-deprecated); margin-bottom: 1rem; opacity: 0.8;">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 1rem; background: var(--primary-grad); border: none; color: white; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: 'Outfit'; font-weight: 600;">Retry Connection</button>
            </div>
        `;
    }

    // Render release cards in the left column
    function renderReleases() {
        if (!releaseUpdates || releaseUpdates.length === 0) {
            releasesContainer.innerHTML = `
                <div class="empty-state">
                    <p>No release notes found.</p>
                </div>
            `;
            return;
        }

        const filtered = releaseUpdates.filter(update => {
            if (currentFilter === 'all') return true;
            return update.category.toLowerCase() === currentFilter.toLowerCase();
        });

        if (filtered.length === 0) {
            releasesContainer.innerHTML = `
                <div class="empty-state">
                    <p>No updates found for category "${currentFilter}".</p>
                </div>
            `;
            return;
        }

        releasesContainer.innerHTML = '';
        
        filtered.forEach(update => {
            const card = document.createElement('div');
            const categoryClass = `category-${update.category.toLowerCase()}`;
            card.className = `release-card ${categoryClass}`;
            if (selectedUpdate && selectedUpdate.id === update.id) {
                card.classList.add('active');
            }
            
            // Clean text preview
            let textPreview = update.text;
            if (textPreview.length > 120) {
                textPreview = textPreview.substring(0, 120) + '...';
            }

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-meta">
                        <span class="badge badge-${update.category.toLowerCase()}">${update.category}</span>
                        <span class="card-date">${update.date}</span>
                    </div>
                    <div class="card-indicator">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                </div>
                <div class="card-body">
                    ${textPreview}
                </div>
            `;

            card.addEventListener('click', () => {
                // Remove active classes
                document.querySelectorAll('.release-card').forEach(c => c.classList.remove('active'));
                // Add active class to this card
                card.classList.add('active');
                
                selectRelease(update);
            });

            releasesContainer.appendChild(card);
        });
    }

    // Select release and update detail pane
    function selectRelease(update) {
        selectedUpdate = update;
        
        // Hide placeholder and show content
        detailPlaceholder.style.display = 'none';
        detailContent.classList.remove('hidden');
        
        // Update detail values
        detailBadge.className = `detail-badge ${update.category.toLowerCase()}`;
        detailBadge.textContent = update.category;
        detailDate.textContent = update.date;
        detailTitle.textContent = `BigQuery Update: ${update.category}`;
        detailBody.innerHTML = update.content_html;
        
        // Setup official link
        detailSourceLink.href = update.url;
        
        // Populate Tweet Composer
        populateTweetComposer(update);
    }

    // Reset detail pane to placeholder state
    function resetDetailView() {
        selectedUpdate = null;
        detailPlaceholder.style.display = 'flex';
        detailContent.classList.add('hidden');
    }

    // Pre-populate Tweet Composer
    function populateTweetComposer(update) {
        // Construct standard draft tweet
        // Category emoji mapping
        const emojiMap = {
            'feature': '📢 [Feature]',
            'changed': '🔄 [Changed]',
            'deprecated': '⚠️ [Deprecated]',
            'general': '💡 [Update]'
        };
        
        const catKey = update.category.toLowerCase();
        const prefix = emojiMap[catKey] || '💡 [Update]';
        const dateStr = update.date;
        const mainText = update.text;
        const urlStr = update.url;
        
        // Let's build the draft tweet
        // Structure: "prefix (date): mainText Details: URL"
        // Let's compute limits
        const staticTemplateLength = `${prefix} (${dateStr}): \n\nDetails: ${urlStr}`.length;
        const maxSnippetLength = 280 - staticTemplateLength - 5; // leave buffer
        
        let snippet = mainText;
        if (snippet.length > maxSnippetLength) {
            snippet = snippet.substring(0, maxSnippetLength).trim() + '...';
        }
        
        const defaultTweet = `${prefix} (${dateStr}):\n"${snippet}"\n\nDetails: ${urlStr}`;
        
        tweetTextarea.value = defaultTweet;
        updateCharCount();
    }

    // Update Tweet character counter and state
    function updateCharCount() {
        const textLength = tweetTextarea.value.length;
        charCount.textContent = textLength;
        
        // Reset classes
        charCounter.className = 'char-counter';
        
        if (textLength > 280) {
            charCounter.classList.add('danger');
            btnTweet.disabled = true;
        } else if (textLength > 250) {
            charCounter.classList.add('warning');
            btnTweet.disabled = false;
        } else {
            btnTweet.disabled = false;
        }
    }
});
