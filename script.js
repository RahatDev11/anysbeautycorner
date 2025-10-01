// =================================================================
// SECTION: FIREBASE INITIALIZATION & CONFIGURATION
// =================================================================

// Firebase Configuration - Moved to top for proper scope
const firebaseConfig = {
    apiKey: "AIzaSyCVSzQS1c7H4BLhsDF_fW8wnqUN4B35LPA",
    authDomain: "nahid-6714.firebaseapp.com",
    databaseURL: "https://nahid-6714-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "nahid-6714",
    storageBucket: "nahid-6714.appspot.com",
    messagingSenderId: "505741217147",
    appId: "1:505741217147:web:25ed4e9f0d00e3c4d381de",
    measurementId: "G-QZ7CTRKHCW"
};

// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set, get, query, orderByChild, equalTo, update, push, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; // Added for Firestore

// Global Variables (declared once and assigned)
let products = [];
let cart = [];
let eventSlider;

// Firebase Initialization (consolidated and corrected)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app); // Realtime Database instance
const db = getFirestore(app); // Firestore instance
const provider = new GoogleAuthProvider(); // Auth provider

// =================================================================
// SECTION: UTILITY & HELPER FUNCTIONS
// =================================================================

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    const icon = type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle";
    const color = type === "success" ? "bg-green-500" : "bg-red-500";
    toast.className = `fixed bottom-24 right-4 ${color} text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50`;
    toast.innerHTML = `<i class="${icon} mr-2"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove() }, 3000);
};

function hideSocialMediaIcons() {
    document.getElementById('socialIcons')?.classList.add('hidden');
}

// === START: TELEGRAM NOTIFICATION FUNCTION (NEW CODE) ===
/**
 * Netlify Function কে কল করে Telegram এ নোটিফিকেশন পাঠায়।
 * @param {object} orderData - অর্ডারের সমস্ত তথ্য
 */
async function sendTelegramNotification(orderData) {
    const url = '/.netlify/functions/telegram_notifier'; 
    
    try {
        console.log("Submitting order data to Telegram notifier...");
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            // যদি error আসে, শুধু warning দেবে, কিন্তু অর্ডার সেভ হওয়া বন্ধ করবে না।
            console.warn(`Telegram notification failed: ${response.status} (${response.statusText}). The order is saved to the database.`);
        } else {
            console.log("Telegram notification sent successfully.");
        }
        
    } catch (error) {
        // Network error হলেও, error throw করবে না।
        console.error("Telegram notification fetch error:", error);
    }
}
// === END: TELEGRAM NOTIFICATION FUNCTION (NEW CODE) ===


// =================================================================
// SECTION: CART MANAGEMENT
// =================================================================

function updateAllCartUIs() {
    updateCartSidebarUI();
    updateFloatingBarUI();
    if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) {
        displayProductsAsCards(products);
    }
}

function updateCartSidebarUI() {
    const cartItemsEl = document.getElementById("cartItems");
    const cartCountEl = document.getElementById("cartCount");
    const totalPriceEl = document.getElementById("totalPrice");
    if (!cartItemsEl || !cartCountEl) return;
    
    cartItemsEl.innerHTML = "";
    let totalPrice = 0;
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

    if (cart.length > 0) {
        cart.forEach(item => {
            const itemTotal = (item.price || 0) * (item.quantity || 0);
            totalPrice += itemTotal;
            const itemEl = document.createElement("div");
            itemEl.className = "flex items-center justify-between p-2 border-b text-black";
            itemEl.innerHTML = `<div class="flex items-center"><img src="${item.image ? item.image.split(',')[0].trim() : 'https://via.placeholder.com/40'}" class="w-10 h-10 object-cover rounded mr-3"><div><p class="font-semibold text-sm">${item.name}</p><p class="text-xs text-gray-600">${item.quantity} x ${item.price}৳</p></div></div><div class="flex items-center"><p class="font-semibold mr-3">${itemTotal.toFixed(2)}৳</p><button onclick="event.stopPropagation(); window.removeFromCart('${item.id}')" class="text-red-500 hover:text-red-700"><i class="fas fa-trash-alt"></i></button></div>`;
            cartItemsEl.appendChild(itemEl);
        });
    } else {
        cartItemsEl.innerHTML = '<p class="text-center text-gray-500">আপনার কার্ট খালি।</p>';
    }
    cartCountEl.textContent = totalItems;
    if(totalPriceEl) totalPriceEl.textContent = `মোট মূল্য: ${totalPrice.toFixed(2)} টাকা`;
}

function updateFloatingBarUI() {
    const bar = document.getElementById("place-order-bar");
    if (!bar) return;
    if (cart.length === 0) { 
        bar.classList.add("hidden"); 
        // If bar is hidden, social media icons can be shown if not hidden by other means
        // This is handled by the general click handler for social media button
        return; 
    }
    bar.classList.remove("hidden");
    hideSocialMediaIcons(); // Hide social media icons when place order bar is visible
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPrice = cart.reduce((sum, item) => sum + parseFloat(item.price || 0) * (item.quantity || 0), 0);
    document.getElementById("bar-item-count").textContent = totalItems;
    document.getElementById("bar-total-price").textContent = totalPrice.toFixed(2);
}

function getUserId() {
    if (auth && auth.currentUser) return auth.currentUser.uid;
    let userId = localStorage.getItem('tempUserId');
    if (!userId) {
        userId = 'guest_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('tempUserId', userId);
    }
    return userId;
};

function loadCart() {
    return new Promise(resolve => {
        const userId = getUserId();
        if (auth && auth.currentUser) {
            onValue(ref(database, `carts/${userId}`), (snapshot) => {
                cart = snapshot.val() || [];
                updateAllCartUIs();
                resolve();
            }, { onlyOnce: true }); // Listen only once for initial load
        } else {
            const localCart = localStorage.getItem("anyBeautyCart");
            cart = localCart ? JSON.parse(localCart) : [];
            updateAllCartUIs();
            resolve();
        }
    });
};

function saveCart() {
    localStorage.setItem("anyBeautyCart", JSON.stringify(cart));
    if (auth && auth.currentUser) {
        set(ref(database, `carts/${getUserId()}`), cart);
    }
    updateAllCartUIs();
};

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image ? product.image.split(',')[0].trim() : '',
            quantity: 1
        });
    }
    saveCart();
    showToast(`${product.name} কার্টে যোগ করা হয়েছে`, "success");
    // Hide social media button when item is added to cart
    const socialMediaButton = document.getElementById('socialShareButton');
    if (socialMediaButton) {
        socialMediaButton.classList.add('hidden');
    }
};

function updateQuantity(productId, change) {
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += change;
        if (cartItem.quantity <= 0) {
            cart = cart.filter(item => item.id !== productId);
        }
        saveCart();
    }
};

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
};

function checkout() {
    if (cart.length > 0) {
        hideSocialMediaIcons(); // Hide social media icons before redirecting to order form
        // The cart is already saved in localStorage by saveCart(). Just redirect.
        window.location.href = 'order-form.html';
    } else {
        showToast("আপনার কার্ট খালি!", "error");
    }
};

function buyNow(productId) { // Removed quantity parameter
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Check if the product is already in the cart and use its quantity
    const cartItem = cart.find(item => item.id === productId);
    const quantityToBuy = cartItem ? cartItem.quantity : 1; // Use cart quantity or default to 1

    const tempCart = [{
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image ? product.image.split(',')[0].trim() : '',
        quantity: quantityToBuy // Use the determined quantity
    }];
    const cartData = encodeURIComponent(JSON.stringify(tempCart));
    window.location.href = `order-form.html?cart=${cartData}`;
};

// =================================================================
// SECTION: AUTHENTICATION
// =================================================================

function loginWithGmail() {
    signInWithPopup(auth, provider).then(result => {
        const user = result.user;
        showToast(`স্বাগতম, ${user.displayName}`);
        saveUserToFirebase(user);
    }).catch(error => console.error("Login Error:", error.message));
};

function updateLoginButton(user) {
    const mobileBtn = document.getElementById('mobileLoginButton');
    const desktopBtn = document.getElementById('desktopLoginButton');
    if (!mobileBtn || !desktopBtn) return;
    
    if (user) {
        const displayName = user.displayName || user.email.split('@')[0];
        const html = `<div class="flex flex-col"><span class="flex items-center text-black font-semibold">${user.photoURL ? `<img src="${user.photoURL}" class="w-6 h-6 rounded-full mr-2">` : ''}${displayName}</span><button onclick="window.confirmLogout()" class="text-left text-sm text-red-500 hover:underline mt-1">লগআউট</button></div>`;
        mobileBtn.innerHTML = html;
        desktopBtn.innerHTML = html;
    } else {
        const html = `<button class="flex items-center" onclick="window.loginWithGmail()"><i class="fas fa-user-circle mr-2"></i><span class="text-black">লগইন</span></button>`;
        mobileBtn.innerHTML = `<button class="flex items-center w-full" onclick="window.loginWithGmail()"><i class="fas fa-user-circle mr-2"></i><span class="text-black font-semibold">লগইন</span></button>`;
        desktopBtn.innerHTML = html;
    }
};

function confirmLogout() {
    if (confirm("আপনি কি লগআউট করতে চান?")) logout();
}

function logout() {
    signOut(auth).then(() => showToast("সফলভাবে লগআউট হয়েছেন।"));
}

function saveUserToFirebase(user) {
    const userRef = ref(database, `users/${user.uid}`);
    get(userRef).then(snapshot => {
        if (!snapshot.exists()) {
            set(userRef, { name: user.displayName, email: user.email, photoURL: user.photoURL, createdAt: new Date().toISOString() });
        }
    });
};

// =================================================================
// SECTION: UI & DISPLAY LOGIC (HOME PAGE)
// =================================================================

function showProductDetail(id) {
    window.location.href = `product-detail.html?id=${id}`;
}

function showLoadingSpinner() {
    const productList = document.getElementById("productList");
    if (productList) {
        productList.innerHTML = Array(8).fill('<div class="bg-white rounded-xl shadow overflow-hidden animate-pulse"><div class="bg-gray-300 h-36 w-full"></div><div class="p-3"><div class="h-5 bg-gray-200 rounded w-3/4 mb-3"></div><div class="h-6 bg-gray-200 rounded w-1/2"></div></div></div>').join('');
    }
}

function displayProductsAsCards(productsToDisplay) {
    const productList = document.getElementById("productList");
    if (!productList) return;

    let productsHTML = productsToDisplay.map(product => {
        const cartItem = cart.find(item => item.id === product.id);
        const cartControlsHTML = cartItem
            ? `<div class="w-full bg-white rounded-lg font-semibold flex items-center h-10 justify-around"><button onclick="window.updateQuantity('${product.id}', -1)" class="px-3 text-xl font-bold text-lipstick-dark">-</button><span class="text-lg text-lipstick-dark">${cartItem.quantity}</span><button onclick="window.updateQuantity('${product.id}', 1)" class="px-3 text-xl font-bold text-lipstick-dark">+</button></div>`
            : `<button onclick="window.addToCart('${product.id}')" class="w-full bg-white rounded-lg font-semibold flex items-center h-10 justify-center text-sm text-lipstick-dark hover:bg-gray-100">Add To Cart</button>`;

        const imageUrl = product.image ? product.image.split(",")[0].trim() : "https://via.placeholder.com/150";

        return `
            <div class="bg-white rounded-xl shadow overflow-hidden flex flex-col">
                <img src="${imageUrl}" alt="${product.name}" class="w-full h-36 object-cover cursor-pointer" onclick="window.showProductDetail('${product.id}')">
                <div class="p-3 text-white flex flex-col flex-grow" style="background-color: #F4A7B9;">
                    <div class="flex-grow"><h3 class="font-semibold text-lg h-10 line-clamp-2 cursor-pointer" onclick="window.showProductDetail('${product.id}')">${product.name}</h3></div>
                    <div>
                        <p class="text-xl font-bold mt-2">${product.price} টাকা</p>
                        <div class="mt-4 space-y-2">${cartControlsHTML}<button onclick="window.buyNow('${product.id}')" class="w-full border border-white text-white py-2 rounded-lg font-semibold text-sm hover:bg-white hover:text-lipstick-dark transition-colors">Buy Now</button></div>
                    </div>
                </div>
            </div>`;
    }).join('');

    productList.innerHTML = productsHTML;
}

function initializeProductSlider(sliderProducts) {
    const wrapper = document.getElementById("new-product-slider-wrapper");
    if (!wrapper) return;
    wrapper.innerHTML = sliderProducts.map(product => {
        const imageUrl = product.image ? product.image.split(",")[0].trim() : "https://via.placeholder.com/400";
        return `<div class="swiper-slide"><div class="relative w-full h-64 md:h-80"><img src="${imageUrl}" class="w-full h-full object-cover"><div class="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6"><h3 class="text-white text-2xl font-bold">${product.name}</h3><p class="text-white text-lg">${product.price} টাকা</p><button onclick="window.showProductDetail('${product.id}')" class="mt-4 bg-lipstick-dark text-white py-2 px-4 rounded-lg self-start hover:bg-opacity-80">Shop Now</button></div></div></div>`;
    }).join('');
    
    if (typeof Swiper !== 'undefined') {
        new Swiper(".new-product-slider", { loop: sliderProducts.length > 1, autoplay: { delay: 3000 }, pagination: { el: ".swiper-pagination", clickable: true }, effect: "fade" });
    }
}

async function displayEvents() {
    return new Promise(resolve => {
        const wrapper = document.getElementById('event-slider-wrapper');
        if (!wrapper) {
            resolve();
            return;
        }
        onValue(ref(database, 'events'), (snapshot) => {
            const activeEvents = [];
            if (snapshot.exists()) {
                snapshot.forEach(child => { if (child.val().isActive) activeEvents.push(child.val()); });
            }
            wrapper.innerHTML = activeEvents.length > 0
                ? activeEvents.slice(0, 3).map(event => event.imageUrl
                    ? `<div class="swiper-slide rounded-lg shadow-lg bg-cover bg-center" style="height: 160px; background-image: url(${event.imageUrl});"><div class="w-full h-full bg-black bg-opacity-50 rounded-lg p-6 flex flex-col justify-center items-center text-center text-white"><h3 class="text-xl font-bold">${event.title || ''}</h3><p class="mt-1">${event.description || ''}</p></div></div>`
                    : `<div class="swiper-slide bg-white p-6 flex flex-col justify-center items-center text-center rounded-lg shadow-lg" style="height: 160px;"><h3 class="text-xl font-bold text-lipstick-dark">${event.title || ''}</h3><p class="text-gray-600 mt-1">${event.description || ''}</p></div>`
                ).join('')
                : '<div class="swiper-slide text-center p-6 bg-white rounded-lg">কোনো নতুন ইভেন্ট নেই।</div>';

            if (typeof Swiper !== 'undefined') {
                if (eventSlider) eventSlider.destroy(true, true);
                eventSlider = new Swiper('.event-slider', { loop: activeEvents.length > 1, autoplay: { delay: 3500 }, pagination: { el: '.swiper-pagination', clickable: true } });
            }
            resolve(); // Resolve the promise after events are displayed
        }, { onlyOnce: true }); // Listen only once
    });
}

// =================================================================
// SECTION: SEARCH & FILTERING
// =================================================================

function displaySearchResults(filtered, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = filtered.slice(0, 5).map(p => `
        <a href="product-detail.html?id=${p.id}" class="flex items-center p-2 hover:bg-gray-100 text-gray-800 border-b">
            <img src="${p.image ? p.image.split(',')[0].trim() : 'https://via.placeholder.com/40'}" class="w-8 h-8 object-cover rounded mr-2">
            <span class="text-sm">${p.name}</span><span class="ml-auto text-xs text-red-500">${p.price}৳</span>
        </a>`).join('');
    container.classList.toggle('hidden', filtered.length === 0);
};

function searchProductsMobile() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const filtered = query ? products.filter(p => p.name.toLowerCase().includes(query) || p.tags?.toLowerCase().includes(query)) : [];
    displaySearchResults(filtered, 'searchResults');
};

function searchProductsDesktop() {
    const query = document.getElementById('searchInputDesktop').value.toLowerCase().trim();
    const filtered = query ? products.filter(p => p.name.toLowerCase().includes(query) || p.tags?.toLowerCase().includes(query)) : [];
    displaySearchResults(filtered, 'searchResultsDesktop');
};

function filterProducts(category) {
    const filtered = category === 'all' ? products : products.filter(p => p.category === category);
    displayProductsAsCards(filtered);
    closeSidebar();
    const desktopSubMenuBar = document.getElementById('desktopSubMenuBar');
    if (desktopSubMenuBar) desktopSubMenuBar.classList.add('hidden');
    document.getElementById('productList')?.scrollIntoView({ behavior: 'smooth' });
};

// =================================================================
// SECTION: HEADER & SIDEBAR UI CONTROLS
// =================================================================

function openSidebar() {
    hideSocialMediaIcons();
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    if (sidebarOverlay) sidebarOverlay.classList.remove('hidden');
    if (sidebar) sidebar.classList.remove('-translate-x-full');
}

function closeSidebar() {
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
    if (sidebar) sidebar.classList.add('-translate-x-full');
}
function toggleSubMenuMobile(event) {
    event.stopPropagation();
    document.getElementById('subMenuMobile')?.classList.toggle('hidden');
    document.getElementById('arrowIcon')?.classList.toggle('rotate-180');
};
function handleSubMenuItemClick(category) {
    if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) {
        filterProducts(category);
    } else {
        window.location.href = `index.html?filter=${category}`;
    }
    closeSidebar();
};
function toggleSubMenuDesktop() {
    hideSocialMediaIcons();
    document.getElementById('desktopSubMenuBar')?.classList.toggle('hidden');
    document.getElementById('desktopArrowIcon')?.classList.toggle('rotate-180');
};
function openCartSidebar() {
    document.getElementById('cartSidebar').classList.remove('translate-x-full');
    document.getElementById('cartOverlay').classList.remove('hidden');
    document.body.classList.add('overflow-hidden'); // Prevent scrolling on body
    // Hide social media button if it exists on the page
    const socialMediaButton = document.getElementById('socialShareButton');
    if (socialMediaButton) {
        socialMediaButton.classList.add('hidden');
    }
}
function closeCartSidebar() {
    document.getElementById('cartSidebar').classList.add('translate-x-full');
    document.getElementById('cartOverlay').classList.add('hidden');
    document.body.classList.remove('overflow-hidden'); // Re-enable scrolling on body
    // Show social media button if it exists on the page
    const socialMediaButton = document.getElementById('socialShareButton');
    if (socialMediaButton) {
        socialMediaButton.classList.remove('hidden');
    }
}
function focusMobileSearch() {
    document.getElementById('mobileSearchBar')?.classList.toggle('hidden');
    document.getElementById('searchInput')?.focus();
};

// =================================================================
// SECTION: PRODUCT DETAIL PAGE LOGIC
// =================================================================

async function initializeProductDetailPage() {
    const productContent = document.getElementById('productContent');
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (!productContent) return Promise.resolve(); // Resolve immediately if element not found

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        showToast('প্রোডাক্ট আইডি পাওয়া যায়নি!', 'error');
        if (loadingSpinner) loadingSpinner.innerHTML = '<p class="text-red-500">প্রোডাক্ট আইডি পাওয়া যায়নি।</p>';
        return Promise.resolve(); // Resolve immediately if no product ID
    }

    try {
        const productRef = ref(database, 'products/' + productId);
        const snapshot = await get(productRef);

        if (snapshot.exists()) {
            const product = { id: productId, ...snapshot.val() };
            displayProductDetails(product);
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            productContent.classList.remove('hidden');
        } else {
            showToast('প্রোডাক্ট পাওয়া যায়নি!', 'error');
            if (loadingSpinner) loadingSpinner.innerHTML = '<p class="text-red-500">দুঃখিত, এই প্রোডাক্টটি পাওয়া যায়নি।</p>';
        }
    } catch (error) {
        console.error("Error loading product detail:", error);
        showToast('প্রোডাক্ট লোড করতে সমস্যা হয়েছে!', 'error');
        if (loadingSpinner) loadingSpinner.innerHTML = `<p class="text-red-500">ত্রুটি: ${error.message}</p>`;
    }
    return Promise.resolve(); // Ensure a promise is always returned and resolved
}

function displayProductDetails(product) {
    document.title = product.name || "প্রোডাক্ট বিস্তারিত";
    document.getElementById('productTitle').textContent = product.name;
    document.getElementById('productPrice').textContent = `দাম: ${product.price} টাকা`;
    document.getElementById('productDescription').textContent = product.description;

    const detailsExtraContainer = document.getElementById('productDetailsExtra');
    const stockStatus = product.stockStatus === 'in_stock'
        ? '<span class="text-green-600 font-semibold">স্টকে আছে</span>'
        : '<span class="text-red-600 font-semibold">স্টকে নেই</span>';
    
    let extraHTML = `<p class="text-gray-700 mb-4 font-medium"><strong>স্টক:</strong> ${stockStatus}</p>`;

    if (product.stockStatus === 'in_stock') {
        extraHTML += `<div class="flex items-center space-x-3 my-4"><span class="text-gray-700 font-medium">পরিমাণ:</span><div class="flex items-center border border-gray-300 rounded-lg"><button onclick="window.changeDetailQuantity(-1)" class="bg-gray-200 px-4 py-2 font-bold">-</button><input type="number" id="quantityDetailInput" value="1" min="1" class="w-16 text-center border-0 focus:ring-0"><button onclick="window.changeDetailQuantity(1)" class="bg-gray-200 px-4 py-2 font-bold">+</button></div></div>`;
    }
    detailsExtraContainer.innerHTML = extraHTML;

    const actionButtonsContainer = document.getElementById('actionButtons');
    const whatsappMessage = `প্রোডাক্ট: ${product.name}\nদাম: ${product.price} টাকা\nআমি এই প্রোডাক্টটি কিনতে আগ্রহী।`;
    const whatsappLink = `https://wa.me/8801931866636?text=${encodeURIComponent(whatsappMessage)}`;
    
    let buttonsHTML = `<button id="buyNowDetailBtn" onclick="window.buyNowWithQuantity('${product.id}')" class="w-full sm:w-auto bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold flex items-center justify-center"><i class="fas fa-credit-card mr-2"></i>এখনই কিনুন</button><button id="addToCartDetailBtn" onclick="window.addToCartWithQuantity('${product.id}')" class="w-full sm:w-auto bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 font-semibold flex items-center justify-center"><i class="fas fa-cart-plus mr-2"></i>কার্টে যোগ করুন</button><a href="${whatsappLink}" target="_blank" class="w-full sm:w-auto bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold inline-flex items-center justify-center"><i class="fab fa-whatsapp mr-2"></i>WhatsApp এ অর্ডার</a>`;
    actionButtonsContainer.innerHTML = buttonsHTML;
    
    if (product.stockStatus !== 'in_stock') {
        document.getElementById('buyNowDetailBtn').disabled = true;
        document.getElementById('addToCartDetailBtn').disabled = true;
        document.getElementById('buyNowDetailBtn').classList.add('opacity-50', 'cursor-not-allowed');
        document.getElementById('addToCartDetailBtn').classList.add('opacity-50', 'cursor-not-allowed');
    }

    const images = product.image ? product.image.split(',').map(img => img.trim()).filter(Boolean) : [];
    setupImageGallery(images);
}

