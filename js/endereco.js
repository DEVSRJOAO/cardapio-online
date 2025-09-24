document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Elementos da página
    const listaEnderecosDiv = document.getElementById('lista-enderecos');
    const secaoForm = document.getElementById('secao-form-endereco');
    const formEndereco = document.getElementById('form-endereco');
    const formTitulo = document.getElementById('form-endereco-titulo');
    const btnAbrirForm = document.getElementById('btn-abrir-form-endereco');
    const btnCancelar = document.getElementById('btn-cancelar-edicao');
    
    // Inputs do formulário
    const inputId = document.getElementById('endereco-id');
    const inputApelido = document.getElementById('end-apelido');
    const inputRua = document.getElementById('end-rua');
    const inputNumero = document.getElementById('end-numero');
    const inputBairro = document.getElementById('end-bairro');
    const inputComplemento = document.getElementById('end-complemento');
    const inputCidade = document.getElementById('end-cidade');

    let currentUser = null;
    let userEnderecosRef = null;

    // Protege a página e define a referência para os endereços do usuário
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            // IMPORTANTE: Trabalhamos com uma subcoleção 'enderecos' para cada usuário
            userEnderecosRef = db.collection('usuarios').doc(user.uid).collection('enderecos');
            carregarEnderecos();
        } else {
            alert("Você precisa estar logado para acessar esta página.");
            window.location.href = '../auth-cliente/login.html';
        }
    });

    // Carrega e exibe todos os endereços salvos em tempo real
    function carregarEnderecos() {
        userEnderecosRef.orderBy('apelido').onSnapshot(snapshot => {
            listaEnderecosDiv.innerHTML = '';
            if (snapshot.empty) {
                listaEnderecosDiv.innerHTML = '<p style="text-align: center; color: #777;">Nenhum endereço cadastrado ainda.</p>';
                return;
            }
            snapshot.forEach(doc => {
                const endereco = doc.data();
                const enderecoId = doc.id;
                const enderecoCard = document.createElement('div');
                enderecoCard.classList.add('endereco-card');
                enderecoCard.innerHTML = `
                    <div class="endereco-card-info">
                        <h4>${endereco.apelido}</h4>
                        <p>${endereco.rua}, ${endereco.numero}, ${endereco.bairro}</p>
                        <p>${endereco.complemento || ''}</p>
                        <p>${endereco.cidade}</p>
                    </div>
                    <div class="endereco-card-acoes">
                        <button class="btn-editar-endereco" data-id="${enderecoId}" title="Editar">✏️</button>
                        <button class="btn-excluir-endereco" data-id="${enderecoId}" title="Excluir">🗑️</button>
                    </div>
                `;
                listaEnderecosDiv.appendChild(enderecoCard);
            });
        });
    }

    // Abre o formulário para um novo endereço
    btnAbrirForm.addEventListener('click', () => {
        formTitulo.textContent = 'Adicionar Novo Endereço';
        formEndereco.reset();
        inputId.value = '';
        secaoForm.style.display = 'block';
        btnCancelar.style.display = 'block';
        btnAbrirForm.style.display = 'none';
        inputApelido.focus();
    });
    
    // Esconde e limpa o formulário
    function esconderFormulario() {
        formEndereco.reset();
        inputId.value = '';
        secaoForm.style.display = 'none';
        btnCancelar.style.display = 'none';
        btnAbrirForm.style.display = 'block';
    }

    btnCancelar.addEventListener('click', esconderFormulario);
    
    // Preenche o formulário para edição de um endereço existente
    async function preencherFormularioParaEdicao(id) {
        try {
            const docRef = userEnderecosRef.doc(id);
            const doc = await docRef.get();
            if (doc.exists) {
                const endereco = doc.data();
                inputId.value = id;
                inputApelido.value = endereco.apelido;
                inputRua.value = endereco.rua;
                inputNumero.value = endereco.numero;
                inputBairro.value = endereco.bairro;
                inputComplemento.value = endereco.complemento;
                inputCidade.value = endereco.cidade;
                
                formTitulo.textContent = 'Editar Endereço';
                btnAbrirForm.style.display = 'none';
                secaoForm.style.display = 'block';
                btnCancelar.style.display = 'block';
                inputApelido.focus();
            }
        } catch (error) {
            console.error("Erro ao buscar endereço para edição:", error);
            alert("Não foi possível carregar os dados deste endereço.");
        }
    }

    // Listener de cliques na lista para AÇÕES (Editar ou Excluir)
    listaEnderecosDiv.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;

        if (target.classList.contains('btn-editar-endereco')) {
            preencherFormularioParaEdicao(id);
        }

        if (target.classList.contains('btn-excluir-endereco')) {
            Swal.fire({
                title: 'Tem certeza?',
                text: "Esta ação não pode ser desfeita.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sim, excluir!',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await userEnderecosRef.doc(id).delete();
                        Swal.fire('Excluído!', 'O endereço foi removido.', 'success');
                    } catch (error) {
                        console.error("Erro ao excluir endereço: ", error);
                        Swal.fire('Ops!', 'Não foi possível excluir o endereço.', 'error');
                    }
                }
            });
        }
    });

    // Salva um endereço (seja ele novo ou uma edição)
    formEndereco.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const enderecoId = inputId.value; // Pega o ID do campo escondido
        const enderecoData = {
            apelido: inputApelido.value,
            rua: inputRua.value,
            numero: inputNumero.value,
            bairro: inputBairro.value,
            complemento: inputComplemento.value,
            cidade: inputCidade.value
        };

        try {
            if (enderecoId) { // Se tem ID, está editando (update)
                await userEnderecosRef.doc(enderecoId).update(enderecoData);
                Swal.fire('Sucesso!', 'Endereço atualizado com sucesso!', 'success');
            } else { // Se não tem ID, está criando (add)
                await userEnderecosRef.add(enderecoData);
                Swal.fire('Sucesso!', 'Novo endereço salvo!', 'success');
            }
            esconderFormulario();
        } catch (error) {
            console.error("Erro ao salvar endereço: ", error);
            Swal.fire('Ops!', 'Ocorreu um erro ao salvar. Tente novamente.', 'error');
        }
    });
});