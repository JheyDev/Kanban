// =========================================================================
// VARIÁVEIS GLOBAIS
// Armazenam o estado atual do Kanban e referências importantes
// =========================================================================
let draggedCard = null; // Armazena o card que está sendo arrastado durante a operação de drag-and-drop
let currentColumnContainer = null; // Armazena o container da coluna onde o card será solto
let currentCardInDetailsModal = null; // Referência ao objeto do card que está atualmente aberto no modal de detalhes
let taskIdCounter = 0; // Contador global para gerar IDs únicos para as novas tarefas

// Array principal para armazenar todos os objetos de tarefa (para persistência no Local Storage)
let tasks = [];

// =========================================================================
// REFERÊNCIAS DOS ELEMENTOS DO DOM
// Captura os elementos HTML com os quais o JavaScript irá interagir
// =========================================================================

// --- Modal de Nova Tarefa / Edição ---
const newTaskModal = document.getElementById('newTaskModal');
const newTaskForm = document.getElementById('newTaskForm');
const taskIdInput = document.getElementById('taskId');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescriptionInput = document.getElementById('taskDescription');
// const taskImageInput = document.getElementById('taskImage'); // Removido: dependia de API
const taskTypeSelect = document.getElementById('taskType');
const taskUrgencySelect = document.getElementById('taskUrgency');
const taskEstimatedDueInput = document.getElementById('taskEstimatedDue'); // datetime-local
const taskResponsibleInput = document.getElementById('taskResponsible');
const taskObservationInput = document.getElementById('taskObservation');
const taskStatusSelect = document.getElementById('taskStatus');
const saveTaskButton = document.getElementById('saveTaskButton');
const taskReporterInput = document.getElementById('taskReporter');

// --- Modal de Detalhes da Tarefa ---
const taskDetailsModal = document.getElementById('taskDetailsModal');
const detailTaskTitle = document.getElementById('detailTaskTitle');
const detailTaskDescription = document.getElementById('detailTaskDescription');
// const detailTaskImage = document.getElementById('detailTaskImage'); // Removido: dependia de API
const detailTaskType = document.getElementById('detailTaskType');
const detailTaskUrgency = document.getElementById('detailTaskUrgency');
const detailTaskEstimatedDue = document.getElementById('detailTaskEstimatedDue'); // Displays date and time
const detailTaskResponsible = document.getElementById('detailTaskResponsible');
const detailTaskObservation = document.getElementById('detailTaskObservation');
const detailTaskCurrentStatus = document.getElementById('detailTaskCurrentStatus');
const detailTaskReporter = document.getElementById('detailTaskReporter');
const detailTaskCreationDate = document.getElementById('detailTaskCreationDate'); // Displays date and time
const commentsContainer = document.getElementById('commentsContainer');
const newCommentTextarea = document.getElementById('newCommentText');

// =========================================================================
// FUNÇÕES DE UTILIDADE DE FORMATO
// =========================================================================

/**
 * Formata um objeto Date para a string "DD/MM/YY".
 * @param {Date} dateObj O objeto Date a ser formatado.
 * @returns {string} A string da data formatada.
 */
function formatDateToDDMMYY(dateObj) {
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear().toString().slice(-2); // Últimos 2 dígitos do ano
    return `${day}/${month}/${year}`; // Alterado para usar '/'
}

/**
 * Formata um objeto Date para a string "HH:MM am/pm".
 * @param {Date} dateObj O objeto Date a ser formatado.
 * @returns {string} A string da hora formatada.
 */
function formatTimeToAMPM(dateObj) {
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // A hora '0' deve ser '12' na formato AM/PM
    return `${hours}:${minutes}${ampm}`;
}

// =========================================================================
// INICIALIZAÇÃO E EVENT LISTENERS GLOBAIS
// Configura os ouvintes de eventos principais na carga da página e no formulário
// =========================================================================

/**
 * Função de inicialização que carrega as tarefas e configura todos os event listeners.
 * Chamada quando o DOM está completamente carregado.
 */
document.addEventListener('DOMContentLoaded', () => {
    loadTasks(); // Carrega as tarefas salvas do Local Storage
    setupDragAndDropListeners(); // Configura os event listeners para arrastar e soltar
    setupFormAndModalListeners(); // Configura event listeners para formulários e modais
});

