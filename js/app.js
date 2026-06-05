async function requirePreviewSession() {
  return await rsRequireAuth();
}

function getCurrentSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get('unit') || params.get('section') || 'general';
}

function getUnit(slug) {
  return RS_ARMORY.find(unit => unit.slug === slug) || RS_ARMORY[0];
}


function accessKeyForUnit(unit) {
  const map = {
    'general': 'general',
    'scout-ranger': 'src',
    'lrr': 'lrr',
    'kalasag': 'kalasag',
    'haribon': 'haribon',
    'uav-operator': 'uav_operator',
    'marksman': 'marksman',
    'combat-medic': 'combat_medic',
    'rto': 'rto'
  };
  return map[unit.slug] || unit.slug;
}

function rsIsLocalPreviewMode() {
  return (
    RS_SUPABASE_CONFIG.enableLocalPreview ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
  );
}

function userCanAccessUnit(unit, allowedKeys) {
  if (unit.slug === 'general') return true;

  // Local testing fallback only. Deployed website must fail-closed.
  if (!allowedKeys) return rsIsLocalPreviewMode();

  const normalizedKeys = allowedKeys
    .map(item => typeof item === 'string' ? item : item.access_key)
    .filter(Boolean);

  const key = accessKeyForUnit(unit);
  return normalizedKeys.includes(key) || normalizedKeys.includes('admin');
}

async function getAllowedAccessKeysForUI() {
  try {
    await rsSyncDiscordRoles();
    const allowed = await rsGetAllowedSections();

    if (!allowed) {
      return rsIsLocalPreviewMode() ? null : [];
    }

    return allowed
      .map(item => item.access_key || item)
      .filter(Boolean);
  } catch (error) {
    console.warn('Access check failed:', error);
    return rsIsLocalPreviewMode() ? null : [];
  }
}



async function rsUserHasAdminAccess() {
  const localOAuth = localStorage.getItem("rsArmoryDiscordAuth");
  if (localOAuth === "authorized" || RS_SUPABASE_CONFIG.enableLocalPreview) return true;

  const allowed = await rsGetAllowedSections();
  if (!allowed) return false;

  return allowed.some(item => (item.access_key || item) === "admin");
}


function rsUserCanSeeAdminLink() {
  if (rsIsLocalPreviewMode()) return true;

  try {
    const raw = localStorage.getItem("rsArmoryAccessKeys");
    if (!raw) return false;
    const keys = JSON.parse(raw);
    return Array.isArray(keys) && keys.includes("admin");
  } catch {
    return false;
  }
}

function renderSidebar(activeSlug) {
  const nav = document.getElementById('sidebarNav');
  if (!nav) return;
  nav.innerHTML = `
    <a class="${activeSlug === 'dashboard' ? 'active' : ''}" href="dashboard.html">Dashboard</a>
    ${RS_ARMORY.map(unit => `<a class="${activeSlug === unit.slug ? 'active' : ''}" href="armory.html?unit=${unit.slug}">${unit.shortName || unit.name}</a>`).join('')}
    ${rsUserCanSeeAdminLink() ? '<a href="admin.html">Admin Panel</a>' : ''}
  `;
  const signOut = document.getElementById('signOutBtn');
  if (signOut) {
    signOut.addEventListener('click', rsSignOut);
  }
}

async function renderDashboard() {
  const grid = document.getElementById('armoryGrid');
  if (!grid) return;

  const allowedKeys = await getAllowedAccessKeysForUI();

  grid.innerHTML = RS_ARMORY.map(unit => {
    const unlocked = userCanAccessUnit(unit, allowedKeys);
    const cardContent = `
      <div class="card-media" style="background-image:url('${unit.cover}')">
        ${!unlocked ? '<span class="lock-badge">Locked</span>' : ''}
      </div>
      <div class="card-body">
        <p>${unit.label}</p>
        <h3>${unit.name}</h3>
        <span>${unlocked ? unit.description : 'Access restricted based on Discord role clearance.'}</span>
      </div>
    `;

    if (unlocked) {
      return `<a class="armory-card" href="armory.html?unit=${unit.slug}">${cardContent}</a>`;
    }

    return `<button class="armory-card locked-card" type="button" onclick="showLockedNotice(${JSON.stringify(unit.name)})">${cardContent}</button>`;
  }).join('');
}


function showLockedNotice(name) {
  alert(`${name} is locked for this account. Access will be granted automatically when the matching Discord role is detected.`);
}

