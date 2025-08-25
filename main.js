// =================================================================
// ARCHIVO: main.js
// Contiene la lógica principal del frontend de la aplicación.
// =================================================================

// --- FUNCIONES DE INICIALIZACIÓN Y SESIÓN ---

/**
 * Inicializa la lógica de la pantalla de login.
 */
function initLogin() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const user = await callApi('login', { email, password });
            
            if (user) {
                sessionStorage.setItem('user', JSON.stringify(user));
                
                // >>> LÓGICA DE REDIRECCIÓN POR ROL <<<
                if (user.rol === 'Chofer') {
                    window.location.hash = '/chofer';
                } else {
                    window.location.hash = '/dashboard';
                }

            
            }
        });
    }
}

/**
 * Inicializa el dashboard principal después de un login exitoso.
 */
function initDashboard() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    document.getElementById('user-info').innerHTML = `<span>Hola, <strong>${user.nombre}</strong> (${user.rol})</span>`;
    
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('user');
        window.location.hash = '/';
    });
    
    // Configurar navegación del menú lateral
    const menuLinks = document.querySelectorAll('.sidebar .menu a');
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.id !== 'logoutBtn') {
                e.preventDefault();
                const path = new URL(link.href).hash.slice(1);
                loadSubView(path);
            }
        });
    });

    filterMenuByRole(user.rol);
    loadSubView('/viajes'); // Cargar la vista inicial del dashboard
}

/**
 * Oculta elementos del menú según el rol del usuario.
 * @param {string} userRole El rol del usuario actual.
 */
function filterMenuByRole(userRole) {
    const menuLinks = document.querySelectorAll('.sidebar .menu a[data-role]');
    menuLinks.forEach(link => {
        const requiredRoles = link.dataset.role.split(',');
        if (!requiredRoles.includes(userRole) && !requiredRoles.includes('all')) {
            link.style.display = 'none';
        }
    });
}

// --- ROUTING Y CARGA DE VISTAS ---

/**
 * Carga la plantilla y la lógica de una sub-vista dentro del dashboard.
 * @param {string} path La ruta de la sub-vista (ej. '/viajes').
 */
function loadSubView(path) {
    const viewContent = document.getElementById('view-content');
    const viewTitle = document.getElementById('view-title');
    const view = subViews[path];

    if (view) {
        viewTitle.textContent = view.title;
        viewContent.innerHTML = view.template;
        
        // Limpiamos y re-asignamos el oyente de eventos usando delegación
        viewContent.replaceWith(viewContent.cloneNode(true));
        document.getElementById('view-content').addEventListener('click', handleViewContentClick);
        
        // Ejecutar la lógica específica de la vista cargada
        switch(path) {
            case '/viajes':
                loadViajesTable();
                break;
                // >>> AÑADE ESTE NUEVO CASO <<<
            case '/aprobaciones':
                loadAprobacionesView();
                break;
            case '/usuarios': loadUsuariosView(); break;
            case '/choferes': loadChoferesView(); break;
            case '/vehiculos': loadVehiculosView(); break;
            case '/clientes': loadClientesView(); break;
    }
            // Aquí irían los casos para otras vistas (choferes, vehículos, etc.)
        
    } else {
        viewTitle.textContent = 'Página no encontrada';
        viewContent.innerHTML = '<p>La sección que buscas no existe.</p>';
    }
}

/**
 * Manejador central de clics para el contenido de la vista (Delegación de Eventos).
 * @param {Event} event El objeto del evento de clic.
 */
function handleViewContentClick(event) {
    const nuevoViajeButton = event.target.closest('#btn-nuevo-viaje');
    if (nuevoViajeButton) {
        openCrearViajeModal(); // ESTA ES LA LLAMADA QUE ESTABA FALLANDO
    }
    // >>> AÑADE ESTA LÓGICA PARA LOS BOTONES DE APROBACIÓN/RECHAZO <<<
    const approveButton = event.target.closest('.btn-approve');
    if (approveButton) {
        const tripId = approveButton.dataset.id;
        handleApproval(tripId, 'Aprobado');
    }

    const rejectButton = event.target.closest('.btn-reject');
    if (rejectButton) {
        const tripId = rejectButton.dataset.id;
        handleApproval(tripId, 'Rechazado');
    }

    const deleteUserButton = event.target.closest('.btn-delete-usuario');
    if (deleteUserButton) {
        const userId = deleteUserButton.dataset.id;
        handleDeleteUsuario(userId);
    }
    const newUserButton = event.target.closest('#btn-nuevo-usuario');
    if (newUserButton) {
        openUsuarioModal(); // Llama a la función sin ID para crear
    }

    const editUserButton = event.target.closest('.btn-edit-usuario');
    if (editUserButton) {
        const userId = editUserButton.dataset.id;
        openUsuarioModal(userId); // Llama a la función con un ID para editar
    }

    // >>> AÑADE ESTA LÓGICA NUEVA PARA CHOFERES <<<
    const nuevoChoferButton = event.target.closest('#btn-nuevo-chofer');
    if (nuevoChoferButton) {
        openChoferModal();
    }
    
    const editarChoferButton = event.target.closest('.btn-edit-chofer');
    if (editarChoferButton) {
        openChoferModal(editarChoferButton.dataset.id);
    }
    
    const borrarChoferButton = event.target.closest('.btn-delete-chofer');
    if (borrarChoferButton) {
        handleDeleteChofer(borrarChoferButton.dataset.id);
    }

    // >>> AÑADE ESTA LÓGICA NUEVA PARA VEHÍCULOS <<<
    const nuevoVehiculoButton = event.target.closest('#btn-nuevo-vehiculo');
    if (nuevoVehiculoButton) {
        openVehiculoModal();
    }
    
    const editarVehiculoButton = event.target.closest('.btn-edit-vehiculo');
    if (editarVehiculoButton) {
        openVehiculoModal(editarVehiculoButton.dataset.id);
    }
    
    const borrarVehiculoButton = event.target.closest('.btn-delete-vehiculo');
    if (borrarVehiculoButton) {
        handleDeleteVehiculo(borrarVehiculoButton.dataset.id);
    }

    // >>> AÑADE ESTA LÓGICA NUEVA PARA CLIENTES <<<
    const nuevoClienteButton = event.target.closest('#btn-nuevo-cliente');
    if (nuevoClienteButton) {
        openClienteModal();
    }
    
    const editarClienteButton = event.target.closest('.btn-edit-cliente');
    if (editarClienteButton) {
        openClienteModal(editarClienteButton.dataset.id);
    }
    
    const borrarClienteButton = event.target.closest('.btn-delete-cliente');
    if (borrarClienteButton) {
        handleDeleteCliente(borrarClienteButton.dataset.id);
    }


}
    // Aquí se añadiría la lógica para otros botones (editar, eliminar, etc.)