/**
 * Configura os event listeners relacionados ao formulário de nova tarefa/edição
 * e ao fechamento dos modais clicando fora.
 */
function setupFormAndModalListeners() {
    // Listener para o formulário de nova tarefa/edição
    newTaskForm.addEventListener('submit', e => {
        e.preventDefault(); // Impede o comportamento padrão de recarregar a página
        saveTask(); // Chama a função para salvar a tarefa
    });

    // Fechar modais clicando fora de seu conteúdo
    window.addEventListener('click', e => {
        if (e.target === newTaskModal) {
            closeNewTaskModal();
        }
        if (e.target === taskDetailsModal) {
            closeTaskDetailsModal();
        }
    });
}

// =========================================================================
// FUNÇÕES DE DRAG AND DROP (ARRASTAR E SOLTAR)
// Gerenciam a movimentação de cards entre as colunas do Kanban
// =========================================================================

/**
 * Configura os event listeners para as funcionalidades de arrastar e soltar (drag and drop).
 */
function setupDragAndDropListeners() {
    // Evento de início do arrasto (no card)
    document.addEventListener("dragstart", e => {
        if (e.target.classList.contains("card")) {
            draggedCard = e.target;
            e.target.style.opacity = '0.4'; // Efeito visual: card semi-transparente
            closeTaskDetailsModal(); // Garante que o modal de detalhes seja fechado ao arrastar

            // Armazena o ID do card arrastado para ser recuperado no evento 'drop'
            e.dataTransfer.setData("text/plain", draggedCard.dataset.id);
        }
    });

    // Evento de fim do arrasto (ocorre após soltar o item ou cancelar o arrasto)
    document.addEventListener("dragend", () => {
        if (draggedCard) draggedCard.style.opacity = '1'; // Restaura a opacidade normal
        draggedCard = null; // Limpa a referência do card arrastado
        // Remove a classe de destaque visual de todas as áreas de drop
        document.querySelectorAll(".card-container").forEach(c => c.classList.remove('drag-over'));
    });

    // Adiciona listeners para cada container de cards (que serve como área de drop)
    document.querySelectorAll(".column").forEach(column => { // Listener na coluna para o dragover/dragleave
        const container = column.querySelector('.card-container'); // O container real para os cards

        // Evento quando um item arrastável entra ou se move sobre o container
        column.addEventListener("dragover", e => {
            e.preventDefault(); // Impede o comportamento padrão (que não permite drop)
            container.classList.add('drag-over'); // Adiciona um estilo visual de destaque
        });

        // Evento quando um item arrastável sai do container
        column.addEventListener("dragleave", () => {
            container.classList.remove('drag-over'); // Remove o estilo visual de destaque
        });

        // Evento de soltar o item no container
        column.addEventListener("drop", e => {
            e.preventDefault();
            container.classList.remove('drag-over'); // Remove o estilo visual de destaque
            const cardId = e.dataTransfer.getData("text/plain"); // Recupera o ID do card arrastado
            const droppedCardElement = document.querySelector(`.card[data-id="${cardId}"]`); // Busca o elemento do card

            if (droppedCardElement) {
                const newColumnStatus = column.dataset.status; // Obtém o status da nova coluna

                // Encontra a tarefa no array global 'tasks'
                const task = tasks.find(t => t.id === cardId);

                if (task) {
                    // Lógica para salvar o status anterior antes de concluir
                    if (newColumnStatus === 'concluido' && task.status !== 'concluido') {
                        task.previousStatus = task.status;
                    } else if (newColumnStatus !== 'concluido' && task.previousStatus) {
                        delete task.previousStatus;
                    }
                    
                    task.status = newColumnStatus; // Atualiza o status da tarefa
                    task.isCompleted = (newColumnStatus === 'concluido'); // Define 'isCompleted'
                    
                    renderCard(task); // Chamar renderCard para atualizar o card
                    saveTasks(); // Salva as tarefas atualizadas no Local Storage
                }
            }
        });
    });
}


// =========================================================================
// MODAL MANIPULATION FUNCTIONS (ADD/EDIT TASK)
// Controls display and filling of the task form
// =========================================================================

/**
 * Abre o modal para adicionar ou editar uma tarefa.
 * @param {object} taskDataToEdit - O objeto da tarefa a ser editada (ou null para nova tarefa).
 * @param {boolean} isEdit - Indica se o modal está sendo aberto para edição de uma tarefa existente (true) ou para uma nova tarefa (false).
 */
