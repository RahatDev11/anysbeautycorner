// =================================================================
// SECTION: PRODUCT DETAIL PAGE LOGIC
// =================================================================

import { database, ref, get } from '../modules/firebase-config.js';
import { showToast, hideSocialMediaIcons } from '../modules/ui-utilities.js';
import { cart, saveCart } from '../modules/cart-manager.js';
import { openCartSidebar } from '../modules/ui-utilities.js';

let currentProduct = null;
let allProducts = [];

async function initializeProductDetailPage() {
    const productContent = document.getElementById('productContent');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (!productContent) return Promise.resolve();

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        showToast('প্রোডাক্ট আইডি পাওয়া যায়নি!', 'error');
        if (loadingSpinner) loadingSpinner.innerHTML = '<p class="text-red-500">প্রোডাক্ট আইডি পাওয়া যায়নি।</p>';
        return Promise.resolve();
    }

    try {
        // সকল প্রোডাক্ট লোড করুন
        const productsRef = ref(database, 'products/');
        const productsSnapshot = await get(productsRef);
        
        if (productsSnapshot.exists()) {
            allProducts = Object.keys(productsSnapshot.val()).map(key => ({ 
                id: key, 
                ...productsSnapshot.val()[key] 
            }));
        }

        const productRef = ref(database, 'products/' + productId);
        const snapshot = await get(productRef);

        if (snapshot.exists()) {
            currentProduct = { id: productId, ...snapshot.val() };
            displayProductDetails(currentProduct);
            displayRelatedProducts(currentProduct);
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            productContent.classList.remove('hidden');
        } else {
            showToast('প্রোডাক্ট পাওয়া যায়নি!', 'error');
            if (loadingSpinner) loadingSpinner.innerHTML = '<p class="text-red-500">দুঃখিত, এই প্রোডাক্টটি পাওয়া যায়নি।</p>';
        }
    } catch (error) {
        showToast('প্রোডাক্ট লোড করতে সমস্যা হয়েছে!', 'error');
        if (loadingSpinner) loadingSpinner.innerHTML = `<p class="text-red-500">ত্রুটি: ${error.message}</p>`;
    }
    return Promise.resolve();
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
    detailsExtraContainer.innerHTML = extraHTML;

    // বাটনগুলো ডেসক্রিপশনের আগে দেখান
    updateProductButtons(product);
    
    const images = product.image ? product.image.split(',').map(img => img.trim()).filter(Boolean) : [];
    setupImageGallery(images);
}

function updateProductButtons(product) {
    const actionButtonsContainer = document.getElementById('actionButtons');
    const cartItem = cart.find(item => item.id === product.id);
    const currentQuantity = cartItem ? cartItem.quantity : 0;
    
    let buttonsHTML = '';
    
    if (product.stockStatus === 'in_stock') {
        if (currentQuantity > 0) {
            // কার্টে থাকলে প্লাস/মাইনাস বাটন দেখাবে
            buttonsHTML = `
                <div class="mb-6">
                    <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-3">
                        <button onclick="changeDetailCartQuantity('${product.id}', -1)" 
                                class="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors font-bold text-gray-600 text-lg">
                            -
                        </button>
                        
                        <div class="flex flex-col items-center">
                            <span class="text-sm text-gray-600">কার্টে আছে</span>
                            <span id="detailCartQuantity-${product.id}" class="text-lg font-bold text-lipstick">
                                ${currentQuantity} টি
                            </span>
                        </div>
                        
                        <button onclick="changeDetailCartQuantity('${product.id}', 1)" 
                                class="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors font-bold text-gray-600 text-lg">
                            +
                        </button>
                    </div>
                    
                    <button onclick="buyNowFromDetail()" 
                            class="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold flex items-center justify-center transition-colors">
                        <i class="fas fa-credit-card mr-2"></i>এখনই কিনুন
                    </button>
                </div>`;
        } else {
            // কার্টে না থাকলে Add To Cart এবং Buy Now বাটন দেখাবে
            buttonsHTML = `
                <div class="flex flex-col sm:flex-row gap-3 mb-6">
                    <button onclick="addToCartFromDetail()" 
                            class="w-full sm:w-auto bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 font-semibold flex items-center justify-center transition-colors">
                        <i class="fas fa-cart-plus mr-2"></i>কার্টে যোগ করুন
                    </button>
                    <button onclick="buyNowFromDetail()" 
                            class="w-full sm:w-auto bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold flex items-center justify-center transition-colors">
                        <i class="fas fa-credit-card mr-2"></i>এখনই কিনুন
                    </button>
                </div>`;
        }
    } else {
        buttonsHTML = `
            <div class="text-center py-4 mb-6">
                <span class="text-red-500 font-semibold text-lg">স্টকে নেই</span>
            </div>`;
    }
    
    actionButtonsContainer.innerHTML = buttonsHTML;
}

