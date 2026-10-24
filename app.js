"use strict";

/* ==========================================
   NEX MARKET
   Supabase-connected marketplace storefront
   ========================================== */

const SUPABASE_URL = "https://nswsojbiimxweoytnzbz.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_doh6qh9IuQzauoM-JA8_pQ_TqWZMZNn";

let supabaseClient = null;
let databaseConnected = false;
let databaseLoading = false;

/* ==========================================
   DEMONSTRATION PRODUCTS
   Displayed until real products are available
   ========================================== */

const demoProducts = [
  {
    id: "demo-1",
    name: "Wireless Bluetooth Headphones",
    category: "Electronics",
    price: 35.99,
    currency: "USD",
    oldPrice: 49.99,
    emoji: "🎧",
    color: "#e8edff",
    rating: 4.8,
    badge: "POPULAR"
  },
  {
    id: "demo-2",
    name: "Smartphone Pro",
    category: "Electronics",
    price: 249.99,
    currency: "USD",
    oldPrice: 299.99,
    emoji: "📱",
    color: "#e2f3ff",
    rating: 4.9,
    badge: "TRENDING"
  },
  {
    id: "demo-3",
    name: "Classic Everyday Handbag",
    category: "Fashion",
    price: 42.50,
    currency: "USD",
    oldPrice: 55.00,
    emoji: "👜",
    color: "#f9e8df",
    rating: 4.6,
    badge: "SALE"
  },
  {
    id: "demo-4",
    name: "Premium Running Sneakers",
    category: "Shoes",
    price: 59.99,
    currency: "USD",
    oldPrice: 75.00,
    emoji: "👟",
    color: "#e4f4e9",
    rating: 4.7,
    badge: "POPULAR"
  },
  {
    id: "demo-5",
    name: "Modern Table Lamp",
    category: "Home",
    price: 28.99,
    currency: "USD",
    oldPrice: null,
    emoji: "💡",
    color: "#fff1d7",
    rating: 4.5,
    badge: ""
  },
  {
    id: "demo-6",
    name: "Daily Skincare Set",
    category: "Beauty",
    price: 24.99,
    currency: "USD",
    oldPrice: 32.99,
    emoji: "🧴",
    color: "#f8e6f3",
    rating: 4.6,
    badge: "SALE"
  },
  {
    id: "demo-7",
    name: "Professional Sports Ball",
    category: "Sports",
    price: 19.99,
    currency: "USD",
    oldPrice: null,
    emoji: "⚽",
    color: "#e5f1df",
    rating: 4.4,
    badge: ""
  },
  {
    id: "demo-8",
    name: "Smart Fitness Watch",
    category: "Electronics",
    price: 69.99,
    currency: "USD",
    oldPrice: 89.99,
    emoji: "⌚",
    color: "#e9e7ff",
    rating: 4.8,
    badge: "TRENDING"
  },
  {
    id: "demo-9",
    name: "Casual Cotton T-Shirt",
    category: "Fashion",
    price: 16.99,
    currency: "USD",
    oldPrice: 22.99,
    emoji: "👕",
    color: "#e7f1ff",
    rating: 4.3,
    badge: ""
  },
  {
    id: "demo-10",
    name: "Modern Living Room Sofa",
    category: "Home",
    price: 299.99,
    currency: "USD",
    oldPrice: 359.99,
    emoji: "🛋️",
    color: "#f1e8dc",
    rating: 4.7,
    badge: "FEATURED"
  },
  {
    id: "demo-11",
    name: "Luxury Wristwatch",
    category: "Fashion",
    price: 79.99,
    currency: "USD",
    oldPrice: 99.99,
    emoji: "⌚",
    color: "#f3e9d9",
    rating: 4.6,
    badge: "SALE"
  },
  {
    id: "demo-12",
    name: "Travel Backpack",
    category: "Sports",
    price: 34.99,
    currency: "USD",
    oldPrice: null,
    emoji: "🎒",
    color: "#e4ebdf",
    rating: 4.5,
    badge: ""
  }
];

let products = [...demoProducts];

let selectedCategory = "All";
let searchTerm = "";
let sortMode = "featured";

let cart = loadSavedData("nexMarketCart", []);
let favourites = loadSavedData("nexMarketFavourites", []);

cart = Array.isArray(cart)
  ? cart.map(item => ({
      id: String(item.id),
      quantity: Math.max(1, Number(item.quantity) || 1)
    }))
  : [];

favourites = Array.isArray(favourites)
  ? favourites.map(String)
  : [];

let toastTimer;

/* ==========================================
   GENERAL HELPERS
   ========================================== */

function getElement(id) {
  return document.getElementById(id);
}

