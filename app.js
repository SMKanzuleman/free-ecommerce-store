// Initial Demo Catalog focused strictly on Cosmetics, Tech, and Clothing
const INITIAL_PRODUCTS = [];

function getWishlistKey() {
  const currentUser = JSON.parse(sessionStorage.getItem("aura_current_user"));
  if (currentUser && currentUser.username) {
    return `aura_wishlist_${currentUser.username.toLowerCase()}`;
  }
  return "aura_wishlist_guest";
}

// App State
let state = {
  products: JSON.parse(localStorage.getItem("aura_products")) || INITIAL_PRODUCTS,
  cart: JSON.parse(localStorage.getItem("aura_cart")) || [],
  wishlist: JSON.parse(localStorage.getItem(getWishlistKey())) || [],
  settings: Object.assign({
    whatsappNumber: "+923017062739",
    currency: "Rs",
    storeName: "Smart Choice",
    googleSheetUrl: "https://script.google.com/macros/s/AKfycbzNVqb1nfvuHLqupdtIJu8axAp6JPf6iYN0AfO_fzfqUiPnStg9hlaTsthEJqOoTKbjlg/exec",
    footerPhone: "+92 301 7062739",
    footerEmail: "support@aurastore.com",
    footerAddress: "123 Storefront Ave, Retail District, CA 90210",
    footerFacebook: "#",
    footerInstagram: "#",
    footerTwitter: "#",
    footerPinterest: "#",
    footerDesc: "Your ultimate destination for premium cosmetics, cutting-edge tech, and modern clothing. Built 100% free with no hidden hosting or card verification fees.",
    footerCopyright: "&copy; 2026 AuraStore. All rights reserved. Zero Card Verification Fees. Zero Hosting Costs.",
    deliveryCharges: 250
  }, JSON.parse(localStorage.getItem("aura_settings")) || {}),
  filters: {
    category: "all",
    maxPrice: 500,
    search: "",
    sort: "featured"
  }
};

// DOM Elements
const productGrid = document.getElementById("product-grid");
const productCountEl = document.getElementById("product-count");
const activeFilterLabel = document.getElementById("active-filter-label");
const emptyState = document.getElementById("empty-state");

const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search-btn");
let categoryButtons = document.querySelectorAll(".cat-btn");
let navCategoryLinks = document.querySelectorAll(".nav-cat-link");
const priceRange = document.getElementById("price-range");
const priceValue = document.getElementById("price-value");
const sortSelect = document.getElementById("sort-select");
const resetFiltersBtn = document.getElementById("reset-filters");

const cartBtn = document.getElementById("cart-btn");
const cartCount = document.getElementById("cart-count");
const cartOverlay = document.getElementById("cart-overlay");
const cartDrawer = document.getElementById("cart-drawer");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartItemsContainer = document.getElementById("cart-items");
const cartSubtotalEl = document.getElementById("cart-subtotal");
const cartShippingEl = document.getElementById("cart-shipping");
const cartTotalEl = document.getElementById("cart-total");
const proceedCheckoutBtn = document.getElementById("proceed-checkout-btn");

const wishlistCount = document.getElementById("wishlist-count");
const themeToggleBtn = document.getElementById("theme-toggle");

const productModal = document.getElementById("product-modal");
const closeProductModalBtn = document.getElementById("close-product-modal");
const modalProductContent = document.getElementById("modal-product-content");

const checkoutModal = document.getElementById("checkout-modal");
const closeCheckoutModalBtn = document.getElementById("close-checkout-modal");
const orderForm = document.getElementById("order-form");
const orderSummaryBox = document.getElementById("order-summary-box");

// Mobile Drawer Elements
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileDrawerOverlay = document.getElementById("mobile-drawer-overlay");
const mobileDrawer = document.getElementById("mobile-drawer");
const closeMobileDrawerBtn = document.getElementById("close-mobile-drawer");
let mobileCatButtons = document.querySelectorAll(".mobile-cat-btn");

