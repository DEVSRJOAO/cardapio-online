// js/perfil.js (VERSÃO CORRIGIDA E FINAL)
document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

    // Elementos da página
    const perfilNome = document.getElementById('perfil-nome');
    const perfilEmail = document.getElementById('perfil-email');
    const perfilFoto = document.getElementById('perfil-foto');
    const avatarEditIcon = document.querySelector('.avatar-edit-icon');
    const uploadFotoInput = document.getElementById('upload-foto');
    const btnAlterarSenha = document.getElementById('btn-alterar-senha');
    const perfilTelefone = document.getElementById('perfil-telefone');
    const btnEditarTelefone = document.getElementById('btn-editar-telefone');

    let currentUser = null;

    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            carregarDadosDoUsuario(user);
        } else {
            alert("Você precisa estar logado para acessar esta página.");
            window.location.href = '../auth-cliente/login.html';
        }
    });

    // CORREÇÃO AQUI: Esta função agora busca TUDO do Firestore
    async function carregarDadosDoUsuario(user) {
        // O nome podemos pegar direto do Auth, pois é definido no cadastro
        perfilNome.textContent = `Olá, ${user.displayName || 'Cliente'}`;
        perfilEmail.textContent = user.email;

        try {
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            if (userDoc.exists) {
                const dados = userDoc.data();

                // Carrega a foto a partir do Firestore (fonte mais confiável)
                if (dados.photoURL) {
                    perfilFoto.src = dados.photoURL;
                } else {
                    perfilFoto.src = '../imagens/avatar-placeholder.png';
                }

                // Carrega o telefone a partir do Firestore
                if (dados.telefone) {
                    perfilTelefone.textContent = dados.telefone;
                } else {
                    perfilTelefone.textContent = 'Adicionar telefone';
                }
            } else {
                // Se o documento no Firestore ainda não existe
                perfilFoto.src = '../imagens/avatar-placeholder.png';
                perfilTelefone.textContent = 'Adicionar telefone';
            }
        } catch (error) {
            console.error("Erro ao carregar dados do usuário:", error);
        }
    }

    // --- LÓGICA DO TELEFONE ---
    btnEditarTelefone.addEventListener('click', async () => {
        const telefoneAtual = perfilTelefone.textContent.includes('Adicionar') ? '' : perfilTelefone.textContent;
        const { value: novoTelefone } = await Swal.fire({
            title: 'Qual é o seu telefone?', input: 'tel', inputLabel: 'Seu número de telefone com DDD',
            inputValue: telefoneAtual, confirmButtonText: 'Salvar', showCancelButton: true, cancelButtonText: 'Cancelar',
            inputValidator: (value) => !value && 'Você precisa digitar um número!'
        });
        if (novoTelefone) {
            salvarTelefone(novoTelefone);
        }
    });

    async function salvarTelefone(telefone) {
        if (!currentUser) return;
        try {
            await db.collection('usuarios').doc(currentUser.uid).set({ telefone: telefone }, { merge: true });
            perfilTelefone.textContent = telefone;
            Swal.fire('Sucesso!', 'Seu telefone foi salvo.', 'success');
        } catch (error) {
            console.error("Erro ao salvar telefone:", error);
            Swal.fire('Ops!', 'Não foi possível salvar seu telefone.', 'error');
        }
    }

    // --- LÓGICA DA FOTO DE PERFIL ---
    avatarEditIcon.addEventListener('click', () => {
        uploadFotoInput.click();
    });

    uploadFotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadFotoDePerfil(file);
        }
    });

    async function uploadFotoDePerfil(file) {
        if (!currentUser) return;
        const filePath = `fotosDePerfil/${currentUser.uid}/${Date.now()}-${file.name}`;
        const storageRef = storage.ref(filePath);
        try {
            const snapshot = await storageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            await currentUser.updateProfile({ photoURL: downloadURL }); // Atualiza no Auth
            await db.collection('usuarios').doc(currentUser.uid).set({ photoURL: downloadURL }, { merge: true }); // Atualiza no Firestore
            perfilFoto.src = downloadURL;
            Swal.fire('Sucesso!', 'Foto de perfil atualizada.', 'success');
        } catch (error) {
            console.error("Erro ao fazer upload da foto: ", error);
            Swal.fire('Ops!', 'Ocorreu um erro ao enviar sua foto.', 'error');
        }
    }

    // --- LÓGICA DE ALTERAR SENHA ---
    btnAlterarSenha.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentUser) return;
        Swal.fire({
            title: 'Alterar Senha?', text: `Enviaremos um e-mail para ${currentUser.email} com as instruções.`,
            icon: 'question', showCancelButton: true, confirmButtonText: 'Sim, enviar e-mail', cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                auth.sendPasswordResetEmail(currentUser.email)
                    .then(() => { Swal.fire('E-mail Enviado!', 'Verifique sua caixa de entrada para redefinir sua senha.', 'success'); })
                    .catch((error) => {
                        console.error("Erro ao enviar e-mail de redefinição:", error);
                        Swal.fire('Ops!', 'Ocorreu um erro. Tente novamente.', 'error');
                    });
            }
        });
    });
});