function openNewTaskModal(taskDataToEdit = null, isEdit = false) {
    // Define o título e texto do botão de salvar com base no modo (adicionar/editar)
    document.getElementById('newTaskModalTitle').textContent = isEdit ? "Editar Tarefa" : "Adicionar Nova Tarefa";
    saveTaskButton.textContent = isEdit ? "Salvar Alterações" : "Adicionar Tarefa";

    if (!isEdit) {
        // Lógica para adicionar uma nova tarefa
        newTaskForm.reset(); // Limpa todos os campos do formulário
        taskIdInput.value = ''; // Limpa o ID para indicar que é uma nova tarefa
        taskTypeSelect.value = "";
        taskUrgencySelect.value = "";
        taskEstimatedDueInput.value = "";
        taskResponsibleInput.value = "";
        taskObservationInput.value = "";
        taskStatusSelect.value = "backlog"; // Status inicial padrão
        taskReporterInput.value = "";
        // taskImageInput.value = ""; // Removido
    } else {
        // Se for modo de edição, preenche os campos com os dados da tarefa existente
        if (taskDataToEdit) {
            taskIdInput.value = taskDataToEdit.id;
            taskTitleInput.value = taskDataToEdit.title || '';
            taskDescriptionInput.value = taskDataToEdit.description || '';
            // taskImageInput.value = ''; // Removido
            taskTypeSelect.value = taskDataToEdit.type || '';
            taskUrgencySelect.value = taskDataToEdit.urgency || '';

            // Preenche input datetime-local a partir de uma string ISO
            if (taskDataToEdit.estimatedDue) {
                const date = new Date(taskDataToEdit.estimatedDue);
                const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                taskEstimatedDueInput.value = localDate.toISOString().substring(0, 16);
            } else {
                taskEstimatedDueInput.value = '';
            }

            taskResponsibleInput.value = taskDataToEdit.responsible || '';
            taskObservationInput.value = taskDataToEdit.observation || '';
            taskStatusSelect.value = taskDataToEdit.status || 'backlog';
            taskReporterInput.value = taskDataToEdit.reporterName || '';
        } else {
            console.error("Erro: taskDataToEdit não fornecido para edição.");
            closeNewTaskModal();
            return;
        }
    }

    newTaskModal.style.display = 'flex';
    taskTitleInput.focus();
}


/**
 * Fecha o modal de nova tarefa/edição e reinicia o formulário.
 */
function closeNewTaskModal() {
    newTaskModal.style.display = 'none';
    newTaskForm.reset();
    currentColumnContainer = null;
    taskIdInput.value = '';
}

/**
 * Salva uma nova tarefa ou atualiza uma existente no array 'tasks' e no Local Storage.
 * Realiza validação dos campos obrigatórios antes de prosseguir.
 */
function saveTask() {
    const id = taskIdInput.value;
    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    // const imageUrl = ''; // Removido
    const type = taskTypeSelect.value;
    const urgency = taskUrgencySelect.value;

    const estimatedDueValue = taskEstimatedDueInput.value;
    let estimatedDue = null;
    if (estimatedDueValue) {
        const date = new Date(estimatedDueValue);
        estimatedDue = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()).toISOString();
    }

    const responsible = taskResponsibleInput.value.trim();
    const observation = taskObservationInput.value.trim();
    const status = taskStatusSelect.value;
    const reporterName = taskReporterInput.value.trim();


    const requiredFields = [
        { field: title, name: 'Título da Tarefa', element: taskTitleInput },
        { field: description, name: 'Descrição', element: taskDescriptionInput },
        { field: type, name: 'Tipo de Atividade', element: taskTypeSelect },
        { field: urgency, name: 'Prioridade', element: taskUrgencySelect },
        { field: status, name: 'Status', element: taskStatusSelect },
    ];

    for (const { field, name, element } of requiredFields) {
        if (!field) {
            alert(`O campo '${name}' é obrigatório. Por favor, preencha-o.`);
            element.focus();
            return;
        }
    }

    let taskData;

    if (id) {
        // Lógica para editar uma tarefa existente
        taskData = tasks.find(t => t.id === id);

        if (!taskData) {
            console.error("Erro: Tarefa não encontrada para edição.");
            return closeNewTaskModal();
        }

        taskData.title = title;
        taskData.description = description;
        // taskData.imageUrl = imageUrl; // Removido
        taskData.type = type;
        taskData.urgency = urgency;
        taskData.estimatedDue = estimatedDue;
        taskData.responsible = responsible;
        taskData.observation = observation;
        taskData.status = status;
        taskData.isCompleted = (status === 'concluido');
        taskData.reporterName = reporterName;
    } else {
        // Lógica para adicionar uma nova tarefa
        const newId = `task-${++taskIdCounter}`;
        taskData = {
            id: newId,
            title: title,
            description: description,
            // imageUrl: imageUrl, // Removido
            type: type,
            urgency: urgency,
            creationDate: new Date().toISOString(), // Data de criação automática
            estimatedDue: estimatedDue,
            responsible: responsible,
            observation: observation,
            status: status,
            isCompleted: (status === 'concluido'),
            reporterName: reporterName,
            comments: [] // Inicializa um array vazio para comentários
        };
        tasks.push(taskData);
    }

    renderCard(taskData); // Renderiza/atualiza o card na UI
    closeNewTaskModal(); // Fecha o modal
    saveTasks(); // Salva o estado atualizado das tarefas no Local Storage
}

