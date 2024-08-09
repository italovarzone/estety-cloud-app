document.addEventListener('DOMContentLoaded', init);

// Inicializa o app e carrega dados iniciais
function init() {
    // Carrega lista de agendamentos e clientes uma vez na inicialização
    loadInitialData();

    const clientForm = document.getElementById('client-form');
    if (clientForm) {
        const clientToEdit = localStorage.getItem('clientToEdit');
        if (clientToEdit) {
            const client = JSON.parse(clientToEdit);
            document.getElementById('client-id').value = client.id;
            document.getElementById('name').value = client.name;
            document.getElementById('email').value = client.email;
            document.getElementById('phone').value = client.phone;
            localStorage.removeItem('clientToEdit');
        }

        clientForm.addEventListener('submit', addClient);
    }

    const appointmentForm = document.getElementById('appointment-form');
    if (appointmentForm) {
        loadClientsIntoSelect();
        appointmentForm.addEventListener('submit', addAppointment);
    }

    if (document.getElementById('client-table')) {
        loadClients();
    }

    if (document.getElementById('appointment-table')) {
        loadAppointments();
    }

    const confirmButton = document.getElementById('confirm-delete');
    if (confirmButton) {
        confirmButton.addEventListener('click', confirmDeleteClient);
    }

    const technicalSheetForm = document.getElementById('technical-sheet-form');
    if (technicalSheetForm) {
        technicalSheetForm.addEventListener('submit', addTechnicalSheet);
    }
}

// Função para carregar os dados iniciais de clientes e agendamentos
function loadInitialData() {
    fetch('/api/clients')
        .then(response => response.json())
        .then(data => {
            sessionStorage.setItem('clientsList', JSON.stringify(data.clients));
        })
        .catch(error => console.error('Erro ao carregar clientes:', error));

    fetch('/api/appointments')
        .then(response => response.json())
        .then(data => {
            sessionStorage.setItem('appointmentsList', JSON.stringify(data.appointments));
        })
        .catch(error => console.error('Erro ao carregar agendamentos:', error));
}

// Função para carregar a lista de clientes no select de agendamentos
function loadClientsIntoSelect() {
    fetch('/api/clients')
    .then(response => response.json())
    .then(data => {
        const clientSelect = document.getElementById('client');
        clientSelect.innerHTML = ''; // Limpa o select antes de preencher novamente

        data.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            clientSelect.appendChild(option);
        });
    })
    .catch(error => console.error('Erro ao carregar clientes no select box:', error));
}

// Função para adicionar um cliente
function addClient(e) {
    e.preventDefault();

    const id = document.getElementById('client-id').value;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;

    const addClientBtn = document.getElementById('add-client-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');

    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    addClientBtn.disabled = true;

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/clients/${id}` : '/api/clients';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, phone })
    })
    .then(response => response.json())
    .then(data => {
        setTimeout(() => {
            btnText.style.display = 'inline';
            btnSpinner.style.display = 'none';
            addClientBtn.disabled = false;

            if (data.error) {
                console.error(data.error);
                showToast('Erro ao cadastrar cliente.');
            } else {
                document.getElementById('client-form').reset();
                showToast('Cliente cadastrado com sucesso!');
                checkForNewClients();  // Verificar se novos clientes foram adicionados
            }
        }, 3000);
    })
    .catch(error => {
        setTimeout(() => {
            btnText.style.display = 'inline';
            btnSpinner.style.display = 'none';
            addClientBtn.disabled = false;
            console.error('Erro ao adicionar cliente:', error);
            showToast('Erro ao cadastrar cliente.');
        }, 3000);
    });
}

// Função para carregar a lista de clientes
function loadClients() {
    fetch('/api/clients')
    .then(response => response.json())
    .then(data => {
        const tbody = document.querySelector('#client-table tbody');
        tbody.innerHTML = '';

        data.clients.forEach(client => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${client.id}</td>
                <td>${client.name}</td>
                <td>${client.email}</td>
                <td>${client.phone}</td>
                <td class="action-buttons">
                    <div style="display: flex; gap: 8px; margin-left: auto; margin-right: auto;">
                        <button class="btn btn-sm btn-primary" onclick="editClient(${client.id})">
                            Editar
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="promptDeleteClient(${client.id})">
                            Deletar
                        </button>
                        <button class="btn btn-sm btn-info" onclick="accessTechnicalSheet(${client.id}, '${client.name}')">
                            FT
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    })
    .catch(error => console.error('Erro ao carregar clientes:', error));
}

// Função para adicionar um agendamento
function addAppointment(e) {
    e.preventDefault();

    const clientId = document.getElementById('client').value;
    const procedure = document.getElementById('procedure').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    const addAppointmentBtn = document.getElementById('add-appointment-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');

    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    addAppointmentBtn.disabled = true;

    fetch('/api/appointments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientId, procedure, date, time })
    })
    .then(response => response.json())
    .then(data => {
        setTimeout(() => {
            btnText.style.display = 'inline';
            btnSpinner.style.display = 'none';
            addAppointmentBtn.disabled = false;

            if (data.error) {
                console.error(data.error);
                showToast('Erro ao cadastrar agendamento.');
            } else {
                document.getElementById('appointment-form').reset();
                showToast('Agendamento cadastrado com sucesso!');
                checkForNewAppointments();  // Verificar se novos agendamentos foram adicionados
            }
        }, 3000);
    })
    .catch(error => {
        setTimeout(() => {
            btnText.style.display = 'inline';
            btnSpinner.style.display = 'none';
            addAppointmentBtn.disabled = false;
            console.error('Erro ao adicionar agendamento:', error);
            showToast('Erro ao cadastrar agendamento.');
        }, 3000);
    });
}

// Função para carregar a lista de agendamentos
function loadAppointments() {
    fetch('/api/appointments')
    .then(response => response.json())
    .then(data => {
        const tbody = document.querySelector('#appointment-table tbody');
        tbody.innerHTML = '';

        data.appointments.forEach(appointment => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${appointment.id}</td>
                <td>${appointment.client}</td>
                <td>${appointment.procedure}</td>
                <td>${appointment.date}</td>
                <td>${appointment.time}</td>
            `;
            tbody.appendChild(tr);
        });
    })
    .catch(error => console.error('Erro ao carregar agendamentos:', error));
}

