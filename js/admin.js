document.addEventListener('DOMContentLoaded', () => {
    // ELEMENTOS DO FORMULÁRIO
    const form = document.getElementById('form-doce');
    const formTitulo = document.getElementById('form-titulo');
    const doceIdInput = document.getElementById('doce-id');
    const doceNomeInput = document.getElementById('doce-nome');
    const docePrecoInput = document.getElementById('doce-preco');
    const doceImagemInput = document.getElementById('doce-imagem');
    const doceDescricaoInput = document.getElementById('doce-descricao');
    const doceDisponivelInput = document.getElementById('doce-disponivel');
    const doceCategoriaInput = document.getElementById('doce-categoria'); // Variável para o campo de categoria
    const btnSalvar = document.getElementById('btn-salvar');
    const btnCancelar = document.getElementById('btn-cancelar');
    const listaDocesAdmin = document.getElementById('lista-doces-admin');

    // Referências aos serviços do Firebase
    const docesCollection = db.collection('doces');

    // --- FUNÇÃO DE CARREGAMENTO ---
    async function carregarDoces() {
        docesCollection.orderBy('nome').onSnapshot(snapshot => {
            const doces = [];
            snapshot.forEach(doc => {
                doces.push({ id: doc.id, ...doc.data() });
            });
            renderizarListaAdmin(doces);
        });
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO E FORMULÁRIO ---
    function renderizarListaAdmin(doces) {
        listaDocesAdmin.innerHTML = '';
        doces.forEach(doce => {
            const item = document.createElement('div');
            item.classList.add('doce-item-admin');
            item.innerHTML = `
                <img src="${doce.imagem}" alt="${doce.nome}">
                <div class="doce-info">
                    <h4>${doce.nome}</h4>
                    <p>R$ ${Number(doce.preco).toFixed(2)}</p>
                    <p>${doce.descricao || ''}</p>
                </div>
                <div class="doce-status ${doce.disponivel ? 'status-disponivel' : 'status-indisponivel'}">
                    ${doce.disponivel ? 'Disponível' : 'Indisponível'}
                </div>
                <div class="doce-acoes">
                    <button class="btn-editar" data-id="${doce.id}">✏️</button>
                    <button class="btn-deletar" data-id="${doce.id}">🗑️</button>
                </div>
            `;
            listaDocesAdmin.appendChild(item);
        });
    }

    function limparFormulario() {
        form.reset();
        doceIdInput.value = '';
        if (doceImagemInput.dataset.existingUrl) {
            delete doceImagemInput.dataset.existingUrl;
        }
        formTitulo.textContent = 'Adicionar Novo Doce';
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Salvar Doce';
        btnCancelar.style.display = 'none';
    }

    async function preencherFormulario(id) {
        const docRef = docesCollection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            console.log('Nenhum doce encontrado com este ID!');
            return;
        }
        const doce = doc.data();

        formTitulo.textContent = 'Editar Doce';
        doceIdInput.value = id;
        doceNomeInput.value = doce.nome;
        docePrecoInput.value = doce.preco;
        doceCategoriaInput.value = doce.categoria; // Preenche a categoria ao editar
        doceImagemInput.value = '';
        doceImagemInput.dataset.existingUrl = doce.imagem;
        doceDescricaoInput.value = doce.descricao;
        doceDisponivelInput.checked = doce.disponivel;
        btnSalvar.textContent = 'Atualizar Doce';
        btnCancelar.style.display = 'inline-block';
        window.scrollTo(0, 0);
    }

    // --- EVENT LISTENERS ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';

        const id = doceIdInput.value;
        const imagemArquivo = doceImagemInput.files[0];
        let urlImagem = doceImagemInput.dataset.existingUrl || '';

        try {
            if (imagemArquivo) {
                btnSalvar.textContent = 'Enviando imagem...';
                const nomeArquivo = Date.now() + '-' + imagemArquivo.name;
                const storageRef = storage.ref('doces/' + nomeArquivo);
                const uploadTask = await storageRef.put(imagemArquivo);
                urlImagem = await uploadTask.ref.getDownloadURL();
                btnSalvar.textContent = 'Salvando dados...';
            }

            if (!urlImagem && !id) {
                alert('Por favor, selecione uma imagem para o novo doce.');
                btnSalvar.disabled = false;
                btnSalvar.textContent = 'Salvar Doce';
                return;
            }

            if (!doceNomeInput.value || !docePrecoInput.value) {
                alert('Nome e preço são obrigatórios.');
                btnSalvar.disabled = false;
                btnSalvar.textContent = 'Salvar Doce';
                return;
            }

            const dadosDoce = {
                nome: doceNomeInput.value,
                preco: parseFloat(docePrecoInput.value),
                imagem: urlImagem,
                descricao: doceDescricaoInput.value,
                disponivel: doceDisponivelInput.checked,
                categoria: doceCategoriaInput.value // **CORREÇÃO AQUI**
            };

            if (id) {
                await docesCollection.doc(id).update(dadosDoce);
                alert('Doce atualizado com sucesso!');
            } else {
                await docesCollection.add(dadosDoce);
                Swal.fire('Sucesso!', 'Doce adicionado com sucesso!', 'success');
            }

            limparFormulario();

        } catch (error) {
            console.error("Erro ao salvar o doce: ", error);
            alert('Ocorreu um erro ao salvar. Verifique o console.');
            btnSalvar.disabled = false;
            btnSalvar.textContent = 'Salvar Doce';
        }
    });

    btnCancelar.addEventListener('click', limparFormulario);

    listaDocesAdmin.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('btn-editar')) {
            preencherFormulario(id);
        }

        if (e.target.classList.contains('btn-deletar')) {
            if (confirm('Tem certeza que deseja deletar este doce?')) {
                try {
                    await docesCollection.doc(id).delete();
                    alert('Doce deletado com sucesso!');
                } catch (error) {
                    console.error("Erro ao deletar o doce: ", error);
                    alert('Ocorreu um erro ao deletar.');
                }
            }
        }
    });

    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = '../admin/login.html';
            return;
        }
        const token = await user.getIdTokenResult();
        if (token.claims.admin !== true && user.email !== 'js2291072@gmail.com') {
            alert('Sem permissão de administrador.');
            await firebase.auth().signOut();
            window.location.href = '../admin/login.html';
            return;
        }

        // --- INICIALIZAÇÃO ---
        carregarDoces();
    });
});