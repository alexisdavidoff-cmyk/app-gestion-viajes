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
        <!-- BOTÓN DE HAMBURGUESA AÑADIDO 👇 -->
                <button id="menu-toggle" class="menu-toggle-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-list" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>
                </button>
        <div class="dashboard-layout">
            <aside class="sidebar">
                <div class="logo">LOGÍSTICA</div>
                <nav class="menu">
                    <a href="#/dashboard" data-role="Administrador,Supervisor nivel 1,Supervisor nivel 2,Supervisor nivel 3">Dashboard</a>
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

/**const Router = {
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
};**/

const Router = {
    init: () => {
        window.addEventListener('hashchange', Router.handleRouteChange);
        Router.handleRouteChange();
    },
    handleRouteChange: () => {
        const path = window.location.hash.slice(1) || '/';
        const user = JSON.parse(sessionStorage.getItem('user'));

        // --- LÓGICA DE SEGURIDAD MEJORADA ---
        const isInternalRoute = path.startsWith('/dashboard') || path.startsWith('/chofer') || path.startsWith('/profile');

        if (isInternalRoute && !user) {
            // Si intenta acceder a una ruta interna SIN sesión, lo expulsamos al login.
            window.location.hash = '/';
            return;
        }

        if (path === '/' && user) {
            // Si ya tiene sesión e intenta ir al login, lo llevamos a su página principal.
            if (user.rol === 'Chofer') { window.location.hash = '/chofer'; }
            else { window.location.hash = '/dashboard'; }
            return;
        }

        // --- LÓGICA DE RENDERIZADO MEJORADA ---
        let mainRoute;
        if (isInternalRoute) {
            // Si es CUALQUIER ruta interna, la base del layout es el D DASHBOARD
            // (esto es para que la barra lateral y el header aparezcan también en la página de perfil)
             if (user.rol === 'Chofer') {
                mainRoute = '/chofer'; // A menos que sea el chofer
            } else {
                mainRoute = '/dashboard';
            }
        } else {
            mainRoute = '/';
        }
        
        // Renderizamos el layout principal (login, dashboard o vista de chofer)
        appContainer.innerHTML = routes[mainRoute];

        // Inicializamos el script del layout correspondiente
        if (mainRoute === '/dashboard') initDashboard();
        else if (mainRoute === '/chofer') initChoferView();
        else initLogin();
        
        // Si estamos en una sub-vista (como /profile), la cargamos dentro del layout del dashboard
        if (mainRoute === '/dashboard' && path !== '/dashboard') {
            loadSubView(path);
        }
    }
};
// Archivo: router.js (Sección actualizada)

// ... (código anterior del router) ...

// AÑADIMOS LAS PLANTILLAS PARA LAS SUB-VISTAS
const subViews = {
    '/viajes': {
        title: 'Gestión de Viajes',
        template: `
        <div class="view-header">
            <button id="btn-nuevo-viaje" class="btn-primary">
                <span>+ Nuevo Viaje</span>
            </button>
            
            <!-- >>> CONTROLES DE FILTRO Y ORDEN AÑADIDOS <<< -->
            <div class="table-controls">
                <input type="text" id="filter-input" placeholder="Buscar por cliente, chofer, origen...">
                <select id="sort-select">
                    <option value="fecha-desc">Más recientes primero</option>
                    <option value="fecha-asc">Más antiguos primero</option>
                    <option value="riesgo-desc">Mayor riesgo primero</option>
                    <option value="riesgo-asc">Menor riesgo primero</option>
                </select>
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
    },
    '/vehiculos': {
        title: 'Gestión de Vehículos',
        template: `
            <div class="view-header">
                <button id="btn-nuevo-vehiculo" class="btn-primary">
                    <span>+ Nuevo Vehículo</span>
                </button>
            </div>
            <div class="table-container">
                <table id="vehiculos-table">
                    <thead>
                        <tr>
                            <th>Patente</th>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Año</th>
                            <th>Vencimiento VTV</th>
                            <th>Vencimiento Seguro</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Las filas de vehículos se insertarán aquí -->
                    </tbody>
                </table>
            </div>
        `
    },

    '/clientes': {
        title: 'Gestión de Clientes',
        template: `
            <div class="view-header">
                <button id="btn-nuevo-cliente" class="btn-primary">
                    <span>+ Nuevo Cliente</span>
                </button>
            </div>
            <div class="table-container">
                <table id="clientes-table">
                    <thead>
                        <tr>
                            <th>Razón Social / Nombre</th>
                            <th>CUIT / DNI</th>
                            <th>Dirección</th>
                            <th>Contacto</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Las filas de clientes se insertarán aquí -->
                    </tbody>
                </table>
            </div>
        `
    },
    '/dashboard': {
        title: 'Tablero de Control',
        template: `
            <!-- KPIs -->
            <div class="kpi-grid">
                <div class="kpi-card"><div class="kpi-value" id="kpi-total">-</div><div class="kpi-label">Viajes Totales</div></div>
                <div class="kpi-card"><div class="kpi-value" id="kpi-pendiente">-</div><div class="kpi-label">Pendientes Aprob.</div></div>
                <div class="kpi-card"><div class="kpi-value" id="kpi-en-curso">-</div><div class="kpi-label">En Curso</div></div>
                <div class="kpi-card"><div class="kpi-value" id="kpi-finalizado">-</div><div class="kpi-label">Finalizados</div></div>
            </div>

            <!-- Gráficos y Alertas -->
            <div class="dashboard-grid">
                <div class="widget-card">
                    <h3>Viajes por Nivel de Riesgo</h3>
                    <div class="chart-container">
                        <canvas id="riesgo-chart"></canvas>
                    </div>
                </div>
                <div class="widget-card">
                    <h3>Alertas de Vencimientos</h3>
                    <div id="alertas-container">
                        <h4>Licencias por Vencer</h4>
                        <ul id="licencias-list" class="alert-list"><li>Cargando...</li></ul>
                        <h4>VTV por Vencer</h4>
                        <ul id="vtvs-list" class="alert-list"><li>Cargando...</li></ul>
                        <h4>Seguros por Vencer</h4>
                        <ul id="seguros-list" class="alert-list"><li>Cargando...</li></ul>
                    </div>
                </div>
            </div>
        `
    },
    '/profile': {
    title: 'Mi Perfil',
    template: `
        <div class="card">
            <h3>Cambiar Contraseña</h3>
            <p>Para cambiar tu contraseña, por favor ingresa tu contraseña actual seguida de la nueva.</p>
            <form id="profile-form">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="current-password">Contraseña Actual</label>
                        <input type="password" id="current-password" required>
                    </div>
                    <div class="form-group">
                        <label for="new-password">Nueva Contraseña</label>
                        <input type="password" id="new-password" required>
                    </div>
                    <div class="form-group">
                        <label for="confirm-password">Confirmar Nueva Contraseña</label>
                        <input type="password" id="confirm-password" required>
                    </div>
                </div>
                <div class="form-footer">
                    <button type="submit" class="btn-primary">Guardar Cambios</button>
                </div>
            </form>
        </div>
    `
}



    // ... más vistas si las hubiera ...
};
