/**
 * @file app.js
 * @description Lógica principal del frontend para la aplicación JMP.
 */

// === CONFIGURACIÓN ===
// Pega aquí la URL de la API que implementaste en Apps Script

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

async function loadUsers() {
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
    try {
        const response = await fetch(`${API_URL}?action=getUsers`);
        if (!response.ok) throw new Error(`Error de red! Estado: ${response.status}`);
        const result = await response.json();
        if (result.status === 'error') throw new Error(result.message);
        
        allUsers = result;
        
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

function editUser(userId) {
    const user = allUsers.find(u => u.UserID === userId);
    if (!user) { alert("Error: No se encontró el usuario."); return; }

    document.getElementById('userId').value = user.UserID;
    document.getElementById('nombre').value = user.Nombre;
    document.getElementById('apellido').value = user.Apellido;
    document.getElementById('email').value = user.Email;
    document.getElementById('rol').value = user.Rol;
    document.getElementById('activo').checked = user.Activo;
    document.getElementById('licencia').value = user.Licencia || '';
    document.getElementById('dni').value = user.DNI || '';
    document.getElementById('supervisor').value = user.Supervisor || '';
    
    const passwordInput = document.getElementById('password');
    passwordInput.required = false;
    passwordInput.placeholder = "Dejar en blanco para no cambiar";
    document.getElementById('passwordHelp').style.display = 'block';

    toggleDriverFields();
    window.scrollTo(0, 0);
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
        userId: userId, // Se enviará aunque esté vacío para createUser, el backend lo ignora
        payload: userInfo
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        if (result.status === 'success') {
            alert(result.message);
            form.reset();
            document.getElementById('userId').value = '';
            document.getElementById('password').required = true;
            document.getElementById('password').placeholder = "";
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

function toggleDriverFields() {
    const driverFields = document.querySelector('#userForm .driver-fields');
    const rol = document.getElementById('rol').value;
    driverFields.style.display = (rol === 'Chofer') ? 'block' : 'none';
}