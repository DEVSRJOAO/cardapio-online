document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Verificador de autenticação
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // SÓ SE UM USUÁRIO FOR ENCONTRADO, O CÓDIGO DO DASHBOARD RODA
            console.log("Autenticação confirmada. Carregando dados para o usuário:", user.uid);
            await carregarDashboard();
        } else {
            // Se não estiver logado, redireciona para o login
            console.log("Usuário não autenticado. Redirecionando para o login.");
            window.location.href = 'login.html';
        }
    });

    async function carregarDashboard() {
        const totalClientesEl = document.getElementById('total-clientes');
        const vendasHojeEl = document.getElementById('vendas-hoje');
        const vendasMesEl = document.getElementById('vendas-mes');
        const totalVendasEl = document.getElementById('total-vendas');
        const graficoVendasSemanaCtx = document.getElementById('grafico-vendas-semana').getContext('2d');
        const graficoCategoriasPizzaCtx = document.getElementById('grafico-categorias-pizza').getContext('2d');

        try {
            const [usuariosSnapshot, pedidosSnapshot, docesSnapshot] = await Promise.all([
                db.collection('usuarios').get(),
                db.collection('pedidos').orderBy('data', 'desc').get(),
                db.collection('doces').get()
            ]);

            const totalClientes = usuariosSnapshot.size;
            const pedidos = pedidosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            totalClientesEl.textContent = totalClientes;
            const totalVendas = pedidos.reduce((acc, pedido) => acc + pedido.total, 0);
            totalVendasEl.textContent = `R$ ${totalVendas.toFixed(2)}`;
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const vendasHoje = pedidos
                .filter(p => p.data && p.data.toDate() >= hoje)
                .reduce((acc, pedido) => acc + pedido.total, 0);
            vendasHojeEl.textContent = `R$ ${vendasHoje.toFixed(2)}`;
            const inicioDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            const vendasMes = pedidos
                .filter(p => p.data && p.data.toDate() >= inicioDoMes)
                .reduce((acc, pedido) => acc + pedido.total, 0);
            vendasMesEl.textContent = `R$ ${vendasMes.toFixed(2)}`;

            const vendasUltimos7Dias = {};
            const labelsSemana = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const diaFormatado = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                labelsSemana.push(diaFormatado);
                vendasUltimos7Dias[diaFormatado] = 0;
            }
            pedidos.forEach(pedido => {
                if (pedido.data) {
                    const dataPedido = pedido.data.toDate();
                    const diaFormatado = `${dataPedido.getDate().toString().padStart(2, '0')}/${(dataPedido.getMonth() + 1).toString().padStart(2, '0')}`;
                    if (vendasUltimos7Dias.hasOwnProperty(diaFormatado)) {
                        vendasUltimos7Dias[diaFormatado] += pedido.total;
                    }
                }
            });
            const dadosVendasSemana = labelsSemana.map(dia => vendasUltimos7Dias[dia]);
            
            const contagemCategorias = {};
            const mapaProdutos = {};
            docesSnapshot.forEach(doc => {
                mapaProdutos[doc.id] = doc.data();
            });
            pedidos.forEach(pedido => {
                pedido.itens.forEach(item => {
                    const produto = mapaProdutos[item.id];
                    if (produto) {
                        const categoria = produto.categoria || 'Sem Categoria';
                        if (contagemCategorias[categoria]) {
                            contagemCategorias[categoria] += item.quantidade;
                        } else {
                            contagemCategorias[categoria] = item.quantidade;
                        }
                    }
                });
            });
            const labelsCategorias = Object.keys(contagemCategorias);
            const dadosCategorias = Object.values(contagemCategorias);

// --- 4. RENDERIZAR OS GRÁFICOS ---
setTimeout(() => {
    new Chart(graficoVendasSemanaCtx, {
        type: 'bar',
        data: {
            labels: labelsSemana,
            datasets: [{
                label: 'Vendas (R$)',
                data: dadosVendasSemana,
                backgroundColor: 'rgba(91, 192, 222, 0.7)',
                borderColor: 'rgba(91, 192, 222, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    new Chart(graficoCategoriasPizzaCtx, {
        type: 'doughnut',
        data: {
            labels: labelsCategorias,
            datasets: [{
                label: 'Itens Vendidos',
                data: dadosCategorias,
                backgroundColor: ['rgba(255, 153, 204, 0.7)', 'rgba(91, 192, 222, 0.7)', 'rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}, 0); // O "atraso" de 0 milissegundos é o suficiente

        } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error);
            // O erro de permissão agora deve sumir, mas mantemos o catch para outros possíveis erros.
        }
    }
});