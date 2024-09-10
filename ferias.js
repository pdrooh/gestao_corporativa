let ferias = JSON.parse(localStorage.getItem('ferias')) || [];
let analistas = JSON.parse(localStorage.getItem('analistas')) || [];

function salvarDados() {
    localStorage.setItem('ferias', JSON.stringify(ferias));
    localStorage.setItem('analistas', JSON.stringify(analistas));
}

document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    atualizarListaAnalistas();
    atualizarListaFerias();
    inicializarFiltroData();
    atualizarStatusAnalistas();
});

function carregarDados() {
    const feriasData = localStorage.getItem('ferias');
    const analistasData = localStorage.getItem('analistas');
    
    if (feriasData) {
        ferias = JSON.parse(feriasData);
    }
    
    if (analistasData) {
        analistas = JSON.parse(analistasData);
    }
}


function criarAnalista(nome, cargo = '', dataContratacao = '', telefone = '') {
    return {
        nome,
        cargo,
        dataContratacao,
        telefone,
        historicoFerias: []
    };
}

function adicionarAnalista(event) {
    event.preventDefault();
    const novoAnalistaNome = document.getElementById('novoAnalista').value.trim();
    if (novoAnalistaNome && !analistas.some(a => a.nome === novoAnalistaNome)) {
        const novoAnalista = criarAnalista(novoAnalistaNome);
        analistas.push(novoAnalista);
        salvarDados();
        atualizarListaAnalistas();
        atualizarStatusAnalistas();
        document.getElementById('novoAnalista').value = '';
        showNotification('Analista adicionado com sucesso!');
    } else {
        showNotification('Analista já existe ou nome inválido.', 'error');
    }
}

function adicionarFerias(event) {
    event.preventDefault();
    const analistaNome = document.getElementById('analista').value;
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;

    if (analistaNome && dataInicio && dataFim) {
        ferias.push({ analista: analistaNome, dataInicio, dataFim });
        const analista = analistas.find(a => a.nome === analistaNome);
        if (analista) {
            if (!analista.historicoFerias) {
                analista.historicoFerias = [];
            }
            analista.historicoFerias.push({ dataInicio, dataFim });
        }
        salvarDados();
        atualizarListaFerias();
        atualizarStatusAnalistas();
        event.target.reset();
        showNotification('Férias adicionadas com sucesso!');
    } else {
        showNotification('Por favor, preencha todos os campos.', 'error');
    }
}

function atualizarListaAnalistas() {
    const select = document.getElementById('analista');
    select.innerHTML = '<option value="">Selecione um analista</option>';
    analistas.forEach(analista => {
        const option = document.createElement('option');
        option.value = analista.nome;
        option.textContent = analista.nome;
        select.appendChild(option);
    });
}