// --- LÓGICA DE LA VISTA DE VIAJES ---

/**
 * Obtiene los datos de los viajes y los renderiza en la tabla.
 */
async function loadViajesTable() {
    const [viajes, clientes, choferes] = await Promise.all([
        callApi('getRecords', { sheetName: 'Viajes' }),
        callApi('getRecords', { sheetName: 'Clientes' }),
        callApi('getRecords', { sheetName: 'Choferes' })
    ]);

    if (!viajes || !clientes || !choferes) {
        console.error("No se pudieron cargar los datos para la vista de viajes.");
        return;
    }

    const clientesMap = new Map(clientes.map(c => [c.ID, c.RazonSocial]));
    const choferesMap = new Map(choferes.map(ch => [ch.ID, ch.Nombre]));

    const tableBody = document.querySelector('#viajes-table tbody');
    tableBody.innerHTML = '';

    if (viajes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No hay viajes registrados.</td></tr>';
        return;
    }

    viajes.forEach(viaje => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${(viaje.ID || '').substring(0, 8)}...</td>
            <td>${clientesMap.get(viaje.ClienteID) || 'N/A'}</td>
            <td>${choferesMap.get(viaje.ChoferID) || 'N/A'}</td>
            <td>${viaje.Origen}</td>
            <td>${viaje.Destino}</td>
            <td>${new Date(viaje.FechaHoraSalida).toLocaleString()}</td>
            <td><span class="status ${(viaje.Estado || '').toLowerCase()}">${viaje.Estado}</span></td>
            <td><span class="riesgo ${(viaje.RiesgoCalculado || '').toLowerCase()}">${viaje.RiesgoCalculado}</span></td>
            <td class="actions">
                <button class="btn-icon view" title="Ver Detalles"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/></svg></button>
                <button class="btn-icon edit" title="Editar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// --- LÓGICA DEL MODAL DE CREAR VIAJE ---

/**
 * Obtiene los datos necesarios, construye y muestra el modal para crear un viaje.
 */
async function openCrearViajeModal() {
    const modalContainer = document.getElementById('modal-container');

    const [clientes, choferes, vehiculos] = await Promise.all([
        callApi('getRecords', { sheetName: 'Clientes' }),
        callApi('getRecords', { sheetName: 'Choferes' }),
        callApi('getRecords', { sheetName: 'Vehiculos' })
    ]);

    const clientesOptions = clientes.map(c => `<option value="${c.ID}">${c.RazonSocial}</option>`).join('');
    const choferesOptions = choferes.filter(c => c.Estado === 'Activo').map(c => `<option value="${c.ID}">${c.Nombre}</option>`).join('');
    const vehiculosOptions = vehiculos.filter(v => v.Estado === 'Activo').map(v => `<option value="${v.ID}">${v.Patente} - ${v.Marca} ${v.Modelo}</option>`).join('');

    modalContainer.innerHTML = `
        <div class="modal-overlay visible">
            <div class="modal">
                <div class="modal-header">
                    <h3>Crear Nuevo Viaje</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <form id="form-crear-viaje">
                    <div class="modal-body">
                        <h4>Datos Principales</h4>
                        <div class="form-grid">
                            <div class="form-group"><label for="cliente">Cliente</label><select id="cliente" required>${clientesOptions}</select></div>
                            <div class="form-group"><label for="chofer">Chofer</label><select id="chofer" required>${choferesOptions}</select></div>
                            <div class="form-group"><label for="vehiculo">Vehículo</label><select id="vehiculo" required>${vehiculosOptions}</select></div>
                            <div class="form-group"><label for="origen">Origen</label><input type="text" id="origen" required></div>
                            <div class="form-group"><label for="destino">Destino</label><input type="text" id="destino" required></div>
                            <div class="form-group"><label for="fechaSalida">Fecha y Hora de Salida</label><input type="datetime-local" id="fechaSalida" required></div>
                        </div>
                        <div class="checklist-section">
                            <h4>Checklist de Riesgos</h4>
                            <div class="form-group"><label for="riesgo-clima">Condiciones climáticas</label><select id="riesgo-clima" class="riesgo-input"><option value="bajo">Despejado</option><option value="medio">Lluvia leve / Viento</option><option value="alto">Tormenta / Nieve / Niebla densa</option></select></div>
                            <div class="form-group"><label for="riesgo-distancia">Distancia del viaje</label><select id="riesgo-distancia" class="riesgo-input"><option value="bajo">Menos de 200km</option><option value="medio">Entre 200km y 600km</option><option value="alto">Más de 600km</option></select></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary modal-close-btn">Cancelar</button>
                        <button type="submit" class="btn-primary">Guardar Viaje</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const overlay = modalContainer.querySelector('.modal-overlay');
    overlay.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            overlay.classList.remove('visible');
        });
    });

    document.getElementById('form-crear-viaje').addEventListener('submit', handleViajeFormSubmit);
}

/**
 * Maneja el envío del formulario del modal, recolectando datos y enviándolos a la API.
 * @param {Event} e El evento de submit del formulario.
 */
async function handleViajeFormSubmit(e) {
    e.preventDefault();

    const viajeData = {
        ClienteID: document.getElementById('cliente').value,
        ChoferID: document.getElementById('chofer').value,
        VehiculoID: document.getElementById('vehiculo').value,
        Origen: document.getElementById('origen').value,
        Destino: document.getElementById('destino').value,
        FechaHoraSalida: document.getElementById('fechaSalida').value,
        Estado: 'Pendiente',
    };

    const riesgoInputs = document.querySelectorAll('.riesgo-input');
    let nivelesRiesgo = Array.from(riesgoInputs).map(input => input.value);
    
    if (nivelesRiesgo.includes('alto')) {
        viajeData.RiesgoCalculado = 'Alto';
    } else if (nivelesRiesgo.includes('medio')) {
        viajeData.RiesgoCalculado = 'Medio';
    } else {
        viajeData.RiesgoCalculado = 'Bajo';
    }
    
    const result = await callApi('createRecord', {
        sheetName: 'Viajes',
        data: viajeData
    });

    if (result) {
        alert('Viaje creado exitosamente!');
        document.querySelector('.modal-overlay').classList.remove('visible');
        loadViajesTable(); // Refrescar la tabla para ver el nuevo viaje
    }
}

// >>> AÑADE ESTAS DOS NUEVAS FUNCIONES AL FINAL DEL ARCHIVO <<<

/**
 * Carga y muestra los viajes pendientes de aprobación para el supervisor actual.
 */
async function loadAprobacionesView() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user || !user.rol.startsWith('Supervisor')) {
        document.querySelector('#aprobaciones-table tbody').innerHTML = '<tr><td colspan="7">No tienes permisos para ver esta sección.</td></tr>';
        return;
    }

    // Mapear rol a nivel de riesgo
    const riesgoMap = {
        'Supervisor nivel 1': 'Bajo',
        'Supervisor nivel 2': 'Medio',
        'Supervisor nivel 3': 'Alto'
    };
    const riesgoToApprove = riesgoMap[user.rol];

    const [viajes, clientes, choferes] = await Promise.all([
        callApi('getRecords', { sheetName: 'Viajes' }),
        callApi('getRecords', { sheetName: 'Clientes' }),
        callApi('getRecords', { sheetName: 'Choferes' })
    ]);

    const clientesMap = new Map(clientes.map(c => [c.ID, c.RazonSocial]));
    const choferesMap = new Map(choferes.map(ch => [ch.ID, ch.Nombre]));

    const tableBody = document.querySelector('#aprobaciones-table tbody');
    tableBody.innerHTML = '';

    const viajesPendientes = viajes.filter(v => v.Estado === 'Pendiente' && v.RiesgoCalculado === riesgoToApprove);

    if (viajesPendientes.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No tienes viajes pendientes de aprobación.</td></tr>`;
        return;
    }

    viajesPendientes.forEach(viaje => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${clientesMap.get(viaje.ClienteID) || 'N/A'}</td>
            <td>${choferesMap.get(viaje.ChoferID) || 'N/A'}</td>
            <td>${viaje.Origen}</td>
            <td>${viaje.Destino}</td>
            <td>${new Date(viaje.FechaHoraSalida).toLocaleString()}</td>
            <td><span class="riesgo ${viaje.RiesgoCalculado.toLowerCase()}">${viaje.RiesgoCalculado}</span></td>
            <td class="actions">
                <button class="btn-approve" data-id="${viaje.ID}" title="Aprobar Viaje">✔ Aprobar</button>
                <button class="btn-reject" data-id="${viaje.ID}" title="Rechazar Viaje">✖ Rechazar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}


/**
 * Maneja la lógica de aprobación o rechazo de un viaje.
 * @param {string} tripId - El ID del viaje a modificar.
 * @param {string} newStatus - El nuevo estado ('Aprobado' o 'Rechazado').
 */
async function handleApproval(tripId, newStatus) {
    let comment = '';
    if (newStatus === 'Rechazado') {
        comment = prompt("Por favor, introduce el motivo del rechazo:");
        if (comment === null || comment.trim() === "") {
            alert("El motivo de rechazo es obligatorio.");
            return; // El usuario canceló o no escribió nada
        }
    } else {
        if (!confirm(`¿Estás seguro de que quieres aprobar este viaje?`)) {
            return;
        }
    }

    const user = JSON.parse(sessionStorage.getItem('user'));

    const dataToUpdate = {
        Estado: newStatus,
        ComentariosAprobacion: comment,
        SupervisorID: user.id // Guardamos quién tomó la decisión
    };

    const result = await callApi('updateRecord', {
        sheetName: 'Viajes',
        id: tripId,
        data: dataToUpdate
    });

    if (result) {
        alert(`Viaje ${newStatus.toLowerCase()} correctamente.`);
        loadAprobacionesView(); // Recargar la lista de pendientes
    }
}

/**
 * Helper para obtener la ubicación actual del usuario.
 * @returns {Promise<string>} Una promesa que resuelve con "lat,lon" o se rechaza con un error.
 */
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject("Geolocalización no es soportada por este navegador.");
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve(`${position.coords.latitude},${position.coords.longitude}`);
            },
            () => {
                reject("No se pudo obtener la ubicación. Asegúrate de dar permisos.");
            }
        );
    });
}


