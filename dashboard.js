// SUBSTITUA TODO O CONTEÚDO DO SEU ARQUIVO POR ESTE CÓDIGO COMPLETO

document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log("Usuário autenticado. Configurando dashboard...");
            setupStoreStatusToggle();
            carregarDashboard();
        } else {
            console.log("Usuário não autenticado. Redirecionando.");
            window.location.href = 'login.html';
        }
    });

    function setupStoreStatusToggle() {
        const toggleSwitch = document.getElementById('loja-aberta-toggle');
        const statusTexto = document.getElementById('status-texto');

        if (!toggleSwitch || !statusTexto) {
            console.log("Nota: Elementos de controle de status não encontrados. Isso é normal se não estiver na página do dashboard.");
            return;
        }

        const configLojaRef = db.collection('configuracoes').doc('loja');

        configLojaRef.onSnapshot((doc) => {
            let estaAberta = doc.exists && doc.data().aberta === true;
            toggleSwitch.checked = estaAberta;
            atualizarStatusTexto(estaAberta);
        }, (error) => {
            console.error("Erro ao observar status da loja:", error.message);
        });

        toggleSwitch.addEventListener('change', function() {
            const novoStatus = this.checked;
            configLojaRef.set({ aberta: novoStatus })
                .catch(error => {
                    console.error("Erro ao atualizar status da loja:", error.message);
                    this.checked = !novoStatus;
                });
        });

        function atualizarStatusTexto(estaAberta) {
            if (estaAberta) {
                statusTexto.textContent = "ABERTA";
                statusTexto.style.backgroundColor = '#e9f7ea';
                statusTexto.style.color = '#28a745';
            } else {
                statusTexto.textContent = "FECHADA";
                statusTexto.style.backgroundColor = '#f8d7da';
                statusTexto.style.color = '#dc3545';
            }
        }
    }

    async function carregarDashboard() {
        const graficoVendasSemanaEl = document.getElementById('grafico-vendas-semana');
        if (!graficoVendasSemanaEl) {
            console.log("Nota: Elementos de gráficos não encontrados. Isso é normal se não estiver na página do dashboard.");
            return;
        }

        const totalClientesEl = document.getElementById('total-clientes');
        const vendasHojeEl = document.getElementById('vendas-hoje');
        const vendasMesEl = document.getElementById('vendas-mes');
        const totalVendasEl = document.getElementById('total-vendas');
        const graficoCategoriasPizzaEl = document.getElementById('grafico-categorias-pizza');

        if (!totalClientesEl || !vendasHojeEl || !vendasMesEl || !totalVendasEl || !graficoCategoriasPizzaEl) {
            console.error("Um ou mais elementos de estatísticas do dashboard não foram encontrados.");
            return;
        }

        const graficoVendasSemanaCtx = graficoVendasSemanaEl.getContext('2d');
        const graficoCategoriasPizzaCtx = graficoCategoriasPizzaEl.getContext('2d');

        try {
            const [usuariosSnapshot, pedidosSnapshot, docesSnapshot] = await Promise.all([
                db.collection('usuarios').get(),
                db.collection('pedidos').orderBy('data', 'desc').get(),
                db.collection('doces').get()
            ]);

            const totalClientes = usuariosSnapshot.size;
            totalClientesEl.textContent = totalClientes;

            const pedidos = pedidosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const totalVendas = pedidos.reduce((acc, pedido) => acc + (pedido.total || 0), 0);
            totalVendasEl.textContent = `R$ ${totalVendas.toFixed(2)}`;

            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const vendasHoje = pedidos.filter(p => p.data && p.data.toDate() >= hoje).reduce((acc, pedido) => acc + (pedido.total || 0), 0);
            vendasHojeEl.textContent = `R$ ${vendasHoje.toFixed(2)}`;

            const inicioDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            const vendasMes = pedidos.filter(p => p.data && p.data.toDate() >= inicioDoMes).reduce((acc, pedido) => acc + (pedido.total || 0), 0);
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
                        vendasUltimos7Dias[diaFormatado] += (pedido.total || 0);
                    }
                }
            });
            const dadosVendasSemana = labelsSemana.map(dia => vendasUltimos7Dias[dia]);

            const contagemCategorias = {};
            const mapaProdutos = {};
            docesSnapshot.forEach(doc => { mapaProdutos[doc.id] = doc.data(); });
            pedidos.forEach(pedido => {
                if(pedido.itens && Array.isArray(pedido.itens)) {
                    pedido.itens.forEach(item => {
                        const produto = mapaProdutos[item.id];
                        if (produto) {
                            const categoria = produto.categoria || 'Sem Categoria';
                            contagemCategorias[categoria] = (contagemCategorias[categoria] || 0) + item.quantidade;
                        }
                    });
                }
            });
            const labelsCategorias = Object.keys(contagemCategorias);
            const dadosCategorias = Object.values(contagemCategorias);

            new Chart(graficoVendasSemanaCtx, {
                type: 'bar',
                data: { labels: labelsSemana, datasets: [{ label: 'Vendas (R$)', data: dadosVendasSemana, backgroundColor: 'rgba(91, 192, 222, 0.7)', borderColor: 'rgba(91, 192, 222, 1)', borderWidth: 1 }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
            new Chart(graficoCategoriasPizzaCtx, {
                type: 'doughnut',
                data: { labels: labelsCategorias, datasets: [{ label: 'Itens Vendidos', data: dadosCategorias, backgroundColor: ['rgba(255, 153, 204, 0.7)', 'rgba(91, 192, 222, 0.7)', 'rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)'], hoverOffset: 4 }] },
                options: { responsive: true, maintainAspectRatio: false }
            });

        } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error.message);
        }
    }

    // Código de teste temporário que discutimos
    const debugButton = document.getElementById('debug-auth-button');
    if (debugButton) {
        debugButton.addEventListener('click', () => {
            console.log("Iniciando teste de autenticação...");
            const currentUser = firebase.auth().currentUser;

            if (currentUser) {
                const userInfo = {
                    email: currentUser.email,
                    uid: currentUser.uid,
                    emailVerified: currentUser.emailVerified,
                    timestamp: new Date()
                };
                
                console.log("Enviando as seguintes informações para o Firestore:", userInfo);
                
                db.collection('teste').doc('auth-info').set(userInfo)
                    .then(() => {
                        alert('Teste concluído com sucesso! Verifique o banco de dados do Firebase.');
                    })
                    .catch(error => {
                        alert('O teste de escrita falhou! Veja o console de erros do navegador.');
                        console.error("ERRO NO TESTE:", error);
                    });
            } else {
                alert('TESTE FALHOU: O Firebase Auth diz que nenhum usuário está logado no momento do clique.');
            }
        });
    }
});