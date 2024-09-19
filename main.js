let currentDate = new Date();
const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function updateCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    document.getElementById('currentMonth').textContent = `${monthNames[month]}`;

    // Adiciona cabeçalhos dos dias
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });

    // Adiciona células vazias para os dias antes do primeiro dia do mês
    for (let i = 0; i < firstDay.getDay(); i++) {
        calendar.appendChild(document.createElement('div'));
    }

    // Adiciona os dias do mês
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const dayCell = document.createElement('div');
        const date = new Date(year, month, i);
        dayCell.className = 'day';

        if (date.getDay() === 5 || date.getDay() === 6 || date.getDay() === 0) { // Sexta, Sábado ou Domingo
            dayCell.classList.add('weekend');
        }

        const inputId = `day-${year}-${month}-${i}`;
        const savedValue = localStorage.getItem(inputId) || '';

        dayCell.innerHTML = `
            <div class="day-number">${i}</div>
            <select id="${inputId}">
                <option value="">Selecione um analista</option>
                ${getAnalistasPorTipo(date.getDay()).sort((a, b) => a.nome.localeCompare(b.nome)).map(analista => `
                    <option value="${analista.nome}" ${savedValue === analista.nome ? 'selected' : ''}>${analista.nome}</option>
                `).join('')}
            </select>
        `;
        calendar.appendChild(dayCell);
    }

    updateSummary();
}

function getAnalistas() {
    return JSON.parse(localStorage.getItem('analistas')) || [];
}

function getAnalistasPorTipo(dayOfWeek) {
    const analistas = getAnalistas();
    return analistas.filter(analista => {
        const podePlantaoSemana = analista.plantaoSemana && dayOfWeek >= 1 && dayOfWeek <= 4; // Segunda a Quinta
        const podePlantaoFimDeSemana = analista.plantaoFimSemana && (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0); // Sexta a Domingo
        return podePlantaoSemana || podePlantaoFimDeSemana; // Habilitado para pelo menos um tipo de plantão
    });
}

function updateSummary() {
    const summary = {};
    const selects = document.querySelectorAll('#calendar select');
    let totalValue = 0;

    selects.forEach(select => {
        const name = select.value.trim();
        const date = select.closest('.day').querySelector('.day-number').textContent;
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        if (name) {
            if (!summary[name]) {
                summary[name] = { count: 0, value: 0 };
            }
            summary[name].count++;
            const dayValue = getDayValue(select.id);
            summary[name].value += dayValue;
            totalValue += dayValue;
        }
    });

    const summaryContent = document.getElementById('summaryContent');
    summaryContent.innerHTML = '';

    Object.entries(summary)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([name, data]) => {
            const item = document.createElement('div');
            item.className = 'summary-item';
            item.innerHTML = `
                <h3>${name}</h3>
                <p>Plantões: ${data.count}</p>
                <p>Valor Total: R$ ${data.value.toFixed(2)}</p>
            `;
            summaryContent.appendChild(item);
        });

    const totalItem = document.getElementById('totalGeral');
    totalItem.innerHTML = `
        <h3>Total Geral</h3>
        <p>Valor Total a Pagar: R$ ${totalValue.toFixed(2)}</p>
    `;
}

function getDayValue(inputId) {
    const [_, year, month, day] = inputId.split('-');
    const dayOfWeek = new Date(year, month, day).getDay();
    return [5, 6, 0].includes(dayOfWeek) ? 100 : 35; // Sexta, Sábado, Domingo: 100; Outros dias: 35
}

function saveToLocalStorage(inputId, value) {
    localStorage.setItem(inputId, value);
}

document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
});

document.addEventListener('change', (e) => {
    if (e.target.matches('#calendar select')) {
        const inputId = e.target.id;
        const value = e.target.value;
        saveToLocalStorage(inputId, value);
        updateSummary();

        // Se o analista foi selecionado numa sexta-feira, preenche automaticamente sábado e domingo
        const dayNumber = parseInt(inputId.split('-')[3]);
        const dayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber).getDay();
        
        if (dayOfWeek === 5) { // Sexta-feira
            preencherFimDeSemana(inputId, value);
        }
    }
});

// Atualiza o calendário ao carregar a página
updateCalendar();

function exportMonthlyReport() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = monthNames[month];

    const analystData = {};

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        const inputId = `day-${year}-${month}-${day}`;
        const analyst = document.getElementById(inputId).value || 'Não definido';

        if (analyst !== 'Não definido') {
            if (!analystData[analyst]) {
                analystData[analyst] = { weekdayShifts: 0, weekendShifts: 0, totalValue: 0, setor: '', cargo: '' };
            }

            if (dayOfWeek >= 1 && dayOfWeek <= 4) {
                analystData[analyst].weekdayShifts++;
                analystData[analyst].totalValue += 35;
                analystData[analyst].plantao = "Plantão durante a semana";
            } else if (dayOfWeek === 5) {
                analystData[analyst].weekendShifts++;
                analystData[analyst].totalValue += 100;
                analystData[analyst].plantao = "Plantão fim de semana";
            } else {
                analystData[analyst].weekendShifts++;
                analystData[analyst].totalValue += 100;
                analystData[analyst].plantao = "Plantão fim de semana";
            }

            const analistaInfo = getAnalistas().find(a => a.nome === analyst);
            if (analistaInfo) {
                analystData[analyst].setor = analistaInfo.setor || '';
                analystData[analyst].cargo = analistaInfo.cargo || '';
            }
        }
    }

    const reportData = [['Nome', 'Setor', 'Cargo', 'Valor a Receber (R$)', 'Plantão']];

    Object.entries(analystData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([analyst, data]) => {
            reportData.push([
                analyst,
                data.setor,
                data.cargo,
                data.totalValue.toFixed(2),
                data.plantao
            ]);
        });

    const wb = XLSX.utils.book_new();
    const reportSheet = XLSX.utils.aoa_to_sheet(reportData);

    XLSX.utils.book_append_sheet(wb, reportSheet, "Relatório de Plantões");

    XLSX.writeFile(wb, `Relatório_Plantão_${monthName}_${year}.xlsx`);
}