function displayRelatedProducts(currentProduct) {
    const relatedSection = document.getElementById('relatedProductsSection');
    const relatedContainer = document.getElementById('relatedProductsContainer');
    
    if (!relatedSection || !relatedContainer) return;

    // বর্তমান প্রোডাক্ট বাদ দিয়ে একই ক্যাটাগরির প্রোডাক্ট ফিল্টার করুন
    const relatedProducts = allProducts.filter(product => 
        product.id !== currentProduct.id && 
        product.category === currentProduct.category
    ).slice(0, 8);

    if (relatedProducts.length === 0) {
        relatedSection.classList.add('hidden');
        return;
    }

    relatedContainer.innerHTML = relatedProducts.map(product => {
        const cartItem = cart.find(item => item.id === product.id);
        const currentQuantity = cartItem ? cartItem.quantity : 0;
        
        return `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div class="relative">
                <img src="${product.image ? product.image.split(',')[0].trim() : 'https://via.placeholder.com/300x300.png?text=No+Image'}" 
                     alt="${product.name}" 
                     class="w-full h-48 object-cover cursor-pointer"
                     onclick="showRelatedProductDetail('${product.id}')">
                ${product.stockStatus !== 'in_stock' ? 
                    '<div class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">স্টকে নেই</div>' : ''}
                
                ${currentQuantity > 0 ? `
                    <div class="absolute top-2 left-2 bg-lipstick text-white px-2 py-1 rounded-full text-xs font-semibold">
                        ${currentQuantity} টি
                    </div>
                ` : ''}
            </div>
            
            <div class="p-3">
                <h3 class="font-semibold text-gray-800 mb-1 truncate cursor-pointer" onclick="showRelatedProductDetail('${product.id}')">
                    ${product.name}
                </h3>
                <p class="text-lipstick font-bold text-lg mb-3">${product.price} টাকা</p>
                
                ${product.stockStatus === 'in_stock' ? `
                    ${currentQuantity > 0 ? `
                        <div class="flex items-center justify-between bg-gray-50 rounded-lg p-2 mb-2">
                            <button onclick="changeRelatedProductQuantity('${product.id}', -1)" 
                                    class="w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors font-bold text-gray-600">
                                -
                            </button>
                            
                            <div class="flex flex-col items-center">
                                <span class="text-xs text-gray-600">কার্টে আছে</span>
                                <span id="relatedQuantity-${product.id}" class="text-sm font-bold text-lipstick">
                                    ${currentQuantity} টি
                                </span>
                            </div>
                            
                            <button onclick="changeRelatedProductQuantity('${product.id}', 1)" 
                                    class="w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors font-bold text-gray-600">
                                +
                            </button>
                        </div>
                        
                        <button onclick="buyNowRelatedProduct('${product.id}')" 
                                class="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center">
                            <i class="fas fa-credit-card mr-1"></i> এখনই কিনুন
                        </button>
                    ` : `
                        <div class="flex flex-col gap-2">
                            <button onclick="addRelatedToCart('${product.id}')" 
                                    class="w-full bg-teal-500 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center">
                                <i class="fas fa-cart-plus mr-1"></i> কার্টে যোগ
                            </button>
                            <button onclick="buyNowRelatedProduct('${product.id}')" 
                                    class="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center">
                                <i class="fas fa-credit-card mr-1"></i> এখনই কিনুন
                            </button>
                        </div>
                    `}
                ` : `
                    <div class="text-center py-3">
                        <span class="text-red-500 font-semibold">স্টকে নেই</span>
                    </div>
                `}
            </div>
        </div>`;
    }).join('');

    relatedSection.classList.remove('hidden');
}

// প্রোডাক্ট ডিটেইল থেকে কার্টে যোগ
function addToCartFromDetail() {
    if (!currentProduct) return;
    
    const cartItem = cart.find(item => item.id === currentProduct.id);
    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            image: currentProduct.image ? currentProduct.image.split(',')[0].trim() : '',
            quantity: 1
        });
    }
    
    saveCart();
    showToast(`${currentProduct.name} কার্টে যোগ করা হয়েছে`, "success");
    updateProductButtons(currentProduct);
    openCartSidebar();
}

// প্রোডাক্ট ডিটেইল থেকে এখনই কিনুন
function buyNowFromDetail() {
    if (!currentProduct) return;
    
    const cartItem = cart.find(item => item.id === currentProduct.id);
    const quantity = cartItem ? cartItem.quantity : 1;
    
    const tempCart = [{
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        image: currentProduct.image ? currentProduct.image.split(',')[0].trim() : '',
        quantity: quantity
    }];
    const cartData = encodeURIComponent(JSON.stringify(tempCart));
    window.location.href = `order-form.html?cart=${cartData}`;
}

// রিলেটেড প্রোডাক্ট কার্টে যোগ
function addRelatedToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || product.stockStatus !== 'in_stock') return;
    
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += 1;
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
    displayRelatedProducts(currentProduct);
    openCartSidebar();
}

