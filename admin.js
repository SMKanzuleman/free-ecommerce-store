// Admin Panel JavaScript Logic
document.addEventListener("DOMContentLoaded", async () => {
  await loadState();
  initAdminDashboard();
  setupAdminListeners();
});

// ─── State ───────────────────────────────────────────────────────────────────
let adminState = {
  products: [],
  settings: {},
  editingProductId: null
};

async function loadState() {
  // Load products from server first
  try {
    const response = await fetch("/api/products").catch(() => fetch("products/products.json"));
    if (response && response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        localStorage.setItem("aura_products", JSON.stringify(data));
      }
    }
  } catch (error) {
    console.warn("Could not load products from local products folder/server, using local storage:", error);
  }

  // Load products and migrate legacy image field
  const rawProducts = JSON.parse(localStorage.getItem("aura_products")) || [];
  adminState.products = rawProducts.map(p => {
    if (!p.images || !p.images.length) {
      p.images = p.image ? [p.image] : [];
    }
    if (!p.image && p.images.length) {
      p.image = p.images[0];
    }
    return p;
  });

  // Load settings
  adminState.settings = Object.assign({
    whatsappNumber: "+923017062739",
    currency: "Rs",
    storeName: "Smart Choice",
    googleSheetUrl: "https://script.google.com/macros/s/AKfycbzNVqb1nfvuHLqupdtIJu8axAp6JPf6iYN0AfO_fzfqUiPnStg9hlaTsthEJqOoTKbjlg/exec",
    adminEmail: "",
    footerPhone: "+92 301 7062739",
    footerEmail: "support@aurastore.com",
    footerAddress: "123 Storefront Ave, Retail District, CA 90210",
    footerFacebook: "#",
    footerInstagram: "#",
    footerTwitter: "#",
    footerPinterest: "#",
    footerDesc: "Your ultimate destination for premium cosmetics, cutting-edge tech, and modern clothing. Built 100% free with no hidden hosting or card verification fees.",
    footerCopyright: "&copy; 2026 AuraStore. All rights reserved. Zero Card Verification Fees. Zero Hosting Costs.",
    deliveryCharges: 250,
    githubUsername: "",
    githubRepo: "",
    githubToken: "",
    githubBranch: "main"
  }, JSON.parse(localStorage.getItem("aura_settings")) || {});
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function initAdminDashboard() {
  const isAuth = sessionStorage.getItem("aura_admin_auth") === "true";
  if (!isAuth) {
    alert("🔒 Access Denied! Please enter the Admin Security PIN to access the dashboard.");
    window.location.href = "index.html";
    return;
  }

  const adminStoreNameEl = document.getElementById("admin-store-name");
  if (adminStoreNameEl) {
    adminStoreNameEl.innerHTML = `${adminState.settings.storeName} <span>Admin</span>`;
  }

  // Populate Settings Form
  const s = adminState.settings;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };
  set("setting-whatsapp", s.whatsappNumber);
  set("setting-store-name", s.storeName);
  set("setting-currency", s.currency);
  set("setting-delivery-charges", s.deliveryCharges);
  set("setting-github-username", s.githubUsername);
  set("setting-github-repo", s.githubRepo);
  set("setting-github-token", s.githubToken);
  set("setting-github-branch", s.githubBranch || "main");
  set("setting-admin-email", s.adminEmail);
  set("setting-footer-desc", s.footerDesc);
  set("setting-footer-email", s.footerEmail);
  set("setting-footer-phone", s.footerPhone);
  set("setting-footer-address", s.footerAddress);
  set("setting-footer-fb", s.footerFacebook);
  set("setting-footer-ig", s.footerInstagram);
  set("setting-footer-tw", s.footerTwitter);
  set("setting-footer-pin", s.footerPinterest);
  set("setting-footer-copy", s.footerCopyright);

  const pinInput = document.getElementById("setting-admin-pin");
  if (pinInput) pinInput.value = localStorage.getItem("aura_admin_pin") || "1234";

  const sheetInput = document.getElementById("setting-google-sheet-url");
  if (sheetInput) sheetInput.value = s.googleSheetUrl || "";

  populateCategorySelect();
  renderOverview();
  renderManageTable();
  initAdminTheme();
}

