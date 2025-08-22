// ** CONFIGURACIÓN CLAVE **
// Reemplaza esta variable con la URL que obtuviste de tu despliegue de Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbz4pq4k_dOuBxJSixXXbC_Rg7Wt0o1kdUY54CdDsuY0u41ghL4Ov00_OZhzRDvU71zXeg/exec"; 

// --- FUNCIÓN PARA CARGAR Y MOSTRAR LOS VIAJES ---
async function cargarViajes() {
    const listaViajesDiv = document.getElementById('listaViajes');
    listaViajesDiv.innerHTML = '<p>Cargando viajes...</p>'; // Mensaje de carga

    try {
        const response = await fetch(API_URL); // Por defecto, fetch hace una petición GET
        const viajes = await response.json();

        listaViajesDiv.innerHTML = ''; // Limpiamos el mensaje de carga

        if (viajes.length === 0) {
            listaViajesDiv.innerHTML = '<p>No hay viajes registrados.</p>';
            return;
        }

        // Creamos una tabla para mostrar los viajes de forma ordenada
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID Viaje</th>
                    <th>Origen</th>
                    <th>Destino</th>
                    <th>Conductor</th>
                    <th>Vehículo</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        const tbody = table.querySelector('tbody');

        // Por cada viaje, creamos una fila en la tabla
        viajes.forEach(viaje => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${viaje.id}</td>
                <td>${viaje.origen}</td>
                <td>${viaje.destino}</td>
                <td>${viaje.conductor}</td>
                <td>${viaje.vehiculo}</td>
                <td>${viaje.estado}</td>
            `;
            tbody.appendChild(tr);
        });

        listaViajesDiv.appendChild(table);

    } catch (error) {
        console.error('Error al cargar los viajes:', error);
        listaViajesDiv.innerHTML = '<p>❌ Error al cargar los viajes. Revisa la consola.</p>';
    }
}


// --- CÓDIGO QUE SE EJECUTA CUANDO LA PÁGINA CARGA ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar la lista de viajes existentes al abrir la página
    cargarViajes();

    // 2. Configurar el formulario para añadir nuevos viajes
    const form = document.getElementById('viajeForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Guardando...';

        const formData = new FormData(form);
        const data = new URLSearchParams(formData).toString();
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: data,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const result = await response.json();

            if (result.status === 'success') {
                alert('✅ Viaje registrado con éxito. ID: ' + result.id);
                form.reset();
                cargarViajes(); // ¡Recargamos la lista de viajes después de añadir uno nuevo!
            } else {
                alert('❌ Error al registrar el viaje: ' + result.message);
            }

        } catch (error) {
            console.error('Error en la conexión o procesamiento:', error);
            alert('Hubo un problema de conexión. Revisa la consola o la URL de la API.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Guardar Viaje';
        }
    });
});