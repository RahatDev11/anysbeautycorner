// =================================================================
// SECTION: FIREBASE INITIALIZATION & CONFIGURATION
// =================================================================

const firebaseConfig = {
    apiKey: "AIzaSyCVSzQS1c7H4BLhsDF_fW8wnqUN4B35LPA",
    authDomain: "nahid-6714.firebaseapp.com",
    databaseURL: "https://nahid-6714-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "nahid-6714",
    storageBucket: "nahid-6714.appspot.com",
    messagingSenderId: "505741217147",
    appId: "1:505741217147:web:25ed4e9f0d00e3c4d381de",
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, get, set, query, orderByChild, equalTo, runTransaction } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

// Global Variables
let products = [];
let cart = [];

// Firebase Initialization
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();

// =================================================================
// SECTION: UTILITY & HELPER FUNCTIONS
// =================================================================

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `fixed bottom-24 right-4 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50`;
    toast.innerHTML = `<i class="${type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'} mr-2"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function sendTelegramNotification(orderData) {
    try {
        await fetch('/.netlify/functions/telegram_notifier', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
    } catch (error) {
        console.error("Telegram notification fetch error:", error);
    }
}

// =================================================================
// SECTION: CART MANAGEMENT
// =================================================================

function updateAllCartUIs() {
    updateCartSidebarUI();
    updateFloatingBarUI();
    const currentPage = window.location.pathname;
    if (currentPage.endsWith('/') || currentPage.endsWith('index.html')) {
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
            cartItemsEl.innerHTML += `<div class="flex items-center justify-between p-2 border-b text-black"><div class="flex items-center"><img src="${item.image ? item.image.split(',')[0].trim() : 'https://via.placeholder.com/40'}" class="w-10 h-10 object-cover rounded mr-3"><div><p class="font-semibold text-sm">${item.name}</p><p class="text-xs text-gray-600">${item.quantity} x ${item.price}৳</p></div></div><div class="flex items-center"><p class="font-semibold mr-3">${itemTotal.toFixed(2)}৳</p><button onclick="window.removeFromCart('${item.id}')" class="text-red-500 hover:text-red-700"><i class="fas fa-trash-alt"></i></button></div></div>`;
        });
    } else {
        cartItemsEl.innerHTML = '<p class="text-center text-gray-500">আপনার কার্ট খালি।</p>';
    }
    if (cartCountEl) cartCountEl.textContent = totalItems;
    if(totalPriceEl) totalPriceEl.textContent = `মোট মূল্য: ${totalPrice.toFixed(2)} টাকা`;
}

function updateFloatingBarUI() {
    const bar = document.getElementById("place-order-bar");
    if (!bar) return;
    bar.classList.toggle("hidden", cart.length === 0);
    if (cart.length > 0) {
        if(document.getElementById("bar-item-count")) document.getElementById("bar-item-count").textContent = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        if(document.getElementById("bar-total-price")) document.getElementById("bar-total-price").textContent = cart.reduce((sum, item) => sum + parseFloat(item.price || 0) * (item.quantity || 0), 0).toFixed(2);
    }
}

async function loadCart() {
    if (auth.currentUser) {
        const snapshot = await get(ref(database, `carts/${auth.currentUser.uid}`));
        cart = snapshot.val() || [];
    } else {
        cart = JSON.parse(localStorage.getItem("anyBeautyCart")) || [];
    }
    updateAllCartUIs();
}

function saveCart() {
    if (auth.currentUser) {
        set(ref(database, `carts/${auth.currentUser.uid}`), cart);
    } else {
        localStorage.setItem("anyBeautyCart", JSON.stringify(cart));
    }
    updateAllCartUIs();
}

// =================================================================
// SECTION: AUTHENTICATION & UI (ASSIGNED TO WINDOW)
// =================================================================

window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) cartItem.quantity++;
    else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image ? product.image.split(',')[0].trim() : '', quantity: 1 });
    saveCart();
    showToast(`${product.name} কার্টে যোগ করা হয়েছে`, "success");
};

window.updateQuantity = function(productId, change) {
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += change;
        if (cartItem.quantity <= 0) cart = cart.filter(item => item.id !== productId);
        saveCart();
    }
};

window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
};

window.checkout = function() {
    if (cart.length > 0) window.location.href = 'order-form.html';
    else showToast("আপনার কার্ট খালি!", "error");
};

window.buyNow = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const quantity = cart.find(item => item.id === productId)?.quantity || 1;
    const tempCart = [{ id: product.id, name: product.name, price: product.price, image: product.image ? product.image.split(',')[0].trim() : '', quantity }];
    window.location.href = `order-form.html?cart=${encodeURIComponent(JSON.stringify(tempCart))}`;
};

window.loginWithGmail = () => signInWithPopup(auth, provider).then(r => saveUserToFirebase(r.user)).catch(e => console.error("Login Error:", e.message));

window.confirmLogout = () => { if (confirm("আপনি কি লগআউট করতে চান?")) signOut(auth).then(() => showToast("সফলভাবে লগআউট হয়েছেন।")); }

function saveUserToFirebase(user) {
    const userRef = ref(database, `users/${user.uid}`);
    get(userRef).then(s => { if (!s.exists()) set(userRef, { name: user.displayName, email: user.email, createdAt: new Date().toISOString() }); });
}

window.showProductDetail = (id) => window.location.href = `product-detail.html?id=${id}`;
window.filterProducts = (category) => {
    displayProductsAsCards(category === 'all' ? products : products.filter(p => p.category === category));
    closeSidebar();
    document.getElementById('desktopSubMenuBar')?.classList.add('hidden');
    document.getElementById('productList')?.scrollIntoView({ behavior: 'smooth' });
};

window.openSidebar = () => { document.getElementById('sidebarOverlay')?.classList.remove('hidden'); document.getElementById('sidebar')?.classList.remove('-translate-x-full'); }
window.closeSidebar = () => { document.getElementById('sidebarOverlay')?.classList.add('hidden'); document.getElementById('sidebar')?.classList.add('-translate-x-full'); }
window.toggleSubMenuMobile = (event) => { event.stopPropagation(); document.getElementById('subMenuMobile')?.classList.toggle('hidden'); document.getElementById('arrowIcon')?.classList.toggle('rotate-180'); }
window.handleSubMenuItemClick = (category) => { if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) { filterProducts(category); } else { window.location.href = `index.html?filter=${category}`; } closeSidebar(); }
window.toggleSubMenuDesktop = () => document.getElementById('desktopSubMenuBar')?.classList.toggle('hidden');
window.openCartSidebar = () => { document.getElementById('cartSidebar')?.classList.remove('translate-x-full'); document.getElementById('cartOverlay')?.classList.remove('hidden'); document.body.classList.add('overflow-hidden'); }
window.closeCartSidebar = () => { document.getElementById('cartSidebar')?.classList.add('translate-x-full'); document.getElementById('cartOverlay')?.classList.add('hidden'); document.body.classList.remove('overflow-hidden'); }
window.toggleSocialIcons = () => document.getElementById('socialIcons')?.classList.toggle('hidden');
window.searchProducts = (inputId, resultId) => {
    const query = document.getElementById(inputId).value.toLowerCase().trim();
    const filtered = query ? products.filter(p => p.name.toLowerCase().includes(query) || p.tags?.toLowerCase().includes(query)) : [];
    const container = document.getElementById(resultId);
    if (!container) return;
    container.innerHTML = filtered.slice(0, 5).map(p => `<a href="product-detail.html?id=${p.id}" class="flex items-center p-2 hover:bg-gray-100 text-gray-800 border-b"><img src="${p.image ? p.image.split(',')[0].trim() : 'https://via.placeholder.com/40'}" class="w-8 h-8 object-cover rounded mr-2"><span class="text-sm">${p.name}</span><span class="ml-auto text-xs text-red-500">${p.price}৳</span></a>`).join('');
    container.classList.toggle('hidden', filtered.length === 0);
};

// =================================================================
// SECTION: PAGE SPECIFIC LOGIC
// =================================================================

function displayProductsAsCards(productsToDisplay) {
    const productList = document.getElementById("productList");
    if (!productList) return;
    productList.innerHTML = productsToDisplay.map(p => {
        const cartItem = cart.find(item => item.id === p.id);
        const cartControls = cartItem ? `<div class="w-full bg-white rounded-lg font-semibold flex items-center h-10 justify-around"><button onclick="window.updateQuantity('${p.id}', -1)" class="px-3 text-xl">-</button><span>${cartItem.quantity}</span><button onclick="window.updateQuantity('${p.id}', 1)" class="px-3 text-xl">+</button></div>` : `<button onclick="window.addToCart('${p.id}')" class="w-full bg-white rounded-lg font-semibold h-10">Add To Cart</button>`;
        return `<div class="bg-white rounded-xl shadow overflow-hidden flex flex-col"><img src="${p.image ? p.image.split(",")[0].trim() : "https://via.placeholder.com/150"}" class="w-full h-36 object-cover cursor-pointer" onclick="window.showProductDetail('${p.id}')"><div class="p-3 text-white flex flex-col flex-grow" style="background-color: #F4A7B9;"><div class="flex-grow"><h3 class="font-semibold text-lg h-10 line-clamp-2" onclick="window.showProductDetail('${p.id}')">${p.name}</h3></div><div><p class="text-xl font-bold mt-2">${p.price} টাকা</p><div class="mt-4 space-y-2">${cartControls}<button onclick="window.buyNow('${p.id}')" class="w-full border border-white text-white py-2 rounded-lg">Buy Now</button></div></div></div></div>`;
    }).join('');
}

