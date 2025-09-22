document.addEventListener('DOMContentLoaded', async () => {

    // --- DADOS DOS DOCES (AGORA VINDOS DO FIREBASE) ---
    const docesCollection = db.collection('doces');
    let doces = [];

    async function carregarDocesDoFirebase() {
        try {
            const snapshot = await docesCollection.where('disponivel', '==', true).get();
            snapshot.forEach(doc => {
                doces.push({ id: doc.id, ...doc.data() });
            });
            renderizarDoces();
        } catch (error) {
            console.error("Erro ao carregar doces: ", error);
        }
    }
    
    // --- VARIÁVEIS GLOBAIS ---
    let carrinho = []; // Array que vai armazenar os itens do carrinho
    const numeroWhatsApp = '559999863486';

    // --- ELEMENTOS DO DOM ---
    const listaDoces = document.getElementById('lista-doces');
    const itensCarrinho = document.getElementById('itens-carrinho');
    const totalPreco = document.getElementById('total-preco');
    const btnFinalizar = document.getElementById('finalizar-pedido');

    // --- FUNÇÕES ---

    // Função para renderizar/mostrar os doces na página
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


    // VERSÃO CORRETA PARA USAR COM FIREBASE
function adicionarAoCarrinho(evento) {
    if (evento.target.classList.contains('btn-adicionar')) {
        // Pega o ID do doce clicado (ele já é uma string, que é o correto)
        const doceId = evento.target.getAttribute('data-id');

        // Procura na nossa lista de 'doces' qual item tem esse mesmo ID
        const doceSelecionado = doces.find(doce => doce.id === doceId);

        // Se não encontrar o doce por algum motivo, não faz nada
        if (!doceSelecionado) {
            console.error('Doce não encontrado com o ID:', doceId);
            return;
        }

        // Verifica se o item já está no carrinho
        const itemExistente = carrinho.find(item => item.id === doceId);
        if (itemExistente) {
            itemExistente.quantidade++; // Se já existe, só aumenta a quantidade
        } else {
            carrinho.push({ ...doceSelecionado, quantidade: 1 }); // Se não, adiciona com quantidade 1
        }

        renderizarCarrinho(); // Atualiza a exibição do carrinho
    }
}

    // Função para renderizar/mostrar os itens no carrinho
    function renderizarCarrinho() {
        if (carrinho.length === 0) {
            itensCarrinho.innerHTML = '<p>Seu carrinho está vazio.</p>';
            totalPreco.textContent = '0.00';
            return;
        }

        itensCarrinho.innerHTML = ''; // Limpa o carrinho antes de adicionar os itens atualizados
        let total = 0;

        carrinho.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('carrinho-item');
            itemElement.innerHTML = `
                <span>${item.nome} (x${item.quantidade})</span>
                <span>R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
            `;
            itensCarrinho.appendChild(itemElement);
            total += item.preco * item.quantidade;
        });

        totalPreco.textContent = total.toFixed(2);
    }

    // Função para finalizar o pedido e enviar para o WhatsApp
    function finalizarPedido() {
        if (carrinho.length === 0) {
            alert('Seu carrinho está vazio! Adicione alguns doces antes de finalizar.');
            return;
        }

        let mensagem = 'Olá! Gostaria de fazer o seguinte pedido:\n\n';
        let totalPedido = 0;

        carrinho.forEach(item => {
            mensagem += `*${item.quantidade}x* ${item.nome} - R$ ${(item.preco * item.quantidade).toFixed(2)}\n`;
            totalPedido += item.preco * item.quantidade;
        });

        mensagem += `\n*Total do Pedido: R$ ${totalPedido.toFixed(2)}*`;

        // Codifica a mensagem para ser usada em uma URL
        const mensagemCodificada = encodeURIComponent(mensagem);

        // Cria o link do WhatsApp e abre em uma nova aba
        const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`;
        window.open(urlWhatsApp, '_blank');
    }

    // --- EVENT LISTENERS ---
    // Adiciona o listener para cliques na lista de doces (para o botão "Adicionar")
    listaDoces.addEventListener('click', adicionarAoCarrinho);

    // Adiciona o listener para o botão de finalizar pedido
    btnFinalizar.addEventListener('click', finalizarPedido);

    // --- INICIALIZAÇÃO ---
    await carregarDocesDoFirebase();
});