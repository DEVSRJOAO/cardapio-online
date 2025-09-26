document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();

    // --- ELEMENTOS DA PÁGINA ---
    const totalFinalPagamentoEl = document.getElementById('total-final-pagamento');
    const opcoesPagamentoContainer = document.getElementById('opcoes-pagamento');
    const campoTroco = document.getElementById('campo-troco');
    const inputTroco = document.getElementById('troco');
    const observacaoPedidoEl = document.getElementById('observacao-pedido');
    const btnFinalizarPedidoFinal = document.getElementById('btn-finalizar-pedido-final');

    // --- DADOS E VARIÁVEIS ---
    const numeroWhatsApp = '559999863486';
    let pedidoFinal = null;
    let formaPagamentoSelecionada = 'Dinheiro ou Pix';

    // --- INICIALIZAÇÃO DA PÁGINA ---
    function carregarDadosDoPedido() {
        const pedidoString = localStorage.getItem('doceriaPedidoFinal');
        if (!pedidoString) {
            alert('Nenhum pedido encontrado para finalizar. Redirecionando para a loja.');
            window.location.href = 'index.html';
            return;
        }

        pedidoFinal = JSON.parse(pedidoString);
        const total = pedidoFinal.carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0) + pedidoFinal.taxaEntrega;
        
        if (totalFinalPagamentoEl) {
            totalFinalPagamentoEl.textContent = `R$ ${total.toFixed(2)}`;
        }
    }

    // --- LÓGICA DE INTERAÇÃO ---
    opcoesPagamentoContainer.addEventListener('click', (e) => {
        const opcao = e.target.closest('.opcao-pagamento');
        if (!opcao) return;

        opcoesPagamentoContainer.querySelectorAll('.opcao-pagamento').forEach(el => el.classList.remove('selecionado'));
        opcao.classList.add('selecionado');
        formaPagamentoSelecionada = opcao.dataset.valor;
        opcao.querySelector('input[type="radio"]').checked = true;

        if (formaPagamentoSelecionada === 'Dinheiro ou Pix') {
            campoTroco.classList.add('visivel');
        } else {
            campoTroco.classList.remove('visivel');
            inputTroco.value = '';
        }
    });

    // --- FINALIZAÇÃO DO PEDIDO (COM LÓGICA DE ENDEREÇO) ---
    btnFinalizarPedidoFinal.addEventListener('click', async () => {
        if (!pedidoFinal) {
            Swal.fire('Erro', 'Não foi possível encontrar os dados do pedido.', 'error');
            return;
        }

        btnFinalizarPedidoFinal.disabled = true;
        btnFinalizarPedidoFinal.textContent = 'Finalizando...';

        try {
            const subtotal = pedidoFinal.carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
            const totalFinal = subtotal + pedidoFinal.taxaEntrega;
            let detalhesEntregaString = 'Retirar no local';

            // **NOVA LÓGICA PARA BUSCAR O ENDEREÇO COMPLETO**
            if (pedidoFinal.tipoEntrega === 'Entrega' && auth.currentUser && pedidoFinal.enderecoId) {
                const enderecoDoc = await db.collection('usuarios').doc(auth.currentUser.uid).collection('enderecos').doc(pedidoFinal.enderecoId).get();
                if (enderecoDoc.exists) {
                    const end = enderecoDoc.data();
                    detalhesEntregaString = `${end.rua}, ${end.numero} - ${end.bairro}, ${end.cidade}. (${end.apelido})`;
                } else {
                    detalhesEntregaString = "Endereço selecionado não encontrado.";
                }
            }
            
            const dadosCompletosDoPedido = {
                ...pedidoFinal,
                total: subtotal,
                formaPagamento: formaPagamentoSelecionada,
                trocoPara: (formaPagamentoSelecionada === 'Dinheiro ou Pix' && inputTroco.value) ? inputTroco.value : '',
                observacao: observacaoPedidoEl.value || '',
                data: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'Pendente',
                clienteId: auth.currentUser ? auth.currentUser.uid : null,
                clienteNome: auth.currentUser ? auth.currentUser.displayName : 'Cliente não logado',
                detalhesEntrega: detalhesEntregaString // Salva a string completa do endereço
            };

            await db.collection('pedidos').add(dadosCompletosDoPedido);
            
            let mensagem = `*Novo Pedido Recebido!*\n\n`;
            dadosCompletosDoPedido.carrinho.forEach(item => {
                let obs = item.observacao ? `\n  _(Obs: ${item.observacao})_` : '';
                mensagem += `*${item.quantidade}x* ${item.nome}${obs}\n`;
            });
            mensagem += `\n*Subtotal:* R$ ${subtotal.toFixed(2)}`;
            mensagem += `\n*Taxa de Entrega:* R$ ${pedidoFinal.taxaEntrega.toFixed(2)}`;
            mensagem += `\n*Total do Pedido: R$ ${totalFinal.toFixed(2)}*`;
            mensagem += `\n\n*Tipo de Entrega:* ${dadosCompletosDoPedido.tipoEntrega}`;
            mensagem += `\n*Endereço:* ${detalhesEntregaString}`; // Adiciona o endereço completo
            mensagem += `\n\n*Forma de Pagamento:* ${dadosCompletosDoPedido.formaPagamento}`;
            if (dadosCompletosDoPedido.trocoPara) {
                mensagem += `\n*Troco para:* ${dadosCompletosDoPedido.trocoPara}`;
            }
            if (dadosCompletosDoPedido.observacao) {
                mensagem += `\n\n*Observações do Cliente:*\n${dadosCompletosDoPedido.observacao}`;
            }

            const mensagemCodificada = encodeURIComponent(mensagem);
            const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`;
            
            localStorage.removeItem('doceriaCarrinho');
            localStorage.removeItem('doceriaPedidoFinal');
            
            Swal.fire({
                title: 'Pedido Enviado!',
                text: 'Seu pedido foi registrado. Você será redirecionado para o WhatsApp para confirmar.',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                window.open(urlWhatsApp, '_blank');
                window.location.href = 'index.html';
            });

        } catch (error) {
            console.error("Erro ao finalizar pedido: ", error);
            Swal.fire('Ops!', 'Ocorreu um erro ao finalizar seu pedido. Tente novamente.', 'error');
            btnFinalizarPedidoFinal.disabled = false;
            btnFinalizarPedidoFinal.textContent = 'Finalizar Pedido';
        }
    });

    // --- INICIALIZAÇÃO ---
    carregarDadosDoPedido();
});