/**
 * Inicializa la vista del chofer, mostrando sus viajes.
 */
async function initChoferView() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    document.getElementById('user-info-chofer').textContent = `Conectado como: ${user.nombre}`;

    // LÓGICA AÑADIDA AQUÍ 👇
    const logoutBtn = document.getElementById('logoutBtn-chofer');
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('user');
        window.location.hash = '/';
    });
    // Fin de la lógica añadida

    const tripListContainer = document.getElementById('chofer-trip-list');
    tripListContainer.innerHTML = '<p>Cargando viajes...</p>';

    const [viajes, clientes] = await Promise.all([
        callApi('getRecords', { sheetName: 'Viajes' }),
        callApi('getRecords', { sheetName: 'Clientes' })
    ]);

    const clientesMap = new Map(clientes.map(c => [c.ID, c.RazonSocial]));

    const misViajes = viajes.filter(v => 
        v.ChoferID === user.choferId && (v.Estado === 'Aprobado' || v.Estado === 'En curso')
    );

    if (misViajes.length === 0) {
        tripListContainer.innerHTML = '<p>No tienes viajes asignados o pendientes de iniciar.</p>';
        return;
    }

    tripListContainer.innerHTML = misViajes.map(viaje => `
        <div class="trip-card status-${viaje.Estado.toLowerCase()}" data-id="${viaje.ID}">
            <div class="trip-card-header">
                <strong>Cliente:</strong> ${clientesMap.get(viaje.ClienteID) || 'N/A'}
            </div>
            <div class="trip-card-body">
                <p><strong>Origen:</strong> ${viaje.Origen}</p>
                <p><strong>Destino:</strong> ${viaje.Destino}</p>
                <p><strong>Fecha:</strong> ${new Date(viaje.FechaHoraSalida).toLocaleString()}</p>
            </div>
            <div class="trip-card-footer">
                ${viaje.Estado === 'Aprobado' 
                    ? `<button class="btn-start" data-id="${viaje.ID}">▶ Iniciar Viaje</button>`
                    : `<button class="btn-end" data-id="${viaje.ID}">⏹ Finalizar Viaje</button>`
                }
            </div>
        </div>
    `).join('');

    // Delegación de eventos para los botones de acción
    tripListContainer.addEventListener('click', handleChoferActions);

}

