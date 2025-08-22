/**
 * @file app.js
 * @description Lógica principal del frontend para la aplicación JMP.
 */

// === CONFIGURACIÓN ===
// Pega aquí la URL de la API que implementaste en Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbxadib32HzW41TbuHciSIgqQuHokCyx8e50DLDEMQE2KDVKeVWAUx8KBO1FUNleU0Nz/exec";

// === VARIABLES GLOBALES ===
let allUsers = []; // Guardaremos una copia local de los usuarios para la función de editar

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
    console.log("App iniciada.");
    initializeUserModule();
});


// === MÓDULO DE USUARIOS ===
function initializeUserModule() {
    // Listeners de eventos
    document.getElementById('rol').addEventListener('change', toggleDriverFields);
    document.getElementById('userForm').addEventListener('submit', handleUserFormSubmit);
    
    // Carga inicial de datos
    loadUsers();
}

/**
 * Carga la lista de usuarios desde la API y la renderiza en la tabla.
 */
async function loadUsers() {
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
    try {
        const response = await fetch(`${API_URL}?action=getUsers`);
        if (!response.ok) throw new Error(`Error de red! Estado: ${response.status}`);
        const result = await response.json();
        
        if (result.status === 'error') throw new Error(result.message);
        
        allUsers = result; // Guardar la lista de usuarios globalmente
        
        const tableContent = allUsers.map(user => `
            <tr>
                <td>${user.Apellido_Nombre || ''}</td>
                <td>${user.Email || ''}</td>
                <td>${user.Rol || ''}</td>
                <td><span class="badge ${user.Activo ? 'bg-success' : 'bg-secondary'}">${user.Activo ? 'Sí' : 'No'}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editUser('${user.UserID}')">Editar</button>
                    <button class="btn btn-sm btn-danger" disabled>Eliminar</button>
                </td>
            </tr>
        `).join('');
        
        tableBody.innerHTML = tableContent || '<tr><td colspan="5" class="text-center">No hay usuarios.</td></tr>';
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error al cargar datos.</td></tr>`;
    }
}

/**
 * Rellena el formulario con los datos de un usuario para su edición.
 * @param {string} userId - El ID del usuario a editar.
 */
function editUser(userId) {
    // Buscamos el usuario en nuestra copia local
    const user = allUsers.find(u => u.UserID === userId);
    if (!user) {
        alert("Error: No se encontró el usuario.");
        return;
    }

    // Rellenamos el formulario con los datos
    document.getElementById('userId').value = user.UserID; // Guardamos el ID en el campo oculto
    document.getElementById('nombre').value = user.Nombre;
    document.getElementById('apellido').value = user.Apellido;
    document.getElementById('email').value = user.Email;
    document.getElementById('rol').value = user.Rol;
    
    // Rellenamos los campos de chofer (si existen en el objeto user)
    document.getElementById('licencia').value = user.Licencia || '';
    document.getElementById('dni').value = user.DNI || '';
    document.getElementById('supervisor').value = user.Supervisor || '';
    
    // Adaptamos el campo de contraseña para el modo edición
    const passwordInput = document.getElementById('password');
    passwordInput.required = false; // La contraseña no es obligatoria al editar
    passwordInput.placeholder = "Dejar en blanco para no cambiar";
    document.getElementById('passwordHelp').style.display = 'block';

    toggleDriverFields(); // Asegurarse de que los campos de chofer se muestren si es necesario
    window.scrollTo(0, 0); // Llevamos al usuario al principio de la página para ver el formulario
}

/**
 * Maneja el envío del formulario, decidiendo si se crea o actualiza un usuario.
 */
// ARCHIVO: app.js

async function handleUserFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Guardando...`;

    const userId = document.getElementById('userId').value;
    
    const userInfo = {
        nombre: form.nombre.value,
        apellido: form.apellido.value,
        email: form.email.value,
        password: form.password.value,
        rol: form.rol.value,
        activo: form.querySelector('#activo') ? form.querySelector('#activo').checked : true,
        licencia: form.licencia ? form.licencia.value : '',
        dni: form.dni ? form.dni.value : '',
        supervisor: form.supervisor ? form.supervisor.value : ''
    };
    
    // ===== CORRECCIÓN CLAVE AQUÍ =====
    // Construimos el cuerpo de la petición explícitamente
    let requestBody = {};

    if (userId) {
        // Si estamos actualizando, el backend espera 'action', 'userId' y 'payload'
        requestBody = {
            action: 'updateUser',
            userId: userId,
            payload: userInfo
        };
    } else {
        // Si estamos creando, el backend espera 'action' y 'payload'
        requestBody = {
            action: 'createUser',
            payload: userInfo
        };
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(requestBody) // Enviamos el cuerpo construido correctamente
        });

        const result = await response.json();
        if (result.status === 'success') {
            alert(result.message);
            form.reset();
            document.getElementById('userId').value = '';
            document.getElementById('password').required = true;
            document.getElementById('passwordHelp').style.display = 'none';
            toggleDriverFields();
            loadUsers();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error("Error al guardar usuario:", error);
        alert(`Error: ${error.message}`);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Guardar Usuario';
    }
}

/**
 * Muestra u oculta los campos específicos del rol "Chofer".
 */
function toggleDriverFields() {
    const driverFields = document.querySelector('#userForm .driver-fields');
    const rol = document.getElementById('rol').value;
    driverFields.style.display = (rol === 'Chofer') ? 'block' : 'none';
}