const ARMORY_DETAIL_TEMPLATES = {
  uniform: {
    headgear: '', facewear: '', eyewear: '', vest: '', backpack: '', belt: '',
    handwear: '', wristwear: '', top: '', bottom: '', footwear: '', accessories: '', note: ''
  },
  weapon: {
    type: 'Primary Rifle',
    stock: '', grip: '', magazine: '', optic: '', iron_sight: '', barrel: '', handguard: '', muzzle: '', accessory: '',
    notes: '', loadout: WEAPON_WARNING
  },
  utility: { type: 'Utility', notes: '' }
};

const DETAIL_FIELDS = {
  uniform: [
    ['headgear', 'Headgear'], ['facewear', 'Facewear'], ['eyewear', 'Eyewear'], ['vest', 'Vest Setup'],
    ['backpack', 'Backpack / Panel'], ['belt', 'Belt Setup'], ['handwear', 'Handwear'], ['wristwear', 'Wrist Wear'],
    ['top', 'Top Apparel'], ['bottom', 'Bottom Apparel'], ['footwear', 'Footwear'], ['accessories', 'Accessories'], ['note', 'Notes / Restrictions']
  ],
  weapon: [
    ['type', 'Weapon Type'], ['stock', 'Stock'], ['grip', 'Grip'], ['magazine', 'Magazine'], ['optic', 'Optic'],
    ['iron_sight', 'Iron Sight / Optional'], ['barrel', 'Barrel'], ['handguard', 'Handguard'], ['muzzle', 'Muzzle Device'],
    ['accessory', 'Other Accessory'], ['notes', 'Notes / Restrictions'], ['loadout', 'Loadout Warning']
  ],
  utility: [
    ['type', 'Utility Type'], ['notes', 'Notes / Restrictions']
  ]
};

function adminClient() {
  const token = rsStoredAccessToken ? rsStoredAccessToken() : null;
  return token ? rsClientWithAccessToken(token) : rsGetClient();
}

function setAdminStatus(message, isError = false) {
  const box = document.getElementById('adminStatus');
  if (!box) return;
  box.textContent = message;
  box.classList.toggle('status-error', isError);
}

function detailFieldId(key) {
  return `detail_${key}`;
}

function renderDetailFields(type, values = {}) {
  const fields = DETAIL_FIELDS[type] || [];
  const wrap = document.getElementById('detailFields');
  if (!wrap) return;

  wrap.innerHTML = fields.map(([key, label]) => {
    const value = values[key] ?? ARMORY_DETAIL_TEMPLATES[type]?.[key] ?? '';
    const isLong = ['vest', 'backpack', 'notes', 'note', 'loadout'].includes(key);
    return `
      <label class="${isLong ? 'full' : ''}">
        <span>${escapeHtml(label)}</span>
        ${isLong
          ? `<textarea id="${detailFieldId(key)}" rows="4" placeholder="Enter ${escapeHtml(label).toLowerCase()}">${escapeHtml(value)}</textarea>`
          : `<input id="${detailFieldId(key)}" type="text" value="${escapeHtml(value)}" placeholder="Enter ${escapeHtml(label).toLowerCase()}" />`}
      </label>
    `;
  }).join('');
}

function collectDetails() {
  const type = document.getElementById('itemType').value;
  const details = {};
  (DETAIL_FIELDS[type] || []).forEach(([key]) => {
    const input = document.getElementById(detailFieldId(key));
    details[key] = (input?.value || '').trim();
  });

  // The armory display already expects weapon attachment details as one formatted text field.
  // Build it automatically so admins do not have to type JSON.
  if (type === 'weapon') {
    const attachmentOrder = [
      ['stock', 'Stock'], ['grip', 'Grip'], ['magazine', 'Magazine'], ['optic', 'Optic'],
      ['iron_sight', 'Iron Sight Optional'], ['barrel', 'Barrel'], ['handguard', 'Handguard'],
      ['muzzle', 'Muzzle Device'], ['accessory', 'Accessory']
    ];
    details.details = attachmentOrder
      .filter(([key]) => details[key])
      .map(([key, label]) => `${label}: ${details[key]}`)
      .join('; ');
  }

  return details;
}

async function adminCurrentUserId() {
  try {
    const client = adminClient();
    const { data } = await client.auth.getUser();
    return data?.user?.id || null;
  } catch {
    return null;
  }
}

async function writeAdminLog(action, itemId, snapshot = {}) {
  try {
    const client = adminClient();
    const actor = await adminCurrentUserId();
    await client.from('armory_item_logs').insert({
      action,
      item_id: itemId || null,
      item_name: snapshot.name || document.getElementById('itemName')?.value || null,
      unit_slug: snapshot.unit_slug || document.getElementById('unitSlug')?.value || null,
      item_type: snapshot.item_type || document.getElementById('itemType')?.value || null,
      actor_id: actor,
      snapshot
    });
  } catch (error) {
    console.warn('Audit log skipped:', error.message);
  }
}

