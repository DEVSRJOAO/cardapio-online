document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const tokenResult = await user.getIdTokenResult(true);
                if (tokenResult.claims.admin === true) {
                    console.log("Admin confirmado. Configurando dashboard...");
                    setupStoreStatusToggle();
                    setupFiltros();
                    carregarDashboard('hoje');
                    setupDebugButton();
                } else {
                    alert('Você não tem permissão de administrador.');
                    await auth.signOut();
                    window.location.href = 'login.html';
                }
            } catch (error) {
                console.error("Erro ao verificar permissões de admin:", error);
                // Lidar com erro
            }
        } else {
            window.location.href = 'login.html';
        }
    });

    function setupStoreStatusToggle() {
        // Esta função continua a mesma, sem alterações.
        const toggleSwitch = document.getElementById('loja-aberta-toggle');
        const statusTexto = document.getElementById('status-texto');
        if (!toggleSwitch || !statusTexto) return;
        const configLojaRef = db.collection('configuracoes').doc('loja');
        configLojaRef.onSnapshot((doc) => {
            let estaAberta = doc.exists && doc.data().aberta === true;
            toggleSwitch.checked = estaAberta;
            statusTexto.textContent = estaAberta ? "ABERTA" : "FECHADA";
            statusTexto.style.color = estaAberta ? '#28a745' : '#dc3545';
        });
        toggleSwitch.addEventListener('change', function() {
            configLojaRef.set({ aberta: this.checked });
        });
    }

    function setupFiltros() {
        const container = document.querySelector('.filtro-botoes');
        if (!container) return;
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('filtro-btn-vendas')) {
                const periodo = e.target.dataset.periodo;
                container.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                carregarDashboard(periodo);
            }
        });
    }
    
    // Variáveis para armazenar as instâncias dos gráficos
    let graficoVendasInstance = null;
    let graficoCategoriasInstance = null;

    async function carregarDashboard(periodo = 'hoje') {
        const totalClientesEl = document.getElementById('total-clientes');
        const vendasFiltradasEl = document.getElementById('vendas-hoje');
        const cardVendasFiltradas = vendasFiltradasEl.parentElement;

        // Esconde os outros cards que não estamos usando
        document.getElementById('vendas-mes').parentElement.style.display = 'none';
        document.getElementById('total-vendas').parentElement.style.display = 'none';
        cardVendasFiltradas.style.display = 'block';

        // Elementos canvas dos gráficos
        const graficoVendasSemanaEl = document.getElementById('grafico-vendas-semana');
        const graficoCategoriasPizzaEl = document.getElementById('grafico-categorias-pizza');
        
        let query = db.collection('pedidos').where('status', '==', 'Confirmado');

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        // Monta a query com base no período
        switch (periodo) {
            case 'hoje':
                cardVendasFiltradas.querySelector('h3').textContent = "Vendas Hoje";
                query = query.where('data', '>=', hoje);
                break;
            case '7dias':
                cardVendasFiltradas.querySelector('h3').textContent = "Vendas (7 dias)";
                const seteDiasAtras = new Date();
                seteDiasAtras.setDate(hoje.getDate() - 7);
                query = query.where('data', '>=', seteDiasAtras);
                break;
            case 'mes':
                cardVendasFiltradas.querySelector('h3').textContent = "Vendas (Mês)";
                const inicioDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                query = query.where('data', '>=', inicioDoMes);
                break;
            case 'total':
                cardVendasFiltradas.querySelector('h3').textContent = "Vendas (Total)";
                break;
        }

        try {
            const [usuariosSnapshot, pedidosSnapshot] = await Promise.all([
                db.collection('usuarios').get(),
                query.get()
            ]);

            totalClientesEl.textContent = usuariosSnapshot.size;
            const pedidosConfirmados = pedidosSnapshot.docs.map(doc => doc.data());
            
            const totalVendasFiltradas = pedidosConfirmados.reduce((acc, p) => acc + (p.total || 0), 0);
            vendasFiltradasEl.textContent = `R$ ${totalVendasFiltradas.toFixed(2)}`;

            // ===== CÓDIGO DOS GRÁFICOS RESTAURADO E INTEGRADO =====

            // Destrói instâncias antigas dos gráficos para poder redesenhar
            if (graficoVendasInstance) graficoVendasInstance.destroy();
            if (graficoCategoriasInstance) graficoCategoriasInstance.destroy();

            // --- Gráfico de Vendas ---
            // (Para o gráfico de barras, sempre mostramos os últimos 7 dias, independente do filtro de cards)
            const vendas7diasQuery = db.collection('pedidos')
                .where('status', '==', 'Confirmado')
                .where('data', '>=', new Date(hoje.getTime() - 6 * 24 * 60 * 60 * 1000));
            const vendas7diasSnapshot = await vendas7diasQuery.get();
            const pedidos7dias = vendas7diasSnapshot.docs.map(doc => doc.data());
            
            const vendasUltimos7Dias = {};
            const labelsSemana = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dia = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                labelsSemana.push(dia);
                vendasUltimos7Dias[dia] = 0;
            }
            pedidos7dias.forEach(p => {
                const dataPedido = p.data.toDate();
                const dia = `${dataPedido.getDate().toString().padStart(2, '0')}/${(dataPedido.getMonth() + 1).toString().padStart(2, '0')}`;
                if (vendasUltimos7Dias.hasOwnProperty(dia)) {
                    vendasUltimos7Dias[dia] += (p.total || 0);
                }
            });
            
            graficoVendasInstance = new Chart(graficoVendasSemanaEl.getContext('2d'), {
                type: 'bar',
                data: { labels: labelsSemana, datasets: [{ label: 'Vendas (R$)', data: Object.values(vendasUltimos7Dias), backgroundColor: 'rgba(91, 192, 222, 0.7)' }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });

            // --- Gráfico de Categorias (reflete o filtro de data selecionado) ---
            const contagemCategorias = {};
            pedidosConfirmados.forEach(pedido => {
                if (pedido.carrinho && Array.isArray(pedido.carrinho)) {
                    pedido.carrinho.forEach(item => {
                        const categoria = item.categoria || 'Sem Categoria';
                        contagemCategorias[categoria] = (contagemCategorias[categoria] || 0) + item.quantidade;
                    });
                }
            });
            
            graficoCategoriasInstance = new Chart(graficoCategoriasPizzaEl.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: Object.keys(contagemCategorias),
                    datasets: [{
                        label: 'Itens Vendidos',
                        data: Object.values(contagemCategorias),
                        backgroundColor: ['#ff99cc', '#5bc0de', '#ffd700', '#90ee90', '#c8a2c8', '#ffb347'],
                        hoverOffset: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });

        } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error.message);
        }
    }
    
    function setupDebugButton() {
        // ... (código do botão de debug continua igual)
    }
});