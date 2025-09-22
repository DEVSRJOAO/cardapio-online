document.addEventListener('DOMContentLoaded', async () => {

    // --- ELEMENTOS DO DOM (adicionamos o novo botão) ---
    const listaDoces = document.getElementById('lista-doces');
    const itensCarrinho = document.getElementById('itens-carrinho');
    const totalPreco = document.getElementById('total-preco');
    const btnFinalizar = document.getElementById('finalizar-pedido');
    const btnEsvaziar = document.getElementById('esvaziar-carrinho'); // NOVO

    // --- DADOS E VARIÁVEIS GLOBAIS ---
    const docesCollection = db.collection('doces');
    let doces = [];
    let carrinho = [];
    const numeroWhatsApp = '559999863486';

    // --- FUNÇÕES DE CARREGAMENTO ---
    async function carregarDocesDoFirebase() {
        try {
            const snapshot = await docesCollection.where('disponivel', '==', true).orderBy('nome').get();
            snapshot.forEach(doc => {
                doces.push({ id: doc.id, ...doc.data() });
            });
            renderizarDoces();
        } catch (error) {
            console.error("Erro ao carregar doces: ", error);
        }
    }

    function renderizarDoces() {
        listaDoces.innerHTML = '';
        doces.forEach(doce => {
            const doceElement = document.createElement('div');
            doceElement.classList.add('doce-item');
            doceElement.innerHTML = `
                <img src="${doce.imagem}" alt="${doce.nome}">
                <h3>${doce.nome}</h3>
                <p class="descricao">${doce.descricao || ''}</p>
                <p class="preco">R$ ${Number(doce.preco).toFixed(2)}</p>
                <button class="btn-adicionar" data-id="${doce.id}">Adicionar ao Carrinho</button>
            `;
            listaDoces.appendChild(doceElement);
        });
    }

    // --- FUNÇÕES DO CARRINHO (AQUI ESTÃO AS MUDANÇAS) ---

    // ATUALIZAÇÃO 1: A função de renderizar agora inclui o botão de remover
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
    
    function adicionarAoCarrinho(evento) {
        if (evento.target.classList.contains('btn-adicionar')) {
            const doceId = evento.target.getAttribute('data-id');
            const doceSelecionado = doces.find(doce => doce.id === doceId);
            
            if (!doceSelecionado) return;

            const itemExistente = carrinho.find(item => item.id === doceId);
            if (itemExistente) {
                itemExistente.quantidade++;
            } else {
                carrinho.push({ ...doceSelecionado, quantidade: 1 });
            }
            renderizarCarrinho();
        }
    }

  // script.js -> SUBSTITUIR A FUNÇÃO manipularCarrinho

function manipularCarrinho(evento) {
    const target = evento.target;

    // Se o clique foi no botão de remover
    if (target.classList.contains('btn-remover')) {
        const doceId = target.getAttribute('data-id');
        removerDoCarrinho(doceId);
    }

    // Se o clique foi em um botão de quantidade (+ ou -)
    if (target.classList.contains('btn-qtd')) {
        const doceId = target.getAttribute('data-id');
        const acao = target.getAttribute('data-acao');
        alterarQuantidade(doceId, acao);
    }
}

// script.js -> ADICIONAR ESTA NOVA FUNÇÃO

function alterarQuantidade(idDoce, acao) {
    // Encontra o item no carrinho
    const item = carrinho.find(item => item.id === idDoce);
    if (!item) return; // Se não encontrar, não faz nada

    if (acao === 'aumentar') {
        item.quantidade++;
    } else if (acao === 'diminuir') {
        // Se a quantidade for maior que 1, apenas diminui
        if (item.quantidade > 1) {
            item.quantidade--;
        } else {
            // Se for 1, remove o item do carrinho
            removerDoCarrinho(idDoce);
        }
    }

    // Re-renderiza o carrinho para mostrar a nova quantidade e o novo total
    renderizarCarrinho();
}

    function removerDoCarrinho(idDoce) {
        // Filtra o array, criando um novo array com todos os itens, EXCETO aquele com o ID que queremos remover
        carrinho = carrinho.filter(item => item.id !== idDoce);
        // Re-renderiza o carrinho para mostrar a mudança
        renderizarCarrinho();
    }

    // ATUALIZAÇÃO 3: Nova função para esvaziar o carrinho
    function esvaziarCarrinho() {
        if (confirm("Tem certeza que deseja esvaziar o carrinho?")) {
            carrinho = []; // Define o carrinho como um array vazio
            renderizarCarrinho(); // Re-renderiza para mostrar que está vazio
        }
    }

    function finalizarPedido() {
        if (carrinho.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
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

    // --- EVENT LISTENERS (adicionamos os novos) ---
    listaDoces.addEventListener('click', adicionarAoCarrinho);
    btnFinalizar.addEventListener('click', finalizarPedido);
    itensCarrinho.addEventListener('click', manipularCarrinho); // NOVO
    btnEsvaziar.addEventListener('click', esvaziarCarrinho);   // NOVO

    // --- INICIALIZAÇÃO ---
    await carregarDocesDoFirebase();
});