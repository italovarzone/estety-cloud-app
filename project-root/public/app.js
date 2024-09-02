document.addEventListener("DOMContentLoaded", init);

// Inicializa o app e carrega dados iniciais
function init() {
  // Carrega lista de agendamentos e clientes uma vez na inicialização
  loadInitialData();

  const clientForm = document.getElementById("client-form");
  if (clientForm) {
    const clientToEdit = localStorage.getItem("clientToEdit");
    if (clientToEdit) {
      const client = JSON.parse(clientToEdit);
      document.getElementById("client-id").value = client.id;
      document.getElementById("name").value = client.name;
      document.getElementById("birthdate").value = client.birthdate;
      document.getElementById("phone").value = client.phone;
      localStorage.removeItem("clientToEdit");
    }

    clientForm.addEventListener("submit", addClient);
  }

  const appointmentForm = document.getElementById("appointment-form");
  if (appointmentForm) {
    loadClientsIntoSelect();
    appointmentForm.addEventListener("submit", addAppointment);
  }

  if (document.getElementById("client-table")) {
    loadClients();
  }

  if (document.getElementById("appointment-table")) {
    loadAppointments();
  }

  const confirmButton = document.getElementById("confirm-delete");
  if (confirmButton) {
    confirmButton.addEventListener("click", confirmDeleteClient);
  }

  const technicalSheetForm = document.getElementById("technical-sheet-form");
  if (technicalSheetForm) {
    technicalSheetForm.addEventListener("submit", addTechnicalSheet);
  }
}

// Função para carregar os dados iniciais de clientes e agendamentos
function loadInitialData() {
  fetch("/api/clients")
    .then((response) => response.json())
    .then((data) => {
      sessionStorage.setItem("clientsList", JSON.stringify(data.clients));
    })
    .catch((error) => console.error("Erro ao carregar clientes:", error));

  fetch("/api/appointments")
    .then((response) => response.json())
    .then((data) => {
      sessionStorage.setItem(
        "appointmentsList",
        JSON.stringify(data.appointments)
      );
    })
    .catch((error) => console.error("Erro ao carregar agendamentos:", error));
}

// Função para carregar a lista de clientes no select de agendamentos
function loadClientsIntoSelect() {
  fetch("/api/clients")
    .then((response) => response.json())
    .then((data) => {
      const clientSelect = document.getElementById("client");
      clientSelect.innerHTML = ""; // Limpa o select antes de preencher novamente

      data.clients.forEach((client) => {
        const option = document.createElement("option");
        option.value = client.id;
        option.textContent = client.name;
        clientSelect.appendChild(option);
      });
    })
    .catch((error) =>
      console.error("Erro ao carregar clientes no select box:", error)
    );
}

function addTechnicalSheet(e) {
  e.preventDefault();

  const clientId = document.getElementById("client-name").dataset.clientId;
  const datetime = document.getElementById("datetime").value || "";
  const rimel =
    document.querySelector('input[name="rimel"]:checked')?.value || "";
  const gestante =
    document.querySelector('input[name="gestante"]:checked')?.value || "";
  const procedimento_olhos =
    document.querySelector('input[name="procedimento-olhos"]:checked')?.value ||
    "";
  const alergia =
    document.querySelector('input[name="alergia"]:checked')?.value || "";
  const especificar_alergia =
    document.getElementById("especificar-alergia").value || "";
  const tireoide =
    document.querySelector('input[name="tireoide"]:checked')?.value || "";
  const problema_ocular =
    document.querySelector('input[name="problema-ocular"]:checked')?.value ||
    "";
  const especificar_ocular =
    document.getElementById("especificar-ocular").value || "";
  const oncologico =
    document.querySelector('input[name="oncologico"]:checked')?.value || "";
  const dorme_lado =
    document.querySelector('input[name="dorme-lado"]:checked')?.value || "";
  const dorme_lado_posicao =
    dorme_lado === "SIM"
      ? document.querySelector('input[name="dorme-lado-posicao"]:checked')
          ?.value
      : null;
  const problema_informar =
    document.getElementById("problema-informar").value || "";
  const procedimento =
    document.querySelector('input[name="procedimento"]:checked')?.value || "";
  const mapping = document.getElementById("mapping").value || "";
  const estilo = document.getElementById("estilo").value || "";
  const modelo_fios = document.getElementById("modelo-fios").value || "";
  const espessura = document.getElementById("espessura").value || "";
  const curvatura = document.getElementById("curvatura").value || "";
  const adesivo = document.getElementById("adesivo").value || "";
  const observacao = document.getElementById("observacao").value || "";

  fetch("/api/technical-sheets", {
    method: "POST", // Veremos adiante como mudar isso para PUT quando necessário
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId,
      datetime,
      rimel,
      gestante,
      procedimento_olhos,
      alergia,
      especificar_alergia,
      tireoide,
      problema_ocular,
      especificar_ocular,
      oncologico,
      dorme_lado,
      dorme_lado_posicao,
      problema_informar,
      procedimento,
      mapping,
      estilo,
      modelo_fios,
      espessura,
      curvatura,
      adesivo,
      observacao,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        console.error("Erro ao salvar ficha técnica:", data.error);
      } else {
        window.location.href = "../listagem.html"; // Redireciona para a listagem de clientes
      }
    })
    .catch((error) => {
      console.error("Erro ao salvar ficha técnica:", error);
    });
}