/**
 * Manejador para los botones de la vista del chofer.
 */
async function handleChoferActions(event) {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const startButton = event.target.closest('.btn-start');
    const endButton = event.target.closest('.btn-end');

    
    if (startButton) {
    const tripId = startButton ? startButton.dataset.id : endButton.dataset.id;
    const actionType = startButton ? 'INICIO' : 'FIN';
    } else if (endButton) {
        const tripId = endButton.dataset.id;
        // En lugar de finalizar directamente, abrimos el modal de firma
        openSignatureModal(tripId);
    } else if (card) {
        // Si se hizo clic en la tarjeta (y no en un botón), mostramos los detalles
        const tripId = card.dataset.id;
        openTripDetailsModal(tripId);
    }
    
    if (!confirm(`¿Estás seguro de que quieres ${actionType === 'INICIO' ? 'iniciar' : 'finalizar'} este viaje?`)) return;

    try {
        alert("Obteniendo tu ubicación... por favor, acepta la solicitud del navegador.");
        const location = await getCurrentLocation();

        // >>> CAMBIO CLAVE AQUÍ <<<
        // Enviamos user.choferId en lugar de user.id al backend
        const result = await callApi('logTripEvent', {
            viajeId: tripId,
            choferId: user.choferId,
            tipoLog: actionType,
            ubicacion: location
        });

        if (result) {
            alert(result);
            initChoferView(); // Recargar la lista de viajes
        }

    } catch (error) {
        alert(`Error: ${error}`);
    }
}

/**
 * Carga y muestra la lista de usuarios del sistema.
 */