function changeDetailQuantity(amount) { const input = document.getElementById('quantityDetailInput'); if(!input) return; let currentValue = parseInt(input.value); if (isNaN(currentValue)) currentValue = 1; const newValue = currentValue + amount; if (newValue >= 1) input.value = newValue; }
function addToCartWithQuantity(productId) { 
    const quantity = parseInt(document.getElementById('quantityDetailInput').value);
    const product = products.find(p => p.id === productId); 
    if (!product) return; 
    const cartItem = cart.find(item => item.id === productId); 
    if (cartItem) { 
        cartItem.quantity += quantity; 
    } else { 
        cart.push({ 
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image ? product.image.split(',')[0].trim() : '',
            quantity: quantity 
        }); 
    } 
    saveCart(); 
    showToast(`${quantity}টি ${product.name} কার্টে যোগ করা হয়েছে`, "success"); 
    openCartSidebar(); 
}
function buyNowWithQuantity(productId) {
    const quantity = parseInt(document.getElementById('quantityDetailInput').value);
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const tempCart = [{
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image ? product.image.split(',')[0].trim() : '',
        quantity: quantity
    }];
    const cartData = encodeURIComponent(JSON.stringify(tempCart));
    window.location.href = `order-form.html?cart=${cartData}`;
}

let galleryImages = []; let currentImageModalIndex = 0;
function setupImageGallery(images) { galleryImages = images; const mainImage = document.getElementById('mainImage'); const thumbnailContainer = document.getElementById('thumbnailContainer'); thumbnailContainer.innerHTML = ''; if (images.length > 0) { mainImage.src = images[0]; images.forEach((img, index) => { const thumb = document.createElement('img'); thumb.src = img; thumb.className = 'thumbnail'; if (index === 0) thumb.classList.add('active'); thumb.onclick = () => { mainImage.src = img; currentImageModalIndex = index; document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active')); thumb.classList.add('active'); }; thumbnailContainer.appendChild(thumb); }); } else { mainImage.src = 'https://via.placeholder.com/500x400.png?text=No+Image'; } mainImage.addEventListener('click', openImageModal); }
function openImageModal() {
    hideSocialMediaIcons();
    if (galleryImages.length === 0) return; const modal = document.getElementById('imageModal'); modal.style.display = 'flex'; updateModalImage(); document.getElementById('modalCloseBtn').onclick = closeImageModal; document.getElementById('modalPrevBtn').onclick = () => changeModalImage(-1); document.getElementById('modalNextBtn').onclick = () => changeModalImage(1); }
function closeImageModal() { document.getElementById('imageModal').style.display = 'none'; }
function changeModalImage(direction) { currentImageModalIndex = (currentImageModalIndex + direction + galleryImages.length) % galleryImages.length; updateModalImage(); }
function updateModalImage() { document.getElementById('modalImage').src = galleryImages[currentImageModalIndex]; }

// =================================================================
// SECTION: ORDER TRACK PAGE LOGIC
// =================================================================

async function initializeOrderTrackPage() {
    const orderListContainer = document.getElementById('orderListContainer');
    const orderListDiv = document.getElementById('orderList');

    if (!orderListContainer) return Promise.resolve(); // Resolve immediately if element not found

    async function trackOrderById(orderId) {
        orderListDiv.innerHTML = '<p class="text-center text-gray-500 italic p-4">অর্ডার লোড হচ্ছে...</p>';
        orderListContainer.style.display = 'block';

        try {
            const orderRef = ref(database, 'orders/' + orderId);
            const orderSnapshot = await get(orderRef);

            if (orderSnapshot.exists()) {
                const orderData = orderSnapshot.val();
                renderOrderDetails(orderData, orderId);
            } else {
                orderListDiv.innerHTML = '<p class="text-center text-red-500 italic p-4">এই আইডি দিয়ে কোনো অর্ডার খুঁজে পাওয়া যায়নি।</p>';
            }
        } catch (error) {
            console.error("Error tracking order:", error);
            orderListDiv.innerHTML = '<p class="text-center text-red-500 italic p-4">অর্ডার ট্র্যাকিং এ সমস্যা হয়েছে।</p>';
        }
    }

    function renderOrderDetails(order, orderId) {
        orderListDiv.innerHTML = '';

        const orderCard = document.createElement('div');
        orderCard.className = 'bg-white p-4 rounded-lg shadow-md mb-4';
        orderCard.innerHTML = `
            <h3 class="text-xl font-semibold text-lipstick mb-2">অর্ডার আইডি: ${orderId}</h3>
            <p><strong>তারিখ:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
            <p><strong>নাম:</strong> ${order.customerName}</p>
            <p><strong>ফোন:</strong> ${order.phoneNumber}</p>
            <p><strong>ঠিকানা:</strong> ${order.address}, ${order.deliveryLocation === 'ঢাকার বাইরে' ? order.outsideDhakaLocation : 'ঢাকা'}</p>
            <p><strong>মোট মূল্য:</strong> ${order.totalAmount} টাকা</p>
            <p><strong>স্ট্যাটাস:</strong> <span class="font-bold text-green-600">${order.status || 'Pending'}</span></p>
            <h4 class="font-semibold mt-3 mb-1">অর্ডারকৃত পণ্যসমূহ:</h4>
            <ul class="list-disc pl-5">
                ${order.cartItems.map(item => `<li>${item.name} (পরিমাণ: ${item.quantity}, মূল্য: ${item.price} টাকা)</li>`).join('')}
            </ul>
        `;
        orderListDiv.appendChild(orderCard);
    }

    async function loadUserOrders(userId) {
        const orderListContainer = document.getElementById('orderListContainer');
        const orderListDiv = document.getElementById('orderList');

        if (!orderListContainer) return;

        orderListDiv.innerHTML = '<p class="text-center text-gray-500 italic p-4">অর্ডার লোড হচ্ছে...</p>';
        orderListContainer.style.display = 'block';

        try {
            const ordersRef = ref(database, 'orders');
            const userOrdersQuery = query(ordersRef, orderByChild('userId'), equalTo(userId));
            const snapshot = await get(userOrdersQuery);

            const orders = [];
            snapshot.forEach(childSnapshot => {
                orders.push({ key: childSnapshot.key, ...childSnapshot.val() });
            });

            if (orders.length > 0) {
                orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
                displayOrderCards(orders);
            } else {
                orderListDiv.innerHTML = '<p class="text-center text-gray-600">আপনার কোনো অর্ডার এখনো নেই।</p>';
            }
        } catch (error) {
            console.error("Error loading user orders:", error);
            showToast("আপনার অর্ডারগুলো লোড করতে সমস্যা হয়েছে!", 'error');
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const urlOrderId = urlParams.get('orderId');

    if (urlOrderId) {
        await trackOrderById(urlOrderId);
    } else {
        await new Promise(resolve => {
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    await loadUserOrders(user.uid);
                } else {
                    await loadLocalOrders();
                }
                resolve();
            });
        });
    }
    return Promise.resolve(); // Ensure a promise is always returned and resolved
}

async function loadLocalOrders() {
    const localOrderKeys = JSON.parse(localStorage.getItem('myOrders') || '[]'); // Use the correct key 'myOrders'
    const orderListContainer = document.getElementById('orderListContainer');

    if (!orderListContainer) return;

    if (localOrderKeys.length === 0) {
        orderListContainer.innerHTML = '<p class="text-center text-gray-600">আপনি কোনো প্রোডাক্ট এখনো অর্ডার করেননি।</p>';
        orderListContainer.style.display = 'block';
        return;
    }

    try {
        const ordersPromises = localOrderKeys.map(key => get(ref(database, `orders/${key}`)));
        const ordersSnapshots = await Promise.all(ordersPromises);
        const orders = ordersSnapshots
            .filter(snapshot => snapshot.exists())
            .map(snapshot => ({ key: snapshot.key, ...snapshot.val() }));

        if (orders.length > 0) {
            orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)); // Sort by orderDate
            displayOrderCards(orders);
            orderListContainer.style.display = 'block';
        } else {
            orderListContainer.innerHTML = '<p class="text-center text-gray-600">আপনি কোনো প্রোডাক্ট এখনো অর্ডার করেননি।</p>';
            orderListContainer.style.display = 'block';
        }
    } catch (error) {
        console.error("Error loading local orders:", error);
        showToast("আপনার অর্ডারগুলো লোড করতে সমস্যা হয়েছে!", 'error');
    }
}

function displayOrderCards(orders) {
    const container = document.getElementById('orderList');
    if (!container) return;
    container.innerHTML = `
        <div class="grid grid-cols-3 md:grid-cols-4 gap-4 font-bold p-4 bg-gray-200 rounded-t-lg text-sm">
            <div>অর্ডার আইডি</div>
            <div class="hidden md:block">অর্ডারের তারিখ</div>
            <div>মোট মূল্য</div>
            <div>স্ট্যাটাস</div>
        </div>
    `;
    orders.forEach(order => {
        const statusText = getStatusText(order.status);
        const statusColor = getStatusColor(order.status);
        const card = document.createElement('div');
        card.className = 'grid grid-cols-3 md:grid-cols-4 gap-4 p-4 border-b cursor-pointer hover:bg-gray-50 text-sm';
        card.innerHTML = `
            <div>${order.orderId || 'N/A'}</div>
            <div class="hidden md:block">${order.orderDate ? new Date(order.orderDate).toLocaleString('bn-BD') : 'N/A'}</div>
            <div>${order.totalAmount || 0} টাকা</div>
            <div><span class="px-2 py-1 text-xs font-semibold rounded-full ${statusColor.bg} ${statusColor.text}">${statusText}</span></div>
        `;
        card.onclick = () => showOrderDetailsModal(order);
        container.appendChild(card);
    });
}

function showOrderDetailsModal(order) {
    hideSocialMediaIcons();
    const modal = document.getElementById('orderModal');
    const modalContent = document.getElementById('modalContent');
    if(!modal || !modalContent) return;

    let detailsHTML = `
        <p><strong>অর্ডার আইডি:</strong> ${order.orderId || 'N/A'}</p>
        <p><strong>তারিখ:</strong> ${order.orderDate ? new Date(order.orderDate).toLocaleString('bn-BD') : 'N/A'}</p>
        <p><strong>নাম:</strong> ${order.customerName || 'N/A'}</p>
        <p><strong>ফোন:</strong> ${order.phoneNumber || 'N/A'}</p>
        <p><strong>ঠিকানা:</strong> ${order.address || 'N/A'}</p>
        <hr class="my-4">
        <h4 class="text-lg font-semibold mb-2">প্রোডাক্টস</h4>
    `;

    order.cartItems.forEach(item => {
        detailsHTML += `
            <div class="flex items-center mb-2">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded mr-4">
                <div>
                    <p>${item.name}</p>
                    <p>${item.quantity} x ${item.price} টাকা</p>
                </div>
            </div>
        `;
    });

    detailsHTML += `
        <hr class="my-4">
        <p><strong>মোট মূল্য:</strong> ${order.totalAmount || 0} টাকা</p>
        <p><strong>স্ট্যাটাস:</strong> ${getStatusText(order.status)}</p>
    `;

    modalContent.innerHTML = detailsHTML;
    modal.style.display = 'flex';

    document.getElementById('modalClose').onclick = () => { modal.style.display = 'none'; };
    modal.onclick = (e) => { if(e.target === modal) modal.style.display = 'none'; };
}
function getStatusText(status) { const statuses = { processing: 'প্রসেসিং', confirmed: 'কনফার্মড', packaging: 'প্যাকেজিং', shipped: 'ডেলিভারি হয়েছে', delivered: 'সম্পন্ন হয়েছে', failed: 'ব্যর্থ', cancelled: 'ক্যানসেলড' }; return statuses[status] || 'অজানা'; }
function getStatusColor(status) { const colors = { processing: { text: 'text-yellow-800', bg: 'bg-yellow-100' }, confirmed: { text: 'text-blue-800', bg: 'bg-blue-100' }, packaging: { text: 'text-purple-800', bg: 'bg-purple-100' }, shipped: { text: 'text-cyan-800', bg: 'bg-cyan-100' }, delivered: { text: 'text-green-800', bg: 'bg-green-100' }, failed: { text: 'text-red-800', bg: 'bg-red-100' }, cancelled: { text: 'text-gray-800', bg: 'bg-gray-200' } }; return colors[status] || colors.cancelled; }
function calculateProgress(status) { const progressMap = { processing: 0, confirmed: 25, packaging: 50, shipped: 75, delivered: 100, failed: 0, cancelled: 0 }; return progressMap[status] ?? 0; }
function getStatusIcon(status) { const icons = { processing: 'fas fa-cogs', confirmed: 'fas fa-check', packaging: 'fas fa-box-open', shipped: 'fas fa-truck', delivered: 'fas fa-home', failed: 'fas fa-times-circle', cancelled: 'fas fa-ban' }; return `<i class="${icons[status] || 'fas fa-question'}"></i>`; }
function getStepIcon(status) { const icons = { processing: '1', confirmed: '2', 'packaging': '3', shipped: '4', delivered: '<i class="fas fa-check"></i>' }; return icons[status]; }


// =================================================================
// SECTION: ORDER LIST PAGE LOGIC
// =================================================================

function getStatusInfo(status) {
    const statuses = {
        'Pending': { text: 'পেন্ডিং', color: 'bg-yellow-500' },
        'Confirmed': { text: 'কনফার্মড', color: 'bg-blue-500' },
        'Processing': { text: 'প্রসেসিং', color: 'bg-indigo-500' },
        'Shipped': { text: 'শিপড', color: 'bg-purple-500' },
        'Delivered': { text: 'ডেলিভারি সম্পন্ন', color: 'bg-green-500' },
        'Cancelled': { text: 'বাতিল হয়েছে', color: 'bg-red-500' },
        'Returned': { text: 'ফেরত এসেছে', color: 'bg-gray-500' }
    };
    return statuses[status] || { text: 'অজানা', color: 'bg-gray-400' };
}

function displayOrder(order) {
    const container = document.getElementById('orderListContainer');
    if (!container) return; // Added check for container
    const statusInfo = getStatusInfo(order.orderStatus);

    const orderCard = document.createElement('div');
    orderCard.className = 'p-4 hover:bg-gray-50 transition-colors cursor-pointer';
    orderCard.onclick = () => {
        window.location.href = `order-track.html?orderId=${order.orderId}`;
    };

    let itemsSummary = order.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
    if (itemsSummary.length > 100) {
        itemsSummary = itemsSummary.substring(0, 100) + '...';
    }

    orderCard.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <p class="font-bold text-lg text-gray-800">অর্ডার #${order.orderId}</p>
                <p class="text-sm text-gray-500">${new Date(order.timestamp).toLocaleString('bn-BD')}</p>
                <p class="mt-2 text-gray-700">${itemsSummary}</p>
            </div>
            <div class="text-right">
                <p class="font-semibold text-lg">${order.totalAmount.toLocaleString('bn-BD', { style: 'currency', currency: 'BDT' })}</p>
                <span class="mt-1 inline-block text-white text-xs font-semibold px-2 py-1 rounded-full ${statusInfo.color}">${statusInfo.text}</span>
            </div>
        </div>
    `;
    container.appendChild(orderCard);
}

async function loadMyOrders() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noOrdersMessage = document.getElementById('noOrdersMessage');
    const orderListContainer = document.getElementById('orderListContainer');

    if (!orderListContainer) return Promise.resolve(); // Resolve immediately if element not found

    if (loadingIndicator) loadingIndicator.classList.remove('hidden');
    if (noOrdersMessage) noOrdersMessage.classList.add('hidden');
    if (orderListContainer) orderListContainer.innerHTML = ''; // Clear previous orders

    const myOrderIds = JSON.parse(localStorage.getItem('myOrders')) || [];

    if (myOrderIds.length === 0) {
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (noOrdersMessage) noOrdersMessage.classList.remove('hidden');
        return Promise.resolve(); // Resolve immediately if no orders
    }

    try {
        const orderPromises = myOrderIds.map(orderId => {
            const orderRef = ref(database, 'orders/' + orderId);
            return get(orderRef);
        });

        const orderSnapshots = await Promise.all(orderPromises);

        const orders = orderSnapshots
            .map(snapshot => snapshot.exists() ? { key: snapshot.key, ...snapshot.val() } : null)
            .filter(order => order !== null)
            .sort((a, b) => b.timestamp - a.timestamp);

        if (orders.length > 0) {
            orders.forEach(order => displayOrder(order));
        } else {
            if (noOrdersMessage) noOrdersMessage.classList.remove('hidden');
        }

    } catch (error) {
        console.error("Error fetching orders:", error);
        if (orderListContainer) orderListContainer.innerHTML = '<p class="text-red-500 text-center py-8">অর্ডার লোড করার সময় একটি ত্রুটি হয়েছে।</p>';
    } finally {
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
    }
    return Promise.resolve(); // Ensure a promise is always returned and resolved
}

// =================================================================
// SECTION: GLOBAL FUNCTION ASSIGNMENT (গুরুত্বপূর্ণ)
// =================================================================

Object.assign(window, {
    // Global Utilities
    showToast,
    sendTelegramNotification, // <--- আপনার নতুন ফাংশন
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
    initializeProductDetailPage, initializeOrderTrackPage,
    // Order List
    loadMyOrders, // Added loadMyOrders to global scope
});

async function loadHeaderAndSetup() {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch('header.html');
            if (!response.ok) {
                console.error('Failed to load header.html');
                reject('Failed to load header.html');
                return;
            }
            const headerHTML = await response.text();
            const headerEl = document.getElementById('header');
            if (headerEl) {
                headerEl.innerHTML = headerHTML;
            }

            // Wait for initial auth state to be determined and login button updated
            await new Promise(authResolve => {
                const unsubscribe = onAuthStateChanged(auth, user => {
                    updateLoginButton(user);
                    unsubscribe(); // Unsubscribe after the first state change
                    authResolve();
                });
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
            resolve();

        } catch (error) {
            console.error('Error loading or setting up header:', error);
            reject(error);
        }
    });
}

function setupSocialMediaButtons() {
    const shareButton = document.getElementById('socialShareButton');
    const socialIcons = document.getElementById('socialIcons');
    if (!shareButton || !socialIcons) return;

    shareButton.addEventListener('click', (event) => {
        event.stopPropagation();
        socialIcons.classList.toggle('hidden');
        // Ensure it's shown if it was hidden by another event
        if (!socialIcons.classList.contains('hidden')) {
            socialIcons.classList.remove('hidden');
        }
    });

    // Hide if clicked outside
    document.addEventListener('click', (event) => {
        if (!socialIcons.contains(event.target) && !shareButton.contains(event.target)) {
            socialIcons.classList.add('hidden');
        }
    });
}

async function loadFooter() {
    try {
        const response = await fetch('footer.html');
        if (!response.ok) {
            console.error('Failed to load footer.html');
            return;
        }
        const footerHTML = await response.text();
        const footerEl = document.getElementById('footer');
        if (footerEl) {
            footerEl.innerHTML = footerHTML;
        }
    } catch (error) {
        console.error('Error loading footer:', error);
    }
}


// =================================================================
// SECTION: MAIN INITIALIZATION
// =================================================================

function hideGlobalLoadingSpinner() {
    const spinner = document.getElementById('global-loading-spinner');
    if (spinner) {
        spinner.classList.add('hidden');
    }
}

function main() {
    let pageLoadPromises = [];
    // Load header and footer and set up their functionality
    pageLoadPromises.push(loadHeaderAndSetup());
    pageLoadPromises.push(loadFooter());

    // সব প্রোডাক্ট লোড করা
    const productsRef = ref(database, "products/");
    const productsLoadPromise = new Promise(resolve => {
        onValue(productsRef, snapshot => {
            if (snapshot.exists()) {
                products = Object.keys(snapshot.val()).map(key => ({ id: key, ...snapshot.val()[key] }));

                const currentPage = window.location.pathname;
                if (currentPage.endsWith('/') || currentPage.endsWith('index.html')) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const filterCategory = urlParams.get('filter');
                    if (filterCategory) {
                        filterProducts(filterCategory);
                    } else {
                        displayProductsAsCards(products);
                    }
                    const sliderProducts = products.filter(p => p.isInSlider).sort((a, b) => (a.sliderOrder || 99) - (b.sliderOrder || 99));
                    initializeProductSlider(sliderProducts);
                }
            }
            resolve(); // Resolve after products are loaded and displayed
        }, { onlyOnce: true }); // Listen only once
    });
    pageLoadPromises.push(productsLoadPromise);

    // পেজ অনুযায়ী নির্দিষ্ট ফাংশন চালানো
    const currentPage = window.location.pathname;
    if (currentPage.endsWith('/') || currentPage.endsWith('index.html')) {
        showLoadingSpinner(); // This is for productList spinner, not global
        pageLoadPromises.push(displayEvents()); // Assuming displayEvents returns a promise or is async
    }
    if (currentPage.includes('product-detail.html')) {
        pageLoadPromises.push(initializeProductDetailPage());
    }
    if (currentPage.includes('order-track.html')) {
        pageLoadPromises.push(initializeOrderTrackPage());
    }
    if (currentPage.includes('order-form.html')) {
        pageLoadPromises.push(initializeOrderFormPage());
    }

    if (currentPage.includes('order-list.html')) {
        pageLoadPromises.push(loadMyOrders());
    }

    Promise.all(pageLoadPromises).then(() => {
        hideGlobalLoadingSpinner();
    }).catch(error => {
        console.error("Error during page initialization:", error);
        hideGlobalLoadingSpinner(); // Hide even if there's an error
    });

}


// =================================================================
// SECTION: ORDER FORM PAGE LOGIC (MERGED FROM order-form-logic.js)
// =================================================================

let checkoutCart = [];
let isBuyNowMode = false;

async function initializeOrderFormPage() {
    return new Promise(resolve => {
        const checkoutForm = document.getElementById('checkoutForm');
        if (!checkoutForm) {
            resolve();
            return;
        }

        // Show form and hide loader
        document.getElementById('loadingIndicator')?.classList.add('hidden');
        checkoutForm.classList.remove('hidden');

        // Initialize checkout process
        onAuthStateChanged(auth, async user => {
            if (user) {
                window.currentUserId = user.uid;
                window.currentUserEmail = user.email;
                await fetchUserProfile(user.uid);
                initializeCheckout(user);
            } else {
                window.currentUserId = 'GUEST_' + Date.now();
                window.currentUserEmail = 'guest@checkout.com';
                initializeCheckout(null);
                handleDeliveryLocationChange();
            }
            resolve(); // Resolve the promise after auth state is handled and checkout initialized
        });

        // Add event listeners
        document.querySelectorAll('input[name="deliveryLocation"]').forEach(radio => {
            radio.addEventListener('change', handleDeliveryLocationChange);
        });
        document.getElementById('deliveryPaymentMethod')?.addEventListener('change', handleDeliveryPaymentMethodChange);
        checkoutForm.addEventListener('submit', window.placeOrder);
    });
}

function calculateAndDisplayPrices(items) {
    const subTotalDisplay = document.getElementById('subTotalDisplay');
    const deliveryFeeDisplay = document.getElementById('deliveryFeeDisplay');
    const totalAmountDisplay = document.getElementById('totalAmountDisplay');
    if (!subTotalDisplay || !deliveryFeeDisplay || !totalAmountDisplay) return;

    let subTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryLocation = document.querySelector('input[name="deliveryLocation"]:checked')?.value || 'insideDhaka';
    const deliveryFee = deliveryLocation === 'outsideDhaka' ? 160 : 70;
    const totalAmount = subTotal + deliveryFee;

    subTotalDisplay.textContent = `${subTotal.toLocaleString('bn-BD', { minimumFractionDigits: 2 })} টাকা`;
    deliveryFeeDisplay.textContent = `${deliveryFee.toLocaleString('bn-BD', { minimumFractionDigits: 2 })} টাকা`;
    totalAmountDisplay.textContent = `${totalAmount.toLocaleString('bn-BD', { minimumFractionDigits: 2 })} টাকা`;

    return { subTotal, deliveryFee, totalAmount };
}

function renderCheckoutItems(items) {
    const checkoutItemsContainer = document.getElementById('checkoutItems');
    const submitButton = document.getElementById('submitButton');
    if (!checkoutItemsContainer || !submitButton) return;

    checkoutItemsContainer.innerHTML = '';
    if (!items || items.length === 0) {
        checkoutItemsContainer.innerHTML = '<p class="text-center text-red-500 font-medium p-4">আপনার কার্ট খালি। অর্ডার করার জন্য প্রোডাক্ট যোগ করুন।</p>';
        submitButton.disabled = true;
        return;
    }
    items.forEach(item => {
        // Add checks for item properties
        const itemId = item.id || 'N/A';
        const itemName = item.name || 'Unknown Product';
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = item.quantity || 1;
        const itemImage = item.image || 'placeholder.jpg';
        const itemVariant = item.variant || '';

        const itemHtml = `
            <div class="checkout-item">
                <img src="${itemImage}" alt="${itemName}" loading="lazy">
                <div class="checkout-item-details">
                    <p class="item-name">${itemName} ${itemVariant ? `(${itemVariant})` : ''}</p>
                    <p>${itemQuantity} x ${itemPrice.toFixed(2)} টাকা = ${(itemPrice * itemQuantity).toFixed(2)} টাকা</p>
                </div>
            </div>
        `;
        checkoutItemsContainer.innerHTML += itemHtml;
    });
    submitButton.disabled = false;
}

function initializeCheckout(user) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlCartData = urlParams.get('cart');

    if (urlCartData) {
        // If cart data is passed via URL (from Buy Now), use it.
        isBuyNowMode = true;
        try {
            checkoutCart = JSON.parse(decodeURIComponent(urlCartData));
        } catch (e) {
            console.error("Could not parse cart data from URL", e);
            showToast("কার্ট ডেটা লোড করতে সমস্যা হয়েছে।", "error");
            checkoutCart = [];
        }
    } else {
        // Otherwise, load the cart from the main localStorage item.
        isBuyNowMode = false;
        try {
            checkoutCart = JSON.parse(localStorage.getItem('anyBeautyCart') || '[]');
        } catch (e) {
            console.error("Could not parse cart data from localStorage", e);
            showToast("কার্ট ডেটা লোড করতে সমস্যা হয়েছে।", "error");
            checkoutCart = [];
        }
    }

    renderCheckoutItems(checkoutCart);
    calculateAndDisplayPrices(checkoutCart);
}

async function fetchUserProfile(uid) {
    const profileRef = ref(database, `users/${uid}/profile`);
    try {
        const profile = (await get(profileRef)).val();
        if (profile) {
             document.getElementById('customerName').value = profile.name || '';
             document.getElementById('phoneNumber').value = profile.phone || '';
             document.getElementById('address').value = profile.address || '';
        }
    } catch (err) {
        console.error("Error fetching user profile:", err);
    }
    handleDeliveryLocationChange();
}

function handleDeliveryLocationChange() {
    const location = document.querySelector('input[name="deliveryLocation"]:checked').value;
    const outsideGroup = document.getElementById('outsideDhakaLocationGroup');
    const notice = document.getElementById('paymentNotice');
    const deliveryPaymentGroup = document.getElementById('deliveryPaymentGroup');

    const isOutsideDhaka = location === 'outsideDhaka';

    outsideGroup.classList.toggle('hidden', !isOutsideDhaka);
    notice.style.display = isOutsideDhaka ? 'block' : 'none';
    deliveryPaymentGroup.classList.toggle('hidden', !isOutsideDhaka);

    document.getElementById('outsideDhakaLocation').required = isOutsideDhaka;
    document.getElementById('deliveryPaymentMethod').required = isOutsideDhaka;

    handleDeliveryPaymentMethodChange();
    calculateAndDisplayPrices(checkoutCart);
}

function handleDeliveryPaymentMethodChange() {
    const location = document.querySelector('input[name="deliveryLocation"]:checked').value;
    const method = document.getElementById('deliveryPaymentMethod').value;
    const paymentNumberGroup = document.getElementById('paymentNumberGroup');
    const transactionIdGroup = document.getElementById('transactionIdGroup');

    const shouldShow = location === 'outsideDhaka' && method;
    paymentNumberGroup.classList.toggle('hidden', !shouldShow);
    transactionIdGroup.classList.toggle('hidden', !shouldShow);
    document.getElementById('paymentNumber').required = shouldShow;
    document.getElementById('transactionId').required = shouldShow;
}

window.placeOrder = async function(event) {
    if (event) event.preventDefault();

    const submitButton = document.getElementById('submitButton');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>অর্ডার কনফার্ম হচ্ছে...';

    try {
        console.log("Starting order placement...");
        const itemsToOrder = isBuyNowMode ? checkoutCart : (JSON.parse(localStorage.getItem('anyBeautyCart')) || []);
        
        if (itemsToOrder.length === 0) {
            throw new Error("আপনার কার্ট খালি। অর্ডার করা সম্ভব নয়।");
        }

        // Form data collection
        const customerName = document.getElementById('customerName').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const address = document.getElementById('address').value.trim();
        const deliveryLocationElement = document.querySelector('input[name="deliveryLocation"]:checked');
        const deliveryLocation = deliveryLocationElement ? deliveryLocationElement.value : 'insideDhaka';
        const deliveryNote = document.getElementById('deliveryNote').value.trim();
        
        // Price calculation
        const deliveryFee = deliveryLocation === 'insideDhaka' ? 70 : 160;
        const subTotal = itemsToOrder.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
        const totalAmount = subTotal + deliveryFee;
        
        // Generate Custom Order ID
        const today = new Date();
        const year = today.getFullYear().toString().slice(-2);
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1);
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${day}`;
        
        const counterRef = ref(database, `counters/${dateString}`);
        console.log("Running transaction on counter:", `counters/${dateString}`);
        
        await runTransaction(counterRef, (currentData) => {
            if (currentData === null) {
                return 1;
            }
            else {
                return currentData + 1;
            }
        }).then(async (result) => {
            if (result.committed) {
                const orderNumber = result.snapshot.val();
                console.log("Transaction committed. New order number:", orderNumber);
                const paddedOrderNumber = String(orderNumber).padStart(3, '0');
                const orderId = `${year}${day}${month}${paddedOrderNumber}`;

                const orderData = {
                    customerName,
                    phoneNumber,
                    address,
                    deliveryLocation: deliveryLocation === 'insideDhaka' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে',
                    deliveryFee,
                    subTotal: totalAmount.toFixed(2),
                    totalAmount: totalAmount.toFixed(2),
                    cartItems: itemsToOrder,
                    orderDate: new Date().toISOString(),
                    status: 'Pending',
                    userId: getUserId(),
                    deliveryNote: deliveryNote || 'N/A',
                    outsideDhakaLocation: deliveryLocation === 'outsideDhaka' ? document.getElementById('outsideDhakaLocation').value : 'N/A',
                    paymentNumber: deliveryLocation === 'outsideDhaka' ? document.getElementById('paymentNumber').value : 'N/A',
                    transactionId: deliveryLocation === 'outsideDhaka' ? document.getElementById('transactionId').value : 'N/A',
                    orderId: orderId
                };

                console.log("Saving order with ID:", orderId);
                const newOrderRef = ref(database, 'orders/' + orderId);
                await set(newOrderRef, orderData);
                console.log("Order saved successfully.");

                // Save order ID to localStorage
                const myOrders = JSON.parse(localStorage.getItem('myOrders')) || [];
                myOrders.push(orderId);
                localStorage.setItem('myOrders', JSON.stringify(myOrders));

                // Clear cart
                localStorage.removeItem('anyBeautyCart');
                window.cart = [];
                saveCart();

                // Send notification
                await sendTelegramNotification({ ...orderData, orderId });

                // Redirect with success message
                showToast(`অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে! অর্ডার আইডি: ${orderId}`, "success");
                window.location.href = `order-track.html?orderId=${orderId}`;
            } else {
                console.error("Transaction not committed.");
                throw new Error("Failed to commit transaction for order counter.");
            }
        }).catch(error => {
            console.error("Error during transaction:", error);
            throw error; // Re-throw to be caught by the outer catch block
        });

    } catch (error) {
        console.error("Error placing order:", error); 
        showToast(`অর্ডার সাবমিট করতে সমস্যা হয়েছে: ${error.message || 'Unknown Error'}। অনুগ্রহ করে আবার চেষ্টা করুন।`, "error");
        submitButton.disabled = false;
        submitButton.innerHTML = 'অর্ডার কনফার্ম করুন';
    }
}

document.addEventListener('DOMContentLoaded', main);

// গ্লোবাল ক্লিক হ্যান্ডলার
document.addEventListener("click", (event) => {
    if (event.target.id === 'sidebarOverlay') closeSidebar();
    if (!event.target.closest('#cartSidebar') && !event.target.closest('#cartButton')) closeCartSidebar();
    if (!event.target.closest('#desktopSubMenuBar') && !event.target.closest('button[onclick="toggleSubMenuDesktop()"]')) document.getElementById('desktopSubMenuBar')?.classList.add('hidden');
    
    const searchResultsMobile = document.getElementById('searchResults');
    const searchResultsDesktop = document.getElementById('searchResultsDesktop');
    if (searchResultsMobile && !searchResultsMobile.contains(event.target) && !event.target.closest('#searchInput')) { searchResultsMobile.classList.add('hidden'); }
    if (searchResultsDesktop && !searchResultsDesktop.contains(event.target) && !event.target.closest('#searchInputDesktop')) { searchResultsDesktop.classList.add('hidden'); }
});