// Load products from local folder/server
async function loadProductsFromServer() {
  try {
    let response = await fetch("/api/products").catch(() => null);
    if (!response || !response.ok) {
      response = await fetch("products/products.json?v=" + Date.now());
    }
    if (response && response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        state.products = data;
        localStorage.setItem("aura_products", JSON.stringify(data));
      }
    }
  } catch (error) {
    console.warn("Could not load products from local products folder/server, using cached local storage or initial demo catalog:", error);
  }
}

const CATEGORY_ICONS = {
  cosmetics: "fa-wand-magic-sparkles",
  tech: "fa-laptop",
  handicraft: "fa-gem",
  clothing: "fa-shirt"
};

function getUniqueCategories() {
  const categories = new Set();
  state.products.forEach(p => {
    if (p.category) {
      categories.add(p.category.toLowerCase().trim());
    }
  });
  return Array.from(categories);
}

function renderCategoriesUI() {
  const categories = getUniqueCategories();

  // Update Navbar Categories
  const navEl = document.getElementById("nav-categories");
  if (navEl) {
    navEl.innerHTML = categories.map(cat => {
      const icon = CATEGORY_ICONS[cat] || "fa-tag";
      const label = cat.charAt(0).toUpperCase() + cat.slice(1);
      return `<a href="#shop" class="nav-cat-link" data-category="${cat}"><i class="fa-solid ${icon}"></i> ${label}</a>`;
    }).join("");
  }

  // Update Mobile Drawer Categories
  const mobileEl = document.getElementById("mobile-categories");
  if (mobileEl) {
    mobileEl.innerHTML = categories.map(cat => {
      const icon = CATEGORY_ICONS[cat] || "fa-tag";
      const label = cat.charAt(0).toUpperCase() + cat.slice(1);
      return `<button class="mobile-cat-btn" data-category="${cat}"><i class="fa-solid ${icon}"></i> ${label}</button>`;
    }).join("");
  }

  // Update Main Filter Pills
  const filterEl = document.getElementById("category-list");
  if (filterEl) {
    const allBtnHTML = `<button class="cat-btn ${state.filters.category === 'all' ? 'active' : ''}" data-category="all">All Catalog</button>`;
    const clearBtnHTML = `<button class="cat-btn reset-filters-pill" id="reset-filters"><i class="fa-solid fa-arrow-rotate-left"></i> Clear</button>`;
    
    filterEl.innerHTML = allBtnHTML + categories.map(cat => {
      const icon = CATEGORY_ICONS[cat] || "fa-tag";
      const label = cat.charAt(0).toUpperCase() + cat.slice(1);
      const activeClass = state.filters.category === cat ? "active" : "";
      return `<button class="cat-btn ${activeClass}" data-category="${cat}"><i class="fa-solid ${icon}"></i> ${label}</button>`;
    }).join("") + clearBtnHTML;
  }

  // Update Footer Links
  const footerEl = document.getElementById("footer-category-links");
  if (footerEl) {
    let html = `<li><a href="index.html#shop" onclick="setCategoryFilter('all')">All Products</a></li>`;
    html += categories.map(cat => {
      const label = cat.charAt(0).toUpperCase() + cat.slice(1);
      return `<li><a href="index.html#shop" onclick="setCategoryFilter('${cat}')">${label} Catalog</a></li>`;
    }).join("");
    footerEl.innerHTML = html;
  }

  // Update let bindings
  categoryButtons = document.querySelectorAll(".cat-btn");
  navCategoryLinks = document.querySelectorAll(".nav-cat-link");
  mobileCatButtons = document.querySelectorAll(".mobile-cat-btn");

  // Re-bind listeners
  bindCategoryListeners();
}

function bindCategoryListeners() {
  categoryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      setCategoryFilter(btn.dataset.category);
    });
  });

  navCategoryLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      setCategoryFilter(link.dataset.category);
    });
  });

  mobileCatButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      setCategoryFilter(btn.dataset.category);
      closeMobileMenu();
    });
  });

  const resetBtn = document.getElementById("reset-filters");
  if (resetBtn) resetBtn.addEventListener("click", resetFilters);
}

// Initialize App
document.addEventListener("DOMContentLoaded", async () => {
  await loadProductsFromServer();
  renderCategoriesUI();
  applyDynamicSettings();
  renderProducts();
  updateCartUI();
  updateWishlistUI();
  initTheme();
  setupEventListeners();
});