async function loadUsuariosView() {
    const usuarios = await callApi('getRecords', { sheetName: 'Usuarios' });
    if (!usuarios) return;

    const tableBody = document.querySelector('#usuarios-table tbody');
    tableBody.innerHTML = '';

    usuarios.forEach(user => {
        const row = document.createElement('tr');
        const estadoText = (user.Activo === true || String(user.Activo).toLowerCase() === 'true') ? 'Activo' : 'Inactivo';
        const estadoClass = estadoText.toLowerCase();

        row.innerHTML = `
            <td>${user.Nombre}</td>
            <td>${user.Email}</td>
            <td>${user.Rol}</td>
            <td><span class="status ${estadoClass}">${estadoText}</span></td>
            <td class="actions">
                <button class="btn-icon edit btn-edit-usuario" data-id="${user.ID}" title="Editar Usuario"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg></button>
                <button class="btn-icon delete btn-delete-usuario" data-id="${user.ID}" title="Eliminar Usuario"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Maneja la eliminación de un usuario.
 * @param {string} userId - El ID del usuario a eliminar.
 */
async function handleDeleteUsuario(userId) {
    if (!confirm("¿Estás seguro de que quieres eliminar este usuario? Esta acción es irreversible.")) {
        return;
    }

    const result = await callApi('deleteRecord', {
        sheetName: 'Usuarios',
        id: userId
    });

    if (result) {
        alert(result);
        loadUsuariosView(); // Recargar la tabla
    }
}

/**
 * Abre un modal para crear o editar un usuario.
 * @param {string|null} userId - Si se proporciona, abre el modal en modo edición.
 */
async function openUsuarioModal(userId = null) {
    const isEditing = Boolean(userId);
    let userData = {};

    if (isEditing) {
        const usuarios = await callApi('getRecords', { sheetName: 'Usuarios' });
        userData = usuarios.find(u => u.ID === userId);
        if (!userData) {
            alert("Error: No se encontró el usuario para editar.");
            return;
        }
    }

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay visible">
            <div class="modal">
                <div class="modal-header">
                    <h3>${isEditing ? 'Editar' : 'Crear'} Usuario</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <form id="form-usuario">
                    <input type="hidden" id="usuarioId" value="${userData.ID || ''}">
                    <div class="modal-body">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="nombre">Nombre Completo</label>
                                <input type="text" id="nombre" required value="${userData.Nombre || ''}">
                            </div>
                            <div class="form-group">
                                <label for="email">Email</label>
                                <input type="email" id="email" required value="${userData.Email || ''}">
                            </div>
                            <div class="form-group">
                                <label for="password">Contraseña</label>
                                <input type="password" id="password" ${isEditing ? '' : 'required'} placeholder="${isEditing ? 'Dejar en blanco para no cambiar' : ''}">
                            </div>
                            <div class="form-group">
                                <label for="rol">Rol</label>
                                <select id="rol" required>
                                    <option value="Usuario" ${userData.Rol === 'Usuario' ? 'selected' : ''}>Usuario</option>
                                    <option value="Supervisor nivel 1" ${userData.Rol === 'Supervisor nivel 1' ? 'selected' : ''}>Supervisor Nivel 1</option>
                                    <option value="Supervisor nivel 2" ${userData.Rol === 'Supervisor nivel 2' ? 'selected' : ''}>Supervisor Nivel 2</option>
                                    <option value="Supervisor nivel 3" ${userData.Rol === 'Supervisor nivel 3' ? 'selected' : ''}>Supervisor Nivel 3</option>
                                    <option value="Chofer" ${userData.Rol === 'Chofer' ? 'selected' : ''}>Chofer</option>
                                    <option value="Administrador" ${userData.Rol === 'Administrador' ? 'selected' : ''}>Administrador</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="activo">Estado</label>
                                <select id="activo" required>
                                    <option value="true" ${userData.Activo === true ? 'selected' : ''}>Activo</option>
                                    <option value="false" ${userData.Activo === false ? 'selected' : ''}>Inactivo</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary modal-close-btn">Cancelar</button>
                        <button type="submit" class="btn-primary">${isEditing ? 'Guardar Cambios' : 'Crear Usuario'}</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Lógica para cerrar el modal
    const overlay = modalContainer.querySelector('.modal-overlay');
    overlay.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => overlay.classList.remove('visible'));
    });

    document.getElementById('form-usuario').addEventListener('submit', handleUsuarioFormSubmit);
}


/**
 * Maneja el envío del formulario de usuario (crear o editar).
 */
async function handleUsuarioFormSubmit(e) {
    e.preventDefault();
    const userId = document.getElementById('usuarioId').value;
    const isEditing = Boolean(userId);

    const userData = {
        Nombre: document.getElementById('nombre').value,
        Email: document.getElementById('email').value,
        Rol: document.getElementById('rol').value,
        Activo: document.getElementById('activo').value === 'true'
    };
    
    const password = document.getElementById('password').value;
    if (password) { // Solo añadir la contraseña si el campo no está vacío
        userData.Contrasena = password;
    } else if (!isEditing) { // Si es creación, la contraseña es obligatoria
        alert("El campo contraseña es obligatorio para nuevos usuarios.");
        return;
    }
    
    let result;
    if (isEditing) {
        result = await callApi('updateRecord', {
            sheetName: 'Usuarios',
            id: userId,
            data: userData
        });
    } else {
        result = await callApi('createRecord', {
            sheetName: 'Usuarios',
            data: userData
        });
    }

    if (result) {
        alert(result);
        document.querySelector('.modal-overlay').classList.remove('visible');
        loadUsuariosView(); // Recargar la tabla
    }
}
/**
 * Carga y muestra la lista de choferes.
 */
async function loadChoferesView() {
    const choferes = await callApi('getRecords', { sheetName: 'Choferes' });
    if (!choferes) return;

    const tableBody = document.querySelector('#choferes-table tbody');
    tableBody.innerHTML = '';

    choferes.forEach(chofer => {
        const row = document.createElement('tr');
        const estadoClass = String(chofer.Estado).toLowerCase();
        row.innerHTML = `
            <td>${chofer.Nombre}</td>
            <td>${chofer.DNI}</td>
            <td>${chofer.Licencia}</td>
            <td>${chofer.VencimientoLicencia ? new Date(chofer.VencimientoLicencia).toLocaleDateString() : ''}</td>
            <td>${chofer.Telefono}</td>
            <td><span class="status ${estadoClass}">${chofer.Estado}</span></td>
            <td class="actions">
                <button class="btn-icon edit btn-edit-chofer" data-id="${chofer.ID}" title="Editar Chofer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg></button>
                <button class="btn-icon delete btn-delete-chofer" data-id="${chofer.ID}" title="Eliminar Chofer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Maneja la eliminación de un chofer.
 */
async function handleDeleteChofer(choferId) {
    if (!confirm("¿Estás seguro de que quieres eliminar este chofer?")) {
        return;
    }
    const result = await callApi('deleteRecord', { sheetName: 'Choferes', id: choferId });
    if (result) {
        alert(result);
        loadChoferesView();
    }
}

/**
 * Abre un modal para crear o editar un chofer.
 */
async function openChoferModal(choferId = null) {
    const isEditing = Boolean(choferId);
    let choferData = {};

    // Para el dropdown, necesitamos los usuarios con rol 'Chofer' que aún no están asignados
    const [usuarios, todosChoferes] = await Promise.all([
        callApi('getRecords', { sheetName: 'Usuarios' }),
        callApi('getRecords', { sheetName: 'Choferes' })
    ]);
    
    if (isEditing) {
        choferData = todosChoferes.find(c => c.ID === choferId);
    }
    
    const choferesAsignados = new Set(todosChoferes.map(c => c.UsuarioID));
    let usuariosChoferOptions = usuarios
        .filter(u => u.Rol === 'Chofer' && (!choferesAsignados.has(u.ID) || u.ID === choferData.UsuarioID))
        .map(u => `<option value="${u.ID}" ${u.ID === choferData.UsuarioID ? 'selected' : ''}>${u.Nombre} (${u.Email})</option>`)
        .join('');

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay visible"><div class="modal">
            <div class="modal-header"><h3>${isEditing ? 'Editar' : 'Crear'} Chofer</h3><button class="modal-close-btn">&times;</button></div>
            <form id="form-chofer">
                <input type="hidden" id="choferId" value="${choferData.ID || ''}">
                <div class="modal-body"><div class="form-grid">
                    <div class="form-group"><label for="nombre">Nombre Completo</label><input type="text" id="nombre" required value="${choferData.Nombre || ''}"></div>
                    <div class="form-group"><label for="dni">DNI</label><input type="text" id="dni" required value="${choferData.DNI || ''}"></div>
                    <div class="form-group"><label for="licencia">Licencia</label><input type="text" id="licencia" required value="${choferData.Licencia || ''}"></div>
                    <div class="form-group"><label for="vencimiento">Vencimiento Licencia</label><input type="date" id="vencimiento" required value="${choferData.VencimientoLicencia || ''}"></div>
                    <div class="form-group"><label for="telefono">Teléfono</label><input type="tel" id="telefono" required value="${choferData.Telefono || ''}"></div>
                    <div class="form-group"><label for="usuarioId">Usuario Asignado</label><select id="usuarioId" required><option value="">Seleccionar usuario...</option>${usuariosChoferOptions}</select></div>
                    <div class="form-group"><label for="estado">Estado</label><select id="estado" required><option value="Activo" ${choferData.Estado === 'Activo' ? 'selected' : ''}>Activo</option><option value="Inactivo" ${choferData.Estado === 'Inactivo' ? 'selected' : ''}>Inactivo</option></select></div>
                </div></div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary modal-close-btn">Cancelar</button>
                    <button type="submit" class="btn-primary">${isEditing ? 'Guardar Cambios' : 'Crear Chofer'}</button>
                </div>
            </form>
        </div></div>
    `;
    
    // Lógica para cerrar el modal
    const overlay = modalContainer.querySelector('.modal-overlay');
    overlay.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', () => overlay.classList.remove('visible')));
    document.getElementById('form-chofer').addEventListener('submit', handleChoferFormSubmit);
}

/**
 * Maneja el envío del formulario de chofer.
 */
async function handleChoferFormSubmit(e) {
    e.preventDefault();
    const choferId = document.getElementById('choferId').value;
    const isEditing = Boolean(choferId);

    const choferData = {
        Nombre: document.getElementById('nombre').value,
        DNI: document.getElementById('dni').value,
        Licencia: document.getElementById('licencia').value,
        VencimientoLicencia: document.getElementById('vencimiento').value,
        Telefono: document.getElementById('telefono').value,
        Estado: document.getElementById('estado').value,
        UsuarioID: document.getElementById('usuarioId').value,
    };

    let result;
    if (isEditing) {
        result = await callApi('updateRecord', { sheetName: 'Choferes', id: choferId, data: choferData });
    } else {
        result = await callApi('createRecord', { sheetName: 'Choferes', data: choferData });
    }

    if (result) {
        alert(result);
        document.querySelector('.modal-overlay').classList.remove('visible');
        loadChoferesView();
    }
}

/**
 * Carga y muestra la lista de vehículos.
 */
async function loadVehiculosView() {
    const vehiculos = await callApi('getRecords', { sheetName: 'Vehiculos' });
    if (!vehiculos) return;

    const tableBody = document.querySelector('#vehiculos-table tbody');
    tableBody.innerHTML = '';

    vehiculos.forEach(vehiculo => {
        const row = document.createElement('tr');
        const estadoClass = String(vehiculo.Estado).toLowerCase();
        row.innerHTML = `
            <td>${vehiculo.Patente}</td>
            <td>${vehiculo.Marca}</td>
            <td>${vehiculo.Modelo}</td>
            <td>${vehiculo.Ano}</td>
            <td>${vehiculo.VencimientoVTV ? new Date(vehiculo.VencimientoVTV).toLocaleDateString() : ''}</td>
            <td>${vehiculo.VencimientoSeguro ? new Date(vehiculo.VencimientoSeguro).toLocaleDateString() : ''}</td>
            <td><span class="status ${estadoClass}">${vehiculo.Estado}</span></td>
            <td class="actions">
                <button class="btn-icon edit btn-edit-vehiculo" data-id="${vehiculo.ID}" title="Editar Vehículo">✏️</button>
                <button class="btn-icon delete btn-delete-vehiculo" data-id="${vehiculo.ID}" title="Eliminar Vehículo">🗑️</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Maneja la eliminación de un vehículo.
 */
async function handleDeleteVehiculo(vehiculoId) {
    if (!confirm("¿Estás seguro de que quieres eliminar este vehículo?")) {
        return;
    }
    const result = await callApi('deleteRecord', { sheetName: 'Vehiculos', id: vehiculoId });
    if (result) {
        alert(result);
        loadVehiculosView();
    }
}

/**
 * Abre un modal para crear o editar un vehículo.
 */
async function openVehiculoModal(vehiculoId = null) {
    const isEditing = Boolean(vehiculoId);
    let vehiculoData = {};

    if (isEditing) {
        const vehiculos = await callApi('getRecords', { sheetName: 'Vehiculos' });
        vehiculoData = vehiculos.find(v => v.ID === vehiculoId);
    }

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay visible"><div class="modal">
            <div class="modal-header"><h3>${isEditing ? 'Editar' : 'Crear'} Vehículo</h3><button class="modal-close-btn">&times;</button></div>
            <form id="form-vehiculo">
                <input type="hidden" id="vehiculoId" value="${vehiculoData.ID || ''}">
                <div class="modal-body"><div class="form-grid">
                    <div class="form-group"><label for="patente">Patente</label><input type="text" id="patente" required value="${vehiculoData.Patente || ''}"></div>
                    <div class="form-group"><label for="marca">Marca</label><input type="text" id="marca" required value="${vehiculoData.Marca || ''}"></div>
                    <div class="form-group"><label for="modelo">Modelo</label><input type="text" id="modelo" required value="${vehiculoData.Modelo || ''}"></div>
                    <div class="form-group"><label for="ano">Año</label><input type="number" id="ano" required value="${vehiculoData.Ano || ''}"></div>
                    <div class="form-group"><label for="vencimientoVtv">Vencimiento VTV</label><input type="date" id="vencimientoVtv" value="${vehiculoData.VencimientoVTV || ''}"></div>
                    <div class="form-group"><label for="vencimientoSeguro">Vencimiento Seguro</label><input type="date" id="vencimientoSeguro" value="${vehiculoData.VencimientoSeguro || ''}"></div>
                    <div class="form-group"><label for="estado">Estado</label><select id="estado" required><option value="Activo" ${vehiculoData.Estado === 'Activo' ? 'selected' : ''}>Activo</option><option value="Inactivo" ${vehiculoData.Estado === 'Inactivo' ? 'selected' : ''}>Inactivo</option></select></div>
                </div></div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary modal-close-btn">Cancelar</button>
                    <button type="submit" class="btn-primary">${isEditing ? 'Guardar Cambios' : 'Crear Vehículo'}</button>
                </div>
            </form>
        </div></div>
    `;
    
    // Lógica para cerrar el modal
    const overlay = modalContainer.querySelector('.modal-overlay');
    overlay.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', () => overlay.classList.remove('visible')));
    document.getElementById('form-vehiculo').addEventListener('submit', handleVehiculoFormSubmit);
}

/**
 * Maneja el envío del formulario de vehículo.
 */
async function handleVehiculoFormSubmit(e) {
    e.preventDefault();
    const vehiculoId = document.getElementById('vehiculoId').value;
    const isEditing = Boolean(vehiculoId);

    const vehiculoData = {
        Patente: document.getElementById('patente').value,
        Marca: document.getElementById('marca').value,
        Modelo: document.getElementById('modelo').value,
        Ano: document.getElementById('ano').value,
        VencimientoVTV: document.getElementById('vencimientoVtv').value,
        VencimientoSeguro: document.getElementById('vencimientoSeguro').value,
        Estado: document.getElementById('estado').value,
    };

    let result;
    if (isEditing) {
        result = await callApi('updateRecord', { sheetName: 'Vehiculos', id: vehiculoId, data: vehiculoData });
    } else {
        result = await callApi('createRecord', { sheetName: 'Vehiculos', data: vehiculoData });
    }

    if (result) {
        alert(result);
        document.querySelector('.modal-overlay').classList.remove('visible');
        loadVehiculosView();
    }
}

/**
 * Carga y muestra la lista de clientes.
 */
async function loadClientesView() {
    const clientes = await callApi('getRecords', { sheetName: 'Clientes' });
    if (!clientes) return;

    const tableBody = document.querySelector('#clientes-table tbody');
    tableBody.innerHTML = '';

    clientes.forEach(cliente => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cliente.RazonSocial}</td>
            <td>${cliente.CUIT_DNI}</td>
            <td>${cliente.Direccion}</td>
            <td>${cliente.Contacto}</td>
            <td class="actions">
                <button class="btn-icon edit btn-edit-cliente" data-id="${cliente.ID}" title="Editar Cliente">✏️</button>
                <button class="btn-icon delete btn-delete-cliente" data-id="${cliente.ID}" title="Eliminar Cliente">🗑️</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Maneja la eliminación de un cliente.
 */
async function handleDeleteCliente(clienteId) {
    if (!confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
        return;
    }
    const result = await callApi('deleteRecord', { sheetName: 'Clientes', id: clienteId });
    if (result) {
        alert(result);
        loadClientesView();
    }
}

/**
 * Abre un modal para crear o editar un cliente.
 */
async function openClienteModal(clienteId = null) {
    const isEditing = Boolean(clienteId);
    let clienteData = {};

    if (isEditing) {
        const clientes = await callApi('getRecords', { sheetName: 'Clientes' });
        clienteData = clientes.find(c => c.ID === clienteId);
    }

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay visible"><div class="modal">
            <div class="modal-header"><h3>${isEditing ? 'Editar' : 'Crear'} Cliente</h3><button class="modal-close-btn">&times;</button></div>
            <form id="form-cliente">
                <input type="hidden" id="clienteId" value="${clienteData.ID || ''}">
                <div class="modal-body"><div class="form-grid">
                    <div class="form-group"><label for="razonSocial">Razón Social / Nombre</label><input type="text" id="razonSocial" required value="${clienteData.RazonSocial || ''}"></div>
                    <div class="form-group"><label for="cuitDni">CUIT / DNI</label><input type="text" id="cuitDni" required value="${clienteData.CUIT_DNI || ''}"></div>
                    <div class="form-group"><label for="direccion">Dirección</label><input type="text" id="direccion" value="${clienteData.Direccion || ''}"></div>
                    <div class="form-group"><label for="contacto">Contacto (Email/Teléfono)</label><input type="text" id="contacto" value="${clienteData.Contacto || ''}"></div>
                </div></div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary modal-close-btn">Cancelar</button>
                    <button type="submit" class="btn-primary">${isEditing ? 'Guardar Cambios' : 'Crear Cliente'}</button>
                </div>
            </form>
        </div></div>
    `;
    
    // Lógica para cerrar el modal
    const overlay = modalContainer.querySelector('.modal-overlay');
    overlay.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', () => overlay.classList.remove('visible')));
    document.getElementById('form-cliente').addEventListener('submit', handleClienteFormSubmit);
}

/**
 * Maneja el envío del formulario de cliente.
 */
async function handleClienteFormSubmit(e) {
    e.preventDefault();
    const clienteId = document.getElementById('clienteId').value;
    const isEditing = Boolean(clienteId);

    const clienteData = {
        RazonSocial: document.getElementById('razonSocial').value,
        CUIT_DNI: document.getElementById('cuitDni').value,
        Direccion: document.getElementById('direccion').value,
        Contacto: document.getElementById('contacto').value,
    };

    let result;
    if (isEditing) {
        result = await callApi('updateRecord', { sheetName: 'Clientes', id: clienteId, data: clienteData });
    } else {
        result = await callApi('createRecord', { sheetName: 'Clientes', data: clienteData });
    }

    if (result) {
        alert(result);
        document.querySelector('.modal-overlay').classList.remove('visible');
        loadClientesView();
    }
}
/**
 * Abre un modal con los detalles completos de un viaje.
 * @param {string} tripId - El ID del viaje a mostrar.
 */
async function openTripDetailsModal(tripId) {
    const [viajes, clientes, vehiculos] = await Promise.all([
        callApi('getRecords', { sheetName: 'Viajes' }),
        callApi('getRecords', { sheetName: 'Clientes' }),
        callApi('getRecords', { sheetName: 'Vehiculos' })
    ]);

    const viaje = viajes.find(v => v.ID === tripId);
    if (!viaje) { alert("No se encontraron los detalles del viaje."); return; }

    const cliente = clientes.find(c => c.ID === viaje.ClienteID);
    const vehiculo = vehiculos.find(v => v.ID === viaje.VehiculoID);

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay visible"><div class="modal">
            <div class="modal-header"><h3>Detalles del Viaje</h3><button class="modal-close-btn">&times;</button></div>
            <div class="modal-body">
                <h4>Cliente y Ruta</h4>
                <p><strong>Cliente:</strong> ${cliente ? cliente.RazonSocial : 'N/A'}</p>
                <p><strong>Origen:</strong> ${viaje.Origen}</p>
                <p><strong>Destino:</strong> ${viaje.Destino}</p>
                <p><strong>Fecha de Salida:</strong> ${new Date(viaje.FechaHoraSalida).toLocaleString()}</p>
                
                <h4 style="margin-top: 1.5rem;">Vehículo Asignado</h4>
                <p><strong>Patente:</strong> ${vehiculo ? vehiculo.Patente : 'N/A'}</p>
                <p><strong>Marca/Modelo:</strong> ${vehiculo ? `${vehiculo.Marca} ${vehiculo.Modelo}` : 'N/A'}</p>

            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary modal-close-btn">Cerrar</button>
            </div>
        </div></div>
    `;

    const overlay = modalContainer.querySelector('.modal-overlay');
    overlay.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', () => overlay.classList.remove('visible')));
}
/**
 * Abre el modal para que el chofer capture su firma.
 * @param {string} tripId - El ID del viaje que se está finalizando.
 */
function openSignatureModal(tripId) {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay visible"><div class="modal">
            <div class="modal-header"><h3>Finalizar Viaje - Firmar Constancia</h3></div>
            <div class="modal-body" style="text-align: center;">
                <p>Por favor, firma en el siguiente recuadro:</p>
                <canvas id="signature-canvas" style="border: 2px solid #ccc; border-radius: 5px;"></canvas>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" id="clear-signature">Limpiar</button>
                <button type="button" class="btn-primary" id="save-signature" data-id="${tripId}">Guardar Firma y Finalizar</button>
            </div>
        </div></div>
    `;

    const canvas = document.getElementById('signature-canvas');
    // Ajustar tamaño del canvas (importante para que funcione en móviles)
    const rect = canvas.getBoundingClientRect();
    canvas.width = canvas.parentElement.clientWidth * 0.9;
    canvas.height = 200;

    const signaturePad = new SignaturePad(canvas);

    document.getElementById('clear-signature').addEventListener('click', () => {
        signaturePad.clear();
    });

    document.getElementById('save-signature').addEventListener('click', async (event) => {
        if (signaturePad.isEmpty()) {
            return alert("Por favor, proporciona una firma.");
        }
        
        const tripId = event.target.dataset.id;
        const user = JSON.parse(sessionStorage.getItem('user'));
        const signatureDataURL = signaturePad.toDataURL(); // Obtiene la imagen en Base64
        
        try {
            alert("Obteniendo tu ubicación final...");
            const location = await getCurrentLocation();
            
            const result = await callApi('logTripEvent', {
                viajeId: tripId,
                choferId: user.choferId,
                tipoLog: 'FIN',
                ubicacion: location,
                firmaBase64: signatureDataURL // >>> ¡ENVIAMOS LA FIRMA! <<<
            });

            if (result) {
                alert(result);
                document.querySelector('.modal-overlay').classList.remove('visible');
                initChoferView(); // Recargar la vista del chofer
            }
        } catch (error) {
            alert(`Error: ${error}`);
        }
    });
}