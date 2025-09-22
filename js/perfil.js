document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Elementos da página
    const perfilNome = document.getElementById('perfil-nome');
    const perfilEmail = document.getElementById('perfil-email');
    const formEndereco = document.getElementById('form-endereco');
    const inputCep = document.getElementById('end-cep');
    const inputRua = document.getElementById('end-rua');
    const inputNumero = document.getElementById('end-numero');
    const inputBairro = document.getElementById('end-bairro');
    const inputComplemento = document.getElementById('end-complemento');
    const inputCidade = document.getElementById('end-cidade');

    let currentUser = null;

    // Proteção da página: verifica se o usuário está logado
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Se o usuário está logado, armazena seus dados e carrega o endereço
            currentUser = user;
            perfilNome.textContent = user.displayName || 'Não informado';
            perfilEmail.textContent = user.email;
            await carregarEndereco(user.uid);
        } else {
            // Se não está logado, redireciona para a página de login
            alert("Você precisa estar logado para acessar esta página.");
            window.location.href = '../auth-cliente/login.html';
        }
    });

    // Função para carregar o endereço do Firestore
    async function carregarEndereco(uid) {
        try {
            const userDocRef = db.collection('usuarios').doc(uid);
            const doc = await userDocRef.get();

            if (doc.exists && doc.data().endereco) {
                const endereco = doc.data().endereco;
                inputCep.value = endereco.cep || '';
                inputRua.value = endereco.rua || '';
                inputNumero.value = endereco.numero || '';
                inputBairro.value = endereco.bairro || '';
                inputComplemento.value = endereco.complemento || '';
                inputCidade.value = endereco.cidade || '';
            } else {
                console.log("Nenhum endereço encontrado para este usuário.");
            }
        } catch (error) {
            console.error("Erro ao carregar endereço: ", error);
        }
    }

    // Listener para salvar o endereço
    formEndereco.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Erro: Nenhum usuário logado.");
            return;
        }

        const enderecoData = {
            cep: inputCep.value,
            rua: inputRua.value,
            numero: inputNumero.value,
            bairro: inputBairro.value,
            complemento: inputComplemento.value,
            cidade: inputCidade.value,
        };

        try {
            const userDocRef = db.collection('usuarios').doc(currentUser.uid);
            // Usamos .set com { merge: true } para criar ou atualizar o documento sem apagar outros campos
            await userDocRef.set({
                endereco: enderecoData
            }, { merge: true });
            alert("Endereço salvo com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar endereço: ", error);
            alert("Ocorreu um erro ao salvar o endereço. Tente novamente.");
        }
    });
});