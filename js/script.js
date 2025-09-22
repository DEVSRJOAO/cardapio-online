document.addEventListener('DOMContentLoaded', async () => {

    // --- ELEMENTOS DO DOM ---
    const listaDoces = document.getElementById('lista-doces');
    const carrinhoPainel = document.querySelector('.carrinho');
    const itensCarrinho = document.getElementById('itens-carrinho');
    const totalPreco = document.getElementById('total-preco');
    const btnFinalizar = document.getElementById('finalizar-pedido');
    const btnEsvaziar = document.getElementById('esvaziar-carrinho');
    const filtrosContainer = document.getElementById('filtros-categoria');
    const tituloCategoria = document.getElementById('titulo-categoria');
    const userInfoDiv = document.getElementById('user-info');
    const iconeCarrinho = document.getElementById('icone-carrinho');
    const contadorCarrinho = document.getElementById('contador-carrinho');
    const carrinhoFechar = document.querySelector('.carrinho-fechar');
    const overlay = document.getElementById('overlay-geral');
    const modal = document.getElementById('modal-produto');
    const modalFechar = document.querySelector('.modal-fechar');
    const modalImagem = document.getElementById('modal-imagem');
    const modalNome = document.getElementById('modal-nome');
    const modalDescricao = document.getElementById('modal-descricao');
    const modalPreco = document.getElementById('modal-preco');
    const btnModalAdicionar = document.getElementById('btn-modal-adicionar');
    const displayEndereco = document.getElementById('display-endereco');

    // --- DADOS E VARIÁVEIS GLOBAIS ---
    const db = firebase.firestore();
    const auth = firebase.auth();
    const docesCollection = db.collection('doces');
    let doces = [];
    let carrinho = [];
    let usuarioLogado = null;
    let enderecoUsuario = null;
    const numeroWhatsApp = '559999863486';

    // --- FUNÇÕES DE CONTROLE DO CARRINHO E MODAL ---
    function abrirCarrinho() {
        carrinhoPainel.classList.add('aberto');
        overlay.classList.add('visible');
    }

    function fecharCarrinho() {
        carrinhoPainel.classList.remove('aberto');
        overlay.classList.remove('visible');
    }
    
    function abrirModal(idDoce) {
        const doce = doces.find(d => d.id === idDoce);
        if (!doce) return;
        modalImagem.src = doce.imagem;
        modalNome.textContent = doce.nome;
        modalDescricao.textContent = doce.descricao;
        modalPreco.textContent = `R$ ${Number(doce.preco).toFixed(2)}`;
        btnModalAdicionar.dataset.id = doce.id;
        modal.classList.add('active');
        overlay.classList.add('visible');
    }

    function fecharModal() {
        modal.classList.remove('active');
        overlay.classList.remove('visible');
    }

    // --- FUNÇÕES DE AUTENTICAÇÃO E DADOS DO USUÁRIO ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            usuarioLogado = user;
            userInfoDiv.innerHTML = `
                <a href="perfil/" class="auth-link" title="Meu Perfil"><i class="fa fa-user-circle"></i></a>
                <button id="btn-logout" class="btn-logout" title="Sair"><i class="fa fa-sign-out-alt"></i></button>
            `;
            document.getElementById('btn-logout').addEventListener('click', () => { auth.signOut(); });
            await carregarEnderecoDoUsuario(user.uid);
        } else {
            usuarioLogado = null;
            enderecoUsuario = null;
            userInfoDiv.innerHTML = `
                <a href="auth-cliente/login.html" class="auth-link" title="Login / Cadastrar"><i class="fa fa-user"></i></a>
            `;
            displayEndereco.classList.remove('visible');
        }
    });

    async function carregarEnderecoDoUsuario(uid) {
        try {
            const userDoc = await db.collection('usuarios').doc(uid).get();
            if (userDoc.exists && userDoc.data().endereco) {
                enderecoUsuario = userDoc.data().endereco;
                const { rua, numero, bairro } = enderecoUsuario;
                displayEndereco.innerHTML = `
                    <p><strong>Entregar em:</strong></p>
                    <p>${rua}, ${numero} - ${bairro}</p>
                    <a href="perfil/">Alterar ou ver completo</a>
                `;
            } else {
                enderecoUsuario = null;
                displayEndereco.innerHTML = `
                    <p>Nenhum endereço cadastrado.</p>
                    <a href="perfil/">Cadastrar endereço no perfil</a>
                `;
            }
        } catch (error) {
            console.error("Erro ao carregar endereço do usuário:", error);
            enderecoUsuario = null;
        }
    }

    // --- FUNÇÕES DE CARREGAMENTO E RENDERIZAÇÃO DE PRODUTOS ---
    async function carregarDocesDoFirebase() {
        try {
            const snapshot = await docesCollection.where('disponivel', '==', true).orderBy('categoria').orderBy('nome').get();
            snapshot.forEach(doc => {
                doces.push({ id: doc.id, ...doc.data() });
            });
            renderizarDoces();
        } catch (error) {
            console.error("Erro ao carregar doces: ", error);
            if (error.code === 'failed-precondition') {
                alert("O banco de dados precisa de um índice. Por favor, clique no link no console (F12) para criá-lo.");
            }
        }
    }
    
    function renderizarDoces(categoria = 'todos') {
        listaDoces.innerHTML = '';
        const docesFiltrados = (categoria === 'todos') 
            ? doces 
            : doces.filter(doce => doce.categoria === categoria);
        docesFiltrados.forEach(doce => {
            const doceElement = document.createElement('div');
            doceElement.classList.add('doce-item', 'doce-clicavel'); 
            doceElement.dataset.id = doce.id;
            doceElement.innerHTML = `
                <div class="info-produto">
                    <h3>${doce.nome}</h3>
                    <p class="descricao">${doce.descricao || ''}</p>
                    <p class="preco">R$ ${Number(doce.preco).toFixed(2)}</p>
                </div>
                <img src="${doce.imagem}" alt="${doce.nome}" class="imagem-produto">
            `;
            listaDoces.appendChild(doceElement);
        });
    }

    // --- FUNÇÕES DO CARRINHO ---
    function adicionarAoCarrinho(idDoce) {
        const doceSelecionado = doces.find(doce => doce.id === idDoce);
        if (!doceSelecionado) return;
        const itemExistente = carrinho.find(item => item.id === idDoce);
        if (itemExistente) {
            itemExistente.quantidade++;
        } else {
            carrinho.push({ ...doceSelecionado, quantidade: 1 });
        }
        renderizarCarrinho();
        alert(`${doceSelecionado.nome} foi adicionado ao carrinho!`);
    }

    function renderizarCarrinho() {
        if (carrinho.length === 0) {
            itensCarrinho.innerHTML = '<p>Seu carrinho está vazio.</p>';
            totalPreco.textContent = '0.00';
            contadorCarrinho.textContent = '0';
            contadorCarrinho.classList.remove('visible');
        } else {
            itensCarrinho.innerHTML = '';
            let total = 0;
            let totalItens = 0;
            carrinho.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('carrinho-item');
                itemElement.innerHTML = `
                    <div class="carrinho-item-info">
                        <span>${item.nome}</span>
                        <span class="preco-item">R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
                    </div>
                    <div class="carrinho-item-quantidade">
                        <span class="btn-qtd" data-id="${item.id}" data-acao="diminuir">-</span>
                        <span class="quantidade">${item.quantidade}</span>
                        <span class="btn-qtd" data-id="${item.id}" data-acao="aumentar">+</span>
                    </div>
                    <span class="btn-remover" data-id="${item.id}">🗑️</span>
                `;
                itensCarrinho.appendChild(itemElement);
                total += item.preco * item.quantidade;
                totalItens += item.quantidade;
            });
            totalPreco.textContent = total.toFixed(2);
            contadorCarrinho.textContent = totalItens;
            contadorCarrinho.classList.add('visible');
        }
    }
    
    function manipularCarrinho(evento) {
        const target = evento.target;
        if (target.classList.contains('btn-remover')) {
            removerDoCarrinho(target.getAttribute('data-id'));
        }
        if (target.classList.contains('btn-qtd')) {
            alterarQuantidade(target.getAttribute('data-id'), target.getAttribute('data-acao'));
        }
    }

    function removerDoCarrinho(idDoce) {
        carrinho = carrinho.filter(item => item.id !== idDoce);
        renderizarCarrinho();
    }
    
    function alterarQuantidade(idDoce, acao) {
        const item = carrinho.find(item => item.id === idDoce);
        if (!item) return;
        if (acao === 'aumentar') {
            item.quantidade++;
        } else if (acao === 'diminuir') {
            if (item.quantidade > 1) {
                item.quantidade--;
            } else {
                removerDoCarrinho(idDoce);
            }
        }
        renderizarCarrinho();
    }

    function esvaziarCarrinho() {
        if (carrinho.length === 0) { return; }
        if (confirm("Tem certeza que deseja esvaziar o carrinho?")) {
            carrinho = [];
            renderizarCarrinho();
        }
    }

    function finalizarPedido() {
        if (carrinho.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }

        const tipoEntrega = document.querySelector('input[name="entrega"]:checked').value;
        const formaPagamento = document.querySelector('input[name="pagamento"]:checked').value;
        let detalhesEntrega = 'Retirar no local';

        if (tipoEntrega === 'delivery') {
            if (usuarioLogado) {
                if (enderecoUsuario && enderecoUsuario.rua) {
                    const { rua, numero, bairro, cidade, complemento } = enderecoUsuario;
                    detalhesEntrega = `ENTREGA:\n${rua}, ${numero} - ${bairro}, ${cidade}. ${complemento || ''}`;
                } else {
                    alert("Você escolheu entrega, mas não tem um endereço cadastrado. Por favor, cadastre seu endereço no seu perfil.");
                    window.location.href = "perfil/";
                    return;
                }
            } else {
                alert("Você precisa estar logado para pedir entrega. Por favor, faça o login ou cadastre-se.");
                window.location.href = "auth-cliente/login.html";
                return;
            }
        }

        let mensagem = 'Olá! Gostaria de fazer o seguinte pedido:\n\n';
        let totalPedido = 0;
        
        carrinho.forEach(item => {
            mensagem += `*${item.quantidade}x* ${item.nome} - R$ ${(item.preco * item.quantidade).toFixed(2)}\n`;
            totalPedido += item.preco * item.quantidade;
        });

        mensagem += `\n*Total do Pedido: R$ ${totalPedido.toFixed(2)}*`;
        mensagem += `\n\n*Forma de Pagamento:* ${formaPagamento}`;
        mensagem += `\n*Opção de Entrega:* ${detalhesEntrega}`;
        if (usuarioLogado && usuarioLogado.displayName) {
             mensagem += `\n\n*Cliente:* ${usuarioLogado.displayName}`;
        }
        
        const mensagemCodificada = encodeURIComponent(mensagem);
        const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`;
        window.open(urlWhatsApp, '_blank');
        fecharCarrinho();
    }

    // --- EVENT LISTENERS ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            usuarioLogado = user;
            userInfoDiv.innerHTML = `
                <a href="perfil/" class="auth-link" title="Meu Perfil"><i class="fa fa-user-circle"></i></a>
                <button id="btn-logout" class="btn-logout" title="Sair"><i class="fa fa-sign-out-alt"></i></button>
            `;
            document.getElementById('btn-logout').addEventListener('click', () => { auth.signOut(); });
            await carregarEnderecoDoUsuario(user.uid);
        } else {
            usuarioLogado = null;
            enderecoUsuario = null;
            userInfoDiv.innerHTML = `
                <a href="auth-cliente/login.html" class="auth-link" title="Login / Cadastrar"><i class="fa fa-user"></i></a>
            `;
            document.querySelector('input[name="entrega"][value="retirar"]').checked = true;
            displayEndereco.classList.remove('visible');
        }
    });

    listaDoces.addEventListener('click', (e) => {
        const doceClicado = e.target.closest('.doce-clicavel');
        if (doceClicado) {
            abrirModal(doceClicado.dataset.id);
        }
    });

    btnFinalizar.addEventListener('click', finalizarPedido);
    itensCarrinho.addEventListener('click', manipularCarrinho);
    btnEsvaziar.addEventListener('click', esvaziarCarrinho);

    filtrosContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('filtro-btn')) {
            filtrosContainer.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            tituloCategoria.textContent = e.target.textContent;
            renderizarDoces(e.target.dataset.categoria);
        }
    });

    modalFechar.addEventListener('click', fecharModal);
    btnModalAdicionar.addEventListener('click', () => {
        adicionarAoCarrinho(btnModalAdicionar.dataset.id);
        fecharModal();
    });

    iconeCarrinho.addEventListener('click', abrirCarrinho);
    carrinhoFechar.addEventListener('click', fecharCarrinho);
    overlay.addEventListener('click', () => {
        fecharModal();
        fecharCarrinho();
    });

    document.querySelectorAll('input[name="entrega"]').forEach(radio => {
        radio.addEventListener('change', (evento) => {
            if (evento.target.value === 'delivery') {
                displayEndereco.classList.add('visible');
            } else {
                displayEndereco.classList.remove('visible');
            }
        });
    });

    // --- INICIALIZAÇÃO ---
    await carregarDocesDoFirebase();
    renderizarCarrinho();
});