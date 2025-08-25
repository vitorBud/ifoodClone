// ifood-clone-app.js — base sólida, organizada em camadas, com integração ao Supabase
// Uso: <script type="module" src="/js/ifood-clone-app.js"></script>
// Requer navegadores modernos (ESM) e um projeto Supabase configurado.
// -----------------------------------------------------------------------------
// 1) IMPORTS E CONFIG
// -----------------------------------------------------------------------------
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// TODO: substitua pelos valores do seu projeto Supabase
const SUPABASE_URL = 'https://epzgwoujykafwgrvhtbf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwemd3b3VqeWthZndncnZodGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMjkzNzIsImV4cCI6MjA3MTcwNTM3Mn0.beGx4fJ70KarCaYTL7iHxbIqPwq6o4kW9uI_39ixEe4';

// Tabelas esperadas (sugestão de colunas)
// profiles: { id (uuid, pk) , full_name text, created_at }
// categories: { id uuid/pk, name text, color hex, icon (fa-class) }
// restaurants: { id uuid/pk, name text, cuisine text, image_url text, rating numeric, delivery_time text, delivery_fee numeric, min_order numeric, category_id fk }
// products: { id uuid/pk, restaurant_id fk, name text, price numeric, image_url text, description text }
// offers: { id uuid/pk, title text, description text, image_url text, cta text }
// orders: { id uuid/pk, user_id fk, restaurant_id fk, total numeric, status text, created_at }
// order_items: { id uuid/pk, order_id fk, product_id fk, name text, price numeric, qty int }

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -----------------------------------------------------------------------------
// 2) UTILITÁRIOS
// -----------------------------------------------------------------------------
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const fmtBRL = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const debounce = (fn, ms = 300) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };

const toast = (msg, type = 'info') => {
  let box = $('[data-toast-container]');
  if (!box) {
    box = document.createElement('div');
    box.setAttribute('data-toast-container', '');
    box.style.cssText = `position:fixed;right:16px;bottom:16px;display:flex;flex-direction:column;gap:8px;z-index:9999;`;
    document.body.appendChild(box);
  }
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `padding:10px 14px;border-radius:10px;background:${type==='error'?'#ffebee':'#e8f5e9'};color:${type==='error'?'#b71c1c':'#1b5e20'};box-shadow:0 6px 20px rgba(0,0,0,.12);font:500 14px/1.2 system-ui;`;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3200);
};

const skeleton = (w = '100%', h = '120px', r = '12px') => {
  const s = document.createElement('div');
  s.style.cssText = `width:${w};height:${h};border-radius:${r};background:linear-gradient(90deg,#eee,#f5f5f5,#eee);background-size:200% 100%;animation:sk 1.2s infinite;`;
  s.innerHTML = `<style>@keyframes sk{0%{background-position:0 0}100%{background-position:-200% 0}}</style>`;
  return s;
};

// -----------------------------------------------------------------------------
// 3) ESTADO + CARRINHO (localStorage)
// -----------------------------------------------------------------------------
const CART_KEY = 'ifood_cart_v1';

const State = {
  user: null,
  session: null,
  cart: { items: [] }, // [{product_id, name, price, qty, image_url, restaurant_id}]
  currentRestaurantId: null,
};

const Cart = {
  load() { try { State.cart = JSON.parse(localStorage.getItem(CART_KEY) || '{"items":[]}'); } catch { State.cart = { items: [] }; } },
  save() { localStorage.setItem(CART_KEY, JSON.stringify(State.cart)); },
  total() { return State.cart.items.reduce((acc, it) => acc + (it.price * it.qty), 0); },
  count() { return State.cart.items.reduce((acc, it) => acc + it.qty, 0); },
  clear() { State.cart.items = []; State.currentRestaurantId = null; this.save(); PubSub.emit('cart:changed'); },
  add(product, qty = 1) {
    if (!product?.restaurant_id) return;
    if (State.currentRestaurantId && State.currentRestaurantId !== product.restaurant_id && State.cart.items.length) {
      const proceed = confirm('Seu carrinho tem itens de outro restaurante. Limpar e adicionar este item?');
      if (!proceed) return; this.clear();
    }
    State.currentRestaurantId = product.restaurant_id;
    const found = State.cart.items.find((i) => i.product_id === product.id);
    if (found) found.qty += qty; else State.cart.items.push({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      qty,
      image_url: product.image_url || '',
      restaurant_id: product.restaurant_id,
    });
    this.save(); PubSub.emit('cart:changed'); toast('Adicionado ao carrinho!');
  },
  remove(productId) { State.cart.items = State.cart.items.filter(i => i.product_id !== productId); if(!State.cart.items.length) State.currentRestaurantId=null; this.save(); PubSub.emit('cart:changed'); },
  inc(productId) { const it = State.cart.items.find(i=>i.product_id===productId); if (it){ it.qty++; this.save(); PubSub.emit('cart:changed'); } },
  dec(productId) { const it = State.cart.items.find(i=>i.product_id===productId); if (it){ it.qty = Math.max(1, it.qty-1); this.save(); PubSub.emit('cart:changed'); } },
};
Cart.load();

