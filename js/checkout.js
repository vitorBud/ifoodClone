// js/checkout.js (REV 2: com guard de página + $$ seguro)
// -----------------------------------------------------------
// Checkout com carrossel (3 etapas) + carrinho localStorage
// Integração Supabase opcional (não quebra se faltar).
// -----------------------------------------------------------

const $ = (s, c=document) => (c || document).querySelector(s);
const $$ = (s, c=document) => Array.from((c || document).querySelectorAll(s));
const fmt = (n) => Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

// -------------------- Guard: só roda no checkout --------------------
function isCheckoutPage(){
  return !!document.querySelector(".checkout-carousel") &&
         !!document.querySelector(".carousel-track") &&
         !!document.querySelector(".order-items") &&
         !!document.querySelector(".order-totals");
}

// -------------------- Carrinho (padrão antigo) --------------------
const STORAGE_KEY = "shoppingCart";

function loadCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveCart(cart) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }
function cartCount(cart){ return cart.reduce((a,i)=>a+(i.quantity||0),0); }

const CheckoutState = {
  cart: [],
  coupon: null, // ex.: { code: 'DESC10', percent: 10 }
};

function computeTotals(cart, coupon){
  const subtotal = cart.reduce((a,i)=> a + (Number(i.price||0) * Number(i.quantity||0)), 0);
  let delivery = 5.90;
  let discount = 0;

  if (coupon && coupon.code === "DESC10") discount = subtotal * 0.10;
  if (coupon && coupon.code === "FRETEGRATIS") delivery = 0;

  const total = subtotal + delivery - discount;
  return { subtotal, delivery, discount, total };
}

// -------------------- UI: contador + resumo --------------------
function updateBadges(cart){
  $$(".cart-count, .cart-badge").forEach(b=> b.textContent = String(cartCount(cart)));
}

function renderSummary(){
  const cart = CheckoutState.cart;
  const itemsBox = $(".order-items");
  const totalsBox = $(".order-totals");
  if(!itemsBox || !totalsBox) return computeTotals(cart, CheckoutState.coupon);

  itemsBox.innerHTML = cart.length
    ? cart.map(it=>`
      <div class="order-item">
        <span class="item-quantity">${it.quantity}x</span>
        <span class="item-name">${it.name ?? 'Item'}</span>
        <span class="item-price">${fmt((Number(it.price)||0)*Number(it.quantity||0))}</span>
      </div>
    `).join("")
    : `<p class="empty-cart">Seu carrinho está vazio</p>`;

  const t = computeTotals(cart, CheckoutState.coupon);
  totalsBox.innerHTML = `
    <div class="total-row"><span>Subtotal</span><span>${fmt(t.subtotal)}</span></div>
    <div class="total-row"><span>Taxa de entrega</span><span>${fmt(t.delivery)}</span></div>
    <div class="total-row discount"><span>Desconto</span><span>- ${fmt(t.discount)}</span></div>
    <div class="total-row grand-total"><span>Total</span><span>${fmt(t.total)}</span></div>
  `;
  return t;
}

// -------------------- Validações simples --------------------
function validateAddress(){
  const required = ["cep","street","number","neighborhood","city","state"];
  for (const id of required) {
    const el = $("#"+id);
    if (!el || !el.value.trim()) { alert("Preencha o campo: " + id); el?.focus(); return false; }
  }
  return true;
}

function validatePayment(){
  const name = $("#card-name")?.value.trim();
  const num  = ($("#card-number")?.value || "").replace(/\s+/g,"");
  const exp  = $("#card-expiry")?.value.trim();
  const cvv  = $("#card-cvv")?.value.trim();

  if (!name) { alert("Informe o nome no cartão"); return false; }
  if (!/^\d{16}$/.test(num)) { alert("Número do cartão inválido"); return false; }
  if (!/^\d{2}\/\d{2}$/.test(exp)) { alert("Validade no formato MM/AA"); return false; }
  if (!/^\d{3,4}$/.test(cvv)) { alert("CVV inválido"); return false; }
  return true;
}

// -------------------- Carrossel --------------------
function setActiveStep(n){
  $$(".checkout-steps .step").forEach(s=> s.classList.toggle("active", s.dataset.step===String(n)));
  $$(".carousel-dots .dot").forEach(d=> d.classList.toggle("active", d.dataset.step===String(n)));
}