/**
 * Renderiza ou atualiza um card de tarefa no Kanban board.
 * Se o card já existe, ele é atualizado com os novos dados. Caso contrário, um novo card é criado.
 * @param {object} taskData - O objeto da tarefa a ser renderizado.
 */
function renderCard(taskData) {
    let cardElement = document.querySelector(`.card[data-id="${taskData.id}"]`);

    // Remove o card existente se ele estiver em uma coluna diferente
    if (cardElement && cardElement.closest('.column').dataset.status !== taskData.status) {
        cardElement.remove();
        cardElement = null; // Garante que um novo elemento seja criado se o status mudou
    }

    if (!cardElement) {
        cardElement = document.createElement("div");
        cardElement.className = "card";
        cardElement.setAttribute("draggable", "true");
        cardElement.setAttribute("onclick", "openTaskDetailsModal(this)");
        cardElement.dataset.id = taskData.id;

        // Adiciona o card ao container correto da coluna
        document.querySelector(`.column[data-status="${taskData.status}"] .card-container`).appendChild(cardElement);
    }

    // Lógica para obter texto e classe de urgência
    let urgenciaTexto = '';
    let urgenciaClasse = '';
    switch (taskData.urgency) {
        case 'alta': urgenciaTexto = '🔴 Alta'; urgenciaClasse = 'prioridade-alta'; break;
        case 'media': urgenciaTexto = '🟡 Média'; urgenciaClasse = 'prioridade-media'; break;
        case 'baixa': urgenciaTexto = '🟢 Baixa'; urgenciaClasse = 'prioridade-baixa'; break;
        default: urgenciaTexto = 'Não definida'; urgenciaClasse = 'prioridade-desconhecida';
    }

    // Lógica para obter texto e classe do tipo de atividade
    let tipoTexto = '';
    let tipoClasse = '';
    switch (taskData.type) {
        case 'bug': tipoTexto = '🪲 Bug'; tipoClasse = 'tipo-bug'; break;
        case 'melhoria': tipoTexto = '✨ Melhoria'; tipoClasse = 'tipo-melhoria'; break;
        case 'nova-funcionalidade': tipoTexto = '🚀 Nova Função'; tipoClasse = 'tipo-nova-funcionalidade'; break;
        case 'refatoracao': tipoTexto = '🔧 Refatoração'; tipoClasse = 'tipo-refatoracao'; break;
        default: tipoTexto = 'Não especificado'; tipoClasse = 'tipo-desconhecido';
    }

    // Formata a data de prazo estimado e data de criação (incluindo hora)
    const dueDateObj = taskData.estimatedDue ? new Date(taskData.estimatedDue) : null;
    const creationDateObj = taskData.creationDate ? new Date(taskData.creationDate) : null;

    const formattedDueDate = dueDateObj ? `${formatDateToDDMMYY(dueDateObj)} ${formatTimeToAMPM(dueDateObj)}` : 'Não Definido';
    const formattedCreationDate = creationDateObj ? `${formatDateToDDMMYY(creationDateObj)} ${formatTimeToAMPM(creationDateObj)}` : 'Não Definida';

    // Atualiza o conteúdo HTML interno do card com o layout
    cardElement.innerHTML = `
        <div class="card-main-content">
            <div class="card-top-row">
                <strong class="card-title">${taskData.title}</strong>
                <span class="card-responsible-name">🧑‍💻 ${taskData.responsible || 'Não Atribuído'}</span>
            </div>
            <div class="card-middle-row">
                <span class="tag ${tipoClasse}">${tipoTexto}</span>
                <span class="tag ${urgenciaClasse}">${urgenciaTexto}</span>
            </div>
            <div class="card-bottom-row">
                <span class="card-due-date">📅 Prazo: ${formattedDueDate}</span>
                <span class="card-creation-info">📅 Post: ${formattedCreationDate}</span>
            </div>
        </div>
        <div class="card-actions">
            <button class="edit-card-btn" onclick="event.stopPropagation(); editCardDirectly(this)">Editar</button>
            <button class="toggle-complete-btn" onclick="event.stopPropagation(); toggleTaskCompletion(this)">
                ${taskData.isCompleted ? 'Desmarcar' : 'Concluído'}
            </button>
            <button class="remove-btn" onclick="event.stopPropagation(); confirmRemoval(this)" title="Remover Tarefa">Remover</button>
        </div>
    `;

    updateCardColorAndStyle(cardElement); // Aplica a cor de fundo do card baseada no seu status
}