function fillArmoryAdminForm(row = null) {
  const type = row?.item_type || 'uniform';
  document.getElementById('itemId').value = row?.id || '';
  document.getElementById('unitSlug').value = row?.unit_slug || 'general';
  document.getElementById('itemType').value = type;
  document.getElementById('itemName').value = row?.name || '';
  document.getElementById('itemAuthorized').value = row?.authorized || '';
  document.getElementById('itemImageUrl').value = row?.image_url || '';
  document.getElementById('itemSecondImageUrl').value = row?.second_image_url || '';
  document.getElementById('itemSort').value = row?.sort_order ?? 100;
  renderDetailFields(type, row?.details || ARMORY_DETAIL_TEMPLATES[type]);
  document.getElementById('saveItemBtn').textContent = row ? 'Update Published Item' : 'Publish Armory Item';
  document.getElementById('deleteItemBtn').style.display = row ? 'inline-flex' : 'none';
}

async function uploadArmoryImage(inputId, targetId) {
  const input = document.getElementById(inputId);
  const file = input?.files?.[0];
  if (!file) return null;

  const client = adminClient();
  const unit = document.getElementById('unitSlug').value;
  const type = document.getElementById('itemType').value;
  const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  const path = `${unit}/${type}/${Date.now()}-${cleanName}`;

  const { error } = await client.storage.from('armory').upload(path, file, { upsert: false });
  if (error) throw error;

  const { data } = client.storage.from('armory').getPublicUrl(path);
  document.getElementById(targetId).value = data.publicUrl;
  input.value = '';
  return data.publicUrl;
}

async function loadAdminArmoryItems() {
  const client = adminClient();
  const unit = document.getElementById('unitFilter')?.value || 'general';
  const list = document.getElementById('adminItemsList');
  if (!client || !list) return;

  list.innerHTML = '<p class="muted">Loading published armory items...</p>';
  const { data, error } = await client
    .from('armory_items')
    .select('*')
    .eq('unit_slug', unit)
    .order('item_type', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    list.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
    return;
  }

  if (!data || !data.length) {
    list.innerHTML = '<p class="muted">No published items yet for this armory. Use the form to add the first live item.</p>';
    return;
  }

  list.innerHTML = data.map(row => `
    <button class="admin-item-row" type="button" data-id="${row.id}">
      <strong>${escapeHtml(row.name)}</strong>
      <span>${escapeHtml(row.item_type)} · ${escapeHtml(row.authorized || 'No authorization note')} · ${row.is_active ? 'Published' : 'Hidden'}</span>
    </button>
  `).join('');

  list.querySelectorAll('.admin-item-row').forEach(button => {
    const row = data.find(item => item.id === button.dataset.id);
    button.addEventListener('click', () => fillArmoryAdminForm(row));
  });
}

async function loadAdminLogs() {
  const client = adminClient();
  const list = document.getElementById('adminLogsList');
  if (!client || !list) return;

  list.innerHTML = '<p class="muted">Loading monitor logs...</p>';
  const { data, error } = await client
    .from('armory_item_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    list.innerHTML = `<p class="muted">${escapeHtml(error.message)}. Run v43_armory_logs.sql if this table is missing.</p>`;
    return;
  }

  if (!data || !data.length) {
    list.innerHTML = '<p class="muted">No add/edit/delete logs yet.</p>';
    return;
  }

  list.innerHTML = data.map(log => `
    <div class="admin-log-row">
      <strong>${escapeHtml((log.action || '').toUpperCase())} · ${escapeHtml(log.item_name || 'Unnamed item')}</strong>
      <span>${escapeHtml(log.item_type || '')} · ${escapeHtml(log.unit_slug || '')}</span>
      <small>${new Date(log.created_at).toLocaleString()} · Actor: ${escapeHtml(log.actor_id || 'Unknown')}</small>
    </div>
  `).join('');
}

async function saveArmoryItem(event) {
  event.preventDefault();
  const client = adminClient();
  if (!client) return setAdminStatus('Supabase client not available.', true);

  try {
    await uploadArmoryImage('itemImageUpload', 'itemImageUrl');
    await uploadArmoryImage('itemSecondImageUpload', 'itemSecondImageUrl');

    const id = document.getElementById('itemId').value;
    const userId = await adminCurrentUserId();
    const payload = {
      unit_slug: document.getElementById('unitSlug').value,
      item_type: document.getElementById('itemType').value,
      name: document.getElementById('itemName').value.trim(),
      authorized: document.getElementById('itemAuthorized').value.trim(),
      image_url: document.getElementById('itemImageUrl').value.trim() || null,
      second_image_url: document.getElementById('itemSecondImageUrl').value.trim() || null,
      sort_order: Number(document.getElementById('itemSort').value || 100),
      details: collectDetails(),
      is_active: true,
      updated_by: userId,
      updated_at: new Date().toISOString()
    };

    if (!payload.name) return setAdminStatus('Name is required.', true);
    if (!payload.authorized) return setAdminStatus('Authorized Users / Units is required.', true);

    let savedId = id;
    let error = null;
    if (id) {
      ({ error } = await client.from('armory_items').update(payload).eq('id', id));
    } else {
      payload.created_by = userId;
      const result = await client.from('armory_items').insert(payload).select('id').single();
      error = result.error;
      savedId = result.data?.id || null;
    }
    if (error) throw error;

    await writeAdminLog(id ? 'update' : 'create', savedId, payload);
    setAdminStatus(id ? 'Published armory item updated.' : 'New armory item published.');
    fillArmoryAdminForm();
    document.getElementById('unitFilter').value = payload.unit_slug;
    await loadAdminArmoryItems();
    await loadAdminLogs();
  } catch (error) {
    console.error(error);
    setAdminStatus(error.message || 'Save failed.', true);
  }
}

