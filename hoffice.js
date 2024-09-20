let currentDate = new Date();
const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Estrutura para armazenar escalas por mês
let escalas = JSON.parse(localStorage.getItem('escalas')) || {};

// Função para atualizar o calendário
function updateCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

    let lastDay = new Date(year, month + 1, 0);

    for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i);
        if (date.getDay() === 5) { // Sexta-feira
            const dayCell = document.createElement('div');
            dayCell.className = 'day';
            dayCell.innerHTML = `
                <div class="day-number">${i}</div>
                <div class="analistas-container" id="analistasContainer-${year}-${month}-${i}"></div>
                <button class="add-analista-btn" onclick="addAnalista('${year}-${month}-${i}')">Adicionar Analista</button>
            `;
            calendar.appendChild(dayCell);
            loadEscalas(year, month, i); // Carrega as escalas para o dia
        }
    }
    updateSummary();
}

// Função para adicionar analista
function addAnalista(date) {
    const container = document.getElementById(`analistasContainer-${date}`);
    const escalados = getEscalados(date);

    const select = document.createElement('select');
    select.innerHTML = `
        <option value="">Selecione um analista</option>
        ${getAnalistas().filter(analista => !escalados.includes(analista.nome)).map(analista => `<option value="${analista.nome}" data-departamento="${analista.setor}" data-cargo="${analista.cargo}">${analista.nome}</option>`).join('')}
    `;

    // Adiciona um evento para atualizar o resumo quando um analista é selecionado
    select.onchange = () => {
        if (select.value) {
            saveEscala(date); // Salva a escala ao selecionar um analista
            updateSummary(); // Atualiza o resumo
        }
    };

    // Adiciona o select ao container
    container.appendChild(select);
}

// Função para obter analistas escalados
function getEscalados(date) {
    const [year, month, day] = date.split('-').map(Number);
    const key = `${year}-${month}`;
    return escalas[key] && escalas[key][day] ? escalas[key][day].map(a => a.nome) : [];
}

// Função para carregar escalas do localStorage
function loadEscalas(year, month, day) {
    const key = `${year}-${month}`;
    const container = document.getElementById(`analistasContainer-${year}-${month}-${day}`);
    
    // Limpa o container antes de carregar
    container.innerHTML = '';

    if (escalas[key] && escalas[key][day]) {
        escalas[key][day].forEach(analista => {
            const select = document.createElement('select');
            select.innerHTML = `
                <option value="">Selecione um analista</option>
                ${getAnalistas().map(a => `<option value="${a.nome}" data-departamento="${a.setor}" data-cargo="${a.cargo}" ${a.nome === analista.nome ? 'selected' : ''}>${a.nome}</option>`).join('')}
            `;
            select.onchange = () => {
                saveEscala(`${year}-${month}-${day}`); // Salva a escala ao alterar um analista
                updateSummary(); // Atualiza o resumo
            };
            container.appendChild(select);
        });
    } else {
        // Se não houver analistas, adiciona um select vazio
        addAnalista(`${year}-${month}-${day}`);
    }
}

// Função para salvar escalas no localStorage
function saveEscala(date) {
    const [year, month, day] = date.split('-').map(Number);
    const key = `${year}-${month}`;

    if (!escalas[key]) {
        escalas[key] = {};
    }
    if (!escalas[key][day]) {
        escalas[key][day] = [];
    }

    const container = document.getElementById(`analistasContainer-${date}`);
    const selects = container.getElementsByTagName('select');
    escalas[key][day] = Array.from(selects).map(select => ({
        nome: select.value,
        departamento: select.options[select.selectedIndex].dataset.departamento,
        cargo: select.options[select.selectedIndex].dataset.cargo
    })).filter(analista => analista.nome); // Filtra analistas vazios

    localStorage.setItem('escalas', JSON.stringify(escalas));
}

// Função para obter analistas do localStorage
function getAnalistas() {
    return JSON.parse(localStorage.getItem('analistas')) || [];
}

// Função para atualizar o resumo
function updateSummary() {
    const summaryContent = document.getElementById('summaryContent');
    summaryContent.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    let summaryData = [];

    const lastDay = new Date(year, month + 1, 0);

    for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i);
        if (date.getDay() === 5) { // Sexta-feira
            const container = document.getElementById(`analistasContainer-${year}-${month}-${i}`);
            const selects = container.getElementsByTagName('select');
            for (let select of selects) {
                if (select.value) {
                    const analista = select.options[select.selectedIndex];
                    summaryData.push({
                        nome: analista.value,
                        departamento: analista.dataset.departamento,
                        cargo: analista.dataset.cargo,
                        data: `${i}/${month + 1}/${year}`
                    });
                }
            }
        }
    }

    summaryData.forEach(item => {
        summaryContent.innerHTML += `<div class="card"><div class="card-title">${item.nome}</div><div class="card-info">${item.departamento} - ${item.cargo} - ${item.data}</div></div>`;
    });
}

// Exportar relatório
document.getElementById('exportReport').addEventListener('click', () => {
    const summaryData = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const lastDay = new Date(year, month + 1, 0);

    for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i);
        if (date.getDay() === 5) { // Sexta-feira
            const container = document.getElementById(`analistasContainer-${year}-${month}-${i}`);
            const selects = container.getElementsByTagName('select');
            for (let select of selects) {
                if (select.value) {
                    const analista = select.options[select.selectedIndex];
                    summaryData.push({
                        nome: analista.value,
                        departamento: analista.dataset.departamento,
                        cargo: analista.dataset.cargo,
                        data: `${i}/${month + 1}/${year}`
                    });
                }
            }
        }
    }

    // Corrigido para garantir que as colunas sejam preenchidas corretamente
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Nome,Departamento,Cargo,Data do Home Office\n"
        + summaryData.map(e => `${e.nome},${e.departamento},${e.cargo},${e.data}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_home_office.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Função para limpar a escala
document.getElementById('clearSchedule').addEventListener('click', () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const lastDay = new Date(year, month + 1, 0);

    for (let i = 1; i <= lastDay.getDate(); i++) {
        const key = `${year}-${month}`;
        if (escalas[key] && escalas[key][i]) {
            delete escalas[key][i]; // Remove as escalas do dia
        }
    }

    localStorage.setItem('escalas', JSON.stringify(escalas));
    updateCalendar(); // Atualiza o calendário
    updateSummary(); // Atualiza o resumo
});

// Navegação entre meses
document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
});

// Inicializa o calendário na primeira carga
updateCalendar();
