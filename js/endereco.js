// js/endereco.js (VERSÃO FINAL)
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
            // IMPORTANTE: Agora trabalhamos com uma subcoleção 'enderecos'
            userEnderecosRef = db.collection('usuarios').doc(user.uid).collection('enderecos');
            carregarEnderecos();
        } else {
            alert("Você precisa estar logado para acessar esta página.");
            window.location.href = '../auth-cliente/login.html';
        }
    });

    // Carrega e exibe todos os endereços salvos
    function carregarEnderecos() {
        userEnderecosRef.orderBy('apelido').onSnapshot(snapshot => {
            listaEnderecosDiv.innerHTML = '';
            if (snapshot.empty) {
                listaEnderecosDiv.innerHTML = '<p>Nenhum endereço cadastrado ainda.</p>';
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
                        <button class="btn-excluir-endereco" data-id="${enderecoId}">🗑️</button>
                    </div>
                `;
                listaEnderecosDiv.appendChild(enderecoCard);
            });
        });
    }

    // Abre o formulário para adicionar um novo endereço
    btnAbrirForm.addEventListener('click', () => {
        formTitulo.textContent = 'Adicionar Novo Endereço';
        formEndereco.reset();
        inputId.value = '';
        secaoForm.style.display = 'block';
        btnCancelar.style.display = 'block';
        btnAbrirForm.style.display = 'none';
    });

    // Cancela e esconde o formulário
    btnCancelar.addEventListener('click', () => {
        secaoForm.style.display = 'none';
        btnAbrirForm.style.display = 'block';
    });
    
    // Exclui um endereço
    listaEnderecosDiv.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-excluir-endereco')) {
            const idParaExcluir = e.target.dataset.id;
            if (confirm("Tem certeza que deseja excluir este endereço?")) {
                try {
                    await userEnderecosRef.doc(idParaExcluir).delete();
                    alert("Endereço excluído com sucesso.");
                } catch (error) {
                    console.error("Erro ao excluir endereço: ", error);
                    alert("Não foi possível excluir o endereço.");
                }
            }
        }
    });

    // Salva um endereço (novo ou editado)
    formEndereco.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const enderecoData = {
            apelido: inputApelido.value,
            rua: inputRua.value,
            numero: inputNumero.value,
            bairro: inputBairro.value,
            complemento: inputComplemento.value,
            cidade: inputCidade.value
        };

        try {
            await userEnderecosRef.add(enderecoData);
            alert("Endereço salvo com sucesso!");
            formEndereco.reset();
            secaoForm.style.display = 'none';
            btnAbrirForm.style.display = 'block';
        } catch (error) {
            console.error("Erro ao salvar endereço: ", error);
            alert("Ocorreu um erro ao salvar. Tente novamente.");
        }
    });
});