
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

    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

    // Add day headers
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
        calendar.appendChild(document.createElement('div'));
    }

    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const dayCell = document.createElement('div');
        const date = new Date(year, month, i);
        const dayOfWeek = date.getDay();
        dayCell.className = 'day';
        if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
            dayCell.classList.add('weekend');
        }
        const inputId = `day-${year}-${month}-${i}`;
        const savedValue = localStorage.getItem(inputId) || '';
        dayCell.innerHTML = `
            <div class="day-number">${i}</div>
            <input type="text" id="${inputId}" placeholder="Nome do plantonista" value="${savedValue}">
        `;
        calendar.appendChild(dayCell);
    }

    updateSummary();
}

function updateSummary() {
    const summary = {};
    const inputs = document.querySelectorAll('#calendar input');
    inputs.forEach(input => {
        const name = input.value.trim();
        if (name) {
            if (!summary[name]) {
                summary[name] = { count: 0, value: 0 };
            }
            summary[name].count++;
            summary[name].value += getDayValue(input.id);
        }
    });

    const summaryContent = document.getElementById('summaryContent');
    summaryContent.innerHTML = '';
    Object.entries(summary).forEach(([name, data]) => {
        const item = document.createElement('div');
        item.className = 'summary-item';
        item.innerHTML = `
            <h3>${name}</h3>
            <p>Plantões: ${data.count}</p>
            <p>Valor Total: R$ ${data.value.toFixed(2)}</p>
        `;
        summaryContent.appendChild(item);
    });
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

document.addEventListener('input', (e) => {
    if (e.target.matches('#calendar input')) {
        const inputId = e.target.id;
        const value = e.target.value;
        saveToLocalStorage(inputId, value);
        updateSummary();
    }
});

updateCalendar();

const PLANTAO_VALUE = 100; // Valor por plantão em reais

function exportMonthlyReport() {
    console.log('Iniciando exportação do relatório');

    const currentDate = new Date(currentYear, currentMonth);
    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
    const year = currentDate.getFullYear();

    console.log(`Mês: ${monthName}, Ano: ${year}`);

    // Criar dados para o relatório diário
    const dailyData = [
        ['Data', 'Dia da Semana', 'Analista de Plantão']
    ];

    // Objeto para contar plantões por analista
    const analystCount = {};

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dayOfWeek = date.toLocaleString('pt-BR', { weekday: 'long' });
        const analyst = getAnalystForDay(date);
        dailyData.push([`${day}/${currentMonth + 1}/${currentYear}`, dayOfWeek, analyst]);

        // Contar plantões por analista
        if (analyst !== 'Não definido') {
            analystCount[analyst] = (analystCount[analyst] || 0) + 1;
        }
    }

    console.log('Dados diários:', dailyData);
    console.log('Contagem de analistas:', analystCount);

    // Criar dados para o resumo
    const summaryData = [
        ['Analista', 'Número de Plantões', 'Valor a Receber (R$)']
    ];

    for (const [analyst, count] of Object.entries(analystCount)) {
        const value = count * PLANTAO_VALUE;
        summaryData.push([analyst, count, value.toFixed(2)]);
    }

    console.log('Dados do resumo:', summaryData);

    // Criar planilhas
    const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

    // Criar um livro e adicionar as planilhas
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, dailySheet, "Relatório Diário");
    XLSX.utils.book_append_sheet(wb, summarySheet, "Resumo");

    console.log('Livro criado com sucesso');

    // Gerar o arquivo XLSX
    XLSX.writeFile(wb, `Relatório_Plantão_${monthName}_${year}.xlsx`);

    console.log('Arquivo XLSX gerado');
}

function getAnalystForDay(date) {
    const dateString = date.toISOString().split('T')[0];
    const inputId = `day-${dateString}`;
    const input = document.getElementById(inputId);
    return input ? input.value : 'Não definido';
}


document.getElementById('exportMonthly').addEventListener('click', exportMonthlyReport);

// exportar plantoes


document.getElementById('exportMonthly').addEventListener('click', exportMonthlyReport);

function exportMonthlyReport() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = monthNames[month];
    
    // Dados para o relatório diário
    const dailyData = [['Data', 'Dia da Semana', 'Analista de Plantão']];
    
    // Objeto para contar plantões por analista
    const analystCount = {};
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = daysOfWeek[date.getDay()];
        const inputId = `day-${year}-${month}-${day}`;
        const analyst = document.getElementById(inputId).value || 'Não definido';
        dailyData.push([`${day}/${month + 1}/${year}`, dayOfWeek, analyst]);
        
        if (analyst !== 'Não definido') {
            analystCount[analyst] = (analystCount[analyst] || 0) + 1;
        }
    }
    
    // Dados para o resumo
    const summaryData = [['Analista', 'Número de Plantões', 'Valor a Receber (R$)']];
    for (const [analyst, count] of Object.entries(analystCount)) {
        const value = count * getDayValue(`day-${year}-${month}-1`); // Usando o valor do primeiro dia como referência
        summaryData.push([analyst, count, value.toFixed(2)]);
    }
    
    // Criar planilhas
    const wb = XLSX.utils.book_new();
    const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    XLSX.utils.book_append_sheet(wb, dailySheet, "Relatório Diário");
    XLSX.utils.book_append_sheet(wb, summarySheet, "Resumo");
    
    // Gerar o arquivo XLSX
    XLSX.writeFile(wb, `Relatório_Plantão_${monthName}_${year}.xlsx`);
}
