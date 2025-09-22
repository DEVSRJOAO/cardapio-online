// firebase-config.js (VERSÃO CORRETA PARA O NOSSO PROJETO)

// Suas informações de configuração estão perfeitas.
const firebaseConfig = {
  apiKey: "AIzaSyBBIbAegrafXZS9_CKez0HfmYyqj_zDLtM",
  authDomain: "doceria-niquinho.firebaseapp.com",
  projectId: "doceria-niquinho",
  storageBucket: "doceria-niquinho.firebasestorage.app",
  messagingSenderId: "1088708351464",
  appId: "1:1088708351464:web:5a746233d1553d4451005d",
  measurementId: "G-HZCX626JF6"
};

// Inicializa o Firebase usando a sintaxe de compatibilidade.
// Ele vai procurar pelo objeto 'firebase' que foi carregado pelos scripts no HTML.
firebase.initializeApp(firebaseConfig);

// Cria a variável 'db' que o admin.js e o script.js precisam para funcionar.
const db = firebase.firestore();
const storage = firebase.storage();