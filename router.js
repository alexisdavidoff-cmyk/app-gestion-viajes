// Archivo: router.js

const appContainer = document.getElementById('app-container');

// Definición de las plantillas HTML para cada vista
const routes = {
    '/': `
        <div class="login-container">
            <div class="login-form">
                <h2>Iniciar Sesión</h2>
                <form id="loginForm">
                    <div class="input-group">
                        <label for="email">Correo Electrónico</label>
                        <input type="email" id="email" required>
                    </div>
                    <div class="input-group">
                        <label for="password">Contraseña</label>
                        <input type="password" id="password" required>
                    </div>
                    <button type="submit" class="btn">Ingresar</button>
                </form>
            </div>
        </div>
    `,
    '/dashboard': `
        <div class="dashboard-layout">
            <aside class="sidebar">
                <div class="logo">LOGÍSTICA</div>
                <nav class="menu">
                    <a href="#/viajes" data-role="all">Viajes</a>
                    <a href="#/aprobaciones" data-role="Supervisor nivel 1,Supervisor nivel 2,Supervisor nivel 3">Aprobaciones</a>
                    <a href="#/choferes" data-role="Administrador">Choferes</a>
                    <a href="#/vehiculos" data-role="Administrador">Vehículos</a>
                    <a href="#/clientes" data-role="Administrador,usuario">Clientes</a>
                    <a href="#/usuarios" data-role="Administrador">Usuarios</a>
                    <a href="#" id="logoutBtn">Cerrar Sesión</a>
                </nav>
            </aside>
            <main class="main-content">
                <div class="header">
                    <h1 id="view-title">Bienvenido</h1>
                    <div id="user-info"></div>
                </div>
                <div id="view-content" class="card">
                    <!-- El contenido de la sub-vista (viajes, choferes, etc.) se cargará aquí -->
                </div>
            </main>
        </div>
    `,

    // Añade más plantillas para sub-vistas (viajes, choferes, etc.)
     // >>> AÑADE ESTA NUEVA RUTA PARA LA VISTA DEL CHOFER <<<
    '/chofer': `
        <div class="chofer-view-container">
            <header class="chofer-header">
                <h1>Mis Viajes Asignados</h1>
                <div id="user-info-chofer"></div>
                <!-- BOTÓN AÑADIDO AQUÍ 👇 -->
                <button id="logoutBtn-chofer" class="btn-logout">Cerrar Sesión</button>
            </header>
            <main id="chofer-trip-list" class="trip-list"></main>
        </div>
    `,
};

const Router = {
    init: () => {
        window.addEventListener('hashchange', Router.handleRouteChange);
        Router.handleRouteChange(); // Carga la ruta inicial
    },
    handleRouteChange: () => {
        const path = window.location.hash.slice(1) || '/';
        const user = JSON.parse(sessionStorage.getItem('user'));

        if (!user && path !== '/') {
            window.location.hash = '/'; // Proteger todas las rutas
            return;
        }

        let mainRoute;
        if (path.startsWith('/dashboard')) {
            mainRoute = '/dashboard';
        } else if (path.startsWith('/chofer')) {
            mainRoute = '/chofer';
        } else {
            mainRoute = '/';
        }
        
        // Redirigir si ya está logueado
        if (path === '/' && user) {
             if (user.rol === 'Chofer') { window.location.hash = '/chofer'; }
             else { window.location.hash = '/dashboard'; }
             return;
        }

        appContainer.innerHTML = routes[mainRoute];

        // Inicializar la vista correcta
        if (mainRoute === '/dashboard') initDashboard();
        else if (mainRoute === '/chofer') initChoferView(); // Nueva función
        else initLogin();
    }
};

// Archivo: router.js (Sección actualizada)

// ... (código anterior del router) ...

// AÑADIMOS LAS PLANTILLAS PARA LAS SUB-VISTAS
const subViews = {
    '/viajes': {
        title: 'Gestión de Viaje    s',
        template: `
            <div class="view-header">
                <button id="btn-nuevo-viaje" class="btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
                    <span>Nuevo Viaje</span>
                </button>
                <div class="filters">
                    <!-- Aquí irán los filtros de búsqueda -->
                    <input type="text" id="search-viajes" placeholder="Buscar por cliente, chofer...">
                </div>
            </div>
            <div class="table-container">
                <table id="viajes-table">
                    <thead>
                        <tr>
                            <th>ID Viaje</th>
                            <th>Cliente</th>
                            <th>Chofer</th>
                            <th>Origen</th>
                            <th>Destino</th>
                            <th>Fecha/Hora</th>
                            <th>Estado</th>
                            <th>Riesgo</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Las filas de datos se insertarán aquí dinámicamente -->
                    </tbody>
                </table>
            </div>
        `
    },
    // >>> AÑADE ESTA NUEVA PLANTILLA <<<
    '/aprobaciones': {
        title: 'Aprobaciones de Viajes Pendientes',
        template: `
            <div class="table-container">
                <table id="aprobaciones-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Chofer</th>
                            <th>Origen</th>
                            <th>Destino</th>
                            <th>Fecha/Hora</th>
                            <th>Riesgo</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Las filas de viajes pendientes se insertarán aquí -->
                    </tbody>
                </table>
            </div>
        `
    },
    // >>> AÑADE ESTA NUEVA VISTA COMPLETA <<<
    '/usuarios': {
        title: 'Gestión de Usuarios',
        template: `
            <div class="view-header">
                <button id="btn-nuevo-usuario" class="btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
                    <span>Nuevo Usuario</span>
                </button>
            </div>
            <div class="table-container">
                <table id="usuarios-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Las filas de usuarios se insertarán aquí -->
                    </tbody>
                </table>
            </div>
        `
    },

    '/choferes': {
        title: 'Gestión de Choferes',
        template: `
            <div class="view-header">
                <button id="btn-nuevo-chofer" class="btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
                    <span>Nuevo Chofer</span>
                </button>
            </div>
            <div class="table-container">
                <table id="choferes-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>DNI</th>
                            <th>Licencia</th>
                            <th>Vencimiento</th>
                            <th>Teléfono</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Las filas de choferes se insertarán aquí -->
                    </tbody>
                </table>
            </div>
        `
    }


    // ... más vistas si las hubiera ...
};