/**
 * Aplica classes CSS ao card para definir sua cor de fundo com base no status da tarefa.
 * @param {HTMLElement} cardElement - O elemento DOM do card a ser estilizado.
 */
function updateCardColorAndStyle(cardElement) {
    const task = tasks.find(t => t.id === cardElement.dataset.id);
    if (!task) return;

    // Remove todas as classes de status de coluna existentes para evitar múltiplos estilos
    const statusClasses = [
        'status-backlog',
        'status-analise',
        'status-desenvolvimento',
        'status-testes',
        'status-aguardando-aprovacao',
        'status-concluido'
    ];
    statusClasses.forEach(c => cardElement.classList.remove(c));

    // Adiciona a classe de status correta ao card, definindo sua cor de fundo
    cardElement.classList.add(`status-${task.status}`);

    // Garante que o atributo data-is-completed do elemento DOM esteja atualizado
    cardElement.dataset.isCompleted = task.isCompleted ? 'true' : 'false';
}

/**
 * Alterna o status de conclusão de uma tarefa (concluído/não concluído) e a move para a coluna apropriada.
 * @param {HTMLElement} button - O botão "Concluído/Desmarcar" que foi clicado.
 */
function toggleTaskCompletion(button) {
    const card = button.closest('.card');
    const task = tasks.find(t => t.id === card.dataset.id);
    if (!task) return;

    task.isCompleted = !task.isCompleted;

    if (task.isCompleted) {
        task.previousStatus = task.status; // Salva o status atual antes de virar "concluido"
        task.status = 'concluido'; // Move para a coluna "Concluido"
        button.textContent = 'Desmarcar';
    } else {
        task.status = task.previousStatus || 'backlog'; // Retorna ao status anterior ou backlog
        delete task.previousStatus; // Limpa o previousStatus
        button.textContent = 'Concluído';
    }

    renderCard(task); // Re-renderiza o card para movê-lo visualmente e atualizar seu estilo
    saveTasks(); // Salva o estado atualizado das tarefas
    
    // Se o modal de detalhes estiver aberto para esta tarefa, atualiza os detalhes exibidos
    if (currentCardInDetailsModal?.dataset.id === card.dataset.id) {
        openTaskDetailsModal(card);
    }
}

/**
 * Exibe uma caixa de diálogo de confirmação e, se aprovado, remove a tarefa do board e do armazenamento.
 * @param {HTMLElement} element - O elemento (botão 'X' ou card) que iniciou a remoção.
 */
function confirmRemoval(element) {
    const cardToRemove = element.closest('.card');
    if (cardToRemove) {
        if (confirm('Tem certeza que deseja remover esta tarefa permanentemente? Esta ação não pode ser desfeita.')) {
            tasks = tasks.filter(t => t.id !== cardToRemove.dataset.id); // Remove a tarefa do array
            cardToRemove.remove(); // Remove o elemento DOM do card
            
            // Se o modal de detalhes estiver aberto para a tarefa que foi removida, fecha-o
            if (currentCardInDetailsModal?.dataset.id === cardToRemove.dataset.id) {
                closeTaskDetailsModal();
            }
            saveTasks(); // Salva as tarefas atualizadas
        }
    }
}

