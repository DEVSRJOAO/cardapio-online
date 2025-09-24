document.addEventListener('DOMContentLoaded', async () => {

    // --- ELEMENTOS DO DOM ---
    const carrinhoPainel = document.querySelector('.carrinho');
    const itensCarrinho = document.getElementById('itens-carrinho');
    const totalPreco = document.getElementById('total-preco');
    const btnFinalizar = document.getElementById('finalizar-pedido');
    const btnEsvaziar = document.getElementById('esvaziar-carrinho');
    const userInfoDiv = document.getElementById('user-info');
    const iconeCarrinho = document.getElementById('icone-carrinho');
    const contadorCarrinho = document.getElementById('contador-carrinho');
    const carrinhoFechar = document.querySelector('.carrinho-fechar');
    const overlay = document.getElementById('overlay-geral');
    const listaDoces = document.getElementById('lista-doces');
    const filtrosContainer = document.getElementById('filtros-categoria');
    const tituloCategoria = document.getElementById('titulo-categoria');
    const modal = document.getElementById('modal-produto');
    const displayEndereco = document.getElementById('display-endereco');

    // Elementos do Modal (verificados antes de usar)
    let modalFecharNovo, modalImagemFundo, modalNome, modalDescricao, modalServe, modalPreco, modalObservacao, modalBtnDiminuir, modalQuantidade, modalBtnAumentar, modalAddPreco, btnModalAdicionar;
    if (modal) {
        modalFecharNovo = document.querySelector('.modal-fechar-novo');
        modalImagemFundo = document.getElementById('modal-imagem-fundo');
        modalNome = document.getElementById('modal-nome');
        modalDescricao = document.getElementById('modal-descricao');
        modalServe = document.getElementById('modal-serve');
        modalPreco = document.getElementById('modal-preco');
        modalObservacao = document.getElementById('modal-observacao');
        modalBtnDiminuir = document.getElementById('modal-diminuir-qtd');
        modalQuantidade = document.getElementById('modal-quantidade');
        modalBtnAumentar = document.getElementById('modal-aumentar-qtd');
        modalAddPreco = document.getElementById('modal-add-preco');
        btnModalAdicionar = document.getElementById('btn-modal-adicionar');
    }
    
    // Elementos da Barra de Navegação Inferior
    const navCarrinhoBtn = document.getElementById('nav-carrinho-btn');
    const navCarrinhoBtnPerfil = document.getElementById('nav-carrinho-btn-perfil');

    // --- DADOS E VARIÁVEIS GLOBAIS ---
    const db = firebase.firestore();
    const auth = firebase.auth();
    const docesCollection = db.collection('doces');
    let doces = [];
    let carrinho = JSON.parse(localStorage.getItem('doceriaCarrinho')) || [];
    function salvarCarrinho() {
    localStorage.setItem('doceriaCarrinho', JSON.stringify(carrinho));
}
    let usuarioLogado = null;
    let enderecoUsuario = null;
    const numeroWhatsApp = '559999863486';
    let quantidadeModal = 1;
    let precoUnitarioModal = 0;

    // --- FUNÇÕES DE CONTROLE (GLOBAIS) ---
    function abrirCarrinho() {
        if (carrinhoPainel) carrinhoPainel.classList.add('aberto');
        if (overlay) overlay.classList.add('visible');
    }

    function fecharCarrinho() {
        if (carrinhoPainel) carrinhoPainel.classList.remove('aberto');
        if (!modal || !modal.classList.contains('active')) {
            if (overlay) overlay.classList.remove('visible');
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
        modalServe.textContent = 'Serve 1 pessoa';
        modalObservacao.value = '';
        atualizarFooterModal();
        btnModalAdicionar.dataset.id = doce.id;
        modal.classList.add('active');
        if (overlay) overlay.classList.add('visible');
    }

    function fecharModal() {
        if(modal) modal.classList.remove('active');
        if (!carrinhoPainel || !carrinhoPainel.classList.contains('aberto')) {
             if (overlay) overlay.classList.remove('visible');
        }
    }
    
    function atualizarFooterModal() {
        if (!modal) return;
        modalQuantidade.textContent = quantidadeModal;
        modalAddPreco.textContent = `R$ ${(precoUnitarioModal * quantidadeModal).toFixed(2)}`;
    }

    // --- FUNÇÕES DE AUTENTICAÇÃO E DADOS DO USUÁRIO (GLOBAIS) ---
    auth.onAuthStateChanged(async (user) => {
        if (!userInfoDiv) return; // Só executa se a div de usuário existir

        if (user) {
            usuarioLogado = user;
            userInfoDiv.innerHTML = `<a href="perfil/" class="auth-link" title="Meu Perfil"><i class="fa fa-user-circle"></i></a>`;
            await carregarEnderecoDoUsuario(user.uid);
        } else {
            usuarioLogado = null;
            enderecoUsuario = null;
            userInfoDiv.innerHTML = `<a href="auth-cliente/login.html" class="auth-link" title="Login / Cadastrar"><i class="fa fa-user"></i></a>`;
            if (displayEndereco) {
                document.querySelector('input[name="entrega"][value="retirar"]').checked = true;
                displayEndereco.classList.remove('visible');
            }
        }
    });

 async function carregarEnderecoDoUsuario(uid) {
    if (!displayEndereco) return;
    try {
        // Busca o primeiro endereço na subcoleção de endereços do usuário
        const enderecosSnapshot = await db.collection('usuarios').doc(uid).collection('enderecos').limit(1).get();
        
        if (!enderecosSnapshot.empty) {
            // Se encontrou, pega os dados do primeiro endereço
            enderecoUsuario = enderecosSnapshot.docs[0].data(); 
            const { rua, numero, bairro } = enderecoUsuario;
            displayEndereco.innerHTML = `<p><strong>Entregar em:</strong></p><p>${rua}, ${numero} - ${bairro}</p><a href="perfil/endereco.html">Alterar ou ver completo</a>`;
        } else {
            // Se não encontrou nenhum endereço na subcoleção
            enderecoUsuario = null;
            displayEndereco.innerHTML = `<p>Nenhum endereço cadastrado.</p><a href="perfil/endereco.html">Cadastrar endereço no perfil</a>`;
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
            doces = [];
            snapshot.forEach(doc => { doces.push({ id: doc.id, ...doc.data() }); });
            renderizarDoces();
        } catch (error) {
            console.error("Erro ao carregar doces: ", error);
            if (error.code === 'failed-precondition') {
                alert("O banco de dados precisa de um índice. Por favor, clique no link no console (F12) para criá-lo.");
            }
        }
    }
    
    function renderizarDoces(categoria = 'todos') {
        if (!listaDoces) return;
        listaDoces.innerHTML = '';
        const docesFiltrados = (categoria === 'todos') ? doces : doces.filter(doce => doce.categoria === categoria);
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

    // --- FUNÇÕES DO CARRINHO (GLOBAIS) ---
    function adicionarAoCarrinho(idDoce, quantidade, observacao) {
        const doceSelecionado = doces.find(doce => doce.id === idDoce);
        if (!doceSelecionado) return;
        const carrinhoId = idDoce + (observacao || '').trim();
        const itemExistente = carrinho.find(item => item.carrinhoId === carrinhoId);
        
        if (itemExistente) {
            itemExistente.quantidade += quantidade;
        } else {
            carrinho.push({ ...doceSelecionado, quantidade: quantidade, observacao: observacao.trim(), carrinhoId: carrinhoId });
        }
        renderizarCarrinho();
        Swal.fire({ icon: 'success', title: 'Adicionado!', text: `${doceSelecionado.nome} foi colocado no carrinho.`, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true });
        salvarCarrinho();
    }

    function renderizarCarrinho() {
        if (!itensCarrinho) return;
        if (carrinho.length === 0) {
            itensCarrinho.innerHTML = '<p>Seu carrinho está vazio.</p>';
            totalPreco.textContent = '0.00';
            if (contadorCarrinho) {
                contadorCarrinho.textContent = '0';
                contadorCarrinho.classList.remove('visible');
            }
        } else {
            itensCarrinho.innerHTML = '';
            let total = 0;
            let totalItens = 0;
            carrinho.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('carrinho-item');
                let obsHTML = item.observacao ? `<span class="obs-item">Obs: ${item.observacao}</span>` : '';
                itemElement.innerHTML = `
                    <div class="carrinho-item-info">
                        <span>${item.nome}</span>
                        ${obsHTML}
                        <span class="preco-item">R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
                    </div>
                    <div class="carrinho-item-quantidade">
                        <span class="btn-qtd" data-id="${item.carrinhoId}" data-acao="diminuir">-</span>
                        <span class="quantidade">${item.quantidade}</span>
                        <span class="btn-qtd" data-id="${item.carrinhoId}" data-acao="aumentar">+</span>
                    </div>
                    <span class="btn-remover" data-id="${item.carrinhoId}">🗑️</span>
                `;
                itensCarrinho.appendChild(itemElement);
                total += item.preco * item.quantidade;
                totalItens += item.quantidade;
            });
            totalPreco.textContent = total.toFixed(2);
            if (contadorCarrinho) {
                contadorCarrinho.textContent = totalItens;
                contadorCarrinho.classList.add('visible');
            }
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

    function removerDoCarrinho(carrinhoId) {
        carrinho = carrinho.filter(item => item.carrinhoId !== carrinhoId);
        renderizarCarrinho();
        salvarCarrinho();
    }
    
    function alterarQuantidade(carrinhoId, acao) {
        const item = carrinho.find(item => item.carrinhoId === carrinhoId);
        if (!item) return;
        if (acao === 'aumentar') {
            item.quantidade++;
        } else if (acao === 'diminuir') {
            if (item.quantidade > 1) {
                item.quantidade--;
            } else {
                removerDoCarrinho(carrinhoId);
            }
        }
        renderizarCarrinho();
        salvarCarrinho();
    }

    function esvaziarCarrinho() {
        if (carrinho.length === 0) { return; }
        Swal.fire({ title: 'Tem certeza?', text: "Todos os itens serão removidos.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Sim, esvaziar!', cancelButtonText: 'Cancelar' }).then((result) => {
            if (result.isConfirmed) {
                carrinho = [];
                renderizarCarrinho();
                salvarCarrinho();
                Swal.fire('Carrinho Vazio!', 'Seus itens foram removidos.', 'success');
            }
        });
    }

async function finalizarPedido() {
    if (carrinho.length === 0) {
        Swal.fire('Carrinho Vazio', 'Adicione alguns itens antes de finalizar.', 'warning');
        return;
    }

    const { value: formaPagamento } = await Swal.fire({ title: 'Forma de Pagamento', input: 'radio', inputOptions: { 'Pix': 'Pix', 'Cartão': 'Cartão', 'Dinheiro': 'Dinheiro' }, inputValidator: (value) => !value && 'Você precisa escolher uma opção!', confirmButtonText: 'Próximo &rarr;' });
    if (!formaPagamento) return;

    const { value: tipoEntregaResult } = await Swal.fire({ title: 'Opção de Entrega', showDenyButton: true, confirmButtonText: 'Receber em casa', denyButtonText: `Retirar no local`, icon: 'question' });
    
    let tipoEntrega = '';
    let detalhesEntrega = '';

    if (tipoEntregaResult === true) { // Quer entrega em casa
        tipoEntrega = 'Entrega';
        if (usuarioLogado) {
            
            // --- LÓGICA CORRIGIDA AQUI ---
            // Busca o endereço mais recente na subcoleção de endereços do usuário
            const enderecosSnapshot = await db.collection('usuarios').doc(usuarioLogado.uid).collection('enderecos').limit(1).get();

            if (!enderecosSnapshot.empty) {
                // Se encontrou, pega os dados do primeiro endereço
                const primeiroEndereco = enderecosSnapshot.docs[0].data();
                const { rua, numero, bairro, cidade, complemento } = primeiroEndereco;
                detalhesEntrega = `${rua}, ${numero} - ${bairro}, ${cidade || ''}. ${complemento || ''}`;
            } else {
                // Se não encontrou, manda o usuário cadastrar
                Swal.fire('Endereço Faltando', 'Vá ao seu perfil para cadastrar um endereço.', 'info').then(() => { 
                    if (window.location.pathname.includes('perfil')) { 
                        window.location.href = "endereco.html"; 
                    } else { 
                        window.location.href = "perfil/endereco.html";
                    } 
                });
                return;
            }
        } else {
            Swal.fire('Login Necessário', 'Para pedir entrega, você precisa estar logado.', 'info').then(() => { window.location.href = "auth-cliente/login.html"; });
            return;
        }
    } else if (tipoEntregaResult === false) { // Quer retirar no local
        tipoEntrega = 'Retirada';
        detalhesEntrega = 'Retirar no local';
    } else { // Fechou o pop-up
        return; 
    }

    try {
        let totalPedido = 0;
        const itensPedido = carrinho.map(item => {
            totalPedido += item.preco * item.quantidade;
            return {
                id: item.id,
                nome: item.nome,
                quantidade: item.quantidade,
                precoUnitario: item.preco,
                observacao: item.observacao || ''
            };
        });

        const novoPedido = {
            clienteId: usuarioLogado ? usuarioLogado.uid : null,
            clienteNome: usuarioLogado ? usuarioLogado.displayName : 'Cliente não logado',
            itens: itensPedido,
            total: totalPedido,
            formaPagamento: formaPagamento,
            tipoEntrega: tipoEntrega,
            detalhesEntrega: detalhesEntrega,
            data: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'Pendente'
        };

        await db.collection('pedidos').add(novoPedido);
        
        let mensagem = 'Olá! Gostaria de fazer o seguinte pedido:\n\n';
        carrinho.forEach(item => {
            let obsTexto = item.observacao ? `\n  (Obs: ${item.observacao})` : '';
            mensagem += `*${item.quantidade}x* ${item.nome}${obsTexto} - R$ ${(item.preco * item.quantidade).toFixed(2)}\n`;
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
        
        carrinho = [];
        salvarCarrinho();
        renderizarCarrinho();
        fecharCarrinho();

    } catch (error) {
        console.error("Erro ao salvar o pedido no Firestore: ", error);
        Swal.fire('Ops!', 'Não foi possível registrar seu pedido no sistema. Por favor, tente novamente.', 'error');
    }
}
    // --- EVENT LISTENERS ---
    
    // Listeners Globais
    if (iconeCarrinho) iconeCarrinho.addEventListener('click', abrirCarrinho);
    if (carrinhoFechar) carrinhoFechar.addEventListener('click', fecharCarrinho);
    if (overlay) overlay.addEventListener('click', () => { fecharModal(); fecharCarrinho(); });
    if (btnFinalizar) btnFinalizar.addEventListener('click', finalizarPedido);
    if (itensCarrinho) itensCarrinho.addEventListener('click', manipularCarrinho);
    if (btnEsvaziar) btnEsvaziar.addEventListener('click', esvaziarCarrinho);
    if (navCarrinhoBtn) navCarrinhoBtn.addEventListener('click', (e) => { e.preventDefault(); abrirCarrinho(); });
    if (navCarrinhoBtnPerfil) navCarrinhoBtnPerfil.addEventListener('click', (e) => { e.preventDefault(); abrirCarrinho(); });

    // Listeners Específicos da Página Principal
    if (listaDoces) {
        listaDoces.addEventListener('click', (e) => {
            const doceClicado = e.target.closest('.doce-clicavel');
            if (doceClicado) {
                abrirModal(doceClicado.dataset.id);
            }
        });
        filtrosContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filtro-btn')) {
                filtrosContainer.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                tituloCategoria.textContent = e.target.textContent;
                renderizarDoces(e.target.dataset.categoria);
            }
        });
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
    if (displayEndereco) {
        document.querySelectorAll('input[name="entrega"]').forEach(radio => {
            radio.addEventListener('change', (evento) => {
                if (evento.target.value === 'delivery') {
                    displayEndereco.classList.add('visible');
                } else {
                    displayEndereco.classList.remove('visible');
                }
            });
        });
    }

    // --- INICIALIZAÇÃO ---
    if (listaDoces) {
        await carregarDocesDoFirebase();
    }
    renderizarCarrinho();
});