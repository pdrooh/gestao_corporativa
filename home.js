let analistas = JSON.parse(localStorage.getItem('analistas')) || [];

// Ordena os analistas em ordem alfabética
analistas.sort((a, b) => a.nome.localeCompare(b.nome));

// Função para carregar dados ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    atualizarListaAnalistas();
});

// Adicionar analista
document.getElementById('analistaForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const novoAnalista = {
        nome: document.getElementById('nomeAnalista').value.trim(),
        setor: document.getElementById('setorAnalista').value.trim(),
        cargo: document.getElementById('cargoAnalista').value.trim(),
        email: document.getElementById('emailAnalista').value.trim(),
        telefone: document.getElementById('telefoneAnalista').value.trim(),
        dataContratacao: document.getElementById('dataContratacaoInput').value,
        plantaoSemana: document.getElementById('plantaoSemanaValue').checked, // Lê o estado do checkbox
        plantaoFimSemana: document.getElementById('plantaoFimSemanaValue').checked // Lê o estado do checkbox
    };

    if (novoAnalista.nome) {
        analistas.push(novoAnalista);
        salvarDados();
        atualizarListaAnalistas();
        document.getElementById('analistaForm').reset();
    } else {
        mostrarNotificacao("Por favor, insira um nome para o analista.");
    }
});

// Salvar dados no localStorage
function salvarDados() {
    localStorage.setItem('analistas', JSON.stringify(analistas));
}

// Atualizar lista de analistas
function atualizarListaAnalistas() {
    const listaAnalistasDiv = document.getElementById('analistasList');
    listaAnalistasDiv.innerHTML = ''; // Limpa a lista antes de atualizar

    analistas.forEach((analista, index) => {
        const item = document.createElement('div');
        item.className = 'analista-item';
        item.style.backgroundColor = '#e8f5e9'; // Cor de fundo
        item.style.padding = '10px'; // Espaçamento
        item.style.marginBottom = '10px'; // Margem inferior
        item.style.borderRadius = '5px'; // Bordas arredondadas
        item.style.display = 'flex'; // Flexbox para alinhar os itens
        item.style.justifyContent = 'space-between'; // Espaço entre os itens

        item.innerHTML = `
            <div>
                <strong>${analista.nome}</strong>
                <p>Disponível</p>
            </div>
            <div>
                <button onclick="abrirPopupAnalista(${index})" style="background-color: orange; border: none; color: white; padding: 5px; border-radius: 5px; cursor: pointer;">✏️</button>
                <button onclick="confirmarRemoverAnalista(${index})" style="background-color: red; border: none; color: white; padding: 5px; border-radius: 5px; cursor: pointer;">❌</button>
            </div>
        `;
        listaAnalistasDiv.appendChild(item);
    });

    // Atualiza o total de analistas
    document.getElementById('totalAnalistas').innerText = analistas.length;
}

// Remover analista
function removerAnalista(index) {
    analistas.splice(index, 1);
    salvarDados();
    atualizarListaAnalistas();
}

// Abrir popup com informações do analista
function abrirPopupAnalista(index) {
    const analista = analistas[index];

    // Preencher os campos do formulário com os dados do analista
    document.getElementById('nomeAnalistaPopup').value = analista.nome;
    document.getElementById('setorAnalistaPopup').value = analista.setor;
    document.getElementById('cargoAnalistaPopup').value = analista.cargo;
    document.getElementById('emailAnalistaPopup').value = analista.email;
    document.getElementById('telefoneAnalistaPopup').value = analista.telefone;
    document.getElementById('dataContratacaoPopup').value = analista.dataContratacao;

    // Carregar os valores dos plantões
    document.getElementById('plantaoSemanaValue').checked = analista.plantaoSemana; // Leitura correta
    document.getElementById('plantaoFimSemanaValue').checked = analista.plantaoFimSemana; // Leitura correta

    // Exibir o popup
    document.getElementById('popupOverlay').style.display = 'flex';

    // Armazenar o índice do analista para usar ao salvar
    document.getElementById('analistaFormPopup').setAttribute('data-index', index);
}

// Fechar popup
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('popupOverlay').style.display = 'none';
});

document.getElementById('popupOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        this.style.display = 'none';
    }
});

// Confirmação de delete
function confirmarRemoverAnalista(index) {
    const confirmar = confirm("Você tem certeza que deseja remover este analista?");
    if (confirmar) {
        removerAnalista(index);
    }
}

// Função para mostrar notificação
function mostrarNotificacao(mensagem) {
    const notification = document.getElementById('notification');
    notification.innerText = mensagem;
    notification.style.display = 'block';

    // Ocultar a notificação após 3 segundos
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Adicione um listener para o formulário do popup
document.getElementById('analistaFormPopup').addEventListener('submit', function(event) {
    event.preventDefault();

    // Obter o índice do analista a ser atualizado
    const index = this.getAttribute('data-index');

    // Atualizar os dados do analista
    analistas[index] = {
        nome: document.getElementById('nomeAnalistaPopup').value.trim(),
        setor: document.getElementById('setorAnalistaPopup').value.trim(),
        cargo: document.getElementById('cargoAnalistaPopup').value.trim(),
        email: document.getElementById('emailAnalistaPopup').value.trim(),
        telefone: document.getElementById('telefoneAnalistaPopup').value.trim(),
        dataContratacao: document.getElementById('dataContratacaoPopup').value,
        plantaoSemana: document.getElementById('plantaoSemanaValue').checked, // Atualiza corretamente
        plantaoFimSemana: document.getElementById('plantaoFimSemanaValue').checked // Atualiza corretamente
    };

    // Salvar os dados atualizados
    salvarDados();
    atualizarListaAnalistas();
    mostrarNotificacao("Dados do analista atualizados com sucesso!");
    document.getElementById('popupOverlay').style.display = 'none';
});

// Salvar configurações de plantão
document.getElementById('salvarButton').addEventListener('click', function() {
    const diasDeSemana = document.getElementById('plantaoSemanaValue').checked;
    const fimDeSemana = document.getElementById('plantaoFimSemanaValue').checked;

    const analistaIndex = document.getElementById('analistaFormPopup').getAttribute('data-index');

    if (analistaIndex !== null) {
        analistas[analistaIndex].plantaoSemana = diasDeSemana;
        analistas[analistaIndex].plantaoFimSemana = fimDeSemana;
        salvarDados(); // Salva as alterações
        mostrarNotificacao("Configurações de plantão salvas com sucesso!");
    } else {
        alert("Erro ao salvar as configurações.");
    }
});

// Função para alternar o estado do botão de plantão
function alternarPlantao(checkbox) {
    if (checkbox.checked) {
        // Ação quando ativado
        console.log(`${checkbox.id} ativado`);
    } else {
        // Ação quando desativado
        console.log(`${checkbox.id} desativado`);
    }
}

// Adiciona eventos de clique para os botões de alternância
document.getElementById('plantaoSemanaValue').addEventListener('click', function() {
    alternarPlantao(this);
});

document.getElementById('plantaoFimSemanaValue').addEventListener('click', function() {
    alternarPlantao(this);
});