/**
 * Preenche o formulário de adição/edição de tarefas com os dados de um card existente,
 * abrindo-o no modo de edição.
 * @param {HTMLElement} button - O botão 'Editar' dentro do card que foi clicado.
 */
function editCardDirectly(button) {
    const card = button.closest('.card');
    if (!card) return;

    // Fecha o modal de detalhes se ele estiver aberto para o card atual
    if (currentCardInDetailsModal?.dataset.id === card.dataset.id) {
        closeTaskDetailsModal();
    }

    const task = tasks.find(t => t.id === card.dataset.id);
    if (!task) {
        console.error("Erro: Tarefa não encontrada para edição direta.");
        return;
    }

    openNewTaskModal(task, true); // Chama openNewTaskModal passando o objeto da tarefa
    taskTitleInput.focus();
}


// =========================================================================
// FUNÇÕES DE MANIPULAÇÃO DE MODAL DE DETALHES DA TAREFA
// Exibem informações detalhadas da tarefa e gerenciam comentários
// =========================================================================

/**
 * Abre o modal de detalhes da tarefa e exibe todas as suas informações.
 * Também carrega e exibe os comentários associados à tarefa.
 * @param {HTMLElement} cardElement - O elemento DOM do card que foi clicado.
 */
function openTaskDetailsModal(cardElement) {
    currentCardInDetailsModal = cardElement;
    const task = tasks.find(t => t.id === cardElement.dataset.id);
    if (!task) {
        console.error("Erro: Tarefa não encontrada para exibir detalhes.");
        return closeTaskDetailsModal();
    }

    detailTaskTitle.textContent = task.title;
    detailTaskDescription.textContent = task.description || 'N/A';

    // detailTaskImage.src = ''; // Removido
    // detailTaskImage.style.display = 'none'; // Removido

    let typeText = 'Não Informado';
    switch (task.type) {
        case 'bug': typeText = 'Bug'; break;
        case 'melhoria': typeText = 'Melhoria'; break;
        case 'nova-funcionalidade': typeText = 'Nova Funcionalidade'; break;
        case 'refatoracao': typeText = 'Refatoração'; break;
    }
    detailTaskType.textContent = typeText;

    let urgencyText = 'Não Informada';
    switch (task.urgency) {
        case 'alta': urgencyText = '🔴 Alta'; break;
        case 'media': urgencyText = '🟡 Média'; break;
        case 'baixa': urgencyText = '🟢 Baixa'; break;
    }
    detailTaskUrgency.textContent = urgencyText;

    // Formata a data de prazo estimado para exibição
    const dueDateObj = task.estimatedDue ? new Date(task.estimatedDue) : null;
    const creationDateObj = task.creationDate ? new Date(task.creationDate) : null;

    detailTaskEstimatedDue.textContent = dueDateObj ? `${formatDateToDDMMYY(dueDateObj)} ${formatTimeToAMPM(dueDateObj)}` : 'Não Definido';
    detailTaskResponsible.textContent = task.responsible || 'Não Atribuído';
    detailTaskObservation.textContent = task.observation || 'Nenhuma';

    let statusText = '';
    switch (task.status) {
        case 'backlog': statusText = 'Backlog'; break;
        case 'analise': statusText = 'Em Análise'; break;
        case 'desenvolvimento': statusText = 'Em Desenvolvimento'; break;
        case 'testes': statusText = 'Em Testes'; break;
        case 'aguardando-aprovacao': statusText = 'Aguardando Aprovação'; break;
        case 'concluido': statusText = 'Concluido'; break;
        default: statusText = 'Desconhecido';
    }
    detailTaskCurrentStatus.textContent = statusText;

    detailTaskReporter.textContent = task.reporterName || 'Não Informado';
    // Formata a data de criação para exibição
    detailTaskCreationDate.textContent = creationDateObj ? `${formatDateToDDMMYY(creationDateObj)} ${formatTimeToAMPM(creationDateObj)}` : 'Não Definida';

    loadComments(task.id); // Carrega e exibe os comentários

    taskDetailsModal.style.display = 'flex';
}

/**
 * Fecha o modal de detalhes da tarefa e limpa os campos de exibição e a área de comentários.
 */
