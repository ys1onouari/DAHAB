import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

let _supabasePromise = null;
let _clientError = null;

function getClient() {
  if (!_supabasePromise) {
    _supabasePromise = (async () => {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      } catch (e) {
        _clientError = e;
        return null;
      }
    })();
  }
  return _supabasePromise;
}

export const supabaseReady = getClient();

async function safeQuery(fn) {
  try {
    const supabase = await getClient();
    if (!supabase) throw _clientError || new Error('Client non initialisé');
    const { data, error } = await fn(supabase);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('Supabase —', e.message || e);
    return [];
  }
}

async function safeMutate(fn) {
  try {
    const supabase = await getClient();
    if (!supabase) throw _clientError || new Error('Client non initialisé');
    const { data, error } = await fn(supabase);
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('Supabase —', e.message || e);
    return null;
  }
}

export async function getCategories() {
  return safeQuery(sup => sup
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  );
}

export async function addCategory(name, iconSvg, sortOrder) {
  return safeMutate(sup => sup
    .from('categories')
    .insert({ name, icon_svg: iconSvg, sort_order: sortOrder })
    .select()
    .single()
  );
}

export async function updateCategory(id, updates) {
  return safeMutate(sup => sup
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  );
}

export async function deleteCategory(id) {
  try {
    const supabase = await getClient();
    if (!supabase) return;
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) console.warn('Supabase —', error.message);
  } catch (e) {
    console.warn('Supabase —', e.message || e);
  }
}

export async function getMenuItems() {
  return safeQuery(sup => sup
    .from('menu_items')
    .select('*')
    .order('id', { ascending: true })
  );
}

export async function addMenuItem(item) {
  return safeMutate(sup => sup
    .from('menu_items')
    .insert(item)
    .select()
    .single()
  );
}

export async function updateMenuItem(id, updates) {
  return safeMutate(sup => sup
    .from('menu_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  );
}

export async function deleteMenuItem(id) {
  try {
    const supabase = await getClient();
    if (!supabase) return;
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);
    if (error) console.warn('Supabase —', error.message);
  } catch (e) {
    console.warn('Supabase —', e.message || e);
  }
}

export async function uploadImage(file) {
  try {
    const supabase = await getClient();
    if (!supabase) return null;
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const resized = await resizeImage(file, 800);
    const { data, error } = await supabase.storage
      .from('dish-images')
      .upload(fileName, resized, {
        contentType: 'image/jpeg',
        upsert: false,
      });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from('dish-images')
      .getPublicUrl(data.path);
    return publicUrl;
  } catch (e) {
    console.warn('Supabase — Upload échoué :', e.message || e);
    return null;
  }
}

async function resizeImage(file, maxWidth) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = h * (maxWidth / w);
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Redimensionnement échoué'));
      }, 'image/jpeg', 0.8);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/* --- Settings --- */
export async function getSettings() {
  const rows = await safeQuery(sup => sup.from('settings').select('*'));
  const map = {};
  rows.forEach(r => { map[r.key] = r.value; });
  return map;
}

export async function upsertSettings(settings) {
  try {
    const supabase = await getClient();
    if (!supabase) return;
    const entries = Object.entries(settings);
    const rows = entries.map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
    if (error) console.warn('Supabase —', error.message);
  } catch (e) {
    console.warn('Supabase —', e.message || e);
  }
}