// ─── Listeners ───────────────────────────────────────────────────────────────
function setupAdminListeners() {
  // Sidebar navigation
  document.querySelectorAll(".admin-menu-item").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.target));
  });

  // Add Product form
  const addForm = document.getElementById("admin-add-product-form");
  if (addForm) addForm.addEventListener("submit", handleAddProduct);

  // Settings form
  const settingsForm = document.getElementById("admin-settings-form");
  if (settingsForm) settingsForm.addEventListener("submit", handleSaveSettings);

  // Footer settings form
  const footerForm = document.getElementById("admin-footer-settings-form");
  if (footerForm) footerForm.addEventListener("submit", handleSaveFooterSettings);

  // Theme toggle
  const adminThemeToggle = document.getElementById("admin-theme-toggle");
  if (adminThemeToggle) adminThemeToggle.addEventListener("click", toggleAdminTheme);

  // Logout
  const adminLogoutBtn = document.getElementById("admin-logout-btn");
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to log out from the Admin Dashboard?")) {
        sessionStorage.removeItem("aura_admin_auth");
        sessionStorage.removeItem("aura_current_user");
        window.location.href = "index.html";
      }
    });
  }

  // Image preview on file select
  const imgInput = document.getElementById("prod-images");
  if (imgInput) {
    imgInput.addEventListener("change", () => {
      const preview = document.getElementById("prod-images-preview");
      const zoneTitle = document.querySelector(".upload-zone-title");
      if (!preview) return;
      preview.innerHTML = "";
      const files = Array.from(imgInput.files);
      if (zoneTitle) zoneTitle.textContent = `${files.length} image${files.length !== 1 ? "s" : ""} selected`;
      files.forEach(file => {
        const url = URL.createObjectURL(file);
        const img = document.createElement("img");
        img.src = url;
        img.className = "preview-thumb";
        img.title = file.name;
        preview.appendChild(img);
      });
    });
  }
}

// ─── Tab Switching ────────────────────────────────────────────────────────────
function switchTab(targetPanelId) {
  document.querySelectorAll(".admin-menu-item").forEach(b => {
    b.classList.toggle("active", b.dataset.target === targetPanelId);
  });
  document.querySelectorAll(".admin-panel").forEach(panel => {
    panel.classList.toggle("hidden", panel.id !== targetPanelId);
    panel.classList.toggle("active", panel.id === targetPanelId);
  });
}

// ─── Rendering ────────────────────────────────────────────────────────────────
function renderOverview() {
  const totalEl = document.getElementById("stat-total-products");
  if (totalEl) totalEl.textContent = adminState.products.length;

  const waEl = document.getElementById("stat-whatsapp-num");
  if (waEl) waEl.textContent = adminState.settings.whatsappNumber || "Not Set";

  const tbody = document.getElementById("overview-recent-products");
  if (!tbody) return;

  const recent = adminState.products.slice(0, 5);
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1.5rem;">No products added yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(p => {
    const imgSrc = (p.images && p.images[0]) || p.image || "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80";
    return `
    <tr>
      <td><img src="${imgSrc}" alt="${p.title}" class="admin-table-img" onerror="this.src='https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80'"></td>
      <td><strong>${p.title}</strong></td>
      <td><span class="tag-category">${p.category}</span></td>
      <td>${adminState.settings.currency}${p.price.toFixed(2)}</td>
      <td>
        <div style="display:flex; gap:0.4rem;">
          <button class="icon-btn" style="width:32px; height:32px; color:var(--primary);" onclick="startEditProduct('${p.id}')" title="Edit">
            <i class="fa-solid fa-pen-to-square" style="font-size:0.8rem;"></i>
          </button>
          <button class="icon-btn" style="width:32px; height:32px; color:#ef4444;" onclick="deleteProduct('${p.id}')" title="Delete">
            <i class="fa-solid fa-trash" style="font-size:0.8rem;"></i>
          </button>
        </div>
      </td>
    </tr>`;
  }).join("");
}

