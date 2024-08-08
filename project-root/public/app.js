document.addEventListener('DOMContentLoaded', init);

function init() {
    const clientForm = document.getElementById('client-form');
    if (clientForm) {
        clientForm.addEventListener('submit', addClient);
    }
    
    if (document.getElementById('client-table')) {
        loadClients();
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
