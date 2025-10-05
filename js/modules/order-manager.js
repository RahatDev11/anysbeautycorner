import { database, ref, set, get, update, query, orderByChild, equalTo, runTransaction } from './firebase-config.js';
import { showToast } from './ui-utilities.js';
import { sendTelegramNotification } from './notification-manager.js';

// Order status constants
export const ORDER_STATUS = {
    PROCESSING: 'processing',
    CONFIRMED: 'confirmed',
    PACKAGING: 'packaging',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    FAILED: 'failed'
};

// Create new order
export async function createOrder(orderData) {
    try {
        // Generate order ID
        const orderId = await generateOrderId();
        
        const order = {
            orderId: orderId,
            customerName: orderData.customerName,
            phoneNumber: orderData.phoneNumber,
            address: orderData.address,
            deliveryLocation: orderData.deliveryLocation,
            deliveryFee: orderData.deliveryFee,
            subTotal: orderData.subTotal,
            totalAmount: orderData.totalAmount,
            cartItems: orderData.cartItems,
            orderDate: new Date().toISOString(),
            status: ORDER_STATUS.PROCESSING,
            userId: orderData.userId,
            userEmail: orderData.userEmail,
            deliveryNote: orderData.deliveryNote || 'N/A',
            outsideDhakaLocation: orderData.outsideDhakaLocation || 'N/A',
            paymentNumber: orderData.paymentNumber || 'N/A',
            transactionId: orderData.transactionId || 'N/A',
            oneSignalPlayerId: orderData.oneSignalPlayerId || ''
        };

        // Save to database
        const orderRef = ref(database, `orders/${orderId}`);
        await set(orderRef, order);

        // Save to user's order history
        if (orderData.userId && orderData.userId !== 'guest_user') {
            const userOrderRef = ref(database, `users/${orderData.userId}/orders/${orderId}`);
            await set(userOrderRef, true);
        }

        // Save to localStorage for guest users
        if (orderData.userId === 'guest_user') {
            const myOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
            myOrders.push(orderId);
            localStorage.setItem('myOrders', JSON.stringify(myOrders));
        }

        // Send notifications
        await sendTelegramNotification(order);
        
        showToast(`অর্ডার সফলভাবে তৈরি হয়েছে! অর্ডার আইডি: ${orderId}`, 'success');
        return order;

    } catch (error) {
        console.error("Error creating order:", error);
        showToast('অর্ডার তৈরি করতে সমস্যা হয়েছে!', 'error');
        throw error;
    }
}