function renderManageTable() {
  const tbody = document.getElementById("admin-manage-tbody");
  const countEl = document.getElementById("manage-count");
  if (!tbody) return;

  if (countEl) countEl.textContent = adminState.products.length;

  if (adminState.products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No products found in store inventory.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminState.products.map(p => {
    const imgSrc = (p.images && p.images[0]) || p.image || "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80";
    return `
    <tr>
      <td><img src="${imgSrc}" alt="${p.title}" class="admin-table-img" onerror="this.src='https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80'"></td>
      <td><strong>${p.title}</strong></td>
      <td><span class="tag-category">${p.category}</span></td>
      <td>${adminState.settings.currency}${p.price.toFixed(2)}</td>
      <td><i class="fa-solid fa-star" style="color:var(--accent);"></i> ${p.rating || 5.0}</td>
      <td>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-secondary" style="padding:0.3rem 0.7rem; font-size:0.8rem; background:rgba(99,102,241,0.1); color:var(--primary); border:none;" onclick="startEditProduct('${p.id}')">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button class="btn btn-secondary" style="padding:0.3rem 0.7rem; font-size:0.8rem; background:rgba(239,68,68,0.1); color:#ef4444; border:none;" onclick="deleteProduct('${p.id}')">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </td>
    </tr>`;
  }).join("");
}

// ─── Add/Edit Product ────────────────────────────────────────────────────────
async function handleAddProduct(e) {
  e.preventDefault();

  const title = document.getElementById("prod-title").value.trim();
  const catSelect = document.getElementById("prod-category-select").value;
  const catCustom = document.getElementById("prod-category-custom").value.trim().toLowerCase();
  const category = catSelect === "new" ? catCustom : catSelect;
  const price = parseFloat(document.getElementById("prod-price").value);
  const oldPriceVal = document.getElementById("prod-old-price").value;
  const oldPrice = oldPriceVal ? parseFloat(oldPriceVal) : null;
  const description = document.getElementById("prod-desc").value.trim();

  // Read uploaded images
  const fileInput = document.getElementById("prod-images");
  let newImages = [];
  if (fileInput && fileInput.files.length > 0) {
    const base64Objects = await Promise.all(Array.from(fileInput.files).map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, data: reader.result });
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    }));

    const { githubUsername, githubRepo, githubToken } = adminState.settings;
    if (githubUsername && githubRepo && githubToken) {
      // GitHub Mode
      try {
        newImages = await Promise.all(base64Objects.map(async (img, idx) => {
          const match = img.data.match(/^data:image\/([^;]+);base64,(.+)$/s);
          if (!match) throw new Error("Invalid image format");
          const ext = match[1].split("+")[0].replace("jpeg", "jpg");
          const base64Data = match[2];
          
          const uniqueName = `img-${Date.now()}-${idx}.${ext}`;
          const filePath = `uploads/${uniqueName}`;
          
          await commitToGitHub(filePath, base64Data, `Upload product image: ${uniqueName}`);
          return `uploads/${uniqueName}`;
        }));
      } catch (err) {
        console.error("GitHub image upload failed, using Base64 fallback:", err);
        showAdminToast("GitHub image upload failed. Saving as Base64 fallback.", "warning");
        newImages = base64Objects.map(obj => obj.data);
      }
    } else {
      // Local Server Mode
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: base64Objects })
        });
        if (response && response.ok) {
          const resJson = await response.json();
          if (resJson && resJson.success && Array.isArray(resJson.urls) && resJson.urls.length > 0) {
            newImages = resJson.urls;
          } else {
            throw new Error("Upload response did not return any URLs");
          }
        } else {
          throw new Error("HTTP error " + (response ? response.status : "unknown"));
        }
      } catch (err) {
        console.warn("Could not upload image files to server, using Base64 fallback:", err);
        newImages = base64Objects.map(obj => obj.data);
      }
    }
  }

  const isEditing = !!adminState.editingProductId;

  if (!isEditing && newImages.length === 0) {
    showAdminToast("Please upload at least one product image.", "info");
    return;
  }

  if (isEditing) {
    // Update existing product
    const prodIndex = adminState.products.findIndex(p => p.id === adminState.editingProductId);
    if (prodIndex !== -1) {
      const existingProduct = adminState.products[prodIndex];
      existingProduct.title = title;
      existingProduct.category = category;
      existingProduct.price = price;
      existingProduct.oldPrice = oldPrice;
      existingProduct.description = description;

      if (newImages.length > 0) {
        existingProduct.images = newImages;
        existingProduct.image = newImages[0];
      }

      showAdminToast(`Product "${title}" updated successfully!`, "success");
    }

    adminState.editingProductId = null;
    const cancelBtn = document.getElementById("btn-cancel-edit");
    if (cancelBtn) cancelBtn.classList.add("hidden");
  } else {
    // Create new product
    const newProduct = {
      id: `${category}-${Date.now()}`,
      title,
      category,
      price,
      oldPrice,
      rating: 5.0,
      reviews: 1,
      badge: "New",
      images: newImages,
      image: newImages[0],
      description
    };

    adminState.products.unshift(newProduct);
    showAdminToast(`Product "${title}" added to ${category.toUpperCase()}!`, "success");
  }

  await saveProductsToStorage();

  // Reset Form and Titles
  document.getElementById("add-panel-title").textContent = "Add New Product to Store";
  const panelIcon = document.getElementById("add-panel-icon");
  if (panelIcon) panelIcon.className = "fa-solid fa-square-plus";
  document.getElementById("publish-text").textContent = "Publish Product to Store";
  const pubIcon = document.getElementById("publish-icon");
  if (pubIcon) pubIcon.className = "fa-solid fa-floppy-disk";

  document.getElementById("admin-add-product-form").reset();
  handleCategorySelectChange();
  populateCategorySelect();
  const preview = document.getElementById("prod-images-preview");
  if (preview) preview.innerHTML = "";

  renderOverview();
  renderManageTable();
  switchTab("panel-manage-products");
}

