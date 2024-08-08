document.addEventListener('DOMContentLoaded', init);

function init() {
    const clientForm = document.getElementById('client-form');
    if (clientForm) {
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
    const cancelButton = document.getElementById('cancel-delete');
    if (confirmButton && cancelButton) {
        confirmButton.addEventListener('click', confirmDeleteClient);
        cancelButton.addEventListener('click', cancelDeleteClient);
    }
}

let clientIdToDelete = null;

function addClient(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;

    const addClientBtn = document.getElementById('add-client-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');

    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    addClientBtn.disabled = true;

    fetch('/api/clients', {
        method: 'POST',
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
        }, 5000);
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
                <td><button onclick="promptDeleteClient(${client.id})">Remover</button></td>
            `;
            tbody.appendChild(tr);
        });
    })
    .catch(error => console.error('Erro ao carregar clientes:', error));
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

function promptDeleteClient(id) {
    clientIdToDelete = id;
    const dialog = document.getElementById('dialog');
    dialog.style.display = 'flex';
}

function confirmDeleteClient() {
    if (clientIdToDelete !== null) {
        fetch(`/api/clients/${clientIdToDelete}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            loadClients();
            clientIdToDelete = null;
            const dialog = document.getElementById('dialog');
            dialog.style.display = 'none';
        })
        .catch(error => console.error('Erro ao remover cliente:', error));
    }
}

function cancelDeleteClient() {
    clientIdToDelete = null;
    const dialog = document.getElementById('dialog');
    dialog.style.display = 'none';
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