async function initializeProductSlider() {
    const wrapper = document.getElementById("new-product-slider-wrapper");
    if (!wrapper) return;
    const sliderProducts = products.filter(p => p.isInSlider).sort((a,b) => (a.sliderOrder||99)-(b.sliderOrder||99));
    wrapper.innerHTML = sliderProducts.map(p => `<div class="swiper-slide"><div class="relative w-full h-64 md:h-80"><img src="${p.image ? p.image.split(",")[0].trim() : "https://via.placeholder.com/400"}" class="w-full h-full object-cover"><div class="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6"><h3 class="text-white text-2xl font-bold">${p.name}</h3><p>${p.price} টাকা</p><button onclick="window.showProductDetail('${p.id}')" class="mt-4 bg-lipstick text-white py-2 px-4 rounded-lg">Shop Now</button></div></div></div>`).join('');
    if (typeof Swiper !== 'undefined') new Swiper(".new-product-slider", { loop: sliderProducts.length > 1, autoplay: { delay: 3000 }, pagination: { el: ".swiper-pagination", clickable: true }, effect: "fade" });
}

async function displayEvents() {
    const wrapper = document.getElementById('event-slider-wrapper');
    if (!wrapper) return;
    const snapshot = await get(ref(database, 'events'));
    const activeEvents = [];
    if (snapshot.exists()) snapshot.forEach(child => { if (child.val().isActive) activeEvents.push(child.val()); });
    wrapper.innerHTML = activeEvents.length > 0 ? activeEvents.map(event => `<div class="swiper-slide rounded-lg shadow-lg bg-cover bg-center" style="height: 160px; background-image: url(${event.imageUrl});"><div class="w-full h-full bg-black bg-opacity-50 rounded-lg p-6 flex flex-col justify-center items-center text-center text-white"><h3 class="text-xl font-bold">${event.title || ''}</h3><p class="mt-1">${event.description || ''}</p></div></div>`).join('') : '<div class="swiper-slide text-center p-6 bg-white rounded-lg">কোনো নতুন ইভেন্ট নেই।</div>';
    if (typeof Swiper !== 'undefined') {
        if(eventSlider) eventSlider.destroy(true, true);
        eventSlider = new Swiper('.event-slider', { loop: activeEvents.length > 1, autoplay: { delay: 3500 }, pagination: { el: '.swiper-pagination', clickable: true } });
    }
}