function applyDynamicSettings() {
  const storeNameEls = document.querySelectorAll(".brand-logo .logo-text");
  if (storeNameEls.length > 0 && state.settings.storeName) {
    storeNameEls.forEach(el => {
      const name = state.settings.storeName;
      if (name.toLowerCase().endsWith("store") && name.toLowerCase() !== "store") {
        const base = name.substring(0, name.toLowerCase().lastIndexOf("store"));
        el.innerHTML = `${base}<span>Store</span>`;
      } else {
        el.innerHTML = name;
      }
    });
  }

  if (state.settings.storeName) {
    document.title = document.title.replace("AuraStore", state.settings.storeName);
  }

  // Dynamic Footer Updates
  const footerDescEl = document.getElementById("footer-desc-text");
  if (footerDescEl && state.settings.footerDesc) {
    footerDescEl.textContent = state.settings.footerDesc;
  }

  const footerEmailEl = document.getElementById("footer-email-text");
  if (footerEmailEl && state.settings.footerEmail) {
    footerEmailEl.textContent = state.settings.footerEmail;
  }

  const footerPhoneEl = document.getElementById("footer-phone-text");
  if (footerPhoneEl && state.settings.footerPhone) {
    footerPhoneEl.textContent = state.settings.footerPhone;
  }

  const footerAddressEl = document.getElementById("footer-address-text");
  if (footerAddressEl && state.settings.footerAddress) {
    footerAddressEl.textContent = state.settings.footerAddress;
  }

  const footerFbEl = document.getElementById("footer-link-fb");
  if (footerFbEl) footerFbEl.href = state.settings.footerFacebook || "#";

  const footerIgEl = document.getElementById("footer-link-ig");
  if (footerIgEl) footerIgEl.href = state.settings.footerInstagram || "#";

  const footerTwEl = document.getElementById("footer-link-tw");
  if (footerTwEl) footerTwEl.href = state.settings.footerTwitter || "#";

  const footerPinEl = document.getElementById("footer-link-pin");
  if (footerPinEl) footerPinEl.href = state.settings.footerPinterest || "#";

  const footerCopyEl = document.getElementById("footer-copyright-text");
  if (footerCopyEl && state.settings.footerCopyright) {
    footerCopyEl.innerHTML = state.settings.footerCopyright;
  }

  const footerWhatsapp = document.querySelector(".footer-contact-list a.whatsapp-contact-link");
  if (footerWhatsapp && state.settings.whatsappNumber) {
    const formattedNum = state.settings.whatsappNumber.replace(/\+/g, "");
    footerWhatsapp.href = `https://wa.me/${formattedNum}`;
  }

  // Update Navbar Auth Greeting UI States
  const navGreeting = document.getElementById("nav-user-greeting");
  const navUsernameSpan = document.getElementById("nav-username-span");
  const navAccountBtn = document.getElementById("nav-account-btn");

  const isAdminAuth = sessionStorage.getItem("aura_admin_auth") === "true";
  const isUserAuth = sessionStorage.getItem("aura_user_auth") === "true";
  const currentUser = JSON.parse(sessionStorage.getItem("aura_current_user"));

  if (navGreeting && navAccountBtn) {
    const navAvatar = document.getElementById("nav-user-avatar");
    
    if (isAdminAuth) {
      navGreeting.classList.remove("hidden");
      navGreeting.href = "admin.html";
      if (navUsernameSpan) navUsernameSpan.textContent = "Admin 👑";
      if (navAvatar) {
        navAvatar.style.backgroundImage = "none";
        navAvatar.textContent = "A";
      }
      navAccountBtn.classList.add("hidden");
    } else if (isUserAuth && currentUser) {
      navGreeting.classList.remove("hidden");
      navGreeting.href = "dashboard.html";
      if (navUsernameSpan) navUsernameSpan.textContent = currentUser.username;
      
      if (navAvatar) {
        if (currentUser.avatar) {
          navAvatar.textContent = "";
          navAvatar.style.backgroundImage = `url(${currentUser.avatar})`;
        } else {
          navAvatar.style.backgroundImage = "none";
          navAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
        }
      }
      navAccountBtn.classList.add("hidden");
    } else {
      navGreeting.classList.add("hidden");
      navAccountBtn.classList.remove("hidden");
      navAccountBtn.href = "login.html";
    }
  }
}