async function deleteArmoryItem() {
  const id = document.getElementById('itemId').value;
  if (!id) return;
  if (!confirm('Delete this published armory item?')) return;

  const client = adminClient();
  const snapshot = {
    name: document.getElementById('itemName').value,
    unit_slug: document.getElementById('unitSlug').value,
    item_type: document.getElementById('itemType').value
  };
  const { error } = await client.from('armory_items').delete().eq('id', id);
  if (error) return setAdminStatus(error.message, true);
  await writeAdminLog('delete', id, snapshot);
  setAdminStatus('Published armory item deleted.');
  fillArmoryAdminForm();
  await loadAdminArmoryItems();
  await loadAdminLogs();
}

async function initArmoryAdminTools() {
  const panel = document.getElementById('adminToolsPanel');
  if (!panel) return;

  panel.innerHTML = `
    <div class="panel-heading">
      <p class="eyebrow">Live Armory Editor</p>
      <h2>Add / Edit Published Armory Items</h2>
      <p class="muted">Use the fields below instead of editing JSON. What you publish here will appear in the selected armory section.</p>
    </div>
    <div id="adminStatus" class="admin-status">Ready. Only Command, S4 - Research and Development, and Admin access keys can edit.</div>
    <div class="admin-editor-grid">
      <form id="armoryItemForm" class="admin-form">
        <input type="hidden" id="itemId" />
        <label><span>Armory Section</span><select id="unitSlug">${RS_ARMORY.map(u => `<option value="${u.slug}">${u.name}</option>`).join('')}</select></label>
        <label><span>Item Type</span><select id="itemType"><option value="uniform">Uniform</option><option value="weapon">Weapon / Arsenal</option><option value="utility">Utility</option></select></label>
        <label><span>Name</span><input id="itemName" type="text" placeholder="Example: Standard Black Uniform" required /></label>
        <label><span>Authorized Users / Units</span><input id="itemAuthorized" type="text" placeholder="Example: All verified personnel / LRR only" required /></label>
        <label><span>Main Image URL</span><input id="itemImageUrl" type="url" placeholder="Auto-filled after upload or paste URL" /></label>
        <label><span>Upload Main Image</span><input id="itemImageUpload" type="file" accept="image/*" /></label>
        <label><span>Second Image URL / Back View</span><input id="itemSecondImageUrl" type="url" placeholder="Uniform back view or optional second image" /></label>
        <label><span>Upload Second Image</span><input id="itemSecondImageUpload" type="file" accept="image/*" /></label>
        <label><span>Sort Order</span><input id="itemSort" type="number" value="100" /></label>
        <div class="admin-subheading full"><p class="eyebrow">Item Details</p><h3>Fill Details</h3></div>
        <div id="detailFields" class="admin-detail-fields full"></div>
        <div class="admin-actions">
          <button id="saveItemBtn" class="topbar-btn" type="submit">Publish Armory Item</button>
          <button id="deleteItemBtn" class="topbar-btn danger" type="button" style="display:none">Delete Published Item</button>
          <button id="resetItemBtn" class="topbar-btn ghost" type="button">Clear</button>
        </div>
      </form>
      <aside class="admin-list-panel">
        <label><span>View Published Items By Armory</span><select id="unitFilter">${RS_ARMORY.map(u => `<option value="${u.slug}">${u.shortName || u.name}</option>`).join('')}</select></label>
        <div id="adminItemsList" class="admin-items-list"></div>
        <hr class="admin-separator" />
        <div class="panel-heading small-heading"><p class="eyebrow">Monitor Logs</p><h3>Add / Edit / Delete Activity</h3></div>
        <div id="adminLogsList" class="admin-items-list admin-logs-list"></div>
      </aside>
    </div>
  `;

  fillArmoryAdminForm();
  document.getElementById('itemType').addEventListener('change', event => {
    renderDetailFields(event.target.value, ARMORY_DETAIL_TEMPLATES[event.target.value]);
  });
  document.getElementById('armoryItemForm').addEventListener('submit', saveArmoryItem);
  document.getElementById('deleteItemBtn').addEventListener('click', deleteArmoryItem);
  document.getElementById('resetItemBtn').addEventListener('click', () => fillArmoryAdminForm());
  document.getElementById('unitFilter').addEventListener('change', loadAdminArmoryItems);
  await loadAdminArmoryItems();
  await loadAdminLogs();
}
