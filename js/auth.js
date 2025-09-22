document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();

    // --- LÓGICA DE CADASTRO ---
    const formCadastro = document.getElementById('form-cadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('cadastro-nome').value;
            const email = document.getElementById('cadastro-email').value;
            const senha = document.getElementById('cadastro-senha').value;
            const mensagem = document.getElementById('auth-mensagem');

            try {
                // Cria o usuário com e-mail e senha
                const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
                // Adiciona o nome ao perfil do usuário
                await userCredential.user.updateProfile({
                    displayName: nome
                });
                alert(`Bem-vindo(a), ${nome}! Cadastro realizado com sucesso.`);
                window.location.href = 'index.html'; // Redireciona para a loja
            } catch (error) {
                console.error("Erro no cadastro:", error);
                mensagem.textContent = `Erro: ${error.message}`;
            }
        });
    }

    // --- LÓGICA DE LOGIN ---
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-senha').value;
            const mensagem = document.getElementById('auth-mensagem');

            try {
                await auth.signInWithEmailAndPassword(email, senha);
                alert("Login realizado com sucesso!");
                window.location.href = 'index.html'; // Redireciona para a loja
            } catch (error) {
                console.error("Erro no login:", error);
                mensagem.textContent = `Erro: ${error.message}`;
            }
        });
    }
});