/**
 * @file app.js
 * @description Lógica principal del frontend para la aplicación JMP.
 */

// === CONFIGURACIÓN ===
// Pega aquí la URL de la API que implementaste en Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbxadib32HzW41TbuHciSIgqQuHokCyx8e50DLDEMQE2KDVKeVWAUx8KBO1FUNleU0Nz/exec";


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
        if (!response.ok) throw new Error(`Error de red! Estado: ${response.status}`);
        const result = await response.json();
        
        if (result.status === 'error') throw new Error(result.message);
        const users = result;
        
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
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error al cargar datos: ${error.message}</td></tr>`;
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

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            // redirect: 'follow' es importante para que fetch siga la redirección de Google
            redirect: 'follow', 
            headers: {
                // Usamos text/plain para evitar un "preflight" de CORS, es más simple
                'Content-Type': 'text/plain;charset=utf-8', 
            },
            // El cuerpo sigue siendo un string JSON
            body: JSON.stringify({ action: 'createUser', payload: userInfo })
        });
        
        // La respuesta final de una redirección seguida es un JSON
        const result = await response.json();

        if (result.status === 'success') {
            alert(result.message);
            form.reset();
            toggleDriverFields();
            loadUsers();
        } else {
            // Si el backend devolvió un error, lo mostramos
            throw new Error(result.message);
        }

    } catch (error) {
        console.error("Error al crear usuario:", error);
        alert(`Error: ${error.message}`);
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