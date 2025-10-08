// =================================================================
// SECTION: ORDER FORM PAGE LOGIC
// =================================================================

import { auth, database, ref, get, set, runTransaction } from '../modules/firebase-config.js';
import { showToast } from '../modules/ui-utilities.js';
import { getUserId, onAuthStateChanged } from '../modules/auth-manager.js';
import { sendTelegramNotification, sendNotificationForOrder } from '../modules/notification-manager.js';
import { cart, saveCart } from '../modules/cart-manager.js';

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
        checkoutForm.addEventListener('submit', placeOrder);
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
            showToast("কার্ট ডেটা লোড করতে সমস্যা হয়েছে।", "error");
            checkoutCart = [];
        }
    } else {
        // Otherwise, load the cart from the main localStorage item.
        isBuyNowMode = false;
        try {
            checkoutCart = JSON.parse(localStorage.getItem('anyBeautyCart') || '[]');
        } catch (e) {
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

async function placeOrder(event) {
    if (event) event.preventDefault();

    const submitButton = document.getElementById('submitButton');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>অর্ডার কনফার্ম হচ্ছে...';

    try {
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
                    customerEmail: window.currentUserEmail || 'N/A',
                    deliveryNote: deliveryNote || 'N/A',
                    outsideDhakaLocation: deliveryLocation === 'outsideDhaka' ? document.getElementById('outsideDhakaLocation').value : 'N/A',
                    paymentNumber: deliveryLocation === 'outsideDhaka' ? document.getElementById('paymentNumber').value : 'N/A',
                    transactionId: deliveryLocation === 'outsideDhaka' ? document.getElementById('transactionId').value : 'N/A',
                    orderId: orderId
                };

                const newOrderRef = ref(database, 'orders/' + orderId);
                await set(newOrderRef, orderData);

                // Save order ID to localStorage
                const myOrders = JSON.parse(localStorage.getItem('myOrders')) || [];
                myOrders.push(orderId);
                localStorage.setItem('myOrders', JSON.stringify(myOrders));

                // Clear cart
                localStorage.removeItem('anyBeautyCart');
                cart.length = 0; // Clear the imported cart array
                saveCart();

                // Send notification
                await sendTelegramNotification({ ...orderData, orderId });
                await sendNotificationForOrder(orderId); // Call OneSignal notification function

                // Redirect with success message
                                // ১. সাফল্যের বার্তা দেখানো
                showToast(`অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে! অর্ডার আইডি: ${orderId}`, "success");

                // ২. ২.৫ সেকেন্ড অপেক্ষা করে ইউজারকে হোমপেজে রিডাইরেক্ট করা
                setTimeout(() => {
                    window.location.href = 'index.html'; // হোমপেজের URL
                }, 2500); // ২৫০০ মিলিসেকেন্ড = ২.৫ সেকেন্ড

            } else {
                throw new Error("Failed to commit transaction for order counter.");
            }

        }).catch(error => {
            throw error; // Re-throw to be caught by the outer catch block
        });

    } catch (error) {
        showToast(`অর্ডার সাবমিট করতে সমস্যা হয়েছে: ${error.message || 'Unknown Error'}। অনুগ্রহ করে আবার চেষ্টা করুন।`, "error");
        submitButton.disabled = false;
        submitButton.innerHTML = 'অর্ডার কনফার্ম করুন';
    }
}

export {
    initializeOrderFormPage,
    placeOrder
};
