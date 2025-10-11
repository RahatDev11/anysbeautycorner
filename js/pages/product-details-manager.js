// =================================================================
// SECTION: PRODUCT DETAIL PAGE LOGIC
// =================================================================

import { database, ref, get } from '../modules/firebase-config.js';
import { showToast, hideSocialMediaIcons } from '../modules/ui-utilities.js';
import { cart, saveCart } from '../modules/cart-manager.js';
import { openCartSidebar } from '../modules/ui-utilities.js';

let currentProduct = null;
let allProducts = [];
let relatedProductQuantities = {}; // রিলেটেড প্রোডাক্টের কোয়েন্টিটি স্টোর করবে

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

    if (product.stockStatus === 'in_stock') {
        extraHTML += `
            <div class="flex items-center space-x-3 my-4">
                <span class="text-gray-700 font-medium">পরিমাণ:</span>
                <div class="flex items-center border border-gray-300 rounded-lg">
                    <button onclick="window.changeDetailQuantity(-1)" class="bg-gray-200 px-4 py-2 font-bold hover:bg-gray-300 transition-colors">-</button>
                    <input type="number" id="quantityDetailInput" value="1" min="1" class="w-16 text-center border-0 focus:ring-0">
                    <button onclick="window.changeDetailQuantity(1)" class="bg-gray-200 px-4 py-2 font-bold hover:bg-gray-300 transition-colors">+</button>
                </div>
            </div>`;
    }
    detailsExtraContainer.innerHTML = extraHTML;

    const actionButtonsContainer = document.getElementById('actionButtons');
    const whatsappMessage = `প্রোডাক্ট: ${product.name}\nদাম: ${product.price} টাকা\nআমি এই প্রোডাক্টটি কিনতে আগ্রহী।`;
    const whatsappLink = `https://wa.me/8801931866636?text=${encodeURIComponent(whatsappMessage)}`;
    
    let buttonsHTML = `
        <button id="buyNowDetailBtn" onclick="window.buyNowWithQuantity()" class="w-full sm:w-auto bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold flex items-center justify-center transition-colors">
            <i class="fas fa-credit-card mr-2"></i>এখনই কিনুন
        </button>
        <button id="addToCartDetailBtn" onclick="window.addToCartWithQuantity()" class="w-full sm:w-auto bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 font-semibold flex items-center justify-center transition-colors">
            <i class="fas fa-cart-plus mr-2"></i>কার্টে যোগ করুন
        </button>
        <a href="${whatsappLink}" target="_blank" class="w-full sm:w-auto bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold inline-flex items-center justify-center transition-colors">
            <i class="fab fa-whatsapp mr-2"></i>WhatsApp এ অর্ডার
        </a>`;
    
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