function loadSavedData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    return saved !== null
      ? JSON.parse(saved)
      : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Could not save browser data:", error);
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function money(amount, currency = "USD") {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency
    }).format(Number(amount) || 0);
  } catch (error) {
    return currency + " " + Number(amount || 0).toFixed(2);
  }
}

function normaliseCategory(category) {
  const value = String(category || "").trim().toLowerCase();

  const categories = {
    "home & living": "Home",
    "home and living": "Home",
    "household": "Home",
    "footwear": "Shoes",
    "sports & fitness": "Sports"
  };

  if (categories[value]) {
    return categories[value];
  }

  return value
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : "Other";
}

/* ==========================================
   LOAD SUPABASE LIBRARY
   ========================================== */

function loadSupabaseLibrary() {
  return new Promise((resolve, reject) => {
    if (
      window.supabase &&
      typeof window.supabase.createClient === "function"
    ) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(
      'script[data-nex-supabase="true"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Supabase library failed to load.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    script.async = true;
    script.dataset.nexSupabase = "true";

    script.onload = resolve;

    script.onerror = () => {
      reject(new Error("Could not load the Supabase library."));
    };

    document.head.appendChild(script);
  });
}

async function connectSupabase() {
  databaseLoading = true;

  try {
    await loadSupabaseLibrary();

    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

    const { data, error } = await supabaseClient
      .from("products")
      .select(
        "id,name,description,category,price,currency,image_url,stock_quantity,status,created_at"
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    databaseConnected = true;

    const realProducts = (data || []).map(product => ({
      id: String(product.id),
      name: product.name,
      category: normaliseCategory(product.category),
      description: product.description || "",
      price: Number(product.price),
      currency: product.currency || "USD",
      imageUrl: product.image_url || "",
      stockQuantity: Number(product.stock_quantity || 0),
      rating: null,
      badge: "",
      emoji: "📦",
      color: "#edf1f7",
      isRealProduct: true
    }));

    if (realProducts.length > 0) {
      products = realProducts;

      /*
       * Remove demonstration-product entries from an old cart.
       * This prevents demo items being mistaken for real stock.
       */
      cart = cart.filter(item =>
        realProducts.some(product => product.id === item.id)
      );

      favourites = favourites.filter(id =>
        realProducts.some(product => product.id === id)
      );

      saveData("nexMarketCart", cart);
      saveData("nexMarketFavourites", favourites);

      showToast("Real products loaded from NEX MARKET database.");
    } else {
      products = [...demoProducts];

      showToast(
        "Database connected. Add active products to show real listings."
      );
    }

    renderProducts();
    renderCart();

    console.log("NEX MARKET database connected.");
    console.log("Active database products:", realProducts.length);

  } catch (error) {
    databaseConnected = false;

    console.error("NEX MARKET database connection failed:", error);

    products = [...demoProducts];

    renderProducts();
    renderCart();

    showToast(
      "Using demonstration products. Check your database connection."
    );
  } finally {
    databaseLoading = false;
  }
}

/* ==========================================
   PRODUCT FILTERING AND SORTING
   ========================================== */

function getVisibleProducts() {
  let result = products.filter(product => {
    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    const searchableText = (
      product.name + " " +
      product.category + " " +
      (product.description || "")
    ).toLowerCase();

    const matchesSearch = searchableText.includes(
      searchTerm.toLowerCase()
    );

    const inStock = !product.isRealProduct ||
      product.stockQuantity > 0;

    return matchesCategory && matchesSearch && inStock;
  });

  if (sortMode === "low") {
    result.sort((a, b) => a.price - b.price);
  } else if (sortMode === "high") {
    result.sort((a, b) => b.price - a.price);
  } else if (sortMode === "name") {
    result.sort((a, b) => a.name.localeCompare(b.name));
  }

  return result;
}

/* ==========================================
   RENDER PRODUCTS
   ========================================== */

function renderProducts() {
  const grid = getElement("productGrid");
  const emptyState = getElement("emptyState");
  const heading = getElement("productHeading");

  if (!grid) return;

  const visibleProducts = getVisibleProducts();

  if (heading) {
    if (searchTerm) {
      heading.textContent = "Search Results";
    } else if (selectedCategory !== "All") {
      heading.textContent = selectedCategory + " Products";
    } else {
      heading.textContent = "Featured Products";
    }
  }

  if (visibleProducts.length === 0) {
    grid.innerHTML = "";

    if (emptyState) {
      emptyState.hidden = false;
    }

    return;
  }

  if (emptyState) {
    emptyState.hidden = true;
  }

  grid.innerHTML = visibleProducts.map(product => {
    const isFavourite = favourites.includes(product.id);

    const badgeHTML = product.badge
      ? `<span class="product-badge">${escapeHTML(product.badge)}</span>`
      : "";

    const priceHTML = money(product.price, product.currency);

    const ratingHTML = product.rating
      ? `
        <div class="product-rating">
          <span>★</span>
          <span>${product.rating}</span>
          <small>Demo rating</small>
        </div>
      `
      : "";

    const oldPriceHTML = product.oldPrice
      ? `<span class="old-price">${money(product.oldPrice, product.currency)}</span>`
      : "";

    const imageHTML = product.imageUrl
      ? `
        <img
          class="real-product-image"
          src="${escapeHTML(product.imageUrl)}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
          onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
        <span class="product-emoji image-fallback" style="display:none">${product.emoji}</span>
      `
      : `<span class="product-emoji">${product.emoji}</span>`;

    const stockHTML = product.isRealProduct
      ? `<small class="stock-label">${product.stockQuantity} available</small>`
      : "";

    return `
      <article class="product-card">
        <div class="product-image" style="background:${product.color}">
          ${badgeHTML}

          <button
            class="favourite-button ${isFavourite ? "is-favourite" : ""}"
            data-favourite="${escapeHTML(product.id)}"
            aria-label="${isFavourite ? "Remove from" : "Add to"} favourites"
            aria-pressed="${isFavourite}">
            ${isFavourite ? "♥" : "♡"}
          </button>

          ${imageHTML}
        </div>

        <div class="product-info">
          <span class="product-category">
            ${escapeHTML(product.category)}
          </span>

          <h3>${escapeHTML(product.name)}</h3>

          ${ratingHTML}
          ${stockHTML}

          <div class="product-price">
            <strong>${priceHTML}</strong>
            ${oldPriceHTML}
          </div>

          <button
            class="add-to-cart"
            data-add="${escapeHTML(product.id)}">
            Add to Cart +
          </button>
        </div>
      </article>
    `;
  }).join("");
}

/* ==========================================
   CATEGORY FILTERS
   ========================================== */

function chooseCategory(category) {
  selectedCategory = category;

  updateCategoryButtons();
  renderProducts();

  const marketplace = getElement("marketplace");

  if (marketplace) {
    marketplace.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function updateCategoryButtons() {
  document.querySelectorAll("[data-category]").forEach(button => {
    const active = button.dataset.category === selectedCategory;

    button.classList.toggle("active", active);

    if (button.classList.contains("category-card")) {
      button.classList.toggle("selected", active);
    }
  });
}

/* ==========================================
   SEARCH
   ========================================== */

function setupSearch() {
  const form = getElement("searchForm");
  const input = getElement("searchInput");

  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();

      searchTerm = input ? input.value.trim() : "";

      renderProducts();

      getElement("marketplace")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  if (input) {
    input.addEventListener("input", () => {
      searchTerm = input.value.trim();
      renderProducts();
    });
  }
}

/* ==========================================
   FAVOURITES
   ========================================== */

function toggleFavourite(productId) {
  if (favourites.includes(productId)) {
    favourites = favourites.filter(id => id !== productId);
    showToast("Removed from favourites.");
  } else {
    favourites.push(productId);
    showToast("Added to favourites.");
  }

  saveData("nexMarketFavourites", favourites);
  renderProducts();
}

/* ==========================================
   SHOPPING CART
   ========================================== */

function addToCart(productId) {
  const product = products.find(
    item => item.id === productId
  );

  if (!product) return;

  if (product.isRealProduct && product.stockQuantity < 1) {
    showToast("This product is currently out of stock.");
    return;
  }

  const existingItem = cart.find(
    item => item.id === productId
  );

  if (existingItem) {
    if (
      product.isRealProduct &&
      existingItem.quantity >= product.stockQuantity
    ) {
      showToast("You have reached the available stock quantity.");
      return;
    }

    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      quantity: 1
    });
  }

  saveData("nexMarketCart", cart);
  renderCart();

  showToast(product.name + " added to your cart.");
}

function changeQuantity(productId, change) {
  const item = cart.find(entry => entry.id === productId);
  const product = products.find(entry => entry.id === productId);

  if (!item || !product) return;

  const nextQuantity = item.quantity + change;

  if (nextQuantity <= 0) {
    cart = cart.filter(entry => entry.id !== productId);
  } else if (
    product.isRealProduct &&
    nextQuantity > product.stockQuantity
  ) {
    showToast("Not enough stock available.");
    return;
  } else {
    item.quantity = nextQuantity;
  }

  saveData("nexMarketCart", cart);
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);

  saveData("nexMarketCart", cart);
  renderCart();

  showToast("Product removed from cart.");
}

function renderCart() {
  const cartItems = getElement("cartItems");
  const cartCount = getElement("cartCount");
  const cartTotal = getElement("cartTotal");
  const cartEmpty = getElement("cartEmpty");

  let totalQuantity = 0;
  let totalPrice = 0;
  const currencies = new Set();

  cart = cart.filter(item =>
    products.some(product => product.id === item.id) &&
    item.quantity > 0
  );

  cart.forEach(item => {
    const product = products.find(
      entry => entry.id === item.id
    );

    if (product) {
      totalQuantity += item.quantity;
      totalPrice += product.price * item.quantity;
      currencies.add(product.currency || "USD");
    }
  });

  if (cartCount) {
    cartCount.textContent = totalQuantity;
  }

  if (cartTotal) {
    cartTotal.textContent = currencies.size > 1
      ? "Multiple currencies"
      : money(totalPrice, currencies.values().next().value || "USD");
  }

  if (cartEmpty) {
    cartEmpty.hidden = cart.length > 0;
  }

  if (cartItems) {
    cartItems.innerHTML = cart.map(item => {
      const product = products.find(
        entry => entry.id === item.id
      );

      if (!product) return "";

      const imageHTML = product.imageUrl
        ? `<img src="${escapeHTML(product.imageUrl)}" alt="">`
        : product.emoji;

      return `
        <div class="cart-item">
          <div class="cart-item-image" style="background:${product.color}">
            ${imageHTML}
          </div>

          <div class="cart-item-details">
            <h3>${escapeHTML(product.name)}</h3>

            <strong>${money(product.price, product.currency)}</strong>

            <div class="quantity-controls">
              <button
                data-quantity="${escapeHTML(product.id)}"
                data-change="-1"
                aria-label="Decrease quantity">−</button>

              <span>${item.quantity}</span>

              <button
                data-quantity="${escapeHTML(product.id)}"
                data-change="1"
                aria-label="Increase quantity">+</button>
            </div>
          </div>

          <button
            class="remove-cart-item"
            data-remove="${escapeHTML(product.id)}"
            aria-label="Remove product">×</button>
        </div>
      `;
    }).join("");
  }

  saveData("nexMarketCart", cart);
}

/* ==========================================
   CART PANEL
   ========================================== */

function openCart() {
  getElement("cartPanel")?.classList.add("open");
  getElement("cartOverlay")?.classList.add("open");

  document.body.classList.add("cart-open");
}

function closeCart() {
  getElement("cartPanel")?.classList.remove("open");
  getElement("cartOverlay")?.classList.remove("open");

  document.body.classList.remove("cart-open");
}

/* ==========================================
   NOTIFICATIONS
   ========================================== */

function showToast(message) {
  const toast = getElement("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* ==========================================
   RESET FILTERS
   ========================================== */

function resetFilters() {
  selectedCategory = "All";
  searchTerm = "";
  sortMode = "featured";

  const input = getElement("searchInput");
  const sort = getElement("sortSelect");

  if (input) input.value = "";
  if (sort) sort.value = "featured";

  updateCategoryButtons();
  renderProducts();

  showToast("Showing all products.");
}

/* ==========================================
   EVENTS
   ========================================== */

function setupEvents() {
  document.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add]");

    if (addButton) {
      addToCart(addButton.dataset.add);
      return;
    }

    const favouriteButton = event.target.closest("[data-favourite]");

    if (favouriteButton) {
      toggleFavourite(favouriteButton.dataset.favourite);
      return;
    }

    const quantityButton = event.target.closest("[data-quantity]");

    if (quantityButton) {
      changeQuantity(
        quantityButton.dataset.quantity,
        Number(quantityButton.dataset.change)
      );
      return;
    }

    const removeButton = event.target.closest("[data-remove]");

    if (removeButton) {
      removeFromCart(removeButton.dataset.remove);
      return;
    }

    const categoryButton = event.target.closest("[data-category]");

    if (categoryButton) {
      chooseCategory(categoryButton.dataset.category);
    }
  });

  const sortSelect = getElement("sortSelect");

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      sortMode = sortSelect.value;
      renderProducts();
    });
  }

  getElement("cartButton")?.addEventListener("click", openCart);
  getElement("closeCart")?.addEventListener("click", closeCart);
  getElement("cartOverlay")?.addEventListener("click", closeCart);

  getElement("shopButton")?.addEventListener("click", () => {
    getElement("marketplace")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  getElement("clearFilters")?.addEventListener("click", resetFilters);
  getElement("resetButton")?.addEventListener("click", resetFilters);

  getElement("checkoutButton")?.addEventListener("click", () => {
    showToast(
      "Checkout is not connected yet. No payment has been made."
    );
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeCart();
    }
  });
}

/* ==========================================
   START NEX MARKET
   ========================================== */

async function startMarketplace() {
  const year = getElement("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  setupSearch();
  setupEvents();
  updateCategoryButtons();

  // Show the storefront immediately.
  renderProducts();
  renderCart();

  // Connect to Supabase and replace demo listings
  // when active database products are available.
  await connectSupabase();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    startMarketplace
  );
} else {
  startMarketplace();
}
