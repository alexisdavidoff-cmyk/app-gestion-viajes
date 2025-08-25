// Archivo: api.js

// IMPORTANTE: Reemplaza esta URL con la URL de tu aplicación web implementada en Apps Script.
const API_URL = "https://script.google.com/macros/s/AKfycbwgb389tW8nFhNeNjNJM9MyZEGNYXST_K1EeQ4zv-a1Ya3Y84heHPYpKuCqa0hZYubG/exec";

async function callApi(action, payload = {}) {
    const spinner = document.getElementById('spinner');
    spinner.style.display = 'flex';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Apps Script web apps requieren este header
            },
            body: JSON.stringify({ action, payload }),
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`Error en la red: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.status === 'error') {
            throw new Error(result.message);
        }

        return result.data;

    } catch (error) {
        console.error(`Error en la llamada API a la acción "${action}":`, error);
        alert(`Error: ${error.message}`); // Muestra un error al usuario
        return null; // Devuelve null en caso de error
    } finally {
        spinner.style.display = 'none';
    }
}