// রিলেটেড প্রোডাক্ট ডিসপ্লে ফাংশন - হোম পেজ স্টাইল
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

    // রিলেটেড প্রোডাক্টের কোয়েন্টিটি ইনিশিয়ালাইজ করুন
    relatedProducts.forEach(product => {
        relatedProductQuantities[product.id] = 1;
    });

    relatedContainer.innerHTML = relatedProducts.map(product => {
        const cartItem = cart.find(item => item.id === product.id);
        const currentQuantity = cartItem ? cartItem.quantity : 0;
        
        return `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 product-card">
            <div class="relative">
                <img src="${product.image ? product.image.split(',')[0].trim() : 'https://via.placeholder.com/300x300.png?text=No+Image'}" 
                     alt="${product.name}" 
                     class="w-full h-48 object-cover cursor-pointer"
                     onclick="window.showProductDetail('${product.id}')">
                ${product.stockStatus !== 'in_stock' ? 
                    '<div class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">স্টকে নেই</div>' : ''}
                
                <!-- কার্ট কোয়েন্টিটি ব্যাজ -->
                ${currentQuantity > 0 ? `
                    <div class="absolute top-2 left-2 bg-lipstick text-white px-2 py-1 rounded-full text-xs font-semibold">
                        ${currentQuantity} টি
                    </div>
                ` : ''}
            </div>
            
            <div class="p-3">
                <h3 class="font-semibold text-gray-800 mb-1 truncate cursor-pointer" onclick="window.showProductDetail('${product.id}')">
                    ${product.name}
                </h3>
                <p class="text-lipstick font-bold text-lg mb-3">${product.price} টাকা</p>
                
                ${product.stockStatus === 'in_stock' ? `
                    <!-- কোয়েন্টিটি কন্ট্রোল - হোম পেজ স্টাইল -->
                    <div class="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                        <button onclick="window.changeRelatedProductQuantity('${product.id}', -1)" 
                                class="w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors font-bold text-gray-600">
                            -
                        </button>
                        
                        <div class="flex flex-col items-center">
                            <span class="text-sm text-gray-600">কার্টে আছে</span>
                            <span id="relatedQuantity-${product.id}" class="text-lg font-bold text-lipstick">
                                ${currentQuantity} টি
                            </span>
                        </div>
                        
                        <button onclick="window.changeRelatedProductQuantity('${product.id}', 1)" 
                                class="w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors font-bold text-gray-600">
                            +
                        </button>
                    </div>
                    
                    <!-- WhatsApp বাটন -->
                    <a href="https://wa.me/8801931866636?text=${encodeURIComponent(`প্রোডাক্ট: ${product.name}\nদাম: ${product.price} টাকা\nপরিমাণ: ${currentQuantity} টি\nআমি এই প্রোডাক্টটি কিনতে আগ্রহী।`)}" 
                       target="_blank" 
                       class="w-full mt-2 bg-green-500 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-green-600 transition-colors flex items-center justify-center">
                        <i class="fab fa-whatsapp mr-1"></i> WhatsApp এ অর্ডার
                    </a>
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

// রিলেটেড প্রোডাক্টের কোয়েন্টিটি পরিবর্তন - অটো কার্টে যোগ
function changeRelatedProductQuantity(productId, amount) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || product.stockStatus !== 'in_stock') return;
    
    const cartItem = cart.find(item => item.id === productId);
    let currentQuantity = cartItem ? cartItem.quantity : 0;
    
    const newQuantity = Math.max(0, currentQuantity + amount);
    
    if (newQuantity === 0) {
        // কার্ট থেকে রিমুভ করুন
        const itemIndex = cart.findIndex(item => item.id === productId);
        if (itemIndex > -1) {
            cart.splice(itemIndex, 1);
            showToast(`${product.name} কার্ট থেকে সরানো হয়েছে`, "info");
        }
    } else {
        // কার্টে আপডেট বা যোগ করুন
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
    updateRelatedProductDisplay(productId, newQuantity);
    
    // কার্ট সাইডবার খুলুন যদি যোগ করা হয়
    if (amount > 0 && newQuantity > 0) {
        openCartSidebar();
    }
}

// রিলেটেড প্রোডাক্ট ডিসপ্লে আপডেট
function updateRelatedProductDisplay(productId, quantity) {
    const quantityElement = document.getElementById(`relatedQuantity-${productId}`);
    if (quantityElement) {
        quantityElement.textContent = `${quantity} টি`;
    }
    
    // কার্ট আইকন আপডেট করুন (যদি প্রয়োজন হয়)
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function changeDetailQuantity(amount) { 
    const input = document.getElementById('quantityDetailInput'); 
    if(!input) return; 
    let currentValue = parseInt(input.value); 
    if (isNaN(currentValue)) currentValue = 1; 
    const newValue = currentValue + amount; 
    if (newValue >= 1) input.value = newValue; 
}

function addToCartWithQuantity() { 
    if (!currentProduct) return;
    const quantityInput = document.getElementById('quantityDetailInput');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    const cartItem = cart.find(item => item.id === currentProduct.id); 
    if (cartItem) { 
        cartItem.quantity += quantity; 
    } else { 
        cart.push({ 
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            image: currentProduct.image ? currentProduct.image.split(',')[0].trim() : '',
            quantity: quantity 
        }); 
    } 
    saveCart(); 
    showToast(`${quantity}টি ${currentProduct.name} কার্টে যোগ করা হয়েছে`, "success"); 
    openCartSidebar(); 
}

function buyNowWithQuantity() {
    if (!currentProduct) return;
    const quantityInput = document.getElementById('quantityDetailInput');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

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

// গ্লোবাল ফাংশন হিসেবে অ্যাসাইন করুন
Object.assign(window, {
    changeRelatedProductQuantity,
    showProductDetail: (productId) => {
        window.location.href = `product-detail.html?id=${productId}`;
    }
});

export {
    initializeProductDetailPage,
    changeDetailQuantity,
    addToCartWithQuantity,
    buyNowWithQuantity,
    changeRelatedProductQuantity
};