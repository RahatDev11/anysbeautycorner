// =================================================================
// SECTION: LOADING SYSTEM INITIALIZATION (MUST BE FIRST)
// =================================================================

// Initialize loading system immediately when script loads
function initializeLoadingSystem() {
    if (window.globalLoadingSystem) {
        console.log('Loading system already initialized');
        return true;
    }
    
    // If loading system script hasn't loaded yet, wait for it
    if (typeof LoadingSystem === 'undefined') {
        console.log('Waiting for loading system...');
        setTimeout(initializeLoadingSystem, 100);
        return false;
    }
    
    window.globalLoadingSystem = new LoadingSystem();
    console.log('Loading system initialized in main.js');
    return true;
}

// Start loading system immediately
initializeLoadingSystem();

// =================================================================
// SECTION: MAIN APPLICATION ENTRY POINT
// =================================================================

// Import Firebase Config (for initialization and global access to auth/db instances)
import { auth, onAuthStateChanged, database, ref, onValue } from '../js/modules/firebase-config.js';

// Import UI Utilities
import { showToast, hideGlobalLoadingSpinner, openSidebar, closeSidebar, toggleSubMenuMobile, handleSubMenuItemClick, toggleSubMenuDesktop, openCartSidebar, closeCartSidebar, focusMobileSearch, setupSocialMediaButtons } from '../js/modules/ui-utilities.js';

// Import Notification Managers
import { sendTelegramNotification, sendNotificationForOrder } from '../js/modules/notification-manager.js';

// Import Auth Manager
import { loginWithGmail, confirmLogout, logout, isAdmin, updateLoginButton } from '../js/modules/auth-manager.js';

// Import Cart Manager
import { loadCart, addToCart, updateQuantity, removeFromCart, checkout, buyNow, setProducts as setCartManagerProducts } from '../js/modules/cart-manager.js';

// Import Product Manager
import { loadProducts, showProductDetail, showLoadingSpinner, displayProductsAsCards, initializeProductSlider, displaySearchResults, searchProductsMobile, searchProductsDesktop, filterProducts, setProducts as setProductManagerProducts } from '../js/modules/product-manager.js';

// Import Page Managers
import { initHomePage } from '../js/pages/home-manager.js';
import { initializeProductDetailPage, changeDetailQuantity, addToCartWithQuantity, buyNowWithQuantity } from '../js/pages/product-details-manager.js';
import { initializeOrderTrackPage } from '../js/pages/order-track-manager.js';

import { initializeOrderFormPage, placeOrder } from '../js/pages/order-form-manager.js';

// Global Variables (declared once and assigned)
let products = [];
let eventSlider;

// Update loading progress function
function updateLoadingProgress(step, percentage) {
    if (window.globalLoadingSystem) {
        window.globalLoadingSystem.setProgress(step, percentage);
    }
}

async function loadHeaderAndSetup() {
    return new Promise(async (resolve, reject) => {
        try {
            updateLoadingProgress('Loading header', 10);
            
            const response = await fetch('header.html');
            if (!response.ok) {
                reject('Failed to load header.html');
                return;
            }
            const headerHTML = await response.text();
            const headerEl = document.getElementById('header');
            if (headerEl) {
                headerEl.innerHTML = headerHTML;
            }

            updateLoadingProgress('Setting up authentication', 15);

            // Wait for initial auth state to be determined and login button updated
            onAuthStateChanged(auth, user => {
                updateLoginButton(user);
            });
            
            updateLoadingProgress('Loading cart', 20);
            await loadCart(); // Await the loadCart promise

            updateLoadingProgress('Setting up UI events', 25);

            document.getElementById('mobileMenuButton')?.addEventListener('click', openSidebar);
            document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);
            document.getElementById('closeSidebarButton')?.addEventListener('click', closeSidebar);
            
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.addEventListener('click', (event) => {
                    event.stopPropagation();
                });
            }
            
            document.getElementById('cartButton')?.addEventListener('click', openCartSidebar);
            document.getElementById('cartOverlay')?.addEventListener('click', closeCartSidebar);
            
            const checkoutBtn = document.querySelector('#cartSidebar button[onclick="checkout()"]');
            if(checkoutBtn) {
                checkoutBtn.addEventListener('click', checkout);
            }

            setupSocialMediaButtons();
            
            updateLoadingProgress('Header setup complete', 30);
            resolve();

        } catch (error) {
            console.error('Error in loadHeaderAndSetup:', error);
            reject(error);
        }
    });
}

async function loadFooter() {
    try {
        updateLoadingProgress('Loading footer', 35);
        
        const response = await fetch('footer.html');
        if (!response.ok) {
            return;
        }
        const footerHTML = await response.text();
        const footerEl = document.getElementById('footer');
        if (footerEl) {
            footerEl.innerHTML = footerHTML;
        }
        
        updateLoadingProgress('Footer loaded', 40);
    } catch (error) {
        console.error('Error loading footer:', error);
    }
}

// =================================================================
// SECTION: GLOBAL FUNCTION ASSIGNMENT (গুরুত্বপূর্ণ)
// =================================================================

Object.assign(window, {
    // Global Utilities
    showToast,
    sendTelegramNotification, 
    sendNotificationForOrder, 
    // Header UI
    openSidebar, closeSidebar, toggleSubMenuMobile, handleSubMenuItemClick,
    toggleSubMenuDesktop, openCartSidebar, closeCartSidebar, focusMobileSearch,
    // Auth
    loginWithGmail, confirmLogout, logout,
    // Cart & Checkout
    filterProducts, searchProductsMobile, searchProductsDesktop, checkout,
    buyNow, addToCart, updateQuantity, removeFromCart,
    // Product Detail
    showProductDetail, changeDetailQuantity, addToCartWithQuantity, buyNowWithQuantity,
    initializeProductDetailPage, 
    // Order Track
    initializeOrderTrackPage,
    // Order List 
    // Order Form
    initializeOrderFormPage, placeOrder
});

