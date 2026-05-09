importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyCVSzQS1c7H4BLhsDF_fW8wnqUN4B35LPA",
  authDomain: "nahid-6714.firebaseapp.com",
  databaseURL: "https://nahid-6714-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nahid-6714",
  storageBucket: "nahid-6714.appspot.com",
  messagingSenderId: "505741217147",
  appId: "1:505741217147:web:25ed4e9f0d00e3c4d381de"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.jpg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
