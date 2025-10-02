<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>নোটিফিকেশন - Any's Beauty Corner</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="styles.css">
</head>
<body class="bg-gray-50">
    <!-- হেডার -->
    <div id="header"></div>

    <!-- মেইন কন্টেন্ট -->
    <main class="container mx-auto pt-20 pb-8 px-4 min-h-screen">
        <h1 class="text-3xl font-bold text-center mb-8 text-lipstick">আপনার নোটিফিকেশন</h1>

        <div id="loadingIndicator" class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-lipstick"></i>
            <p class="mt-2 text-gray-600">লোড হচ্ছে...</p>
        </div>

        <div id="loginPrompt" class="hidden text-center p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
            <p class="text-lg text-gray-700 mb-4">আপনার নোটিফিকেশনগুলো দেখতে অনুগ্রহ করে লগইন করুন।</p>
            <button id="loginButton" class="bg-lipstick text-white px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors">
                <i class="fab fa-google mr-2"></i> Google দিয়ে লগইন করুন
            </button>
        </div>

        <div id="notificationList" class="max-w-2xl mx-auto bg-white rounded-lg shadow-md divide-y divide-gray-200">
            <!-- নোটিফিকেশনগুলো এখানে জাভাস্ক্রিপ্ট দিয়ে দেখানো হবে -->
        </div>
    </main>

    <!-- ফুটার -->
    <div id="footer"></div>

    <!-- Firebase এবং স্ক্রিপ্ট -->
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
        import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
        import { getDatabase, ref, onValue, query, orderByChild, update } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

        const firebaseConfig = {
            apiKey: "AIzaSyCVSzQS1c7H4BLhsDF_fW8wnqUN4B35LPA",
            authDomain: "nahid-6714.firebaseapp.com",
            databaseURL: "https://nahid-6714-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "nahid-6714",
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const database = getDatabase(app);
        const provider = new GoogleAuthProvider();

        async function loadLayout() {
            try {
                const [headerRes, footerRes] = await Promise.all([fetch('header.html'), fetch('footer.html')]);
                document.getElementById('header').innerHTML = await headerRes.text();
                document.getElementById('footer').innerHTML = await footerRes.text();
                
                // header.html এর স্ক্রিপ্ট লোড করার জন্য অপেক্ষা করা
                // এটি নিশ্চিত করবে যে script.js এর ফাংশনগুলো পাওয়া যাবে
                const headerScript = document.createElement('script');
                headerScript.src = 'script.js';
                headerScript.type = 'module';
                document.body.appendChild(headerScript);
                
            } catch (error) {
                console.error("Layout load failed:", error);
            }
        }
        
        function formatTimeAgo(timestamp) {
            const now = Date.now();
            const seconds = Math.floor((now - timestamp) / 1000);
            if (seconds < 60) return `${seconds} সেকেন্ড আগে`;
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes} মিনিট আগে`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours} ঘণ্টা আগে`;
            const days = Math.floor(hours / 24);
            return `${days} দিন আগে`;
        }
        
        // নোটিফিকেশনকে 'read' হিসেবে মার্ক করার ফাংশন
        function markNotificationAsRead(userId, notificationKey) {
            const notifRef = ref(database, `notifications/${userId}/${notificationKey}`);
            update(notifRef, { isRead: true });
        }

        function displayNotifications(snapshot, userId) {
            const notificationList = document.getElementById('notificationList');
            notificationList.innerHTML = '';

            if (!snapshot.exists()) {
                notificationList.innerHTML = '<p class="text-center text-gray-500 p-8">আপনার কোনো নোটিফিকেশন নেই।</p>';
                return;
            }

            const notifications = [];
            snapshot.forEach(childSnapshot => {
                notifications.push({ key: childSnapshot.key, ...childSnapshot.val() });
            });

            notifications.reverse().forEach(notif => {
                const notifElement = document.createElement('a');
                notifElement.href = `order-track.html?orderId=${notif.orderId}`;
                notifElement.className = `block p-4 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50 font-semibold' : ''}`;
                
                notifElement.innerHTML = `
                    <div class="flex items-start">
                        <div class="mr-4 pt-1">
                            <i class="fas fa-bell text-xl ${!notif.isRead ? 'text-blue-500' : 'text-gray-400'}"></i>
                        </div>
                        <div class="flex-grow">
                            <p class="text-gray-800">${notif.message}</p>
                            <p class="text-sm text-gray-500 mt-1 font-normal">${formatTimeAgo(notif.timestamp)}</p>
                        </div>
                        ${!notif.isRead ? '<div class="w-2.5 h-2.5 bg-blue-500 rounded-full ml-2 mt-1.5"></div>' : ''}
                    </div>
                `;
                
                // নোটিফিকেশনে ক্লিক করলে সেটিকে 'read' হিসেবে মার্ক করা হবে
                notifElement.addEventListener('click', (e) => {
                    if (!notif.isRead) {
                        markNotificationAsRead(userId, notif.key);
                    }
                });

                notificationList.appendChild(notifElement);
            });
        }

        document.addEventListener("DOMContentLoaded", async () => {
            await loadLayout();
            const loadingIndicator = document.getElementById('loadingIndicator');
            const loginPrompt = document.getElementById('loginPrompt');

            onAuthStateChanged(auth, (user) => {
                loadingIndicator.style.display = 'none';
                if (user) {
                    loginPrompt.style.display = 'none';
                    const notificationsRef = query(ref(database, `notifications/${user.uid}`), orderByChild('timestamp'));
                    onValue(notificationsRef, (snapshot) => displayNotifications(snapshot, user.uid));
                } else {
                    document.getElementById('notificationList').innerHTML = '';
                    loginPrompt.style.display = 'block';
                    document.getElementById('loginButton').onclick = () => signInWithPopup(auth, provider);
                }
            });
        });
    </script>
</body>
</html>