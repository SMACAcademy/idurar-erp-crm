const firebase = require('firebase/app');
require('firebase/storage');

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDAOM2s5fjOyUhgilSSd-hlRV_xm07aED8',
  authDomain: 'erpfiles-90455.firebaseapp.com',
  projectId: 'erpfiles-90455',
  storageBucket: 'erpfiles-90455.appspot.com',
  messagingSenderId: '845849145297',
  appId: '1:845849145297:web:b5aebde1f69324d6763af0',
  measurementId: 'G-C0TGWDSS8P',
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export the Firebase configuration
module.exports = { firebaseConfig };
