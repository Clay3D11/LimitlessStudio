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
