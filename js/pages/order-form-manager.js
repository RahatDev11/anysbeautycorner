// =================================================================
// SECTION: ORDER FORM PAGE LOGIC (আপডেটেড - ডেলিভারি চার্জ ১৩০ টাকা)
// =================================================================

import { auth, database, ref, get, set, runTransaction } from '../modules/firebase-config.js';
import { showToast } from '../modules/ui-utilities.js';
import { sendTelegramNotification, sendNotificationForOrder } from '../modules/notification-manager.js';

let checkoutCart = [];
let isBuyNowMode = false;

async function initializeOrderFormPage() {
    return new Promise((resolve, reject) => {
        const checkoutForm = document.getElementById('checkoutForm');
        if (!checkoutForm) {
            reject('Checkout form not found');
            return;
        }

        try {
            // Show form and hide loader
            document.getElementById('loadingIndicator')?.classList.add('hidden');
            checkoutForm.classList.remove('hidden');

            // Initialize radio button styles
            initializeRadioButtons();

            // Initialize checkout process
            auth.onAuthStateChanged(async (user) => {
                try {
                    if (user) {
                        // লগইন করা ইউজার: UID এবং ইমেইল সেভ করা হলো
                        window.currentUserId = user.uid;
                        window.currentUserEmail = user.email;
                        console.log("User logged in:", user.email);
                        await fetchUserProfile(user.uid);
                    } else {
                        // গেস্ট ইউজার: GUEST_ দিয়ে আইডি সেভ করা হলো
                        window.currentUserId = 'GUEST_' + Date.now();
                        window.currentUserEmail = 'guest@checkout.com';
                        console.log("Guest user created:", window.currentUserId);
                    }
                    
                    initializeCheckout();
                    handleDeliveryLocationChange();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });

            // Add event listeners
            document.querySelectorAll('input[name="deliveryLocation"]').forEach(radio => {
                radio.addEventListener('change', handleDeliveryLocationChange);
            });
            
            document.getElementById('deliveryPaymentMethod')?.addEventListener('change', handleDeliveryPaymentMethodChange);
            checkoutForm.addEventListener('submit', placeOrder);

        } catch (error) {
            reject(error);
        }
    });
}

function initializeRadioButtons() {
    const radioButtons = document.querySelectorAll('input[name="deliveryLocation"]');
    radioButtons.forEach(radio => {
        // Set initial state
        if (radio.checked) {
            const customRadio = radio.parentElement.querySelector('.radio-custom');
            if (customRadio) {
                customRadio.classList.add('bg-lipstick', 'text-white');
                customRadio.classList.remove('bg-white', 'text-lipstick');
            }
        }

        // Add change event
        radio.addEventListener('change', function() {
            // Reset all custom radios
            document.querySelectorAll('.radio-custom').forEach(custom => {
                custom.classList.remove('bg-lipstick', 'text-white');
                custom.classList.add('bg-white', 'text-lipstick');
            });

            // Activate selected custom radio
            if (this.checked) {
                const customRadio = this.parentElement.querySelector('.radio-custom');
                if (customRadio) {
                    customRadio.classList.add('bg-lipstick', 'text-white');
                    customRadio.classList.remove('bg-white', 'text-lipstick');
                }
            }
        });
    });
}

function calculateAndDisplayPrices(items) {
    const subTotalDisplay = document.getElementById('subTotalDisplay');
    const deliveryFeeDisplay = document.getElementById('deliveryFeeDisplay');
    const totalAmountDisplay = document.getElementById('totalAmountDisplay');
    const advancePaymentRow = document.getElementById('advancePaymentRow');
    const advancePaymentDisplay = document.getElementById('advancePaymentDisplay');
    
    if (!subTotalDisplay || !deliveryFeeDisplay || !totalAmountDisplay) return;

    let subTotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 1), 0);
    const deliveryLocation = document.querySelector('input[name="deliveryLocation"]:checked')?.value || 'insideDhaka';
    
    // Updated delivery fees
    const deliveryFee = deliveryLocation === 'outsideDhaka' ? 160 : 70;
    const advancePayment = deliveryLocation === 'outsideDhaka' ? 130 : 0;
    const totalAmount = subTotal + deliveryFee;

    subTotalDisplay.textContent = `${subTotal.toFixed(2)} টাকা`;
    deliveryFeeDisplay.textContent = `${deliveryFee.toFixed(2)} টাকা`;
    totalAmountDisplay.textContent = `${totalAmount.toFixed(2)} টাকা`;

    // Show/hide advance payment row
    if (deliveryLocation === 'outsideDhaka') {
        advancePaymentRow.classList.remove('hidden');
        advancePaymentDisplay.textContent = `${advancePayment.toFixed(2)} টাকা`;
    } else {
        advancePaymentRow.classList.add('hidden');
    }

    return { subTotal, deliveryFee, advancePayment, totalAmount };
}