// রিলেটেড প্রোডাক্টের কোয়েন্টিটি পরিবর্তন
function changeRelatedProductQuantity(productId, amount) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || product.stockStatus !== 'in_stock') return;
    
    const cartItem = cart.find(item => item.id === productId);
    let currentQuantity = cartItem ? cartItem.quantity : 0;
    
    const newQuantity = Math.max(0, currentQuantity + amount);
    
    if (newQuantity === 0) {
        const itemIndex = cart.findIndex(item => item.id === productId);
        if (itemIndex > -1) {
            cart.splice(itemIndex, 1);
            showToast(`${product.name} কার্ট থেকে সরানো হয়েছে`, "info");
        }
    } else {
        if (cartItem) {
            cartItem.quantity = newQuantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image ? product.image.split(',')[0].trim() : '',
                quantity: newQuantity
            });
        }
        
        if (amount > 0) {
            showToast(`${product.name} কার্টে যোগ করা হয়েছে`, "success");
        } else {
            showToast(`${product.name} কার্ট থেকে কমানো হয়েছে`, "info");
        }
    }
    
    saveCart();
    displayRelatedProducts(currentProduct);
}

// মেইন প্রোডাক্টের কার্ট কোয়েন্টিটি পরিবর্তন
function changeDetailCartQuantity(productId, amount) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || product.stockStatus !== 'in_stock') return;
    
    const cartItem = cart.find(item => item.id === productId);
    let currentQuantity = cartItem ? cartItem.quantity : 0;
    
    const newQuantity = Math.max(0, currentQuantity + amount);
    
    if (newQuantity === 0) {
        const itemIndex = cart.findIndex(item => item.id === productId);
        if (itemIndex > -1) {
            cart.splice(itemIndex, 1);
            showToast(`${product.name} কার্ট থেকে সরানো হয়েছে`, "info");
        }
    } else {
        if (cartItem) {
            cartItem.quantity = newQuantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image ? product.image.split(',')[0].trim() : '',
                quantity: newQuantity
            });
        }
        
        if (amount > 0) {
            showToast(`${product.name} কার্টে যোগ করা হয়েছে`, "success");
        } else {
            showToast(`${product.name} কার্ট থেকে কমানো হয়েছে`, "info");
        }
    }
    
    saveCart();
    updateProductButtons(currentProduct);
}

// রিলেটেড প্রোডাক্টের জন্য Buy Now
function buyNowRelatedProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const cartItem = cart.find(item => item.id === productId);
    const quantity = cartItem ? cartItem.quantity : 1;
    
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

// রিলেটেড প্রোডাক্ট ডিটেইল দেখান
function showRelatedProductDetail(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

let galleryImages = []; 
let currentImageModalIndex = 0;

function setupImageGallery(images) { 
    galleryImages = images; 
    const mainImage = document.getElementById('mainImage'); 
    const thumbnailContainer = document.getElementById('thumbnailContainer'); 
    thumbnailContainer.innerHTML = ''; 
    
    if (images.length > 0) { 
        mainImage.src = images[0]; 
        images.forEach((img, index) => { 
            const thumb = document.createElement('img'); 
            thumb.src = img; 
            thumb.className = 'thumbnail'; 
            if (index === 0) thumb.classList.add('active'); 
            thumb.onclick = () => { 
                mainImage.src = img; 
                currentImageModalIndex = index; 
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active')); 
                thumb.classList.add('active'); 
            }; 
            thumbnailContainer.appendChild(thumb); 
        }); 
    } else { 
        mainImage.src = 'https://via.placeholder.com/500x400.png?text=No+Image'; 
    } 
    mainImage.addEventListener('click', openImageModal); 
}

function openImageModal() {
    hideSocialMediaIcons();
    if (galleryImages.length === 0) return;
    const modal = document.getElementById('imageModal');
    modal.style.display = 'flex';
    updateModalImage();
    document.getElementById('modalCloseBtn').onclick = closeImageModal;
    document.getElementById('modalPrevBtn').onclick = () => changeModalImage(-1);
    document.getElementById('modalNextBtn').onclick = () => changeModalImage(1);
}

function closeImageModal() { 
    document.getElementById('imageModal').style.display = 'none'; 
}

function changeModalImage(direction) { 
    currentImageModalIndex = (currentImageModalIndex + direction + galleryImages.length) % galleryImages.length; 
    updateModalImage(); 
}

function updateModalImage() { 
    document.getElementById('modalImage').src = galleryImages[currentImageModalIndex]; 
}

export {
    initializeProductDetailPage,
    addToCartFromDetail,
    buyNowFromDetail,
    addRelatedToCart,
    changeRelatedProductQuantity,
    changeDetailCartQuantity,
    buyNowRelatedProduct,
    showRelatedProductDetail
};