function atualizarListaFerias() {
    const listaFerias = document.getElementById('feriasList');
    listaFerias.innerHTML = '';
    const hoje = new Date();

    ferias.forEach((periodo, index) => {
        const item = document.createElement('div');
        item.className = 'ferias-item';
        
        const fimFerias = new Date(periodo.dataFim);
        const concluido = fimFerias < hoje;
        
        if (concluido) {
            item.style.backgroundColor = '#E8F5E9';
        }

        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span style="display: flex; align-items: center;">
                    ${concluido ? '<i class="fas fa-check-circle" style="color: green; margin-right: 5px;"></i>' : ''}
                    <strong>${periodo.analista}</strong>: ${periodo.dataInicio} até ${periodo.dataFim}
                </span>
                <button onclick="removerFerias(${index})" class="btn-remover">Remover</button>
            </div>
        `;
        listaFerias.appendChild(item);
    });
}


function removerFerias(index) {
    const feriasRemovidas = ferias.splice(index, 1)[0];
    const analista = analistas.find(a => a.nome === feriasRemovidas.analista);
    if (analista && analista.historicoFerias) {
        const indexHistorico = analista.historicoFerias.findIndex(
            f => f.dataInicio === feriasRemovidas.dataInicio && f.dataFim === feriasRemovidas.dataFim
        );
        if (indexHistorico !== -1) {
            analista.historicoFerias.splice(indexHistorico, 1);
        }
    }
    salvarDados();
    atualizarListaFerias();
    atualizarStatusAnalistas();
    showNotification('Férias removidas com sucesso!');
}

function removerAnalista(index) {
    const analistaNome = analistas[index].nome;
    analistas.splice(index, 1);
    ferias = ferias.filter(f => f.analista !== analistaNome);
    salvarDados();
    atualizarListaAnalistas();
    atualizarListaFerias();
    atualizarStatusAnalistas();
    showNotification('Analista removido com sucesso!');
}

function atualizarStatusAnalistas() {
    const dataInicioFiltro = new Date(document.getElementById('dataInicioFiltro').value);
    const dataFimFiltro = new Date(document.getElementById('dataFimFiltro').value);
    const statusAnalistas = document.getElementById('analistasStatus');
    statusAnalistas.innerHTML = '';

    analistas.forEach((analista, index) => {
        const periodoFerias = ferias.find(periodo => {
            const inicioFerias = new Date(periodo.dataInicio);
            const fimFerias = new Date(periodo.dataFim);
            return periodo.analista === analista.nome && 
                   ((inicioFerias >= dataInicioFiltro && inicioFerias <= dataFimFiltro) ||
                    (fimFerias >= dataInicioFiltro && fimFerias <= dataFimFiltro) ||
                    (inicioFerias <= dataInicioFiltro && fimFerias >= dataFimFiltro));
        });

        const status = periodoFerias ? 'Indisponível' : 'Disponível';
        const statusClass = periodoFerias ? 'indisponivel' : 'disponivel';

        const item = document.createElement('div');
        item.className = `analista-status ${statusClass}`;
        item.innerHTML = `
            <div class="analista-info">
                <p><strong>${analista.nome}</strong></p>
                <p class="status-text">${status}</p>
                ${periodoFerias ? `<p class="ferias-periodo">Ausente de ${periodoFerias.dataInicio} até ${periodoFerias.dataFim}</p>` : ''}
            </div>
            <div class="analista-actions">
                <button onclick="abrirPopupAnalista(${index})" class="btn-icon btn-view"><i class="fas fa-eye"></i></button>
                <button onclick="confirmarRemoverAnalista(${index})" class="btn-icon btn-delete"><i class="fas fa-trash"></i></button>
            </div>
        `;
        statusAnalistas.appendChild(item);
    });
}

function confirmarRemoverAnalista(index) {
    if (confirm(`Tem certeza que deseja remover ${analistas[index].nome}?`)) {
        removerAnalista(index);
    }
}

function inicializarFiltroData() {
    const hoje = new Date();
    const dataInicioFiltro = document.getElementById('dataInicioFiltro');
    const dataFimFiltro = document.getElementById('dataFimFiltro');

    dataInicioFiltro.valueAsDate = hoje;
    dataFimFiltro.valueAsDate = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
}

function filtrarStatus() {
    atualizarStatusAnalistas();
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.className = 'notification';
    }, 3000);
}

function abrirPopupAnalista(index) {
    const analista = analistas[index];
    document.getElementById('analistaId').value = index;
    document.getElementById('analistaNome').value = analista.nome || '';
    document.getElementById('analistaCargo').value = analista.cargo || '';
    document.getElementById('analistaDataContratacao').value = analista.dataContratacao || '';
    document.getElementById('analistaTelefone').value = analista.telefone || '';

    atualizarHistoricoFerias(analista);

    document.getElementById('popupOverlay').style.display = 'flex';
}

document.getElementById('analistaForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const index = parseInt(document.getElementById('analistaId').value);
    const analista = analistas[index];
    const nomeOriginal = analista.nome;
    const novoNome = document.getElementById('analistaNome').value;

    analista.nome = novoNome;
    analista.cargo = document.getElementById('analistaCargo').value;
    analista.dataContratacao = document.getElementById('analistaDataContratacao').value;
    analista.telefone = document.getElementById('analistaTelefone').value;

    if (nomeOriginal !== novoNome) {
        atualizarFeriasAnalista(nomeOriginal, novoNome);
    }

    salvarDados();
    atualizarListaAnalistas();
    atualizarStatusAnalistas();
    atualizarListaFerias();

    // Atualiza os dados no popup
    abrirPopupAnalista(index);

    showNotification('Informações do analista atualizadas com sucesso!');
    document.getElementById('popupOverlay').style.display = 'none';
});





function atualizarHistoricoFerias(analista) {
    const historicoElement = document.getElementById('historicoFerias');
    historicoElement.innerHTML = '<h3>Histórico de Férias</h3>';

    const feriasAnalista = ferias.filter(f => f.analista === analista.nome);
    if (feriasAnalista.length === 0) {
        historicoElement.innerHTML += '<p class="no-ferias">Nenhum registro de férias.</p>';
    } else {
        const lista = document.createElement('ul');
        lista.className = 'ferias-lista';
        const hoje = new Date();

        feriasAnalista.forEach((f, index) => {
            const item = document.createElement('li');
            const fimFerias = new Date(f.dataFim);
            const concluido = fimFerias < hoje;

            item.className = `ferias-item ${concluido ? 'concluido' : 'pendente'}`;
            
            item.innerHTML = `
                <span class="ferias-periodo">
                    <i class="fas ${concluido ? 'fa-check-circle' : 'fa-clock'}"></i>
                    ${f.dataInicio} até ${f.dataFim}
                </span>
                <button onclick="removerFeriasAnalista('${analista.nome}', ${index})" 
                        class="btn-remover-ferias">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            lista.appendChild(item);
        });
        historicoElement.appendChild(lista);
    }

    const proximasFerias = feriasAnalista.find(f => new Date(f.dataInicio) > new Date());
    if (proximasFerias) {
        historicoElement.innerHTML += `
            <p class="proximas-ferias">
                <i class="fas fa-plane-departure"></i>
                Próximas férias: ${proximasFerias.dataInicio} até ${proximasFerias.dataFim}
            </p>`;
    }
}



