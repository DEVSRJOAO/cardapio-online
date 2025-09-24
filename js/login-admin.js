document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-login-admin');
    const emailInput = document.getElementById('admin-email');
    const senhaInput = document.getElementById('admin-senha');
    const mensagemErro = document.getElementById('mensagem-erro');

    const auth = firebase.auth();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        mensagemErro.textContent = ''; // Limpa erros antigos

        const email = emailInput.value;
        const senha = senhaInput.value;

        // Usa a função de login do Firebase
        auth.signInWithEmailAndPassword(email, senha)
            .then((userCredential) => {
                // Se o login for bem-sucedido, redireciona para o painel
                console.log('Login de administrador bem-sucedido!');
                window.location.href = '../admin/index.html';
            })
            .catch((error) => {
                // Se der erro, mostra uma mensagem amigável
                console.error("Erro de autenticação:", error);
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    mensagemErro.textContent = 'E-mail ou senha inválidos.';
                } else {
                    mensagemErro.textContent = 'Ocorreu um erro. Tente novamente.';
                }
            });
    });
});