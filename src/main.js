import * as bootstrap from 'bootstrap';
import Chart from 'chart.js/auto';
import './main.scss';

window.bootstrap = bootstrap;

const API_BASE = window.AMANI_ADMIN_API_BASE || '';
const API_KEY = window.AMANI_ADMIN_API_KEY || '';
const charts = new Map();

const panel = {
  label: 'Admin Panel',
  home: 'index.html',
  subtitle: 'Amani operations, content, reports and business actions',
  sections: [
    { title: 'Amani Administration', groups: [
      { icon: 'bi-house', title: 'Overview & Reports', items: [['index.html','Property Portfolio'],['index2.html','Listings & Occupancy'],['index3.html','Tenant Financials'],['index4.html','Billing & Reports'],['widgets.html','Live KPIs'],['landing.html','Amani Overview']] },
      { icon: 'bi-buildings', title: 'Properties & Leasing', items: [['form.html','Properties'],['form_advanced.html','Property Units'],['projects.html','Properties / Listings'],['project_detail.html','Property Detail'],['pricing_tables.html','Unit Pricing'],['level2.html','Location Hierarchy'],['map.html','Property Locations'],['form_wizards.html','Tenancy Setup'],['rental_admin.html','Tenancies / Rentals'],['calendar.html','Notices & Vacating'],['form_validation.html','Maintenance Requests']] },
      { icon: 'bi-chat-left-text', title: 'Enquiries & Messages', items: [['listing_enquiries.html','Property Listing Enquiries'],['contact_messages.html','Contact Messages']] },
      { icon: 'bi-people', title: 'Clients & Finance', items: [['tables.html','Clients / Tenants'],['invoice.html','Payments & Receipts'],['tables_dynamic.html','Billing Charges'],['e_commerce.html','Billing Accounts'],['inbox.html','Contract Delivery'],['form_upload.html','Client Documents']] },
      { icon: 'bi-window', title: 'Content & Team', items: [['general_elements.html','Website Content'],['media_gallery.html','Legacy Property Media'],['gallery_media.html','Published Photo Galleries'],['icons.html','Property Features'],['form_buttons.html','Amani Services'],['contacts.html','Agents / Team'],['profile.html','Agent Profiles']] },
      { icon: 'bi-bar-chart-line', title: 'Visual Reports', items: [['chartjs.html','Portfolio Visuals'],['echarts.html','Financial Visuals'],['other_charts.html','Operations Visuals']] }
    ]}
  ]
};

const profiles = {
  'index.html': { type:'dashboard', title:'Property Portfolio', charts:['properties_by_status','units_by_status','portfolio_snapshot','maintenance_by_status'], table:'properties' },
  'index2.html': { type:'dashboard', title:'Listings & Occupancy', charts:['units_by_status','properties_by_status','reservations_by_status','portfolio_snapshot'], table:'units' },
  'index3.html': { type:'dashboard', title:'Tenant Financials', charts:['tenancies_by_status','monthly_financial_comparison','monthly_received_payments','payments_by_method'], table:'tenancies' },
  'index4.html': { type:'dashboard', title:'Billing & Reports', charts:['monthly_financial_comparison','financial_position','charges_by_type','contracts_by_status'], table:'payments' },
  'listing_enquiries.html': { type:'resource', title:'Property Listing Enquiries', resource:'listing-enquiries' },
  'contact_messages.html': { type:'resource', title:'Contact Messages', resource:'contact-messages' },
  'form.html': { type:'resource', title:'Properties', resource:'properties' },
  'form_advanced.html': { type:'resource', title:'Property Units', resource:'units' },
  'form_validation.html': { type:'resource', title:'Maintenance Requests', resource:'maintenance' },
  'form_wizards.html': { type:'resource', title:'Tenancy Setup', resource:'tenancies' },
  'form_upload.html': { type:'resource', title:'Client Documents', resource:'documents' },
  'form_buttons.html': { type:'resource', title:'Amani Services', resource:'services' },
  'general_elements.html': { type:'resource', title:'Website Content', resource:'content' },
  'media_gallery.html': { type:'resource', title:'Legacy Property Media', resource:'media' },
  'gallery_media.html': { type:'resource', title:'Published Photo Galleries', resource:'gallery-media' },
  'icons.html': { type:'resource', title:'Property Features', resource:'features' },
  'widgets.html': { type:'dashboard', title:'Live Amani KPIs', charts:['portfolio_snapshot','financial_position','operational_volume','monthly_financial_comparison'], table:'properties' },
  'invoice.html': { type:'resource', title:'Payments & Receipts', resource:'payments' },
  'inbox.html': { type:'resource', title:'Contract Delivery Queue', resource:'contract-delivery' },
  'calendar.html': { type:'resource', title:'Notices & Vacating Calendar', resource:'notices' },
  'tables.html': { type:'resource', title:'Clients / Tenants', resource:'clients' },
  'tables_dynamic.html': { type:'resource', title:'Billing Charges', resource:'charges' },
  'chartjs.html': { type:'dashboard', title:'Portfolio Visuals', charts:['properties_by_status','units_by_status','reservations_by_status','tenancies_by_status','portfolio_snapshot'], table:'properties' },
  'echarts.html': { type:'dashboard', title:'Financial Visuals', charts:['monthly_financial_comparison','monthly_received_payments','payments_by_method','charges_by_type','financial_position'], table:'payments' },
  'other_charts.html': { type:'dashboard', title:'Operations Visuals', charts:['maintenance_by_status','maintenance_by_priority','contracts_by_status','notices_by_type','operational_volume'], table:'maintenance' },
  'e_commerce.html': { type:'resource', title:'Billing Accounts', resource:'billing-accounts' },
  'projects.html': { type:'resource', title:'Properties / Listings', resource:'properties' },
  'project_detail.html': { type:'resource', title:'Property Detail Records', resource:'properties' },
  'contacts.html': { type:'resource', title:'Agents / Team', resource:'agents' },
  'profile.html': { type:'resource', title:'Agent Profiles', resource:'agents' },
  'pricing_tables.html': { type:'resource', title:'Unit Pricing', resource:'units' },
  'level2.html': { type:'resource', title:'Location Hierarchy', resource:'locations' },
  'landing.html': { type:'dashboard', title:'Amani Overview', charts:['portfolio_snapshot','properties_by_status','units_by_status','monthly_financial_comparison'], table:'properties' },
  'rental_admin.html': { type:'resource', title:'Tenancies / Rentals', resource:'tenancies' },
  'map.html': { type:'resource', title:'Property Locations', resource:'locations' }
};

