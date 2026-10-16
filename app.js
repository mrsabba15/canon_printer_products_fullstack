const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)],
  money = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
const state = {
  products: [],
  category: "All",
  search: "",
  cart: JSON.parse(localStorage.getItem("cpp-cart") || "[]"),
  token: localStorage.getItem("cpp-token") || "",
  user: JSON.parse(localStorage.getItem("cpp-user") || "null"),
  authMode: "login",
  adminTab: "products",
};
const fallback =
  "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80";
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 2600);
}
function open(id) {
  let d = $("#" + id);
  if (d && !d.open) d.showModal();
}
function close(id) {
  if ($("#" + id)?.open) $("#" + id).close();
}
async function api(url, opt = {}) {
  let h = { "Content-Type": "application/json", ...(opt.headers || {}) };
  if (state.token) h.Authorization = "Bearer " + state.token;
  let r = await fetch(url, { ...opt, headers: h }),
    d = await r.json().catch(() => ({}));
  if (!r.ok) throw Error(d.error || "Request failed");
  return d;
}
function saveCart() {
  localStorage.setItem("cpp-cart", JSON.stringify(state.cart));
  $("#cart-count").textContent = state.cart.reduce((n, x) => n + x.qty, 0);
}
function updateUser() {
  $("#account-btn").textContent = state.user
    ? state.user.name.split(" ")[0]
    : "Sign in";
  $("#admin-open").classList.toggle("hidden", state.user?.role !== "admin");
}
async function load() {
  try {
    let p = new URLSearchParams();
    if (state.search) p.set("q", state.search);
    if (state.category !== "All") p.set("category", state.category);
    state.products = await api("/api/products?" + p);
    render();
  } catch (e) {
    $("#product-grid").textContent = e.message;
  }
}
function render() {
  let ps = [...state.products],
    sort = $("#sort").value;
  if (sort === "low") ps.sort((a, b) => a.price - b.price);
  if (sort === "high") ps.sort((a, b) => b.price - a.price);
  $("#result-note").textContent = ps.length + " printer(s) found";
  $("#product-grid").innerHTML = ps.length
    ? ps
        .map(
          (p) =>
            `<article class="card"><div class="photo" data-detail="${p.id}"><span class="tag">${p.category}</span><img src="${p.image_url}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}'"></div><div class="card-body"><span class="category">${p.category}</span><h3>${p.name}</h3><span class="model">Model: ${p.model}</span><p class="desc">${p.description}</p><div class="bottom"><div><div class="price">${money(p.price)}</div><div class="stock">${p.stock > 0 ? p.stock + " in stock" : "Out of stock"}</div></div><button class="add" data-add="${p.id}" ${p.stock <= 0 ? "disabled" : ""}>Add to cart +</button></div></div></article>`,
        )
        .join("")
    : '<div class="empty">No printers match your search. Try another model or category.</div>';
}
function add(id) {
  let p = state.products.find((x) => x.id === +id);
  if (!p) return;
  let x = state.cart.find((x) => x.id === p.id);
  if (x) x.qty = Math.min(10, x.qty + 1);
  else state.cart.push({ id: p.id, qty: 1 });
  saveCart();
  renderCart();
  toast("Added to cart");
}
function cartLines() {
  return state.cart
    .map((x) => ({ ...x, p: state.products.find((p) => p.id === x.id) }))
    .filter((x) => x.p);
}
function total() {
  return cartLines().reduce((n, x) => n + x.p.price * x.qty, 0);
}
function renderCart() {
  let lines = cartLines();
  $("#cart-items").innerHTML = lines.length
    ? lines
        .map(
          (x) =>
            `<div class="line"><img src="${x.p.image_url}" onerror="this.src='${fallback}'" alt=""><div><b>${x.p.name}</b><small>${money(x.p.price)} each</small><div class="qty"><button data-qty="${x.id}" data-delta="-1">−</button>${x.qty}<button data-qty="${x.id}" data-delta="1">+</button><button class="remove" data-remove="${x.id}">Remove</button></div></div><b>${money(x.p.price * x.qty)}</b></div>`,
        )
        .join("")
    : '<div class="empty">Your cart is empty.</div>';
  $("#cart-total").textContent = money(total());
  $("#checkout-open").disabled = !lines.length;
}
function productDetail(id) {
  let p = state.products.find((p) => p.id === +id);
  if (!p) return;
  $("#product-detail").innerHTML =
    `<div class="detail"><img src="${p.image_url}" onerror="this.src='${fallback}'" alt="${p.name}"><div><span class="category">${p.category}</span><h2>${p.name}</h2><span class="model">Model: ${p.model}</span><p class="muted">${p.description}</p><div class="price">${money(p.price)}</div><p class="muted">${p.stock} in stock</p><button class="primary wide" data-add="${p.id}">Add to cart</button><p class="muted">Verify pricing and availability before publishing.</p></div></div>`;
  open("product-dialog");
}
function setAuthMode(m) {
  state.authMode = m;
  $$("[data-auth-mode]").forEach((b) =>
    b.classList.toggle("active", b.dataset.authMode === m),
  );
  $("#auth-title").textContent =
    m === "login" ? "Welcome back" : "Create your account";
  $("#name-wrap").classList.toggle("hidden", m !== "register");
  $("#auth-submit").textContent = m === "login" ? "Sign in" : "Create account";
  $("#auth-message").textContent = "";
}
async function authSubmit(e) {
  e.preventDefault();
  let body = Object.fromEntries(new FormData(e.target));
  try {
    let d = await api(
      "/api/auth/" + (state.authMode === "login" ? "login" : "register"),
      { method: "POST", body: JSON.stringify(body) },
    );
    state.token = d.token;
    state.user = d.user;
    localStorage.setItem("cpp-token", d.token);
    localStorage.setItem("cpp-user", JSON.stringify(d.user));
    updateUser();
    close("auth-dialog");
    toast("Welcome, " + d.user.name);
  } catch (e) {
    $("#auth-message").textContent = e.message;
  }
}
async function checkout(e) {
  e.preventDefault();
  if (!state.user) {
    close("checkout-dialog");
    open("auth-dialog");
    return;
  }
  $("#checkout-message").textContent = "Starting secure payment…";
  try {
    let shipping = Object.fromEntries(new FormData(e.target)),
      o = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({ items: state.cart, shipping }),
      });
    if (!window.Razorpay) throw Error("Razorpay checkout failed to load.");
    new Razorpay({
      key: o.keyId,
      amount: o.amount,
      currency: o.currency,
      name: "Canon Printer products",
      description: "Printer order",
      order_id: o.razorpayOrderId,
      prefill: {
        name: shipping.name,
        email: state.user.email,
        contact: shipping.phone,
      },
      theme: { color: "#d71920" },
      handler: async (r) => {
        try {
          let v = await api("/api/payments/verify", {
            method: "POST",
            body: JSON.stringify({ ...r, orderId: o.orderId }),
          });
          state.cart = [];
          saveCart();
          renderCart();
          close("checkout-dialog");
          close("cart-dialog");
          toast(v.message);
          load();
        } catch (err) {
          toast("Payment verification failed: " + err.message);
        }
      },
      modal: {
        ondismiss: () =>
          ($("#checkout-message").textContent =
            "Payment not completed. You can retry."),
      },
    }).open();
    $("#checkout-message").textContent = "";
  } catch (e) {
    $("#checkout-message").textContent = e.message;
  }
}
async function loadOrders() {
  try {
    let os = await api("/api/orders");
    $("#orders-list").innerHTML = os.length
      ? os
          .map(
            (o) =>
              `<div class="order"><b>Order #${o.id} <span class="pill">${o.status}</span></b><p>${new Date(o.created_at).toLocaleString()}<br>${o.items.map((i) => i.name + " × " + i.qty).join("<br>")}<br><b>${money(o.amount)}</b></p></div>`,
          )
          .join("")
      : '<p class="muted">No orders yet.</p>';
  } catch (e) {
    $("#orders-list").textContent = e.message;
  }
}
async function admin(tab = state.adminTab) {
  if (state.user?.role !== "admin") {
    toast("Sign in with an admin account");
    return;
  }
  state.adminTab = tab;
  $$("[data-admin-tab]").forEach((b) =>
    b.classList.toggle("active", b.dataset.adminTab === tab),
  );
  open("admin-dialog");
  await adminRender();
}
async function adminRender() {
  let el = $("#admin-content");
  try {
    if (state.adminTab === "products") {
      let ps = await api("/api/admin/products");
      el.innerHTML = `<table class="table"><tr><th>Product</th><th>Price</th><th>Stock</th><th>Action</th></tr>${ps.map((p) => `<tr><td>${p.name}<br>${p.model}</td><td>${money(p.price)}</td><td><input type="number" min="0" value="${p.stock}" data-stock="${p.id}" style="width:55px"></td><td><button data-toggle="${p.id}" data-active="${p.active}">${p.active ? "Hide" : "Show"}</button> <button data-save-stock="${p.id}">Save stock</button></td></tr>`).join("")}</table>`;
    } else if (state.adminTab === "orders") {
      let os = await api("/api/orders");
      el.innerHTML = os.length
        ? os
            .map(
              (o) =>
                `<div class="order"><b>Order #${o.id} — ${money(o.amount)}</b><p>${o.customer_name || ""} ${o.customer_email || ""}<br>${o.items.map((i) => i.name + " × " + i.qty).join(", ")}<br>Status: ${o.status}</p><select data-status="${o.id}"><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select> <button data-save-order="${o.id}">Update</button></div>`,
            )
            .join("")
        : '<p class="muted">No orders yet.</p>';
    } else {
      el.innerHTML = `<form id="add-form" class="product-form"><label>Name<input name="name" required></label><label>Model<input name="model" required></label><label>Category<input name="category" required></label><label>Price INR<input name="price" type="number" min="1" step=".01" required></label><label>Stock<input name="stock" type="number" min="0" value="5"></label><label>Image URL<input name="image_url" type="url" required></label><label class="fullrow">Description<textarea name="description" required></textarea></label><div class="fullrow"><button class="primary">Add product</button><p id="admin-msg" class="message"></p></div></form>`;
    }
  } catch (e) {
    el.textContent = e.message;
  }
}
document.addEventListener("click", async (e) => {
  let t = e.target.closest("button,[data-detail]");
  if (!t) return;
  if (t.dataset.close) {
    close(t.dataset.close);
    return;
  }
  if (t.dataset.add) {
    add(t.dataset.add);
    return;
  }
  if (t.dataset.detail) {
    productDetail(t.dataset.detail);
    return;
  }
  if (t.id === "cart-open") {
    renderCart();
    open("cart-dialog");
    return;
  }
  if (t.id === "account-btn") {
    if (state.user) {
      await loadOrders();
      open("orders-dialog");
    } else open("auth-dialog");
    return;
  }
  if (t.id === "checkout-open") {
    if (!state.user) {
      close("cart-dialog");
      open("auth-dialog");
    } else {
      close("cart-dialog");
      open("checkout-dialog");
    }
    return;
  }
  if (t.id === "admin-open") {
    admin();
    return;
  }
  if (t.dataset.authMode) {
    setAuthMode(t.dataset.authMode);
    return;
  }
  if (t.dataset.adminTab) {
    admin(t.dataset.adminTab);
    return;
  }
  if (t.dataset.qty) {
    let x = state.cart.find((x) => x.id === +t.dataset.qty);
    if (x) {
      x.qty += +t.dataset.delta;
      if (x.qty <= 0) state.cart = state.cart.filter((y) => y.id !== x.id);
      x.qty = Math.min(10, x.qty);
      saveCart();
      renderCart();
    }
    return;
  }
  if (t.dataset.remove) {
    state.cart = state.cart.filter((x) => x.id !== +t.dataset.remove);
    saveCart();
    renderCart();
    return;
  }
  if (t.id === "signout-btn") {
    state.token = "";
    state.user = null;
    localStorage.removeItem("cpp-token");
    localStorage.removeItem("cpp-user");
    updateUser();
    close("orders-dialog");
    return;
  }
  try {
    if (t.dataset.toggle) {
      await api("/api/admin/products/" + t.dataset.toggle, {
        method: "PATCH",
        body: JSON.stringify({ active: t.dataset.active !== "1" }),
      });
      await adminRender();
      await load();
    }
    if (t.dataset.saveStock) {
      await api("/api/admin/products/" + t.dataset.saveStock, {
        method: "PATCH",
        body: JSON.stringify({
          stock: +$('[data-stock="' + t.dataset.saveStock + '"]').value,
        }),
      });
      toast("Stock updated");
    }
    if (t.dataset.saveOrder) {
      await api("/api/admin/orders/" + t.dataset.saveOrder, {
        method: "PATCH",
        body: JSON.stringify({
          status: $('[data-status="' + t.dataset.saveOrder + '"]').value,
        }),
      });
      await adminRender();
      toast("Order updated");
    }
  } catch (err) {
    toast(err.message);
  }
});
document.addEventListener("submit", async (e) => {
  if (e.target.id === "search-form") {
    e.preventDefault();
    state.search = $("#search").value.trim();
    load();
  }
  if (e.target.id === "auth-form") authSubmit(e);
  if (e.target.id === "checkout-form") checkout(e);
  if (e.target.id === "add-form") {
    e.preventDefault();
    try {
      await api("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
      });
      toast("Product added");
      await adminRender();
      await load();
    } catch (err) {
      $("#admin-msg").textContent = err.message;
    }
  }
});
$("#sort").addEventListener("change", render);
$("#categories").addEventListener("click", (e) => {
  let b = e.target.closest("[data-category]");
  if (!b) return;
  state.category = b.dataset.category;
  $$("[data-category]").forEach((x) => x.classList.toggle("active", x === b));
  load();
});
$("#year").textContent = new Date().getFullYear();
setAuthMode("login");
saveCart();
updateUser();
load();
if (state.token)
  api("/api/auth/me")
    .then((d) => {
      state.user = d.user;
      localStorage.setItem("cpp-user", JSON.stringify(d.user));
      updateUser();
    })
    .catch(() => {
      state.token = "";
      state.user = null;
      localStorage.removeItem("cpp-token");
      localStorage.removeItem("cpp-user");
      updateUser();
    });
