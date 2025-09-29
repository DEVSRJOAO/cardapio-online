// SUBSTITUA TODO O CONTEÚDO DE js/welcome.js POR ISTO:
document.addEventListener('DOMContentLoaded', () => {
    // Inicialize o Firebase (se ainda não estiver em firebase-config.js)
    // Se firebase-config.js já inicializa, esta parte pode ser mais simples.
    // Presumindo que firebase-config.js já foi carregado no HTML de boas-vindas.
    
    // Adicione os scripts do Firebase e a configuração no seu welcome.html
    // <script src="https://www.gstatic.com/firebasejs/9.6.7/firebase-app-compat.js"></script>
    // <script src="https://www.gstatic.com/firebasejs/9.6.7/firebase-firestore-compat.js"></script>
    // <script src="js/firebase-config.js"></script>
    // <script src="js/welcome.js"></script>
    
    // É crucial que seu welcome.html (agora index.html) tenha os scripts acima no final do <body>
    // para que a variável 'firebase' exista aqui.

    const db = firebase.firestore();

    const statusContainer = document.getElementById('status-loja');
    const statusTexto = document.getElementById('status-texto');
    const btnProsseguir = document.getElementById('btn-prosseguir');

    function verificarStatusLoja() {
        const configRef = db.collection('configuracoes').doc('loja');

        // Usa onSnapshot para ouvir em tempo real
        configRef.onSnapshot((doc) => {
            let lojaEstaAberta = false;
            if (doc.exists && doc.data().aberta === true) {
                lojaEstaAberta = true;
            }
            atualizarTela(lojaEstaAberta);
        }, (error) => {
            console.error("Erro ao buscar status da loja:", error);
            // Em caso de erro, assume que a loja está fechada.
            atualizarTela(false);
        });
    }

    function atualizarTela(lojaEstaAberta) {
        if (lojaEstaAberta) {
            statusTexto.textContent = 'Estamos Abertos!';
            statusContainer.className = 'status-container status-aberto';
            btnProsseguir.textContent = 'Ver Cardápio e Pedir';
        } else {
            statusTexto.textContent = 'Estamos Fechados!';
            statusContainer.className = 'status-container status-fechado';
            btnProsseguir.textContent = 'Ver Cardápio';
        }
    }

    // Inicia a verificação
    verificarStatusLoja();
});