function renderCheckoutItems(items) {
    const checkoutItemsContainer = document.getElementById('checkoutItems');
    const submitButton = document.getElementById('submitButton');
    
    if (!checkoutItemsContainer || !submitButton) return;

    checkoutItemsContainer.innerHTML = '';
    
    if (!items || items.length === 0) {
        checkoutItemsContainer.innerHTML = '<p class="empty-cart-message">আপনার কার্ট খালি। অর্ডার করার জন্য প্রোডাক্ট যোগ করুন।</p>';
        submitButton.disabled = true;
        return;
    }
    
    items.forEach(item => {
        const itemName = item.name || 'Unknown Product';
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = item.quantity || 1;
        const itemImage = item.image || 'https://via.placeholder.com/60';
        const itemVariant = item.variant || '';

        const itemElement = document.createElement('div');
        itemElement.className = 'checkout-item';
        itemElement.innerHTML = `
            <img src="${itemImage}" alt="${itemName}" loading="lazy">
            <div class="checkout-item-details">
                <p class="item-name">${itemName} ${itemVariant ? `(${itemVariant})` : ''}</p>
                <p>${itemQuantity} x ${itemPrice.toFixed(2)} টাকা = ${(itemPrice * itemQuantity).toFixed(2)} টাকা</p>
            </div>
        `;
        checkoutItemsContainer.appendChild(itemElement);
    });
    
    submitButton.disabled = false;
}

function initializeCheckout() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlCartData = urlParams.get('cart');

    if (urlCartData) {
        // If cart data is passed via URL (from Buy Now), use it.
        isBuyNowMode = true;
        try {
            checkoutCart = JSON.parse(decodeURIComponent(urlCartData));
            console.log("Buy Now mode activated with items:", checkoutCart);
        } catch (e) {
            console.error("Error parsing cart data:", e);
            showToast("কার্ট ডেটা লোড করতে সমস্যা হয়েছে।", "error");
            checkoutCart = [];
        }
    } else {
        // Otherwise, load the cart from the main localStorage item.
        isBuyNowMode = false;
        try {
            checkoutCart = JSON.parse(localStorage.getItem('anyBeautyCart') || '[]');
            console.log("Cart loaded from localStorage:", checkoutCart);
        } catch (e) {
            console.error("Error loading cart from localStorage:", e);
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
        const snapshot = await get(profileRef);
        if (snapshot.exists()) {
            const profile = snapshot.val();
            document.getElementById('customerName').value = profile.name || '';
            document.getElementById('phoneNumber').value = profile.phone || '';
            document.getElementById('address').value = profile.address || '';
            console.log("User profile loaded:", profile);
        }
    } catch (err) {
        console.error("Error fetching user profile:", err);
    }
}

