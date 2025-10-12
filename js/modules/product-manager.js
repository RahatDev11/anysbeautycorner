// =================================================================
// SECTION: PRODUCT MANAGEMENT & DISPLAY
// =================================================================

import { database, ref, onValue } from './firebase-config.js';
import { cart, addToCart, updateQuantity, setProducts as setGlobalProducts } from './cart-manager.js';
import { closeSidebar } from './ui-utilities.js';

window.addEventListener('cartUpdated', () => {
    if (document.getElementById("productList")) {
        displayProductsAsCards(products);
    }
});

let products = [];

function setProducts(prods) {
    products = prods;
}

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
                    <div class="flex-grow"><h3 class="font-semibold text-lg mb-1 cursor-pointer" onclick="window.showProductDetail('${product.id}')">${product.name}</h3></div>
                    <div>
                        <p class="text-xl font-bold mt-3">${product.price} টাকা</p>
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
    displaySearchResults(filtered, 'searchResultsMobile');
};

function searchProductsDesktop() {
    const query = document.getElementById('searchInputDesktop').value.toLowerCase().trim();
    const filtered = query ? products.filter(p => p.name.toLowerCase().includes(query) || p.tags?.toLowerCase().includes(query)) : [];
    displaySearchResults(filtered, 'searchResultsDesktop');
};

function filterProducts(category) {
    console.log(`product-manager.js: Filtering products by category: ${category}`);
    const filtered = category === 'all' ? products : products.filter(p => p.category === category);
    displayProductsAsCards(filtered);
    closeSidebar();
    const desktopSubMenuBar = document.getElementById('desktopSubMenuBar');
    if (desktopSubMenuBar) desktopSubMenuBar.classList.add('hidden');
    document.getElementById('productList')?.scrollIntoView({ behavior: 'smooth' });
};

async function loadProducts() {
    return new Promise(resolve => {
        const productsRef = ref(database, "products/");
        onValue(productsRef, snapshot => {
            if (snapshot.exists()) {
                products = Object.keys(snapshot.val()).map(key => ({ id: key, ...snapshot.val()[key] }));
                setGlobalProducts(products); // Update products in cart-manager
            }
            resolve();
        }, { onlyOnce: true });
    });
}

export {
    products, // Export products array for other modules if needed
    setProducts,
    loadProducts,
    showProductDetail,
    showLoadingSpinner,
    displayProductsAsCards,
    initializeProductSlider,
    displaySearchResults,
    searchProductsMobile,
    searchProductsDesktop,
    filterProducts
};