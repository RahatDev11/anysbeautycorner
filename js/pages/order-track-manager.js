// =================================================================
// SECTION: ORDER TRACK PAGE LOGIC
// =================================================================

import { database, ref, get, auth } from '../modules/firebase-config.js';
import { showToast, hideSocialMediaIcons } from '../modules/ui-utilities.js';

// Helper function for status display
function getStatusText(status) {
    const statuses = {
        processing: 'প্রসেসিং', confirmed: 'কনফার্মড', packaging: 'প্যাকেজিং',
        shipped: 'ডেলিভারি হয়েছে', delivered: 'সম্পন্ন হয়েছে', failed: 'ব্যর্থ', cancelled: 'ক্যানসেলড'
    };
    return statuses[status] || 'অজানা';
}

function getStatusColor(status) {
    const colors = {
        processing: { text: 'text-yellow-800', bg: 'bg-yellow-100' },
        confirmed: { text: 'text-blue-800', bg: 'bg-blue-100' },
        packaging: { text: 'text-purple-800', bg: 'bg-purple-100' },
        shipped: { text: 'text-cyan-800', bg: 'bg-cyan-100' },
        delivered: { text: 'text-green-800', bg: 'bg-green-100' },
        failed: { text: 'text-red-800', bg: 'bg-red-100' },
        cancelled: { text: 'text-gray-800', bg: 'bg-gray-200' }
    };
    return colors[status] || colors.cancelled;
}

function showOrderDetailsModal(order, orderId) {
    hideSocialMediaIcons();
    const modal = document.getElementById('orderModal');
    const modalContent = document.getElementById('modalContent');
    if(!modal || !modalContent) return;

    const statuses = ['processing', 'confirmed', 'packaging', 'shipped', 'delivered'];
    const currentStatusIndex = statuses.indexOf(order.status || 'processing');
    let trackerHTML = '<div class="flex justify-between items-center mb-6 text-xs text-center">';
    statuses.forEach((status, index) => {
        const isActive = index <= currentStatusIndex;
        const isCompleted = index < currentStatusIndex;
        trackerHTML += `<div class="step-item flex-1 relative"><div class="step-icon w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold ${isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'} transition-colors duration-300">${isCompleted ? '<i class="fas fa-check"></i>' : (index + 1)}</div><p class="mt-2 ${isActive ? 'text-green-600 font-semibold' : 'text-gray-500'}">${getStatusText(status)}</p>${ index < statuses.length - 1 ? `<div class="step-connector absolute top-4 left-1/2 w-full h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}"></div>` : '' }</div>`;
    });
    trackerHTML += '</div>';

    let detailsHTML = `<h3 class="text-xl font-bold text-lipstick mb-4">অর্ডারের বিস্তারিত</h3>${trackerHTML}<div class="space-y-1 text-sm bg-gray-50 p-3 rounded-lg"><p><strong>অর্ডার আইডি:</strong> ${order.orderId || 'N/A'}</p><p><strong>তারিখ:</strong> ${order.orderDate ? new Date(order.orderDate).toLocaleString('bn-BD') : 'N/A'}</p><p><strong>নাম:</strong> ${order.customerName || 'N/A'}</p><p><strong>ফোন:</strong> ${order.phoneNumber || 'N/A'}</p><p><strong>ইমেইল:</strong> ${order.customerEmail || 'N/A'}</p><p><strong>ঠিকানা:</strong> ${order.address || 'N/A'}</p></div><hr class="my-3"><h4 class="font-semibold mb-2">প্রোডাক্টস</h4>`;
    
    (order.cartItems || []).forEach(item => {
        const productId = item.id || '';
        const isClickable = !!productId;
        const tag = isClickable ? 'a' : 'div';
        const linkHref = isClickable ? `href="product-detail.html?id=${productId}"` : '';
        const extraClasses = isClickable ? 'hover:bg-gray-100 transition-colors cursor-pointer' : '';
        
        detailsHTML += `
        <${tag} ${linkHref} class="flex items-center mb-2 p-2 bg-gray-50 rounded-md ${extraClasses}">
            <img src="${item.image || 'https://via.placeholder.com/64'}" alt="${item.name}" class="w-12 h-12 object-cover rounded mr-3">
            <div class="text-sm flex-grow">
                <p class="font-semibold">${item.name || 'অজানা প্রোডাক্ট'}</p>
                <p>${item.quantity || 1} x ${item.price || 0} টাকা</p>
            </div>
            <div class="text-sm font-semibold">
                ${((item.quantity || 1) * (item.price || 0)).toFixed(2)} টাকা
            </div>
        </${tag}>`;
    });

    detailsHTML += `<hr class="my-3"><div class="text-right space-y-1"><p><strong>ডেলিভারি ফি:</strong> ${order.deliveryFee || 0} টাকা</p><p class="text-lg font-bold"><strong>মোট মূল্য:</strong> ${order.totalAmount || 0} টাকা</p></div>`;

    modalContent.innerHTML = detailsHTML;
    modal.classList.add('flex');
    document.getElementById('modalClose').onclick = () => modal.classList.remove('flex');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('flex'); };
}

