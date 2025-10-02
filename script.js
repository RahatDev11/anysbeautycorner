// =================================================================
// FILE: script.js (Completely updated for new header.html)
// =================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyCVSzQS1c7H4BLhsDF_fW8wnqUN4B35LPA",
    authDomain: "nahid-6714.firebaseapp.com",
    databaseURL: "https://nahid-6714-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "nahid-6714",
};

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();

// --- Global Variables ---
let allProducts = [];
let cart = [];

// =================================================================
// SECTION: UTILITY FUNCTIONS
// =================================================================
function showToast(message, type = "success") {
    const container = document.getElementById('toast-container') || document.body;
    const toast = document.createElement("div");
    toast.className = `fixed bottom-4 right-4 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-3 rounded-lg shadow-lg z-[2000]`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// =================================================================
// SECTION: HEADER & UI CONTROLS
// =================================================================
function openSidebar() { document.getElementById('sidebarOverlay')?.classList.remove('hidden'); document.getElementById('sidebar')?.classList.remove('-translate-x-full'); }
function closeSidebar() { document.getElementById('sidebarOverlay')?.classList.add('hidden'); document.getElementById('sidebar')?.classList.add('-translate-x-full'); }
function openCartSidebar() { document.getElementById('cartOverlay')?.classList.remove('hidden'); document.getElementById('cartSidebar')?.classList.remove('translate-x-full'); }
function closeCartSidebar() { document.getElementById('cartOverlay')?.classList.add('hidden'); document.getElementById('cartSidebar')?.classList.add('translate-x-full'); }
function focusMobileSearch() { document.getElementById('mobileSearchBar')?.classList.toggle('hidden'); document.getElementById('searchInput')?.focus(); }

// =================================================================
// SECTION: AUTHENTICATION
// =================================================================
function loginWithGmail() {
    signInWithPopup(auth, provider).then(result => saveUserToDb(result.user)).catch(console.error);
}
function logout() {
    if (confirm("আপনি কি লগআউট করতে চান?")) signOut(auth).then(() => showToast("সফলভাবে লগআউট হয়েছেন।"));
}
function updateLoginUI(user) {
    const mobileBtn = document.getElementById('mobileLoginButton'), desktopBtn = document.getElementById('desktopLoginButton');
    if (!mobileBtn || !desktopBtn) return;
    let html;
    if (user) {
        const displayName = user.displayName || 'User';
        const photoURL = user.photoURL || 'https://via.placeholder.com/24';
        html = `<div class="flex items-center"><img src="${photoURL}" class="w-8 h-8 rounded-full mr-2"><div class="flex flex-col text-left"><span class="text-sm font-semibold text-gray-800">${displayName}</span><button class="logout-btn text-xs text-red-600 hover:underline">লগআউট</button></div></div>`;
    } else {
        html = `<button class="login-btn bg-lipstick text-white px-4 py-2 rounded-full font-semibold">লগইন</button>`;
    }
    mobileBtn.innerHTML = desktopBtn.innerHTML = html;
    document.querySelectorAll('.logout-btn').forEach(btn => btn.addEventListener('click', logout));
    document.querySelectorAll('.login-btn').forEach(btn => btn.addEventListener('click', loginWithGmail));
}
function saveUserToDb(user) {
    const userRef = ref(database, `users/${user.uid}/profile`);
    get(userRef).then(snapshot => { if (!snapshot.exists()) set(userRef, { name: user.displayName, email: user.email, photoURL: user.photoURL }); });
}

// =================================================================
// SECTION: NOTIFICATION INDICATOR
// =================================================================
function checkForUnreadNotifications(user) {
    const indicator = document.getElementById('notificationIndicator');
    if (!indicator) return;
    let userId = user ? user.uid : localStorage.getItem('anyBeautyGuestId');
    if (!userId) { indicator.classList.add('hidden'); return; }
    onValue(ref(database, `notifications/${userId}`), (snapshot) => {
        let hasUnread = false;
        if (snapshot.exists()) snapshot.forEach((child) => { if (child.val().isRead === false) hasUnread = true; });
        indicator.classList.toggle('hidden', !hasUnread);
    });
}

// =================================================================
// SECTION: CART MANAGEMENT
// =================================================================
function updateCartUI() {
    const cartItemsEl = document.getElementById("cartItems"), cartCountEl = document.getElementById("cartCount"), totalPriceEl = document.getElementById("totalPrice");
    if (!cartItemsEl || !cartCountEl || !totalPriceEl) return;
    cartItemsEl.innerHTML = "";
    let totalPrice = 0;
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    if (cart.length > 0) {
        cart.forEach(item => {
            const itemTotal = (item.price || 0) * (item.quantity || 0);
            totalPrice += itemTotal;
            cartItemsEl.innerHTML += `<div class="flex justify-between items-center text-black text-sm"><p>${item.name} <span class="text-gray-600">(x${item.quantity})</span></p><p>${itemTotal.toFixed(2)} টাকা</p></div>`;
        });
    } else { cartItemsEl.innerHTML = '<p class="text-center text-gray-500">আপনার কার্ট খালি।</p>'; }
    cartCountEl.textContent = totalItems;
    totalPriceEl.textContent = `মোট মূল্য: ${totalPrice.toFixed(2)} টাকা`;
}
function loadCart(user) {
    if (user) onValue(ref(database, `carts/${user.uid}`), s => { cart = s.val() || []; updateCartUI(); });
    else { cart = JSON.parse(localStorage.getItem('anyBeautyCart')) || []; updateCartUI(); }
}
function saveCart() {
    const user = auth.currentUser;
    if (user) set(ref(database, `carts/${user.uid}`), cart); 
    else localStorage.setItem('anyBeautyCart', JSON.stringify(cart));
    updateCartUI();
}
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId); if (!product) return;
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) cartItem.quantity++;
    else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image ? product.image.split(',')[0] : '', quantity: 1 });
    saveCart();
    showToast(`${product.name} কার্টে যোগ করা হয়েছে`, "success");
}
function checkout() {
    if (cart.length > 0) window.location.href = 'order-form.html';
    else showToast("আপনার কার্ট খালি!", "error");
}