function startEditProduct(productId) {
  const prod = adminState.products.find(p => p.id === productId);
  if (!prod) return;

  adminState.editingProductId = productId;

  // Change UI titles and buttons
  document.getElementById("add-panel-title").textContent = "Edit Product Details";
  const panelIcon = document.getElementById("add-panel-icon");
  if (panelIcon) panelIcon.className = "fa-solid fa-pen-to-square";
  document.getElementById("publish-text").textContent = "Save & Update Product";
  const pubIcon = document.getElementById("publish-icon");
  if (pubIcon) pubIcon.className = "fa-solid fa-circle-check";

  const cancelBtn = document.getElementById("btn-cancel-edit");
  if (cancelBtn) cancelBtn.classList.remove("hidden");

  // Populate inputs
  document.getElementById("prod-title").value = prod.title;
  const catSelectEl = document.getElementById("prod-category-select");
  if (catSelectEl) {
    catSelectEl.value = prod.category.toLowerCase();
  }
  handleCategorySelectChange();
  document.getElementById("prod-price").value = prod.price;
  document.getElementById("prod-old-price").value = prod.oldPrice || "";
  document.getElementById("prod-desc").value = prod.description;

  // Show previews of current images
  const preview = document.getElementById("prod-images-preview");
  if (preview) {
    preview.innerHTML = "";
    const images = prod.images && prod.images.length ? prod.images : [prod.image];
    images.forEach(url => {
      const img = document.createElement("img");
      img.src = url;
      img.className = "preview-thumb";
      preview.appendChild(img);
    });
  }

  switchTab("panel-add-product");
}

