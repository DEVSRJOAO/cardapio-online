document.addEventListener('DOMContentLoaded', async () => {

    // --- ELEMENTOS DO DOM ---
    const listaDoces = document.getElementById('lista-doces');
    const itensCarrinho = document.getElementById('itens-carrinho');
    const totalPreco = document.getElementById('total-preco');
    const btnFinalizar = document.getElementById('finalizar-pedido');
    const btnEsvaziar = document.getElementById('esvaziar-carrinho');
    const filtrosContainer = document.getElementById('filtros-categoria');

    // --- ELEMENTOS DO MODAL (NOVO) ---
    const modal = document.getElementById('modal-produto');
    const modalOverlay = document.querySelector('.modal-overlay');
    const modalFechar = document.querySelector('.modal-fechar');
    const modalImagem = document.getElementById('modal-imagem');
    const modalNome = document.getElementById('modal-nome');
    const modalDescricao = document.getElementById('modal-descricao');
    const modalPreco = document.getElementById('modal-preco');
    const btnModalAdicionar = document.getElementById('btn-modal-adicionar');

    // --- DADOS E VARIÁVEIS GLOBAIS ---
    const docesCollection = db.collection('doces');
    let doces = []; // Armazenará TODOS os doces do Firebase
    let carrinho = [];
    const numeroWhatsApp = '559999863486';

    // --- FUNÇÕES DE CARREGAMENTO E RENDERIZAÇÃO ---
    async function carregarDocesDoFirebase() {
        try {
            const snapshot = await docesCollection.where('disponivel', '==', true).orderBy('categoria').orderBy('nome').get();
            snapshot.forEach(doc => {
                doces.push({ id: doc.id, ...doc.data() });
            });
            renderizarDoces(); // Renderiza todos os doces inicialmente
        } catch (error) {
            console.error("Erro ao carregar doces: ", error);
            if (error.code === 'failed-precondition') {
                alert("O banco de dados precisa de um índice. Por favor, clique no link no console (F12) para criá-lo.");
            }
        }
    }
    
    // ATUALIZADO: O botão agora é "Ver Detalhes" e tem a classe 'btn-detalhes'
    function renderizarDoces(categoria = 'todos') {
        listaDoces.innerHTML = '';
        const docesFiltrados = (categoria === 'todos') 
            ? doces 
            : doces.filter(doce => doce.categoria === categoria);

        docesFiltrados.forEach(doce => {
            const doceElement = document.createElement('div');
            doceElement.classList.add('doce-item');
            doceElement.innerHTML = `
                <img src="${doce.imagem}" alt="${doce.nome}">
                <h3>${doce.nome}</h3>
                <p class="descricao">${doce.descricao || ''}</p>
                <p class="preco">R$ ${Number(doce.preco).toFixed(2)}</p>
                <button class="btn-detalhes" data-id="${doce.id}">Ver Detalhes</button>
            `;
            listaDoces.appendChild(doceElement);
        });
    }

    // --- FUNÇÕES DO MODAL (NOVO) ---
    function abrirModal(idDoce) {
        const doce = doces.find(d => d.id === idDoce);
        if (!doce) return;

        // Preenche o modal com as informações do doce
        modalImagem.src = doce.imagem;
        modalNome.textContent = doce.nome;
        modalDescricao.textContent = doce.descricao;
        modalPreco.textContent = `R$ ${Number(doce.preco).toFixed(2)}`;
        
        // Passa o ID do doce para o botão de adicionar do modal
        btnModalAdicionar.dataset.id = doce.id;

        // Mostra o modal
        modal.classList.add('active');
    }

    function fecharModal() {
        modal.classList.remove('active');
    }

    // --- FUNÇÕES DO CARRINHO ---
    // ATUALIZADO: A função agora recebe o ID do doce diretamente, em vez de um evento
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
            return;
        }
        itensCarrinho.innerHTML = '';
        let total = 0;
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
        });
        totalPreco.textContent = total.toFixed(2);
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
        if (confirm("Tem certeza que deseja esvaziar o carrinho?")) {
            carrinho = [];
            renderizarCarrinho();
        }
    }

    function finalizarPedido() {
        if (carrinho.length === 0) {
            alert('Seu carrinho está vazio!'); return;
        }
        let mensagem = 'Olá! Gostaria de fazer o seguinte pedido:\n\n';
        let totalPedido = 0;
        carrinho.forEach(item => {
            mensagem += `*${item.quantidade}x* ${item.nome} - R$ ${(item.preco * item.quantidade).toFixed(2)}\n`;
            totalPedido += item.preco * item.quantidade;
        });
        mensagem += `\n*Total do Pedido: R$ ${totalPedido.toFixed(2)}*`;
        const mensagemCodificada = encodeURIComponent(mensagem);
        const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`;
        window.open(urlWhatsApp, '_blank');
    }

    // --- EVENT LISTENERS ---
    // ATUALIZADO: O listener da lista de doces agora procura pelo 'btn-detalhes' para abrir o modal
    listaDoces.addEventListener('click', (evento) => {
        if (evento.target.classList.contains('btn-detalhes')) {
            const doceId = evento.target.dataset.id;
            abrirModal(doceId);
        }
    });

    // Listeners que não mudam
    btnFinalizar.addEventListener('click', finalizarPedido);
    itensCarrinho.addEventListener('click', manipularCarrinho);
    btnEsvaziar.addEventListener('click', esvaziarCarrinho);
    filtrosContainer.addEventListener('click', (evento) => {
        if (evento.target.classList.contains('filtro-btn')) {
            filtrosContainer.querySelector('.active').classList.remove('active');
            evento.target.classList.add('active');
            const categoriaSelecionada = evento.target.dataset.categoria;
            renderizarDoces(categoriaSelecionada);
        }
    });

    // NOVOS LISTENERS PARA O MODAL
    modalFechar.addEventListener('click', fecharModal);
    modalOverlay.addEventListener('click', fecharModal);
    btnModalAdicionar.addEventListener('click', () => {
        const doceId = btnModalAdicionar.dataset.id;
        adicionarAoCarrinho(doceId);
        fecharModal(); // Fecha o modal após adicionar
    });

    // --- INICIALIZAÇÃO ---
    await carregarDocesDoFirebase();
});