// Função para adicionar um cliente
function addClient(e) {
  e.preventDefault();

  const id = document.getElementById("client-id").value;
  const name = document.getElementById("name").value;
  const birthdate = document.getElementById("birthdate").value;
  const phone = document.getElementById("phone").value;

  const addClientBtn = document.getElementById("add-client-btn");
  const btnText = document.getElementById("btn-text");
  const btnSpinner = document.getElementById("btn-spinner");

  btnText.style.display = "none";
  btnSpinner.style.display = "inline-block";
  addClientBtn.disabled = true;

  const method = id ? "PUT" : "POST";
  const url = id ? `/api/clients/${id}` : "/api/clients";

  fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, birthdate, phone }),
  })
    .then((response) => response.json())
    .then((data) => {
      setTimeout(() => {
        btnText.style.display = "inline";
        btnSpinner.style.display = "none";
        addClientBtn.disabled = false;

        if (data.error) {
          console.error(data.error);
        } else {
          window.location.href = "listagem.html";
        }
      }, 3000);
    })
    .catch((error) => {
      setTimeout(() => {
        btnText.style.display = "inline";
        btnSpinner.style.display = "none";
        addClientBtn.disabled = false;
        console.error("Erro ao adicionar cliente:", error);
      }, 3000);
    });
}

// Função para carregar os dados do cliente para edição
function loadClientForEdit(id) {
  fetch(`/api/clients/${id}`)
    .then((response) => response.json())
    .then((client) => {
      if (client.error) {
        console.error("Erro ao carregar cliente:", client.error);
        return;
      }

      document.getElementById("client-id").value = client.id;
      document.getElementById("name").value = client.name;
      document.getElementById("birthdate").value = client.birthdate;
      document.getElementById("phone").value = client.phone;
    })
    .catch((error) => console.error("Erro ao carregar cliente:", error));
}