// Função para preencher a escala de forma randomizada
function preencherEscala() {
    const analistas = getAnalistas(); // Obter todos os analistas
    const escalas = {};
    const diasNoMes = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    // Inicializa contagem de plantões
    analistas.forEach(analista => {
        escalas[analista.nome] = { semana: 0, fimDeSemana: 0 };
    });

    for (let i = 1; i <= diasNoMes; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const dayOfWeek = date.getDay();

        let selectedAnalista = null;

        if (dayOfWeek >= 1 && dayOfWeek <= 4) { // Segunda a Quinta
            selectedAnalista = escolherAnalistaParaSemana(escalas);
            if (selectedAnalista) {
                escalas[selectedAnalista].semana++;
                const inputId = `day-${currentDate.getFullYear()}-${currentDate.getMonth()}-${i}`;
                document.getElementById(inputId).value = selectedAnalista;
                saveToLocalStorage(inputId, selectedAnalista);
            }
        } else if (dayOfWeek === 5) { // Sexta-feira
            selectedAnalista = escolherAnalistaParaFimDeSemana(escalas);
            if (selectedAnalista) {
                escalas[selectedAnalista].fimDeSemana++;
                const inputId = `day-${currentDate.getFullYear()}-${currentDate.getMonth()}-${i}`;
                document.getElementById(inputId).value = selectedAnalista;
                saveToLocalStorage(inputId, selectedAnalista);

                // Preenche automaticamente Sábado e Domingo
                for (let j = 1; j <= 2; j++) { // Sábado e Domingo
                    const nextDayInputId = `day-${currentDate.getFullYear()}-${currentDate.getMonth()}-${i + j}`;
                    document.getElementById(nextDayInputId).value = selectedAnalista;
                    saveToLocalStorage(nextDayInputId, selectedAnalista);
                    escalas[selectedAnalista].fimDeSemana++;
                }
            }
        } else if (dayOfWeek >= 6) { // Sábado e Domingo
            // Não permite que analistas que já têm plantão de fim de semana sejam selecionados novamente
            const analistaParaFimDeSemana = escolherAnalistaParaFimDeSemana(escalas);
            if (analistaParaFimDeSemana) {
                escalas[analistaParaFimDeSemana].fimDeSemana++;
                const inputId = `day-${currentDate.getFullYear()}-${currentDate.getMonth()}-${i}`;
                document.getElementById(inputId).value = analistaParaFimDeSemana;
                saveToLocalStorage(inputId, analistaParaFimDeSemana);
            }
        }
    }

    // Atualiza o resumo após preencher a escala
    updateSummary();
}

function escolherAnalistaParaSemana(escalas) {
    const analistasElegiveis = Object.keys(escalas).filter(analista => escalas[analista].semana < 1 && escalas[analista].fimDeSemana === 0);
    if (analistasElegiveis.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * analistasElegiveis.length);
    return analistasElegiveis[randomIndex];
}

function escolherAnalistaParaFimDeSemana(escalas) {
    const analistasElegiveis = Object.keys(escalas).filter(analista => escalas[analista].fimDeSemana < 1 && escalas[analista].semana === 0);
    if (analistasElegiveis.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * analistasElegiveis.length);
    return analistasElegiveis[randomIndex];
}

// Função para preencher automaticamente sábado e domingo
function preencherFimDeSemana(inputId, analista) {
    const dayNumber = parseInt(inputId.split('-')[3]);
    const nextDayInputId = `day-${currentDate.getFullYear()}-${currentDate.getMonth()}-${dayNumber + 1}`; // Sábado
    const nextNextDayInputId = `day-${currentDate.getFullYear()}-${currentDate.getMonth()}-${dayNumber + 2}`; // Domingo

    // Preenche o sábado
    document.getElementById(nextDayInputId).value = analista;
    saveToLocalStorage(nextDayInputId, analista);

    // Preenche o domingo
    document.getElementById(nextNextDayInputId).value = analista;
    saveToLocalStorage(nextNextDayInputId, analista);

    // Atualiza a contagem de escalas
    updateSummary();
}

// Função para limpar a escala
function clearScale() {
    if (confirm("Você tem certeza que deseja limpar a escala?")) {
        const selects = document.querySelectorAll('#calendar select');
        selects.forEach(select => {
            select.value = '';
            saveToLocalStorage(select.id, '');
        });
        updateSummary();
    }
}

// Adiciona os manipuladores de eventos para os botões
document.getElementById('exportMonthly').addEventListener('click', exportMonthlyReport);
document.getElementById('preencherEscala').addEventListener('click', preencherEscala);
document.getElementById('clearScale').addEventListener('click', clearScale); // Adiciona evento para o botão de limpar

// Atualiza o calendário ao carregar a página
updateCalendar();
