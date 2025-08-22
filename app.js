/**
 * @file app.js
 * @description Lógica principal del frontend para la aplicación JMP.
 */

const API_URL = "https://script.google.com/macros/s/AKfycbxadib32HzW41TbuHciSIgqQuHokCyx8e50DLDEMQE2KDVKeVWAUx8KBO1FUNleU0Nz/exec";
let allUsers = [];

document.addEventListener('DOMContentLoaded', () => {
    initializeUserModule();
});

function initializeUserModule() {
    document.getElementById('rol').addEventListener('change', toggleDriverFields);
    document.getElementById('userForm').addEventListener('submit', handleUserFormSubmit);
    loadUsers();
}

/**
 * Función genérica para hacer llamadas a nuestra API.
 * @param {string} method - 'GET' o 'POST'.
 * @param {object} [body=null] - El cuerpo de la petición para POST.
 * @returns {Promise<object>} La respuesta JSON del servidor.
 */
async function callApi(method = 'GET', body = null) {
    const url = method === 'GET' && body ? `${API_URL}?${new URLSearchParams(body)}` : API_URL;
    
    const options = {
        method: method,
        redirect: 'follow', // Sigue las redirecciones de Google
    };

    if (method === 'POST') {
        options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Error de red! Estado: ${response.status}`);
    
    const result = await response.json();
    if (result.status === 'error') throw new Error(result.message);
    
    return result;
}

async function loadUsers() {
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
    try {
        const users = await callApi('GET', { action: 'getUsers' });
        allUsers = users;
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
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error al cargar datos: ${error.message}</td></tr>`;
    }
}

function editUser(userId) {
    // ... (Esta función no cambia)
    const user=allUsers.find(u=>u.UserID===userId);if(!user)return void alert("Error: No se encontró el usuario.");document.getElementById("userId").value=user.UserID,document.getElementById("nombre").value=user.Nombre,document.getElementById("apellido").value=user.Apellido,document.getElementById("email").value=user.Email,document.getElementById("rol").value=user.Rol,document.getElementById("activo").checked=user.Activo,document.getElementById("licencia").value=user.Licencia||"",document.getElementById("dni").value=user.DNI||"",document.getElementById("supervisor").value=user.Supervisor||"";const passwordInput=document.getElementById("password");passwordInput.required=!1,passwordInput.placeholder="Dejar en blanco para no cambiar",document.getElementById("passwordHelp").style.display="block",toggleDriverFields(),window.scrollTo(0,0);
}

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
        activo: document.getElementById('activo').checked,
        licencia: form.licencia.value,
        dni: form.dni.value,
        supervisor: form.supervisor.value
    };
    
    const action = userId ? 'updateUser' : 'createUser';
    const requestBody = {
        action: action,
        userId: userId, // Se envía siempre, el backend lo usa si lo necesita
        payload: userInfo
    };

    try {
        const result = await callApi('POST', requestBody);
        alert(result.message);
        form.reset();
        document.getElementById('userId').value = '';
        document.getElementById('password').required = true;
        document.getElementById('password').placeholder = "";
        document.getElementById('passwordHelp').style.display = 'none';
        toggleDriverFields();
        loadUsers();
    } catch (error) {
        console.error("Error al guardar usuario:", error);
        alert(`Error: ${error.message}`);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Guardar Usuario';
    }
}

function toggleDriverFields() {
    // ... (Esta función no cambia)
    const driverFields=document.querySelector("#userForm .driver-fields"),rol=document.getElementById("rol").value;driverFields.style.display="Chofer"===rol?"block":"none";
}