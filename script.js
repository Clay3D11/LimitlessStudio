const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const menuButton = $(".menu-button");
const siteNav = $(".site-nav");

menuButton?.addEventListener("click", () => {
  const isOpen = siteNav?.classList.toggle("open") || false;
  document.body.classList.toggle("menu-open", isOpen);
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

siteNav?.addEventListener("click", (event) => {
  if (!event.target.matches("a")) return;
  siteNav.classList.remove("open");
  $$(".nav-dropdown").forEach((dropdown) => dropdown.removeAttribute("open"));
  document.body.classList.remove("menu-open");
  menuButton?.setAttribute("aria-expanded", "false");
});

$$('.nav-dropdown').forEach((dropdown) => {
  dropdown.addEventListener('toggle', () => {
    if (!dropdown.open) return;
    $$('.nav-dropdown').forEach((otherDropdown) => {
      if (otherDropdown !== dropdown) otherDropdown.removeAttribute('open');
    });
  });
});

const openPricingDialog = (dialogId) => {
  const dialog = document.getElementById(dialogId);
  if (!dialog?.matches('.pricing-dialog')) return;
  $$('.pricing-dialog[open]').forEach((openDialog) => openDialog.close());
  dialog.showModal();
};

$$('[data-pricing-target]').forEach((button) => {
  button.addEventListener('click', () => openPricingDialog(button.dataset.pricingTarget));
});

$$('.site-nav a[href^="#pricing-"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    openPricingDialog(link.hash.slice(1));
  });
});

$$('.pricing-dialog').forEach((dialog) => {
  $('.pricing-dialog-close', dialog)?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
    if (event.target.closest('a[href="#contact"]')) dialog.close();
  });
});

const studioDialogIds = ['work', 'showcase', 'packages', 'effects'];

const openStudioDialog = (dialogId) => {
  const dialog = document.getElementById(dialogId);
  if (!dialog?.matches('.content-dialog')) return;
  $$('.content-dialog[open], .pricing-dialog[open]').forEach((openDialog) => openDialog.close());
  $$('.reveal-ready', dialog).forEach((item) => item.classList.add('revealed'));
  dialog.showModal();
  $$('video', dialog).forEach((video) => video.play().catch(() => {}));
};

$$('[data-studio-target]').forEach((button) => {
  button.addEventListener('click', () => openStudioDialog(button.dataset.studioTarget));
});

$$('a[href^="#"]').forEach((link) => {
  const dialogId = link.hash.slice(1);
  if (!studioDialogIds.includes(dialogId)) return;
  link.addEventListener('click', (event) => {
    event.preventDefault();
    openStudioDialog(dialogId);
  });
});

$$('.content-dialog').forEach((dialog) => {
  $$('video', dialog).forEach((video) => video.pause());
  $('.content-dialog-close', dialog)?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    $$('video', dialog).forEach((video) => video.pause());
  });
});

const studioInfoTag = $(".studio-info-tag");
const studioInfoDialog = $("#studio-info-dialog");
const studioInfoClose = $(".studio-info-close");

studioInfoTag?.addEventListener("click", () => studioInfoDialog?.showModal());
studioInfoClose?.addEventListener("click", () => studioInfoDialog?.close());

studioInfoDialog?.addEventListener("click", (event) => {
  if (event.target === studioInfoDialog) studioInfoDialog.close();
});

const aboutStudioDialog = $("#studio");
$$(".about-studio-tag").forEach((tag) => tag.addEventListener("click", (event) => {
  event.preventDefault();
  aboutStudioDialog?.showModal();
}));
$(".about-studio-close")?.addEventListener("click", () => aboutStudioDialog?.close());
aboutStudioDialog?.addEventListener("click", (event) => {
  if (event.target === aboutStudioDialog) aboutStudioDialog.close();
});

const revealItems = $$(".reveal-ready");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("revealed");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("revealed"));
}