// -----------------------------------------------------------------------------
// 4) EVENT BUS (Pub/Sub)
// -----------------------------------------------------------------------------
const PubSub = (() => {
  const events = new Map();
  return {
    on(name, cb) { if (!events.has(name)) events.set(name, new Set()); events.get(name).add(cb); },
    off(name, cb) { events.get(name)?.delete(cb); },
    emit(name, data) { events.get(name)?.forEach((cb) => cb(data)); },
  };
})();

// -----------------------------------------------------------------------------
// 5) CAMADA DE DADOS (Supabase)
// -----------------------------------------------------------------------------
const DB = {
  // AUTH
  async getSession() { const { data } = await supabase.auth.getSession(); State.session = data.session; State.user = data.session?.user ?? null; return data.session; },
  onAuth(fn) { return supabase.auth.onAuthStateChange((_ev, session)=>{ State.session = session; State.user = session?.user ?? null; fn?.(session); }); },
  async signIn(email, password) { const { data, error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; return data; },
  async signUp(email, password, full_name='') { const { data, error } = await supabase.auth.signUp({ email, password }); if (error) throw error; if (data.user) await DB.ensureProfile(data.user.id, full_name); return data; },
  async signOut(){ await supabase.auth.signOut(); toast('Você saiu.'); },
  async ensureProfile(user_id, full_name=''){ const { data: existing } = await supabase.from('profiles').select('*').eq('id', user_id).maybeSingle(); if (!existing) { const { error } = await supabase.from('profiles').insert({ id:user_id, full_name }); if (error) console.error(error); } },

  // CATÁLOGO
  async listCategories(){ const { data, error } = await supabase.from('categories').select('*').order('name'); if (error) throw error; return data || []; },
  async listRestaurants({ category_id, search }={}){ let q = supabase.from('restaurants').select('*').order('name'); if (category_id) q = q.eq('category_id', category_id); if (search) q = q.ilike('name', `%${search}%`); const { data, error } = await q; if (error) throw error; return data || []; },
  async getRestaurant(id){ const { data, error } = await supabase.from('restaurants').select('*').eq('id', id).maybeSingle(); if (error) throw error; return data; },
  async listProductsByRestaurant(restaurant_id){ const { data, error } = await supabase.from('products').select('*').eq('restaurant_id', restaurant_id).order('name'); if (error) throw error; return data || []; },
  async listOffers(){ const { data, error } = await supabase.from('offers').select('*').order('id'); if (error) throw error; return data || []; },
};

// -----------------------------------------------------------------------------
// 6) UI: RENDERIZAÇÃO
// -----------------------------------------------------------------------------
const UI = {
  initNavbar() {
    // Atualiza contadores (ícone carrinho topo e flutuante)
    const cartLink = $('.navbar .cart-link');
    if (cartLink && !cartLink.querySelector('.cart-badge')) {
      const b = document.createElement('span');
      b.className = 'cart-badge';
      b.style.cssText = 'display:inline-flex;min-width:18px;height:18px;padding:0 6px;border-radius:9px;background:#e53935;color:#fff;font:600 12px/18px system-ui;vertical-align:top;margin-left:6px;justify-content:center;align-items:center;';
      cartLink.appendChild(b);
    }
    const updateCounts = () => {
      const count = Cart.count();
      const b = $('.navbar .cart-link .cart-badge'); if (b) b.textContent = String(count);
      const floatIcon = $('.floating-cart .cart-icon');
      if (floatIcon) {
        floatIcon.setAttribute('data-count', count);
        floatIcon.style.position = 'relative';
        let badge = floatIcon.querySelector('[data-badge]');
        if (!badge) { badge = document.createElement('span'); badge.setAttribute('data-badge',''); badge.style.cssText='position:absolute;top:-6px;right:-6px;background:#e53935;color:#fff;border-radius:10px;min-width:18px;height:18px;padding:0 6px;font:600 12px/18px system-ui;display:flex;justify-content:center;align-items:center;'; floatIcon.appendChild(badge); }
        badge.textContent = String(count);
      }
    };
    updateCounts();
    PubSub.on('cart:changed', updateCounts);
  },

  async renderCategories(container) {
    if (!container) return;
    // se a página já tem categorias estáticas, deixamos como fallback
    const cats = await DB.listCategories().catch(() => []);
    if (!cats.length) return;
    container.innerHTML = '';
    cats.forEach(c => {
      const item = document.createElement('div');
      item.className = 'category-item';
      item.style.cursor = 'pointer';
      item.innerHTML = `
        <div class="category-icon" style="background-color:${c.color || '#FF6B6B'}">
          <i class="${c.icon || 'fas fa-utensils'}"></i>
        </div>
        <span>${c.name}</span>
      `;
      item.addEventListener('click', () => Router.applyFilter({ category_id: c.id }));
      container.appendChild(item);
    });
  },

  cardRestaurant(r) {
    const fee = r.delivery_fee != null ? fmtBRL(r.delivery_fee) : 'R$ 0,00';
    const min = r.min_order != null ? fmtBRL(r.min_order) : 'R$ 0,00';
    const img = r.image_url || 'images/restaurant1.jpg';
    const rating = r.rating != null ? Number(r.rating).toFixed(1) : '4.8';
    const time = r.delivery_time || '';
    const a = document.createElement('a');
    a.href = `restaurant.html?id=${encodeURIComponent(r.id)}`;
    a.innerHTML = `
      <div class="restaurant-card">
        <div class="restaurant-image" style="background-image:url('${img}')">
          ${time ? `<span class="delivery-time">${time}</span>` : ''}
          <span class="rating">${rating} <i class="fas fa-star"></i></span>
        </div>
        <div class="restaurant-info">
          <h3>${r.name}</h3>
          <p class="cuisine">${r.cuisine || ''}</p>
          <p class="delivery-fee">Taxa de entrega: ${fee}</p>
          <p class="min-order">Mínimo: ${min}</p>
        </div>
      </div>`;
    return a;
  },

  async renderRestaurants(container, { category_id, search } = {}) {
    if (!container) return;
    container.innerHTML = '';
    const skBox = skeleton('100%', '180px'); container.appendChild(skBox);
    try {
      const list = await DB.listRestaurants({ category_id, search });
      container.innerHTML = '';
      if (!list.length) { container.innerHTML = '<p style="padding:12px">Nenhum restaurante encontrado.</p>'; return; }
      const frag = document.createDocumentFragment();
      list.forEach(r => frag.appendChild(UI.cardRestaurant(r)));
      container.appendChild(frag);
    } catch (e) {
      console.error(e); container.innerHTML = '<p style="padding:12px">Erro ao carregar restaurantes.</p>';
    }
  },

  async renderOffers(container) {
    if (!container) return;
    const slidesBox = container; // .offer-slider
    const list = await DB.listOffers().catch(() => []);
    if (!list.length) return; // mantém estático do HTML

    slidesBox.innerHTML = '';
    list.forEach(o => {
      const slide = document.createElement('div');
      slide.className = 'offer-slide';
      slide.innerHTML = `
        <img src="${o.image_url}" alt="${o.title}">
        <div class="offer-details">
          <h3>${o.title}</h3>
          <p>${o.description || ''}</p>
          <button class="offer-button">${o.cta || 'Pedir Agora'}</button>
        </div>`;
      slidesBox.appendChild(slide);
    });

    // slider simples (auto-rolagem horizontal)
    let idx = 0;
    const advance = () => {
      const slides = $$('.offer-slide', slidesBox);
      if (!slides.length) return;
      idx = (idx + 1) % slides.length;
      slidesBox.scrollTo({ left: slides[idx].offsetLeft, behavior: 'smooth' });
    };
    setInterval(advance, 4000);
  },

  bindSearch(onSearch) {
    const input = $('.navbar-search input');
    const btn = $('.navbar-search button');
    if (!input || !btn) return;
    const trigger = () => onSearch?.(input.value.trim());
    btn.addEventListener('click', trigger);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') trigger(); });
    input.addEventListener('input', debounce(() => onSearch?.(input.value.trim()), 400));
  },
};

// -----------------------------------------------------------------------------
// 7) ROTEADOR SIMPLES POR PÁGINA
// -----------------------------------------------------------------------------
const Router = {
  currentFilters: {},
  applyFilter(filters) { this.currentFilters = { ...this.currentFilters, ...filters }; this.refreshIndex(); },
  isIndex() { const path = location.pathname; return path.endsWith('/') || path.endsWith('/index.html') || path.split('/').pop() === 'index.html'; },
  async refreshIndex() { if (!this.isIndex()) return; const grid = $('.restaurant-grid'); await UI.renderRestaurants(grid, this.currentFilters); },
};

// -----------------------------------------------------------------------------
// 8) BOOTSTRAP
// -----------------------------------------------------------------------------
async function boot() {
  UI.initNavbar();
  await DB.getSession();
  DB.onAuth(() => {});

  if (Router.isIndex()) {
    // Categorias (dinâmicas se existirem na base)
    UI.renderCategories($('.category-list'));

    // Ofertas
    UI.renderOffers($('.offer-slider'));

    // Restaurantes em destaque
    Router.refreshIndex();

    // Busca
    UI.bindSearch((text) => Router.applyFilter({ search: text || undefined }));
  }

  // Clique no carrinho flutuante
  const floatCart = $('.floating-cart .cart-icon');
  if (floatCart) floatCart.addEventListener('click', () => { location.href = 'checkout.html'; });
}

// Inicializa
boot().catch((e) => { console.error(e); toast('Falha ao iniciar a aplicação', 'error'); });
