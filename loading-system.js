// loading-system.js - Complete Loading System for Entire Website

class LoadingSystem {
    constructor() {
        this.loadingElement = null;
        this.progressBar = null;
        this.progressText = null;
        this.mainContent = null;
        this.loadedComponents = new Set();
        this.totalComponents = 0;
        this.loadedCount = 0;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.createLoadingElement();
        this.setupEventListeners();
        this.startLoadingTracking();
        this.isInitialized = true;
        
        console.log('Loading System Initialized');
    }

    createLoadingElement() {
        // Create loading overlay HTML
        const loadingHTML = `
            <div id="global-loading-system" class="global-loading-system">
                <div class="loading-container">
                    <div class="spinner-container">
                        <div class="spinner"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <div class="loading-content">
                        <h3 class="loading-title">Loading Anys Beauty</h3>
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
            </div>
        `;

        // Add to body
        document.body.insertAdjacentHTML('afterbegin', loadingHTML);

        // Store references
        this.loadingElement = document.getElementById('global-loading-system');
        this.progressBar = this.loadingElement.querySelector('.progress-fill');
        this.progressText = this.loadingElement.querySelector('.progress-text');
        this.loadingStep = this.loadingElement.querySelector('.loading-step');
        this.loadingMessage = this.loadingElement.querySelector('.loading-message');

        // Add CSS styles
        this.injectStyles();
    }

