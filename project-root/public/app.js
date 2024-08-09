document.addEventListener('DOMContentLoaded', init);

function init() {
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
}

let clientIdToDelete = null;

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
        document.getElementById('client-form').reset();
        setTimeout(() => {
            btnText.style.display = 'inline';
            btnSpinner.style.display = 'none';
            addClientBtn.disabled = false;
            showSnackbar('Cliente cadastrado com sucesso!');
        }, 3000);
    })
    .catch(error => {
        setTimeout(() => {
            btnText.style.display = 'inline';
            btnSpinner.style.display = 'none';
            addClientBtn.disabled = false;
            showSnackbar('Erro ao cadastrar cliente.');
        }, 5000);
        console.error('Erro ao adicionar cliente:', error);
    });
}

function accessTechnicalSheet(clientId, clientName) {
    localStorage.setItem('clientTechnicalSheet', JSON.stringify({ clientId, clientName }));
    window.location.href = 'ficha_tecnica.html';
}



function showSnackbar(message) {
    const snackbar = document.getElementById('snackbar');
    snackbar.textContent = message;
    snackbar.className = 'show';
    setTimeout(() => { snackbar.className = snackbar.className.replace('show', ''); }, 3000);
}

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

function promptDeleteClient(id) {
    clientIdToDelete = id;
    const dialog = new bootstrap.Modal(document.getElementById('dialog'));
    dialog.show();
}

function confirmDeleteClient() {
    console.log('Confirm Delete Client function called with ID:', clientIdToDelete);
    if (clientIdToDelete !== null) {
        fetch(`/api/clients/${clientIdToDelete}`, {
            method: 'DELETE'
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Erro ao deletar cliente');
            }
            return response.json();
        })
        .then(data => {
            console.log('Cliente deletado:', data);
            loadClients(); // Recarrega a lista de clientes após a exclusão
            clientIdToDelete = null;
            const dialog = bootstrap.Modal.getInstance(document.getElementById('dialog'));
            dialog.hide(); // Fecha o modal de confirmação
        })
        .catch(error => {
            console.error('Erro ao remover cliente:', error);
            showSnackbar('Erro ao remover cliente.');
        });
    }
}


document.addEventListener('DOMContentLoaded', function() {
    const confirmButton = document.getElementById('confirm-delete');
    if (confirmButton) {
        confirmButton.addEventListener('click', confirmDeleteClient);
    }
});


function editClient(id) {
    fetch(`/api/clients/${id}`)
    .then(response => response.json())
    .then(data => {
        localStorage.setItem('clientToEdit', JSON.stringify(data.client));
        window.location.href = 'cadastro.html';
    })
    .catch(error => console.error('Erro ao carregar cliente:', error));
}

function loadClientsIntoSelect() {
    fetch('/api/clients')
    .then(response => response.json())
    .then(data => {
        const clientSelect = document.getElementById('client');
        data.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            clientSelect.appendChild(option);
        });
    })
    .catch(error => console.error('Erro ao carregar clientes no select box:', error));
}

function addAppointment(e) {
    e.preventDefault();

    const client = document.getElementById('client').value;
    const procedure = document.getElementById('procedure').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    fetch('/api/appointments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ client, procedure, date, time })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('appointment-form').reset();
        showSnackbar('Agendamento cadastrado com sucesso!');
    })
    .catch(error => {
        showSnackbar('Erro ao cadastrar agendamento.');
        console.error('Erro ao adicionar agendamento:', error);
    });
}

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

document.addEventListener('DOMContentLoaded', function() {
    if (document.body.contains(document.getElementById('client-name'))) {
        const clientData = JSON.parse(localStorage.getItem('clientTechnicalSheet'));

        if (clientData) {
            const clientNameInput = document.getElementById('client-name');
            const dateTimeInput = document.getElementById('datetime');

            clientNameInput.value = clientData.clientName;
            
            // Definir a data/hora atual
            const now = new Date();
            const formattedDateTime = now.toLocaleString();
            dateTimeInput.value = formattedDateTime;

            // Adicionar lógica para carregar a ficha técnica existente se necessário
            loadTechnicalSheet(clientData.clientId);
        }
    }
});



function loadTechnicalSheet(clientId) {
    fetch(`/api/technical-sheets/${clientId}`)
    .then(response => response.json())
    .then(data => {
        if (data.technicalSheet) {
            const sheet = data.technicalSheet;
            document.getElementById('procedure').value = sheet.procedure;
            loadProcedureDetails();

            const checkboxes = document.querySelectorAll('input[name="details"]');
            sheet.details.forEach(detail => {
                checkboxes.forEach(cb => {
                    if (cb.value === detail) {
                        cb.checked = true;
                    }
                });
            });

            // Atualizar data/hora com o momento atual
            const now = new Date();
            const formattedDateTime = now.toLocaleString();
            document.getElementById('datetime').value = formattedDateTime;
        }
    })
    .catch(error => console.error('Erro ao carregar Ficha Técnica:', error));
}