function cancelEditProduct() {
  adminState.editingProductId = null;

  document.getElementById("add-panel-title").textContent = "Add New Product to Store";
  const panelIcon = document.getElementById("add-panel-icon");
  if (panelIcon) panelIcon.className = "fa-solid fa-square-plus";
  document.getElementById("publish-text").textContent = "Publish Product to Store";
  const pubIcon = document.getElementById("publish-icon");
  if (pubIcon) pubIcon.className = "fa-solid fa-floppy-disk";

  const cancelBtn = document.getElementById("btn-cancel-edit");
  if (cancelBtn) cancelBtn.classList.add("hidden");

  document.getElementById("admin-add-product-form").reset();
  handleCategorySelectChange();
  populateCategorySelect();
  const preview = document.getElementById("prod-images-preview");
  if (preview) preview.innerHTML = "";

  switchTab("panel-manage-products");
}

// Publish to window scope so inline onclick works
window.startEditProduct = startEditProduct;
window.cancelEditProduct = cancelEditProduct;

function populateCategorySelect() {
  const select = document.getElementById("prod-category-select");
  if (!select) return;

  const categories = Array.from(new Set(adminState.products.map(p => p.category.toLowerCase().trim())));

  const labelMap = {
    cosmetics: "💄 Cosmetics",
    tech: "💻 Tech",
    handicraft: "💎 Handicraft"
  };

  const currentVal = select.value;

  let html = `<option value="" disabled selected>Select category...</option>`;
  categories.forEach(cat => {
    const label = labelMap[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1));
    html += `<option value="${cat}">${label}</option>`;
  });
  
  // Ensure the defaults are always listed if not already present
  ["cosmetics", "tech", "handicraft"].forEach(defaultCat => {
    if (!categories.includes(defaultCat)) {
      html += `<option value="${defaultCat}">${labelMap[defaultCat]}</option>`;
    }
  });

  html += `<option value="new">+ Create New Category...</option>`;
  select.innerHTML = html;

  if (currentVal && select.querySelector(`option[value="${currentVal}"]`)) {
    select.value = currentVal;
  }
}

function handleCategorySelectChange() {
  const select = document.getElementById("prod-category-select");
  const customGroup = document.getElementById("custom-category-group");
  const customInput = document.getElementById("prod-category-custom");

  if (select && select.value === "new") {
    customGroup.classList.remove("hidden");
    customInput.required = true;
  } else {
    customGroup.classList.add("hidden");
    customInput.required = false;
    customInput.value = "";
  }
}

window.handleCategorySelectChange = handleCategorySelectChange;

