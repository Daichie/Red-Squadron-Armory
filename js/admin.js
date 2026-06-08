const ARMORY_DETAIL_TEMPLATES = {
  uniform: {
    headgear: '', facewear: '', eyewear: '', vest: '', backpack: '', belt: '',
    handwear: '', wristwear: '', top: '', bottom: '', footwear: '', accessories: '', note: ''
  },
  weapon: {
    type: 'Primary Rifle', details: 'Stock: ; Grip: ; Magazine: ; Optic: ; Barrel: ; Handguard: ; Muzzle Device: ;', notes: '', loadout: WEAPON_WARNING
  },
  utility: {
    type: 'Utility', notes: ''
  }
};

function adminClient() {
  const token = rsStoredAccessToken ? rsStoredAccessToken() : null;
  return token ? rsClientWithAccessToken(token) : rsGetClient();
}

function detailsTemplate(type) {
  return JSON.stringify(ARMORY_DETAIL_TEMPLATES[type] || {}, null, 2);
}

function setAdminStatus(message, isError = false) {
  const box = document.getElementById('adminStatus');
  if (!box) return;
  box.textContent = message;
  box.classList.toggle('status-error', isError);
}

function fillArmoryAdminForm(row = null) {
  document.getElementById('itemId').value = row?.id || '';
  document.getElementById('unitSlug').value = row?.unit_slug || getCurrentSlug();
  document.getElementById('itemType').value = row?.item_type || 'uniform';
  document.getElementById('itemName').value = row?.name || '';
  document.getElementById('itemAuthorized').value = row?.authorized || '';
  document.getElementById('itemImageUrl').value = row?.image_url || '';
  document.getElementById('itemSecondImageUrl').value = row?.second_image_url || '';
  document.getElementById('itemSort').value = row?.sort_order ?? 100;
  document.getElementById('itemDetails').value = row ? JSON.stringify(row.details || {}, null, 2) : detailsTemplate('uniform');
  document.getElementById('saveItemBtn').textContent = row ? 'Update Armory Item' : 'Add Armory Item';
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

  list.innerHTML = '<p class="muted">Loading armory items...</p>';
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
    list.innerHTML = '<p class="muted">No Supabase-created items yet for this armory. Static default items are still shown on the public armory page.</p>';
    return;
  }

  list.innerHTML = data.map(row => `
    <button class="admin-item-row" type="button" data-id="${row.id}">
      <strong>${escapeHtml(row.name)}</strong>
      <span>${escapeHtml(row.item_type)} · ${escapeHtml(row.authorized || 'No authorization note')} · ${row.is_active ? 'Active' : 'Hidden'}</span>
    </button>
  `).join('');

  list.querySelectorAll('.admin-item-row').forEach(button => {
    const row = data.find(item => item.id === button.dataset.id);
    button.addEventListener('click', () => fillArmoryAdminForm(row));
  });
}