function editClient(e) {
  e.preventDefault();

  const id = document.getElementById("client-id").value;
  const name = document.getElementById("name").value;
  const birthdate = document.getElementById("birthdate").value;
  const phone = document.getElementById("phone").value;

  if (!id || !name || !birthdate || !phone) {
    alert("Todos os campos são obrigatórios");
    return;
  }

  fetch(`/api/clients/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, birthdate, phone }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert(`Erro: ${data.error}`);
      } else {
        alert("Cliente editado com sucesso!");
        window.location.href = "listagem.html";
      }
    })
    .catch((error) => console.error("Erro ao editar cliente:", error));
}

// Carregar dados do cliente ao abrir a página de edição, se necessário
document.addEventListener("DOMContentLoaded", function () {
  const clientIdElement = document.getElementById("client-id");
  if (clientIdElement) {
    const clientId = clientIdElement.value;
    if (clientId) {
      loadClientForEdit(clientId);
    }
  }

  const clientForm = document.getElementById("client-form");
  if (clientForm) {
    clientForm.addEventListener("submit", editClient);
  }
});

function formatDateToBrazilian(dateString) {
  const date = new Date(dateString);
  const utcDay = date.getUTCDate();
  const utcMonth = date.getUTCMonth() + 1; // Janeiro é 0!
  const utcYear = date.getUTCFullYear();
  const day = String(utcDay).padStart(2, "0");
  const month = String(utcMonth).padStart(2, "0");
  return `${day}/${month}/${utcYear}`;
}

function loadClients(searchQuery = '') {
  fetch(`/api/clients?search=${encodeURIComponent(searchQuery)}`)
    .then((response) => response.json())
    .then((data) => {
      const tbody = document.querySelector("#client-table tbody");
      tbody.innerHTML = "";

      if (data.clients && Array.isArray(data.clients)) {
        data.clients.forEach((client) => {
          const formattedBirthdate = formatDateToBrazilian(client.birthdate);
          const tr = document.createElement("tr");
          tr.innerHTML = `
                  <td>${client.id}</td>
                  <td>${client.name}</td>
                  <td>${formattedBirthdate}</td>
                  <td>${client.phone}</td>
                  <td class="action-buttons">
                      <div style="display: flex; gap: 8px; margin-left: auto; margin-right: auto;">
                        <button class="btn btn-sm btn-primary" onclick="editClient(${client.id})" title="Editar cliente">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="promptDeleteClient(${client.id})" title="Excluir cliente">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-sm btn-info" onclick="accessTechnicalSheet(${client.id}, '${client.name}')" title="Acessar ficha técnica">
                            <i class="fas fa-file-lines"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="sendWhatsAppMessage('${client.phone}', '${client.name}')" title="Enviar mensagem via WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                      </div>
                  </td>
              `;
          tbody.appendChild(tr);
        });
      } else {
        console.error("A estrutura de dados recebida não está correta:", data);
      }
    })
    .catch((error) => console.error("Erro ao carregar clientes:", error));
}

document.addEventListener("DOMContentLoaded", function() {
  const filterNameInput = document.getElementById('filter-name');
  if (filterNameInput) {
    filterNameInput.addEventListener('input', function() {
      const searchQuery = this.value.toLowerCase();
      loadClients(searchQuery);
    });
  } else {
    console.error("Elemento #filter-name não encontrado no DOM.");
  }
});

function sendWhatsAppMessage(phone, clientName) {
  const firstName = clientName.split(' ')[0]; 
  const defaultMessage = `Olá ${firstName}! Tudo bem com você?`;
  const formattedPhone = phone.replace(/\D/g, '');
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(defaultMessage)}`;

  window.open(whatsappUrl, '_blank');
}

// Função para adicionar um agendamento
function addAppointment(e) {
  e.preventDefault();

  const clientId = document.getElementById("client").value;
  const procedure = document.getElementById("procedure").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;

  const addAppointmentBtn = document.getElementById("add-appointment-btn");
  const btnText = document.getElementById("btn-text");
  const btnSpinner = document.getElementById("btn-spinner");

  btnText.style.display = "none";
  btnSpinner.style.display = "inline-block";
  addAppointmentBtn.disabled = true;

  fetch("/api/appointments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ clientId, procedure, date, time }),
  })
    .then((response) => {
      setTimeout(() => {
        btnSpinner.style.display = "none";
        addAppointmentBtn.disabled = false;

        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error);
          });
        }
        return response.json();
      }, 3000);
    })
    .then((data) => {
      setTimeout(() => {
        document.getElementById("appointment-form").reset();
        window.location.href = "listagem.html";
      }, 3000);
    })
    .catch((error) => {
      setTimeout(() => {
        alert(error.message); // Exibe a mensagem de erro
      });
    });
}

// Função para carregar a lista de agendamentos
function loadAppointmentsForDay(appointmentsDiv, year, month, day) {
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;

  fetch(`/api/appointments?date=${dateStr}`)
    .then((response) => response.json())
    .then((data) => {
      appointmentsDiv.innerHTML = ""; // Limpa qualquer conteúdo existente na div de agendamentos

      if (data.appointments && data.appointments.length > 0) {
        // Itera sobre os agendamentos e exibe apenas os do dia correto
        let hasAppointments = false;
        data.appointments.forEach((appointment) => {
          if (appointment.date === dateStr) {
            hasAppointments = true;

            const appointmentCard = document.createElement("div");
            appointmentCard.classList.add("appointment-card");

            // Adiciona o nome do cliente e a hora
            const clientInfo = document.createElement("div");
            clientInfo.textContent = `${appointment.client} - ${appointment.time}`;
            appointmentCard.appendChild(clientInfo);

            // Adiciona o procedimento realizado
            const procedureInfo = document.createElement("div");
            procedureInfo.textContent = appointment.procedure;
            appointmentCard.appendChild(procedureInfo);

            appointmentCard.addEventListener("click", () => {
              showAppointmentDetails(appointment);
            });

            appointmentsDiv.appendChild(appointmentCard);
          }
        });

        // Se nenhum agendamento for encontrado, exibe a mensagem
        if (!hasAppointments) {
          const noAppointmentsMessage = document.createElement("div");
          noAppointmentsMessage.classList.add("no-appointments-message");
          noAppointmentsMessage.textContent =
            "Sem nenhum agendamento, bora agendar fedô?";
          appointmentsDiv.appendChild(noAppointmentsMessage);
        }
      } else {
        // Caso não haja nenhum agendamento no dia, exibe a mensagem
        const noAppointmentsMessage = document.createElement("div");
        noAppointmentsMessage.classList.add("no-appointments-message");
        noAppointmentsMessage.textContent =
          "Sem nenhum agendamento, bora agendar fedô?";
        appointmentsDiv.appendChild(noAppointmentsMessage);
      }
    })
    .catch((error) => {
      console.error("Erro ao carregar agendamentos:", error);

      // Em caso de erro, exibe a mensagem padrão
      const noAppointmentsMessage = document.createElement("div");
      noAppointmentsMessage.classList.add("no-appointments-message");
      noAppointmentsMessage.textContent =
        "Sem nenhum agendamento, bora agendar fedô?";
      appointmentsDiv.appendChild(noAppointmentsMessage);
    });
}

