// ** CONFIGURACIÓN CLAVE **
// Reemplaza esta variable con la URL que obtuviste de tu despliegue de Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbz4pq4k_dOuBxJSixXXbC_Rg7Wt0o1kdUY54CdDsuY0u41ghL4Ov00_OZhzRDvU71zXeg/exec"; 

// --- LÓGICA DE NAVEGACIÓN POR PESTAÑAS ---
const tabListado = document.getElementById('tabListado');
const tabCrear = document.getElementById('tabCrear');
const seccionListado = document.getElementById('listadoViajesSection');
const seccionCrear = document.getElementById('crearViajeSection');

function cambiarVista(vista) {
    if (vista === 'crear') {
        seccionListado.classList.add('hidden');
        seccionCrear.classList.remove('hidden');
        tabListado.classList.remove('active');
        tabCrear.classList.add('active');
    } else { // 'listado'
        seccionCrear.classList.add('hidden');
        seccionListado.classList.remove('hidden');
        tabCrear.classList.remove('active');
        tabListado.classList.add('active');
    }
}

tabListado.addEventListener('click', () => cambiarVista('listado'));
tabCrear.addEventListener('click', () => cambiarVista('crear'));

// --- FUNCIÓN PARA CARGAR Y MOSTRAR LOS VIAJES ---
async function cargarViajes() {
    const listaViajesDiv = document.getElementById('listaViajes');
    listaViajesDiv.innerHTML = '<p>Cargando viajes...</p>';

    try {
        const response = await fetch(API_URL);
        const viajes = await response.json();
        listaViajesDiv.innerHTML = '';

        if (viajes.length === 0) {
            listaViajesDiv.innerHTML = '<p>No hay viajes registrados.</p>';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th><th>Origen</th><th>Destino</th>
                    <th>Conductor</th><th>Vehículo</th><th>Estado</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');

        viajes.forEach(viaje => {
            // Lógica para asignar clase a la píldora de estado
            let statusClass = 'status-programado'; // Por defecto
            if (viaje.estado.toLowerCase().includes('aprobado')) statusClass = 'status-aprobado';
            if (viaje.estado.toLowerCase().includes('rechazado')) statusClass = 'status-rechazado';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${viaje.id}</td>
                <td>${viaje.origen}</td>
                <td>${viaje.destino}</td>
                <td>${viaje.conductor}</td>
                <td>${viaje.vehiculo}</td>
                <td><span class="status-badge ${statusClass}">${viaje.estado}</span></td>
            `;
            tbody.appendChild(tr);
        });

        listaViajesDiv.appendChild(table);

    } catch (error) {
        console.error('Error al cargar los viajes:', error);
        listaViajesDiv.innerHTML = '<p>❌ Error al cargar los viajes.</p>';
    }
}

// --- CÓDIGO INICIAL Y MANEJO DEL FORMULARIO ---
document.addEventListener('DOMContentLoaded', () => {
    cargarViajes();

    const form = document.getElementById('viajeForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';

        const data = new URLSearchParams(new FormData(form)).toString();
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: data,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            const result = await response.json();

            if (result.status === 'success') {
                alert('✅ Viaje registrado con éxito.');
                form.reset();
                cambiarVista('listado'); // Cambiamos a la vista de listado
                cargarViajes();        // Y recargamos los viajes
            } else {
                alert('❌ Error: ' + result.message);
            }
        } catch (error) {
            alert('Hubo un problema de conexión.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Guardar Viaje';
        }
    });
});