function removerFeriasAnalista(analistaNome, index) {
    const analista = analistas.find(a => a.nome === analistaNome);
    if (analista && analista.historicoFerias) {
        analista.historicoFerias.splice(index, 1);
    }
    ferias = ferias.filter((f, i) => !(f.analista === analistaNome && i === index));
    salvarDados();
    atualizarHistoricoFerias(analista);
    atualizarListaFerias();
    atualizarStatusAnalistas();
    showNotification('Férias do analista removidas com sucesso!');
}

function atualizarFeriasAnalista(antigoNome, novoNome) {
    ferias.forEach(periodo => {
        if (periodo.analista === antigoNome) {
            periodo.analista = novoNome;
        }
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    atualizarListaAnalistas();
    atualizarListaFerias();
    inicializarFiltroData();
    atualizarStatusAnalistas();

    document.getElementById('analistaForm').addEventListener('submit', adicionarAnalista);
    document.getElementById('feriasForm').addEventListener('submit', adicionarFerias);
    document.getElementById('filtrarStatus').addEventListener('click', filtrarStatus);

    const expandButtons = document.querySelectorAll('.expand-btn');
    expandButtons.forEach(button => {
        button.addEventListener('click', () => {
            const content = button.parentElement.nextElementSibling;
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
            button.innerHTML = content.style.display === 'none' ? '<i class="fas fa-chevron-down"></i>' : '<i class="fas fa-chevron-up"></i>';
        });
    });

    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('analistaPopup').style.display = 'none';
    });
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('popupOverlay').style.display = 'none';
    });
    
    document.getElementById('analistaForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const index = parseInt(document.getElementById('analistaId').value);
        const analista = analistas[index];
        const nomeOriginal = analista.nome;
        const novoNome = document.getElementById('analistaNome').value;
    
        analista.nome = novoNome;
        analista.cargo = document.getElementById('analistaCargo').value;
        analista.dataContratacao = document.getElementById('analistaDataContratacao').value;
        analista.telefone = document.getElementById('analistaTelefone').value;
    
        if (nomeOriginal !== novoNome) {
            atualizarFeriasAnalista(nomeOriginal, novoNome);
        }
    
        salvarDados();
        atualizarListaAnalistas();
        atualizarStatusAnalistas();
        atualizarListaFerias();
    
        // Atualiza os dados no popup
        abrirPopupAnalista(index);
    
        showNotification('Informações do analista atualizadas com sucesso!');
    });

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
        notification.style.padding = '15px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '1000';
        document.body.appendChild(notification);
    
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    
    
    document.getElementById('popupOverlay').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
    

    document.getElementById('analistaForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const index = parseInt(document.getElementById('analistaId').value);
        const analista = analistas[index];
        const nomeOriginal = analista.nome;
        const novoNome = document.getElementById('analistaNome').value;
    
        analista.nome = novoNome;
        analista.cargo = document.getElementById('analistaCargo').value;
        analista.dataContratacao = document.getElementById('analistaDataContratacao').value;
        analista.telefone = document.getElementById('analistaTelefone').value;
    
        if (nomeOriginal !== novoNome) {
            atualizarFeriasAnalista(nomeOriginal, novoNome);
        }
    
        salvarDados(); // Chama a função para salvar os dados
    
        atualizarListaAnalistas();
        atualizarStatusAnalistas();
        atualizarListaFerias();
    
        document.getElementById('popupOverlay').style.display = 'none';
        showNotification('Informações do analista atualizadas com sucesso!');
    });
    
});