async function renderArmoryPage() {
  const slug = getCurrentSlug();
  const unit = getUnit(slug);

  const allowedKeys = await getAllowedAccessKeysForUI();
  if (!userCanAccessUnit(unit, allowedKeys)) {
    document.getElementById('unitKicker').textContent = 'Restricted Access';
    document.getElementById('unitTitle').textContent = 'Armory Locked';
    document.getElementById('unitHero').innerHTML = `
      <div class="locked-panel">
        <h2>${unit.name}</h2>
        <p>This armory is locked for your current account. The system will unlock it automatically when your matching Discord role is detected.</p>
        <a class="topbar-btn" href="dashboard.html">Back to Dashboard</a>
      </div>
    `;
    const tabs = document.querySelector('.section-tabs');
    if (tabs) tabs.style.display = 'none';
    const panel = document.getElementById('contentPanel');
    if (panel) panel.innerHTML = '';
    return;
  }

  document.getElementById('unitKicker').textContent = unit.label;
  document.getElementById('unitTitle').textContent = unit.name;
  document.title = `${unit.name} | Red Squadron`;

  document.getElementById('unitHero').innerHTML = `
    <button class="unit-cover clickable-image" data-src="${unit.cover}" data-caption="${unit.name}" style="background-image:url('${unit.cover}')" type="button" aria-label="Open ${unit.name} image preview"></button>
    <div class="unit-copy">
      <p class="eyebrow">${unit.shortName || 'Armory'}</p>
      <h2>${unit.description}</h2>
      <div class="unit-meta two-meta">
        <div><strong>Access</strong><span>${unit.access}</span></div>
        <div><strong>Sections</strong><span>Uniforms / Weapons / Utilities</span></div>
      </div>
    </div>
  `;

  bindImagePreview();
  setActiveTab('uniforms', unit);
  document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => setActiveTab(button.dataset.tab, unit));
  });
}

function setActiveTab(tab, unit) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  const panel = document.getElementById('contentPanel');
  if (tab === 'uniforms') panel.innerHTML = renderUniforms(unit.uniforms);
  if (tab === 'weapons') panel.innerHTML = renderWeapons(unit.weapons);
  if (tab === 'utilities') panel.innerHTML = renderUtilities(unit.utilities);

  if (tab === 'weapons') bindWeaponSelectors();
  bindImagePreview();
}


function renderUniforms(items) {
  return `
    <div class="panel-heading"><p class="eyebrow">Uniform Standards</p><h2>Uniform Categories & Required Setup</h2></div>
    <div class="uniform-stack">
      ${items.map(item => `
        <article class="uniform-card">
          <div class="image-column">
            ${imageButton(item.uniformImage, `${item.name} front view`, 'Front View')}
            ${imageButton(item.wornImage, `${item.name} back view`, 'Back View')}
          </div>
          <div class="detail-column">
            <div class="entry-header"><h3>${item.name}</h3><span>${item.authorized}</span></div>
            <div class="detail-grid uniform-detail-grid">
              ${detail('Headgear', item.headgear)}
              ${detail('Facewear', item.facewear)}
              ${detail('Eyewear', item.eyewear)}
              ${detail('Vest Setup', item.vest)}
              ${detail('Backpack / Panel', item.backpack)}
              ${detail('Belt Setup', item.belt)}
              ${detail('Handwear', item.handwear)}
              ${detail('Wrist Wear', item.wristwear)}
              ${detail('Top Apparel', item.top)}
              ${detail('Bottom Apparel', item.bottom)}
              ${detail('Footwear', item.footwear)}
              ${detail('Accessories', item.accessories)}
              ${detail('Notes / Restrictions', item.note)}
              ${detail('Authorized Users / Units', item.authorized)}
              ${item.temporaryImageNote ? detail('Image Status', item.temporaryImageNote) : ''}
            </div>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}


function getWeaponCategory(item) {
  const text = `${item.type || ''} ${item.name || ''}`.toLowerCase();

  if (text.includes('secondary') || text.includes('pistol') || text.includes('sidearm')) return 'Secondaries';
  if (text.includes('melee') || text.includes('bayonet')) return 'Melee';
  if (text.includes('smg') || text.includes('mp5') || text.includes('ump')) return 'SMGs';
  if (text.includes('support') || text.includes('m249')) return 'Support Weapons';
  if (text.includes('sniper') || text.includes('marksman') || text.includes('l115')) return 'Sniper / Marksman';
  return 'Primaries';
}