function setupEventListeners() {
  // Search
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.filters.search = e.target.value.toLowerCase().trim();
      clearSearchBtn.classList.toggle("hidden", state.filters.search === "");
      renderProducts();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      state.filters.search = "";
      clearSearchBtn.classList.add("hidden");
      renderProducts();
    });
  }

  // Dynamic category bindings are handled in bindCategoryListeners()

  // Mobile Menu Drawer Toggles
  if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", openMobileMenu);
  if (closeMobileDrawerBtn) closeMobileDrawerBtn.addEventListener("click", closeMobileMenu);
  if (mobileDrawerOverlay) mobileDrawerOverlay.addEventListener("click", closeMobileMenu);

  // Price Filter
  if (priceRange) {
    priceRange.addEventListener("input", (e) => {
      state.filters.maxPrice = parseFloat(e.target.value);
      priceValue.textContent = `${state.settings.currency}${state.filters.maxPrice}`;
      renderProducts();
    });
  }

  // Sort
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.filters.sort = e.target.value;
      renderProducts();
    });
  }

  // Reset Filters (handled dynamically in bindCategoryListeners)
  document.getElementById("clear-all-filters-btn")?.addEventListener("click", resetFilters);
  document.getElementById("btn-clear-filters-pill")?.addEventListener("click", resetFilters);

  // Cart Drawer
  if (cartBtn) cartBtn.addEventListener("click", openCart);
  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

  // Theme Toggle
  if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);

  // Product Modal Close
  if (closeProductModalBtn) closeProductModalBtn.addEventListener("click", () => productModal.classList.add("hidden"));

  // Checkout Redirection
  if (proceedCheckoutBtn) {
    proceedCheckoutBtn.addEventListener("click", () => {
      if (state.cart.length === 0) {
        showToast("Your cart is empty!", "warning");
        return;
      }
      window.location.href = "checkout.html";
    });
  }

  if (closeCheckoutModalBtn) closeCheckoutModalBtn.addEventListener("click", () => checkoutModal.classList.add("hidden"));
  if (orderForm) orderForm.addEventListener("submit", handleOrderSubmit);

  // Admin Security PIN Modal Listener
  const pinForm = document.getElementById("admin-pin-form");
  if (pinForm) {
    pinForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const inputPin = document.getElementById("admin-pin-input").value.trim();
      const storedPin = localStorage.getItem("aura_admin_pin") || "1234";

      if (inputPin === storedPin) {
        sessionStorage.setItem("aura_admin_auth", "true");
        showToast("Access Granted! Opening Admin Panel...", "success");
        setTimeout(() => {
          window.location.href = "admin.html";
        }, 500);
      } else {
        showToast("Incorrect Security PIN! Access Denied.", "warning");
      }
    });
  }

  const closePinModal = document.getElementById("close-admin-pin-modal");
  if (closePinModal) {
    closePinModal.addEventListener("click", () => {
      document.getElementById("admin-pin-modal").classList.add("hidden");
    });
  }
}

// Admin Security Authentication Request
function requestAdminAccess() {
  const isAuth = sessionStorage.getItem("aura_admin_auth") === "true";
  if (isAuth) {
    window.location.href = "admin.html";
    return;
  }
  
  const modal = document.getElementById("admin-pin-modal");
  if (modal) {
    modal.classList.remove("hidden");
    document.getElementById("admin-pin-input")?.focus();
  }
}

function setCategoryFilter(category) {
  state.filters.category = category;

  // Sync active states across Sidebar, Navbar, and Mobile menu
  categoryButtons.forEach(b => b.classList.toggle("active", b.dataset.category === category));
  navCategoryLinks.forEach(l => l.classList.toggle("active", l.dataset.category === category));
  mobileCatButtons.forEach(m => m.classList.toggle("active", m.dataset.category === category));

  renderProducts();
}

window.setCategoryFilter = setCategoryFilter;