function makeCarousel(){
  const track = $(".carousel-track");
  const slides = $$(".slide", track);
  if (!track || !slides.length) return { go:()=>{}, index:0 };

  let index = 0;
  function go(i){
    index = Math.max(0, Math.min(i, slides.length-1));
    track.style.transform = `translateX(-${index*100}%)`;
    setActiveStep(index+1);
    if (index === 2) renderSummary(); // ao chegar na revisão, garante refresh
  }

  $(".carousel-prev")?.addEventListener("click", ()=> go(index-1));
  $(".carousel-next")?.addEventListener("click", ()=> go(index+1));

  // Botões com validação
  $$(".continue-button[data-next]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const next = Number(btn.dataset.next);
      if (next === 2 && !validateAddress()) return;
      if (next === 3 && !validatePayment()) return;
      go(next-1);
    });
  });
  $$(".back-button[data-prev]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const prev = Number(btn.dataset.prev);
      if (prev > 0) go(prev-1); else history.back();
    });
  });

  // Dots
  $$(".carousel-dots .dot").forEach(dot=>{
    dot.addEventListener("click", ()=> go(Number(dot.dataset.step)-1));
  });

  // Swipe
  let startX=0, dx=0;
  track.addEventListener("touchstart", e=>{ startX = e.touches[0].clientX; });
  track.addEventListener("touchmove",  e=>{ dx = e.touches[0].clientX - startX; });
  track.addEventListener("touchend",   ()=>{ if(Math.abs(dx)>60){ go(index + (dx<0?1:-1)); } dx=0; });

  return { go, get index(){return index;} };
}

// -------------------- Cupom --------------------
function wireCoupon(){
  $("#apply-coupon")?.addEventListener("click", ()=>{
    const code = ($("#coupon-input")?.value || "").trim().toUpperCase();
    if (!code) { CheckoutState.coupon = null; renderSummary(); alert("Sem cupom aplicado."); return; }
    if (code === "DESC10") { CheckoutState.coupon = { code, percent: 10 }; }
    else if (code === "FRETEGRATIS") { CheckoutState.coupon = { code }; }
    else { CheckoutState.coupon = null; alert("Cupom inválido (use DESC10 ou FRETEGRATIS para testar)."); }
    renderSummary();
  });
}

// -------------------- Supabase (opcional) --------------------
let supabaseClient = null;
async function ensureSupabase(){
  if (supabaseClient) return supabaseClient;
  try {
    const mod = await import("./ifood-clone-app.js");
    if (mod?.supabase) { supabaseClient = mod.supabase; return supabaseClient; }
  } catch {}

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");

  const SUPABASE_URL = window.SUPABASE_URL || "https://SUA-URL-PROJETO.supabase.co";
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "SUA-ANON-KEY";

  if (SUPABASE_URL.includes("SUA-URL-PROJETO")) {
    console.warn("[checkout] Supabase não configurado. O pedido será finalizado offline.");
    return null;
  }

  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

async function createOrderOnSupabase(cart, totals){
  const supabase = await ensureSupabase();
  if (!supabase) return { id: "offline-order" }; // fallback: não quebra

  const { data: sess } = await supabase.auth.getSession();
  const userId = sess?.session?.user?.id ?? null;
  const restaurantId = cart[0]?.restaurant_id ?? null;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({ user_id: userId, restaurant_id: restaurantId, total: totals.total, status: "pendente" })
    .select()
    .single();

  if (error) throw error;

  const items = cart.map(it => ({
    order_id: order.id,
    product_id: it.id,
    name: it.name ?? "Item",
    price: Number(it.price)||0,
    qty: Number(it.quantity)||1
  }));

  const { error: errItems } = await supabase.from("order_items").insert(items);
  if (errItems) throw errItems;

  return order;
}

// -------------------- Boot --------------------
function boot(){
  if (!isCheckoutPage()) {
    // Este arquivo foi incluído por engano em outra página.
    console.warn("[checkout] Página não é o checkout; script ignorado.");
    return;
  }

  CheckoutState.cart = loadCart();
  updateBadges(CheckoutState.cart);
  renderSummary();

  makeCarousel();
  wireCoupon();

  // Máscaras de pagamento
  const num = $("#card-number");
  num?.addEventListener("input", ()=>{
    let v = num.value.replace(/\D/g,"").slice(0,16);
    v = v.replace(/(\d{4})(?=\d)/g,"$1 ");
    num.value = v;
  });
  const exp = $("#card-expiry");
  exp?.addEventListener("input", ()=>{
    let v = exp.value.replace(/\D/g,"").slice(0,4);
    if (v.length>=3) v = v.slice(0,2)+"/"+v.slice(2);
    exp.value = v;
  });

  // Confirmar pedido
  $("#confirm-order")?.addEventListener("click", async ()=>{
    const cart = CheckoutState.cart;
    if (!cart.length) { alert("Seu carrinho está vazio."); return; }
    try {
      const t = computeTotals(cart, CheckoutState.coupon);
      await createOrderOnSupabase(cart, t);
      alert("Pedido confirmado! 🎉");
      CheckoutState.cart = [];
      saveCart([]);
      updateBadges([]);
      location.href = "index.html";
    } catch (e) {
      console.error("[checkout] erro ao finalizar:", e);
      alert("Erro ao finalizar o pedido.");
    }
  });
}

document.addEventListener("DOMContentLoaded", boot);
