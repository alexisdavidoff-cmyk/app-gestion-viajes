// =================================================================
// ARCHIVO: main.js
// Contiene la lógica principal del frontend de la aplicación.
// =================================================================

// VARIABLE GLOBAL PARA GUARDAR LOS DATOS DE VIAJES
let allTripsData = []; // Guardará todos los viajes para no tener que pedirlos a la API cada vez

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

    // --- LÓGICA PARA EL BOTÓN DE HAMBURGUESA ---
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
    filterMenuByRole(user.rol);
    
    // --- ¡AQUÍ ESTÁ EL CAMBIO CLAVE! ---
    // Aseguramos que la vista por defecto sea el tablero de control.
    loadSubView('/dashboard'); 
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
            case '/dashboard': loadDashboardView(); break; 
            
                // >>> AÑADE ESTE NUEVO CASO <<<
            case '/aprobaciones':
                loadAprobacionesView();
                break;
            case '/usuarios': loadUsuariosView(); break;
            case '/choferes': loadChoferesView(); break;
            case '/vehiculos': loadVehiculosView(); break;
            case '/clientes': loadClientesView(); break;
            case '/viajes':
            initViajesView(); // Llamaremos a una nueva función de inicialización
            break;
    }
            // Aquí irían los casos para otras vistas (choferes, vehículos, etc.)
        
    } else {
        viewTitle.textContent = 'Página no encontrada';
        viewContent.innerHTML = '<p>La sección que buscas no existe.</p>';
    }
}

/**
 * Inicializa la vista de viajes: obtiene los datos una vez y configura los listeners.
 */
async function initViajesView() {
    // Obtenemos todos los datos necesarios una sola vez al cargar la vista
    const [viajes, clientes, choferes] = await Promise.all([
        callApi('getRecords', { sheetName: 'Viajes' }),
        callApi('getRecords', { sheetName: 'Clientes' }),
        callApi('getRecords', { sheetName: 'Choferes' })
    ]);

    // Creamos mapas para una búsqueda rápida de nombres
    const clientesMap = new Map(clientes.map(c => [c.ID, c.RazonSocial]));
    const choferesMap = new Map(choferes.map(ch => [ch.ID, ch.Nombre]));

    // Procesamos y guardamos los datos de viajes en nuestra variable global
    allTripsData = viajes.map(viaje => ({
        ...viaje,
        clienteNombre: clientesMap.get(viaje.ClienteID) || 'N/A',
        choferNombre: choferesMap.get(viaje.ChoferID) || 'N/A'
    }));

    // Añadimos los event listeners a los controles de filtro y orden
    document.getElementById('filter-input').addEventListener('input', () => renderViajesTable());
    document.getElementById('sort-select').addEventListener('change', () => renderViajesTable());
    
    // Renderizamos la tabla por primera vez
    renderViajesTable();
}

/**
 * Renderiza la tabla de viajes aplicando los filtros y el orden actual.
 * Ya no necesita llamar a la API, trabaja con los datos en allTripsData.
 */