// Função para editar um cliente
function editClient(id) {
  const clientsList = JSON.parse(sessionStorage.getItem("clientsList")) || [];
  const client = clientsList.find((c) => c.id === id);
  if (client) {
    localStorage.setItem("clientToEdit", JSON.stringify(client));
    window.location.href = "cadastro.html";
  }
}

// Função para acessar a ficha técnica de um cliente
function accessTechnicalSheet(clientId, clientName) {
  const clientData = { clientId, clientName };
  localStorage.setItem("clientForTechnicalSheet", JSON.stringify(clientData));
  window.location.href = "ficha_tecnica/ficha_tecnica.html";
}

// Função para carregar os dados na ficha técnica
document.addEventListener("DOMContentLoaded", () => {
  const clientData = JSON.parse(
    localStorage.getItem("clientForTechnicalSheet")
  );

  // Verifique se os elementos necessários existem antes de tentar acessá-los
  const clientNameElement = document.getElementById("client-name");
  const datetimeElement = document.getElementById("datetime");
  const editButton = document.getElementById("edit-button");

  if (clientData && clientNameElement && datetimeElement) {
    fetch(`/api/technical-sheets/${clientData.clientId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.log("Nenhuma ficha técnica encontrada para este cliente.");
          clientNameElement.value = clientData.clientName;
          clientNameElement.dataset.clientId = clientData.clientId; // Associando o clientId
          datetimeElement.value = new Date().toLocaleString();
          if (editButton) {
            editButton.style.display = "none";
          }
        } else {
          // Preenchimento dos campos quando a ficha existe
          clientNameElement.value = clientData.clientName;
          clientNameElement.dataset.clientId = clientData.clientId;
          datetimeElement.value = data.datetime;

          if (
            document.querySelector(`input[name="rimel"][value="${data.rimel}"]`)
          ) {
            document.querySelector(
              `input[name="rimel"][value="${data.rimel}"]`
            ).checked = true;
          }
          if (
            document.querySelector(
              `input[name="gestante"][value="${data.gestante}"]`
            )
          ) {
            document.querySelector(
              `input[name="gestante"][value="${data.gestante}"]`
            ).checked = true;
          }
          if (
            document.querySelector(
              `input[name="procedimento-olhos"][value="${data.procedimento_olhos}"]`
            )
          ) {
            document.querySelector(
              `input[name="procedimento-olhos"][value="${data.procedimento_olhos}"]`
            ).checked = true;
          }
          if (
            document.querySelector(
              `input[name="alergia"][value="${data.alergia}"]`
            )
          ) {
            document.querySelector(
              `input[name="alergia"][value="${data.alergia}"]`
            ).checked = true;
          }
          if (document.getElementById("especificar-alergia")) {
            document.getElementById("especificar-alergia").value =
              data.especificar_alergia;
          }
          if (
            document.querySelector(
              `input[name="tireoide"][value="${data.tireoide}"]`
            )
          ) {
            document.querySelector(
              `input[name="tireoide"][value="${data.tireoide}"]`
            ).checked = true;
          }
          if (
            document.querySelector(
              `input[name="problema-ocular"][value="${data.problema_ocular}"]`
            )
          ) {
            document.querySelector(
              `input[name="problema-ocular"][value="${data.problema_ocular}"]`
            ).checked = true;
          }
          if (document.getElementById("especificar-ocular")) {
            document.getElementById("especificar-ocular").value =
              data.especificar_ocular;
          }
          if (
            document.querySelector(
              `input[name="oncologico"][value="${data.oncologico}"]`
            )
          ) {
            document.querySelector(
              `input[name="oncologico"][value="${data.oncologico}"]`
            ).checked = true;
          }

          // Dorme de lado
          if (
            document.querySelector(
              `input[name="dorme-lado"][value="${data.dorme_lado}"]`
            )
          ) {
            document.querySelector(
              `input[name="dorme-lado"][value="${data.dorme_lado}"]`
            ).checked = true;
            handleDormeLadoChange(data.dorme_lado);
          }

          // Se dorme de lado for SIM, preencher o lado (esquerdo ou direito)
          if (data.dorme_lado === "SIM" && data.dorme_lado_posicao) {
            document.querySelector(
              `input[name="dorme-lado-posicao"][value="${data.dorme_lado_posicao}"]`
            ).checked = true;
          }

          if (document.getElementById("problema-informar")) {
            document.getElementById("problema-informar").value =
              data.problema_informar;
          }
          if (
            document.querySelector(
              `input[name="procedimento"][value="${data.procedimento}"]`
            )
          ) {
            document.querySelector(
              `input[name="procedimento"][value="${data.procedimento}"]`
            ).checked = true;
          }
          if (document.getElementById("mapping")) {
            document.getElementById("mapping").value = data.mapping;
          }
          if (document.getElementById("estilo")) {
            document.getElementById("estilo").value = data.estilo;
          }
          if (document.getElementById("modelo-fios")) {
            document.getElementById("modelo-fios").value = data.modelo_fios;
          }
          if (document.getElementById("espessura")) {
            document.getElementById("espessura").value = data.espessura;
          }
          if (document.getElementById("curvatura")) {
            document.getElementById("curvatura").value = data.curvatura;
          }
          if (document.getElementById("adesivo")) {
            document.getElementById("adesivo").value = data.adesivo;
          }
          if (document.getElementById("observacao")) {
            document.getElementById("observacao").value = data.observacao || "";
          }

          // Desabilitar todos os campos para visualização inicial
          toggleFormFields(false);
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar ficha técnica:", error);
        if (editButton) {
          editButton.style.display = "none";
        }
      });
  }

  if (editButton) {
    editButton.addEventListener("click", () => {
      toggleFormFields(true);
      if (datetimeElement) {
        datetimeElement.value = new Date().toLocaleString(); // Gerar nova data/hora
      }
      const saveButton = document.getElementById("save-button");
      if (saveButton) {
        saveButton.disabled = false; // Habilitar botão de salvar
      }
    });
  }

  // Lógica para exibir ou ocultar os radio buttons "esquerdo" e "direito"
  const dormeLadoSim = document.getElementById("dorme-lado-sim");
  const dormeLadoNao = document.getElementById("dorme-lado-nao");
  const ladoPosicaoDiv = document.getElementById("lado-posicao");

  dormeLadoSim.addEventListener("change", () => {
    handleDormeLadoChange("SIM");
  });

  dormeLadoNao.addEventListener("change", () => {
    handleDormeLadoChange("NÃO");
  });
});

// Função para habilitar ou desabilitar os campos do formulário
function toggleFormFields(enable) {
  const fields = document.querySelectorAll(
    "#technical-sheet-form input, #technical-sheet-form textarea"
  );
  fields.forEach((field) => (field.disabled = !enable));
}

// Função para exibir ou ocultar o campo de lado ao selecionar "SIM" em "Dorme de lado"
function handleDormeLadoChange(value) {
  const ladoPosicaoDiv = document.getElementById("lado-posicao");
  if (value === "SIM") {
    ladoPosicaoDiv.style.display = "block";
  } else {
    ladoPosicaoDiv.style.display = "none";
    const radioButtons = document.querySelectorAll(
      'input[name="dorme-lado-posicao"]'
    );
    radioButtons.forEach((radio) => (radio.checked = false)); // Desmarca os radio buttons
  }
}

let clientIdToDelete = null;

function promptDeleteClient(id) {
  clientIdToDelete = id;
  const dialog = new bootstrap.Modal(document.getElementById("dialog"));
  dialog.show();
}

// Função para confirmar exclusão de cliente
function confirmDeleteClient() {
  if (clientIdToDelete !== null) {
    fetch(`/api/clients/${clientIdToDelete}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao deletar cliente");
        }
        return response.json();
      })
      .then((data) => {
        loadClients(); // Recarrega a lista de clientes após a exclusão
        clientIdToDelete = null;
        const dialog = bootstrap.Modal.getInstance(
          document.getElementById("dialog")
        );
        dialog.hide(); // Fecha o modal de confirmação
      })
      .catch((error) => {
        console.error("Erro ao remover cliente:", error);
      });
  }
}
