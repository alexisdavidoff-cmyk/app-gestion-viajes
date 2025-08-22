// ** CONFIGURACIÓN CLAVE **
// Reemplaza esta variable con la URL que obtuviste de tu despliegue de Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbz4pq4k_dOuBxJSixXXbC_Rg7Wt0o1kdUY54CdDsuY0u41ghL4Ov00_OZhzRDvU71zXeg/exec"; 

// =================================================================
//          MANEJO DE VISTAS Y NAVEGACIÓN PRINCIPAL
// =================================================================

// Referencias a los contenedores de las vistas principales
const vistaViajes = document.getElementById('gestionViajesView');
const vistaUsuarios = document.getElementById('gestionUsuariosView');
// (Añadiremos más vistas aquí en el futuro)

// Referencias a los enlaces de navegación
const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');

function cambiarVistaPrincipal(vistaId) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view-container').forEach(view => view.classList.add('hidden'));
    
    // Quitar la clase 'active' de todos los enlaces
    navLinks.forEach(link => link.classList.remove('active'));

    // Mostrar la vista seleccionada y activar el enlace correspondiente
    const vistaActiva = document.getElementById(vistaId);
    if (vistaActiva) {
        vistaActiva.classList.remove('hidden');
        // Buscar el enlace que corresponde a esta vista y activarlo
        document.querySelector(`[data-view="${vistaId}"]`).classList.add('active');
    }
}

// Añadimos un atributo 'data-view' a cada enlace en el HTML para que esto funcione
// Lo haremos en el siguiente paso. Por ahora, preparamos el JS.

// =================================================================
//          LÓGICA ESPECÍFICA DE LA VISTA DE VIAJES
// =================================================================

const tabListado = document.getElementById('tabListado');
const tabCrear = document.getElementById('tabCrear');
const seccionListado = document.getElementById('listadoViajesSection');
const seccionCrear = document.getElementById('crearViajeSection');

function cambiarSubVistaViajes(vista) {
    // (Esta función ahora solo gestiona las pestañas DENTRO de la vista de viajes)
    if (vista === 'crear') {
        seccionListado.classList.add('hidden');
        seccionCrear.classList.remove('hidden');
        tabListado.classList.remove('active');
        tabCrear.classList.add('active');
    } else {
        seccionCrear.classList.add('hidden');
        seccionListado.classList.remove('hidden');
        tabCrear.classList.remove('active');
        tabListado.classList.add('active');
    }
}
tabListado.addEventListener('click', () => cambiarSubVistaViajes('listado'));
tabCrear.addEventListener('click', () => cambiarSubVistaViajes('crear'));

async function cargarConductores() { /* ...código sin cambios... */ }
async function cargarVehiculos() { /* ...código sin cambios... */ }
async function cargarViajes() { /* ...código sin cambios... */ }

// (Copia y pega aquí tus funciones existentes: cargarConductores, cargarVehiculos, cargarViajes)
// Para evitar errores, aquí te las pongo de nuevo:
async function cargarConductores() {const select=document.getElementById('conductor');try{const response=await fetch(`${API_URL}?action=getConductores`);const conductores=await response.json();select.innerHTML='<option value="" disabled selected>Seleccione un conductor</option>';conductores.forEach(conductor=>{const option=document.createElement('option');option.value=conductor.id;option.textContent=conductor.nombre;select.appendChild(option);});}catch(error){console.error('Error al cargar conductores:',error);select.innerHTML='<option value="">Error al cargar</option>';}}
async function cargarVehiculos() {const select=document.getElementById('vehiculo');try{const response=await fetch(`${API_URL}?action=getVehiculos`);const vehiculos=await response.json();select.innerHTML='<option value="" disabled selected>Seleccione un vehículo</option>';vehiculos.forEach(vehiculo=>{const option=document.createElement('option');option.value=vehiculo.id;option.textContent=`${vehiculo.descripcion} (${vehiculo.id})`;select.appendChild(option);});}catch(error){console.error('Error al cargar vehículos:',error);select.innerHTML='<option value="">Error al cargar</option>';}}
async function cargarViajes() {const listaViajesDiv=document.getElementById('listaViajes');listaViajesDiv.innerHTML='<p>Cargando viajes...</p>';try{const response=await fetch(`${API_URL}?action=getViajes`);const viajes=await response.json();listaViajesDiv.innerHTML='';if(viajes.length===0){listaViajesDiv.innerHTML='<p>No hay viajes registrados.</p>';return;}const table=document.createElement('table');table.innerHTML=`<thead><tr><th>ID</th><th>Origen</th><th>Destino</th><th>Conductor</th><th>Vehículo</th><th>Estado</th></tr></thead><tbody></tbody>`;const tbody=table.querySelector('tbody');viajes.forEach(viaje=>{let statusClass='status-programado';if(String(viaje.estado).toLowerCase().includes('aprobado'))statusClass='status-aprobado';if(String(viaje.estado).toLowerCase().includes('rechazado'))statusClass='status-rechazado';const tr=document.createElement('tr');tr.innerHTML=`<td>${viaje.id}</td><td>${viaje.origen}</td><td>${viaje.destino}</td><td>${viaje.conductor}</td><td>${viaje.vehiculo}</td><td><span class="status-badge ${statusClass}">${viaje.estado}</span></td>`;tbody.appendChild(tr);});listaViajesDiv.appendChild(table);}catch(error){console.error('Error al cargar los viajes:',error);listaViajesDiv.innerHTML='<p>❌ Error al cargar los viajes.</p>';}}


// =================================================================
//          LÓGICA ESPECÍFICA DE LA VISTA DE USUARIOS
// =================================================================

const btnAnadirUsuario = document.getElementById('btnAnadirUsuario');

function cargarUsuarios() {
    console.log("Cargando la lista de usuarios...");
    const listaUsuariosDiv = document.getElementById('listaUsuarios');
    listaUsuariosDiv.innerHTML = "<p>La funcionalidad para mostrar usuarios se implementará a continuación.</p>";
    // Aquí llamaremos a la API para obtener y mostrar los usuarios
}

btnAnadirUsuario.addEventListener('click', () => {
    alert("Próximamente: formulario para añadir un nuevo usuario.");
});

// =================================================================
//          INICIALIZACIÓN DE LA APLICACIÓN
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Configurar los listeners de navegación principal
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Evitar que el enlace recargue la página
            const targetView = link.getAttribute('data-view');
            cambiarVistaPrincipal(targetView);

            // Cargar datos específicos de la vista cuando se cambia a ella
            if (targetView === 'gestionUsuariosView') {
                cargarUsuarios();
            }
        });
    });

    // 2. Cargar los datos iniciales de la primera vista (Viajes)
    cargarViajes();
    cargarConductores();
    cargarVehiculos();

    // 3. Configurar el formulario de creación de viajes
    const form = document.getElementById('viajeForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';
        const data = new URLSearchParams(new FormData(form)).toString();
        try {
            const response = await fetch(API_URL, { method: 'POST', body: data, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
            const result = await response.json();
            if (result.status === 'success') {
                alert('✅ Viaje registrado con éxito.');
                form.reset();
                cambiarSubVistaViajes('listado');
                cargarViajes();
            } else { alert('❌ Error: ' + result.message); }
        } catch (error) { alert('Hubo un problema de conexión.'); } 
        finally { submitButton.disabled = false; submitButton.textContent = 'Guardar Viaje'; }
    });

    // 4. Establecer la vista inicial
    cambiarVistaPrincipal('gestionViajesView');
});