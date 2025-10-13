// =================================================================
// SECTION: ORDER TRACK PAGE LOGIC - MOBILE FIXED VERSION
// =================================================================

import { database, ref, get, auth, onAuthStateChanged, query, orderByChild, equalTo } from '../modules/firebase-config.js';
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

// সরলীকৃত ভার্সন - সব অর্ডার লোড করবে
async function loadAllOrders() {
    try {
        console.log("🔄 Loading orders from Firebase...");
        const ordersRef = ref(database, 'orders');
        const snapshot = await get(ordersRef);
        
        const orders = [];
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                orders.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
        }
        
        console.log("✅ Orders loaded:", orders.length);
        return orders;
    } catch (error) {
        console.error("❌ Error loading orders:", error);
        return [];
    }
}

async function initializeOrderTrackPage() {
    console.log("🚀 Order track page initializing...");
    
    const orderListDiv = document.getElementById('orderList');
    const loginPrompt = document.getElementById('loginPrompt');
    const orderListContainer = document.getElementById('orderListContainer');

    if (!orderListDiv) {
        console.error("❌ Order list div not found");
        return;
    }

    // লগইন বাটন এড করুন
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }

    // ইউজারের লগিন স্টেট চেক করুন
    onAuthStateChanged(auth, async (user) => {
        console.log("👤 Auth state changed:", user ? "Logged in" : "Not logged in");
        
        if (user) {
            // লগইন করা আছে
            if (loginPrompt) loginPrompt.style.display = 'none';
            if (orderListContainer) orderListContainer.style.display = 'block';
            await loadAndDisplayOrders();
        } else {
            // লগইন করা নেই
            if (loginPrompt) loginPrompt.style.display = 'block';
            if (orderListContainer) orderListContainer.style.display = 'none';
        }
    });

    async function loadAndDisplayOrders() {
        orderListDiv.innerHTML = '<p class="text-center text-gray-500 italic p-4">অর্ডার লোড হচ্ছে...</p>';

        try {
            const orders = await loadAllOrders();
            
            if (orders.length > 0) {
                // সর্ট করবে নতুন থেকে পুরানো
                orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
                
                let ordersHtml = '<h2 class="text-2xl font-bold text-center mb-6 text-lipstick">আপনার অর্ডারসমূহ</h2>';
                
                orders.forEach(order => {
                    const statusColor = getStatusColor(order.status);
                    ordersHtml += `
                        <div class="bg-white p-4 rounded-lg shadow-md mb-4 cursor-pointer hover:shadow-lg transition-shadow" data-order-id="${order.id}">
                            <div class="flex justify-between items-center">
                                <p class="font-semibold">অর্ডার আইডি: ${order.id}</p>
                                <p class="text-sm text-gray-600">${new Date(order.orderDate).toLocaleDateString('bn-BD')}</p>
                            </div>
                            <p class="text-gray-700">মোট মূল্য: ${order.totalAmount || 0} টাকা</p>
                            <p class="text-gray-700">স্ট্যাটাস: <span class="${statusColor.text} ${statusColor.bg} px-2 py-1 rounded-full text-xs">${getStatusText(order.status)}</span></p>
                        </div>
                    `;
                });
                
                orderListDiv.innerHTML = ordersHtml;

                // ক্লিক লিসেনার এড করুন
                document.querySelectorAll('#orderList > div[data-order-id]').forEach(item => {
                    item.addEventListener('click', (event) => {
                        const orderId = event.currentTarget.dataset.orderId;
                        const order = orders.find(o => o.id === orderId);
                        if (order) {
                            showOrderDetailsModal(order, orderId);
                        }
                    });
                });
            } else {
                orderListDiv.innerHTML = '<p class="text-center text-gray-500 italic p-4">কোনো অর্ডার পাওয়া যায়নি।</p>';
            }
        } catch (error) {
            console.error("❌ Error:", error);
            orderListDiv.innerHTML = '<p class="text-center text-red-500 italic p-4">অর্ডার লোড করতে সমস্যা হয়েছে।</p>';
        }
    }
}

function showOrderDetailsModal(order, orderId) {
    console.log("📦 Showing order details for:", orderId);
    
    const modal = document.getElementById('orderModal');
    const modalContent = document.getElementById('modalContent');
    
    if(!modal || !modalContent) return;

    let detailsHTML = `
        <h3 class="text-xl font-bold text-lipstick mb-4">অর্ডার বিস্তারিত</h3>
        <div class="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
            <p><strong>অর্ডার আইডি:</strong> ${order.id}</p>
            <p><strong>তারিখ:</strong> ${new Date(order.orderDate).toLocaleString('bn-BD')}</p>
            <p><strong>নাম:</strong> ${order.customerName || 'N/A'}</p>
            <p><strong>ফোন:</strong> ${order.phoneNumber || 'N/A'}</p>
            <p><strong>ঠিকানা:</strong> ${order.address || 'N/A'}</p>
            <p><strong>স্ট্যাটাস:</strong> ${getStatusText(order.status)}</p>
        </div>
        <hr class="my-3">
        <h4 class="font-semibold mb-2">প্রোডাক্টস</h4>
    `;
    
    (order.cartItems || []).forEach(item => {
        detailsHTML += `
            <div class="flex items-center mb-2 p-2 bg-gray-50 rounded-md">
                <img src="${item.image || 'https://via.placeholder.com/64'}" alt="${item.name}" class="w-12 h-12 object-cover rounded mr-3">
                <div class="text-sm flex-grow">
                    <p class="font-semibold">${item.name || 'অজানা প্রোডাক্ট'}</p>
                    <p>${item.quantity || 1} x ${item.price || 0} টাকা</p>
                </div>
                <div class="text-sm font-semibold">
                    ${((item.quantity || 1) * (item.price || 0)).toFixed(2)} টাকা
                </div>
            </div>
        `;
    });

    detailsHTML += `
        <hr class="my-3">
        <div class="text-right space-y-1">
            <p><strong>ডেলিভারি ফি:</strong> ${order.deliveryFee || 0} টাকা</p>
            <p class="text-lg font-bold"><strong>মোট মূল্য:</strong> ${order.totalAmount || 0} টাকা</p>
        </div>
    `;

    modalContent.innerHTML = detailsHTML;
    modal.classList.add('flex');
    
    // মডাল ক্লোজ করার ইভেন্ট
    document.getElementById('modalClose').onclick = () => modal.classList.remove('flex');
    modal.onclick = (e) => { 
        if (e.target === modal) modal.classList.remove('flex'); 
    };
}

export {
    initializeOrderTrackPage,
    showOrderDetailsModal,
    getStatusColor
};