// ─── Delete Product ───────────────────────────────────────────────────────────
async function deleteProduct(productId) {
  const prod = adminState.products.find(p => p.id === productId);
  if (!prod) return;

  if (confirm(`Are you sure you want to delete "${prod.title}"?`)) {
    adminState.products = adminState.products.filter(p => p.id !== productId);
    await saveProductsToStorage();
    populateCategorySelect();
    renderOverview();
    renderManageTable();
    showAdminToast("Product deleted from store catalog", "info");
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function handleSaveSettings(e) {
  e.preventDefault();
  const num = document.getElementById("setting-whatsapp").value.trim().replace(/\+/g, "");
  const storeName = document.getElementById("setting-store-name").value.trim() || "AuraStore";
  const currency = document.getElementById("setting-currency").value.trim() || "$";
  const deliveryCharges = parseFloat(document.getElementById("setting-delivery-charges").value.trim()) || 0;
  const adminEmail = document.getElementById("setting-admin-email").value.trim();
  const sheetUrlEl = document.getElementById("setting-google-sheet-url");
  const sheetUrl = sheetUrlEl ? sheetUrlEl.value.trim() : "";
  const pinEl = document.getElementById("setting-admin-pin");
  const newPin = pinEl ? pinEl.value.trim() || "1234" : "1234";

  adminState.settings.whatsappNumber = num;
  adminState.settings.storeName = storeName;
  adminState.settings.currency = currency;
  adminState.settings.deliveryCharges = deliveryCharges;
  adminState.settings.adminEmail = adminEmail;
  adminState.settings.googleSheetUrl = sheetUrl;

  const githubUser = document.getElementById("setting-github-username").value.trim();
  const githubRepo = document.getElementById("setting-github-repo").value.trim();
  const githubToken = document.getElementById("setting-github-token").value.trim();
  const githubBranch = document.getElementById("setting-github-branch").value.trim() || "main";

  adminState.settings.githubUsername = githubUser;
  adminState.settings.githubRepo = githubRepo;
  adminState.settings.githubToken = githubToken;
  adminState.settings.githubBranch = githubBranch;

  localStorage.setItem("aura_settings", JSON.stringify(adminState.settings));
  localStorage.setItem("aura_admin_pin", newPin);

  showAdminToast("Store settings & Security PIN saved!", "success");
  initAdminDashboard();
}

function handleSaveFooterSettings(e) {
  e.preventDefault();
  const get = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };

  adminState.settings.footerDesc = get("setting-footer-desc");
  adminState.settings.footerEmail = get("setting-footer-email");
  adminState.settings.footerPhone = get("setting-footer-phone");
  adminState.settings.footerAddress = get("setting-footer-address");
  adminState.settings.footerFacebook = get("setting-footer-fb");
  adminState.settings.footerInstagram = get("setting-footer-ig");
  adminState.settings.footerTwitter = get("setting-footer-tw");
  adminState.settings.footerPinterest = get("setting-footer-pin");
  adminState.settings.footerCopyright = get("setting-footer-copy");

  localStorage.setItem("aura_settings", JSON.stringify(adminState.settings));
  showAdminToast("Footer settings saved successfully!", "success");
}

// ─── Storage ──────────────────────────────────────────────────────────────────
async function saveProductsToStorage() {
  localStorage.setItem("aura_products", JSON.stringify(adminState.products));

  const { githubUsername, githubRepo, githubToken } = adminState.settings;
  if (githubUsername && githubRepo && githubToken) {
    // GitHub API Mode
    try {
      const jsonStr = JSON.stringify(adminState.products, null, 2);
      const base64Content = btoa(unescape(encodeURIComponent(jsonStr)));
      
      await commitToGitHub("products/products.json", base64Content, "Update product catalog database");
      showAdminToast("Products saved successfully to GitHub! Redeploying site...", "success");
    } catch (error) {
      console.error("Failed to save products to GitHub repository:", error);
      showAdminToast("GitHub save failed! Saved to browser local storage only.", "error");
    }
  } else {
    // Local Server Mode
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(adminState.products)
      });
      if (response && response.ok) {
        showAdminToast("Products saved successfully to local folder products/products.json!", "success");
      } else {
        throw new Error("HTTP error " + response.status);
      }
    } catch (error) {
      console.warn("Could not write products to server:", error);
      showAdminToast("Saved to browser local storage only. (Server not running or write failed)", "info");
    }
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function initAdminTheme() {
  const savedTheme = localStorage.getItem("aura_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
}

function toggleAdminTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("aura_theme", next);
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showAdminToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const icon = type === "success" ? "fa-circle-check" : "fa-info-circle";
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}

async function commitToGitHub(filePath, contentBase64, commitMessage) {
  const { githubUsername, githubRepo, githubToken, githubBranch } = adminState.settings;
  if (!githubUsername || !githubRepo || !githubToken) {
    throw new Error("GitHub credentials not configured");
  }

  const url = `https://api.github.com/repos/${githubUsername}/${githubRepo}/contents/${filePath}`;
  
  // 1. Get current SHA if file exists
  let sha = null;
  try {
    const getRes = await fetch(`${url}?ref=${githubBranch}`, {
      headers: {
        "Authorization": `token ${githubToken}`
      }
    });
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }
  } catch (e) {
    // File doesn't exist
  }

  // 2. Commit file
  const putRes = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${githubToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: commitMessage,
      content: contentBase64,
      sha: sha,
      branch: githubBranch
    })
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`GitHub API commit failed: ${putRes.status} ${errText}`);
  }

  return await putRes.json();
}
