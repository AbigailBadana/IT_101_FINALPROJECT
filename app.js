const state = {
    products: [
        {
            id: "shadowPod",
            name: "Cat Travel Bag",
            price: 129,
            category: "travel",
            variant: "charcoal shell",
            badge: "⭐⭐⭐⭐⭐ (4.8/5 rating)",
            description: "A comfortable and breathable travel bag designed to keep your cat safe and relaxed during trips.",
            support: "Includes detachable blackout visor.",
            image: "images/travel.webp",
            details: [
                {
                    title: "Bag Specs",
                    content: ["Bag Size: 42 × 28 × 30 cm", "Recommended Weight: Up to 7 kg cats"]
                },
                {
                    title: "Color Options",
                    content: ["Gray", "Black", "Pink"]
                },
                {
                    title: "Care",
                    content: ["Wipe interior after each trip", "Air-dry cushions to prevent odors"]
                }
            ]
        },
        {
            id: "nocturneHalo",
            name: "Cat Toy Chew Rope",
            price: 42,
            category: "play",
            variant: "luminous brass",
            badge: "⭐⭐⭐⭐⭐ (4.8/5 rating)",
            description: "A fun and safe chew rope toy that helps keep your cat active, playful, and stress-free.",
            support: "Safe fibers and durable knots keep claws engaged without fraying.",
            image: "images/play.jpg",
            details: [
                {
                    title: "Material",
                    content: ["Braided cotton rope", "Non-toxic plant-based dyes"]
                },
                {
                    title: "Play Benefits",
                    content: ["Encourages active chewing", "Helps relieve stress and boredom"]
                },
                {
                    title: "Care",
                    content: ["Hand wash with mild soap", "Air dry fully before next play session"]
                }
            ]
        },
        {
            id: "eclipseLoft",
            name: "Cat Hair Brush",
            price: 98,
            category: "care",
            variant: "tinted acrylic",
            badge: "⭐⭐⭐⭐⭐ (4.8/5 rating)",
            description: "A gentle grooming brush designed to remove loose fur and keep your cat’s coat smooth and healthy.",
            support: "Soft dual pins glide through fur while protecting sensitive skin.",
            image: "images/care.jpg",
            details: [
                {
                    title: "Bristle Type",
                    content: ["Dual-density stainless pins", "Rounded tips to prevent scratching"]
                },
                {
                    title: "Grip",
                    content: ["Ergonomic matte handle", "Non-slip texture for better control"]
                },
                {
                    title: "Care",
                    content: ["Rinse weekly with gentle soap", "Dry thoroughly before storage"]
                }
            ]
        }
    ],
    cart: new Map()
};

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const productGrid = qs(".product-grid");
const productTemplate = qs("#product-card-template");
const cartTemplate = qs("#cart-row-template");
const cartList = qs(".cart-items");
const emptyCartMsg = qs(".empty-text");
const subtotalEl = qs("[data-summary-subtotal]");
const totalEl = qs("[data-summary-total]");
const checkoutCta = qs("[data-jump='#checkout']");
const detailImage = qs("#detailImage");
const detailName = qs("#detailName");
const detailCopy = qs("#detailCopy");
const detailInfo = qs("#detailInfo");
const form = qs(".checkout-form");
const formFeedback = qs(".form-feedback");
const navToggle = qs(".nav-toggle");
const navList = qs("#navList");
const yearEl = qs("#year");
const cartToast = qs("[data-cart-toast]");

let cartToastTimeout;
const addedButtonTimers = new WeakMap();

