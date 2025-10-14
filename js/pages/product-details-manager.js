// =================================================================
// SECTION: PRODUCT DETAIL PAGE LOGIC
// =================================================================

import { database, ref, get } from '../modules/firebase-config.js';
import { showToast, hideSocialMediaIcons } from '../modules/ui-utilities.js';
import { cart, saveCart } from '../modules/cart-manager.js';
import { openCartSidebar } from '../modules/ui-utilities.js';
import { displayProductsAsCards } from '../modules/product-manager.js';

let currentProduct = null; // To hold the product details for the current page

async function initializeProductDetailPage() {
    console.log('initializeProductDetailPage called.');
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
                        currentProduct = { id: productId, ...snapshot.val() }; // Set the current product
                        console.log('Current product category:', currentProduct.category);
                        displayProductDetails(currentProduct);
                        if (loadingSpinner) loadingSpinner.style.display = 'none';
                        productContent.classList.remove('hidden');
                        console.log('Calling loadRelatedProducts...');
                        loadRelatedProducts(currentProduct.category, currentProduct.id);
                    } else {
                        showToast('প্রোডাক্ট পাওয়া যায়নি!', 'error');
                        if (loadingSpinner) loadingSpinner.innerHTML = '<p class="text-red-500">দুঃখিত, এই প্রোডাক্টটি পাওয়া যায়নি।</p>';
                    }
                } catch (error) {
                    showToast('প্রোডাক্ট লোড করতে সমস্যা হয়েছে!', 'error');
                    if (loadingSpinner) loadingSpinner.innerHTML = `<p class="text-red-500">ত্রুটি: ${error.message}</p>`;
                }
                    return Promise.resolve(); // Ensure a promise is always returned and resolved
                }
                
                // Listen for cart updates to re-render related products
                window.addEventListener('cartUpdated', async () => {
                    const relatedProductsContainer = document.getElementById('relatedProductsContainer');
                    if (relatedProductsContainer && currentProduct) {
                        // Re-fetch and display related products to update cart controls
                        await loadRelatedProducts(currentProduct.category, currentProduct.id);
                    }
                });
                
                async function loadRelatedProducts(category, currentProductId) {                const relatedProductsSection = document.getElementById('relatedProductsSection');
                const relatedProductsContainer = document.getElementById('relatedProductsContainer');
                if (!relatedProductsSection || !relatedProductsContainer) return;
        
                console.log('loadRelatedProducts: category =', category, ', currentProductId =', currentProductId);
        
                try {
                    const productsRef = ref(database, 'products');
                    const snapshot = await get(productsRef);
        
                    if (snapshot.exists()) {
                        const allProducts = Object.keys(snapshot.val()).map(key => ({ id: key, ...snapshot.val()[key] }));
                        console.log('loadRelatedProducts: All products fetched:', allProducts);
        
                        const relatedProducts = allProducts.filter(p => 
                            p.category && category && // Ensure both categories exist
                            p.category.toLowerCase().trim() === category.toLowerCase().trim() && 
                            p.id !== currentProductId
                        );
                        console.log('loadRelatedProducts: Filtered related products:', relatedProducts);
        
                                                        if (relatedProducts.length > 0) {
        
                                                            displayProductsAsCards(relatedProducts, "relatedProductsContainer");
        
                                                            relatedProductsSection.classList.remove('hidden');
        
                                                        } else {
        
                                                            console.log('loadRelatedProducts: No related products found for category:', category);
        
                                                            relatedProductsContainer.innerHTML = '<p class="text-center text-gray-500 italic">এই ক্যাটাগরিতে অন্য কোনো প্রোডাক্ট খুঁজে পাওয়া যায়নি।</p>';
        
                                                            relatedProductsSection.classList.remove('hidden'); // Keep section visible to show the message
        
                                                        }
        
                                                    } else {
        
                                                        console.log('loadRelatedProducts: No products found in database.');
        
                                                        relatedProductsContainer.innerHTML = '<p class="text-center text-gray-500 italic">কোনো প্রোডাক্ট খুঁজে পাওয়া যায়নি।</p>';
        
                                                        relatedProductsSection.classList.remove('hidden');
        
                                                    }
        
                                                } catch (error) {
        
                                                    console.error("loadRelatedProducts: Error loading related products:", error);
        
                                                    relatedProductsContainer.innerHTML = '<p class="text-center text-red-500 italic">রিলেটেড প্রোডাক্ট লোড করতে সমস্যা হয়েছে।</p>';
        
                                                    relatedProductsSection.classList.remove('hidden');
        
                                                }
        
                                            }
        
                                        
        
                                            function displayProductDetails(product) {    document.title = product.name || "প্রোডাক্ট বিস্তারিত";
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
    
    let buttonsHTML = `<button id="buyNowDetailBtn" onclick="window.buyNowWithQuantity()" class="w-full sm:w-auto bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold flex items-center justify-center"><i class="fas fa-credit-card mr-2"></i>এখনই কিনুন</button><button id="addToCartDetailBtn" onclick="window.addToCartWithQuantity()" class="w-full sm:w-auto bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 font-semibold flex items-center justify-center"><i class="fas fa-cart-plus mr-2"></i>কার্টে যোগ করুন</button><a href="${whatsappLink}" target="_blank" class="w-full sm:w-auto bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold inline-flex items-center justify-center"><i class="fab fa-whatsapp mr-2"></i>WhatsApp এ অর্ডার</a>`;
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

let galleryImages = []; let currentImageModalIndex = 0;
function setupImageGallery(images) { galleryImages = images; const mainImage = document.getElementById('mainImage'); const thumbnailContainer = document.getElementById('thumbnailContainer'); thumbnailContainer.innerHTML = '';     if (images.length > 0) { mainImage.src = images[0]; images.forEach((img, index) => { const thumb = document.createElement('img'); thumb.src = img; thumb.className = 'thumbnail'; if (index === 0) thumb.classList.add('active'); thumb.onclick = () => { mainImage.src = img; currentImageModalIndex = index; document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active')); thumb.classList.add('active'); }; thumbnailContainer.appendChild(thumb); }); } else { mainImage.src = 'https://via.placeholder.com/500x375.png?text=No+Image'; } mainImage.addEventListener('click', openImageModal); }
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
function closeImageModal() { document.getElementById('imageModal').style.display = 'none'; }
function changeModalImage(direction) { currentImageModalIndex = (currentImageModalIndex + direction + galleryImages.length) % galleryImages.length; updateModalImage(); }
function updateModalImage() { document.getElementById('modalImage').src = galleryImages[currentImageModalIndex]; }

export {
    initializeProductDetailPage,
    changeDetailQuantity,
    addToCartWithQuantity,
    buyNowWithQuantity
};