function main() {
    console.log('Main application starting...');
    updateLoadingProgress('Starting main application', 5);
    
    let pageLoadPromises = [];
    
    // Load header and footer and set up their functionality
    pageLoadPromises.push(loadHeaderAndSetup());
    pageLoadPromises.push(loadFooter());

    updateLoadingProgress('Loading products data', 45);

    // Load all products once
    const productsLoadPromise = new Promise(resolve => {
        const productsRef = ref(database, "products/");
        onValue(productsRef, snapshot => {
            if (snapshot.exists()) {
                products = Object.keys(snapshot.val()).map(key => ({ id: key, ...snapshot.val()[key] }));
                setCartManagerProducts(products); // Update products in cart-manager
                setProductManagerProducts(products);
                updateLoadingProgress('Products data loaded', 60);
            } else {
                updateLoadingProgress('No products found', 60);
            }
            resolve(); // Resolve after products are loaded
        }, error => {
            console.error('Error loading products:', error);
            updateLoadingProgress('Error loading products', 60);
            resolve(); // Still resolve to continue
        });
    });
    pageLoadPromises.push(productsLoadPromise);

    Promise.all(pageLoadPromises).then(async () => {
        updateLoadingProgress('Initial data loaded', 70);

        // After all initial data (header, footer, products) are loaded, then initialize page-specific logic
        const currentPage = window.location.pathname;
        
        updateLoadingProgress('Initializing page-specific content', 80);

        if (currentPage.endsWith('/') || currentPage.endsWith('index.html')) {
            initHomePage(products); // Pass products to home-manager
            updateLoadingProgress('Home page initialized', 85);
        }
        if (currentPage.includes('product-detail.html')) {
            initializeProductDetailPage();
            updateLoadingProgress('Product detail page initialized', 85);
        }
        if (currentPage.includes('order-track.html')) {
            initializeOrderTrackPage();
            updateLoadingProgress('Order track page initialized', 85);
        }
        if (currentPage.includes('order-form.html')) {
            initializeOrderFormPage();
            updateLoadingProgress('Order form page initialized', 85);
        }

        updateLoadingProgress('Setting up search functionality', 90);

        // Add event listener for mobile search
        document.getElementById('searchInput')?.addEventListener('input', searchProductsMobile);

        // Check for admin status
        const user = auth.currentUser;
        if (user) {
            updateLoadingProgress('Checking admin privileges', 95);
            const userIsAdmin = await isAdmin(user.uid);
            if (userIsAdmin) {
                document.getElementById('product-management')?.classList.remove('hidden');
                document.getElementById('slider-management')?.classList.remove('hidden');
                document.getElementById('event-update')?.classList.remove('hidden');
            }
        }

        updateLoadingProgress('Application fully loaded', 100);

        // Hide both loading systems
        hideGlobalLoadingSpinner();
        
        // Force complete the loading system after a short delay
        setTimeout(() => {
            if (window.globalLoadingSystem) {
                window.globalLoadingSystem.forceComplete();
            }
        }, 1000);

    }).catch(error => {
        console.error('Error in main application:', error);
        
        // Force complete loading even if there's an error
        if (window.globalLoadingSystem) {
            window.globalLoadingSystem.forceComplete();
        }
        hideGlobalLoadingSpinner(); // Hide even if there's an error
    });

}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(main, 100);
    });
} else {
    setTimeout(main, 100);
}

// গ্লোবাল ক্লিক হ্যান্ডলার
document.addEventListener("click", (event) => {
    if (event.target.id === 'sidebarOverlay') closeSidebar();
    if (!event.target.closest('#cartSidebar') && !event.target.closest('#cartButton')) closeCartSidebar();
    if (!event.target.closest('#desktopSubMenuBar') && !event.target.closest('button[onclick="toggleSubMenuDesktop()"]')) document.getElementById('desktopSubMenuBar')?.classList.add('hidden');
    
    const mobileSearchBar = document.getElementById('mobileSearchBar');
    const mobileSearchIcon = document.getElementById('mobileSearchIcon');
    if (mobileSearchBar && !mobileSearchBar.classList.contains('hidden')) {
        if (!mobileSearchBar.contains(event.target) && !mobileSearchIcon.contains(event.target)) {
            mobileSearchBar.classList.add('hidden');
        }
    }

    const searchResultsDesktop = document.getElementById('searchResultsDesktop');
    if (searchResultsDesktop && !searchResultsDesktop.contains(event.target) && !event.target.closest('#searchInputDesktop')) { 
        searchResultsDesktop.classList.add('hidden'); 
    }
});

// Scroll handler to close mobile search
window.addEventListener('scroll', () => {
    const mobileSearchBar = document.getElementById('mobileSearchBar');
    if (mobileSearchBar && !mobileSearchBar.classList.contains('hidden')) {
        mobileSearchBar.classList.add('hidden');
    }
});

// Error handling for the loading system
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Ensure loading screen hides even if there are errors
    setTimeout(() => {
        if (window.globalLoadingSystem) {
            window.globalLoadingSystem.forceComplete();
        }
        hideGlobalLoadingSpinner();
    }, 2000);
});