    injectStyles() {
        const styles = `
            <style>
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

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                /* Ensure main content is hidden during loading */
                body.loading-active main,
                body.loading-active .main-content,
                body.loading-active #main-content {
                    opacity: 0;
                }

                body.loading-complete main,
                body.loading-complete .main-content,
                body.loading-complete #main-content {
                    opacity: 1;
                    transition: opacity 0.5s ease;
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    setupEventListeners() {
        // DOM Content Loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.updateProgress('DOM loaded', 20);
        });

        // Window Load
        window.addEventListener('load', () => {
            this.updateProgress('Window loaded', 40);
        });

        // Track beforeunload for page transitions
        window.addEventListener('beforeunload', () => {
            this.showLoading();
        });

        // Track AJAX requests
        this.interceptAjaxRequests();
        
        // Track fetch requests
        this.interceptFetchRequests();
    }

    startLoadingTracking() {
        // Add loading class to body
        document.body.classList.add('loading-active');

        // Define components to track
        const components = [
            { name: 'DOM', weight: 20 },
            { name: 'Stylesheets', weight: 15 },
            { name: 'Images', weight: 25 },
            { name: 'Scripts', weight: 20 },
            { name: 'Dynamic Content', weight: 10 },
            { name: 'Initialization', weight: 10 }
        ];

        this.totalComponents = components.reduce((sum, comp) => sum + comp.weight, 0);

        // Start tracking
        this.trackStylesheets();
        this.trackImages();
        this.trackScripts();
        this.trackDynamicContent();
    }

    trackStylesheets() {
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        let loadedSheets = 0;
        const totalSheets = stylesheets.length;

        if (totalSheets === 0) {
            this.updateProgress('Stylesheets loaded', 15);
            return;
        }

        stylesheets.forEach(sheet => {
            if (sheet.sheet) {
                loadedSheets++;
            } else {
                sheet.addEventListener('load', () => {
                    loadedSheets++;
                    if (loadedSheets === totalSheets) {
                        this.updateProgress('Stylesheets loaded', 15);
                    }
                });
            }
        });

        // Fallback
        setTimeout(() => {
            this.updateProgress('Stylesheets loaded', 15);
        }, 2000);
    }

    trackImages() {
        const images = document.querySelectorAll('img');
        let loadedImages = 0;
        const totalImages = images.length;

        if (totalImages === 0) {
            this.updateProgress('Images loaded', 25);
            return;
        }

        images.forEach(img => {
            if (img.complete) {
                loadedImages++;
            } else {
                img.addEventListener('load', () => {
                    loadedImages++;
                    this.updateImageProgress(loadedImages, totalImages);
                });
                img.addEventListener('error', () => {
                    loadedImages++;
                    this.updateImageProgress(loadedImages, totalImages);
                });
            }
        });

        // Check initially complete images
        let initiallyComplete = 0;
        images.forEach(img => {
            if (img.complete) initiallyComplete++;
        });
        this.updateImageProgress(initiallyComplete, totalImages);

        // Fallback
        setTimeout(() => {
            this.updateProgress('Images loaded', 25);
        }, 4000);
    }

    updateImageProgress(loaded, total) {
        if (loaded === total) {
            this.updateProgress('All images loaded', 25);
        }
    }

    trackScripts() {
        const scripts = document.querySelectorAll('script[src]');
        let loadedScripts = 0;
        const totalScripts = scripts.length;

        if (totalScripts === 0) {
            this.updateProgress('Scripts loaded', 20);
            return;
        }

        scripts.forEach(script => {
            if (script.readyState === 'loaded' || script.readyState === 'complete') {
                loadedScripts++;
            } else {
                script.addEventListener('load', () => {
                    loadedScripts++;
                    if (loadedScripts === totalScripts) {
                        this.updateProgress('Scripts loaded', 20);
                    }
                });
                script.addEventListener('error', () => {
                    loadedScripts++;
                    if (loadedScripts === totalScripts) {
                        this.updateProgress('Scripts loaded', 20);
                    }
                });
            }
        });

        // Fallback
        setTimeout(() => {
            this.updateProgress('Scripts loaded', 20);
        }, 3000);
    }

    trackDynamicContent() {
        // Track your dynamic content
        setTimeout(() => {
            this.updateProgress('Dynamic content ready', 10);
        }, 1000);
    }

    updateProgress(step, weight) {
        if (this.loadedComponents.has(step)) return;

        this.loadedComponents.add(step);
        this.loadedCount += weight;

        const progress = Math.min((this.loadedCount / this.totalComponents) * 100, 100);
        
        // Update UI
        if (this.progressBar) {
            this.progressBar.style.width = `${progress}%`;
        }
        if (this.progressText) {
            this.progressText.textContent = `${Math.round(progress)}%`;
        }
        if (this.loadingStep) {
            this.loadingStep.textContent = step;
        }

        // Update loading message based on progress
        this.updateLoadingMessage(progress);

        // Check if loading is complete
        if (progress >= 100) {
            this.completeLoading();
        }
    }

    updateLoadingMessage(progress) {
        const messages = [
            { range: [0, 25], message: "Initializing website..." },
            { range: [25, 50], message: "Loading resources..." },
            { range: [50, 75], message: "Almost there..." },
            { range: [75, 95], message: "Finalizing..." },
            { range: [95, 100], message: "Ready!" }
        ];

        const currentMessage = messages.find(msg => 
            progress >= msg.range[0] && progress <= msg.range[1]
        );

        if (currentMessage && this.loadingMessage) {
            this.loadingMessage.textContent = currentMessage.message;
        }
    }

    completeLoading() {
        setTimeout(() => {
            // Add completion animation
            this.loadingElement.classList.add('hidden');
            
            // Update body classes
            document.body.classList.remove('loading-active');
            document.body.classList.add('loading-complete');

            // Remove from DOM after animation
            setTimeout(() => {
                if (this.loadingElement && this.loadingElement.parentNode) {
                    this.loadingElement.remove();
                }
            }, 500);

            console.log('Website loading completed');
        }, 500);
    }

    showLoading() {
        // Show loading for page transitions
        if (this.loadingElement) {
            this.loadingElement.classList.remove('hidden');
            document.body.classList.add('loading-active');
            document.body.classList.remove('loading-complete');
        }
    }

    interceptAjaxRequests() {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        const loadingSystem = this;

        XMLHttpRequest.prototype.open = function() {
            this.addEventListener('loadstart', function() {
                loadingSystem.showLoading();
            });
            
            this.addEventListener('loadend', function() {
                setTimeout(() => {
                    // loadingSystem.completeLoading();
                }, 1000);
            });

            return originalOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function() {
            return originalSend.apply(this, arguments);
        };
    }

    interceptFetchRequests() {
        const originalFetch = window.fetch;
        const loadingSystem = this;

        window.fetch = function(...args) {
            loadingSystem.showLoading();
            
            return originalFetch.apply(this, args).finally(() => {
                setTimeout(() => {
                    // loadingSystem.completeLoading();
                }, 1000);
            });
        };
    }

    // Public method to manually update progress
    setProgress(step, percentage) {
        this.updateProgress(step, percentage);
    }

    // Public method to manually complete loading
    forceComplete() {
        this.completeLoading();
    }
}

// Auto-initialize when script is loaded
(function() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.globalLoadingSystem = new LoadingSystem();
        });
    } else {
        window.globalLoadingSystem = new LoadingSystem();
    }
})();


// loading-system.js - শেষে এই ফাংশন যোগ করুন
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