// Generate unique order ID
async function generateOrderId() {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1);
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${day}`;
    
    const counterRef = ref(database, `counters/${dateString}`);
    
    const result = await runTransaction(counterRef, (currentData) => {
        if (currentData === null) {
            return 1;
        } else {
            return currentData + 1;
        }
    });
    
    if (result.committed) {
        const orderNumber = String(result.snapshot.val()).padStart(3, '0');
        return `${year}${day}${month}${orderNumber}`;
    } else {
        throw new Error('Order ID generation failed');
    }
}

// Get order by ID
export async function getOrderById(orderId) {
    try {
        const orderRef = ref(database, `orders/${orderId}`);
        const snapshot = await get(orderRef);
        
        if (snapshot.exists()) {
            return { key: snapshot.key, ...snapshot.val() };
        } else {
            throw new Error('Order not found');
        }
    } catch (error) {
        console.error("Error getting order:", error);
        throw error;
    }
}

// Get user orders
export async function getUserOrders(userId) {
    try {
        const ordersRef = ref(database, 'orders');
        let userOrders = [];

        // Try new structure (userId field)
        const newOrdersQuery = query(ordersRef, orderByChild('userId'), equalTo(userId));
        const newOrdersSnapshot = await get(newOrdersQuery);
        
        if (newOrdersSnapshot.exists()) {
            newOrdersSnapshot.forEach(child => {
                userOrders.push({ key: child.key, ...child.val() });
            });
        }

        // Try old structure (userEmail field) for backward compatibility
        const user = await get(ref(database, `users/${userId}`));
        if (user.exists()) {
            const userEmail = user.val().email;
            const oldOrdersQuery = query(ordersRef, orderByChild('userEmail'), equalTo(userEmail));
            const oldOrdersSnapshot = await get(oldOrdersQuery);
            
            if (oldOrdersSnapshot.exists()) {
                oldOrdersSnapshot.forEach(child => {
                    // Avoid duplicates
                    if (!userOrders.some(order => order.key === child.key)) {
                        userOrders.push({ key: child.key, ...child.val() });
                    }
                });
            }
        }

        // Sort by order date (newest first)
        userOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        
        return userOrders;
    } catch (error) {
        console.error("Error getting user orders:", error);
        throw error;
    }
}

// Get guest orders from localStorage
export function getGuestOrders() {
    try {
        const orderIds = JSON.parse(localStorage.getItem('myOrders') || '[]');
        return orderIds;
    } catch (error) {
        console.error("Error getting guest orders:", error);
        return [];
    }
}

// Update order status (Admin function)
export async function updateOrderStatus(orderId, newStatus) {
    try {
        if (!Object.values(ORDER_STATUS).includes(newStatus)) {
            throw new Error('Invalid order status');
        }

        const orderRef = ref(database, `orders/${orderId}`);
        await update(orderRef, {
            status: newStatus,
            statusUpdatedAt: new Date().toISOString()
        });

        // Get updated order data for notification
        const order = await getOrderById(orderId);
        
        showToast(`অর্ডার স্ট্যাটাস আপডেট করা হয়েছে: ${getStatusText(newStatus)}`, 'success');
        return order;
    } catch (error) {
        console.error("Error updating order status:", error);
        showToast('অর্ডার স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে!', 'error');
        throw error;
    }
}

// Get all orders (Admin function)
export async function getAllOrders(limit = 50) {
    try {
        const ordersRef = ref(database, 'orders');
        const snapshot = await get(ordersRef);
        
        const orders = [];
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                orders.push({ key: child.key, ...child.val() });
            });
        }
        
        // Sort by order date (newest first) and limit results
        return orders
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
            .slice(0, limit);
    } catch (error) {
        console.error("Error getting all orders:", error);
        throw error;
    }
}

// Get orders by status
export async function getOrdersByStatus(status, limit = 50) {
    try {
        const ordersRef = ref(database, 'orders');
        const statusQuery = query(ordersRef, orderByChild('status'), equalTo(status));
        const snapshot = await get(statusQuery);
        
        const orders = [];
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                orders.push({ key: child.key, ...child.val() });
            });
        }
        
        // Sort by order date (newest first) and limit results
        return orders
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
            .slice(0, limit);
    } catch (error) {
        console.error("Error getting orders by status:", error);
        throw error;
    }
}

// Utility functions for order display
export function getStatusText(status) {
    const statusMap = {
        [ORDER_STATUS.PROCESSING]: 'প্রসেসিং',
        [ORDER_STATUS.CONFIRMED]: 'কনফার্মড',
        [ORDER_STATUS.PACKAGING]: 'প্যাকেজিং',
        [ORDER_STATUS.SHIPPED]: 'ডেলিভারি হয়েছে',
        [ORDER_STATUS.DELIVERED]: 'সম্পন্ন হয়েছে',
        [ORDER_STATUS.CANCELLED]: 'বাতিল হয়েছে',
        [ORDER_STATUS.FAILED]: 'ব্যর্থ'
    };
    return statusMap[status] || 'অজানা';
}

export function getStatusColor(status) {
    const colorMap = {
        [ORDER_STATUS.PROCESSING]: 'bg-yellow-100 text-yellow-800',
        [ORDER_STATUS.CONFIRMED]: 'bg-blue-100 text-blue-800',
        [ORDER_STATUS.PACKAGING]: 'bg-purple-100 text-purple-800',
        [ORDER_STATUS.SHIPPED]: 'bg-cyan-100 text-cyan-800',
        [ORDER_STATUS.DELIVERED]: 'bg-green-100 text-green-800',
        [ORDER_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
        [ORDER_STATUS.FAILED]: 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || colorMap[ORDER_STATUS.PROCESSING];
}

export function calculateProgress(status) {
    const progressMap = {
        [ORDER_STATUS.PROCESSING]: 0,
        [ORDER_STATUS.CONFIRMED]: 25,
        [ORDER_STATUS.PACKAGING]: 50,
        [ORDER_STATUS.SHIPPED]: 75,
        [ORDER_STATUS.DELIVERED]: 100,
        [ORDER_STATUS.CANCELLED]: 0,
        [ORDER_STATUS.FAILED]: 0
    };
    return progressMap[status] ?? 0;
}