// =================================================================
// SECTION: SEARCH, FILTER & DISPLAY (Mainly for index.html)
// =================================================================
function filterProducts(category) {
    const productListEl = document.getElementById("productList");
    if (!productListEl || !allProducts) return;
    const productsToDisplay = (category === 'all') ? allProducts : allProducts.filter(p => p.category === category);
    productListEl.innerHTML = productsToDisplay.map(product => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
            <a href="product-detail.html?id=${product.id}"><img src="${product.image ? product.image.split(',')[0] : 'https://via.placeholder.com/150'}" alt="${product.name}" class="w-full h-48 object-cover"></a>
            <div class="p-4 flex flex-col flex-grow"><h3 class="font-bold text-lg mb-2 flex-grow">${product.name}</h3><p class="text-lipstick text-xl font-semibold mb-4">${product.price} টাকা</p><button onclick="window.addToCart('${product.id}')" class="mt-auto bg-lipstick text-white py-2 rounded-lg font-semibold hover:bg-opacity-90">কার্টে যোগ করুন</button></div>
        </div>`).join('');
    closeSidebar();
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
}
function searchProducts(query, resultsContainerId) {
    const container = document.getElementById(resultsContainerId);
    if (!container) return;
    if (!query) { container.innerHTML = ''; return; }
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(query));
    container.innerHTML = filtered.slice(0, 5).map(p => `<a href="product-detail.html?id=${p.id}" class="flex items-center p-3 hover:bg-gray-100 border-b"><img src="${p.image ? p.image.split(',')[0].trim() : ''}" class="w-10 h-10 object-cover rounded-md mr-3"><span>${p.name}</span></a>`).join('');
}
function searchProductsDesktop() { searchProducts(document.getElementById('searchInputDesktop').value.toLowerCase(), 'searchResultsDesktop'); }
function searchProductsMobile() { searchProducts(document.getElementById('searchInput').value.toLowerCase(), 'searchResults'); }

// =================================================================
// SECTION: GLOBAL INITIALIZATION
// =================================================================
function initializeWebsite() {
    // Event Listeners for Header elements
    document.getElementById('mobileMenuButton')?.addEventListener('click', openSidebar);
    document.getElementById('closeSidebarButton')?.addEventListener('click', closeSidebar);
    document.getElementById('sidebarOverlay')?.addEventListener('click', (e) => { if (e.target.id === 'sidebarOverlay') closeSidebar(); });
    
    const mobileSubMenuBtn = document.getElementById('mobileSubMenuContainer')?.querySelector('button');
    mobileSubMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const subMenu = document.getElementById('subMenuMobile');
        const icon = mobileSubMenuBtn.querySelector('i');
        subMenu.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
    });

    document.getElementById('cartButton')?.addEventListener('click', openCartSidebar);
    document.getElementById('closeCartButton')?.addEventListener('click', closeCartSidebar);
    document.getElementById('cartOverlay')?.addEventListener('click', closeCartSidebar);
    document.getElementById('checkoutButton')?.addEventListener('click', checkout);
    document.getElementById('mobileSearchButton')?.addEventListener('click', focusMobileSearch);
    document.getElementById('searchInputDesktop')?.addEventListener('input', searchProductsDesktop);
    document.getElementById('searchInput')?.addEventListener('input', searchProductsMobile);

    document.querySelectorAll('.filter-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.target.dataset.category;
            // Check if we are on index.html, otherwise redirect
            if(window.location.pathname.endsWith('index.html') || window.location.pathname === '/'){
                filterProducts(category);
            } else {
                window.location.href = `index.html?filter=${category}`;
            }
        });
    });

    // Load dynamic data
    onValue(ref(database, 'products'), (snapshot) => {
        allProducts = [];
        if (snapshot.exists()) snapshot.forEach(child => allProducts.push({ id: child.key, ...child.val() }));
        // If on index.html, display all products initially
        if (document.getElementById("productList")) filterProducts('all');
    });
    
    // Auth state, cart, and notifications
    onAuthStateChanged(auth, user => {
        updateLoginUI(user);
        loadCart(user);
        checkForUnreadNotifications(user);
    });

    // Make functions globally accessible
    window.addToCart = addToCart;
}

// Run initialization when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeWebsite);