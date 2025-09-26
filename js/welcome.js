// Aguarda o carregamento completo da página para executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURAÇÕES DA LOJA (CORRIGIDO) ---
    // Dias da semana (0 = Domingo, 1 = Segunda, 2 = Terça, ..., 6 = Sábado)
    const diasDeFuncionamento = [2, 3, 4, 5, 6, 0]; // Terça a Domingo
    const horaAbertura = 14; // 14h
    const horaFechamento = 22; // 22h

    // --- ELEMENTOS DA PÁGINA ---
    const statusContainer = document.getElementById('status-loja');
    const statusCirculo = document.getElementById('status-circulo');
    const statusTexto = document.getElementById('status-texto');
    const btnProsseguir = document.getElementById('btn-prosseguir');

    // --- LÓGICA DE VERIFICAÇÃO ---
    function verificarStatusLoja() {
        const agora = new Date();
        const diaDaSemana = agora.getDay();
        const horaAtual = agora.getHours();

        const hojeFunciona = diasDeFuncionamento.includes(diaDaSemana);
        const estaNoHorario = horaAtual >= horaAbertura && horaAtual < horaFechamento;

        if (hojeFunciona && estaNoHorario) {
            // LOJA ABERTA
            statusTexto.textContent = 'Estamos Abertos!';
            statusContainer.classList.add('status-aberto');
            statusContainer.classList.remove('status-fechado');
            btnProsseguir.textContent = 'Ver Cardápio e Pedir';
        } else {
            // LOJA FECHADA
            statusTexto.textContent = 'Estamos Fechados!';
            statusContainer.classList.add('status-fechado');
            statusContainer.classList.remove('status-aberto');
            btnProsseguir.textContent = 'Ver Cardápio';
            // Futuramente, aqui desabilitaremos o botão de finalizar pedido no carrinho
        }
    }

    // Executa a função assim que a página carrega
    verificarStatusLoja();

}); // A chave extra no final foi removida