// loading-system.js - Complete Loading System (All in One File)

class LoadingSystem {
    constructor() {
        console.log('LoadingSystem constructor called (first line)');
        this.loadingElement = null;
        this.loadedComponents = new Set();
        this.totalComponents = 100;
        this.loadedCount = 0;
        this.isInitialized = false;
        
        try {
            this.init();
        } catch (e) {
            console.error('Error during LoadingSystem initialization:', e);
            // Attempt to force complete if init fails early
            this.forceComplete();
        }
    }

    init() {
        if (this.isInitialized) return;
        
        this.createLoadingElement();
        this.injectStyles();
        this.startLoadingTracking();
        this.isInitialized = true;
        
        console.log('Loading System: Initialized and ready.');
    }

    createLoadingElement() {
        // If already exists, don't create again
        if (document.getElementById('global-loading-system')) return;
        
        this.loadingElement = document.createElement('div');
        this.loadingElement.id = 'global-loading-system';
        this.loadingElement.className = 'global-loading-system';
        
        this.loadingElement.innerHTML = `
            <div class="loading-container">
                <div class="relative flex items-center justify-center mb-4">
                    <img src="img.jpg" alt="Any's Beauty Corner Logo" class="h-24 w-24 rounded-full border-4 border-transparent animate-pulse">
                </div>
                <p class="loading-text pulsing-text loading-title">
                    <span>A</span><span>n</span><span>y</span><span>'</span><span>s</span><span> </span><span>B</span><span>e</span><span>a</span><span>u</span><span>t</span><span>y</span><span> </span><span>C</span><span>o</span><span>r</span><span>n</span><span>e</span><span>r</span>
                </p>
            </div>
        `;

        // Add to body as first element
        document.body.insertBefore(this.loadingElement, document.body.firstChild);

        // Store references
        // No progress bar or text elements anymore
    }

    injectStyles() {
        if (document.querySelector('#loading-system-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'loading-system-styles';
                styleElement.textContent = `
                    .global-loading-system {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: white; /* Changed to white */
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 9999;
                        font-family: 'Arial', sans-serif;
                        color: black; /* Changed text color to black for contrast */
                        transition: opacity 0.5s ease, transform 0.5s ease;
                    }
        
                    .global-loading-system * {
                        box-sizing: border-box;
                    }
        
                    .loading-container {
                        text-align: center;
                        padding: 40px;
                        border-radius: 20px;
                        max-width: 400px;
                        width: 90%;
                    }
        
                    .loading-title { /* Changed from h3 to p */
                        margin: 0 0 20px 0;
                        font-size: 24px;
                        font-weight: 300;
                    }
        
                    @keyframes letter-wave {
                        0%, 100% { transform: translateY(0); opacity: 1; }
                        25% { transform: translateY(-10px); opacity: 1; }
                        75% { transform: translateY(10px); opacity: 1; }
                    }
        
                    .loading-text span {
                        display: inline-block;
                        opacity: 0;
                        animation: letter-wave 2s infinite ease-in-out forwards;
                    }
        
                    .loading-text span:nth-child(1) { animation-delay: 0.0s; }
                    .loading-text span:nth-child(2) { animation-delay: 0.1s; }
                    .loading-text span:nth-child(3) { animation-delay: 0.2s; }
                    .loading-text span:nth-child(4) { animation-delay: 0.3s; }
                    .loading-text span:nth-child(5) { animation-delay: 0.4s; }
                    .loading-text span:nth-child(6) { animation-delay: 0.5s; }
                    .loading-text span:nth-child(7) { animation-delay: 0.6s; }
                    .loading-text span:nth-child(8) { animation-delay: 0.7s; }
                    .loading-text span:nth-child(9) { animation-delay: 0.8s; }
                    .loading-text span:nth-child(10) { animation-delay: 0.9s; }
                    .loading-text span:nth-child(11) { animation-delay: 1.0s; }
                    .loading-text span:nth-child(12) { animation-delay: 1.1s; }
                    .loading-text span:nth-child(13) { animation-delay: 1.2s; }
                    .loading-text span:nth-child(14) { animation-delay: 1.3s; }
                    .loading-text span:nth-child(15) { animation-delay: 1.4s; }
                    .loading-text span:nth-child(16) { animation-delay: 1.5s; }
                    .loading-text span:nth-child(17) { animation-delay: 1.6s; }
        .loading-text span:nth-child(18) { animation-delay: 1.7s; }
        .loading-text span:nth-child(19) { animation-delay: 1.8s; }
        .loading-text span:nth-child(20) { animation-delay: 1.9s; }
        
                    /* Hide website content until loading complete */
                    #website-content {
                        display: none;
                    }
                `;

        document.head.appendChild(styleElement);
    }

    startLoadingTracking() {
        document.body.classList.add('loading-active');
        this.updateProgress('Loading system started', 100); // Force complete immediately
    }

    updateProgress(step, weight) {
        if (this.loadedComponents.has(step)) return;

        this.loadedComponents.add(step);
        this.loadedCount += weight;

        const progress = Math.min(this.loadedCount, 100);
        
        console.log(`Loading progress: ${progress}% - ${step}`);

        if (progress >= 100) {
            setTimeout(() => {
                this.completeLoading();
            }, 500);
        }
    }

    completeLoading() {
        setTimeout(() => {
            // Hide the loading element directly
            if (this.loadingElement) {
                this.loadingElement.style.display = 'none';
            }
            
            // SHOW THE WEBSITE CONTENT directly
            const websiteContent = document.getElementById('website-content');
            if (websiteContent) {
                websiteContent.style.display = 'block';
            }
            
            // Remove body classes (loading-active is added in startLoadingTracking)
            document.body.classList.remove('loading-active');

            // Remove from DOM after animation (if any, though display:none is immediate)
            setTimeout(() => {
                if (this.loadingElement && this.loadingElement.parentNode) {
                    this.loadingElement.remove();
                }
                this.isInitialized = false;
            }, 500); // Keep a small delay before removing from DOM

            console.log('Loading System: completeLoading() called - Content revealed');
        }, 500);
    }

    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.classList.remove('hidden');
            document.body.classList.add('loading-active');
            document.body.classList.remove('loading-complete');
        }
    }

    // Public method to manually complete loading
    forceComplete() {
        this.loadedCount = 100;
        this.completeLoading();
    }
}

// Auto-initialize when script is loaded
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.globalLoadingSystem = new LoadingSystem();
        });
    } else {
        window.globalLoadingSystem = new LoadingSystem();
    }
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingSystem;
}






// Emergency timeout to force complete loading after 8 seconds
setTimeout(() => {
    if (window.globalLoadingSystem && !document.body.classList.contains('loading-complete')) {
        console.log('Emergency loading complete triggered');
        window.globalLoadingSystem.forceComplete();
    }
}, 8000);