async function saveArmoryItem(event) {
  event.preventDefault();
  const client = adminClient();
  if (!client) return setAdminStatus('Supabase client not available.', true);

  try {
    await uploadArmoryImage('itemImageUpload', 'itemImageUrl');
    await uploadArmoryImage('itemSecondImageUpload', 'itemSecondImageUrl');

    let details = {};
    try {
      details = JSON.parse(document.getElementById('itemDetails').value || '{}');
    } catch {
      return setAdminStatus('Details must be valid JSON.', true);
    }

    const id = document.getElementById('itemId').value;
    const payload = {
      unit_slug: document.getElementById('unitSlug').value,
      item_type: document.getElementById('itemType').value,
      name: document.getElementById('itemName').value.trim(),
      authorized: document.getElementById('itemAuthorized').value.trim(),
      image_url: document.getElementById('itemImageUrl').value.trim() || null,
      second_image_url: document.getElementById('itemSecondImageUrl').value.trim() || null,
      sort_order: Number(document.getElementById('itemSort').value || 100),
      details,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    if (!payload.name) return setAdminStatus('Name is required.', true);

    const query = id
      ? client.from('armory_items').update(payload).eq('id', id)
      : client.from('armory_items').insert(payload);

    const { error } = await query;
    if (error) throw error;

    setAdminStatus(id ? 'Armory item updated.' : 'New armory item added.');
    fillArmoryAdminForm();
    document.getElementById('unitFilter').value = payload.unit_slug;
    await loadAdminArmoryItems();
  } catch (error) {
    console.error(error);
    setAdminStatus(error.message || 'Save failed.', true);
  }
}

async function deleteArmoryItem() {
  const id = document.getElementById('itemId').value;
  if (!id) return;
  if (!confirm('Delete this Supabase armory item? Static defaults will not be affected.')) return;

  const client = adminClient();
  const { error } = await client.from('armory_items').delete().eq('id', id);
  if (error) return setAdminStatus(error.message, true);
  setAdminStatus('Armory item deleted.');
  fillArmoryAdminForm();
  await loadAdminArmoryItems();
}

async function initArmoryAdminTools() {
  const panel = document.getElementById('adminToolsPanel');
  if (!panel) return;

  panel.innerHTML = `
    <div class="panel-heading">
      <p class="eyebrow">Live Armory Editor</p>
      <h2>Add / Edit Supabase Armory Items</h2>
    </div>
    <div id="adminStatus" class="admin-status">Ready. Only Command, S4 - Research and Development, and Admin access keys can edit.</div>
    <div class="admin-editor-grid">
      <form id="armoryItemForm" class="admin-form">
        <input type="hidden" id="itemId" />
        <label><span>Armory Section</span><select id="unitSlug">${RS_ARMORY.map(u => `<option value="${u.slug}">${u.name}</option>`).join('')}</select></label>
        <label><span>Item Type</span><select id="itemType"><option value="uniform">Uniform</option><option value="weapon">Weapon / Arsenal</option><option value="utility">Utility</option></select></label>
        <label><span>Name</span><input id="itemName" type="text" placeholder="Example: Standard Black Uniform" required /></label>
        <label><span>Authorized Users / Units</span><input id="itemAuthorized" type="text" placeholder="Example: All verified personnel" /></label>
        <label><span>Main Image URL</span><input id="itemImageUrl" type="url" placeholder="Auto-filled after upload or paste URL" /></label>
        <label><span>Upload Main Image</span><input id="itemImageUpload" type="file" accept="image/*" /></label>
        <label><span>Second Image URL / Back View</span><input id="itemSecondImageUrl" type="url" placeholder="Uniform back view or optional second image" /></label>
        <label><span>Upload Second Image</span><input id="itemSecondImageUpload" type="file" accept="image/*" /></label>
        <label><span>Sort Order</span><input id="itemSort" type="number" value="100" /></label>
        <label class="full"><span>Details JSON</span><textarea id="itemDetails" rows="12"></textarea></label>
        <div class="admin-actions">
          <button id="saveItemBtn" class="topbar-btn" type="submit">Add Armory Item</button>
          <button id="deleteItemBtn" class="topbar-btn danger" type="button" style="display:none">Delete</button>
          <button id="resetItemBtn" class="topbar-btn ghost" type="button">Clear</button>
        </div>
      </form>
      <aside class="admin-list-panel">
        <label><span>View Supabase Items By Armory</span><select id="unitFilter">${RS_ARMORY.map(u => `<option value="${u.slug}">${u.shortName || u.name}</option>`).join('')}</select></label>
        <div id="adminItemsList" class="admin-items-list"></div>
      </aside>
    </div>
  `;

  fillArmoryAdminForm();
  document.getElementById('itemType').addEventListener('change', event => {
    document.getElementById('itemDetails').value = detailsTemplate(event.target.value);
  });
  document.getElementById('armoryItemForm').addEventListener('submit', saveArmoryItem);
  document.getElementById('deleteItemBtn').addEventListener('click', deleteArmoryItem);
  document.getElementById('resetItemBtn').addEventListener('click', () => fillArmoryAdminForm());
  document.getElementById('unitFilter').addEventListener('change', loadAdminArmoryItems);
  await loadAdminArmoryItems();
}
