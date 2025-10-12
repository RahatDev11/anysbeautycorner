// loading-system.js - Complete Loading System (All in One File)

class LoadingSystem {
    constructor() {
        this.loadingElement = null;
        this.progressBar = null;
        this.progressText = null;
        this.loadingStep = null;
        this.loadingMessage = null;
        this.loadedComponents = new Set();
        this.totalComponents = 100;
        this.loadedCount = 0;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.createLoadingElement();
        this.injectStyles();
        this.setupEventListeners();
        this.startLoadingTracking();
        this.isInitialized = true;
        
        console.log('Loading System Initialized');
    }

    createLoadingElement() {
        // If already exists, don't create again
        if (document.getElementById('global-loading-system')) return;
        
        this.loadingElement = document.createElement('div');
        this.loadingElement.id = 'global-loading-system';
        this.loadingElement.className = 'global-loading-system';
        
        this.loadingElement.innerHTML = `
            <div class="loading-container">
                <div class="spinner-container">
                    <div class="spinner"></div>
                    <div class="spinner-ring"></div>
                </div>
                <div class="loading-content">
                    <h3 class="loading-title">Loading Any's Beauty</h3>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <span class="progress-text">0%</span>
                    </div>
                    <p class="loading-message">Preparing your experience...</p>
                    <div class="loading-details">
                        <div class="loading-step">Initializing...</div>
                    </div>
                </div>
            </div>
        `;

        // Add to body as first element
        document.body.insertBefore(this.loadingElement, document.body.firstChild);

        // Store references
        this.progressBar = this.loadingElement.querySelector('.progress-fill');
        this.progressText = this.loadingElement.querySelector('.progress-text');
        this.loadingStep = this.loadingElement.querySelector('.loading-step');
        this.loadingMessage = this.loadingElement.querySelector('.loading-message');
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                font-family: 'Arial', sans-serif;
                color: white;
                transition: opacity 0.5s ease, transform 0.5s ease;
            }

            .global-loading-system * {
                box-sizing: border-box;
            }

