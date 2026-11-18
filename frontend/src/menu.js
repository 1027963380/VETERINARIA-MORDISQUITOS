const TODOS = ['ADMIN', 'VETERINARIO', 'RECEPCIONISTA'];

export const MENU = [
  { ruta: '/', texto: 'Inicio', icono: '🏠', descripcion: '', roles: TODOS },
  {
    ruta: '/propietarios', texto: 'Propietarios', icono: '👥',
    descripcion: 'Registra y consulta a los dueños de las mascotas.',
    roles: ['ADMIN', 'RECEPCIONISTA'],
  },
  {
    ruta: '/mascotas', texto: 'Mascotas', icono: '🐶',
    descripcion: 'Fichas de las mascotas, su especie y su raza.',
    roles: TODOS,
  },
  {
    ruta: '/citas', texto: 'Citas', icono: '📅',
    descripcion: 'Agenda citas sin choques de horario.',
    roles: TODOS,
  },
  {
    ruta: '/consultas', texto: 'Consultas', icono: '🩺',
    descripcion: 'Registra síntomas, diagnóstico y tratamiento.',
    roles: ['ADMIN', 'VETERINARIO'],
  },
  {
    ruta: '/vacunaciones', texto: 'Vacunaciones', icono: '💉',
    descripcion: 'Controla las vacunas aplicadas y sus refuerzos.',
    roles: ['ADMIN', 'VETERINARIO'],
  },
  {
    ruta: '/ventas', texto: 'Ventas', icono: '🧾',
    descripcion: 'Cobra productos y servicios con control de stock.',
    roles: ['ADMIN', 'RECEPCIONISTA'],
  },
  {
    ruta: '/productos', texto: 'Productos', icono: '📦',
    descripcion: 'Administra el inventario y los precios.',
    roles: ['ADMIN'],
  },
  {
    ruta: '/servicios', texto: 'Servicios', icono: '✂️',
    descripcion: 'Define los servicios y sus tarifas.',
    roles: ['ADMIN'],
  },

  {
    ruta: '/catalogos', texto: 'Catálogos', icono: '📚',
    descripcion: 'Especies, razas y vacunas del sistema.',
    roles: ['ADMIN', 'VETERINARIO'],
  },

  {
    ruta: '/usuarios', texto: 'Usuarios', icono: '🔑',
    descripcion: 'Crea al personal y restablece contraseñas.',
    roles: ['ADMIN'],
  },

  {
    ruta: '/alertas', texto: 'Alertas', icono: '🔔',
    descripcion: 'Vacunas por vencer y productos con poco stock.',
    roles: TODOS,
  },
];