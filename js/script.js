document.addEventListener('DOMContentLoaded', async () => {

    // --- ELEMENTOS DO DOM ---
    const listaDoces = document.getElementById('lista-doces');
    const filtrosContainer = document.getElementById('filtros-categoria');
    const tituloCategoria = document.getElementById('titulo-categoria');
    const modal = document.getElementById('modal-produto');
    const userInfoDiv = document.getElementById('user-info');
    const overlay = document.getElementById('overlay-geral');
    const contadorCarrinhoEl = document.getElementById('contador-carrinho');

    // Elementos do NOVO Carrinho
    const carrinhoContainer = document.getElementById('carrinho-container');
    const btnAbrirCarrinho = document.getElementById('icone-carrinho');
    const btnAbrirCarrinhoNav = document.getElementById('nav-carrinho-btn');
    const btnFecharCarrinho = document.getElementById('carrinho-fechar-novo');
    const carrinhoVazioDiv = document.getElementById('carrinho-vazio');
    const carrinhoCheioDiv = document.getElementById('carrinho-cheio');
    const itensCarrinhoNovo = document.getElementById('itens-carrinho-novo');
    const valorProdutosEl = document.getElementById('valor-produtos');
    const valorEntregaEl = document.getElementById('valor-entrega');
    const valorTotalCarrinhoEl = document.getElementById('valor-total-carrinho');
    const btnFinalizarNovo = document.getElementById('btn-finalizar-novo');
    const tipoPedidoToggle = document.getElementById('tipo-pedido-toggle');
    const secaoEnderecoCarrinho = document.getElementById('secao-endereco-carrinho');
    const enderecosListaHorizontal = document.getElementById('enderecos-lista-horizontal');
    const voltarLojaBtn = document.getElementById('voltar-loja-btn');

    // Elementos do Modal
    let modalFecharNovo, modalImagemFundo, modalNome, modalDescricao, modalPreco, modalObservacao, modalBtnDiminuir, modalQuantidade, modalBtnAumentar, modalAddPreco, btnModalAdicionar;
    if (modal) {
        modalFecharNovo = document.querySelector('.modal-fechar-novo');
        modalImagemFundo = document.getElementById('modal-imagem-fundo');
        modalNome = document.getElementById('modal-nome');
        modalDescricao = document.getElementById('modal-descricao');
        modalPreco = document.getElementById('modal-preco');
        modalObservacao = document.getElementById('modal-observacao');
        modalBtnDiminuir = document.getElementById('modal-diminuir-qtd');
        modalQuantidade = document.getElementById('modal-quantidade');
        modalBtnAumentar = document.getElementById('modal-aumentar-qtd');
        modalAddPreco = document.getElementById('modal-add-preco');
        btnModalAdicionar = document.getElementById('btn-modal-adicionar');
    }

    // --- DADOS E VARIÁVEIS GLOBAIS ---
    const db = firebase.firestore();
    const auth = firebase.auth();
    const docesCollection = db.collection('doces');
    let doces = [];
    let carrinho = JSON.parse(localStorage.getItem('doceriaCarrinho')) || [];
    let usuarioLogado = null;
    let taxaEntregaFixa = 5.00;
    let tipoPedidoSelecionado = 'Entrega';
    let enderecoSelecionadoId = null;
    const numeroWhatsApp = '559999863486';
    let quantidadeModal = 1;
    let precoUnitarioModal = 0;

    // --- FUNÇÕES DE CONTROLE (GLOBAIS) ---
    function salvarCarrinho() {
        localStorage.setItem('doceriaCarrinho', JSON.stringify(carrinho));
    }

  async function abrirCarrinho() {
    if (carrinhoContainer) {
        await renderizarCarrinho();
        carrinhoContainer.classList.add('aberto');
    }
}

function fecharCarrinho() {
    if (carrinhoContainer) {
        carrinhoContainer.classList.remove('aberto');
    }
}
    function abrirModal(idDoce) {
        const doce = doces.find(d => d.id === idDoce);
        if (!doce || !modal) return;
        quantidadeModal = 1;
        precoUnitarioModal = doce.preco;
        modalImagemFundo.style.backgroundImage = `url(${doce.imagem})`;
        modalNome.textContent = doce.nome;
        modalDescricao.textContent = doce.descricao;
        modalObservacao.value = '';
        atualizarFooterModal();
        btnModalAdicionar.dataset.id = doce.id;
        modal.classList.add('active');
        if (overlay) overlay.classList.add('visible');
    }

    function fecharModal() {
        if (modal) modal.classList.remove('active');
        if (!carrinhoContainer || !carrinhoContainer.classList.contains('aberto')) {
            if (overlay) overlay.classList.remove('visible');
        }
    }

    function atualizarFooterModal() {
        if (!modal) return;
        modalQuantidade.textContent = quantidadeModal;
        modalAddPreco.textContent = `R$ ${(precoUnitarioModal * quantidadeModal).toFixed(2)}`;
    }

    // --- FUNÇÕES DE AUTENTICAÇÃO E DADOS DO USUÁRIO ---
    auth.onAuthStateChanged((user) => {
        usuarioLogado = user;
        if (user) {
            userInfoDiv.innerHTML = `<a href="perfil/" class="auth-link" title="Meu Perfil"><i class="fa fa-user-circle"></i></a>`;
        } else {
            userInfoDiv.innerHTML = `<a href="auth-cliente/login.html" class="auth-link" title="Login / Cadastrar"><i class="fa fa-user"></i></a>`;
        }
        renderizarCarrinho();
    });

    // --- FUNÇÕES DE CARREGAMENTO E RENDERIZAÇÃO DE PRODUTOS ---
    async function carregarDocesDoFirebase() {
        try {
            const snapshot = await docesCollection.where('disponivel', '==', true).orderBy('nome').get();
            doces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderizarDoces();
        } catch (error) {
            console.error("Erro ao carregar doces: ", error);
        }
    }

    function renderizarDoces(categoria = 'todos') {
        if (!listaDoces) return;
        listaDoces.innerHTML = '';
        const docesFiltrados = (categoria === 'todos') ? doces : doces.filter(doce => doce.categoria === categoria);

        if (docesFiltrados.length === 0) {
            listaDoces.innerHTML = '<p style="text-align: center; color: #888;">Nenhum produto encontrado nesta categoria.</p>';
            return;
        }

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
    function adicionarAoCarrinho(idDoce, quantidade, observacao) {
        const doceSelecionado = doces.find(doce => doce.id === idDoce);
        if (!doceSelecionado) return;
        const carrinhoId = Date.now().toString();
        carrinho.push({ ...doceSelecionado, quantidade: quantidade, observacao: observacao.trim(), carrinhoId: carrinhoId });
        renderizarCarrinho();
        salvarCarrinho();
        Swal.fire({ icon: 'success', title: 'Adicionado!', text: `${doceSelecionado.nome} foi colocado no carrinho.`, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true });
    }

    async function renderizarCarrinho() {
        if (!carrinhoContainer) return;

        const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
        if (contadorCarrinhoEl) {
            if (totalItens > 0) {
                contadorCarrinhoEl.textContent = totalItens;
                contadorCarrinhoEl.classList.add('visible');
            } else {
                contadorCarrinhoEl.classList.remove('visible');
            }
        }

        if (carrinho.length === 0) {
            carrinhoVazioDiv.classList.add('visivel');
            carrinhoCheioDiv.classList.remove('visivel');
        } else {
            carrinhoVazioDiv.classList.remove('visivel');
            carrinhoCheioDiv.classList.add('visivel');
            itensCarrinhoNovo.innerHTML = '';

            carrinho.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('item-carrinho-card');
                itemElement.dataset.id = item.carrinhoId;
                let obsHTML = item.observacao ? `<p class="item-obs">Obs: ${item.observacao}</p>` : '';
                itemElement.innerHTML = `
                    <div class="item-header">
                        <span class="item-nome">${item.quantidade}x ${item.nome}</span>
                        <div class="header-direita-item">
                            <span class="item-preco-header">R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
                            <i class="fa fa-chevron-down"></i>
                        </div>
                    </div>
                    <div class="item-body">
                        ${obsHTML}
                        <div class="item-controles">
                             <button class="btn-remover-item" data-id="${item.carrinhoId}">Remover</button>
                            <div class="item-quantidade">
                                <button class="btn-qtd-carrinho" data-id="${item.carrinhoId}" data-acao="diminuir">-</button>
                                <span>${item.quantidade}</span>
                                <button class="btn-qtd-carrinho" data-id="${item.carrinhoId}" data-acao="aumentar">+</button>
                            </div>
                        </div>
                    </div>
                `;
                itensCarrinhoNovo.appendChild(itemElement);
            });
            await carregarEnderecosNoCarrinho();
            atualizarValores();
        }
    }

    async function carregarEnderecosNoCarrinho() {
        if (!usuarioLogado) {
            secaoEnderecoCarrinho.style.display = 'none';
            return;
        }
        secaoEnderecoCarrinho.style.display = 'block';
        enderecosListaHorizontal.innerHTML = '';
        const enderecosSnapshot = await db.collection('usuarios').doc(usuarioLogado.uid).collection('enderecos').get();
        if (enderecosSnapshot.empty) {
            enderecosListaHorizontal.innerHTML = `<p>Nenhum endereço cadastrado.</p>`;
        } else {
            enderecosSnapshot.forEach(doc => {
                const endereco = doc.data();
                const id = doc.id;
                const card = document.createElement('div');
                card.classList.add('endereco-card-carrinho');
                card.dataset.id = id;
                card.innerHTML = `
                    <strong><i class="fa fa-map-marker-alt"></i> ${endereco.apelido}</strong>
                    <p>${endereco.rua}, ${endereco.numero}</p>
                `;
                if (id === enderecoSelecionadoId) {
                    card.classList.add('selecionado');
                }
                enderecosListaHorizontal.appendChild(card);
            });
        }
    }

    function atualizarValores() {
        const subtotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
        let entrega = 0;
        if (tipoPedidoSelecionado === 'Entrega' && enderecoSelecionadoId) {
            entrega = taxaEntregaFixa;
        }
        const total = subtotal + entrega;
        valorProdutosEl.textContent = `R$ ${subtotal.toFixed(2)}`;
        valorEntregaEl.textContent = `R$ ${entrega.toFixed(2)}`;
        valorTotalCarrinhoEl.textContent = `R$ ${total.toFixed(2)}`;
    }

    function alterarQuantidade(carrinhoId, acao) {
        const itemIndex = carrinho.findIndex(item => item.carrinhoId === carrinhoId);
        if (itemIndex === -1) return;

        if (acao === 'aumentar') {
            carrinho[itemIndex].quantidade++;
        } else if (acao === 'diminuir') {
            if (carrinho[itemIndex].quantidade > 1) {
                carrinho[itemIndex].quantidade--;
            } else {
                carrinho.splice(itemIndex, 1);
            }
        }
        renderizarCarrinho();
        salvarCarrinho();
    }

    async function finalizarPedido() {
        if (carrinho.length === 0) return Swal.fire('Carrinho Vazio', 'Adicione itens para continuar.', 'warning');
        if (tipoPedidoSelecionado === 'Entrega' && !enderecoSelecionadoId) return Swal.fire('Endereço Necessário', 'Por favor, selecione um endereço para entrega.', 'warning');

        // A lógica de salvar e enviar para o WhatsApp será a Fase 4 do nosso plano.
        // Por enquanto, vamos simular a navegação para a página de pagamento.
        localStorage.setItem('doceriaPedidoFinal', JSON.stringify({
            carrinho: carrinho,
            tipoEntrega: tipoPedidoSelecionado,
            enderecoId: enderecoSelecionadoId,
            taxaEntrega: (tipoPedidoSelecionado === 'Entrega' && enderecoSelecionadoId) ? taxaEntregaFixa : 0
        }));
        window.location.href = 'pagamento.html'; // Vamos criar esta página na próxima fase
    }

    // --- EVENT LISTENERS ---
    if (btnAbrirCarrinho) btnAbrirCarrinho.addEventListener('click', abrirCarrinho);
    if (btnAbrirCarrinhoNav) btnAbrirCarrinhoNav.addEventListener('click', abrirCarrinho);
    if (btnFecharCarrinho) btnFecharCarrinho.addEventListener('click', fecharCarrinho);
    if (voltarLojaBtn) voltarLojaBtn.addEventListener('click', fecharCarrinho);
    if (btnFinalizarNovo) btnFinalizarNovo.addEventListener('click', finalizarPedido);

    itensCarrinhoNovo.addEventListener('click', (e) => {
        const target = e.target;
        const card = target.closest('.item-carrinho-card');
        if (!card) return;

        if (target.closest('.item-header')) {
            card.classList.toggle('expandido');
        }
        if (target.classList.contains('btn-qtd-carrinho')) {
            const id = target.dataset.id;
            const acao = target.dataset.acao;
            alterarQuantidade(id, acao);
        }
        if (target.classList.contains('btn-remover-item')) {
            const id = target.dataset.id;
            carrinho = carrinho.filter(i => i.carrinhoId !== id);
            renderizarCarrinho();
            salvarCarrinho();
        }
    });

    tipoPedidoToggle.addEventListener('click', (e) => {
        const label = e.target.closest('.toggle-label');
        if (!label) return;
        tipoPedidoToggle.querySelector('.active').classList.remove('active');
        label.classList.add('active');
        tipoPedidoSelecionado = label.dataset.valor;
        if (tipoPedidoSelecionado === 'Retirada') {
            secaoEnderecoCarrinho.style.display = 'none';
            enderecoSelecionadoId = null;
            const selecionado = enderecosListaHorizontal.querySelector('.selecionado');
            if (selecionado) selecionado.classList.remove('selecionado');
        } else {
            secaoEnderecoCarrinho.style.display = 'block';
        }
        atualizarValores();
    });

    enderecosListaHorizontal.addEventListener('click', (e) => {
        const card = e.target.closest('.endereco-card-carrinho');
        if (!card) return;
        const selecionadoAnterior = enderecosListaHorizontal.querySelector('.selecionado');
        if (selecionadoAnterior) selecionadoAnterior.classList.remove('selecionado');
        card.classList.add('selecionado');
        enderecoSelecionadoId = card.dataset.id;
        atualizarValores();
    });

    if (listaDoces) {
        listaDoces.addEventListener('click', (e) => {
            const doceClicado = e.target.closest('.doce-clicavel');
            if (doceClicado) {
                abrirModal(doceClicado.dataset.id);
            }
        });
    }

    if (filtrosContainer) {
        filtrosContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filtro-btn')) {
                filtrosContainer.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                tituloCategoria.textContent = e.target.textContent;
                renderizarDoces(e.target.dataset.categoria);
            }
        });
    }

    if (modal) {
        modalFecharNovo.addEventListener('click', fecharModal);
        btnModalAdicionar.addEventListener('click', () => {
            adicionarAoCarrinho(btnModalAdicionar.dataset.id, quantidadeModal, modalObservacao.value);
            fecharModal();
        });
        modalBtnAumentar.addEventListener('click', () => {
            quantidadeModal++;
            atualizarFooterModal();
        });
        modalBtnDiminuir.addEventListener('click', () => {
            if (quantidadeModal > 1) {
                quantidadeModal--;
                atualizarFooterModal();
            }
        });
    }

    if (overlay) overlay.addEventListener('click', () => { fecharModal(); });

    // --- INICIALIZAÇÃO ---
    if (listaDoces) {
        await carregarDocesDoFirebase();
    }
    renderizarCarrinho();
});