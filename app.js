// === CONFIGURACIÓN ===
// Pega aquí la URL de la API que implementaste en Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbwAOY7JXi1EAso_zj-WJ9zqupHX8NkPcf9iHnYxixiwT5XHIDJy75I8xBzH_04R6u7n/exec";

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
    console.log("App iniciada.");
    initializeUserModule();
});

// === MÓDULO DE USUARIOS ===
function initializeUserModule() {
    document.getElementById('rol').addEventListener('change', toggleDriverFields);
    document.getElementById('userForm').addEventListener('submit', handleUserFormSubmit);
    loadUsers();
}

async function loadUsers() {
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
    try {
        const response = await fetch(`${API_URL}?action=getUsers`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const users = await response.json();
        
        const tableContent = users.map(user => `
            <tr>
                <td>${user.Apellido_Nombre || ''}</td>
                <td>${user.Email || ''}</td>
                <td>${user.Rol || ''}</td>
                <td>${user.Activo ? 'Sí' : 'No'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" disabled>Editar</button>
                    <button class="btn btn-sm btn-danger" disabled>Eliminar</button>
                </td>
            </tr>
        `).join('');
        
        tableBody.innerHTML = tableContent || '<tr><td colspan="5" class="text-center">No hay usuarios.</td></tr>';
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar datos.</td></tr>';
    }
}

async function handleUserFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Guardando...`;

    const userInfo = {
        nombre: form.nombre.value,
        apellido: form.apellido.value,
        email: form.email.value,
        password: form.password.value,
        rol: form.rol.value,
        licencia: form.licencia.value,
        dni: form.dni.value,
        supervisor: form.supervisor.value
    };

    // Esta es la URL a la que se enviarán los datos.
    // Apps Script maneja las redirecciones, por lo que una simple llamada POST funciona.
    const final_url = API_URL;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            // quitamos mode: 'no-cors'
            // redirect: 'follow' puede volver a usarse
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'createUser', payload: userInfo })
        });

        const result = await response.json(); // ¡Ahora podemos leer la respuesta!
        
        if (result.status === 'success') {
            alert(result.message);
            // ...
        } else {
            throw new Error(result.message);
        }
        
        
        alert("Usuario enviado para creación. Refrescando la lista...");
        form.reset();
        toggleDriverFields();
        loadUsers();

    } catch (error) {
        console.error("Error al crear usuario (fetch):", error);
        alert(`Error: Falló la comunicación con el servidor. ${error.message}`);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Guardar Usuario';
    }
}

function toggleDriverFields() {
    const driverFields = document.querySelector('#userForm .driver-fields');
    const rol = document.getElementById('rol').value;
    driverFields.style.display = (rol === 'Chofer') ? 'block' : 'none';
}