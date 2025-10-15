// =================================================================
// SECTION: NOTIFICATIONS PAGE MANAGER
// =================================================================

import { auth, onAuthStateChanged } from '../modules/firebase-config.js';
import { loginWithGmail } from '../modules/auth-manager.js';

export function initializeNotificationsPage() {
    console.log('Initializing notifications page...');
    new NotificationDisplay();
}

class NotificationDisplay {
    constructor() {
        this.init();
    }

    async init() {
        await this.checkUserState();
        this.setupEventListeners();
        this.loadNotifications();
    }

    async checkUserState() {
        return new Promise((resolve) => {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    // লগইন করা ইউজার
                    document.getElementById('loggedInSection').classList.remove('hidden');
                    document.getElementById('guestSection').classList.add('hidden');
                } else {
                    // লগইন না করা ইউজার
                    document.getElementById('loggedInSection').classList.add('hidden');
                    document.getElementById('guestSection').classList.remove('hidden');
                }
                resolve(user);
            });
        });
    }

    setupEventListeners() {
        // নোটিফিকেশন অন বাটন
        document.getElementById('enableNotifications')?.addEventListener('click', () => {
            this.enableBrowserNotifications();
        });

        // সব পড়া হয়েছে মার্ক করুন
        document.getElementById('mark-all-read')?.addEventListener('click', () => {
            this.markAllAsRead();
        });
    }

    async loadNotifications() {
        const user = auth.currentUser;
        
        if (user) {
            // লগইন করা ইউজারের নোটিফিকেশন লোড করুন
            await this.loadUserNotifications(user.uid);
        } else {
            // লগইন না করা ইউজারের জন্য ব্রাউজার নোটিফিকেশন সেটআপ
            this.setupBrowserNotifications();
        }
    }

    async loadUserNotifications(userId) {
        try {
            // Firebase Realtime Database থেকে নোটিফিকেশন লোড করুন
            const notifications = await this.fetchUserNotifications(userId);
            this.displayNotifications(notifications);
        } catch (error) {
            console.error('নোটিফিকেশন লোড করতে সমস্যা:', error);
            this.displayNotifications([]);
        }
    }

    displayNotifications(notifications) {
        const container = document.getElementById('notification-list');
        const noNotificationsMsg = document.getElementById('no-notifications-message');

        if (!notifications || notifications.length === 0) {
            if (container) container.innerHTML = '';
            if (noNotificationsMsg) noNotificationsMsg.classList.remove('hidden');
            return;
        }

        if (noNotificationsMsg) noNotificationsMsg.classList.add('hidden');
        
        if (container) {
            container.innerHTML = notifications.map(notification => `
                <div class="bg-white p-4 rounded-lg shadow-md border-l-4 ${notification.read ? 'border-gray-300' : 'border-lipstick'}">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-800">${notification.title || 'নোটিফিকেশন'}</h3>
                            <p class="text-gray-600 mt-1">${notification.message || ''}</p>
                            <p class="text-sm text-gray-400 mt-2">${this.formatTime(notification.timestamp)}</p>
                        </div>
                        ${!notification.read ? '<span class="bg-lipstick text-white text-xs px-2 py-1 rounded-full">নতুন</span>' : ''}
                    </div>
                </div>
            `).join('');
        }
    }

    async markAllAsRead() {
        const user = auth.currentUser;
        if (!user) return;

        try {
            // Firebase-এ সব নোটিফিকেশন পড়া হয়েছে মার্ক করুন
            await this.updateAllNotificationsAsRead(user.uid);
            this.loadNotifications(); // রিফ্রেশ
        } catch (error) {
            console.error('নোটিফিকেশন আপডেট করতে সমস্যা:', error);
        }
    }

    setupBrowserNotifications() {
        // OneSignal বা ব্রাউজার নোটিফিকেশন সেটআপ
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                this.showNotificationEnabledMessage();
            }
        }
    }

    async enableBrowserNotifications() {
        if (!('Notification' in window)) {
            alert('আপনার ব্রাউজার নোটিফিকেশন সাপোর্ট করে না');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                this.showNotificationEnabledMessage();
                this.initializeOneSignal();
            } else if (permission === 'denied') {
                alert('নোটিফিকেশন পারমিশন ডিনাই করা হয়েছে। ব্রাউজার সেটিংস থেকে পারমিশন চালু করুন।');
            }
        } catch (error) {
            console.error('নোটিফিকেশন পারমিশন এরর:', error);
        }
    }

    showNotificationEnabledMessage() {
        const guestSection = document.getElementById('guestSection');
        if (guestSection) {
            guestSection.innerHTML = `
                <i class="fas fa-bell text-5xl text-green-500 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-800 mb-2">নোটিফিকেশন চালু হয়েছে!</h3>
                <p class="text-gray-600">আপনি এখন অর্ডার আপডেট এবং অফার সম্পর্কে নোটিফিকেশন পাবেন</p>
            `;
        }
    }

    initializeOneSignal() {
        // OneSignal ইনিশিয়ালাইজেশন
        if (window.OneSignal) {
            window.OneSignal.push(function() {
                window.OneSignal.init({
                    appId: "abd0b6b7-b1ce-487f-a877-eb07fce647cb", // আপনার OneSignal App ID দিন
                    allowLocalhostAsSecureOrigin: true,
                });
            });
        }
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        
        try {
            const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
            return date.toLocaleString('bn-BD', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '';
        }
    }

    // Firebase থেকে নোটিফিকেশন ফেচ করার মেথড
    async fetchUserNotifications(userId) {
        try {
            // Firebase Realtime Database ব্যবহার করুন
            const { ref, get, child } = await import('../modules/firebase-config.js');
            const notificationsRef = ref(child(ref, `notifications/${userId}`));
            
            const snapshot = await get(notificationsRef);
            
            if (snapshot.exists()) {
                const notificationsData = snapshot.val();
                return Object.keys(notificationsData).map(key => ({
                    id: key,
                    ...notificationsData[key]
                })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            }
            
            return [];
        } catch (error) {
            console.error('নোটিফিকেশন ফেচ করতে সমস্যা:', error);
            return [];
        }
    }

    async updateAllNotificationsAsRead(userId) {
        try {
            // Firebase-এ সব নোটিফিকেশন পড়া হয়েছে আপডেট করুন
            const { ref, update, child } = await import('../modules/firebase-config.js');
            const notificationsRef = ref(child(ref, `notifications/${userId}`));
            
            const snapshot = await get(notificationsRef);
            if (snapshot.exists()) {
                const updates = {};
                Object.keys(snapshot.val()).forEach(key => {
                    updates[`${userId}/${key}/read`] = true;
                });
                
                await update(ref, updates);
            }
        } catch (error) {
            console.error('নোটিফিকেশন আপডেট করতে সমস্যা:', error);
            throw error;
        }
    }
}

// গ্লোবাল ফাংশন এক্সপোর্ট
export function updateNotificationCountInHeader() {
    // হেডারে নোটিফিকেশন কাউন্ট আপডেট করার লজিক
    const user = auth.currentUser;
    if (!user) return;

    try {
        // Firebase থেকে আনরিড নোটিফিকেশন কাউন্ট করুন
        this.fetchUserNotifications(user.uid).then(notifications => {
            const unreadCount = notifications.filter(n => !n.read).length;
            const notificationBadge = document.getElementById('notificationBadge');
            
            if (notificationBadge) {
                if (unreadCount > 0) {
                    notificationBadge.textContent = unreadCount;
                    notificationBadge.classList.remove('hidden');
                } else {
                    notificationBadge.classList.add('hidden');
                }
            }
        });
    } catch (error) {
        console.error('নোটিফিকেশন কাউন্ট আপডেট করতে সমস্যা:', error);
    }
}