// Fechar o popup quando clicar no X
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('popupOverlay').style.display = 'none';
});

// Fechar o popup quando clicar fora dele
document.getElementById('popupOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        this.style.display = 'none';
    }
});


// exportar dados 

document.getElementById('exportarRelatorio').addEventListener('click', exportarRelatorio);
function exportarRelatorio() {
    const dataInicioFiltro = new Date(document.getElementById('dataInicioFiltro').value);
    const dataFimFiltro = new Date(document.getElementById('dataFimFiltro').value);
    const hoje = new Date();

    if (isNaN(dataInicioFiltro.getTime()) || isNaN(dataFimFiltro.getTime())) {
        showNotification('Por favor, selecione um período válido antes de exportar o relatório.', 'error');
        return;
    }

    // Cabeçalho do CSV
    let csv = 'Nome,Status,Período de Férias no Filtro,Cargo,Data de Contratação,Telefone,Últimas Férias,Próximas Férias\n';

    analistas.forEach(analista => {
        const periodoFerias = ferias.find(periodo => {
            const inicioFerias = new Date(periodo.dataInicio);
            const fimFerias = new Date(periodo.dataFim);
            return periodo.analista === analista.nome && 
                   ((inicioFerias >= dataInicioFiltro && inicioFerias <= dataFimFiltro) ||
                    (fimFerias >= dataInicioFiltro && fimFerias <= dataFimFiltro) ||
                    (inicioFerias <= dataInicioFiltro && fimFerias >= dataFimFiltro));
        });

        const status = periodoFerias ? 'Indisponível' : 'Disponível';
        const periodoFeriasStr = periodoFerias ? `${periodoFerias.dataInicio} a ${periodoFerias.dataFim}` : '';

        // Encontrar as últimas férias tiradas
        const ultimasFerias = ferias
            .filter(f => f.analista === analista.nome && new Date(f.dataFim) < hoje)
            .sort((a, b) => new Date(b.dataFim) - new Date(a.dataFim))[0];

        // Encontrar as próximas férias programadas
        const proximasFerias = ferias
            .filter(f => f.analista === analista.nome && new Date(f.dataInicio) > hoje)
            .sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio))[0];

        const ultimasFeriasStr = ultimasFerias ? `${ultimasFerias.dataInicio} a ${ultimasFerias.dataFim}` : 'Não encontradas';
        const proximasFeriasStr = proximasFerias ? `${proximasFerias.dataInicio} a ${proximasFerias.dataFim}` : 'Não programadas';

        // Escapar vírgulas e quebras de linha nos campos
        const escapeCsv = (field) => {
            if (field && (field.includes(',') || field.includes('\n') || field.includes('"'))) {
                return `"${field.replace(/"/g, '""')}"`;
            }
            return field || '';
        };

        csv += [
            escapeCsv(analista.nome),
            escapeCsv(status),
            escapeCsv(periodoFeriasStr),
            escapeCsv(analista.cargo),
            escapeCsv(analista.dataContratacao),
            escapeCsv(analista.telefone),
            escapeCsv(ultimasFeriasStr),
            escapeCsv(proximasFeriasStr)
        ].join(',') + '\n';
    });

    // Criar um blob com o conteúdo do CSV
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    
    // Criar um link para download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_ferias_${dataInicioFiltro.toISOString().split('T')[0]}_${dataFimFiltro.toISOString().split('T')[0]}.csv`;
    
    // Adicionar o link ao documento, clicar nele e depois removê-lo
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Relatório CSV exportado com sucesso!');
}