async function initializeProductDetailPage() {
    const productContent = document.getElementById('productContent');
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (!productContent) return;
    const productId = new URLSearchParams(window.location.search).get('id');
    if (!productId) { if (loadingSpinner) loadingSpinner.innerHTML = '<p class="text-red-500">প্রোডাক্ট আইডি পাওয়া যায়নি।</p>'; return; }
    try {
        const snapshot = await get(ref(database, 'products/' + productId));
        if (snapshot.exists()) {
            const product = { id: productId, ...snapshot.val() };
            displayProductDetails(product);
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            productContent.classList.remove('hidden');
        } else { if (loadingSpinner) loadingSpinner.innerHTML = '<p class="text-red-500">দুঃখিত, এই প্রোডাক্টটি পাওয়া যায়নি।</p>'; }
    } catch (error) { if (loadingSpinner) loadingSpinner.innerHTML = `<p class="text-red-500">ত্রুটি: ${error.message}</p>`; }
}

function displayProductDetails(product) {
    document.title = product.name || "প্রোডাক্ট বিস্তারিত";
    document.getElementById('productTitle').textContent = product.name;
    document.getElementById('productPrice').textContent = `দাম: ${product.price} টাকা`;
    document.getElementById('productDescription').textContent = product.description;
    const stockStatus = product.stockStatus === 'in_stock' ? '<span class="text-green-600 font-semibold">স্টকে আছে</span>' : '<span class="text-red-600 font-semibold">স্টকে নেই</span>';
    let extraHTML = `<p class="text-gray-700 mb-4 font-medium"><strong>স্টক:</strong> ${stockStatus}</p>`;
    if (product.stockStatus === 'in_stock') extraHTML += `<div class="flex items-center space-x-3 my-4"><span class="text-gray-700 font-medium">পরিমাণ:</span><div class="flex items-center border border-gray-300 rounded-lg"><button onclick="window.changeDetailQuantity(-1)" class="bg-gray-200 px-4 py-2 font-bold">-</button><input type="number" id="quantityDetailInput" value="1" min="1" class="w-16 text-center border-0 focus:ring-0"><button onclick="window.changeDetailQuantity(1)" class="bg-gray-200 px-4 py-2 font-bold">+</button></div></div>`;
    document.getElementById('productDetailsExtra').innerHTML = extraHTML;
    const whatsappLink = `https://wa.me/8801931866636?text=${encodeURIComponent(`প্রোডাক্ট: ${product.name}\nদাম: ${product.price} টাকা`)}`;
    document.getElementById('actionButtons').innerHTML = `<button id="buyNowDetailBtn" onclick="window.buyNowWithQuantity('${product.id}')" class="w-full sm:w-auto bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold flex items-center justify-center"><i class="fas fa-credit-card mr-2"></i>এখনই কিনুন</button><button id="addToCartDetailBtn" onclick="window.addToCartWithQuantity('${product.id}')" class="w-full sm:w-auto bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 font-semibold flex items-center justify-center"><i class="fas fa-cart-plus mr-2"></i>কার্টে যোগ করুন</button><a href="${whatsappLink}" target="_blank" class="w-full sm:w-auto bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold inline-flex items-center justify-center"><i class="fab fa-whatsapp mr-2"></i>WhatsApp এ অর্ডার</a>`;
    if (product.stockStatus !== 'in_stock') document.querySelectorAll('#actionButtons button').forEach(b => { b.disabled = true; b.classList.add('opacity-50', 'cursor-not-allowed'); });
    setupImageGallery(product.image ? product.image.split(',').map(img => img.trim()).filter(Boolean) : []);
}

