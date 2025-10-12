// =================================================================
// SECTION: AUTHENTICATION
// =================================================================

import { auth, provider, database, ref, set, get, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from './firebase-config.js';
import { showToast } from './ui-utilities.js';

function getUserId() {
    if (auth && auth.currentUser) return auth.currentUser.uid;
    let userId = localStorage.getItem('tempUserId');
    if (!userId) {
        userId = 'guest_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('tempUserId', userId);
    }
    return userId;
};

async function isAdmin(userId) {
    if (!userId) return false;
    try {
        const adminRef = ref(database, `admins/${userId}`);
        const snapshot = await get(adminRef);
        return snapshot.exists();
    } catch (error) {
        return false;
    }
}

function loginWithGmail() {
    console.log("loginWithGmail called");
    signInWithPopup(auth, provider)
        .then(result => {
            const user = result.user;
            showToast(`স্বাগতম, ${user.displayName}`);
            saveUserToFirebase(user);
            updateLoginButton(user);
        })
        .catch(error => {
            console.error("Login failed:", error);
            showToast("লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।", "error");
            // Optionally, you can check error.code for specific Firebase errors
            // if (error.code === 'auth/popup-closed-by-user') {
            //     showToast("লগইন পপআপ বন্ধ করা হয়েছে।", "error");
            // }
        });
};

function updateLoginButton(user) {
    const mobileBtn = document.getElementById('mobileLoginButton');
    const desktopBtn = document.getElementById('desktopLoginButton');
    if (!mobileBtn || !desktopBtn) return;
    
    if (user) {
        const displayName = user.displayName || user.email.split('@')[0];
        const html = `
            <div class="relative group">
                <button class="flex items-center space-x-2 focus:outline-none">
                    ${user.photoURL ? `<img src="${user.photoURL}" class="w-8 h-8 rounded-full border-2 border-gray-300">` : `<div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">${displayName.charAt(0).toUpperCase()}</div>`}
                    <span class="text-black font-semibold">${displayName}</span>
                    <i class="fas fa-chevron-down text-gray-600 text-xs"></i>
                </button>
                <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-10">
                    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onclick="event.preventDefault(); window.confirmLogout();">লগআউট</a>
                </div>
            </div>
        `;
        mobileBtn.innerHTML = html;
        desktopBtn.innerHTML = html;
    } else {
        const html = `<button class="flex items-center" onclick="window.loginWithGmail()"><i class="fas fa-user-circle mr-2"></i><span class="text-black">লগইন</span></button>`;
        mobileBtn.innerHTML = `<button class="flex items-center w-full" onclick="window.loginWithGmail()"><i class="fas fa-user-circle mr-2"></i><span class="text-black font-semibold">লগইন</span></button>`;
        desktopBtn.innerHTML = html;
    }
};

function confirmLogout() {
    if (confirm("আপনি কি লগআউট করতে চান?")) logout();
}

function logout() {
    signOut(auth).then(() => {
        showToast("সফলভাবে লগআউট হয়েছেন।");
        updateLoginButton(null);
    });
}

function saveUserToFirebase(user) {
    const userRef = ref(database, `users/${user.uid}`);
    get(userRef).then(snapshot => {
        if (!snapshot.exists()) {
            set(userRef, { name: user.displayName, email: user.email, photoURL: user.photoURL, createdAt: new Date().toISOString() });
        }
    });
};

export {
    getUserId,
    loginWithGmail,
    updateLoginButton,
    confirmLogout,
    logout,
    saveUserToFirebase,
    onAuthStateChanged,
    isAdmin
};