// Função para editar um cliente
function editClient(id) {
    const clientsList = JSON.parse(sessionStorage.getItem('clientsList')) || [];
    const client = clientsList.find(c => c.id === id);
    if (client) {
        localStorage.setItem('clientToEdit', JSON.stringify(client));
        window.location.href = 'cadastro.html';
    }
}

// Função para acessar a ficha técnica de um cliente
function accessTechnicalSheet(clientId, clientName) {
    const clientData = { clientId, clientName };
    localStorage.setItem('clientForTechnicalSheet', JSON.stringify(clientData));
    window.location.href = 'ficha_tecnica.html';
}

// Função para carregar os dados na ficha técnica
document.addEventListener('DOMContentLoaded', () => {
    const clientData = JSON.parse(localStorage.getItem('clientForTechnicalSheet'));
    if (clientData) {
        const url = `/api/technical-sheets/${clientData.clientId}`;
        console.log('URL para buscar ficha técnica:', url);

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showToast('Erro ao carregar ficha técnica.');
                } else {
                    // Preencher os campos com os dados da ficha técnica
                    document.getElementById('client-name').value = clientData.clientName;
                    document.getElementById('client-name').dataset.clientId = clientData.clientId;
                    document.getElementById('datetime').value = data.datetime;

                    document.querySelector(`input[name="rimel"][value="${data.rimel}"]`).checked = true;
                    document.querySelector(`input[name="gestante"][value="${data.gestante}"]`).checked = true;
                    document.querySelector(`input[name="procedimento-olhos"][value="${data.procedimento_olhos}"]`).checked = true;
                    document.querySelector(`input[name="alergia"][value="${data.alergia}"]`).checked = true;
                    document.getElementById('especificar-alergia').value = data.especificar_alergia;
                    document.querySelector(`input[name="tireoide"][value="${data.tireoide}"]`).checked = true;
                    document.querySelector(`input[name="problema-ocular"][value="${data.problema_ocular}"]`).checked = true;
                    document.getElementById('especificar-ocular').value = data.especificar_ocular;
                    document.querySelector(`input[name="oncologico"][value="${data.oncologico}"]`).checked = true;
                    document.querySelector(`input[name="dorme-lado"][value="${data.dorme_lado}"]`).checked = true;
                    document.getElementById('problema-informar').value = data.problema_informar;
                    document.querySelector(`input[name="procedimento"][value="${data.procedimento}"]`).checked = true;
                    document.getElementById('mapping').value = data.mapping;
                    document.getElementById('estilo').value = data.estilo;
                    document.getElementById('modelo-fios').value = data.modelo_fios;
                    document.getElementById('espessura').value = data.espessura;
                    document.getElementById('curvatura').value = data.curvatura;
                    document.getElementById('adesivo').value = data.adesivo;

                    // Desabilitar todos os campos para visualização inicial
                    toggleFormFields(false);
                }
            })
            .catch(error => {
                console.error('Erro ao carregar ficha técnica:', error);
                showToast('Erro ao carregar ficha técnica.');
            });

        localStorage.removeItem('clientForTechnicalSheet');
    }

    // Verifique se o botão "Editar ficha" existe antes de adicionar o event listener
    const editButton = document.getElementById('edit-button');
    if (editButton) {
        editButton.addEventListener('click', () => {
            toggleFormFields(true);
            document.getElementById('datetime').value = new Date().toLocaleString(); // Gerar nova data/hora
            document.getElementById('save-button').disabled = false; // Habilitar botão de salvar
        });
    }
});

// Função para habilitar ou desabilitar os campos do formulário
function toggleFormFields(enable) {
    const fields = document.querySelectorAll('#technical-sheet-form input, #technical-sheet-form textarea');
    fields.forEach(field => field.disabled = !enable);
}


// Função para confirmar exclusão de cliente
function confirmDeleteClient() {
    if (clientIdToDelete !== null) {
        fetch(`/api/clients/${clientIdToDelete}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao deletar cliente');
            }
            return response.json();
        })
        .then(data => {
            loadClients(); // Recarrega a lista de clientes após a exclusão
            clientIdToDelete = null;
            const dialog = bootstrap.Modal.getInstance(document.getElementById('dialog'));
            dialog.hide(); // Fecha o modal de confirmação
        })
        .catch(error => {
            console.error('Erro ao remover cliente:', error);
        });
    }
}

// Função para exibir o Toast
function showToast(message) {
    const toastElement = document.getElementById('snackbar-toast');
    const toastBody = toastElement.querySelector('.toast-body');
    toastBody.textContent = message;

    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}