function handleDeliveryLocationChange() {
    const location = document.querySelector('input[name="deliveryLocation"]:checked').value;
    const outsideGroup = document.getElementById('outsideDhakaLocationGroup');
    const notice = document.getElementById('paymentNotice');
    const deliveryPaymentGroup = document.getElementById('deliveryPaymentGroup');

    const isOutsideDhaka = location === 'outsideDhaka';

    // Toggle visibility
    outsideGroup.classList.toggle('hidden', !isOutsideDhaka);
    notice.classList.toggle('hidden', !isOutsideDhaka);
    deliveryPaymentGroup.classList.toggle('hidden', !isOutsideDhaka);

    // Set required fields
    document.getElementById('outsideDhakaLocation').required = isOutsideDhaka;
    document.getElementById('deliveryPaymentMethod').required = isOutsideDhaka;

    // Reset payment fields when location changes
    if (!isOutsideDhaka) {
        document.getElementById('deliveryPaymentMethod').value = '';
        document.getElementById('paymentNumber').value = '';
        document.getElementById('transactionId').value = '';
    }

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
    const originalText = submitButton.innerHTML;
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>অর্ডার কনফার্ম হচ্ছে...';

    try {
        const itemsToOrder = isBuyNowMode ? checkoutCart : (JSON.parse(localStorage.getItem('anyBeautyCart')) || []);

        if (itemsToOrder.length === 0) {
            throw new Error("আপনার কার্ট খালি। অর্ডার করা সম্ভব নয়।");
        }

        // Form data collection and validation
        const customerName = document.getElementById('customerName').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const address = document.getElementById('address').value.trim();
        const deliveryLocationElement = document.querySelector('input[name="deliveryLocation"]:checked');
        const deliveryLocation = deliveryLocationElement ? deliveryLocationElement.value : 'insideDhaka';
        const deliveryNote = document.getElementById('deliveryNote').value.trim();

        // Validation
        if (!customerName) throw new Error("আপনার নাম প্রদান করুন।");
        if (!phoneNumber) throw new Error("ফোন নম্বর প্রদান করুন।");
        if (!address) throw new Error("ঠিকানা প্রদান করুন।");
        
        // Phone number validation
        const phoneRegex = /^01[3-9]\d{8}$/;
        if (!phoneRegex.test(phoneNumber)) {
            throw new Error("সঠিক ফোন নম্বর প্রদান করুন (01XXXXXXXXX)");
        }

        // Outside Dhaka validation
        if (deliveryLocation === 'outsideDhaka') {
            const outsideLocation = document.getElementById('outsideDhakaLocation').value.trim();
            const paymentMethod = document.getElementById('deliveryPaymentMethod').value;
            const paymentNumber = document.getElementById('paymentNumber').value.trim();
            const transactionId = document.getElementById('transactionId').value.trim();

            if (!outsideLocation) throw new Error("জেলা ও থানা প্রদান করুন।");
            if (!paymentMethod) throw new Error("পেমেন্ট মাধ্যম সিলেক্ট করুন।");
            if (!paymentNumber) throw new Error("পেমেন্ট নাম্বার প্রদান করুন।");
            if (!transactionId) throw new Error("ট্রানজেকশন আইডি প্রদান করুন।");
        }

        // Price calculation with updated delivery fees
        const deliveryFee = deliveryLocation === 'insideDhaka' ? 70 : 160;
        const advancePayment = deliveryLocation === 'outsideDhaka' ? 130 : 0;
        const subTotal = itemsToOrder.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 1), 0);
        const totalAmount = subTotal + deliveryFee;

        // Generate Custom Order ID
        const today = new Date();
        const year = today.getFullYear().toString().slice(-2);
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const dateString = `${today.getFullYear()}-${month}-${day}`;

        console.log("Generating order ID for date:", dateString);

        const counterRef = ref(database, `counters/${dateString}`);

        const result = await runTransaction(counterRef, (currentData) => {
            return (currentData || 0) + 1;
        });

        if (result.committed) {
            const orderNumber = result.snapshot.val();
            const paddedOrderNumber = String(orderNumber).padStart(3, '0');
            const orderId = `${year}${day}${month}${paddedOrderNumber}`;

            console.log("Order ID generated:", orderId);

            // Prepare order data
            const orderData = {
                customerName,
                phoneNumber,
                address,
                deliveryLocation: deliveryLocation === 'insideDhaka' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে',
                deliveryFee,
                advancePayment, // নতুন ফিল্ড যোগ করা হলো
                subTotal: subTotal.toFixed(2),
                totalAmount: totalAmount.toFixed(2),
                cartItems: itemsToOrder,
                orderDate: new Date().toISOString(),
                status: 'processing',
                userId: window.currentUserId, 
                customerEmail: window.currentUserEmail || 'N/A',
                userEmail: window.currentUserEmail || 'N/A', // Backward compatibility
                deliveryNote: deliveryNote || 'N/A',
                outsideDhakaLocation: deliveryLocation === 'outsideDhaka' ? document.getElementById('outsideDhakaLocation').value : 'N/A',
                paymentMethod: deliveryLocation === 'outsideDhaka' ? document.getElementById('deliveryPaymentMethod').value : 'N/A',
                paymentNumber: deliveryLocation === 'outsideDhaka' ? document.getElementById('paymentNumber').value : 'N/A',
                transactionId: deliveryLocation === 'outsideDhaka' ? document.getElementById('transactionId').value : 'N/A',
                orderId: orderId
            };

            // Save to Firebase
            const newOrderRef = ref(database, 'orders/' + orderId);
            await set(newOrderRef, orderData);
            console.log("Order saved to Firebase:", orderId);

            // Save to localStorage for tracking
            const myOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
            myOrders.push(orderId);
            localStorage.setItem('myOrders', JSON.stringify(myOrders));
            console.log("Order ID saved to localStorage");

            // Clear cart
            localStorage.removeItem('anyBeautyCart');
            if (window.cart) {
                window.cart.length = 0;
            }
            console.log("Cart cleared");

            // Send notifications
            try {
                await sendTelegramNotification({ ...orderData, orderId });
                await sendNotificationForOrder(orderId);
                console.log("Notifications sent");
            } catch (notifError) {
                console.warn("Notification failed:", notifError);
            }

            // Success message and redirect
            showToast(`অর্ডার সফলভাবে তৈরি হয়েছে! অর্ডার আইডি: ${orderId}`, "success");
            
            setTimeout(() => {
                window.location.href = `order-track.html?orderId=${orderId}`;
            }, 2000);

        } else {
            throw new Error("অর্ডার আইডি জেনারেট করতে সমস্যা হয়েছে।");
        }

    } catch (error) {
        console.error("Order placement error:", error);
        showToast(`অর্ডার সাবমিট করতে সমস্যা হয়েছে: ${error.message}`, "error");
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

export {
    initializeOrderFormPage,
    placeOrder
};