document.addEventListener("visibilitychange", () => {
  $$("video[autoplay]").forEach((video) => {
    if (document.hidden) {
      video.pause();
      return;
    }

    video.play().catch(() => {});
  });
});

// Project cart: progressively enhances every existing pricing card without
// duplicating package data or changing any displayed price.
const cartDrawer = $('[data-cart-drawer]');
const cartContent = $('[data-cart-content]');
const cartCount = $('[data-cart-count]');
const cartTotal = $('[data-cart-total]');
const cartCustomNote = $('[data-cart-custom-note]');
const cartCheckout = $('[data-cart-checkout]');
const requestDialog = $('[data-request-dialog]');
const requestForm = $('[data-request-form]');
const requestSuccess = $('[data-request-success]');
const studioToast = $('[data-studio-toast]');
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
let studioCart = readStudioCart();
let cartLastFocus = null;
let toastTimeout;

function readStudioCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('limitless-studio-cart'));
    return Array.isArray(saved) ? saved.map((item) => ({ ...item, quantity: Number(item.quantity) || 1 })) : [];
  } catch {
    return [];
  }
}

function saveStudioCart() {
  localStorage.setItem('limitless-studio-cart', JSON.stringify(studioCart));
}

function cartSafeText(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function packageData(card, index) {
  const name = $('h3', card)?.textContent.trim() || `Studio Package ${index + 1}`;
  const priceElement = $('.pricing-price', card);
  const rawPrice = priceElement?.textContent.replace(/,/g, '') || '';
  const priceMatch = rawPrice.match(/\d+(?:\.\d+)?/);
  const categoryDialog = card.closest('.pricing-dialog');
  const category = $('.pricing-group-title .eyebrow', categoryDialog)?.textContent.trim() || 'Studio service';
  const billing = $('small', priceElement)?.textContent.trim() || 'project';
  const id = `${categoryDialog?.id || 'pricing'}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { id, name, category, billing, price: priceMatch ? Number(priceMatch[0]) : null, quantity: 1 };
}

function enhancePricingCards() {
  $$('.pricing-card').forEach((card, index) => {
    const currentAction = $('.pricing-button', card);
    if (!currentAction || currentAction.matches('[data-add-to-cart]')) return;
    const item = packageData(card, index);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = currentAction.className;
    button.dataset.addToCart = item.id;
    button.textContent = 'Add to project';
    button.setAttribute('aria-label', `Add ${item.name} to project cart`);
    currentAction.replaceWith(button);
    button.addEventListener('click', () => {
      addStudioItem(item);
      card.closest('.pricing-dialog')?.close();
      openStudioCart();
    });
  });
}

function addStudioItem(item) {
  const existing = studioCart.find((entry) => entry.id === item.id);
  if (existing) existing.quantity += 1;
  else studioCart.push({ ...item });
  saveStudioCart();
  renderStudioCart();
  showStudioToast(`${item.name} added to your project.`);
}

function removeStudioItem(id) {
  studioCart = studioCart.filter((item) => item.id !== id);
  saveStudioCart();
  renderStudioCart();
}

function renderStudioCart() {
  const quantity = studioCart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = studioCart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
  const hasCustom = studioCart.some((item) => item.price === null);
  cartCount.textContent = String(quantity);
  cartTotal.textContent = subtotal ? currency.format(subtotal) : 'Custom quote';
  cartCustomNote.hidden = !hasCustom;
  cartCheckout.disabled = studioCart.length === 0;

  if (!studioCart.length) {
    cartContent.innerHTML = '<div class="studio-cart-empty"><span aria-hidden="true">◇</span><h3>Your next production starts here.</h3><p>Choose any pricing package and it will stay organized in your project cart.</p></div>';
  } else {
    cartContent.innerHTML = studioCart.map((item) => {
      const detail = [item.category, item.billing, item.quantity > 1 ? `Qty ${item.quantity}` : ''].filter(Boolean).join(' · ');
      const linePrice = item.price === null ? 'Custom quote' : currency.format(item.price * item.quantity);
      return `<div class="studio-cart-item"><div><strong>${cartSafeText(item.name)}</strong><small>${cartSafeText(detail)}</small><small class="studio-cart-price">${linePrice}</small></div><button type="button" data-cart-remove="${cartSafeText(item.id)}" aria-label="Remove ${cartSafeText(item.name)}">Remove</button></div>`;
    }).join('');
  }

  $$('.pricing-card').forEach((card, index) => {
    card.classList.toggle('is-in-cart', studioCart.some((item) => item.id === packageData(card, index).id));
  });
}

cartContent?.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-cart-remove]');
  if (removeButton) removeStudioItem(removeButton.dataset.cartRemove);
});

function openStudioCart() {
  cartLastFocus = document.activeElement;
  cartDrawer.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cart-open');
  requestAnimationFrame(() => $('[data-cart-close]', cartDrawer)?.focus());
}

function closeStudioCart({ restoreFocus = true } = {}) {
  cartDrawer.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cart-open');
  if (restoreFocus) cartLastFocus?.focus();
}

$$('[data-cart-open]').forEach((button) => button.addEventListener('click', openStudioCart));
$$('[data-cart-close]').forEach((button) => button.addEventListener('click', () => closeStudioCart()));

function openRequestDialog() {
  closeStudioCart({ restoreFocus: false });
  $('[data-selected-services]', requestForm).value = studioCart.map((item) => {
    const amount = item.price === null ? 'custom quote' : currency.format(item.price * item.quantity);
    return `${item.name} × ${item.quantity} (${amount})`;
  }).join(' | ');
  requestDialog.showModal();
  document.body.classList.add('cart-open');
  requestAnimationFrame(() => requestForm.elements.firstName.focus());
}

function closeRequestDialog() {
  requestDialog.close();
  document.body.classList.remove('cart-open');
  cartLastFocus?.focus();
}

cartCheckout?.addEventListener('click', openRequestDialog);
$$('[data-request-close]').forEach((button) => button.addEventListener('click', closeRequestDialog));
requestDialog?.addEventListener('click', (event) => {
  if (event.target === requestDialog) closeRequestDialog();
});
requestDialog?.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeRequestDialog();
});

requestForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = $$('input, select, textarea', requestForm).filter((field) => field.type !== 'hidden');
  fields.forEach((field) => field.setAttribute('aria-invalid', String(!field.checkValidity())));
  const invalid = fields.find((field) => !field.checkValidity());
  if (invalid) {
    invalid.focus();
    showStudioToast('Please complete the required project details.');
    return;
  }

  const request = Object.fromEntries(new FormData(requestForm));
  localStorage.setItem('limitless-studio-latest-request', JSON.stringify({ ...request, submittedAt: new Date().toISOString() }));
  requestForm.hidden = true;
  $('.studio-request-intro', requestDialog).hidden = true;
  requestSuccess.hidden = false;
  studioCart = [];
  saveStudioCart();
  renderStudioCart();
});

requestDialog?.addEventListener('close', () => {
  document.body.classList.remove('cart-open');
  window.setTimeout(() => {
    requestForm.reset();
    requestForm.hidden = false;
    $('.studio-request-intro', requestDialog).hidden = false;
    requestSuccess.hidden = true;
    $$('[aria-invalid]', requestForm).forEach((field) => field.removeAttribute('aria-invalid'));
  }, 180);
});

function showStudioToast(message) {
  window.clearTimeout(toastTimeout);
  studioToast.textContent = message;
  studioToast.classList.add('show');
  toastTimeout = window.setTimeout(() => studioToast.classList.remove('show'), 2600);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && cartDrawer?.classList.contains('open')) closeStudioCart();
});

enhancePricingCards();
renderStudioCart();
