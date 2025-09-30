document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();
    const listaFavoritosDiv = document.getElementById('lista-favoritos');

    auth.onAuthStateChanged(user => {
        if (user) {
            carregarFavoritos(user.uid);
        } else {
            listaFavoritosDiv.innerHTML = `
                <div class="aviso-login">
                    <h3>Você precisa estar logado!</h3>
                    <p>Faça o login para ver seus produtos favoritos.</p>
                    <a href="auth-cliente/login.html" class="btn-principal" style="max-width: 250px;">Fazer Login</a>
                </div>
            `;
        }
    });

    function carregarFavoritos(userId) {
        const favoritosRef = db.collection('usuarios').doc(userId).collection('favoritos');
        
        favoritosRef.onSnapshot(async snapshot => {
            if (snapshot.empty) {
                listaFavoritosDiv.innerHTML = '<p>Você ainda não favoritou nenhum item.</p>';
                return;
            }

            listaFavoritosDiv.innerHTML = ''; // Limpa a lista antes de recarregar
            const docesPromises = [];

            snapshot.forEach(doc => {
                const doceId = doc.id;
                // Para cada favorito, buscamos os detalhes completos do produto
                docesPromises.push(db.collection('doces').doc(doceId).get());
            });

            const docesDocs = await Promise.all(docesPromises);

            docesDocs.forEach(doc => {
                if (doc.exists) {
                    const doce = { id: doc.id, ...doc.data() };
                    // Reutilizamos a mesma estrutura visual do cardápio
                    const doceElement = document.createElement('div');
                    doceElement.classList.add('doce-item', 'doce-clicavel');
                    doceElement.dataset.id = doce.id;
                    
                    doceElement.innerHTML = `
                        <div class="info-produto">
                            <h3>${doce.nome}</h3>
                            <p class="descricao">${doce.descricao || ''}</p>
                            <div class="detalhes-extras">
                                <span><i class="fa fa-user"></i> Serve 1 pessoa</span>
                            </div>
                            <p class="preco">R$ ${Number(doce.preco).toFixed(2)}</p>
                        </div>
                        <div class="imagem-container">
                            <img src="${doce.imagem}" alt="${doce.nome}" class="imagem-produto">
                        </div>
                    `;
                    listaFavoritosDiv.appendChild(doceElement);
                }
            });
        });
    }
});