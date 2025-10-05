// Central exports file - সব modules এক জায়গা থেকে export করবে
export { app, database, auth, firestore, provider } from './firebase-config.js';
export { 
    initializeAuth, loginWithGoogle, logout, onAuthStateChange, 
    getCurrentUser, updateUserProfile 
} from './auth-manager.js';
export { 
    loadCart, addToCart, removeFromCart, updateCartItemQuantity, 
    saveCart, clearCart, getCartStats, cart, onCartChange 
} from './cart-manager.js';
export { 
    loadProducts, getProductById, getProductsByCategory, searchProducts,
    getFeaturedProducts, products, onProductsChange, displayProductsAsCards
} from './product-manager.js';
export { 
    createOrder, getOrderById, getUserOrders, getGuestOrders,
    updateOrderStatus, getStatusText, getStatusColor, ORDER_STATUS 
} from './order-manager.js';
export { 
    showToast, showGlobalLoading, hideGlobalLoading, debounce, throttle,
    formatPrice, validateEmail, validatePhone, validateRequired, hideSocialMediaIcons,
    setupScrollToTopButton, setupFooterMenuToggles, setupSocialMediaButtons
} from './ui-utilities.js';
export { 
    NotificationHandler, sendTelegramNotification, oneSignalManager 
} from './notification-manager.js';
export { 
    loadEvents, getActiveEvents, events, onEventsChange 
} from './event-manager.js';
export { initializeNewsletter } from './newsletter-manager.js';