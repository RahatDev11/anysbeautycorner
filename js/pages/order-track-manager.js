// =================================================================
// SECTION: ORDER TRACK PAGE LOGIC (সরল ভার্সন)
// =================================================================

import { database, ref, get, auth, onAuthStateChanged } from '../modules/firebase-config.js';
import { showToast } from '../modules/ui-utilities.js';

console.log('✅ order-track-manager.js loaded');

// Helper function for status display
function getStatusText(status) {
    const statuses = {
        processing: 'প্রসেসিং', 
        confirmed: 'কনফার্মড', 
        packaging: 'প্যাকেজিং',
        shipped: 'শিপড', 
        delivered: 'ডেলিভার্ড', 
        failed: 'ব্যর্থ', 
        cancelled: 'ক্যানসেলড'
    };
    return statuses[status] || 'প্রসেসিং';
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
    return colors[status] || colors.processing;
}

// localStorage থেকে অর্ডার আইডি গুলো লোড করা
function getMyOrderIdsFromLocalStorage() {
    try {
        const orders = JSON.parse(localStorage.getItem('myOrders') || '[]');
        console.log('📦 localStorage থেকে অর্ডার আইডি:', orders);
        return orders;
    } catch (error) {
        console.error('Error loading order IDs from localStorage:', error);
        return [];
    }
}

async function loadAllOrders() {
    console.log('🔍 সব অর্ডার লোড করা হচ্ছে...');
    const orders = [];
    
    try {
        const ordersRef = ref(database, 'orders');
        const snapshot = await get(ordersRef);
        
        if (snapshot.exists()) {
            const allOrders = snapshot.val();
            console.log('🔥 Firebase থেকে অর্ডার পেয়েছি:', Object.keys(allOrders).length);
            
            Object.keys(allOrders).forEach(orderId => {
                orders.push({
                    id: orderId,
                    ...allOrders[orderId]
                });
            });
        } else {
            console.log('❌ Firebase-এ কোন অর্ডার নেই');
        }

    } catch (error) {
        console.error("Error loading orders:", error);
    }
    
    return orders;
}

async function loadAndDisplayUserOrders() {
    console.log('🎯 অর্ডার লোড এবং ডিসপ্লে শুরু...');
    
    const orderListDiv = document.getElementById('orderList');
    const loginPrompt = document.getElementById('loginPrompt');
    const orderListContainer = document.getElementById('orderListContainer');

    if (!orderListDiv) {
        console.error('❌ orderList div খুঁজে পাওয়া যায়নি');
        return;
    }

    // সবসময় অর্ডার লোড করার চেষ্টা করব
    const allOrders = await loadAllOrders();
    const myOrderIds = getMyOrderIdsFromLocalStorage();
    const currentUser = auth.currentUser;

    console.log('👤 বর্তমান ইউজার:', currentUser);
    console.log('📋 আমার অর্ডার আইডি:', myOrderIds);
    console.log('📦 সব অর্ডার:', allOrders.length);

    // আমার অর্ডারগুলো ফিল্টার করা
    const myOrders = allOrders.filter(order => {
        // ১. যদি ইউজার লগইন করা থাকে
        if (currentUser) {
            if (order.userId === currentUser.uid || 
                order.userEmail === currentUser.email ||
                order.customerEmail === currentUser.email) {
                return true;
            }
        }
        
        // ২. localStorage-এ অর্ডার আইডি থাকলে
        if (myOrderIds.includes(order.id)) {
            return true;
        }
        
        return false;
    });

    console.log('✅ আমার অর্ডার:', myOrders.length);

    // UI আপডেট
    if (loginPrompt) loginPrompt.style.display = 'none';
    if (orderListContainer) orderListContainer.style.display = 'block';
    
    if (myOrders.length > 0) {
        // Sort orders by orderDate in descending order (newest first)
        myOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        
        let ordersHtml = '';
        
        myOrders.forEach(order => {
            const orderId = order.id;
            const statusColor = getStatusColor(order.status);
            ordersHtml += `
                <div class="bg-white p-4 rounded-lg shadow-md mb-4 cursor-pointer hover:shadow-lg transition-shadow" data-order-id="${orderId}">
                    <div class="flex justify-between items-center">
                        <p class="font-semibold">অর্ডার আইডি: ${orderId}</p>
                        <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}">
                            ${getStatusText(order.status)}
                        </span>
                    </div>
                    <div class="flex justify-between items-center mt-2">
                        <p class="text-gray-700">মোট মূল্য: ${order.totalAmount || 0} টাকা</p>
                        <p class="text-sm text-gray-600">${order.orderDate ? new Date(order.orderDate).toLocaleDateString('bn-BD') : 'N/A'}</p>
                    </div>
                    <div class="mt-2">
                        <p class="text-sm text-gray-600">নাম: ${order.customerName || 'N/A'}</p>
                    </div>
                </div>
            `;
        });
        
        orderListDiv.innerHTML = ordersHtml;
        console.log('✅ অর্ডার ডিসপ্লে করা হয়েছে');

    } else {
        orderListDiv.innerHTML = `
            <div class="text-center p-8">
                <p class="text-gray-500 italic mb-4">আপনার কোনো অর্ডার খুঁজে পাওয়া যায়নি।</p>
                <p class="text-sm text-gray-400">অর্ডার করার পর এখানে আপনার অর্ডার দেখা যাবে।</p>
            </div>
        `;
        console.log('❌ কোন অর্ডার পাওয়া যায়নি');
    }
}

function setupLoginButton() {
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        console.log('🔘 লগইন বাটন সেটআপ করা হচ্ছে');
        loginButton.onclick = () => {
            console.log('👆 লগইন বাটন ক্লিক করা হয়েছে');
            if (window.loginWithGmail) {
                window.loginWithGmail();
            } else {
                console.error('❌ loginWithGmail ফাংশন খুঁজে পাওয়া যায়নি');
            }
        };
    }
}

async function initializeOrderTrackPage() {
    console.log('🚀 ORDER TRACK PAGE INITIALIZATION STARTED');

    // Setup login button
    setupLoginButton();

    // Set up auth state listener
    onAuthStateChanged(auth, (user) => {
        console.log('🔐 Auth state changed:', user ? `User: ${user.email}` : 'No user');
        loadAndDisplayUserOrders();
    });

    // Initial load
    await loadAndDisplayUserOrders();

    console.log('✅ ORDER TRACK PAGE INITIALIZATION COMPLETED');
    return Promise.resolve();
}

export {
    initializeOrderTrackPage
};