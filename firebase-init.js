/* ============================================
   SECURENCE — Firebase Initialization (Centralized)
   Single source of truth for Firebase config.
   Load BEFORE any script that uses `db`.
   ============================================ */
(function () {
    'use strict';

    // Prevent double-init if loaded on the same page more than once
    if (window._securenceFirebaseReady) return;

    var config = {
        apiKey: "AIzaSyAjPi-bKW8vrlDlDhZiOgN5NDDe-QKG84I",
        authDomain: "nce-web.firebaseapp.com",
        projectId: "nce-web",
        storageBucket: "nce-web.firebasestorage.app",
        messagingSenderId: "935647667030",
        appId: "1:935647667030:web:d7a976a6793edcc368ecf7"
    };

    // Only init if Firebase SDK is loaded
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length === 0) {
        firebase.initializeApp(config);
    }

    // Expose Firestore globally
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        window.db = firebase.firestore();
    }

    window._securenceFirebaseReady = true;
})();