function weaponCategoryOrder(category) {
  const order = {
    'Primaries': 1,
    'SMGs': 2,
    'Support Weapons': 3,
    'Sniper / Marksman': 4,
    'Secondaries': 5,
    'Melee': 6
  };
  return order[category] || 99;
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


function renderWeapons(items) {
  const categories = [...new Set(items.map(getWeaponCategory))]
    .sort((a, b) => weaponCategoryOrder(a) - weaponCategoryOrder(b));

  const defaultCategory = categories[0] || 'All';
  const categoryItems = items.filter(item => getWeaponCategory(item) === defaultCategory);
  const defaultWeapon = categoryItems[0]?.name || items[0]?.name || '';

  return `
    <div class="panel-heading weapon-page-heading">
      <p class="eyebrow">Authorized Arsenal</p>
      <h2>Weapons / Armaments</h2>
    </div>

    <div class="weapon-filter-bar">
      <label>
        <span>Weapon Category</span>
        <select id="weaponCategorySelect">
          ${categories.map(category => `<option value="${escapeHtml(category)}" ${category === defaultCategory ? 'selected' : ''}>${escapeHtml(category)}</option>`).join('')}
        </select>
      </label>

      <label>
        <span>Weapon Selection</span>
        <select id="weaponSelect">
          ${categoryItems.map(item => `<option value="${escapeHtml(item.name)}" ${item.name === defaultWeapon ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}
        </select>
      </label>
    </div>

    <div class="weapon-grid">
      ${items.map(item => weaponCard(item)).join('')}
    </div>
  `;
}

function renderUtilities(items) {
  return `
    <div class="panel-heading"><p class="eyebrow">Mission Support</p><h2>Utilities</h2></div>
    <div class="record-grid">
      ${items.map(item => recordCard(item.image, item.name, [
        ['Utility Type', item.type], ['Authorized Unit / Personnel', item.authorized], ['Notes / Restrictions', item.notes]
      ])).join('')}
    </div>
  `;
}

function imageButton(src, caption, label) {
  return `<button class="image-tile clickable-image" data-src="${src}" data-caption="${caption}" type="button"><img src="${src}" alt="${caption}" /><span>${label}</span></button>`;
}


function formatDetailValue(label, value) {
  if (!value) return '<span>N/A</span>';

  const text = String(value).trim();

  if (label === 'Attachment Details') {
    const parts = text
      .split(';')
      .map(part => part.trim())
      .filter(Boolean);

    if (parts.length > 1) {
      return `<ul class="spec-list">${parts.map(part => {
        const splitAt = part.indexOf(':');
        if (splitAt > -1) {
          const key = part.slice(0, splitAt).trim();
          const detail = part.slice(splitAt + 1).trim();
          return `<li><strong>${key}</strong><span>${detail || 'N/A'}</span></li>`;
        }
        return `<li><span>${part}</span></li>`;
      }).join('')}</ul>`;
    }
  }

  return `<span>${text}</span>`;
}

function attachmentDetails(value) {
  return `<div class="attachment-panel">${formatDetailValue('Attachment Details', value)}</div>`;
}

function detail(label, value) {
  return `<div class="detail-box"><strong>${label}</strong>${formatDetailValue(label, value)}</div>`;
}

function recordCard(src, title, rows) {
  return `
    <article class="record-card">
      ${imageButton(src, `${title} preview`, 'Click to Expand')}
      <div class="record-details">
        <h3>${title}</h3>
        ${rows.map(([label, value]) => detail(label, value)).join('')}
      </div>
    </article>
  `;
}


function weaponCard(item) {
  const category = getWeaponCategory(item);
  return `
    <article class="weapon-card" data-category="${escapeHtml(category)}" data-weapon="${escapeHtml(item.name)}">
      <div class="weapon-title-row">
        <h3>${item.name}</h3>
        <span>${item.authorized}</span>
      </div>

      <div class="weapon-photo-wrap">
        ${imageButton(item.image, `${item.name} preview`, 'Click to Expand')}
      </div>

      <div class="weapon-details">
        <div class="weapon-meta-grid">
          ${detail('Weapon Type', item.type)}
          ${detail('Authorized Unit', item.authorized)}
        </div>

        <section class="weapon-detail-section">
          <h4>Attachment Details</h4>
          ${attachmentDetails(item.details || item.notes)}
        </section>

        <div class="weapon-detail-section weapon-notes-grid">
          ${detail('Notes / Restrictions', item.notes)}
          ${detail('Standard Warning', item.loadout)}
        </div>
      </div>
    </article>
  `;
}


function bindWeaponSelectors() {
  const categorySelect = document.getElementById('weaponCategorySelect');
  const weaponSelect = document.getElementById('weaponSelect');
  const cards = [...document.querySelectorAll('.weapon-card')];

  if (!categorySelect || !weaponSelect || !cards.length) return;

  function updateWeaponOptions() {
    const category = categorySelect.value;
    const matchingCards = cards.filter(card => card.dataset.category === category);

    weaponSelect.innerHTML = matchingCards
      .map(card => `<option value="${escapeHtml(card.dataset.weapon)}">${escapeHtml(card.dataset.weapon)}</option>`)
      .join('');

    if (matchingCards[0]) {
      weaponSelect.value = matchingCards[0].dataset.weapon;
    }

    updateVisibleWeapon();
  }

  function updateVisibleWeapon() {
    const category = categorySelect.value;
    const weapon = weaponSelect.value;

    cards.forEach(card => {
      const visible = card.dataset.category === category && card.dataset.weapon === weapon;
      card.classList.toggle('is-hidden', !visible);
    });

    bindImagePreview();
  }

  categorySelect.addEventListener('change', updateWeaponOptions);
  weaponSelect.addEventListener('change', updateVisibleWeapon);

  updateVisibleWeapon();
}


function bindImagePreview() {
  const modal = document.getElementById('imageModal');
  if (!modal) return;
  const modalImg = document.getElementById('modalImage');
  const modalCaption = document.getElementById('modalCaption');
  document.querySelectorAll('.clickable-image').forEach(el => {
    el.onclick = () => {
      modalImg.src = el.dataset.src;
      modalCaption.textContent = el.dataset.caption || 'Image preview';
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    };
  });
  document.getElementById('modalClose').onclick = closeModal;
  modal.onclick = event => { if (event.target === modal) closeModal(); };
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}