const currency = value => `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function renderProducts(filter = "all") {
    productGrid.innerHTML = "";
    const fragment = document.createDocumentFragment();
    state.products
        .filter(product => filter === "all" || product.category === filter)
        .forEach(product => {
            const node = productTemplate.content.firstElementChild.cloneNode(true);
            const img = qs(".card-image", node);
            const badge = qs(".badge", node);
            const title = qs("h3", node);
            const copy = qs(".card-copy", node);
            const support = qs(".support-text", node);
            const price = qs(".price", node);

            img.src = product.image;
            img.alt = `${product.name} product photo`;
            badge.textContent = product.badge;
            title.textContent = product.name;
            copy.textContent = product.description;
            support.textContent = product.support;
            price.textContent = currency(product.price);

            node.dataset.productId = product.id;
            node.setAttribute("tabindex", "0");
            fragment.appendChild(node);
        });
    productGrid.appendChild(fragment);
}

function toggleNav() {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    navList.classList.toggle("open", !expanded);
}

function smoothJump(target) {
    const el = document.querySelector(target);
    if (el) {
        el.scrollIntoView({ behavior: "smooth" });
    }
}

function updateCartUI() {
    cartList.innerHTML = "";
    if (state.cart.size === 0) {
        emptyCartMsg.hidden = false;
        subtotalEl.textContent = "$0.00";
        totalEl.textContent = "$0.00";
        checkoutCta.disabled = true;
        return;
    }

    emptyCartMsg.hidden = true;
    const fragment = document.createDocumentFragment();
    let subtotal = 0;

    state.cart.forEach(item => {
        const node = cartTemplate.content.firstElementChild.cloneNode(true);
        qs(".cart-product", node).textContent = item.name;
        qs(".cart-variant", node).textContent = item.variant;
        qs(".qty", node).textContent = item.quantity;
        qs(".line-total", node).textContent = currency(item.price * item.quantity);
        node.dataset.productId = item.id;
        fragment.appendChild(node);
        subtotal += item.price * item.quantity;
    });

    cartList.appendChild(fragment);
    subtotalEl.textContent = currency(subtotal);
    totalEl.textContent = currency(subtotal);
    checkoutCta.disabled = false;
}

function addToCart(productId) {
    const product = state.products.find(item => item.id === productId);
    if (!product) return;
    const existing = state.cart.get(productId) || { ...product, quantity: 0 };
    existing.quantity += 1;
    state.cart.set(productId, existing);
    updateCartUI();
    showCartToast(product.name);
}

function changeQuantity(productId, delta) {
    const item = state.cart.get(productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        state.cart.delete(productId);
    } else {
        state.cart.set(productId, item);
    }
    updateCartUI();
}

function removeItem(productId) {
    state.cart.delete(productId);
    updateCartUI();
}

function setDetailProduct(product) {
    if (!product) return;
    detailName.textContent = product.name;
    detailCopy.textContent = product.description;
    detailImage.src = product.image;
    detailImage.alt = `${product.name} detail view`;
    renderDetailInfo(product.details);
}

function initFilters() {
    qsa(".filters .chip").forEach(button => {
        button.addEventListener("click", () => {
            qsa(".filters .chip").forEach(chip => chip.setAttribute("aria-pressed", "false"));
            button.setAttribute("aria-pressed", "true");
            renderProducts(button.dataset.filter);
        });
    });
}

function renderDetailInfo(items = []) {
    if (!detailInfo) return;
    detailInfo.innerHTML = "";
    if (!items || !items.length) return;
    items.forEach(item => {
        const wrapper = document.createElement("div");
        const dt = document.createElement("dt");
        dt.textContent = item.title;
        const dd = document.createElement("dd");
        const content = Array.isArray(item.content) ? item.content.join("<br>") : item.content;
        dd.innerHTML = content;
        wrapper.append(dt, dd);
        detailInfo.appendChild(wrapper);
    });
}

function initProductActions() {
    productGrid.addEventListener("click", event => {
        const button = event.target.closest("button");
        if (!button) return;
        const card = event.target.closest(".card");
        if (!card) return;
        const productId = card.dataset.productId;

        if (button.dataset.action === "add-to-cart") {
            addToCart(productId);
            flashAddedState(button);
        }

        if (button.dataset.action === "view-details") {
            const product = state.products.find(item => item.id === productId);
            if (product) {
                setDetailProduct(product);
                smoothJump("#details");
            }
        }
    });
}

function initCartActions() {
    cartList.addEventListener("click", event => {
        const button = event.target.closest("button");
        if (!button) return;
        const row = event.target.closest(".cart-row");
        if (!row) return;
        const productId = row.dataset.productId;

        if (button.dataset.dir) {
            changeQuantity(productId, Number(button.dataset.dir));
        }

        if (button.dataset.action === "remove") {
            removeItem(productId);
        }
    });
}

function initSmoothJumps() {
    qsa("[data-jump]").forEach(button => {
        button.addEventListener("click", () => smoothJump(button.dataset.jump));
    });
}

function initNav() {
    navToggle.addEventListener("click", toggleNav);
    qsa("nav a").forEach(link => {
        link.addEventListener("click", () => {
            navList.classList.remove("open");
            navToggle.setAttribute("aria-expanded", "false");
        });
    });
}

function initForm() {
    form.addEventListener("submit", event => {
        event.preventDefault();
        formFeedback.textContent = "Thank you! Your order request has been logged. We'll confirm via SMS.";
        form.reset();
        qs(".checkout-form [name='firstName']").focus();
        formFeedback.classList.add("feedback", "success");
    });
}

function initYear() {
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}

function showCartToast(productName) {
    if (!cartToast) return;
    cartToast.textContent = `${productName} added to cart.`;
    cartToast.hidden = false;
    clearTimeout(cartToastTimeout);
    cartToastTimeout = setTimeout(() => {
        cartToast.hidden = true;
    }, 2400);
}

function flashAddedState(button) {
    if (!button) return;
    const originalLabel = button.dataset.originalLabel || button.textContent;
    button.dataset.originalLabel = originalLabel;
    button.textContent = "Added";
    button.classList.add("btn-added");
    clearTimeout(addedButtonTimers.get(button));
    const timeout = setTimeout(() => {
        button.textContent = button.dataset.originalLabel;
        button.classList.remove("btn-added");
    }, 1600);
    addedButtonTimers.set(button, timeout);
}

function init() {
    renderProducts();
    setDetailProduct(state.products[0]);
    initFilters();
    initProductActions();
    initCartActions();
    initSmoothJumps();
    initNav();
    initForm();
    initYear();
    updateCartUI();
}

document.addEventListener("DOMContentLoaded", init);
