/* =====================================================
   NEX MARKET — STOREFRONT ENGINE
   Version 1.0
   ===================================================== */

"use strict";

/* ---------- DEMONSTRATION PRODUCTS ---------- */

const products = [
  {
    id: 1,
    name: "Wireless Bluetooth Headphones",
    category: "Electronics",
    price: 35.99,
    oldPrice: 49.99,
    emoji: "🎧",
    color: "#e8edff",
    rating: 4.8,
    badge: "POPULAR"
  },
  {
    id: 2,
    name: "Smartphone Pro",
    category: "Electronics",
    price: 249.99,
    oldPrice: 299.99,
    emoji: "📱",
    color: "#e2f3ff",
    rating: 4.9,
    badge: "TRENDING"
  },
  {
    id: 3,
    name: "Classic Everyday Handbag",
    category: "Fashion",
    price: 42.50,
    oldPrice: 55.00,
    emoji: "👜",
    color: "#f9e8df",
    rating: 4.6,
    badge: "SALE"
  },
  {
    id: 4,
    name: "Premium Running Sneakers",
    category: "Shoes",
    price: 59.99,
    oldPrice: 75.00,
    emoji: "👟",
    color: "#e4f4e9",
    rating: 4.7,
    badge: "POPULAR"
  },
  {
    id: 5,
    name: "Modern Table Lamp",
    category: "Home",
    price: 28.99,
    oldPrice: null,
    emoji: "💡",
    color: "#fff1d7",
    rating: 4.5,
    badge: ""
  },
  {
    id: 6,
    name: "Daily Skincare Set",
    category: "Beauty",
    price: 24.99,
    oldPrice: 32.99,
    emoji: "🧴",
    color: "#f8e6f3",
    rating: 4.6,
    badge: "SALE"
  },
  {
    id: 7,
    name: "Professional Sports Ball",
    category: "Sports",
    price: 19.99,
    oldPrice: null,
    emoji: "⚽",
    color: "#e5f1df",
    rating: 4.4,
    badge: ""
  },
  {
    id: 8,
    name: "Smart Fitness Watch",
    category: "Electronics",
    price: 69.99,
    oldPrice: 89.99,
    emoji: "⌚",
    color: "#e9e7ff",
    rating: 4.8,
    badge: "TRENDING"
  },
  {
    id: 9,
    name: "Casual Cotton T-Shirt",
    category: "Fashion",
    price: 16.99,
    oldPrice: 22.99,
    emoji: "👕",
    color: "#e7f1ff",
    rating: 4.3,
    badge: ""
  },
  {
    id: 10,
    name: "Comfortable Home Sofa",
    category: "Home",
    price: 299.99,
    oldPrice: 359.99,
    emoji: "🛋️",
    color: "#f1e8dc",
    rating: 4.7,
    badge: "FEATURED"
  },
  {
    id: 11,
    name: "Luxury Wristwatch",
    category: "Fashion",
    price: 79.99,
    oldPrice: 99.99,
    emoji: "⌚",
    color: "#f3e9d9",
    rating: 4.6,
    badge: "SALE"
  },
  {
    id: 12,
    name: "Travel Backpack",
    category: "Sports",
    price: 34.99,
    oldPrice: null,
    emoji: "🎒",
    color: "#e4ebdf",
    rating: 4.5,
    badge: ""
  }
];

/* ---------- APPLICATION STATE ---------- */

let selectedCategory = "All";
let searchTerm = "";
let sortMode = "featured";

let cart = loadSavedData("nexMarketCart", []);
let favourites = loadSavedData("nexMarketFavourites", []);

let toastTimer;

/* ---------- ELEMENT HELPERS ---------- */

function getElement(id) {
  return document.getElementById(id);
}

function loadSavedData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    if (saved !== null) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn("Saved data could not be loaded:", error);
  }

  return fallback;
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Data could not be saved:", error);
    showToast("Your browser could not save this change.");
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
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

function money(amount) {
  return "$" + Number(amount).toFixed(2);
}

/* ---------- PRODUCT FILTERING ---------- */

function getVisibleProducts() {
  let result = products.filter(function (product) {
    const matchesCategory =
      selectedCategory === "All" ||