window.changeDetailQuantity = (amount) => { const input = document.getElementById('quantityDetailInput'); if(input) { let newValue = parseInt(input.value) + amount; if (newValue >= 1) input.value = newValue; } };
window.addToCartWithQuantity = (productId) => { 
    const quantity = parseInt(document.getElementById('quantityDetailInput').value);
    const product = products.find(p => p.id === productId); 
    if (!product) return; 
    const cartItem = cart.find(item => item.id === productId); 
    if (cartItem) cartItem.quantity += quantity;
    else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image ? product.image.split(',')[0].trim() : '', quantity }); 
    saveCart(); 
    showToast(`${quantity}টি ${product.name} কার্টে যোগ করা হয়েছে`, "success"); 
    window.openCartSidebar(); 
};
window.buyNowWithQuantity = (productId) => {
    const quantity = parseInt(document.getElementById('quantityDetailInput').value);
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const tempCart = [{ id: product.id, name: product.name, price: product.price, image: product.image ? product.image.split(',')[0].trim() : '', quantity }];
    window.location.href = `order-form.html?cart=${encodeURIComponent(JSON.stringify(tempCart))}`;
};

let galleryImages = [], currentImageModalIndex = 0;
function setupImageGallery(images) { galleryImages = images; const mainImage = document.getElementById('mainImage'); const thumbnailContainer = document.getElementById('thumbnailContainer'); if (!mainImage || !thumbnailContainer) return; thumbnailContainer.innerHTML = ''; if (images.length > 0) { mainImage.src = images[0]; images.forEach((img, index) => { const thumb = document.createElement('img'); thumb.src = img; thumb.className = 'thumbnail'; if (index === 0) thumb.classList.add('active'); thumb.onclick = () => { mainImage.src = img; document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active')); thumb.classList.add('active'); }; thumbnailContainer.appendChild(thumb); }); } else { mainImage.src = 'https://via.placeholder.com/500x400.png?text=No+Image'; } mainImage.onclick = () => window.openImageModal(0); }
window.openImageModal = (index) => { if (galleryImages.length === 0) return; currentImageModalIndex = index; const modal = document.getElementById('imageModal'); if(modal) modal.style.display = 'flex'; updateModalImage(); }
window.closeImageModal = () => { const modal = document.getElementById('imageModal'); if(modal) modal.style.display = 'none'; }
window.changeModalImage = (direction) => { currentImageModalIndex = (currentImageModalIndex + direction + galleryImages.length) % galleryImages.length; updateModalImage(); }
function updateModalImage() { const modalImg = document.getElementById('modalImage'); if(modalImg) modalImg.src = galleryImages[currentImageModalIndex]; }

// --- ORDER FORM PAGE LOGIC ---
async function initializeOrderFormPage() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (!checkoutForm) return;

    let checkoutCart = [];
    let isBuyNowMode = false;
    
    const urlParams = new URLSearchParams(window.location.search);
    const urlCartData = urlParams.get('cart');
    isBuyNowMode = !!urlCartData;

    if (isBuyNowMode) {
        checkoutCart = JSON.parse(decodeURIComponent(urlCartData));
    } else {
        checkoutCart = cart; // Use the global cart variable, loaded by initializePage
    }
    
    const calculateAndDisplayPrices = () => {
        let subTotal = checkoutCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryLocation = document.querySelector('input[name="deliveryLocation"]:checked')?.value || 'insideDhaka';
        const deliveryFee = deliveryLocation === 'outsideDhaka' ? 160 : 70;
        document.getElementById('subTotalDisplay').textContent = `${subTotal.toFixed(2)} টাকা`;
        document.getElementById('deliveryFeeDisplay').textContent = `${deliveryFee.toFixed(2)} টাকা`;
        document.getElementById('totalAmountDisplay').textContent = `${(subTotal + deliveryFee).toFixed(2)} টাকা`;
    };

    const renderCheckoutItems = () => {
        const container = document.getElementById('checkoutItems');
        const submitBtn = document.getElementById('submitButton');
        container.innerHTML = '';
        if (!checkoutCart || checkoutCart.length === 0) {
            container.innerHTML = '<p class="text-center text-red-500 font-medium p-4">আপনার কার্ট খালি।</p>';
            submitBtn.disabled = true;
            return;
        }
        checkoutCart.forEach(item => {
            container.innerHTML += `<div class="flex items-center gap-4"><img src="${item.image || 'https://via.placeholder.com/64'}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md"><div class="flex-grow"><p class="font-semibold">${item.name}</p><p class="text-sm text-gray-600">${item.quantity} x ${parseFloat(item.price).toFixed(2)} টাকা</p></div><p class="font-semibold">${(item.price * item.quantity).toFixed(2)} টাকা</p></div>`;
        });
        submitBtn.disabled = false;
    };
    
    const fetchUserProfile = async (uid) => {
        const profile = (await get(ref(database, `users/${uid}/profile`))).val();
        if (profile) {
            document.getElementById('customerName').value = profile.name || '';
            document.getElementById('phoneNumber').value = profile.phone || '';
            document.getElementById('address').value = profile.address || '';
        }
    };
    
    const handleDeliveryLocationChange = () => {
        const isOutside = document.querySelector('input[name="deliveryLocation"]:checked').value === 'outsideDhaka';
        document.getElementById('outsideDhakaLocationGroup')?.classList.toggle('hidden', !isOutside);
        document.getElementById('paymentNotice')?.classList.toggle('hidden', !isOutside);
        document.getElementById('deliveryPaymentGroup')?.classList.toggle('hidden', !isOutside);
        if(document.getElementById('outsideDhakaLocation')) document.getElementById('outsideDhakaLocation').required = isOutside;
        if(document.getElementById('deliveryPaymentMethod')) document.getElementById('deliveryPaymentMethod').required = isOutside;
        handleDeliveryPaymentMethodChange();
        calculateAndDisplayPrices();
    };

    const handleDeliveryPaymentMethodChange = () => {
        const isOutside = document.querySelector('input[name="deliveryLocation"]:checked').value === 'outsideDhaka';
        const method = document.getElementById('deliveryPaymentMethod')?.value;
        const showFields = isOutside && !!method;
        document.getElementById('paymentNumberGroup')?.classList.toggle('hidden', !showFields);
        document.getElementById('transactionIdGroup')?.classList.toggle('hidden', !showFields);
        if(document.getElementById('paymentNumber')) document.getElementById('paymentNumber').required = showFields;
        if(document.getElementById('transactionId')) document.getElementById('transactionId').required = showFields;
    };

    const placeOrder = async (event) => {
        event.preventDefault();
        const submitButton = document.getElementById('submitButton');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>অর্ডার হচ্ছে...';
        try {
            if (checkoutCart.length === 0) throw new Error("কার্ট খালি।");
            const date = new Date();
            const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const counterRef = ref(database, `counters/${dateString}`);
            const result = await runTransaction(counterRef, (data) => (data || 0) + 1);
            if (!result.committed) throw new Error("Order ID তৈরি করা যায়নি।");
            const orderNumber = String(result.snapshot.val()).padStart(3, '0');
            const orderId = `${date.getFullYear().toString().slice(-2)}${String(date.getDate()).padStart(2, '0')}${date.getMonth() + 1}${orderNumber}`;
            
            const isOutside = document.querySelector('input[name="deliveryLocation"]:checked').value === 'outsideDhaka';
            const subTotal = checkoutCart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

            const orderData = {
                orderId,
                customerName: document.getElementById('customerName').value.trim(),
                phoneNumber: document.getElementById('phoneNumber').value.trim(),
                address: document.getElementById('address').value.trim(),
                deliveryLocation: isOutside ? 'ঢাকার বাইরে' : 'ঢাকার ভেতরে',
                deliveryFee: isOutside ? 160 : 70,
                totalAmount: (subTotal + (isOutside ? 160 : 70)).toFixed(2),
                cartItems: checkoutCart,
                orderDate: date.toISOString(),
                status: 'processing',
                userId: auth.currentUser ? auth.currentUser.uid : 'guest_user',
                userEmail: auth.currentUser ? auth.currentUser.email : 'guest_order',
                deliveryNote: document.getElementById('deliveryNote').value.trim() || 'N/A',
                outsideDhakaLocation: isOutside ? document.getElementById('outsideDhakaLocation').value : 'N/A',
                paymentNumber: isOutside && document.getElementById('paymentNumber') ? document.getElementById('paymentNumber').value : 'N/A',
                transactionId: isOutside && document.getElementById('transactionId') ? document.getElementById('transactionId').value : 'N/A',
            };
            await set(ref(database, 'orders/' + orderId), orderData);
            if (auth.currentUser) await set(ref(database, `users/${auth.currentUser.uid}/orderHistory/${orderId}`), true);
            else {
                const myOrders = JSON.parse(localStorage.getItem('myOrders')) || [];
                myOrders.push(orderId);
                localStorage.setItem('myOrders', JSON.stringify(myOrders));
            }
            if (!isBuyNowMode) { localStorage.removeItem('anyBeautyCart'); cart = []; saveCart(); }
            await sendTelegramNotification(orderData);
            window.location.href = `order-track.html?orderId=${orderId}`;
        } catch (error) {
            showToast(`অর্ডার করতে সমস্যা হয়েছে: ${error.message}`, "error");
            submitButton.disabled = false;
            submitButton.innerHTML = 'অর্ডার কনফার্ম করুন';
        }
    }

    // --- Initialization & Event Listeners for Order Form ---
    document.getElementById('loadingIndicator')?.style.display = 'none';
    checkoutForm.classList.remove('hidden');
    renderCheckoutItems();
    calculateAndDisplayPrices();
    if (auth.currentUser) fetchUserProfile(auth.currentUser.uid);
    checkoutForm.addEventListener('submit', placeOrder);
    document.querySelectorAll('input[name="deliveryLocation"]').forEach(radio => radio.addEventListener('change', handleDeliveryLocationChange));
    document.getElementById('deliveryPaymentMethod')?.addEventListener('change', handleDeliveryLocationChange);
    handleDeliveryLocationChange();
}


// =================================================================
// SECTION: MAIN INITIALIZATION & EVENT LISTENERS
// =================================================================
async function initializePage() {
    await loadHeaderAndSetup();
    const snapshot = await get(ref(database, "products/"));
    if (snapshot.exists()) products = Object.keys(snapshot.val()).map(key => ({ id: key, ...snapshot.val()[key] }));

    const currentPage = window.location.pathname;
    
    if (currentPage.endsWith('/') || currentPage.endsWith('index.html')) {
        await displayEvents();
        displayProductsAsCards(products);
        await initializeProductSlider();
    } else if (currentPage.includes('product-detail.html')) {
        await initializeProductDetailPage();
    } else if (currentPage.includes('order-form.html')) {
        await initializeOrderFormPage();
    }
    // `order-track.html` is self-contained and doesn't need to be called.
    
    await loadFooter();
    hideGlobalLoadingSpinner();
}

async function loadHeaderAndSetup() {
    try {
        const response = await fetch('header.html');
        document.getElementById('header').innerHTML = await response.text();
        await new Promise(resolve => {
            onAuthStateChanged(auth, async (user) => {
                updateLoginButton(user);
                await loadCart();
                resolve();
            });
        });
        
        // Setup event listeners for header elements after it's loaded
        document.getElementById('mobileMenuButton')?.addEventListener('click', window.openSidebar);
        document.getElementById('cartButton')?.addEventListener('click', window.openCartSidebar);
        document.getElementById('shareButton')?.addEventListener('click', window.toggleSocialIcons);

    } catch (error) { console.error('Header load failed:', error); }
}

async function loadFooter() {
    try {
        const response = await fetch('footer.html');
        document.getElementById('footer').innerHTML = await response.text();
    } catch (error) { console.error('Footer load failed:', error); }
}

function hideGlobalLoadingSpinner() {
    document.getElementById('global-loading-spinner')?.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', initializePage);
document.addEventListener("click", (event) => {
    if (event.target.id === 'sidebarOverlay') window.closeSidebar();
    if (event.target.id === 'cartOverlay') window.closeCartSidebar();
    const desktopSubMenu = document.getElementById('desktopSubMenuBar');
    if (desktopSubMenu && !desktopSubMenu.contains(event.target) && !event.target.closest('[onclick*="toggleSubMenuDesktop"]')) desktopSubMenu.classList.add('hidden');
    const searchResultsMobile = document.getElementById('searchResults');
    if (searchResultsMobile && !searchResultsMobile.contains(event.target) && !searchResultsMobile.closest('#searchInput')) searchResultsMobile.classList.add('hidden');
    const shareButton = document.getElementById('shareButton');
    const socialIcons = document.getElementById('socialIcons');
    if(shareButton && socialIcons && !socialIcons.contains(event.target) && !shareButton.contains(event.target)) socialIcons.classList.add('hidden');
});