function filename() { return location.pathname.split('/').pop() || 'index.html'; }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function labelize(value) { return String(value || '').replaceAll('_',' ').replace(/\b\w/g, m => m.toUpperCase()); }
function money(value) { return new Intl.NumberFormat('en-KE',{style:'currency',currency:'KES',maximumFractionDigits:0}).format(Number(value||0)); }
function number(value) { return Number(value || 0).toLocaleString('en-KE'); }
function safeJson(value) { try { return JSON.stringify(value, null, 2); } catch { return String(value ?? ''); } }

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { Accept: 'application/json', ...(options.body ? {'Content-Type':'application/json'} : {}), ...(API_KEY ? {'x-admin-api-key':API_KEY} : {}), ...(options.headers || {}) }
    });
  } catch (cause) {
    const error = new Error('Backend is not reachable. Start the backend service and check its connection.');
    error.cause = cause; throw error;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const error = new Error(payload.error || `Request failed with status ${response.status}`);
    error.status = response.status; error.details = payload.details; throw error;
  }
  return payload;
}


function menuHtml() {
  const current = filename();
  return panel.sections.map(section => `
    <div class="amani-menu-section">${escapeHtml(section.title)}</div>
    <ul class="amani-menu">${section.groups.map((group, groupIndex) => `
      <li class="amani-menu-group">
        <button class="group-title" type="button" aria-expanded="false" aria-controls="submenu-admin-${groupIndex}">
          <i class="bi ${group.icon}"></i><span class="menu-text">${escapeHtml(group.title)}</span><i class="bi bi-chevron-down submenu-caret"></i>
        </button>
        <ul class="amani-submenu" id="submenu-admin-${groupIndex}" hidden>${group.items.map(([href,text]) => `<li><a class="${href===current?'active':''}" href="${href}">${escapeHtml(text)}</a></li>`).join('')}</ul>
      </li>`).join('')}</ul>`).join('');
}

function setupMenuAccordion() {
  const groups = [...document.querySelectorAll('.amani-menu-group')];
  const closeGroup = (group) => {
    group.classList.remove('open');
    const button = group.querySelector('.group-title');
    const submenu = group.querySelector('.amani-submenu');
    button?.setAttribute('aria-expanded','false');
    if (submenu) submenu.hidden = true;
  };
  const openGroup = (group) => {
    groups.forEach(other => { if (other !== group) closeGroup(other); });
    group.classList.add('open');
    const button = group.querySelector('.group-title');
    const submenu = group.querySelector('.amani-submenu');
    button?.setAttribute('aria-expanded','true');
    if (submenu) submenu.hidden = false;
  };
  groups.forEach(group => {
    closeGroup(group);
    group.querySelector('.group-title')?.addEventListener('click', () => {
      if (document.body.classList.contains('sidebar-collapsed')) document.body.classList.remove('sidebar-collapsed');
      if (group.classList.contains('open')) closeGroup(group); else openGroup(group);
    });
  });
  document.querySelectorAll('.amani-submenu a').forEach(link => link.addEventListener('click', () => {
    if (innerWidth <= 900) document.body.classList.remove('sidebar-open');
  }));
}


