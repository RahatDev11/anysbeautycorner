// =================================================================
// SECTION: MAIN APPLICATION ENTRY POINT
// =================================================================

// Import Firebase Config
import { auth, onAuthStateChanged, database, ref, onValue } from './modules/firebase-config.js';

// Import UI Utilities
import { showToast, openSidebar, closeSidebar, toggleSubMenuMobile, handleSubMenuItemClick, toggleSubMenuDesktop, openCartSidebar, closeCartSidebar, focusMobileSearch, setupSocialMediaButtons, populateProductCategories } from './modules/ui-utilities.js';

// Import Notification Managers
import { sendTelegramNotification, sendNotificationForOrder } from './modules/notification-manager.js';

// Import Auth Manager
import { loginWithGmail, confirmLogout, logout, isAdmin, updateLoginButton, toggleLogoutMenu } from './modules/auth-manager.js';

// Import Cart Manager
import { loadCart, addToCart, updateQuantity, removeFromCart, checkout, buyNow, setProducts as setCartManagerProducts } from './modules/cart-manager.js';

// Import Product Manager
import { loadProducts, showProductDetail, showLoadingSpinner, displayProductsAsCards, initializeProductSlider, displaySearchResults, searchProductsMobile, searchProductsDesktop, filterProducts, setProducts as setProductManagerProducts } from './modules/product-manager.js';

// Import Page Managers - PATH FIXED
import { initHomePage } from './pages/home-manager.js';
import { initializeProductDetailPage, changeDetailQuantity, addToCartWithQuantity, buyNowWithQuantity } from './pages/product-details-manager.js';
import { initializeOrderTrackPage } from './pages/order-track-manager.js';
import { initializeOrderFormPage, placeOrder } from './pages/order-form-manager.js';
import { initializeNotificationsPage, updateNotificationCountInHeader } from './pages/notifications-manager.js';
import { toggleFooterMenu } from './pages/footer-manager.js';

// Global Variables
let products = [];
let eventSlider;
let isMainInitialized = false;

async function loadHeaderAndSetup() {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('Attempting to fetch header.html');
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

            // Wait for initial auth state
            onAuthStateChanged(auth, user => {
                updateLoginButton(user);
                updateNotificationCountInHeader();
            });

            await loadCart();

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
            console.log('main.js: loadHeaderAndSetup() completed');
            resolve();

        } catch (error) {
            reject(error);
        }
    });
}

async function loadFooter() {
    try {
        console.log('Attempting to fetch footer.html');
        const response = await fetch('footer.html');
        if (!response.ok) {
            return;
        }
        const footerHTML = await response.text();
        const footerEl = document.getElementById('footer');
        if (footerEl) {
            footerEl.innerHTML = footerHTML;
        }
        console.log('main.js: loadFooter() completed');
    } catch (error) {
        console.error('Error loading footer:', error);
    }
}

// =================================================================
// SECTION: GLOBAL FUNCTION ASSIGNMENT
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
    loginWithGmail, confirmLogout, logout, toggleLogoutMenu,
    // Cart & Checkout
    filterProducts, searchProductsMobile, searchProductsDesktop, checkout,
    buyNow, addToCart, updateQuantity, removeFromCart,
    // Product Detail
    showProductDetail, changeDetailQuantity, addToCartWithQuantity, buyNowWithQuantity,
    initializeProductDetailPage, 
    // Order Track - ADD DEBUG FUNCTION
    initializeOrderTrackPage,
    // Order Form
    initializeOrderFormPage, placeOrder,
    // Footer
    toggleFooterMenu
});

function main() {
    if (isMainInitialized) {
        console.log('main() already initialized. Skipping.');
        return;
    }
    isMainInitialized = true;

    console.log('Main application starting...');
    
    let pageLoadPromises = [];
    pageLoadPromises.push(loadHeaderAndSetup());
    pageLoadPromises.push(loadFooter());

    // Load all products once
    const productsLoadPromise = new Promise(resolve => {
        const productsRef = ref(database, "products/");
        onValue(productsRef, snapshot => {
            if (snapshot.exists()) {
                products = Object.keys(snapshot.val()).map(key => ({ id: key, ...snapshot.val()[key] }));
                setCartManagerProducts(products);
                setProductManagerProducts(products);
                populateProductCategories(products);
            } else {
                console.log('No products found in database');
            }
            console.log('main.js: Products data loaded and resolved.');
            resolve();
        }, error => {
            console.error('Error loading products:', error);
            resolve();
        });
    });
    pageLoadPromises.push(productsLoadPromise);

    Promise.all(pageLoadPromises).then(async () => {
        console.log('main.js: All initial page load promises resolved.');

        // After all initial data are loaded, initialize page-specific logic
        console.log('main.js: Starting page-specific initialization.');
        const currentPage = window.location.pathname;
        
        console.log('Current page:', currentPage);
        
        // PAGE SPECIFIC INITIALIZATION - WITH BETTER ERROR HANDLING
        try {
            if (currentPage.endsWith('/') || currentPage.endsWith('index.html')) {
                console.log('🟢 Initializing Home Page');
                initHomePage(products);
            }
            if (currentPage.includes('product-detail.html')) {
                console.log('🟢 Initializing Product Detail Page');
                initializeProductDetailPage();
            }
            if (currentPage.includes('order-track.html')) {
                console.log('🟢 Initializing Order Track Page');
                // Add timeout to ensure page is fully loaded
                setTimeout(() => {
                    initializeOrderTrackPage().catch(error => {
                        console.error('❌ Error in initializeOrderTrackPage:', error);
                    });
                }, 500);
            }
            if (currentPage.includes('order-form.html')) {
                console.log('🟢 Initializing Order Form Page');
                initializeOrderFormPage();
            }
            if (currentPage.includes('notifications.html')) {
                console.log('🟢 Initializing Notifications Page');
                initializeNotificationsPage();
            }
        } catch (error) {
            console.error('❌ Error in page initialization:', error);
        }

        console.log('main.js: Page-specific initialization complete.');

        // Add event listener for mobile search
        document.getElementById('searchInput')?.addEventListener('input', searchProductsMobile);

        // Check for admin status
        const user = auth.currentUser;
        if (user) {
            try {
                const userIsAdmin = await isAdmin(user.uid);
                if (userIsAdmin) {
                    document.getElementById('product-management')?.classList.remove('hidden');
                    document.getElementById('slider-management')?.classList.remove('hidden');
                    document.getElementById('event-update')?.classList.remove('hidden');
                }
                console.log('main.js: Admin status checked.');
            } catch (error) {
                console.error('Error checking admin status:', error);
            }
        }

        // Ensure loading system completes
        window.addEventListener('load', () => {
            if (window.globalLoadingSystem) {
                console.log('main.js: window.onload fired, forcing loading complete.');
                window.globalLoadingSystem.forceComplete();
            }
        });

    }).catch(error => {
        console.error('Error in main application:', error);
        
        // Force complete loading even if there's an error
        if (window.globalLoadingSystem) {
            window.globalLoadingSystem.forceComplete();
        }
    });
}

// DOM Content Loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}

// Rest of the code remains same...