function renderViajesTable() {
    const filterText = document.getElementById('filter-input').value.toLowerCase();
    const sortBy = document.getElementById('sort-select').value;
    
    // 1. Filtrar datos
    let filteredTrips = allTripsData.filter(viaje => {
        return (
            viaje.clienteNombre.toLowerCase().includes(filterText) ||
            viaje.choferNombre.toLowerCase().includes(filterText) ||
            viaje.Origen.toLowerCase().includes(filterText) ||
            viaje.Destino.toLowerCase().includes(filterText) ||
            viaje.IDViajeLegible.toLowerCase().includes(filterText)
        );
    });

    // 2. Ordenar datos
    const riesgoOrder = { 'Bajo': 1, 'Medio': 2, 'Alto': 3 };
    filteredTrips.sort((a, b) => {
        switch (sortBy) {
            case 'fecha-asc':
                return new Date(a.FechaHoraSalida) - new Date(b.FechaHoraSalida);
            case 'riesgo-desc':
                return (riesgoOrder[b.RiesgoCalculado] || 0) - (riesgoOrder[a.RiesgoCalculado] || 0);
            case 'riesgo-asc':
                return (riesgoOrder[a.RiesgoCalculado] || 0) - (riesgoOrder[b.RiesgoCalculado] || 0);
            case 'fecha-desc':
            default:
                return new Date(b.FechaHoraSalida) - new Date(a.FechaHoraSalida);
        }
    });
    
    // 3. Renderizar tabla (reemplazamos la vieja lógica de loadViajesTable)
    const tableBody = document.querySelector('#viajes-table tbody');
    tableBody.innerHTML = '';
    
    if (filteredTrips.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No se encontraron viajes que coincidan con los filtros.</td></tr>';
        return;
    }

    filteredTrips.forEach(viaje => {
        const row = document.createElement('tr');
        row.dataset.id = viaje.ID;
        row.classList.add('clickable-row');

        row.innerHTML = `
            <td>${viaje.IDViajeLegible || 'N/A'}</td>
            <td>${viaje.clienteNombre}</td>
            <td>${viaje.choferNombre}</td>
            <td>${viaje.Origen}</td>
            <td>${viaje.Destino}</td>
            <td>${new Date(viaje.FechaHoraSalida).toLocaleString()}</td>
            <td><span class="status ${(viaje.Estado || '').toLowerCase()}">${viaje.Estado}</span></td>
            <td><span class="riesgo ${(viaje.RiesgoCalculado || '').toLowerCase()}">${viaje.RiesgoCalculado}</span></td>
            <td class="actions">
                <!-- ... los botones de acción ... -->
                <button class="btn-icon map btn-open-gmaps" data-origen="${viaje.Origen}" data-destino="${viaje.Destino}" title="Ver ruta en Google Maps">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>
                </button>
                <button class="btn-icon edit" title="Editar Viaje">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg>
                </button>
                <!-- Aquí podríamos añadir un botón de eliminar si fuera necesario -->
            </td>
        `;
        tableBody.appendChild(row);
    });
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

    // >>> AÑADE ESTA LÓGICA PARA EL CLIC EN LA FILA <<<
    const clickedRow = event.target.closest('.clickable-row');
    // Nos aseguramos de no activar esto si se hizo clic en un botón dentro de la fila
    const isActionButton = event.target.closest('.btn-icon'); 

    if (clickedRow && !isActionButton) {
        const tripId = clickedRow.dataset.id;
        openViajeDetailsModal(tripId);
    }

    const editTripButton = event.target.closest('.btn-icon.edit');
    if (editTripButton) {
        const tripId = editTripButton.closest('.clickable-row').dataset.id;
        // Llamaremos a nuestra función de modal, pero ahora pasándole un ID
        openCrearViajeModal(tripId);
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

    const gmapsButton = event.target.closest('.btn-open-gmaps');
    if (gmapsButton) {
        const origen = gmapsButton.dataset.origen;
        const destino = gmapsButton.dataset.destino;
        
        // Formateamos los textos para que sean seguros para una URL
        const origenEncoded = encodeURIComponent(origen);
        const destinoEncoded = encodeURIComponent(destino);

        // Construimos la URL de Google Maps Directions
        const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origenEncoded}&destination=${destinoEncoded}`;

        // Abrimos la URL en una nueva pestaña
        window.open(gmapsUrl, '_blank');
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
        // >>> AÑADIMOS data-id A LA FILA Y LA HACEMOS CLICABLE <<<
        row.dataset.id = viaje.ID;
        row.classList.add('clickable-row');
        
        const origen = viaje.Origen;
        const destino = viaje.Destino;
        row.innerHTML = `
            <td>${viaje.IDViajeLegible || 'N/A'}</td>
            <td>${clientesMap.get(viaje.ClienteID) || 'N/A'}</td>
            <td>${choferesMap.get(viaje.ChoferID) || 'N/A'}</td>
            <td>${viaje.Origen}</td>
            <td>${viaje.Destino}</td>
            <td>${new Date(viaje.FechaHoraSalida).toLocaleString()}</td>
            <td><span class="status ${(viaje.Estado || '').toLowerCase()}">${viaje.Estado}</span></td>
            <td><span class="riesgo ${(viaje.RiesgoCalculado || '').toLowerCase()}">${viaje.RiesgoCalculado}</span></td>
            <td class="actions">
            <button class="btn-icon map btn-open-gmaps" data-origen="${origen}" data-destino="${destino}" title="Ver ruta en Google Maps">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16">
                        <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                    </svg>
                </button>
                <button class="btn-icon view" title="Ver Detalles">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/></svg>
                </button>
                <button class="btn-icon edit" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// --- LÓGICA DEL MODAL DE CREAR VIAJE ---

/**
 * Maneja el envío del formulario del modal, recolectando datos y enviándolos a la API.
 * @param {Event} e El evento de submit del formulario.
 */
/**
 * Abre el modal detallado para crear o editar un plan de viaje.
 * Si se proporciona un tripId, entra en modo de edición.
 * @param {string|null} tripId - El ID del viaje a editar.
 */
async function openCrearViajeModal(tripId = null) {
    const isEditing = Boolean(tripId);
    let viajeData = {};

    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `<div class="modal-overlay visible"><div class="modal modal-lg"><div class="modal-body"><p>Cargando datos del formulario...</p></div></div></div>`;

    try {
        if (isEditing) {
            // En modo edición, primero obtenemos los datos del viaje específico
            const todosLosViajes = await callApi('getRecords', { sheetName: 'Viajes' });
            viajeData = todosLosViajes.find(v => v.ID === tripId);

            if (!viajeData) {
                throw new Error("No se pudo encontrar el viaje seleccionado.");
            }

            // --- CONTROL DE ESTADO ---
            // Solo permitimos editar si el viaje está Pendiente o Rechazado
            if (viajeData.Estado !== 'Pendiente' && viajeData.Estado !== 'Rechazado') {
                alert(`Este viaje no se puede editar porque su estado es "${viajeData.Estado}".`);
                modalContainer.innerHTML = ''; // Limpia el modal
                return;
            }
        }

        // Cargamos los datos para los menús desplegables
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
            <div class="modal modal-lg">
                <div class="modal-header"><h3>${isEditing ? 'Editar' : 'Crear'} Plan de Viaje</h3><button class="modal-close-btn">&times;</button></div>
                <form id="form-crear-viaje">
                    <input type="hidden" id="tripId" value="${viajeData.ID || ''}">
                    <div class="modal-body">
                        <!-- SECCIÓN 1 -->
                        <div class="form-section">
                            <h4>1. Información General del Viaje</h4>
                            <div class="form-grid">
                                <div class="form-group"><label>Origen</label><input type="text" id="origen" required value="${viajeData.Origen || ''}"></div>
                                <div class="form-group"><label>Destino</label><input type="text" id="destino" required value="${viajeData.Destino || ''}"></div>
                                <div class="form-group"><label>Fecha y Hora de Inicio</label><input type="datetime-local" id="fechaSalida" required></div>
                                <div class="form-group"><label>Fecha y Hora de Fin (Estimada)</label><input type="datetime-local" id="fechaFin" required></div>
                                <div class="form-group"><label>Cliente</label><select id="cliente" required>${clientesOptions}</select></div>
                                <div class="form-group"><label>Chofer</label><select id="chofer" required>${choferesOptions}</select></div>
                                <div class="form-group"><label>Vehículo</label><select id="vehiculo" required>${vehiculosOptions}</select></div>
                                <div class="form-group"><label>Horas de trabajo previas</label><input type="number" id="horasTrabajo" required min="0" value="${viajeData.HorasTrabajoPrevias || ''}"></div>
                                <div class="form-group full-width"><label>Propósito del Viaje</label><input type="text" id="proposito" required value="${viajeData.Proposito || ''}"></div>
                                <div class="form-group full-width"><label>Ruta a Seguir</label><textarea id="ruta" rows="2">${viajeData.RutaDetallada || ''}</textarea></div>
                            </div>
                        </div>
                        
                        <!-- SECCIÓN 2 -->
                        <div class="form-section">
                            <h4>2. Checklist de Seguridad del Vehículo</h4>
                            <div class="checklist-grid security-checklist">
                                <label><input type="checkbox" name="seguridad" value="tarjeta_verde"> Tarjeta Verde</label>
                                <label><input type="checkbox" name="seguridad" value="licencia"> Licencia de Conducir</label>
                                <label><input type="checkbox" name="seguridad" value="dni"> DNI</label>
                                <label><input type="checkbox" name="seguridad" value="vtv"> VTV</label>
                                <label><input type="checkbox" name="seguridad" value="seguro"> Seguro Automotor</label>
                                <label><input type="checkbox" name="seguridad" value="matafuegos"> Matafuegos</label>
                                <label><input type="checkbox" name="seguridad" value="botiquin"> Botiquín</label>
                                <label><input type="checkbox" name="seguridad" value="triangulo_chaleco"> Triángulo y Chaleco</label>
                                <label><input type="checkbox" name="seguridad" value="rueda_auxilio"> Rueda de Auxilio</label>
                                <label><input type="checkbox" name="seguridad" value="descanso_obligatorio"> Descanso Obligatorio Cumplido</label>
                            </div>
                        </div>

                        <!-- SECCIÓN 3 -->
                        <div class="form-section">
                            <h4>3. Análisis de Riesgos</h4>
                            <div class="riesgo-grid">
                                <div class="riesgo-group"><h5>A. Distancia</h5><label><input type="radio" name="distancia" data-points="1" required> Menor a 50km <span class="pts">1pts</span></label><label><input type="radio" name="distancia" data-points="2"> Menor a 100km <span class="pts">2pts</span></label><label><input type="radio" name="distancia" data-points="3"> Menor a 200km <span class="pts">3pts</span></label><label><input type="radio" name="distancia" data-points="4"> Más de 200km <span class="pts">4pts</span></label></div>
                                <div class="riesgo-group"><h5>B. Condiciones de la Ruta</h5><label><input type="radio" name="ruta_cond" data-points="1" required> Pavimento en buen estado <span class="pts">1pts</span></label><label><input type="radio" name="ruta_cond" data-points="2"> Pavimento en mal estado <span class="pts">2pts</span></label><label><input type="radio" name="ruta_cond" data-points="3"> Camino consolidado <span class="pts">3pts</span></label><label><input type="radio" name="ruta_cond" data-points="4"> Ripio <span class="pts">4pts</span></label></div>
                                <div class="riesgo-group"><h5>C. Condiciones Meteorológicas</h5><label><input type="radio" name="clima" data-points="1" required> Seco <span class="pts">1pts</span></label><label><input type="radio" name="clima" data-points="2"> Viento Fuerte <span class="pts">2pts</span></label><label><input type="radio" name="clima" data-points="3"> Lluvia Torrencial <span class="pts">3pts</span></label><label><input type="radio" name="clima" data-points="4"> Niebla / Hielo / Nieve <span class="pts">4pts</span></label></div>
                                <div class="riesgo-group"><h5>D. Comunicación</h5><label><input type="radio" name="comunicacion" data-points="1" required> Teléfono celular o radio <span class="pts">1 pts</span></label><label><input type="radio" name="comunicacion" data-points="2"> Sin comunicación <span class="pts">2 pts</span></label></div>
                                <div class="riesgo-group"><h5>E. Tipo de Viaje (Convoy)</h5><label><input type="radio" name="convoy" data-points="1" required> 2 o más vehículos con 2 o más conductores <span class="pts">1 pts</span></label><label><input type="radio" name="convoy" data-points="2"> 2 o más vehículos con 1 conductor <span class="pts">2 pts</span></label><label><input type="radio" name="convoy" data-points="3"> 1 vehículo con 2 o más conductores <span class="pts">3 pts</span></label><label><input type="radio" name="convoy" data-points="4"> 1 vehículo y 1 conductor <span class="pts">4 pts</span></label></div>
                                <div class="riesgo-group"><h5>F. Condiciones del Tránsito</h5><label><input type="radio" name="transito" data-points="1" required> Tráfico bajo <span class="pts">1 pts</span></label><label><input type="radio" name="transito" data-points="2"> Tráfico moderado <span class="pts">2 pts</span></label><label><input type="radio" name="transito" data-points="3"> Tráfico alto <span class="pts">3 pts</span></label><label><input type="radio" name="transito" data-points="4"> Alto tráfico de camiones y/o motocicletas <span class="pts">4 pts</span></label></div>
                            </div>
                        </div>
                        
                        <!-- SECCIÓN 4 -->
                        <div class="form-section">
                            <h4>4. Resultado del Análisis</h4>
                            <div class="resultado-box"><span>Puntaje Total:</span><strong id="puntaje-total">0</strong></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary modal-close-btn">Cancelar</button>
                        <button type="submit" class="btn-primary">${isEditing ? 'Guardar Cambios' : 'Guardar y Enviar'}</button>
                    </div>
                </form>
            </div>
        </div>
        `;

        // --- LÓGICA PARA RELLENAR LOS CAMPOS EN MODO EDICIÓN ---
        if (isEditing) {
            document.getElementById('cliente').value = viajeData.ClienteID;
            document.getElementById('chofer').value = viajeData.ChoferID;
            document.getElementById('vehiculo').value = viajeData.VehiculoID;
            // El formato YYYY-MM-DDTHH:mm es requerido por el input datetime-local
            document.getElementById('fechaSalida').value = viajeData.FechaHoraSalida ? new Date(new Date(viajeData.FechaHoraSalida).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '';
            document.getElementById('fechaFin').value = viajeData.FechaHoraFinEstimada ? new Date(new Date(viajeData.FechaHoraFinEstimada).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '';
        
            // Rellenar checklists
            const checklistSeguridad = JSON.parse(viajeData.ChecklistSeguridad || '{}');
            Object.keys(checklistSeguridad).forEach(key => {
                const checkbox = document.querySelector(`.security-checklist input[value="${key}"]`);
                if (checkbox) checkbox.checked = true;
            });

            const respuestasRiesgos = JSON.parse(viajeData.RespuestasRiesgos || '{}');
            Object.keys(respuestasRiesgos).forEach(groupName => {
                const radio = document.querySelector(`input[name="${groupName}"][data-points="${respuestasRiesgos[groupName].puntos}"]`);
                if (radio) radio.checked = true;
            });
        }

        // Lógica para cerrar el modal
        const overlay = modalContainer.querySelector('.modal-overlay');
        overlay.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', () => overlay.classList.remove('visible')));
        
        // Lógica para el cálculo de puntos
        const riesgoInputs = modalContainer.querySelectorAll('input[type="radio"][data-points]');
        const calculateTotalPoints = () => {
            let totalPuntos = 0;
            modalContainer.querySelectorAll('input[type="radio"][data-points]:checked').forEach(input => {
                totalPuntos += parseInt(input.dataset.points, 10);
            });
            document.getElementById('puntaje-total').textContent = totalPuntos;
        };
        riesgoInputs.forEach(input => input.addEventListener('change', calculateTotalPoints));
        
        // Calculamos el puntaje inicial si estamos editando
        if(isEditing) calculateTotalPoints();
        
        document.getElementById('form-crear-viaje').addEventListener('submit', handleViajeFormSubmit);

    } catch (error) {
        alert(`Error al cargar el formulario: ${error.message}`);
        modalContainer.innerHTML = '';
    }
}

// Archivo: main.js -> REEMPLAZA esta función

/**
 * Recopila toda la información de un viaje y la muestra en un modal detallado.
 * @param {string} tripId - El ID (UUID) del viaje a mostrar.
 */
async function openViajeDetailsModal(tripId) {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `<div class="modal-overlay visible"><div class="modal modal-lg"><div class="modal-body"><p>Cargando detalles del viaje...</p></div></div></div>`;

    try {
        // 1. Recopilar todos los datos necesarios en paralelo
        const [viajes, clientes, choferes, vehiculos, firmas, logs, usuarios] = await Promise.all([
            callApi('getRecords', { sheetName: 'Viajes' }),
            callApi('getRecords', { sheetName: 'Clientes' }),
            callApi('getRecords', { sheetName: 'Choferes' }),
            callApi('getRecords', { sheetName: 'Vehiculos' }),
            callApi('getRecords', { sheetName: 'Firmas' }),
            callApi('getRecords', { sheetName: 'LogsViajes' }),
            callApi('getRecords', { sheetName: 'Usuarios' })
        ]);

        // 2. Encontrar todos los registros específicos para nuestro viaje
        const viaje = viajes.find(v => v.ID === tripId);
        if (!viaje) { throw new Error("Viaje no encontrado."); }

        const cliente = clientes.find(c => c.ID === viaje.ClienteID) || {};
        const chofer = choferes.find(ch => ch.ID === viaje.ChoferID) || {};
        const vehiculo = vehiculos.find(v => v.ID === viaje.VehiculoID) || {};
        const firma = firmas.find(f => f.ViajeID === tripId) || {};
        const logInicio = logs.find(l => l.ViajeID === tripId && l.TipoLog === 'INICIO') || {};
        const logFin = logs.find(l => l.ViajeID === tripId && l.TipoLog === 'FIN') || {};
        const usuarioCreador = usuarios.find(u => u.ID === viaje.UsuarioCreadorID) || {};

        // 3. Parsear los datos JSON guardados como texto
        const checklistSeguridad = JSON.parse(viaje.ChecklistSeguridad || '{}');
        const respuestasRiesgos = JSON.parse(viaje.RespuestasRiesgos || '{}');

        // 4. Construir las secciones del HTML dinámicamente
        const checklistHtml = Object.keys(checklistSeguridad).map(key => `<li>✔️ ${key.replace(/_/g, ' ')}</li>`).join('');
        const riesgosHtml = Object.entries(respuestasRiesgos).map(([key, value]) => `<li><strong>${key}:</strong> ${value.valor} <em>(${value.puntos} pts)</em></li>`).join('');
        
        // 5. Renderizar el modal completo
        modalContainer.innerHTML = `
            <div class="modal-overlay visible">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3>Detalles del Viaje: ${viaje.IDViajeLegible}</h3>
                        <button class="modal-close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="details-grid">
                            <!-- SECCIÓN DE INFORMACIÓN GENERAL -->
                            <div class="details-section">
                                <h4>Información General</h4>
                                <p><strong>Cliente:</strong> ${cliente.RazonSocial || 'N/A'}</p>
                                <p><strong>Origen:</strong> ${viaje.Origen}</p>
                                <p><strong>Destino:</strong> ${viaje.Destino}</p>
                                <p><strong>Propósito:</strong> ${viaje.Proposito || 'N/A'}</p>
                                <p><strong>Ruta Detallada:</strong> ${viaje.RutaDetallada || 'N/A'}</p>
                            </div>
                            <!-- SECCIÓN DE OPERACIÓN -->
                            <div class="details-section">
                                <h4>Operación</h4>
                                <p><strong>Chofer:</strong> ${chofer.Nombre || 'N/A'}</p>
                                <p><strong>Vehículo:</strong> ${vehiculo.Patente || 'N/A'} (${vehiculo.Marca || ''} ${vehiculo.Modelo || ''})</p>
                                <p><strong>Inicio Programado:</strong> ${new Date(viaje.FechaHoraSalida).toLocaleString()}</p>
                                <p><strong>Fin Estimado:</strong> ${new Date(viaje.FechaHoraFinEstimada).toLocaleString()}</p>
                            </div>
                            <!-- SECCIÓN DE AUDITORÍA -->
                            <div class="details-section full-width">
                                <h4>Auditoría y Estado</h4>
                                <p>
                                    <strong>Estado:</strong> <span class="status ${String(viaje.Estado).toLowerCase()}">${viaje.Estado}</span>
                                    <strong>Riesgo:</strong> <span class="riesgo ${String(viaje.RiesgoCalculado).toLowerCase()}">${viaje.RiesgoCalculado}</span>
                                    (Puntaje: ${viaje.PuntajeRiesgo})
                                </p>
                                <p><strong>Creado por:</strong> ${usuarioCreador.Nombre || 'Desconocido'} ${viaje.FechaCreacion ? `el ${new Date(viaje.FechaCreacion).toLocaleString()}` : ''}</p>
                            </div>
                            <!-- SECCIÓN DE LOGS -->
                            <div class="details-section">
                                <h4>Logs de Viaje</h4>
                                <p><strong>Inicio Real:</strong> ${logInicio.FechaHora ? new Date(logInicio.FechaHora).toLocaleString() : 'Pendiente'}</p>
                                <p><strong>Ubicación Inicio:</strong> ${logInicio.Ubicacion || 'N/A'}</p>
                                <p><strong>Fin Real:</strong> ${logFin.FechaHora ? new Date(logFin.FechaHora).toLocaleString() : 'Pendiente'}</p>
                                <p><strong>Ubicación Fin:</strong> ${logFin.Ubicacion || 'N/A'}</p>
                            </div>
                            <!-- SECCIÓN DE FIRMA -->
                            <div class="details-section signature-section">
                                <h4>Firma del Chofer</h4>
                                ${firma.FirmaBase64 ? `<img src="${firma.FirmaBase64}" alt="Firma Digital">` : '<p>Pendiente de finalización.</p>'}
                            </div>
                            <!-- SECCIÓN CHECKLISTS -->
                            <div class="details-section">
                                <h4>Checklist Seguridad</h4>
                                <ul class="details-list">${checklistHtml || '<li>No se completó.</li>'}</ul>
                            </div>
                            <div class="details-section">
                                <h4>Checklist Riesgos</h4>
                                <ul class="details-list">${riesgosHtml || '<li>No se completó.</li>'}</ul>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary modal-close-btn">Cerrar</button>
                    </div>
                </div>
            </div>
        `;

        // Usamos querySelectorAll para encontrar TODOS los botones con esa clase
        modalContainer.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
        modalContainer.querySelector('.modal-overlay').classList.remove('visible');
    });
    });
    } catch (error) {
        console.error("Error al abrir los detalles del viaje:", error);
        modalContainer.innerHTML = `<div class="modal-overlay visible"><div class="modal"><div class="modal-body"><p>Error al cargar los detalles: ${error.message}</p><button class="modal-close-btn">Cerrar</button></div></div></div>`;
        modalContainer.querySelector('.modal-close-btn').addEventListener('click', () => modalContainer.querySelector('.modal-overlay').classList.remove('visible'));
    }
}



/**
 * Maneja el envío del nuevo formulario de viaje detallado.
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
 * Inicializa la vista del chofer, mostrando sus viajes asignados
 * y los botones de acción correspondientes a cada estado.
 */
/**
 * Inicializa la vista del chofer, mostrando tarjetas de viaje detalladas
 * con toda la información relevante y los botones de acción.
 */
async function initChoferView() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    document.getElementById('user-info-chofer').textContent = `Conectado como: ${user.nombre}`;

    // Configurar el botón de logout
    document.getElementById('logoutBtn-chofer').addEventListener('click', () => {
        sessionStorage.removeItem('user');
        window.location.hash = '/';
    });

    const tripListContainer = document.getElementById('chofer-trip-list');
    tripListContainer.innerHTML = '<p>Cargando viajes...</p>';

    const [viajes, clientes, vehiculos] = await Promise.all([
        callApi('getRecords', { sheetName: 'Viajes' }),
        callApi('getRecords', { sheetName: 'Clientes' }),
        callApi('getRecords', { sheetName: 'Vehiculos' })
    ]);

    if (!viajes || !clientes || !vehiculos) {
        tripListContainer.innerHTML = '<p>No se pudieron cargar los viajes. Intenta de nuevo más tarde.</p>';
        return;
    }

    const clientesMap = new Map(clientes.map(c => [c.ID, c.RazonSocial]));

    const misViajes = viajes.filter(v => 
        v.ChoferID === user.choferId && ['Aprobado', 'En curso', 'Finalizado'].includes(v.Estado)
    ).sort((a, b) => {
        const order = { 'En curso': 1, 'Aprobado': 2, 'Finalizado': 3 };
        return (order[a.Estado] || 99) - (order[b.Estado] || 99);
    });

    if (misViajes.length === 0) {
        tripListContainer.innerHTML = '<div class="no-trips-card"><p>No tienes viajes asignados actualmente.</p></div>';
        return;
    }

    tripListContainer.innerHTML = misViajes.map(viaje => {
        let actionButton = '';
        if (viaje.Estado === 'Aprobado') {
            actionButton = `<button class="btn-start" data-id="${viaje.ID}">▶ Iniciar Viaje</button>`;
        } else if (viaje.Estado === 'En curso') {
            actionButton = `<button class="btn-end" data-id="${viaje.ID}">⏹ Finalizar Viaje</button>`;
        } else if (viaje.Estado === 'Finalizado') {
            actionButton = `<button class="btn-pdf" data-id="${viaje.ID}">📄 Descargar Constancia</button>`;
        }

        const vehiculoInfo = vehiculos.find(v => v.ID === viaje.VehiculoID);

        return `
            <div class="trip-card-detailed status-${viaje.Estado.toLowerCase()}">
                <div class="trip-card-header">
                    <h3>${clientesMap.get(viaje.ClienteID) || 'Cliente no encontrado'}</h3>
                    <span class="status ${viaje.Estado.toLowerCase()}">${viaje.Estado}</span>
                </div>
                <div class="trip-card-body">
                    <div class="trip-info-grid">
                        <div><strong>Origen:</strong> <p>${viaje.Origen}</p></div>
                        <div><strong>Destino:</strong> <p>${viaje.Destino}</p></div>
                        <div><strong>Fecha Inicio:</strong> <p>${new Date(viaje.FechaHoraSalida).toLocaleString()}</p></div>
                        <div><strong>Fecha Fin Est.:</strong> <p>${new Date(viaje.FechaHoraFinEstimada).toLocaleString()}</p></div>
                        <div class="full-width"><strong>Propósito:</strong> <p>${viaje.Proposito || 'N/A'}</p></div>
                        <div class="full-width"><strong>Vehículo:</strong> <p>${vehiculoInfo ? `${vehiculoInfo.Patente} - ${vehiculoInfo.Marca} ${vehiculoInfo.Modelo}` : 'N/A'}</p></div>
                        <div class="full-width"><strong>Ruta Detallada:</strong> <p>${viaje.RutaDetallada || 'Seguir ruta sugerida por GPS.'}</p></div>
                    </div>
                </div>
                <div class="trip-card-footer-chofer">
                    <button class="btn-map btn-open-gmaps" data-origen="${viaje.Origen}" data-destino="${viaje.Destino}">
                        🗺️ Abrir Mapa
                    </button>
                    ${actionButton}
                </div>
            </div>
        `;
    }).join('');

    tripListContainer.removeEventListener('click', handleChoferActions);
    tripListContainer.addEventListener('click', handleChoferActions);
}


/**
 * Manejador para los botones de la vista del chofer.
 */
/**async function handleChoferActions(event) {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    const startButton = event.target.closest('.btn-start');
    const endButton = event.target.closest('.btn-end');
    const card = event.target.closest('.trip-card');

    // --- Lógica para el botón INICIAR ---
    if (startButton) {
        const tripId = startButton.dataset.id;
        if (!confirm(`¿Estás seguro de que quieres iniciar este viaje?`)) return;

        try {
            alert("Obteniendo tu ubicación... por favor, acepta la solicitud del navegador.");
            const location = await getCurrentLocation();
            
            const result = await callApi('logTripEvent', {
                viajeId: tripId,
                choferId: user.choferId,
                tipoLog: 'INICIO', // Usamos el valor directamente
                ubicacion: location
            });

            if (result) {
                alert(result);
                initChoferView(); // Recargar la lista de viajes
            }
        } catch (error) {
            alert(`Error: ${error}`);
        }
        return; // Detenemos la ejecución para no activar el clic de la tarjeta
    }

    // --- Lógica para el botón FINALIZAR ---
    if (endButton) {
        const tripId = endButton.dataset.id;
        openSignatureModal(tripId);
        return; // Detenemos la ejecución
    }

    // --- Lógica para el clic en la TARJETA ---
    if (card) {
        const tripId = card.dataset.id;
        openTripDetailsModal(tripId);
    }

    const pdfButton = event.target.closest('.btn-pdf');
    if (pdfButton) {
        const tripId = pdfButton.dataset.id;
        generateTripPDF(tripId);
        return; // Detenemos la ejecución
    }
}

// Archivo: main.js -> REEMPLAZA ESTA FUNCIÓN

/**
 * Manejador central de clics para la vista del chofer, adaptado a las tarjetas detalladas.
 * @param {Event} event El objeto del evento de clic.
 */


// Archivo: main.js -> REEMPLAZA ESTA FUNCIÓN

/**
 * Manejador central de clics para la vista del chofer, adaptado a las tarjetas detalladas.
 * @param {Event} event El objeto del evento de clic.
 */
async function handleChoferActions(event) {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    // Identificamos en qué botón específico se hizo clic
    const startButton = event.target.closest('.btn-start');
    const endButton = event.target.closest('.btn-end');
    const pdfButton = event.target.closest('.btn-pdf');
    const gmapsButton = event.target.closest('.btn-open-gmaps');

    // --- Lógica para el botón INICIAR ---
    if (startButton) {
        const tripId = startButton.dataset.id;
        if (!confirm(`¿Estás seguro de que quieres iniciar este viaje?`)) return;
        try {
            alert("Obteniendo tu ubicación...");
            const location = await getCurrentLocation();
            const result = await callApi('logTripEvent', { viajeId: tripId, choferId: user.choferId, tipoLog: 'INICIO', ubicacion: location });
            if (result) { alert(result); initChoferView(); }
        } catch (error) { alert(`Error: ${error}`); }
        return;
    }

    // --- Lógica para el botón FINALIZAR ---
    if (endButton) {
        const tripId = endButton.dataset.id;
        openSignatureModal(tripId);
        return;
    }

    // --- Lógica para el botón PDF ---
    if (pdfButton) {
        const tripId = pdfButton.dataset.id;
        generateTripPDF(tripId);
        return;
    }
    
    // --- Lógica para el botón GOOGLE MAPS ---
    if (gmapsButton) {
        const origen = gmapsButton.dataset.origen;
        const destino = gmapsButton.dataset.destino;
        const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origen)}&destination=${encodeURIComponent(destino)}`;
        window.open(gmapsUrl, '_blank');
        return;
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

        // --- HTML DE LA FILA A REEMPLAZAR (CON SVG COMPLETOS) ---
        row.innerHTML = `
            <td data-label="Nombre">${user.Nombre}</td>
            <td data-label="Email">${user.Email}</td>
            <td data-label="Rol">${user.Rol}</td>
            <td data-label="Estado"><span class="status ${estadoClass}">${estadoText}</span></td>
            <td data-label="Acciones" class="actions">
                <button class="btn-icon edit btn-edit-usuario" data-id="${user.ID}" title="Editar Usuario">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
                        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                    </svg>
                </button>
                <button class="btn-icon delete btn-delete-usuario" data-id="${user.ID}" title="Eliminar Usuario">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                </button>
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
        // --- HTML CON ATRIBUTOS DE DATOS AÑADIDOS ---
        row.innerHTML = `
            <td data-label="Nombre">${chofer.Nombre}</td>
            <td data-label="DNI">${chofer.DNI}</td>
            <td data-label="Licencia">${chofer.Licencia}</td>
            <td data-label="Vencimiento">${chofer.VencimientoLicencia ? new Date(chofer.VencimientoLicencia).toLocaleDateString() : ''}</td>
            <td data-label="Teléfono">${chofer.Telefono}</td>
            <td data-label="Estado"><span class="status ${estadoClass}">${chofer.Estado}</span></td>
            <td data-label="Acciones" class="actions">
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
            <td>${cliente.Email || 'N/A'}</td>    
            <td>${cliente.Telefono || 'N/A'}</td> 
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
        <div class="modal-overlay visible"><div class="modal modal-lg">
            <div class="modal-header"><h3>${isEditing ? 'Editar' : 'Crear'} Cliente</h3><button class="modal-close-btn">&times;</button></div>
            <form id="form-cliente">
                <input type="hidden" id="clienteId" value="${clienteData.ID || ''}">
                <div class="modal-body"><div class="form-grid">
                    <div class="form-group"><label for="razonSocial">Razón Social / Nombre</label><input type="text" id="razonSocial" required value="${clienteData.RazonSocial || ''}"></div>
                    <div class="form-group"><label for="cuitDni">CUIT / DNI</label><input type="text" id="cuitDni" required value="${clienteData.CUIT_DNI || ''}"></div>
                    <div class="form-group"><label for="direccion">Dirección</label><input type="text" id="direccion" value="${clienteData.Direccion || ''}"></div>
                    <div class="form-group"><label for="contacto">Persona de Contacto</label><input type="text" id="contacto" value="${clienteData.Contacto || ''}"></div>
                    <div class="form-group"><label>Email</label><input type="email" id="email" value="${clienteData.Email || ''}"></div>
                    <div class="form-group"><label>Teléfono</label><input type="tel" id="telefono" value="${clienteData.Telefono || ''}"></div>
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
        Email: document.getElementById('email').value,         // Campo Añadido
        Telefono: document.getElementById('telefono').value,   // Campo Añadido
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
/**
 * Recopila todos los datos de un viaje y genera un PDF de constancia.
 * @param {string} tripId - El ID del viaje para el cual generar el PDF.
 */
async function generateTripPDF(tripId) {
    alert("Generando PDF... por favor espera.");
    const { jsPDF } = window.jspdf;

    try {
        // 1. Recopilar todos los datos necesarios en paralelo
        const [viajes, clientes, choferes, vehiculos, firmas, logs] = await Promise.all([
            callApi('getRecords', { sheetName: 'Viajes' }),
            callApi('getRecords', { sheetName: 'Clientes' }),
            callApi('getRecords', { sheetName: 'Choferes' }),
            callApi('getRecords', { sheetName: 'Vehiculos' }),
            callApi('getRecords', { sheetName: 'Firmas' }),
            callApi('getRecords', { sheetName: 'LogsViajes' })
        ]);

        // 2. Encontrar los registros específicos para nuestro viaje
        const viaje = viajes.find(v => v.ID === tripId);
        const cliente = clientes.find(c => c.ID === viaje.ClienteID);
        const chofer = choferes.find(ch => ch.ID === viaje.ChoferID);
        const vehiculo = vehiculos.find(v => v.ID === viaje.VehiculoID);
        const firma = firmas.find(f => f.ViajeID === tripId);
        const logInicio = logs.find(l => l.ViajeID === tripId && l.TipoLog === 'INICIO');
        const logFin = logs.find(l => l.ViajeID === tripId && l.TipoLog === 'FIN');

        // 3. Crear el documento PDF
        const doc = new jsPDF();
        let y = 20; // Posición vertical inicial

        // Encabezado
        doc.setFontSize(22);
        doc.text("Constancia de Viaje Finalizado", 105, y, { align: 'center' });
        y += 15;
        
        // Datos del Viaje
        doc.setFontSize(12);
        doc.text(`ID del Viaje: ${viaje.ID}`, 15, y);
        y += 10;
        doc.text(`Cliente: ${cliente.RazonSocial}`, 15, y);
        y += 7;
        doc.text(`Origen: ${viaje.Origen}`, 15, y);
        y += 7;
        doc.text(`Destino: ${viaje.Destino}`, 15, y);
        y += 15;

        // Datos del Chofer y Vehículo
        doc.setFontSize(16);
        doc.text("Detalles de la Operación", 15, y);
        y += 10;
        doc.setFontSize(12);
        doc.text(`Chofer: ${chofer.Nombre} (Licencia: ${chofer.Licencia})`, 15, y);
        y += 7;
        doc.text(`Vehículo: ${vehiculo.Marca} ${vehiculo.Modelo} (Patente: ${vehiculo.Patente})`, 15, y);
        y += 15;
        
        // Logs de Inicio y Fin
        doc.setFontSize(16);
        doc.text("Registro de Eventos", 15, y);
        y += 10;
        doc.setFontSize(12);
        doc.text(`Inicio: ${logInicio ? new Date(logInicio.FechaHora).toLocaleString() : 'N/A'}`, 15, y);
        y += 7;
        doc.text(`Fin: ${logFin ? new Date(logFin.FechaHora).toLocaleString() : 'N/A'}`, 15, y);
        y += 15;
        
        // Firma Digital
        if (firma && firma.FirmaBase64) {
            doc.setFontSize(16);
            doc.text("Firma del Chofer", 15, y);
            y += 5;
            // Añadimos la imagen de la firma (Base64) al PDF
            doc.addImage(firma.FirmaBase64, 'PNG', 15, y, 80, 40); // x, y, ancho, alto
        }

        // 4. Guardar el PDF
        doc.save(`Constancia-Viaje-${viaje.ID.substring(0, 8)}.pdf`);

    } catch (error) {
        console.error("Error al generar el PDF:", error);
        alert("Hubo un error al generar el PDF. Revisa la consola para más detalles.");
    }
}
/**
 * Carga los datos y renderiza el tablero de control principal.
 */
async function loadDashboardView() {
    const data = await callApi('getDashboardData');
    if (!data) {
        document.getElementById('view-content').innerHTML = '<p>No se pudieron cargar los datos del dashboard.</p>';
        return;
    }

    renderKPIs(data.kpis);
    renderRiesgoChart(data.chartData.riesgos);
    renderAlerts(data.alertas);
}

/**
 * Rellena las tarjetas de KPIs con los datos.
 */
function renderKPIs(kpis) {
    document.getElementById('kpi-total').textContent = kpis.total;
    document.getElementById('kpi-pendiente').textContent = kpis.pendiente;
    document.getElementById('kpi-en-curso').textContent = kpis.en_curso;
    document.getElementById('kpi-finalizado').textContent = kpis.finalizado;
}

/**
 * Dibuja el gráfico de torta de riesgos usando Chart.js.
 */
function renderRiesgoChart(riesgos) {
    const ctx = document.getElementById('riesgo-chart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Bajo', 'Medio', 'Alto'],
            datasets: [{
                label: 'Viajes por Riesgo',
                data: [riesgos.Bajo, riesgos.Medio, riesgos.Alto],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(255, 99, 132, 0.7)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

/**
 * Rellena la sección de alertas de vencimiento.
 */
function renderAlerts(alertas) {
    const renderList = (listId, items) => {
        const ul = document.getElementById(listId);
        ul.innerHTML = '';
        if (items.length === 0) {
            ul.innerHTML = '<li>No hay vencimientos próximos.</li>';
            return;
        }
        items.forEach(item => {
            const li = document.createElement('li');
            const diasClass = item.dias < 0 ? 'vencido' : 'por-vencer';
            const diasTexto = item.dias < 0 ? `(Venció hace ${-item.dias} días)` : `(Vence en ${item.dias} días)`;
            li.innerHTML = `<strong>${item.nombre}</strong> - ${item.fecha} <span class="${diasClass}">${diasTexto}</span>`;
            ul.appendChild(li);
        });
    };

    renderList('licencias-list', alertas.licencias);
    renderList('vtvs-list', alertas.vtvs);
    renderList('seguros-list', alertas.seguros);
}
/**
 * Maneja el envío del formulario de viaje, ya sea para crear uno nuevo o para actualizar uno existente.
 */
async function handleViajeFormSubmit(e) {
    e.preventDefault();
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    // Detectamos si estamos en modo edición por el ID oculto
    const tripId = document.getElementById('tripId').value;
    const isEditing = Boolean(tripId);

    // 1. Recolectar datos básicos
    const viajeData = {
        ClienteID: document.getElementById('cliente').value,
        ChoferID: document.getElementById('chofer').value,
        VehiculoID: document.getElementById('vehiculo').value,
        Origen: document.getElementById('origen').value,
        Destino: document.getElementById('destino').value,
        FechaHoraSalida: document.getElementById('fechaSalida').value,
        FechaHoraFinEstimada: document.getElementById('fechaFin').value,
        HorasTrabajoPrevias: document.getElementById('horasTrabajo').value,
        Proposito: document.getElementById('proposito').value,
        RutaDetallada: document.getElementById('ruta').value,
        // Al editar un viaje, su estado siempre vuelve a "Pendiente" para una nueva aprobación.
        //Estado: 'Pendiente'
    };
    
    // 2. Recolectar checklist de seguridad
    const checklistSeguridad = {};
    document.querySelectorAll('.security-checklist input:checked').forEach(input => {
        checklistSeguridad[input.value] = true;
    });
    viajeData.ChecklistSeguridad = checklistSeguridad;

    // 3. Recolectar respuestas y calcular puntaje de riesgo
    const respuestasRiesgos = {};
    let puntajeTotal = 0;
    const gruposRiesgo = document.querySelectorAll('.riesgo-group');
    gruposRiesgo.forEach(grupo => {
        const checkedInput = grupo.querySelector('input[type="radio"]:checked');
        if (checkedInput) {
            const groupName = checkedInput.name;
            const points = parseInt(checkedInput.dataset.points, 10);
            const valueText = checkedInput.parentElement.textContent.replace(/\s?\d+pts\s?/, '').trim();
            respuestasRiesgos[groupName] = { valor: valueText, puntos: points };
            puntajeTotal += points;
        }
    });
    viajeData.RespuestasRiesgos = respuestasRiesgos;
    viajeData.PuntajeRiesgo = puntajeTotal;

    // 4. Determinar Nivel de Riesgo basado en el puntaje
    if (puntajeTotal >= 19) {
        viajeData.RiesgoCalculado = 'Alto';
    } else if (puntajeTotal >= 13) {
        viajeData.RiesgoCalculado = 'Medio';
    } else {
        viajeData.RiesgoCalculado = 'Bajo';
    }
    
    // 5. Enviar a la API (Crear o Actualizar)
    let result;
    if (isEditing) {
        // Al editar, NO actualizamos el creador ni la fecha de creación
        result = await callApi('updateRecord', {
            sheetName: 'Viajes',
            id: tripId,
            data: viajeData
        });
    } else {
        // Añadimos la información de auditoría solo al crear
        viajeData.UsuarioCreadorID = user.id;
        result = await callApi('createRecord', {
            sheetName: 'Viajes',
            data: viajeData
        });
    }

    if (result) {
        alert(`Viaje ${isEditing ? 'actualizado' : 'creado'} exitosamente. Puntaje: ${puntajeTotal}. Nivel de riesgo: ${viajeData.RiesgoCalculado}`);
        document.querySelector('.modal-overlay').classList.remove('visible');
        initViajesView(); // Recargar la tabla
    }
}