function renderShell(profile) {
  document.title = `${profile.title} | Amani Admin`;
  document.getElementById('amani-app').innerHTML = `
    <div class="amani-shell">
      <aside class="amani-sidebar">
        <a class="amani-brand" href="${panel.home}"><span class="amani-brand-mark"><img src="/logo-icon.svg" alt="Amani"></span><span class="amani-brand-copy"><strong>Amani Admin</strong><small>Blue Sky Agency</small></span></a>
        <div class="amani-profile"><img src="/logo-icon.svg" alt="Amani"><div><small>${escapeHtml(panel.subtitle)}</small><strong>${escapeHtml(panel.label)}</strong></div></div>
        <nav>${menuHtml()}</nav>
      </aside>
      <div class="amani-content-wrap">
        <header class="amani-topbar"><button class="amani-menu-toggle" type="button" aria-label="Toggle menu"><i class="bi bi-list"></i></button><div class="amani-topbar-right"><span class="amani-area-badge"><i class="bi bi-briefcase"></i> Admin Panel</span><div class="amani-status" id="backend-status"><span class="amani-dot"></span><span>Checking backend…</span></div></div></header>
        <main class="amani-main" id="amani-main"><div class="amani-empty"><div class="d-flex align-items-center justify-content-center gap-2"><span class="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span><span>Loading data…</span></div></div></main>
        <footer class="amani-footer">Amani Admin · business operations and reporting through the central Amani backend</footer>
      </div>
    </div>`;
  setupMenuAccordion();
  document.querySelector('.amani-menu-toggle').addEventListener('click', () => {
    if (innerWidth <= 900) document.body.classList.toggle('sidebar-open'); else document.body.classList.toggle('sidebar-collapsed');
  });
}

async function checkBackend() {
  const el = document.getElementById('backend-status');
  try {
    const health = await api('/health');
    el.className = 'amani-status ok';
    el.innerHTML = `<span class="amani-dot"></span><span>Backend + DB connected · ${number(health.data?.properties_count)} properties</span>`;
  } catch (error) {
    el.className = 'amani-status bad';
    el.innerHTML = `<span class="amani-dot"></span><span>${escapeHtml(error.message)}</span>`;
  }
}

function pageHeader(profile, subtitle = 'All values below come from the current Amani database through amani-backend.') {
  return `<div class="amani-page-title"><div><h1>${escapeHtml(profile.title)}</h1><div class="small text-muted mt-1">${escapeHtml(subtitle)}</div></div></div>`;
}

function kpiHtml(label, value, format='number') {
  const shown = format === 'money' ? money(value) : number(value);
  return `<div class="col-xl-3 col-md-6 mb-3"><div class="amani-kpi"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(shown)}</div></div></div>`;
}


function destroyChart(id) { if (charts.has(id)) { charts.get(id).destroy(); charts.delete(id); } }

const chartStyles = {
  properties_by_status: { title:'Property Status Distribution', type:'doughnut' },
  units_by_status: { title:'Unit Status Comparison', type:'bar', indexAxis:'y' },
  tenancies_by_status: { title:'Tenancy Status Distribution', type:'pie' },
  payments_by_method: { title:'Received Payments by Method', type:'polarArea' },
  monthly_received_payments: { title:'Monthly Received Payments', type:'line', smooth:true, fill:true, money:true },
  monthly_financial_comparison: { title:'Monthly Received Payments vs Posted / Paid Charges', type:'line', smooth:true, comparison:true, money:true },
  charges_by_type: { title:'Charges by Type', type:'bar', indexAxis:'y' },
  contracts_by_status: { title:'Contract Status Profile', type:'radar' },
  notices_by_type: { title:'Notice Types', type:'doughnut' },
  reservations_by_status: { title:'Reservation Status', type:'pie' },
  maintenance_by_status: { title:'Maintenance Status', type:'bar' },
  maintenance_by_priority: { title:'Maintenance Priority', type:'polarArea' },
  portfolio_snapshot: { title:'Portfolio Comparison', type:'bar' },
  financial_position: { title:'Financial Position Comparison', type:'bar', money:true },
  operational_volume: { title:'Operational Record Volumes', type:'bar', indexAxis:'y' }
};

const chartPalette = ['#1685BD','#F59E0B','#12A87B','#E34A62','#8B5CF6','#06B6D4','#F97316','#64748B','#335EEA','#D946EF'];
const chartPaletteSoft = ['rgba(22,133,189,.20)','rgba(245,158,11,.20)','rgba(18,168,123,.20)','rgba(227,74,98,.20)','rgba(139,92,246,.20)','rgba(6,182,212,.20)'];

function chartTitle(key) { return chartStyles[key]?.title || labelize(key); }

