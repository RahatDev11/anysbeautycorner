// =================================================================
// SECTION: PRODUCT DETAIL PAGE LOGIC
// =================================================================

import { database, ref, get } from '../modules/firebase-config.js';
import { showToast, hideSocialMediaIcons } from '../modules/ui-utilities.js';
import { cart, saveCart, openCartSidebar } from '../modules/cart-manager.js';

let currentProduct = null; // To hold the product details for the current page
let globalProducts = []; // Global products array

// Set products function for other modules to update
function setProducts(prods) {
    globalProducts = prods;
}

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
        const productRef = ref(database, 'products/' + productId);
        const snapshot = await get(productRef);

        if (snapshot.exists()) {
            currentProduct = { id: productId, ...snapshot.val() };
            displayProductDetails(currentProduct);
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            productContent.classList.remove('hidden');
            
            // Display related products
            displayRelatedProducts(currentProduct.id);
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
        extraHTML += `<div class="flex items-center space-x-3 my-4">
            <span class="text-gray-700 font-medium">পরিমাণ:</span>
            <div class="flex items-center border border-gray-300 rounded-lg">
                <button onclick="window.changeDetailQuantity(-1)" class="bg-gray-200 px-4 py-2 font-bold hover:bg-gray-300">-</button>
                <input type="number" id="quantityDetailInput" value="1" min="1" class="w-16 text-center border-0 focus:ring-0">
                <button onclick="window.changeDetailQuantity(1)" class="bg-gray-200 px-4 py-2 font-bold hover:bg-gray-300">+</button>
            </div>
        </div>`;
    }
    detailsExtraContainer.innerHTML = extraHTML;

    const actionButtonsContainer = document.getElementById('actionButtons');
    const whatsappMessage = `প্রোডাক্ট: ${product.name}\nদাম: ${product.price} টাকা\nআমি এই প্রোডাক্টটি কিনতে আগ্রহী।`;
    const whatsappLink = `https://wa.me/8801931866636?text=${encodeURIComponent(whatsappMessage)}`;
    
    let buttonsHTML = `
        <button id="buyNowDetailBtn" onclick="window.buyNowWithQuantity()" class="w-full sm:w-auto bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold flex items-center justify-center">
            <i class="fas fa-credit-card mr-2"></i>এখনই কিনুন
        </button>
        <button id="addToCartDetailBtn" onclick="window.addToCartWithQuantity()" class="w-full sm:w-auto bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 font-semibold flex items-center justify-center">
            <i class="fas fa-cart-plus mr-2"></i>কার্টে যোগ করুন
        </button>
        <a href="${whatsappLink}" target="_blank" class="w-full sm:w-auto bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold inline-flex items-center justify-center">
            <i class="fab fa-whatsapp mr-2"></i>WhatsApp এ অর্ডার
        </a>`;
    
    actionButtonsContainer.innerHTML = buttonsHTML;
    
    if (product.stockStatus !== 'in_stock') {
        const buyNowBtn = document.getElementById('buyNowDetailBtn');
        const addToCartBtn = document.getElementById('addToCartDetailBtn');
        if (buyNowBtn) {
            buyNowBtn.disabled = true;
            buyNowBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        if (addToCartBtn) {
            addToCartBtn.disabled = true;
            addToCartBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    const images = product.image ? product.image.split(',').map(img => img.trim()).filter(Boolean) : [];
    setupImageGallery(images);
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
    
    if (quantity < 1) {
        showToast('অনুগ্রহ করে সঠিক পরিমাণ নির্বাচন করুন!', 'error');
        return;
    }
    
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

    if (quantity < 1) {
        showToast('অনুগ্রহ করে সঠিক পরিমাণ নির্বাচন করুন!', 'error');
        return;
    }

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

// =================================================================
// SECTION: RELATED PRODUCTS LOGIC
// =================================================================

function displayRelatedProducts(currentProductId) {
    const relatedProductsSection = document.getElementById('relatedProductsSection');
    const relatedProductsContainer = document.getElementById('relatedProductsContainer');
    
    if (!relatedProductsSection || !relatedProductsContainer) return;

    // Filter products from same category (excluding current product)
    const relatedProducts = globalProducts.filter(product => 
        product && 
        product.id !== currentProductId && 
        product.category === currentProduct.category
    ).slice(0, 4); // Show maximum 4 products

    if (relatedProducts.length === 0) {
        relatedProductsSection.classList.add('hidden');
        return;
    }

    // Generate HTML for related products
    let relatedHTML = relatedProducts.map(product => {
        const cartItem = cart.find(item => item.id === product.id);
        const cartControlsHTML = cartItem
            ? `<div class="w-full bg-white rounded-lg font-semibold flex items-center h-10 justify-around">
                 <button onclick="window.updateQuantity('${product.id}', -1)" class="px-3 text-xl font-bold text-lipstick-dark hover:text-lipstick">-</button>
                 <span class="text-lg text-lipstick-dark">${cartItem.quantity}</span>
                 <button onclick="window.updateQuantity('${product.id}', 1)" class="px-3 text-xl font-bold text-lipstick-dark hover:text-lipstick">+</button>
               </div>`
            : `<button onclick="window.addToCart('${product.id}')" class="w-full bg-white rounded-lg font-semibold flex items-center h-10 justify-center text-sm text-lipstick-dark hover:bg-gray-100 transition-colors">Add To Cart</button>`;

        const imageUrl = product.image ? product.image.split(",")[0].trim() : "https://via.placeholder.com/150";

        return `
            <div class="bg-white rounded-xl shadow overflow-hidden flex flex-col h-full">
                <img src="${imageUrl}" alt="${product.name}" class="w-full h-36 object-cover cursor-pointer" onclick="window.showProductDetail('${product.id}')">
                <div class="p-3 text-white flex flex-col flex-grow" style="background-color: #F4A7B9;">
                    <div class="flex-grow">
                        <h3 class="font-semibold text-lg mb-1 cursor-pointer hover:underline" onclick="window.showProductDetail('${product.id}')">${product.name}</h3>
                    </div>
                    <div>
                        <p class="text-xl font-bold mt-3">${product.price} টাকা</p>
                        <div class="mt-4 space-y-2">
                            ${cartControlsHTML}
                            <button onclick="window.buyNow('${product.id}')" class="w-full border border-white text-white py-2 rounded-lg font-semibold text-sm hover:bg-white hover:text-lipstick-dark transition-colors">Buy Now</button>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');

    relatedProductsContainer.innerHTML = relatedHTML;
    relatedProductsSection.classList.remove('hidden');
}

// =================================================================
// SECTION: IMAGE GALLERY LOGIC
// =================================================================

let galleryImages = []; 
let currentImageModalIndex = 0;

function setupImageGallery(images) { 
    galleryImages = images; 
    const mainImage = document.getElementById('mainImage'); 
    const thumbnailContainer = document.getElementById('thumbnailContainer'); 
    thumbnailContainer.innerHTML = ''; 
    
    if (images.length > 0) { 
        mainImage.src = images[0]; 
        mainImage.alt = currentProduct?.name || 'Product Image';
        
        images.forEach((img, index) => { 
            const thumb = document.createElement('img'); 
            thumb.src = img; 
            thumb.alt = `Thumbnail ${index + 1}`;
            thumb.className = 'thumbnail cursor-pointer w-16 h-16 object-cover border-2 border-transparent rounded'; 
            if (index === 0) thumb.classList.add('active', 'border-lipstick'); 
            thumb.onclick = () => { 
                mainImage.src = img; 
                currentImageModalIndex = index; 
                document.querySelectorAll('.thumbnail').forEach(t => {
                    t.classList.remove('active', 'border-lipstick');
                }); 
                thumb.classList.add('active', 'border-lipstick'); 
            }; 
            thumbnailContainer.appendChild(thumb); 
        }); 
    } else { 
        mainImage.src = 'https://via.placeholder.com/500x400.png?text=No+Image'; 
        mainImage.alt = 'No Image Available';
    } 
    
    mainImage.addEventListener('click', openImageModal); 
}

function openImageModal() {
    hideSocialMediaIcons();
    if (galleryImages.length === 0) return;
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'flex';
        updateModalImage();
    }
}

function closeImageModal() { 
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none'; 
    }
}

function changeModalImage(direction) { 
    currentImageModalIndex = (currentImageModalIndex + direction + galleryImages.length) % galleryImages.length; 
    updateModalImage(); 
}

function updateModalImage() { 
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        modalImage.src = galleryImages[currentImageModalIndex]; 
    }
}

// Initialize modal event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalPrevBtn = document.getElementById('modalPrevBtn');
    const modalNextBtn = document.getElementById('modalNextBtn');
    
    if (modalCloseBtn) modalCloseBtn.onclick = closeImageModal;
    if (modalPrevBtn) modalPrevBtn.onclick = () => changeModalImage(-1);
    if (modalNextBtn) modalNextBtn.onclick = () => changeModalImage(1);
});

export {
    initializeProductDetailPage,
    changeDetailQuantity,
    addToCartWithQuantity,
    buyNowWithQuantity,
    displayRelatedProducts,
    setProducts
};