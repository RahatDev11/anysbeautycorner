// =================================================================
// SECTION: NOTIFICATIONS PAGE LOGIC
// =================================================================

import { auth, onAuthStateChanged, database, ref, get } from '../modules/firebase-config.js';

function initializeNotificationsPage() {
    const notificationList = document.getElementById('notification-list');
    const loginPrompt = document.getElementById('loginPrompt');
    const loginButton = document.getElementById('loginButton');

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            window.loginWithGmail();
        });
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginPrompt.classList.add('hidden');
            notificationList.classList.remove('hidden');
            loadNotifications(user.uid);
        } else {
            loginPrompt.classList.remove('hidden');
            notificationList.classList.add('hidden');
        }
    });
}

async function loadNotifications(userId) {
    const notificationList = document.getElementById('notification-list');
    notificationList.innerHTML = '<p class="text-center text-gray-500 italic p-4">নোটিফিকেশন লোড হচ্ছে...</p>';

    const notificationsRef = ref(database, `notifications/${userId}`);
    try {
        const snapshot = await get(notificationsRef);
        if (snapshot.exists()) {
            const notifications = snapshot.val();
            displayNotifications(notifications);
        } else {
            notificationList.innerHTML = '<p class="text-center text-gray-500 italic p-4">আপনার কোনো নোটিফিকেশন নেই।</p>';
        }
    } catch (error) {
        console.error("Error loading notifications:", error);
        notificationList.innerHTML = '<p class="text-center text-red-500 italic p-4">নোটিফিকেশন লোড করতে সমস্যা হয়েছে।</p>';
    }
}

function displayNotifications(notifications) {
    const notificationList = document.getElementById('notification-list');
    let notificationsHtml = '';

    // Sort notifications by timestamp, newest first
    const sortedNotifications = Object.keys(notifications).map(key => ({ id: key, ...notifications[key] })).sort((a, b) => b.timestamp - a.timestamp);

    sortedNotifications.forEach(notification => {
        const isRead = notification.isRead ? 'bg-gray-100' : 'bg-white';
        const title = notification.title || ''
        const body = notification.body || ''
        const timestamp = new Date(notification.timestamp).toLocaleString('bn-BD');

        notificationsHtml += `
            <div class="${isRead} p-4 rounded-lg shadow-md mb-4 border-l-4 border-lipstick">
                <div class="flex justify-between items-center">
                    <h2 class="font-bold text-lg text-gray-800">${title}</h2>
                    <span class="text-xs text-gray-500">${timestamp}</span>
                </div>
                <p class="text-gray-600 mt-2">${body}</p>
            </div>
        `;
    });

    notificationList.innerHTML = notificationsHtml;
}

async function updateNotificationCountInHeader() {
    const notificationCountSpan = document.getElementById('notificationCount');
    if (!notificationCountSpan) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
        notificationCountSpan.classList.add('hidden');
        return;
    }

    const notificationsRef = ref(database, `notifications/${currentUser.uid}`);
    try {
        const snapshot = await get(notificationsRef);
        if (snapshot.exists()) {
            const notifications = snapshot.val();
            const unreadCount = Object.values(notifications).filter(n => !n.isRead).length;
            if (unreadCount > 0) {
                notificationCountSpan.textContent = unreadCount;
                notificationCountSpan.classList.remove('hidden');
            } else {
                notificationCountSpan.classList.add('hidden');
            }
        } else {
            notificationCountSpan.classList.add('hidden');
        }
    } catch (error) {
        console.error("Error updating notification count:", error);
        notificationCountSpan.classList.add('hidden');
    }
}

export { initializeNotificationsPage, updateNotificationCountInHeader };