function resetFilters() {
  state.filters = { category: "all", maxPrice: 500, search: "", sort: "featured" };
  if (searchInput) searchInput.value = "";
  if (clearSearchBtn) clearSearchBtn.classList.add("hidden");
  if (priceRange) priceRange.value = 500;
  if (priceValue) priceValue.textContent = `${state.settings.currency}500`;
  if (sortSelect) sortSelect.value = "featured";
  setCategoryFilter("all");
}

function openMobileMenu() {
  mobileDrawer.classList.remove("hidden");
  mobileDrawerOverlay.classList.remove("hidden");
}

function closeMobileMenu() {
  mobileDrawer.classList.add("hidden");
  mobileDrawerOverlay.classList.add("hidden");
}

// Render Products Catalog
function renderProducts() {
  if (!productGrid) return;

  let filtered = state.products.filter(prod => {
    const matchesCategory = state.filters.category === "all" || prod.category === state.filters.category;
    const matchesPrice = prod.price <= state.filters.maxPrice;
    const matchesSearch = prod.title.toLowerCase().includes(state.filters.search) || 
                          prod.description.toLowerCase().includes(state.filters.search);
    return matchesCategory && matchesPrice && matchesSearch;
  });

  // Sorting
  if (state.filters.sort === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (state.filters.sort === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (state.filters.sort === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  productCountEl.textContent = filtered.length;
  activeFilterLabel.textContent = state.filters.category === "all" ? "Showing All Products" : `Category: ${state.filters.category.toUpperCase()}`;

  if (filtered.length === 0) {
    productGrid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  productGrid.innerHTML = filtered.map(prod => {
    const isWishlisted = state.wishlist.includes(prod.id);
    const productImages = prod.images && prod.images.length ? prod.images : [prod.image || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80'];
    return `
      <div class="product-card">
        ${prod.badge ? `<span class="product-badge">${prod.badge}</span>` : ""}
        <button class="wishlist-icon-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist('${prod.id}')">
          <i class="fa-${isWishlisted ? 'solid' : 'regular'} fa-heart"></i>
        </button>
        <div class="product-img-wrapper">
          <img src="${productImages[0]}" referrerpolicy="no-referrer" alt="${prod.title}" class="product-img" id="img-${prod.id}" onclick="openProductModal('${prod.id}')" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80'">
          ${productImages.length > 1 ? `
            <div class="carousel-dots">
              ${productImages.map((imgUrl, idx) => `
                <span class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="event.stopPropagation(); changeCardImage('${prod.id}', '${imgUrl.replace(/'/g, "\\'")}', ${idx})"></span>
              `).join("")}
            </div>
          ` : ""}
        </div>
        <div class="product-details">
          <span class="product-cat">${prod.category}</span>
          <h3 class="product-title" onclick="openProductModal('${prod.id}')">${prod.title}</h3>
          <div class="product-rating">
            <i class="fa-solid fa-star"></i> ${prod.rating} <span>(${prod.reviews})</span>
          </div>
          <div class="product-bottom">
            <div class="price-box">
              <span class="current-price">${state.settings.currency}${prod.price.toFixed(2)}</span>
              ${prod.oldPrice ? `<span class="old-price">${state.settings.currency}${prod.oldPrice.toFixed(2)}</span>` : ""}
            </div>
            <button class="add-cart-btn" onclick="addToCart('${prod.id}')">
              <i class="fa-solid fa-plus"></i> Add
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Cart Operations
function addToCart(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const existing = state.cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  updateCartUI();
  showToast(`Added "${product.title}" to cart!`, "success");
}

function updateCartQuantity(productId, delta) {
  const item = state.cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter(i => i.id !== productId);
  }

  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(i => i.id !== productId);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem("aura_cart", JSON.stringify(state.cart));
}

function updateCartUI() {
  if (!cartCount) return;
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;

  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? (parseFloat(state.settings.deliveryCharges) || 0) : 0;
  const total = subtotal + shipping;

  cartSubtotalEl.textContent = `${state.settings.currency}${subtotal.toFixed(2)}`;
  if (cartShippingEl) {
    if (shipping === 0) {
      cartShippingEl.textContent = "FREE";
      cartShippingEl.className = "free-tag";
    } else {
      cartShippingEl.textContent = `${state.settings.currency}${shipping.toFixed(2)}`;
      cartShippingEl.className = "";
    }
  }
  cartTotalEl.textContent = `${state.settings.currency}${total.toFixed(2)}`;

  if (state.cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div style="text-align:center; padding: 2rem 0; color: var(--text-muted);">
        <i class="fa-solid fa-bag-shopping" style="font-size: 3rem; margin-bottom: 0.5rem;"></i>
        <p>Your cart is empty right now.</p>
      </div>
    `;
    return;
  }

  cartItemsContainer.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" referrerpolicy="no-referrer" alt="${item.title}" class="cart-item-img">
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.title}</h4>
        <div class="cart-item-price">${state.settings.currency}${item.price.toFixed(2)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="updateCartQuantity('${item.id}', -1)">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
        </div>
      </div>
      <button class="icon-btn" style="width:30px; height:30px;" onclick="removeFromCart('${item.id}')">
        <i class="fa-solid fa-trash" style="font-size:0.8rem; color:#ef4444;"></i>
      </button>
    </div>
  `).join("");
}

function openCart() {
  cartDrawer.classList.remove("hidden");
  cartOverlay.classList.remove("hidden");
}

function closeCart() {
  cartDrawer.classList.add("hidden");
  cartOverlay.classList.add("hidden");
}

// Wishlist Operations
function toggleWishlist(productId) {
  if (state.wishlist.includes(productId)) {
    state.wishlist = state.wishlist.filter(id => id !== productId);
    showToast("Removed from wishlist", "info");
  } else {
    state.wishlist.push(productId);
    showToast("Saved to wishlist!", "success");
  }
  localStorage.setItem(getWishlistKey(), JSON.stringify(state.wishlist));
  updateWishlistUI();
  renderProducts();
}

function updateWishlistUI() {
  if (wishlistCount) wishlistCount.textContent = state.wishlist.length;
}

// Product Detail Modal
function openProductModal(productId) {
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return;

  const productImages = prod.images && prod.images.length ? prod.images : [prod.image || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80'];

  modalProductContent.innerHTML = `
    <div class="product-modal-grid">
      <div class="modal-left">
        <div class="modal-img-container">
          <img src="${productImages[0]}" referrerpolicy="no-referrer" alt="${prod.title}" class="modal-product-img" id="modal-img-${prod.id}" onerror="this.src='https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80'">
          ${productImages.length > 1 ? `
            <div class="carousel-dots">
              ${productImages.map((imgUrl, idx) => `
                <span class="carousel-dot ${idx === 0 ? 'active' : ''}" onclick="changeModalImage('${prod.id}', '${imgUrl.replace(/'/g, "\\'")}', ${idx})"></span>
              `).join("")}
            </div>
          ` : ""}
        </div>
      </div>
      <div class="modal-right">
        <span class="product-cat">${prod.category}</span>
        <h2 style="font-size: 1.5rem; font-weight:800; line-height:1.2;">${prod.title}</h2>
        <div class="product-rating" style="font-size:0.88rem;">
          <i class="fa-solid fa-star"></i> ${prod.rating} <span>(${prod.reviews} customer reviews)</span>
        </div>
        <div class="price-box">
          <span class="current-price" style="font-size: 1.5rem;">${state.settings.currency}${prod.price.toFixed(2)}</span>
          ${prod.oldPrice ? `<span class="old-price" style="font-size: 1.05rem;">${state.settings.currency}${prod.oldPrice.toFixed(2)}</span>` : ""}
        </div>
        <p class="modal-product-desc">${prod.description}</p>
        <button class="btn btn-primary" onclick="addToCart('${prod.id}'); productModal.classList.add('hidden');" style="width: 100%; justify-content: center;">
          <i class="fa-solid fa-cart-shopping"></i> Add to Cart Now
        </button>
      </div>
    </div>
  `;

  productModal.classList.remove("hidden");
}

// Checkout & WhatsApp Order Submission
function openCheckoutModal() {
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? (parseFloat(state.settings.deliveryCharges) || 0) : 0;
  const total = subtotal + shipping;
  const method = checkoutMethodSelect.value;
  
  orderSummaryBox.innerHTML = `
    <h4>Order Summary (${state.cart.length} items)</h4>
    <div style="font-size:0.9rem; margin-top:0.4rem;">
      ${state.cart.map(i => `<div>${i.quantity}x ${i.title} (${state.settings.currency}${(i.price * i.quantity).toFixed(2)})</div>`).join("")}
      <div style="margin-top: 0.5rem; text-align: right; font-size: 0.95rem;">
        Subtotal: ${state.settings.currency}${subtotal.toFixed(2)}
      </div>
      <div style="text-align: right; font-size: 0.95rem;">
        Delivery: ${shipping > 0 ? `${state.settings.currency}${shipping.toFixed(2)}` : 'FREE'}
      </div>
      <div style="font-weight:800; font-size:1.1rem; margin-top:0.25rem; text-align:right;">
        Total: ${state.settings.currency}${total.toFixed(2)}
      </div>
      <div style="font-size:0.8rem; color:var(--primary); margin-top:0.3rem;">
        Order Method: <strong>${method.toUpperCase()}</strong> (No Credit Card Verification)
      </div>
    </div>
  `;

  checkoutModal.classList.remove("hidden");
}

function handleOrderSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("customer-name").value.trim();
  const phone = document.getElementById("customer-phone").value.trim();
  const address = document.getElementById("customer-address").value.trim();
  const notes = document.getElementById("customer-notes").value.trim();
  const method = checkoutMethodSelect.value;

  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? (parseFloat(state.settings.deliveryCharges) || 0) : 0;
  const total = subtotal + shipping;

  if (method === "whatsapp") {
    let msg = `🛒 *NEW ORDER - ${state.settings.storeName.toUpperCase()}*\n\n`;
    msg += `👤 *Customer Name:* ${name}\n`;
    msg += `📞 *WhatsApp/Phone:* ${phone}\n`;
    msg += `📍 *Delivery Address:* ${address}\n`;
    if (notes) msg += `📝 *Notes:* ${notes}\n`;
    msg += `\n📦 *Cart Items:*\n`;

    state.cart.forEach((item, index) => {
      msg += `${index + 1}. [${item.category.toUpperCase()}] ${item.title} x${item.quantity} - ${state.settings.currency}${(item.price * item.quantity).toFixed(2)}\n`;
    });

    msg += `\n💰 *Subtotal:* ${state.settings.currency}${subtotal.toFixed(2)}\n`;
    msg += `🚚 *Delivery Charges:* ${shipping > 0 ? `${state.settings.currency}${shipping.toFixed(2)}` : 'FREE'}\n`;
    msg += `💵 *Total Amount:* ${state.settings.currency}${total.toFixed(2)}\n`;
    msg += `✨ *Payment:* Direct Order / WhatsApp`;

    const whatsappUrl = `https://wa.me/${state.settings.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, "_blank");

    showToast("Redirecting to WhatsApp to send your order!", "success");
  } else {
    showToast(`Order placed successfully via ${method.toUpperCase()}! Total: ${state.settings.currency}${total.toFixed(2)}`, "success");
  }

  // Clear Cart
  state.cart = [];
  saveCart();
  updateCartUI();
  checkoutModal.classList.add("hidden");
}

// Theme
function initTheme() {
  const savedTheme = localStorage.getItem("aura_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("aura_theme", next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = theme === "dark" ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  }
}

// Toast
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let icon = "fa-info-circle";
  if (type === "success") icon = "fa-circle-check";
  if (type === "warning") icon = "fa-triangle-exclamation";

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// Carousel Helper Functions
function changeCardImage(prodId, imgUrl, activeIndex) {
  const imgEl = document.getElementById(`img-${prodId}`);
  if (imgEl) {
    imgEl.src = imgUrl;
  }
  const wrapper = imgEl ? imgEl.parentElement : null;
  if (wrapper) {
    const dots = wrapper.querySelectorAll('.carousel-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === activeIndex);
    });
  }
}

function changeModalImage(prodId, imgUrl, activeIndex) {
  const imgEl = document.getElementById(`modal-img-${prodId}`);
  if (imgEl) {
    imgEl.src = imgUrl;
  }
  const wrapper = imgEl ? imgEl.parentElement : null;
  if (wrapper) {
    const dots = wrapper.querySelectorAll('.carousel-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === activeIndex);
    });
  }
}