function closeTaskDetailsModal() {
    taskDetailsModal.style.display = 'none';
    currentCardInDetailsModal = null;
    commentsContainer.innerHTML = '';
    newCommentTextarea.value = '';
    // detailTaskImage.src = ''; // Removido
    // detailTaskImage.style.display = 'none'; // Removido
}

/**
 * Função utilitária para acionar a edição da tarefa que está aberta no modal de detalhes.
 * Reusa a função `editCardDirectly`.
 */
function editTaskFromDetails() {
    if (!currentCardInDetailsModal) return;
    editCardDirectly(currentCardInDetailsModal);
}

/**
 * Função utilitária para acionar a remoção da tarefa que está aberta no modal de detalhes.
 * Reusa a função `confirmRemoval`.
 */
function deleteTaskFromDetails() {
    if (currentCardInDetailsModal) {
        confirmRemoval(currentCardInDetailsModal);
    }
}


// =========================================================================
// FUNÇÕES DE COMENTÁRIOS
// Gerenciam a adição e exibição de comentários nas tarefas
// =========================================================================

/**
 * Adiciona um novo comentário à tarefa atualmente exibida no modal de detalhes.
 * O comentário é salvo no array da tarefa e renderizado na interface.
 */
function addComment() {
    if (!currentCardInDetailsModal) return;

    const taskId = currentCardInDetailsModal.dataset.id;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const commentText = newCommentTextarea.value.trim();
    if (commentText) {
        const newComment = {
            id: `comment-${Date.now()}`,
            text: commentText,
            timestamp: new Date().toISOString(),
            author: "Cliente" // Autor do comentário (pode ser dinâmico)
        };
        task.comments.push(newComment); // Adiciona o novo comentário ao array
        newCommentTextarea.value = ''; // Limpa o campo de texto
        renderComment(newComment); // Renderiza o novo comentário
        saveTasks(); // Salva todas as tarefas
    }
}

/**
 * Renderiza um único comentário no container de comentários do modal de detalhes.
 * Novos comentários são adicionados no topo da lista.
 * @param {object} comment - O objeto do comentário a ser renderizado.
 */
function renderComment(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    const commentDateObj = new Date(comment.timestamp);
    const formattedCommentDate = `${formatDateToDDMMYY(commentDateObj)} ${formatTimeToAMPM(commentDateObj)}`;

    commentDiv.innerHTML = `
        <strong>${comment.author || 'Desconhecido'}:</strong> ${comment.text}
        <span class="comment-date">${formattedCommentDate}</span>
    `;
    commentsContainer.prepend(commentDiv); // Adiciona no início do container
}

/**
 * Carrega e exibe todos os comentários para uma tarefa específica no modal de detalhes.
 * @param {string} taskId - O ID da tarefa cujos comentários devem ser carregados e exibidos.
 */
function loadComments(taskId) {
    commentsContainer.innerHTML = ''; // Limpa comentários anteriores
    const task = tasks.find(t => t.id === taskId);
    if (task && task.comments) {
        task.comments.slice().reverse().forEach(comment => renderComment(comment)); // Exibe os mais recentes primeiro
    }
}


// =========================================================================
// FUNÇÕES DE PERSISTÊNCIA DE DADOS COM LOCAL STORAGE
// Gerenciam o salvamento e carregamento das tarefas no navegador
// =========================================================================

/**
 * Salva o array completo de tarefas no Local Storage do navegador, convertendo-o para JSON.
 */
function saveTasks() {
    localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
}

/**
 * Carrega as tarefas do Local Storage na inicialização da página.
 * As tarefas são parseadas de JSON e renderizadas no Kanban board.
 * Também garante que o contador de IDs seja atualizado para evitar conflitos com IDs existentes.
 */
function loadTasks() {
    const storedTasks = localStorage.getItem('kanbanTasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
        tasks.forEach(task => {
            // Garante que a propriedade previousStatus exista se a tarefa estiver concluída
            if (task.status === 'concluido' && !task.previousStatus) {
                task.previousStatus = 'backlog';
            }

            // Atualiza o `taskIdCounter` para garantir que novos IDs sejam maiores que os existentes
            const idNum = parseInt(task.id.replace('task-', ''));
            if (!isNaN(idNum) && idNum >= taskIdCounter) {
                taskIdCounter = idNum + 1;
            }
            renderCard(task); // Renderiza cada tarefa carregada
        });
    }
}
