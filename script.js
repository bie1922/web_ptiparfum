/* PTI PARFUM — Interaksi website */
(() => {
  "use strict";

  const products = [
    { id: 1, name: "Velvet Bloom", category: "Floral", price: 129000, description: "Floral lembut dengan sentuhan elegan.", tag: "BEST SELLER", glow: "rgba(190,110,178,.3)", dark: "#6c3c70", light: "#e7b4d7", mid: "#b878ae" },
    { id: 2, name: "Midnight Oud", category: "Woody", price: 159000, description: "Woody hangat untuk kesan berkarakter.", tag: "SIGNATURE", glow: "rgba(156,111,76,.28)", dark: "#4b3025", light: "#d6b48c", mid: "#8e6245" },
    { id: 3, name: "Ocean Mist", category: "Fresh", price: 119000, description: "Aroma segar yang ringan dan bersih.", tag: "FRESH PICK", glow: "rgba(83,161,191,.28)", dark: "#24506b", light: "#a9e1e8", mid: "#4d9eaf" },
    { id: 4, name: "Amber Muse", category: "Woody", price: 149000, description: "Amber hangat dengan nuansa modern.", tag: "NEW", glow: "rgba(194,135,67,.27)", dark: "#684326", light: "#e8c38b", mid: "#b77b43" },
    { id: 5, name: "Citrus Day", category: "Fresh", price: 99000, description: "Citrus cerah untuk menemani aktivitas.", tag: "DAILY WEAR", glow: "rgba(191,179,81,.25)", dark: "#60602a", light: "#e5df91", mid: "#b5b35a" },
    { id: 6, name: "Rose Whisper", category: "Floral", price: 139000, description: "Mawar halus dengan sentuhan powdery.", tag: "SOFT & SWEET", glow: "rgba(190,105,131,.27)", dark: "#6e3448", light: "#eab8c5", mid: "#ba6c84" },
    { id: 7, name: "Forest Noir", category: "Woody", price: 169000, description: "Nuansa hutan yang dalam dan tenang.", tag: "DEEP NOTES", glow: "rgba(87,132,101,.25)", dark: "#254d39", light: "#a4c5a6", mid: "#598468" },
    { id: 8, name: "Cloud Nine", category: "Fresh", price: 109000, description: "Musk bersih yang lembut dan nyaman.", tag: "EVERYDAY", glow: "rgba(142,145,190,.25)", dark: "#55566f", light: "#d5d8ed", mid: "#9298bf" }
  ];

  const money = (value) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0
  }).format(value);

  const productGrid = document.getElementById("product-grid");
  const emptyState = document.getElementById("empty-state");
  const searchInput = document.getElementById("product-search");
  const filterButtons = [...document.querySelectorAll(".filter-tab")];
  const cartCount = document.getElementById("cart-count");
  const cartModal = document.getElementById("cart-modal");
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  const checkoutFeedback = document.getElementById("checkout-feedback");
  let activeFilter = "Semua";
  let cart = loadCart();

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem("pti-parfum-cart") || "[]");
      return Array.isArray(saved) ? saved.filter(item =>
        products.some(product => product.id === item.id) &&
        Number.isInteger(item.quantity) && item.quantity > 0
      ) : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    try { localStorage.setItem("pti-parfum-cart", JSON.stringify(cart)); } catch { /* storage may be unavailable */ }
    updateCartBadge();
  }

  function productCard(product) {
    const card = document.createElement("article");
    card.className = "product-card reveal";
    card.innerHTML = `
      <div class="product-visual" style="--product-glow:${product.glow};--bottle-dark:${product.dark};--bottle-light:${product.light};--bottle-mid:${product.mid}">
        <span class="product-tag">${product.tag}</span>
        <div class="mini-bottle" aria-hidden="true"></div>
      </div>
      <div class="product-info">
        <span class="product-category">${product.category}</span>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-buy-row">
          <span class="product-price">${money(product.price)}</span>
          <button class="add-to-cart" type="button" data-add="${product.id}" aria-label="Tambahkan ${product.name} ke keranjang">+</button>
        </div>
      </div>`;
    return card;
  }

  function renderProducts() {
    if (!productGrid) return;
    const query = (searchInput?.value || "").trim().toLowerCase();
    const filtered = products.filter(product => {
      const categoryMatch = activeFilter === "Semua" || product.category === activeFilter;
      const queryMatch = `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query);
      return categoryMatch && queryMatch;
    });
    productGrid.replaceChildren(...filtered.map(productCard));
    if (emptyState) emptyState.hidden = filtered.length > 0;
    observeReveal(productGrid.querySelectorAll(".reveal"));
  }

  function observeReveal(elements) {
    if (!("IntersectionObserver" in window)) {
      elements.forEach(el => el.classList.add("visible"));
      return;
    }
    elements.forEach(el => {
      if (el.dataset.observed) return;
      el.dataset.observed = "true";
      revealObserver.observe(el);
    });
  }

  const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -20px 0px" })
    : null;

  function updateCartBadge() {
    if (cartCount) cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function addToCart(id) {
    const existing = cart.find(item => item.id === id);
    if (existing) existing.quantity += 1;
    else cart.push({ id, quantity: 1 });
    saveCart();
    renderCart();
    const product = products.find(item => item.id === id);
    if (product) showToast(`${product.name} ditambahkan ke keranjang`);
  }

  function changeQuantity(id, delta) {
    const item = cart.find(row => row.id === id);
    if (!item) return;
    item.quantity += delta;
    cart = cart.filter(row => row.quantity > 0);
    saveCart();
    renderCart();
  }

  function renderCart() {
    if (!cartItems || !cartTotal) return;
    const rows = cart.map(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) return null;
      const row = document.createElement("div");
      row.className = "cart-row";
      const details = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = product.name;
      const price = document.createElement("small");
      price.textContent = `${money(product.price)} / botol`;
      details.append(name, price);
      const actions = document.createElement("div");
      actions.className = "cart-row-actions";
      const minus = document.createElement("button");
      minus.type = "button"; minus.textContent = "−"; minus.setAttribute("aria-label", `Kurangi ${product.name}`);
      minus.addEventListener("click", () => changeQuantity(product.id, -1));
      const qty = document.createElement("span"); qty.textContent = item.quantity;
      const plus = document.createElement("button");
      plus.type = "button"; plus.textContent = "+"; plus.setAttribute("aria-label", `Tambah ${product.name}`);
      plus.addEventListener("click", () => changeQuantity(product.id, 1));
      actions.append(minus, qty, plus);
      row.append(details, actions);
      return row;
    }).filter(Boolean);

    if (!rows.length) {
      const empty = document.createElement("p");
      empty.className = "cart-empty";
      empty.textContent = "Keranjang kamu masih kosong. Yuk, pilih aroma favoritmu!";
      cartItems.replaceChildren(empty);
    } else {
      cartItems.replaceChildren(...rows);
    }
    const total = cart.reduce((sum, item) => {
      const product = products.find(p => p.id === item.id);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
    cartTotal.textContent = money(total);
    if (checkoutFeedback) checkoutFeedback.textContent = "Demo keranjang: belum terhubung ke sistem pembayaran.";
  }

  let toastTimer;
  function showToast(text) {
    let toast = document.getElementById("pti-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "pti-toast";
      toast.className = "pti-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
  }

  filterButtons.forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "Semua";
    filterButtons.forEach(tab => tab.classList.toggle("active", tab === button));
    renderProducts();
  }));
  searchInput?.addEventListener("input", renderProducts);
  productGrid?.addEventListener("click", event => {
    const button = event.target.closest("[data-add]");
    if (button) addToCart(Number(button.dataset.add));
  });

  document.getElementById("cart-open")?.addEventListener("click", () => {
    renderCart();
    cartModal.hidden = false;
    document.getElementById("cart-close")?.focus();
  });
  document.getElementById("cart-close")?.addEventListener("click", () => {
    cartModal.hidden = true;
    document.getElementById("cart-open")?.focus();
  });
  cartModal?.addEventListener("click", event => {
    if (event.target === cartModal) cartModal.hidden = true;
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (cartModal && !cartModal.hidden) cartModal.hidden = true;
      const panel = document.getElementById("chatbot-panel");
      if (panel && !panel.hidden) closeChat();
    }
  });
  document.getElementById("checkout-button")?.addEventListener("click", () => {
    if (!cart.length) {
      if (checkoutFeedback) checkoutFeedback.textContent = "Keranjang masih kosong. Tambahkan produk terlebih dahulu.";
      return;
    }
    if (checkoutFeedback) checkoutFeedback.textContent = "Keranjang sudah siap. Hubungkan tombol ini ke WhatsApp/admin atau sistem checkout sebelum website digunakan untuk transaksi nyata.";
  });

  document.getElementById("contact-form")?.addEventListener("submit", event => {
    event.preventDefault();
    const feedback = document.getElementById("contact-feedback");
    if (feedback) feedback.textContent = "Terima kasih! Formulir ini masih berupa demo dan belum mengirim pesan ke server.";
    event.target.reset();
  });

  document.getElementById("current-year").textContent = new Date().getFullYear();

  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");
  menuToggle?.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
  });
  navLinks?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }));

  // Scroll reveal for static page sections.
  document.querySelectorAll(".reveal").forEach(el => observeReveal([el]));
  renderProducts();
  updateCartBadge();

  /* Chatbot — jawaban otomatis berbasis kata kunci, tanpa API eksternal. */
  const toggle = document.getElementById("chatbot-toggle");
  const close = document.getElementById("chatbot-close");
  const panel = document.getElementById("chatbot-panel");
  const toggleIcon = document.getElementById("chatbot-toggle-icon");
  const chatForm = document.getElementById("chatbot-form");
  const chatInput = document.getElementById("chatbot-input");
  const messages = document.getElementById("chatbot-messages");
  const quickReplies = document.querySelector(".chatbot-quick-replies");
  let replyTimer;

  function openChat() {
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Tutup chatbot");
    toggleIcon.textContent = "×";
    chatInput.focus();
  }
  function closeChat() {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Buka chatbot");
    toggleIcon.textContent = "✦";
    toggle.focus();
  }
  function appendMessage(text, sender) {
    const node = document.createElement("div");
    node.className = `chat-message ${sender}`;
    node.textContent = text;
    messages.appendChild(node);
    messages.scrollTop = messages.scrollHeight;
  }
  function botReply(raw) {
    const text = raw.toLowerCase();
    if (/halo|hai|hello|assalamualaikum/.test(text)) return "Halo juga! 👋 Selamat datang di PTI Parfum. Ada yang bisa aku bantu hari ini?";
    if (/produk|parfum|aroma|wangi|koleksi/.test(text)) {
      return "🧴 Ini beberapa pilihan dari koleksi PTI:\n" + products.map(p => `• ${p.name} — ${money(p.price)} (${p.category})`).join("\n") + "\n\nKamu bisa menambahkannya ke keranjang dari bagian Koleksi.";
    }
    if (/harga|berapa|murah|mahal|diskon/.test(text)) return "💜 Harga koleksi saat ini mulai dari Rp99.000. Harga masing-masing produk ada di bagian Koleksi. Harga ini contoh katalog dan bisa kamu ubah di script.js.";
    if (/pesan|order|beli|checkout|keranjang/.test(text)) return "🛍️ Cara memesan:\n1. Pilih produk di bagian Koleksi.\n2. Tekan tombol + untuk memasukkannya ke keranjang.\n3. Buka Keranjang untuk memeriksa jumlah dan total.\n4. Hubungi admin untuk menyelesaikan pesanan. Sistem pembayaran belum dihubungkan.";
    if (/pembayaran|bayar|transfer|cod|rekening/.test(text)) return "💳 Website ini belum terhubung ke sistem pembayaran. Konfirmasikan metode pembayaran langsung dengan admin sebelum transfer.";
    if (/kontak|admin|whatsapp|wa\b|hubungi/.test(text)) return "💬 Kamu bisa mengisi formulir pada bagian Kontak. Formulir saat ini masih demo, jadi belum mengirim pesan. Tambahkan alamat email atau nomor WhatsApp resmi sebelum website dipublikasikan.";
    if (/kirim|pengiriman|ongkir|kurir/.test(text)) return "📦 Ongkos dan estimasi pengiriman bergantung pada alamat tujuan. Silakan konfirmasi kepada admin sebelum memesan.";
    if (/terima kasih|makasih|thanks/.test(text)) return "Sama-sama! ✨ Terima kasih sudah mampir ke PTI Parfum.";
    return "Terima kasih atas pertanyaanmu! 😊 Aku bisa membantu tentang produk, harga, pemesanan, pembayaran, dan kontak. Untuk detail khusus, silakan konfirmasi kepada admin PTI.";
  }
  function sendChat(text) {
    const value = text.trim().slice(0, 500);
    if (!value || chatInput.disabled) return;
    appendMessage(value, "user");
    chatInput.value = "";
    chatInput.disabled = true;
    const typing = document.createElement("div");
    typing.className = "chatbot-typing";
    typing.textContent = "Asisten PTI sedang mengetik…";
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
    replyTimer = setTimeout(() => {
      typing.remove();
      appendMessage(botReply(value), "bot");
      chatInput.disabled = false;
      chatInput.focus();
    }, 650);
  }
  toggle?.addEventListener("click", () => panel.hidden ? openChat() : closeChat());
  close?.addEventListener("click", closeChat);
  chatForm?.addEventListener("submit", event => {
    event.preventDefault();
    sendChat(chatInput.value);
  });
  quickReplies?.addEventListener("click", event => {
    const button = event.target.closest("[data-chat-message]");
    if (button) sendChat(button.dataset.chatMessage);
  });

  // Make closeChat available to the shared Escape handler.
  window.addEventListener("beforeunload", () => clearTimeout(replyTimer));
})();