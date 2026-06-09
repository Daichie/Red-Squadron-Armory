const ARMORY_DETAIL_TEMPLATES = {
  uniform: {
    headgear: '', helmet_attachments: '', facewear: '', eyewear: '', vest: '', backpack: '', belt: '',
    handwear: '', wristwear: '', top: '', bottom: '', footwear: '', note: ''
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
    ['headgear', 'Headgear'], ['helmet_attachments', 'Helmet Attachments'], ['facewear', 'Facewear'], ['eyewear', 'Eyewear'], ['vest', 'Vest Setup'],
    ['backpack', 'Backpack / Panel'], ['belt', 'Belt Setup'], ['handwear', 'Handwear'], ['wristwear', 'Wrist Wear'],
    ['top', 'Top Apparel'], ['bottom', 'Bottom Apparel'], ['footwear', 'Footwear'], ['note', 'Notes / Restrictions']
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


function rsConfirmDialog({ title = 'Confirm Action', message = 'Are you sure?', confirmText = 'Confirm', danger = false } = {}) {
  return new Promise(resolve => {
    let modal = document.getElementById('rsConfirmModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'rsConfirmModal';
      modal.className = 'rs-modal-overlay';
      modal.innerHTML = `
        <div class="rs-modal-card" role="dialog" aria-modal="true" aria-labelledby="rsConfirmTitle">
          <p class="eyebrow">Command Confirmation</p>
          <h3 id="rsConfirmTitle"></h3>
          <p id="rsConfirmMessage" class="rs-modal-message"></p>
          <div class="rs-modal-actions">
            <button id="rsConfirmCancel" class="admin-secondary-btn" type="button">Cancel</button>
            <button id="rsConfirmOk" class="admin-primary-btn" type="button">Confirm</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
    }

    modal.querySelector('#rsConfirmTitle').textContent = title;
    modal.querySelector('#rsConfirmMessage').textContent = message;
    const ok = modal.querySelector('#rsConfirmOk');
    const cancel = modal.querySelector('#rsConfirmCancel');
    ok.textContent = confirmText;
    ok.classList.toggle('danger-confirm', Boolean(danger));
    modal.classList.add('show');

    const finish = value => {
      modal.classList.remove('show');
      ok.onclick = null;
      cancel.onclick = null;
      resolve(value);
    };

    ok.onclick = () => finish(true);
    cancel.onclick = () => finish(false);
    modal.onclick = event => { if (event.target === modal) finish(false); };
  });
}

async function adminCurrentActor() {
  const userId = await adminCurrentUserId();
  let name = 'Unknown User';
  if (!userId) return { id: null, name };

  try {
    const client = adminClient();
    const { data } = await client
      .from('profiles')
      .select('display_name, discord_username')
      .eq('id', userId)
      .maybeSingle();
    name = data?.display_name || data?.discord_username || userId;
  } catch (error) {
    console.warn('Could not load actor display name:', error?.message || error);
    name = userId;
  }

  return { id: userId, name };
}

async function refreshEditorAccessBeforeAction() {
  if (typeof rsSyncDiscordRoles === 'function') {
    const syncResult = await rsSyncDiscordRoles();
    if (syncResult && syncResult.error) {
      console.warn('Role sync warning:', syncResult);
    }
  }

  try {
    const client = adminClient();
    const { data, error } = await client.rpc('is_armory_editor');
    if (!error && data === false) {
      throw new Error('Your Discord role is not recognized as Command, S4 - Research and Development, or Admin yet. Please logout/login again, then contact Command if this continues.');
    }
  } catch (error) {
    // Older deployments may not have the RPC yet; RLS will still protect the table.
    if (String(error?.message || '').includes('not recognized')) throw error;
    console.warn('Editor RPC check skipped:', error?.message || error);
  }
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
    const longFields = ['vest', 'backpack', 'notes', 'note', 'loadout', 'helmet_attachments'];
    const isLong = longFields.includes(key);
    const isWide = ['vest', 'backpack', 'notes', 'note', 'loadout', 'details', 'helmet_attachments'].includes(key);
    return `
      <label class="${isWide ? 'wide' : ''}">
        <span>${escapeHtml(label)}</span>
        ${isLong
          ? `<textarea id="${detailFieldId(key)}" rows="3" placeholder="Enter ${escapeHtml(label).toLowerCase()}">${escapeHtml(value)}</textarea>`
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
    const actor = await adminCurrentActor();
    await client.from('armory_item_logs').insert({
      action,
      item_id: itemId || null,
      item_name: snapshot.name || document.getElementById('itemName')?.value || null,
      unit_slug: snapshot.unit_slug || document.getElementById('unitSlug')?.value || null,
      item_type: snapshot.item_type || document.getElementById('itemType')?.value || null,
      actor_id: actor.id,
      actor_name: actor.name,
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

  const actorIds = [...new Set(data.map(log => log.actor_id).filter(Boolean))];
  const actorNames = new Map();
  if (actorIds.length) {
    try {
      const { data: profiles } = await client
        .from('profiles')
        .select('id, display_name, discord_username')
        .in('id', actorIds);
      (profiles || []).forEach(profile => {
        actorNames.set(profile.id, profile.display_name || profile.discord_username || profile.id);
      });
    } catch (error) {
      console.warn('Could not load log actor names:', error?.message || error);
    }
  }

  list.innerHTML = data.map(log => {
    const actorLabel = log.actor_name || actorNames.get(log.actor_id) || log.actor_id || 'Unknown User';
    return `
      <div class="admin-log-row">
        <strong>${escapeHtml((log.action || '').toUpperCase())} · ${escapeHtml(log.item_name || 'Unnamed item')}</strong>
        <span>${escapeHtml(log.item_type || '')} · ${escapeHtml(log.unit_slug || '')}</span>
        <small>${new Date(log.created_at).toLocaleString()} · User: ${escapeHtml(actorLabel)}</small>
      </div>
    `;
  }).join('');
}

async function saveArmoryItem(event) {
  event.preventDefault();
  const client = adminClient();
  if (!client) return setAdminStatus('Supabase client not available.', true);

  try {
    // Re-sync immediately before publishing so Command/S4/Admin roles are written
    // and the V48 RLS failsafe can read current Discord role IDs.
    await refreshEditorAccessBeforeAction();

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
  const confirmed = await rsConfirmDialog({
    title: 'Delete Published Item',
    message: 'Delete this published armory item? This action removes the item from the armory display.',
    confirmText: 'Delete Item',
    danger: true
  });
  if (!confirmed) return;

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

async function clearAdminLogs() {
  const confirmed = await rsConfirmDialog({
    title: 'Clear Monitor Logs',
    message: 'Clear all visible admin monitor logs? This will not delete published armory items.',
    confirmText: 'Clear Logs',
    danger: true
  });
  if (!confirmed) return;
  const client = adminClient();
  const { error } = await client.from('armory_item_logs').delete().not('id', 'is', null);
  if (error) return setAdminStatus(error.message || 'Unable to clear logs.', true);
  setAdminStatus('Admin monitor logs cleared.');
  await loadAdminLogs();
}

async function initArmoryAdminTools() {
  // Force sync on admin page load so user_access and profile role IDs are updated from current Discord roles.
  try {
    await refreshEditorAccessBeforeAction();
  } catch (error) {
    console.warn('Initial editor access refresh warning:', error?.message || error);
  }

  const panel = document.getElementById('adminToolsPanel');
  if (!panel) return;

  panel.innerHTML = `
    <div class="panel-heading admin-panel-title">
      <p class="eyebrow">Live Armory Editor</p>
      <h2>Add / Edit Published Armory Items</h2>
    </div>
    <div id="adminStatus" class="admin-status">Ready to publish armory items.</div>
    <div class="admin-editor-grid">
      <form id="armoryItemForm" class="admin-form">
        <input type="hidden" id="itemId" />
        <input id="itemImageUrl" type="hidden" />
        <input id="itemSecondImageUrl" type="hidden" />
        <section class="admin-section-card full">
          <div class="admin-subheading compact"><p class="eyebrow">Publish Target</p><h3>Where should this item appear?</h3></div>
          <div class="admin-form-row">
            <label><span>Armory Section</span><select id="unitSlug">${RS_ARMORY.map(u => `<option value="${u.slug}">${u.name}</option>`).join('')}</select></label>
            <label><span>Item Type</span><select id="itemType"><option value="uniform">Uniform</option><option value="weapon">Weapon / Arsenal</option><option value="utility">Utility</option></select></label>
          </div>
        </section>
        <section class="admin-section-card full">
          <div class="admin-subheading compact"><p class="eyebrow">Basic Information</p><h3>Item Identity</h3></div>
          <div class="admin-form-row">
            <label><span>Name</span><input id="itemName" type="text" placeholder="Example: Standard Black Uniform" required /></label>
            <label><span>Authorized Users / Units</span><input id="itemAuthorized" type="text" placeholder="Example: All verified personnel / LRR only" required /></label>
          </div>
        </section>
        <section class="admin-section-card full">
          <div class="admin-subheading compact"><p class="eyebrow">Images</p><h3>Upload Item Photos</h3></div>
          <div class="admin-form-row">
            <label><span>Upload Main Image</span><input id="itemImageUpload" type="file" accept="image/*" /></label>
            <label><span>Upload Second Image / Back View</span><input id="itemSecondImageUpload" type="file" accept="image/*" /></label>
          </div>
          <p class="upload-note">Images are uploaded to Supabase Storage. URLs are stored automatically after publishing.</p>
        </section>
        <section class="admin-section-card full">
          <div class="admin-form-row sort-row">
            <label><span>Sort Order</span><input id="itemSort" type="number" value="100" /></label>
            <p class="field-help">Lower number appears first. Example: 10 appears before 100.</p>
          </div>
        </section>
        <section class="admin-section-card full">
          <div class="admin-subheading compact"><p class="eyebrow">Item Details</p><h3>Fill Details</h3></div>
          <div id="detailFields" class="admin-detail-fields"></div>
        </section>
        <div class="admin-actions full">
          <button id="saveItemBtn" class="admin-primary-btn" type="submit">Publish Armory Item</button>
          <button id="deleteItemBtn" class="admin-delete-btn" type="button" style="display:none">Delete Published Item</button>
          <button id="resetItemBtn" class="admin-secondary-btn" type="button">Clear</button>
        </div>
      </form>
      <aside class="admin-list-panel">
        <label><span>View Published Items By Armory</span><select id="unitFilter">${RS_ARMORY.map(u => `<option value="${u.slug}">${u.shortName || u.name}</option>`).join('')}</select></label>
        <div id="adminItemsList" class="admin-items-list"></div>
        <hr class="admin-separator" />
        <div class="panel-heading small-heading logs-heading"><div><p class="eyebrow">Monitor Logs</p><h3>Add / Edit / Delete Activity</h3></div><button id="clearLogsBtn" class="topbar-btn danger small" type="button">Clear Logs</button></div>
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
  document.getElementById('clearLogsBtn')?.addEventListener('click', clearAdminLogs);
  await loadAdminArmoryItems();
  await loadAdminLogs();
}
