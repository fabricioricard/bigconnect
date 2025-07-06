import firebase from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAhziJbG5Pxg0UYvq784YH4zXpsdKfh7AY",
  authDomain: "bigfoot-connect.firebaseapp.com",
  projectId: "bigfoot-connect",
  storageBucket: "bigfoot-connect.appspot.com",
  messagingSenderId: "177999879162",
  appId: "1:177999879162:web:a1ea739930cac97475e243"
};

firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const db = firebase.firestore();