function renderChart(id, key, data) {
  const canvas = document.getElementById(id); if (!canvas) return;
  destroyChart(id);
  const style = chartStyles[key] || { type:'bar' };
  const labels = data?.labels || [];
  const rawDatasets = Array.isArray(data?.datasets) && data.datasets.length
    ? data.datasets
    : [{ label: chartTitle(key), values: data?.values || [] }];
  if (!labels.length || !rawDatasets.some(dataset => (dataset.values || []).length)) {
    canvas.parentElement.innerHTML = '<div class="amani-empty">No live records available for this visualization.</div>';
    return;
  }
  const isCircular = ['doughnut','pie','polarArea'].includes(style.type);
  const datasets = rawDatasets.map((dataset,index) => ({
    label: dataset.label || chartTitle(key),
    data: dataset.values || [],
    borderColor: isCircular ? '#fff' : chartPalette[index % chartPalette.length],
    backgroundColor: isCircular ? labels.map((_,i)=>chartPalette[i % chartPalette.length]) : (style.fill ? chartPaletteSoft[index % chartPaletteSoft.length] : (rawDatasets.length === 1 && style.type === 'bar' ? labels.map((_,i)=>chartPalette[i % chartPalette.length]) : chartPalette[index % chartPalette.length])),
    borderWidth: isCircular ? 2 : 2,
    tension: style.smooth ? .38 : 0,
    cubicInterpolationMode: style.smooth ? 'monotone' : 'default',
    fill: Boolean(style.fill && style.type === 'line'),
    pointRadius: style.type === 'line' ? 3 : undefined,
    pointHoverRadius: style.type === 'line' ? 5 : undefined
  }));
  const options = {
    responsive:true,
    maintainAspectRatio:false,
    indexAxis: style.indexAxis || 'x',
    interaction: style.comparison ? { mode:'index', intersect:false } : undefined,
    plugins: {
      legend: { position: isCircular || style.comparison || style.type === 'radar' ? 'bottom' : 'top', labels:{ usePointStyle:true, boxWidth:10, padding:14 } },
      tooltip: { backgroundColor:'#102E50', titleColor:'#FFFFFF', bodyColor:'#EAF5FC', padding:13, cornerRadius:10, displayColors:true, callbacks:{ title: items => `${chartTitle(key)} — ${items[0]?.label || ''}`, label: context => `${context.dataset.label || chartTitle(key)}: ${style.money ? money(context.parsed[style.indexAxis === 'y' ? 'x' : 'y'] ?? context.raw) : (typeof context.raw === 'object' ? (context.parsed[style.indexAxis === 'y' ? 'x' : 'y'] ?? '') : context.raw)}` } }
    },
    scales: isCircular || style.type === 'radar' ? undefined : {
      y: style.indexAxis === 'y' ? undefined : { beginAtZero:true, ticks: style.money ? { callback:value=>money(value) } : undefined },
      x: style.indexAxis === 'y' ? { beginAtZero:true, ticks: style.money ? { callback:value=>money(value) } : undefined } : undefined
    }
  };
  const chart = new Chart(canvas, { type:style.type, data:{ labels, datasets }, options });
  charts.set(id, chart);
}

function dashboardKpis(stats, title) {
  if (/financial|billing|report/i.test(title)) return [
    ['Received Payments',stats.received_payments_amount,'money'],['Outstanding Charges',stats.outstanding_charges_amount,'money'],['Payment Records',stats.total_payments],['Contracts',stats.total_contracts]
  ];
  if (/tenant/i.test(title)) return [
    ['Clients',stats.total_clients],['Tenancies',stats.total_tenancies],['Active Tenancies',stats.active_tenancies],['Payments',stats.total_payments]
  ];
  if (/occupancy|listing/i.test(title)) return [
    ['Properties',stats.total_properties],['Units',stats.total_units],['Occupied Units',stats.occupied_units],['Vacant Units',stats.vacant_units]
  ];
  return [['Properties',stats.total_properties],['Units',stats.total_units],['Clients',stats.total_clients],['Tenancies',stats.total_tenancies]];
}

const TABLE_HIDDEN_FIELDS = new Set([
  'created_at','updated_at','deleted_at','created_by','updated_by','deleted_by',
  'search_tsv','metadata','legacy_json','id','property_id','type_id','category_id','floor_id','unit_id','client_id','tenancy_id'
]);

function isAuditContext() {
  return /audit/i.test(String(currentMeta?.key || '')) ||
    /audit/i.test(String(currentMeta?.title || ''));
}

function isTableHiddenField(key) {
  if (!key) return true;
  if (/_json$/i.test(key)) return true;
  if (!isAuditContext() && (key === 'id' || /_id$/i.test(key))) return true;
  if (!isAuditContext() && TABLE_HIDDEN_FIELDS.has(key)) return true;
  return false;
}

function chooseColumns(rows, max=8) {
  const preferred = [
    'title','full_name','tenant_name','unit_code','property_name','status',
    'contract_status','payment_date','amount','payment_method','receipt_no',
    'reference_no','phone','email'
  ];
  const keys = [...new Set(rows.flatMap(row => Object.keys(row || {})))]
    .filter(k => !isTableHiddenField(k));
  return [
    ...preferred.filter(k => keys.includes(k)),
    ...keys.filter(k => !preferred.includes(k))
  ].slice(0,max);
}

function statusCell(value) {
  const raw = String(value || '');
  const label = labelize(raw);
  const cls = raw.toLowerCase().trim().replace(/[_\s]+/g,'-').replace(/[^a-z0-9-]+/g,'-');
  return `<span class="amani-status-pill status-${escapeHtml(cls)}" title="${escapeHtml(label)}"><span class="amani-pill-dot" aria-hidden="true"></span>${escapeHtml(label)}</span>`;
}

