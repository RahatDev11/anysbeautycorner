import { showToast, hideSocialMediaIcons } from '../modules/ui-utilities.js';
import { auth } from '../modules/firebase-config.js';
import { onAuthStateChanged } from '../modules/auth-manager.js';
import { getUserOrders, getGuestOrders, getOrderById } from '../modules/order-manager.js';

// =================================================================
// SECTION: ORDER TRACK PAGE LOGIC
// =================================================================

// Helper function for status display (moved here for reusability)
function getStatusText(status) {
    const statuses = {
        processing: 'প্রসেসিং', confirmed: 'কনফার্মড', packaging: 'প্যাকেজিং',
        shipped: 'ডেলিভারি হয়েছে', delivered: 'সম্পন্ন হয়েছে', failed: 'ব্যর্থ', cancelled: 'ক্যানসেলড'
    };
    return statuses[status] || 'অজানা';
}

// Helper function for status display (moved here as it's only used in this modal)
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
    return colors[status] || colors.cancelled; // Default to cancelled for unknown status
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

async function initializeOrderTrackPage() {
    const orderListDiv = document.getElementById('orderList');
    if (!orderListDiv) return Promise.resolve();

    async function loadUserOrders(user) {
        orderListDiv.innerHTML = '<p class="text-center text-gray-500 italic p-4">অর্ডার লোড হচ্ছে...</p>';
        let userOrders = [];

        try {
            if (user) {
                // Fetch orders for logged-in user
                userOrders = await getUserOrders(user.uid);
            } else {
                // Fetch orders for guest user from localStorage
                const guestOrderIds = getGuestOrders();
                if (guestOrderIds.length > 0) {
                    const orderPromises = guestOrderIds.map(orderId => getOrderById(orderId).catch(e => null));
                    const results = await Promise.all(orderPromises);
                    userOrders = results.filter(order => order !== null);
                }
            }

            displayOrders(userOrders);

        } catch (error) {
            console.error("Error loading user orders:", error);
            orderListDiv.innerHTML = '<p class="text-center text-red-500 italic p-4">আপনার অর্ডারগুলো লোড করতে সমস্যা হয়েছে।</p>';
        }
    }

    function displayOrders(orders) {
        if (orders.length > 0) {
            // Sort orders by date, newest first
            orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
            
            let ordersHtml = '<h2 class="text-2xl font-bold text-center mb-6 text-lipstick">আপনার অর্ডারসমূহ</h2>';
            orders.forEach(order => {
                const orderId = order.key || order.orderId;
                ordersHtml += `
                    <div class="bg-white p-4 rounded-lg shadow-md mb-4 cursor-pointer hover:bg-gray-50 transition-colors" data-order-id="${orderId}">
                        <div class="flex justify-between items-center">
                            <p class="font-semibold">অর্ডার আইডি: ${orderId}</p>
                            <p class="text-sm text-gray-600">${new Date(order.orderDate).toLocaleDateString('bn-BD')}</p>
                        </div>
                        <p class="text-gray-700">মোট মূল্য: ${order.totalAmount} টাকা</p>
                        <div class="flex items-center mt-2">
                            <p class="text-gray-700 mr-2">স্ট্যাটাস:</p>
                            <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status).bg} ${getStatusColor(order.status).text}">
                                ${getStatusText(order.status)}
                            </span>
                        </div>
                    </div>
                `;
            });
            orderListDiv.innerHTML = ordersHtml;

            document.querySelectorAll('#orderList > div[data-order-id]').forEach(item => {
                item.addEventListener('click', (event) => {
                    const orderId = event.currentTarget.dataset.orderId;
                    const order = orders.find(o => (o.key || o.orderId) === orderId);
                    if (order) {
                        showOrderDetailsModal(order, orderId);
                    }
                });
            });
        } else {
            orderListDiv.innerHTML = `
                <div class="text-center text-gray-500 italic p-8 bg-white rounded-lg shadow-md">
                    <p class="mb-4">কোনো অর্ডার খুঁজে পাওয়া যায়নি।</p>
                    <p>আপনি যদি লগইন না করে থাকেন, তাহলে আপনার অর্ডার দেখতে <a href="#" onclick="window.loginWithGmail()" class="text-lipstick font-semibold hover:underline">লগইন করুন</a>।</p>
                </div>
            `;
        }
    }

    onAuthStateChanged(auth, async (user) => {
        await loadUserOrders(user);
    });

    return Promise.resolve();
}

export {
    initializeOrderTrackPage,
    showOrderDetailsModal,
    getStatusColor
};