async function loadUserOrders() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        return []; // ইউজার লগইন না থাকলে
    }

    const orders = [];
    
    try {
        // প্রতিটি অর্ডার আলাদাভাবে চেক করুন
        const ordersRef = ref(database, 'orders');
        const ordersSnapshot = await get(ordersRef);
        
        if (ordersSnapshot.exists()) {
            const ordersData = ordersSnapshot.val();
            
            Object.keys(ordersData).forEach(orderId => {
                const order = ordersData[orderId];
                // শুধুমাত্র ইউজারের নিজের অর্ডার দেখাবে
                if (order.userId === currentUser.uid || order.guestId === currentUser.uid) {
                    orders.push({
                        id: orderId,
                        ...order
                    });
                }
            });
        }
    } catch (error) {
        console.error("Error loading user orders:", error);
        throw error;
    }
    
    return orders;
}

async function initializeOrderTrackPage() {
    const orderListDiv = document.getElementById('orderList');

    if (!orderListDiv) {
        return Promise.resolve();
    }

    async function loadAndDisplayUserOrders() {
        orderListDiv.innerHTML = '<p class="text-center text-gray-500 italic p-4">অর্ডার লোড হচ্ছে...</p>';
        orderListDiv.style.display = 'block';

        try {
            const userOrders = await loadUserOrders();

            if (userOrders.length > 0) {
                // Sort orders by orderDate in descending order (newest first)
                userOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
                
                let ordersHtml = '<h2 class="text-2xl font-bold text-center mb-6 text-lipstick">আপনার অর্ডারসমূহ</h2>';
                
                userOrders.forEach(order => {
                    const orderId = order.id;
                    ordersHtml += `
                        <div class="bg-white p-4 rounded-lg shadow-md mb-4 cursor-pointer" data-order-id="${orderId}">
                            <div class="flex justify-between items-center">
                                <p class="font-semibold">অর্ডার আইডি: ${orderId}</p>
                                <p class="text-sm text-gray-600">${new Date(order.orderDate).toLocaleDateString('bn-BD')}</p>
                            </div>
                            <p class="text-gray-700">মোট মূল্য: ${order.totalAmount} টাকা</p>
                            <p class="text-gray-700">স্ট্যাটাস: ${getStatusText(order.status)}</p>
                        </div>
                    `;
                });
                
                orderListDiv.innerHTML = ordersHtml;

                // Attach click listeners
                document.querySelectorAll('#orderList > div[data-order-id]').forEach(item => {
                    item.addEventListener('click', (event) => {
                        const orderId = event.currentTarget.dataset.orderId;
                        const order = userOrders.find(o => o.id === orderId);
                        if (order) {
                            showOrderDetailsModal(order, orderId);
                        }
                    });
                });
            } else {
                orderListDiv.innerHTML = '<p class="text-center text-gray-500 italic p-4">আপনার কোনো অর্ডার খুঁজে পাওয়া যায়নি।</p>';
            }
        } catch (error) {
            console.error("Error loading orders:", error);
            if (error.code === 'PERMISSION_DENIED') {
                orderListDiv.innerHTML = '<p class="text-center text-red-500 italic p-4">অর্ডার দেখতে অনুমতি প্রয়োজন। দয়া করে লগইন করুন।</p>';
            } else {
                orderListDiv.innerHTML = '<p class="text-center text-red-500 italic p-4">অর্ডার লোড করতে সমস্যা হয়েছে।</p>';
            }
        }
    }

    await loadAndDisplayUserOrders();
    return Promise.resolve();
}

export {
    initializeOrderTrackPage,
    showOrderDetailsModal,
    getStatusColor
};