// js/firebase-config.js - VERSÃO CORRIGIDA

const firebaseConfig = {
  apiKey: "AIzaSyBBIbAegrafXZS9_CKez0HfmYyqj_zDLtM",
  authDomain: "doceria-niquinho.firebaseapp.com",
  projectId: "doceria-niquinho",
  storageBucket: "doceria-niquinho.appspot.com", // CORREÇÃO AQUI
  messagingSenderId: "1088708351464",
  appId: "1:1088708351464:web:5a746233d1553d4451005d",
  measurementId: "G-HZCX626JF6"
};

firebase.initializeApp(firebaseConfig);

// Inicializa os serviços SÓ SE eles estiverem disponíveis
const db = typeof firebase.firestore === 'function' ? firebase.firestore() : null;
const storage = typeof firebase.storage === 'function' ? firebase.storage() : null;