            .loading-container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.2);
                max-width: 400px;
                width: 90%;
            }

            .spinner-container {
                position: relative;
                width: 80px;
                height: 80px;
                margin: 0 auto 30px;
            }

            .spinner {
                width: 60px;
                height: 60px;
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid #ffffff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            .spinner-ring {
                width: 80px;
                height: 80px;
                border: 2px solid rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            .loading-content h3 {
                margin: 0 0 20px 0;
                font-size: 24px;
                font-weight: 300;
            }

            .progress-container {
                display: flex;
                align-items: center;
                gap: 15px;
                margin: 20px 0;
            }

            .progress-bar {
                flex: 1;
                height: 6px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #00ff88, #00ccff);
                border-radius: 3px;
                width: 0%;
                transition: width 0.3s ease;
            }

            .progress-text {
                font-size: 14px;
                font-weight: 600;
                min-width: 40px;
            }

            .loading-message {
                margin: 10px 0;
                font-size: 14px;
                opacity: 0.8;
            }

            .loading-details {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
            }

            .loading-step {
                font-size: 12px;
                opacity: 0.7;
                margin: 5px 0;
            }

            .global-loading-system.hidden {
                opacity: 0;
                pointer-events: none;
                transform: scale(1.1);
            }

            @keyframes spin {
                0% { transform: translate(-50%, -50%) rotate(0deg); }
                100% { transform: translate(-50%, -50%) rotate(360deg); }
            }

            /* Hide website content until loading complete */
            #website-content {
                display: none;
            }

            body.loading-complete #website-content {
                display: block;
            }
        `;

        document.head.appendChild(styleElement);
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.updateProgress('DOM loaded', 15);
        });

        window.addEventListener('load', () => {
            this.updateProgress('Window loaded', 25);
        });
    }

    startLoadingTracking() {
        document.body.classList.add('loading-active');
        this.trackStylesheets();
        this.trackImages();
        this.trackScripts();
        this.trackDynamicContent();
        this.updateProgress('Loading system started', 5);
    }

    trackStylesheets() {
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        let loadedSheets = 0;
        const totalSheets = stylesheets.length;

        if (totalSheets === 0) {
            this.updateProgress('Stylesheets loaded', 10);
            return;
        }

        stylesheets.forEach(sheet => {
            if (sheet.sheet) {
                loadedSheets++;
            } else {
                sheet.addEventListener('load', () => {
                    loadedSheets++;
                    if (loadedSheets === totalSheets) {
                        this.updateProgress('Stylesheets loaded', 10);
                    }
                });
                sheet.addEventListener('error', () => {
                    loadedSheets++;
                    if (loadedSheets === totalSheets) {
                        this.updateProgress('Stylesheets loaded', 10);
                    }
                });
            }
        });

        setTimeout(() => {
            if (!this.loadedComponents.has('Stylesheets loaded')) {
                this.updateProgress('Stylesheets loaded', 10);
            }
        }, 2000);
    }

    trackImages() {
        const images = document.querySelectorAll('img');
        let loadedImages = 0;
        const totalImages = images.length;

        if (totalImages === 0) {
            this.updateProgress('Images loaded', 20);
            return;
        }

        const imageLoaded = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                this.updateProgress('All images loaded', 20);
            }
        };

        images.forEach(img => {
            if (img.complete) {
                loadedImages++;
            } else {
                img.addEventListener('load', imageLoaded);
                img.addEventListener('error', imageLoaded);
            }
        });

        if (loadedImages === totalImages) {
            this.updateProgress('All images loaded', 20);
        }

        setTimeout(() => {
            if (!this.loadedComponents.has('All images loaded')) {
                this.updateProgress('Images loaded', 20);
            }
        }, 3000);
    }

    trackScripts() {
        const scripts = document.querySelectorAll('script[src]');
        let loadedScripts = 0;
        const totalScripts = scripts.length;

        if (totalScripts === 0) {
            this.updateProgress('Scripts loaded', 15);
            return;
        }

        scripts.forEach(script => {
            if (script.readyState === 'loaded' || script.readyState === 'complete') {
                loadedScripts++;
            } else {
                script.addEventListener('load', () => {
                    loadedScripts++;
                    if (loadedScripts === totalScripts) {
                        this.updateProgress('Scripts loaded', 15);
                    }
                });
                script.addEventListener('error', () => {
                    loadedScripts++;
                    if (loadedScripts === totalScripts) {
                        this.updateProgress('Scripts loaded', 15);
                    }
                });
            }
        });

        setTimeout(() => {
            if (!this.loadedComponents.has('Scripts loaded')) {
                this.updateProgress('Scripts loaded', 15);
            }
        }, 2500);
    }

    trackDynamicContent() {
        setTimeout(() => {
            this.updateProgress('Dynamic content ready', 10);
        }, 1500);
    }

    updateProgress(step, weight) {
        if (this.loadedComponents.has(step)) return;

        this.loadedComponents.add(step);
        this.loadedCount += weight;

        const progress = Math.min(this.loadedCount, 100);
        
        if (this.progressBar) {
            this.progressBar.style.width = `${progress}%`;
        }
        if (this.progressText) {
            this.progressText.textContent = `${progress}%`;
        }
        if (this.loadingStep) {
            this.loadingStep.textContent = step;
        }

        this.updateLoadingMessage(progress);

        console.log(`Loading progress: ${progress}% - ${step}`);

        if (progress >= 100) {
            setTimeout(() => {
                this.completeLoading();
            }, 500);
        }
    }

    updateLoadingMessage(progress) {
        let message = "Preparing your experience...";
        
        if (progress < 25) {
            message = "Initializing website...";
        } else if (progress < 50) {
            message = "Loading resources...";
        } else if (progress < 75) {
            message = "Almost there...";
        } else if (progress < 95) {
            message = "Finalizing...";
        } else {
            message = "Ready!";
        }

        if (this.loadingMessage) {
            this.loadingMessage.textContent = message;
        }
    }

    completeLoading() {
        setTimeout(() => {
            // Add completion animation
            this.loadingElement.classList.add('hidden');
            
            // SHOW THE WEBSITE CONTENT
            const websiteContent = document.getElementById('website-content');
            if (websiteContent) {
                websiteContent.style.display = 'block';
            }
            
            // Update body classes
            document.body.classList.remove('loading-active');
            document.body.classList.add('loading-complete');

            // Remove from DOM after animation
            setTimeout(() => {
                if (this.loadingElement && this.loadingElement.parentNode) {
                    this.loadingElement.remove();
                }
                this.isInitialized = false;
            }, 500);

            console.log('Website loading completed - Content revealed');
        }, 500);
    }

    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.classList.remove('hidden');
            document.body.classList.add('loading-active');
            document.body.classList.remove('loading-complete');
        }
    }

    // Public method to manually update progress
    setProgress(step, percentage) {
        this.updateProgress(step, percentage);
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