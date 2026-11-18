'use strict';

let products = [];
let cart = loadCart();
let currentCategory = 'todos';
let searchTerm = '';

// 1. Carga de Productos desde la API (MongoDB)
async function fetchProducts() {
  try {
    const response = await fetch('http://localhost:3002/api/productos');
    if (!response.ok) throw new Error('Error en la respuesta del servidor');

    products = await response.json();
    renderProducts();
    renderCart();
  } catch (error) {
    console.error('Error cargando productos:', error);
    const grid = document.getElementById('product-grid');
    if (grid) {
      grid.innerHTML = '<p class="error">No se pudieron cargar los productos. Verifica que server.js esté encendido.</p>';
    }
  }
}

// 2. Renderizar Tarjetas de Productos
function renderProducts() {
  const grid = document.getElementById('product-grid');
  const emptyResults = document.getElementById('empty-results');
  const resultsLabel = document.getElementById('results-label');
  if (!grid) return;

  const filtered = products.filter(p => {
    const matchesCategory = currentCategory === 'todos' || p.category === currentCategory;
    const matchesSearch = (p.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (resultsLabel) {
    resultsLabel.textContent = `Mostrando ${filtered.length} producto(s)`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyResults) emptyResults.classList.add('visible');
    return;
  }

  if (emptyResults) emptyResults.classList.remove('visible');

  grid.innerHTML = filtered.map(p => `
    <article class="product-card" data-id="${p.id}">
      <div class="product-image-wrap">
        <span class="product-category">${p.categoryName || p.category}</span>
        <img src="${p.image}" alt="${p.title}" class="product-image" loading="lazy">
      </div>
      <div class="product-info">
        <h3 class="product-title">${p.title}</h3>
        <p class="product-price">S/ ${parseFloat(p.price).toFixed(2)} <small>/ ${p.unit}</small></p>
        <button class="add-button" type="button" onclick="addToCart('${p.id}')">Agregar al pedido</button>
      </div>
    </article>
  `).join('');
}

// 3. Manejo del Carrito
function loadCart() {
  const saved = localStorage.getItem('bodega_cart');
  return saved ? JSON.parse(saved) : [];
}

function saveCart() {
  localStorage.setItem('bodega_cart', JSON.stringify(cart));
}

function addToCart(productId) {
  const product = products.find(p => String(p.id) === String(productId));
  if (!product) return;

  const existingItem = cart.find(item => String(item.id) === String(productId));
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  renderCart();
  showToast(`Agregado: ${product.title}`);
}

function changeQuantity(productId, delta) {
  const itemIndex = cart.findIndex(item => String(item.id) === String(productId));
  if (itemIndex > -1) {
    cart[itemIndex].quantity += delta;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
    saveCart();
    renderCart();
  }
}

function renderCart() {
  const cartContainer = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const cartCount = document.getElementById('cart-count');
  const checkoutBtn = document.getElementById('checkout-button');

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  if (cartCount) cartCount.textContent = totalItems;
  if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

  if (cartContainer) {
    if (cart.length === 0) {
      cartContainer.innerHTML = `
        <div class="cart-empty">
          <i class="fa-solid fa-basket-shopping"></i>
          <strong>Tu pedido está vacío</strong>
          <span>Agrega productos del catálogo para armar tu lista.</span>
        </div>`;
    } else {
      cartContainer.innerHTML = cart.map(item => `
        <div class="cart-line">
          <img src="${item.image}" alt="${item.title}">
          <div>
            <span class="cart-line-title">${item.title}</span>
            <span class="cart-line-price">S/ ${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
          </div>
          <div class="quantity">
            <button type="button" onclick="changeQuantity('${item.id}', -1)">-</button>
            <span>${item.quantity}</span>
            <button type="button" onclick="changeQuantity('${item.id}', 1)">+</button>
            
          </div>
        </div>
      `).join('');
    }
  }

  if (cartTotal) {
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    cartTotal.textContent = `S/ ${total.toFixed(2)}`;
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// 4. Eventos de interfaz (Carrito, Filtros, Buscador, Menú móvil y WhatsApp)
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();

  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  const openBtn = document.getElementById('open-cart');
  const closeBtn = document.getElementById('close-cart');
  const checkoutBtn = document.getElementById('checkout-button');
  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  const yearSpan = document.getElementById('year');

  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  const toggleCart = (open) => {
    drawer?.classList.toggle('open', open);
    overlay?.classList.toggle('open', open);
    document.body.classList.toggle('locked', open);
  };

  openBtn?.addEventListener('click', () => toggleCart(true));
  closeBtn?.addEventListener('click', () => toggleCart(false));
  overlay?.addEventListener('click', () => toggleCart(false));

  menuToggle?.addEventListener('click', () => {
    const isOpen = navLinks?.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      currentCategory = btn.dataset.category;
      renderProducts();
    });
  });

  searchInput?.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    renderProducts();
  });

  checkoutBtn?.addEventListener('click', () => {
    if (cart.length === 0) return;
    const lines = cart.map(i => `- ${i.quantity}x ${i.title} (S/ ${(i.price * i.quantity).toFixed(2)})`).join('\n');
    const total = cart.reduce((acc, i) => acc + i.price * i.quantity, 0).toFixed(2);
    const msg = encodeURIComponent(`Hola Bodega July, quiero hacer este pedido:\n\n${lines}\n\nTotal estimado: S/ ${total}`);
    window.open(`https://wa.me/51931046601?text=${msg}`, '_blank');
  });
});