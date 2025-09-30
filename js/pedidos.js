document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        const token = await user.getIdTokenResult(true);
        if (!token.claims.admin) {
            alert('Acesso negado.');
            window.location.href = 'login.html';
            return;
        }
        carregarPedidos();
    });

    const listaPedidosDiv = document.getElementById('lista-pedidos-admin');

    function carregarPedidos() {
        db.collection('pedidos').orderBy('data', 'desc').onSnapshot(snapshot => {
            if (snapshot.empty) {
                listaPedidosDiv.innerHTML = '<p>Nenhum pedido encontrado.</p>';
                return;
            }
            listaPedidosDiv.innerHTML = '';
            snapshot.forEach(doc => {
                const pedido = doc.data();
                const pedidoId = doc.id;
                const pedidoCard = document.createElement('div');
                
                // Garante que o status tenha um valor para o className
                const statusClass = pedido.status ? pedido.status.toLowerCase() : 'pendente';
                pedidoCard.className = `pedido-card status-${statusClass}`;
                
                let itensHTML = (pedido.carrinho || []).map(item => 
                    `<li>${item.quantidade}x ${item.nome}</li>`
                ).join('');

                // ===== A CORREÇÃO ESTÁ NA LINHA ABAIXO =====
                // Usamos (pedido.total || 0) para garantir que sempre haverá um número
                const totalFormatado = (pedido.total || 0).toFixed(2);

                pedidoCard.innerHTML = `
                    <div class="pedido-header">
                        <strong>Cliente: ${pedido.clienteNome || 'Não identificado'}</strong>
                        <span>${pedido.data ? new Date(pedido.data.seconds * 1000).toLocaleString('pt-BR') : 'Data indisponível'}</span>
                    </div>
                    <div class="pedido-body">
                        <ul>${itensHTML}</ul>
                        <p><strong>Total: R$ ${totalFormatado}</strong></p>
                        <p><strong>Status Atual: <span class="status-texto">${pedido.status || 'N/A'}</span></strong></p>
                    </div>
                    <div class="pedido-acoes">
                        <button class="btn-confirmar" data-id="${pedidoId}">Confirmar Pedido</button>
                        <button class="btn-cancelar-pedido" data-id="${pedidoId}">Cancelar Pedido</button>
                    </div>
                `;
                listaPedidosDiv.appendChild(pedidoCard);
            });
        });
    }

    listaPedidosDiv.addEventListener('click', (e) => {
        const target = e.target;
        const pedidoId = target.dataset.id;
        if (!pedidoId) return;

        if (target.classList.contains('btn-confirmar')) {
            db.collection('pedidos').doc(pedidoId).update({ status: 'Confirmado' });
        }
        if (target.classList.contains('btn-cancelar-pedido')) {
            db.collection('pedidos').doc(pedidoId).update({ status: 'Cancelado' });
        }
    });
});