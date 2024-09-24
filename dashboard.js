// Carregar os dados do localStorage
let analistas = JSON.parse(localStorage.getItem('analistas')) || [];
let ferias = JSON.parse(localStorage.getItem('ferias')) || [];
let plantao = JSON.parse(localStorage.getItem('plantao')) || [];
let homeOffice = JSON.parse(localStorage.getItem('homeOffice')) || [];

// Função para formatar data
function formatarData(dataString) {
    const [year, month, day] = dataString.split('-');
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`; // Formato DD-MM-AAAA
}

// Função para calcular dias de férias restantes
function calcularFeriasRestantes(analista) {
    // Calcular total de férias acumuladas
    const totalFerias = Math.floor((new Date() - new Date(analista.dataContratacao)) / (1000 * 60 * 60 * 24 * 365)) * 30;

    // Calcular férias usadas
    const feriasUsadas = ferias.filter(f => f.analista === analista.nome).reduce((total, f) => {
        const dataInicio = new Date(f.dataInicio);
        const dataFim = new Date(f.dataFim);
        const diasFeriados = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir o dia de início
        return total + diasFeriados;
    }, 0);

    // Calcular férias restantes
    const feriasRestantes = totalFerias - feriasUsadas;

    // Calcular a data de vencimento das próximas férias
    const dataVencimento = new Date(analista.dataContratacao);
    dataVencimento.setFullYear(dataVencimento.getFullYear() + Math.floor(totalFerias / 30)); // Atualiza a data com base no total de férias acumuladas

    return { feriasRestantes, dataVencimento };
}


// Inicializa a lista de analistas
function inicializarAnalistas() {
    const select = document.getElementById('selectAnalista');
    select.innerHTML = '<option value="">Selecione um analista</option>';

    analistas.forEach(analista => {
        const option = document.createElement('option');
        option.value = analista.nome;
        option.textContent = analista.nome;
        select.appendChild(option);
    });
}

// Gera o relatório do analista selecionado
function gerarRelatorio() {
    const analistaNome = document.getElementById('selectAnalista').value;
    const analista = analistas.find(a => a.nome === analistaNome);
    const notificacao = document.getElementById('notificacao');

    if (analista) {
        document.getElementById('nomeAnalista').textContent = `Relatório do Analista: ${analista.nome}`;
        preencherInformacoesGerais(analista);
        preencherHistoricoFerias(analista);
        preencherHistoricoPlantao(analista);
        preencherHistoricoHomeOffice(analista); // Certifique-se de que esta linha está presente

        const { feriasRestantes, dataVencimento } = calcularFeriasRestantes(analista);
        exibirDiasFeriasRestantes(feriasRestantes, dataVencimento);
    } else {
        notificacao.style.display = 'none'; // Ocultar notificação se não houver analista selecionado
    }
}

// Preencher informações gerais do analista
function preencherInformacoesGerais(analista) {
    const infoContainer = document.getElementById('informacoesGerais');
    infoContainer.innerHTML = `
        <h3>Informações Gerais</h3>
        <p><strong>Cargo:</strong> ${analista.cargo}</p>
        <p><strong>Setor:</strong> ${analista.setor}</p>
        <p><strong>Email:</strong> ${analista.email}</p>
        <p><strong>Telefone:</strong> ${analista.telefone}</p>
        <p><strong>Data de Contratação:</strong> ${formatarData(analista.dataContratacao)}</p>
    `;
}

// Preencher histórico de férias
function preencherHistoricoFerias(analista) {
    const tabelaFerias = document.getElementById('tabelaFerias').getElementsByTagName('tbody')[0];
    tabelaFerias.innerHTML = '';

    ferias.filter(f => f.analista === analista.nome).forEach(f => {
        const row = tabelaFerias.insertRow();
        row.insertCell(0).textContent = formatarData(f.dataInicio);
        row.insertCell(1).textContent = formatarData(f.dataFim);

        const statusCell = row.insertCell(2);
        const hoje = new Date();
        if (new Date(f.dataFim) < hoje) {
            statusCell.textContent = 'Concluída';
            statusCell.classList.add('status-concluida');
        } else {
            statusCell.textContent = 'Pendente';
            statusCell.classList.add('status-pendente');
        }
    });
}

// Preencher histórico de plantões
function preencherHistoricoPlantao(analista) {
    const tabelaPlantao = document.getElementById('tabelaPlantao').getElementsByTagName('tbody')[0];
    tabelaPlantao.innerHTML = '';

    plantao.filter(p => p.analista === analista.nome).forEach(p => {
        const row = tabelaPlantao.insertRow();
        row.insertCell(0).textContent = formatarData(p.data);
        row.insertCell(1).textContent = p.horaInicio;
        row.insertCell(2).textContent = p.horaFim;
        row.insertCell(3).textContent = p.tipo;
    });
}

// Preencher histórico de home office
function preencherHistoricoHomeOffice(analista) {
    const tabelaHomeOffice = document.getElementById('tabelaHomeOffice').getElementsByTagName('tbody')[0];
    tabelaHomeOffice.innerHTML = '';

    homeOffice.filter(h => h.analista === analista.nome).forEach(h => {
        const row = tabelaHomeOffice.insertRow();
        row.insertCell(0).textContent = formatarData(h.data);
    });
}

// Exibir dias de férias restantes
function exibirDiasFeriasRestantes(diasRestantes, dataVencimento) {
    const notificacao = document.getElementById('notificacao');

    if (diasRestantes > 0) {
        notificacao.textContent = `Esse analista ainda precisa tirar ${diasRestantes} dias de férias até a data ${formatarData(dataVencimento.toISOString().split('T')[0])}.`;
        notificacao.style.display = 'block'; // Mostrar notificação
    } else {
        notificacao.textContent = 'Esse analista não possui dias de férias restantes.';
        notificacao.style.display = 'block'; // Mostrar notificação
    }
}

// Inicializa o dashboard
document.addEventListener('DOMContentLoaded', () => {
    inicializarAnalistas();
    document.getElementById('selectAnalista').addEventListener('change', gerarRelatorio);
});
