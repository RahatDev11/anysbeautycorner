// =================================================================
// SECTION: MAIN APPLICATION ENTRY POINT
// =================================================================

// Import Firebase Config
import { auth, onAuthStateChanged, database, ref, onValue } from './modules/firebase-config.js';

// Import UI Utilities
import { showToast, openSidebar, closeSidebar, toggleSubMenuMobile, handleSubMenuItemClick, toggleSubMenuDesktop, openCartSidebar, closeCartSidebar, focusMobileSearch, setupSocialMediaButtons, populateProductCategories } from './modules/ui-utilities.js';

// Import Auth Manager
import { loginWithGmail, confirmLogout, logout, isAdmin, updateLoginButton, toggleLogoutMenu } from './modules/auth-manager.js';

// Import Cart Manager
import { loadCart, addToCart, updateQuantity, removeFromCart, checkout, buyNow, setProducts as setCartManagerProducts } from './modules/cart-manager.js';

// Import Product Manager
import { loadProducts, showProductDetail, showLoadingSpinner, displayProductsAsCards, initializeProductSlider, displaySearchResults, searchProductsMobile, searchProductsDesktop, filterProducts, setProducts as setProductManagerProducts } from './modules/product-manager.js';

// Import Page Managers - CORRECT PATHS
import { initHomePage } from './pages/home-manager.js';
import { initializeProductDetailPage } from './pages/product-details-manager.js';
import { initializeOrderTrackPage } from './pages/order-track-manager.js';
import { initializeOrderFormPage } from './pages/order-form-manager.js';

// Global Variables
let products = [];
let isMainInitialized = false;

async function loadHeaderAndSetup() {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('🔄 Loading header...');
            const response = await fetch('header.html');
            if (!response.ok) {
                throw new Error('Failed to load header.html');
            }
            const headerHTML = await response.text();
            const headerEl = document.getElementById('header');
            if (headerEl) {
                headerEl.innerHTML = headerHTML;
            }

            // Setup header event listeners
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
            
            setupSocialMediaButtons();
            console.log('✅ Header loaded successfully');
            resolve();

        } catch (error) {
            console.error('❌ Error loading header:', error);
            reject(error);
        }
    });
}

async function loadFooter() {
    try {
        console.log('🔄 Loading footer...');
        const response = await fetch('footer.html');
        if (!response.ok) {
            throw new Error('Failed to load footer.html');
        }
        const footerHTML = await response.text();
        const footerEl = document.getElementById('footer');
        if (footerEl) {
            footerEl.innerHTML = footerHTML;
        }
        console.log('✅ Footer loaded successfully');
    } catch (error) {
        console.error('❌ Error loading footer:', error);
    }
}

// =================================================================
// SECTION: GLOBAL FUNCTION ASSIGNMENT
// =================================================================

// Assign global functions
Object.assign(window, {
    // Global Utilities
    showToast,
    // Header UI
    openSidebar, closeSidebar, toggleSubMenuMobile, handleSubMenuItemClick,
    toggleSubMenuDesktop, openCartSidebar, closeCartSidebar, focusMobileSearch,
    // Auth
    loginWithGmail, confirmLogout, logout, toggleLogoutMenu,
    // Cart & Checkout
    filterProducts, searchProductsMobile, searchProductsDesktop, checkout,
    buyNow, addToCart, updateQuantity, removeFromCart,
    // Product Detail
    showProductDetail,
    // Order Track
    initializeOrderTrackPage,
    // Order Form
    initializeOrderFormPage
});

function main() {
    if (isMainInitialized) {
        console.log('⚠️ main() already initialized. Skipping.');
        return;
    }
    isMainInitialized = true;

    console.log('🚀 Main application starting...');
    
    // Show website content immediately
    const websiteContent = document.getElementById('website-content');
    if (websiteContent) {
        websiteContent.style.display = 'block';
    }

    let pageLoadPromises = [];
    pageLoadPromises.push(loadHeaderAndSetup());
    pageLoadPromises.push(loadFooter());

    // Load all products
    const productsLoadPromise = new Promise(resolve => {
        const productsRef = ref(database, "products/");
        onValue(productsRef, snapshot => {
            if (snapshot.exists()) {
                products = Object.keys(snapshot.val()).map(key => ({ id: key, ...snapshot.val()[key] }));
                setCartManagerProducts(products);
                setProductManagerProducts(products);
                populateProductCategories(products);
                console.log('✅ Products loaded:', products.length);
            } else {
                console.log('ℹ️ No products found in database');
            }
            resolve();
        }, error => {
            console.error('❌ Error loading products:', error);
            resolve();
        });
    });
    pageLoadPromises.push(productsLoadPromise);

    Promise.all(pageLoadPromises).then(async () => {
        console.log('✅ All initial page load promises resolved');

        // Load cart after products are loaded
        await loadCart();

        // Initialize page-specific logic
        console.log('🔄 Starting page-specific initialization');
        const currentPage = window.location.pathname;
        
        console.log('📄 Current page:', currentPage);
        
        // Page specific initialization
        if (currentPage.endsWith('/') || currentPage.endsWith('index.html')) {
            console.log('🏠 Initializing Home Page');
            initHomePage(products);
        }
        else if (currentPage.includes('product-detail.html')) {
            console.log('📦 Initializing Product Detail Page');
            initializeProductDetailPage();
        }
        else if (currentPage.includes('order-track.html')) {
            console.log('📋 Initializing Order Track Page');
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                initializeOrderTrackPage().catch(error => {
                    console.error('❌ Error in Order Track Page:', error);
                });
            }, 100);
        }
        else if (currentPage.includes('order-form.html')) {
            console.log('🛒 Initializing Order Form Page');
            initializeOrderFormPage();
        }

        console.log('✅ Page-specific initialization complete');

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
            } catch (error) {
                console.error('Error checking admin status:', error);
            }
        }

        // Complete loading
        if (window.globalLoadingSystem) {
            console.log('✅ Forcing loading complete');
            window.globalLoadingSystem.forceComplete();
        }

    }).catch(error => {
        console.error('❌ Error in main application:', error);
        
        // Force complete loading even if there's an error
        if (window.globalLoadingSystem) {
            window.globalLoadingSystem.forceComplete();
        }
        
        // Show website content even on error
        const websiteContent = document.getElementById('website-content');
        if (websiteContent) {
            websiteContent.style.display = 'block';
        }
    });
}

// Start the application
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}

// Global click handlers
document.addEventListener("click", (event) => {
    if (event.target.id === 'sidebarOverlay') closeSidebar();
    if (!event.target.closest('#cartSidebar') && !event.target.closest('#cartButton')) closeCartSidebar();
});

// Emergency timeout to force complete loading after 5 seconds
setTimeout(() => {
    if (window.globalLoadingSystem) {
        console.log('⚠️ Emergency loading complete triggered');
        window.globalLoadingSystem.forceComplete();
    }
    const websiteContent = document.getElementById('website-content');
    if (websiteContent) {
        websiteContent.style.display = 'block';
    }
}, 5000);