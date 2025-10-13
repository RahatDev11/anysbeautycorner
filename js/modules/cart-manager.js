// =================================================================
// SECTION: CART MANAGEMENT
// =================================================================

import { auth, database, ref, onValue, set } from './firebase-config.js';
import { showToast, hideSocialMediaIcons, openCartSidebar } from './ui-utilities.js';
import { getUserId } from './auth-manager.js';
// import { products, displayProductsAsCards } from './product-manager.js'; // Will be imported later

let cart = [];
let products = []; // Placeholder, will be properly managed later

function setProducts(prods) {
    products = prods;
}

function updateAllCartUIs() {
    updateCartSidebarUI();
    updateFloatingBarUI();
    // if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) {
    //     displayProductsAsCards(products); // This will be handled by home-manager
    // }
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
            itemEl.innerHTML = `<div class="flex items-center">
            <img src="${item.image ? item.image.split(',')[0].trim() : 'https://via.placeholder.com/40'}" class="w-10 h-10 object-cover rounded mr-3">
            <div class="flex-grow">
                <p class="font-semibold text-sm truncate max-w-[10rem]">${item.name}</p>
            <div class="flex items-center mr-3">
                <button onclick="window.updateQuantity('${item.id}', -1, event)" class="px-2 py-1 font-bold text-gray-600 hover:bg-gray-100 rounded-l-lg">-</button>
                <span class="px-2 text-sm">${item.quantity}</span>
                <button onclick="window.updateQuantity('${item.id}', 1, event)" class="px-2 py-1 font-bold text-gray-600 hover:bg-gray-100 rounded-r-lg">+</button>
                <p class="font-semibold text-sm ml-2">${item.price.toFixed(2)}৳</p>
            </div>
        </div>
    </div>
    <button onclick="window.removeFromCart('${item.id}', event)" class="text-red-500 hover:text-red-700 ml-auto flex-shrink-0"><i class="fas fa-trash-alt"></i></button>
</div>`;
            cartItemsEl.appendChild(itemEl);
        });
    } else {
        cartItemsEl.innerHTML = '<p class="text-center text-gray-500">আপনার কার্ট খালি।</p>';
    }
    if (totalItems > 0) {
        cartCountEl.textContent = totalItems;
        cartCountEl.classList.remove('hidden');
    } else {
        cartCountEl.classList.add('hidden');
    }
    if(totalPriceEl) totalPriceEl.textContent = `মোট মূল্য: ${totalPrice.toFixed(2)} টাকা`;
}

function updateFloatingBarUI() {
    const bar = document.getElementById("place-order-bar");
    if (!bar) return;
    if (cart.length === 0) { 
        bar.classList.add("hidden"); 
        return; 
    }
    bar.classList.remove("hidden");
    hideSocialMediaIcons(); // Hide social media icons when place order bar is visible
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPrice = cart.reduce((sum, item) => sum + parseFloat(item.price || 0) * (item.quantity || 0), 0);
    document.getElementById("bar-item-count").textContent = totalItems;
    document.getElementById("bar-total-price").textContent = totalPrice.toFixed(2);
}

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
    window.dispatchEvent(new CustomEvent('cartUpdated'));
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

function updateQuantity(productId, change, event) { // Added event parameter
    if (event) event.stopPropagation(); // Stop propagation
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += change;
        if (cartItem.quantity <= 0) {
            cart = cart.filter(item => item.id !== productId);
        }
        saveCart();
    }
};

function removeFromCart(productId, event) { // Added event parameter
    if (event) event.stopPropagation(); // Stop propagation
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

export {
    cart, // Export cart so other modules can access it
    setProducts,
    updateAllCartUIs,
    updateCartSidebarUI,
    updateFloatingBarUI,
    loadCart,
    saveCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    checkout,
    buyNow
};