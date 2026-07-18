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
  document.body.classList.remove("menu-open");
  menuButton?.setAttribute("aria-expanded", "false");
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
