/* =========================================================
   InmoCheck — Lógica compartida del prototipo
   - Dibuja el menú lateral (escritorio) y la navegación inferior (móvil)
   - Ajusta la vista según el rol (?rol=admin | ?rol=inspector)
   - Íconos, paneles laterales, filtros y filas clicables
   ========================================================= */
(function () {
  const ICONS = {
    logo: '<path d="M3 10.5 12 3l9 7.5V21H3z"/><path d="m9 14 2 2 4-4"/>',
    home: '<path d="M3 10.5 12 3l9 7.5V21H3z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    list: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    badge: '<circle cx="12" cy="8" r="4"/><path d="M6 21v-1a6 6 0 0 1 12 0v1"/><path d="m16 11 2 2 4-4"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-up': '<path d="m18 15-6-6-6 6"/>',
    'arrow-left': '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    compare: '<path d="M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'
  };
  const icon = (name, extra = '') =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ICONS[name] || ''}</svg>`;
  window.InmoIcon = icon;

  const body = document.body;
  const params = new URLSearchParams(location.search);
  const role = params.get('rol') || body.dataset.role || 'admin';
  body.dataset.role = role;

  // Todas las páginas están un nivel dentro de su carpeta
  const R = '../';
  const MENUS = {
    admin: {
      user: ['Carlos Rojas', 'Administrador'],
      items: [
        ['dashboard', 'Resumen', 'grid', '1-administrador/dashboard.html'],
        ['inmuebles', 'Inmuebles', 'building', '1-administrador/inmuebles.html'],
        ['inspecciones', 'Inspecciones', 'list', '1-administrador/inspecciones.html'],
        ['propietarios', 'Propietarios', 'users', '1-administrador/propietarios.html'],
        ['inspectores', 'Inspectores', 'badge', '1-administrador/inspectores.html'],
        ['informes', 'Informes', 'file', '1-administrador/informes.html']
      ],
      mobile: ['dashboard', 'inmuebles', 'inspecciones']
    },
    inspector: {
      user: ['Laura Díaz', 'Inspectora'],
      items: [
        ['mis-inspecciones', 'Mis inspecciones', 'list', '2-inspector/mis-inspecciones.html'],
        ['inmuebles', 'Inmuebles', 'building', '1-administrador/inmuebles.html?rol=inspector'],
        ['informes', 'Informes', 'file', '1-administrador/informes.html?rol=inspector']
      ],
      mobile: ['mis-inspecciones', 'inmuebles', 'informes']
    }
  };
  const CONFIG_HREF = role === 'inspector' ? '1-administrador/configuracion.html?rol=inspector' : '1-administrador/configuracion.html';

  const layout = body.dataset.layout || 'app';
  const active = body.dataset['active' + (role === 'admin' ? 'Admin' : 'Inspector')] || body.dataset.active || '';

  if (layout === 'app' || layout === 'focus') {
    const m = MENUS[role];
    const nav = m.items.map(([key, label, ic, href]) =>
      `<a class="nav-item${key === active ? ' active' : ''}" href="${R + href}">${icon(ic)}${label}</a>`).join('');
    const cfg = `<a class="nav-item${active === 'configuracion' ? ' active' : ''}" href="${R + CONFIG_HREF}">${icon('settings')}Configuración</a>`;
    const userBlock = `<div class="sidebar-user"><span class="label">${m.user[0]}</span><span class="caption faint">${m.user[1]}</span><a href="${R}3-sistema-y-compartidas/login.html">Cerrar sesión</a></div>`;
    const home = role === 'admin' ? '1-administrador/dashboard.html' : '2-inspector/mis-inspecciones.html';
    const brand = `<a class="brand" href="${R + home}"><span class="brand-mark">${icon('logo', 'stroke-width="2.5"')}</span>InmoCheck</a>`;

    const main = document.querySelector('main');
    const app = document.createElement('div');
    app.className = 'app';
    app.innerHTML = `<aside class="sidebar" aria-label="Menú principal">${brand}${nav}<div class="spacer"></div>${cfg}${userBlock}</aside>`;
    main.parentNode.insertBefore(app, main);
    const col = document.createElement('div');
    col.className = 'main';
    col.innerHTML = `<header class="mobile-top">${brand}</header>`;
    app.appendChild(col);
    col.appendChild(main);

    // Navegación inferior en móvil
    const bn = document.createElement('nav');
    bn.className = 'bottom-nav';
    bn.setAttribute('aria-label', 'Navegación');
    bn.innerHTML = m.mobile.map(k => {
      const it = m.items.find(i => i[0] === k);
      return `<a class="${k === active ? 'active' : ''}" href="${R + it[3]}">${icon(it[2])}${it[1]}</a>`;
    }).join('') + `<button data-open="menu-movil">${icon('menu')}Más</button>`;
    body.appendChild(bn);

    // Menú completo para móvil
    const dm = document.createElement('div');
    dm.innerHTML = `<div class="drawer from-left" id="menu-movil" role="dialog" aria-label="Menú">
      <div class="drawer-head">${brand.replace('class="brand"', 'class="brand" style="padding:0"')}<button class="icon-btn" data-close aria-label="Cerrar">${icon('x')}</button></div>
      <div class="drawer-body">${nav}${cfg}<div style="flex:1"></div>${userBlock}</div></div>`;
    body.appendChild(dm.firstElementChild);
  }

  // Etiqueta con la ruta de la pantalla
  if (body.dataset.route) {
    const t = document.createElement('button');
    t.className = 'route-tag';
    t.title = 'Ruta en Next.js (clic para ocultar)';
    t.textContent = body.dataset.route;
    t.onclick = () => t.remove();
    body.appendChild(t);
  }

  // Íconos declarativos: <i data-icon="check"></i>
  document.querySelectorAll('[data-icon]').forEach(el => { el.outerHTML = icon(el.dataset.icon); });

  // Mantener el rol al navegar dentro del prototipo
  if (params.get('rol')) {
    document.querySelectorAll('a[href*=".html"]').forEach(a => {
      const h = a.getAttribute('href');
      if (/^https?:/.test(h) || h.includes('rol=') || h.includes('login.html')) return;
      a.setAttribute('href', h + (h.includes('?') ? '&' : '?') + 'rol=' + params.get('rol'));
    });
  }

  // Filas de tabla clicables
  document.querySelectorAll('tr[data-href]').forEach(tr => {
    tr.addEventListener('click', e => { if (!e.target.closest('a,button,input')) location.href = tr.dataset.href + (params.get('rol') ? (tr.dataset.href.includes('?') ? '&' : '?') + 'rol=' + params.get('rol') : ''); });
  });

  // Paneles laterales
  let backdrop = document.querySelector('.backdrop');
  if (!backdrop) { backdrop = document.createElement('div'); backdrop.className = 'backdrop'; body.appendChild(backdrop); }
  const closeAll = () => { document.querySelectorAll('.drawer.open').forEach(d => d.classList.remove('open')); backdrop.classList.remove('open'); };
  window.InmoOpen = id => { const d = document.getElementById(id); if (!d) return; d.classList.add('open'); backdrop.classList.add('open'); const f = d.querySelector('input,select,textarea,button'); f && setTimeout(() => f.focus(), 200); };
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); closeAll(); window.InmoOpen(o.dataset.open); return; }
    if (e.target.closest('[data-close]') || e.target === backdrop) closeAll();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });

  // Filtros: <div data-filter-for="#lista"><button class="fchip" data-filter="all">
  document.querySelectorAll('[data-filter-for]').forEach(group => {
    const target = document.querySelector(group.dataset.filterFor);
    group.addEventListener('click', e => {
      const b = e.target.closest('[data-filter]');
      if (!b) return;
      group.querySelectorAll('[data-filter]').forEach(x => x.classList.toggle('active', x === b));
      const f = b.dataset.filter;
      target.querySelectorAll('[data-cat]').forEach(it => {
        it.classList.toggle('hidden', !(f === 'all' || it.dataset.cat.split(' ').includes(f)));
      });
      target.querySelectorAll('[data-group]').forEach(g => {
        g.classList.toggle('hidden', !g.querySelector('[data-cat]:not(.hidden)'));
      });
    });
  });
})();
