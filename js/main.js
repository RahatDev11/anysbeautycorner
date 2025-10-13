







// =================================================================
// SECTION: MAIN APPLICATION ENTRY POINT
// =================================================================

// Import Firebase Config (for initialization and global access to auth/db instances)
import { auth, onAuthStateChanged, database, ref, onValue } from '../js/modules/firebase-config.js';

// Import UI Utilities
import { showToast, openSidebar, closeSidebar, toggleSubMenuMobile, handleSubMenuItemClick, toggleSubMenuDesktop, openCartSidebar, closeCartSidebar, focusMobileSearch, setupSocialMediaButtons, populateProductCategories } from './modules/ui-utilities.js';

// Import Notification Managers
import { sendTelegramNotification, sendNotificationForOrder } from '../js/modules/notification-manager.js';

// Import Auth Manager
import { loginWithGmail, confirmLogout, logout, isAdmin, updateLoginButton, toggleLogoutMenu } from '../js/modules/auth-manager.js';

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




            // Wait for initial auth state to be determined and login button updated
            onAuthStateChanged(auth, user => {
                updateLoginButton(user);
            });
            


            await loadCart(); // Await the loadCart promise



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
    loginWithGmail, confirmLogout, logout, toggleLogoutMenu,
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
    
    let pageLoadPromises = [];
    // Load header and footer and set up their functionality
    pageLoadPromises.push(loadHeaderAndSetup());
    pageLoadPromises.push(loadFooter());




    // Load all products once
    const productsLoadPromise = new Promise(resolve => {
        const productsRef = ref(database, "products/");
        onValue(productsRef, snapshot => {
            if (snapshot.exists()) {
                products = Object.keys(snapshot.val()).map(key => ({ id: key, ...snapshot.val()[key] }));
                setCartManagerProducts(products); // Update products in cart-manager
                setProductManagerProducts(products);
                populateProductCategories(products); // Populate product categories in the header
            } else {
                // No products found, but still resolve to continue
            }
            console.log('main.js: Products data loaded and resolved.');
            resolve(); // Resolve after products are loaded
        }, error => {
            console.error('Error loading products:', error);
            resolve(); // Still resolve to continue
        });
    });
    pageLoadPromises.push(productsLoadPromise);

    Promise.all(pageLoadPromises).then(async () => {
        console.log('main.js: All initial page load promises resolved.');


        // After all initial data (header, footer, products) are loaded, then initialize page-specific logic
        console.log('main.js: Starting page-specific initialization.');
        const currentPage = window.location.pathname;
        if (currentPage.endsWith('/') || currentPage.endsWith('index.html')) {
            initHomePage(products); // Pass products to home-manager
        }
        if (currentPage.includes('product-detail.html')) {
            initializeProductDetailPage();
        }
        if (currentPage.includes('order-track.html')) {
            initializeOrderTrackPage();
        }
        if (currentPage.includes('order-form.html')) {
            console.log('main.js: Initializing Order Form Page');
            initializeOrderFormPage();
        }
        console.log('main.js: Page-specific initialization complete.');

        // Add event listener for mobile search
        document.getElementById('searchInput')?.addEventListener('input', searchProductsMobile);

        // Check for admin status
        const user = auth.currentUser;
        if (user) {
            const userIsAdmin = await isAdmin(user.uid);
            if (userIsAdmin) {
                document.getElementById('product-management')?.classList.remove('hidden');
                document.getElementById('slider-management')?.classList.remove('hidden');
                document.getElementById('event-update')?.classList.remove('hidden');
            }
            console.log('main.js: Admin status checked.');
        }

        // Ensure loading system completes
        const tryCompleteLoading = (attempts = 0) => {
            if (window.globalLoadingSystem && window.globalLoadingSystem.isInitialized) {
                console.log('main.js: Calling forceComplete()');
                window.globalLoadingSystem.forceComplete();
            } else if (attempts < 10) { // Retry up to 10 times (10 * 200ms = 2 seconds)
                console.log(`main.js: globalLoadingSystem not ready, retrying forceComplete() (attempt ${attempts + 1})`);
                setTimeout(() => tryCompleteLoading(attempts + 1), 200);
            } else {
                console.error('main.js: Failed to complete loading system after multiple retries.');
                // Fallback: ensure website content is visible even if loading system fails
                const websiteContent = document.getElementById('website-content');
                if (websiteContent) {
                    websiteContent.style.display = 'block';
                }
            }
        };
        setTimeout(tryCompleteLoading, 3000); // Initial call after 3 seconds

    }).catch(error => {
        console.error('Error in main application:', error);
        
        // Force complete loading even if there's an error
        if (window.globalLoadingSystem) {
            window.globalLoadingSystem.forceComplete();
        }


    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}

// গ্লোবাল ক্লিক হ্যান্ডলার
document.addEventListener("click", (event) => {
    if (event.target.id === 'sidebarOverlay') closeSidebar();
    if (!event.target.closest('#cartSidebar') && !event.target.closest('#cartButton')) closeCartSidebar();
    if (!event.target.closest('#desktopSubMenuBar') && !event.target.closest('button[onclick="toggleSubMenuDesktop()"]')) document.getElementById('desktopSubMenuBar')?.classList.add('hidden');

    const menus = document.querySelectorAll('.logout-menu');
    menus.forEach(menu => {
        if (!menu.classList.contains('hidden')) {
            const container = menu.closest('.logout-container');
            if (!container.contains(event.target)) {
                menu.classList.add('hidden');
            }
        }
    });
    
    const mobileSearchBar = document.getElementById('mobileSearchBar');
    const mobileSearchIcon = document.getElementById('mobileSearchIcon');
    if (mobileSearchBar && !mobileSearchBar.classList.contains('hidden')) {
        if (!mobileSearchBar.contains(event.target) && !mobileSearchIcon.contains(event.target)) {
            mobileSearchBar.classList.add('hidden');
        }
    }

    const searchResultsDesktop = document.getElementById('searchResultsDesktop');
    if (searchResultsDesktop && !searchResultsDesktop.contains(event.target) && !event.target.closest('#searchInputDesktop')) { searchResultsDesktop.classList.add('hidden'); }
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
        
    }, 2000);
});

// Emergency timeout to force complete loading after 10 seconds
setTimeout(() => {
    if (window.globalLoadingSystem && !document.body.classList.contains('loading-complete')) {
        console.log('Emergency loading complete triggered');
        window.globalLoadingSystem.forceComplete();
        
    }
}, 10000);