function displayCell(value, key='') {
  if (value === null || value === undefined || value === '') return '<span class="amani-muted">—</span>';
  if (/status$/i.test(key)) return statusCell(value);
  if (typeof value === 'boolean') return `<span class="amani-boolean ${value ? 'yes' : 'no'}">${value ? 'Yes' : 'No'}</span>`;
  if (typeof value === 'object') return escapeHtml(safeJson(value).replace(/\s+/g,' ').slice(0,140));
  if (/amount|rent|balance|cost|price|charge|fee/i.test(key) && Number.isFinite(Number(value))) return escapeHtml(money(value));
  return escapeHtml(String(value));
}

function tableHtml(rows, columns = chooseColumns(rows)) {
  if (!rows.length) return '<div class="amani-empty">No records found.</div>';
  const cleanColumns = columns.filter(c => !isTableHiddenField(c));
  return `<div class="amani-table-wrap"><table class="table amani-table"><thead><tr>${cleanColumns.map(c=>`<th>${escapeHtml(labelize(c))}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${cleanColumns.map(c=>`<td title="${escapeHtml(typeof row[c]==='object'?safeJson(row[c]):row[c])}">${displayCell(row[c],c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

async function renderDashboard(profile) {
  const main = document.getElementById('amani-main');
  try {
    const analytics = (await api('/api/admin/live/analytics')).data || {};
    const stats = analytics.stats || {}; const chartDefs = profile.charts || [];
    const recent = analytics.recent?.[profile.table] || [];
    main.innerHTML = `${pageHeader(profile)}<div class="row">${dashboardKpis(stats,profile.title).map(x=>kpiHtml(...x)).join('')}</div>
      <div class="row">${chartDefs.map((key,i)=>`<div class="col-xl-6 mb-3"><div class="amani-panel"><h5>${escapeHtml(chartTitle(key))}</h5><div class="amani-chart"><canvas id="amani-chart-${i}"></canvas></div></div></div>`).join('')}</div>
      <div class="amani-panel"><div class="d-flex justify-content-between align-items-center mb-3"><h5 class="mb-0">Recent ${escapeHtml(labelize(profile.table))}</h5><a class="btn btn-sm btn-outline-secondary" href="${resourceLink(profile.table)}">Open records</a></div>${tableHtml(recent)}</div>`;
    chartDefs.forEach((key,i)=>renderChart(`amani-chart-${i}`,key,analytics.charts?.[key]));
  } catch (error) { main.innerHTML = `${pageHeader(profile)}<div class="alert alert-danger"><strong>Live data unavailable.</strong> ${escapeHtml(error.message)}</div>`; }
}

function resourceLink(resource) {
  const entry = Object.entries(profiles).find(([,p]) => p.type==='resource' && p.resource===resource);
  return entry ? entry[0] : 'index.html';
}


let resourceMeta = null;
let currentRows = [];
let currentResource = null;
let currentMeta = null;

async function getResourceMeta(resource) {
  if (!resourceMeta) resourceMeta = (await api('/api/admin/live/resources')).data || [];
  return resourceMeta.find(x => x.key === resource);
}

function actionsCell(row) {
  if (currentMeta?.readOnly) return `<div class="amani-row-actions"><button class="btn amani-action-btn" data-action="view" data-id="${escapeHtml(row.id)}" aria-label="View">View</button></div>`;
  return `<div class="amani-row-actions">
    <button class="btn amani-action-btn" data-action="view" data-id="${escapeHtml(row.id)}" title="View" aria-label="View">View</button>
    <button class="btn amani-action-btn primary" data-action="edit" data-id="${escapeHtml(row.id)}" title="Edit" aria-label="Edit">Edit</button>
    <button class="btn amani-action-btn danger" data-action="delete" data-id="${escapeHtml(row.id)}" title="Delete" aria-label="Delete">Delete</button>
  </div>`;
}

function resourceTable(rows) {
  if (!rows.length) return '<div class="amani-empty">No records found.</div>';
  const displayRows = rows.map(row => recordForDisplay(row,currentMeta));
  const cols = chooseColumns(displayRows,7);
  return `<div class="amani-table-wrap"><table class="table amani-table"><thead><tr>${cols.map(c=>`<th>${escapeHtml(labelize(c))}</th>`).join('')}<th class="amani-actions-heading">Actions</th></tr></thead><tbody>${rows.map((row,index)=>`<tr>${cols.map(c=>`<td>${displayCell(displayRows[index][c],c)}</td>`).join('')}<td class="amani-actions-cell">${actionsCell(row)}</td></tr>`).join('')}</tbody></table></div>`;
}

const BOOLEAN_FIELDS = new Set([
  'featured','has_multiple_units','available_for_public','is_listed','is_active','is_primary','is_published',
  'is_primary_record','is_notice_given','contract_email_sent','contract_whatsapp_sent','is_verified','is_recurring',
  'is_synthetic','email_sent','whatsapp_sent'
]);

function isJsonField(field, meta) {
  return field.endsWith('_json') || field === 'metadata' ||
    (meta?.key === 'agents' && ['languages','status','specialties'].includes(field));
}

function isTechnicalField(field, meta) {
  return isJsonField(field, meta) || /template|legacy_json|is_synthetic/i.test(field);
}

function fieldsForMeta(meta, technical = false) {
  const writable = meta?.writable || [];
  if (technical) return writable;
  const required = new Set(meta?.required || []);
  return writable.filter(field => required.has(field) || !isTechnicalField(field, meta));
}

function recordForDisplay(row, meta, technical = false) {
  if (technical || !row || typeof row !== 'object') return row;
  return Object.fromEntries(Object.entries(row).filter(([field]) => !isTechnicalField(field, meta)));
}

function isNumberField(field) {
  return /amount|rent|balance|cost|price|fee|count|floors|units|bedrooms|bathrooms|toilets|kitchens|slots|depth|order|year_built|billing_day|occupant_count|square_|area_sqft|floor_no|office_rooms|attempts|bytes|delay/i.test(field);
}

function isDateField(field) {
  return /_date$|^date_of_birth$|^start_date$|^end_date$|^signed_date$|^activation_date$|^due_date$/.test(field);
}

function fieldInput(field, value, required, meta) {
  const raw = value === undefined || value === null ? '' : (typeof value === 'object' ? safeJson(value) : String(value));
  const req = required ? 'required' : '';
  if (isJsonField(field, meta)) return `<textarea class="form-control" rows="3" name="${escapeHtml(field)}" ${req}>${escapeHtml(raw)}</textarea>`;
  if (BOOLEAN_FIELDS.has(field)) return `<select class="form-select" name="${escapeHtml(field)}" ${req}><option value="">—</option><option value="true" ${raw==='true'?'selected':''}>True</option><option value="false" ${raw==='false'?'selected':''}>False</option></select>`;
  const type = isDateField(field) ? 'date' : (isNumberField(field) ? 'number' : 'text');
  const step = type === 'number' ? 'step="any"' : '';
  return `<input class="form-control" type="${type}" ${step} name="${escapeHtml(field)}" value="${escapeHtml(raw)}" ${req}>`;
}

function parseField(field, value, meta) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (BOOLEAN_FIELDS.has(field)) return text === 'true';
  if (isJsonField(field, meta)) {
    try { return JSON.parse(text); }
    catch { throw new Error(`${labelize(field)} must contain valid JSON.`); }
  }
  if (isNumberField(field) && /^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  return text;
}

function modalShell(title, body, footer='') {
  let host = document.getElementById('amani-modal-host');
  if (!host) { host = document.createElement('div'); host.id='amani-modal-host'; document.body.appendChild(host); }
  host.innerHTML = `<div class="modal fade" tabindex="-1"><div class="modal-dialog modal-xl modal-dialog-scrollable"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">${escapeHtml(title)}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body">${body}</div>${footer?`<div class="modal-footer">${footer}</div>`:''}</div></div></div>`;
  const modalEl = host.querySelector('.modal'); const modal = new bootstrap.Modal(modalEl); modal.show(); return { modal, modalEl };
}

// Readable, escaped record details for every resource (including the three enquiry inboxes).
// No endpoint, row shape, database field or update/delete operation is changed.
function detailValue(value, key = '', level = 0) {
  if (value === null || value === undefined || value === '') return '<span class="amani-detail-empty">Not provided</span>';
  if (typeof value === 'boolean') return `<span class="amani-boolean ${value ? 'yes' : 'no'}">${value ? 'Yes' : 'No'}</span>`;
  if (/_status$|^status$|^priority$/.test(key)) return statusCell(value);
  if (Array.isArray(value)) {
    if (!value.length) return '<span class="amani-detail-empty">None</span>';
    if (value.every(v => v === null || typeof v !== 'object')) {
      return `<div class="amani-detail-tags">${value.map(v => `<span>${escapeHtml(String(v ?? '—'))}</span>`).join('')}</div>`;
    }
    return `<div class="amani-detail-nested">${value.map((entry,index) => `<div class="amani-detail-nested-item"><strong>${index+1}.</strong>${detailValue(entry,'',level+1)}</div>`).join('')}</div>`;
  }
  if (typeof value === 'object') {
    if (level > 4) return '<span class="amani-detail-empty">Additional structured data</span>';
    const entries = Object.entries(value).filter(([,v]) => v !== null && v !== '');
    if (!entries.length) return '<span class="amani-detail-empty">Not provided</span>';
    return `<dl class="amani-detail-mini-grid">${entries.map(([k,v]) => `<div><dt>${escapeHtml(labelize(k))}</dt><dd>${detailValue(v,k,level+1)}</dd></div>`).join('')}</dl>`;
  }
  const text = String(value);
  if (/email/i.test(key) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return `<a href="mailto:${escapeHtml(text)}">${escapeHtml(text)}</a>`;
  if (/phone|whatsapp/i.test(key) && /^[+()\d\s-]{7,30}$/.test(text)) return `<a href="tel:${escapeHtml(text.replace(/[^+\d]/g,''))}">${escapeHtml(text)}</a>`;
  if (/amount|rent|balance|cost|price|charge|fee/i.test(key) && Number.isFinite(Number(value))) return `<strong>${escapeHtml(money(value))}</strong>`;
  if (/(_at|_date)$/.test(key) && /^\d{4}-\d{2}-\d{2}/.test(text)) {
    const dt = new Date(text);
    if (!Number.isNaN(dt.getTime())) return escapeHtml(new Intl.DateTimeFormat('en-KE',{year:'numeric',month:'short',day:'numeric',...(text.includes('T') ? {hour:'2-digit',minute:'2-digit'} : {})}).format(dt));
  }
  return `<span class="amani-detail-value">${escapeHtml(text)}</span>`;
}

function showRecord(row) {
  const clean = Object.fromEntries(Object.entries(row || {}).filter(([key]) =>
    !['search_tsv','legacy_json','deleted_at'].includes(key) && !/^password|^secret|^token/i.test(key)
  ));
  const headline = row.owner_name || row.name || row.full_name || row.title || row.unit_code || currentMeta?.label || 'Record';
  const mainMessageKey = ['message','details','description','admin_notes'].find(k => typeof row[k] === 'string' && row[k].trim());
  const contactKeys = new Set(['owner_name','name','full_name','first_name','last_name','email','phone','phone_primary','phone_secondary','whatsapp_number','subject','contact_method']);
  const contextKeys = new Set(['property_name','property_id','property_category_id','location_id','unit_id','unit_code','stories','source','preferred_visit_date','assigned_to','agent_id']);
  const auditKeys = new Set(['created_at','updated_at','status','priority']);
  const headlineKeys = new Set(['id','legacy_id']);
  if (mainMessageKey) headlineKeys.add(mainMessageKey);
  const groups = [
    { label: 'Contact information', icon: 'bi-person-lines-fill', include: key => contactKeys.has(key) },
    { label: 'Property / enquiry', icon: 'bi-building', include: key => contextKeys.has(key) },
    { label: 'Record activity', icon: 'bi-clock-history', include: key => auditKeys.has(key) },
    { label: 'Additional information', icon: 'bi-card-list', include: key => true }
  ];
  const entries = Object.entries(clean).filter(([key]) => !headlineKeys.has(key));
  const sections = groups.map(group => {
    const matching = entries.filter(([key]) => group.include(key));
    matching.forEach(([key]) => entries.splice(entries.findIndex(([k]) => k === key), 1));
    if (!matching.length) return '';
    return `<section class="amani-detail-section"><h6><i class="bi ${group.icon}" aria-hidden="true"></i>${escapeHtml(group.label)}</h6><dl class="amani-detail-grid">${matching.map(([key,value]) => `<div class="amani-detail-field"><dt>${escapeHtml(labelize(key))}</dt><dd>${detailValue(value,key)}</dd></div>`).join('')}</dl></section>`;
  }).join('');
  const message = mainMessageKey ? `<section class="amani-detail-message"><div class="amani-detail-kicker"><i class="bi bi-chat-square-text" aria-hidden="true"></i>${escapeHtml(labelize(mainMessageKey))}</div><p>${escapeHtml(row[mainMessageKey])}</p></section>` : '';
  const body = `<div class="amani-detail-view"><header class="amani-detail-hero"><div class="amani-detail-avatar"><i class="bi bi-envelope-paper" aria-hidden="true"></i></div><div class="amani-detail-heading"><div class="amani-detail-eyebrow">${escapeHtml(currentMeta?.label || labelize(currentResource || 'record'))}</div><h3>${escapeHtml(headline)}</h3><span>${row.id ? `Reference: ${escapeHtml(String(row.id))}` : 'Record details'}</span></div>${row.status ? `<div>${statusCell(row.status)}</div>` : ''}</header>${message}${sections}</div>`;
  modalShell(`${currentMeta?.label || 'Record'} details`, body, '<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Close details</button>');
}

async function showForm(meta, row=null) {
  const fields = fieldsForMeta(meta);
  const form = fields.map(field => `<div class="col-md-6 mb-3"><label class="form-label">${escapeHtml(labelize(field))}${meta.required.includes(field)?' *':''}</label>${fieldInput(field,row?.[field],meta.required.includes(field),meta)}</div>`).join('');
  const { modal, modalEl } = modalShell(row ? `Edit ${meta.label}` : `Create ${meta.label}`, `<form id="amani-record-form"><div class="row">${form}</div><div class="alert alert-danger d-none" id="amani-form-error"></div></form>`, `<button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button><button class="btn btn-primary" id="amani-save-record">Save to Amani DB</button>`);
  modalEl.querySelector('#amani-save-record').addEventListener('click', async () => {
    const formEl = modalEl.querySelector('#amani-record-form');
    if (!formEl.reportValidity()) return;
    try {
      const body = {}; const fd = new FormData(formEl);
      for (const field of fields) { const parsed = parseField(field, fd.get(field),meta); if (parsed !== null) body[field] = parsed; }
      const path = row ? `/api/admin/live/${encodeURIComponent(currentResource)}/${encodeURIComponent(row.id)}` : `/api/admin/live/${encodeURIComponent(currentResource)}`;
      await api(path,{method:row?'PATCH':'POST',body:JSON.stringify(body)});
      modal.hide(); await loadResourceRows();
    } catch (error) {
      const el=modalEl.querySelector('#amani-form-error'); el.classList.remove('d-none'); el.textContent=error.message;
    }
  });
}

async function deleteRecord(row, button) {
  const host = button?.closest('td') || button?.parentElement;
  if (!host) return;
  host.querySelector('.amani-delete-feedback')?.remove();
  const notice = document.createElement('div');
  notice.className = 'amani-delete-feedback alert alert-warning mt-2 mb-0 p-2';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  const message = document.createElement('div');
  message.className = 'small mb-2';
  message.textContent = `Delete this ${currentResource} record (ID: ${row.id})? Database constraints may prevent deletion of related records.`;
  const actions = document.createElement('div');
  actions.className = 'd-flex gap-2 flex-wrap';
  const cancel = document.createElement('button');
  cancel.type = 'button'; cancel.className = 'btn btn-sm btn-secondary'; cancel.textContent = 'Cancel';
  cancel.addEventListener('click', () => notice.remove());
  const proceed = document.createElement('button');
  proceed.type = 'button'; proceed.className = 'btn btn-sm btn-danger'; proceed.textContent = 'Confirm delete';
  proceed.addEventListener('click', async () => {
    proceed.disabled = true;
    cancel.disabled = true;
    proceed.textContent = 'Deleting…';
    try {
      await api(`/api/admin/live/${encodeURIComponent(currentResource)}/${encodeURIComponent(row.id)}`, { method: 'DELETE' });
      await loadResourceRows();
    } catch (error) {
      notice.className = 'amani-delete-feedback alert alert-danger mt-2 mb-0 p-2';
      message.textContent = `Amani delete was not completed: ${error.message}`;
      actions.remove();
    }
  });
  actions.append(cancel, proceed);
  notice.append(message, actions);
  host.appendChild(notice);
}

async function loadResourceRows(search='') {
  const table = document.getElementById('amani-resource-table'); if (!table) return;
  table.innerHTML = '<div class="amani-empty">Loading live Amani records…</div>';
  const qs = new URLSearchParams({limit:'200'}); if (search) qs.set('search',search);
  try {
    const payload = await api(`/api/admin/live/${encodeURIComponent(currentResource)}?${qs}`);
    currentRows = payload.data || [];
    table.innerHTML = resourceTable(currentRows);
    document.getElementById('amani-record-count').textContent = `${number(payload.meta?.total ?? currentRows.length)} database record(s)`;
    table.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', async () => {
      const row = currentRows.find(x => String(x.id) === btn.dataset.id); if (!row) return;
      if (btn.dataset.action==='view') showRecord(row);
      if (btn.dataset.action==='edit') await showForm(await getResourceMeta(currentResource),row);
      if (btn.dataset.action==='delete') await deleteRecord(row, btn);
    }));
  } catch (error) { table.innerHTML = `<div class="alert alert-danger">${escapeHtml(error.message)}</div>`; }
}


async function renderResource(profile) {
  currentResource = profile.resource; const main=document.getElementById('amani-main');
  try {
    const meta = await getResourceMeta(currentResource);
    currentMeta = meta;
    if (!meta) throw new Error(`Backend does not expose the Amani resource “${currentResource}”.`);
    main.innerHTML = `${pageHeader(profile, 'Admin view: operational fields and business actions only. Technical JSON/template fields are intentionally excluded from this application.')}<div class="amani-panel"><div class="d-flex gap-2 justify-content-between align-items-center flex-wrap mb-3"><div><h5 class="mb-0">${escapeHtml(meta.label)}</h5><small id="amani-record-count" class="text-muted">Loading…</small></div><div class="d-flex gap-2"><input id="amani-search" class="form-control form-control-sm" placeholder="Search live records">${meta.readOnly ? '' : '<button id="amani-create" class="btn btn-sm btn-success"><i class="bi bi-plus-lg"></i> Create</button>'}</div></div><div id="amani-resource-table"></div></div>`;
    document.getElementById('amani-create')?.addEventListener('click',()=>showForm(meta));
    let timer; document.getElementById('amani-search').addEventListener('input',e=>{clearTimeout(timer);timer=setTimeout(()=>loadResourceRows(e.target.value.trim()),250);});
    await loadResourceRows();
  } catch(error) { main.innerHTML = `${pageHeader(profile)}<div class="alert alert-danger">${escapeHtml(error.message)}</div>`; }
}


async function boot() {
  const profile = profiles[filename()] || profiles['index.html'];
  renderShell(profile); checkBackend();
  if (profile.type === 'resource') await renderResource(profile);
  else await renderDashboard(profile);
}

boot();
