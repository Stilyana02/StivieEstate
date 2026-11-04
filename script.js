
const pages = [
  "brochure/page-1.jpg",
  "brochure/page-2.jpg",
  "brochure/page-3.jpg",
  "brochure/page-4.jpg"
];

let current = 0;
let busy = false;

const front = document.getElementById("frontPage");
const back = document.getElementById("backPage");
const counter = document.getElementById("pageCounter");
const book = document.getElementById("flipbook");

function show(i) {
  front.style.backgroundImage = `url("${pages[i]}")`;
  back.style.backgroundImage = `url("${pages[Math.min(i + 1, pages.length - 1)]}")`;
  counter.textContent = `${i + 1} / ${pages.length}`;
}

function next() {
  if (busy || current >= pages.length - 1) return;
  busy = true;
  front.classList.remove("reverse");
  front.classList.add("turning");

  setTimeout(() => {
    current++;
    show(current);
    front.classList.remove("turning");
    busy = false;
  }, 650);
}

function prev() {
  if (busy || current <= 0) return;
  busy = true;
  front.classList.remove("turning");
  front.classList.add("reverse");

  setTimeout(() => {
    current--;
    show(current);
    front.classList.remove("reverse");
    busy = false;
  }, 650);
}

document.querySelector(".next").onclick = next;
document.querySelector(".prev").onclick = prev;
document.getElementById("nextBtn").onclick = next;
document.getElementById("prevBtn").onclick = prev;

let startX = null;
let startY = null;
let swipeDetected = false;

book.addEventListener("touchstart", e => {
  if (e.touches.length !== 1) {
    startX = null;
    return;
  }
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  swipeDetected = false;
}, { passive: true });

book.addEventListener("touchend", e => {
  if (startX === null) return;

  const dx = e.changedTouches[0].clientX - startX;
  const dy = e.changedTouches[0].clientY - startY;

  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
    swipeDetected = true;
    dx < 0 ? next() : prev();
  }

  startX = null;
}, { passive: true });

/* ZOOM VIEWER */
const zoomViewer = document.createElement("div");
zoomViewer.className = "brochure-zoom";
zoomViewer.setAttribute("role", "dialog");
zoomViewer.setAttribute("aria-modal", "true");
zoomViewer.setAttribute("aria-label", "Увеличена брошура");

zoomViewer.innerHTML = `
  <div class="zoom-toolbar">
    <span class="zoom-counter"></span>
    <div class="zoom-buttons">
      <button type="button" class="zoom-minus" aria-label="Намали">−</button>
      <button type="button" class="zoom-plus" aria-label="Увеличи">+</button>
      <button type="button" class="zoom-close" aria-label="Затвори">✕</button>
    </div>
  </div>
  <div class="zoom-stage">
    <img class="zoom-image" alt="Страница от брошурата" draggable="false">
  </div>
`;

document.body.appendChild(zoomViewer);

const zoomImage = zoomViewer.querySelector(".zoom-image");
const zoomStage = zoomViewer.querySelector(".zoom-stage");
const zoomCounter = zoomViewer.querySelector(".zoom-counter");

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let zoomOpen = false;
let previousFocus = null;

function renderZoom() {
  zoomImage.style.transform =
    `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

function resetZoom() {
  scale = 1;
  offsetX = 0;
  offsetY = 0;
  renderZoom();
}

function openZoom() {
  if (busy) return;

  previousFocus = document.activeElement;
  zoomOpen = true;
  zoomImage.src = pages[current];
  zoomCounter.textContent = `${current + 1} / ${pages.length}`;
  resetZoom();

  zoomViewer.classList.add("active");
  document.body.classList.add("zoom-open");
  zoomViewer.querySelector(".zoom-close").focus();
}

function closeZoom() {
  zoomOpen = false;
  zoomViewer.classList.remove("active");
  document.body.classList.remove("zoom-open");
  resetZoom();

  if (previousFocus && previousFocus.focus) {
    previousFocus.focus();
  }
}

function changeZoom(amount) {
  scale = Math.max(1, Math.min(5, scale + amount));
  if (scale === 1) {
    offsetX = 0;
    offsetY = 0;
  }
  renderZoom();
}

book.addEventListener("click", () => {
  if (swipeDetected) {
    swipeDetected = false;
    return;
  }
  openZoom();
});

zoomViewer.querySelector(".zoom-close").onclick = closeZoom;
zoomViewer.querySelector(".zoom-plus").onclick = () => changeZoom(0.5);
zoomViewer.querySelector(".zoom-minus").onclick = () => changeZoom(-0.5);

zoomViewer.addEventListener("click", e => {
  if (e.target === zoomViewer || e.target === zoomStage) {
    closeZoom();
  }
});

document.addEventListener("keydown", e => {
  if (zoomOpen && e.key === "Escape") closeZoom();
});

/* PINCH TO ZOOM + DRAG */
let initialDistance = 0;
let initialScale = 1;
let lastX = 0;
let lastY = 0;

function touchDistance(touches) {
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY
  );
}

zoomStage.addEventListener("touchstart", e => {
  if (e.touches.length === 2) {
    initialDistance = touchDistance(e.touches);
    initialScale = scale;
  } else if (e.touches.length === 1) {
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  }
}, { passive: true });

zoomStage.addEventListener("touchmove", e => {
  if (e.touches.length === 2 && initialDistance > 0) {
    e.preventDefault();
    scale = Math.max(
      1,
      Math.min(5, initialScale * touchDistance(e.touches) / initialDistance)
    );
    renderZoom();
  } else if (e.touches.length === 1 && scale > 1) {
    e.preventDefault();
    offsetX += e.touches[0].clientX - lastX;
    offsetY += e.touches[0].clientY - lastY;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
    renderZoom();
  }
}, { passive: false });

zoomStage.addEventListener("touchend", e => {
  if (e.touches.length < 2) initialDistance = 0;
  if (e.touches.length === 1) {
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  }
  if (scale === 1) resetZoom();
}, { passive: true });

/* MOBILE MENU */
const menu = document.querySelector(".menu-btn");
const header = document.querySelector(".header");
const nav = document.querySelector(".nav nav");

if (menu && header && nav) {
  menu.setAttribute("aria-expanded", "false");

  menu.addEventListener("click", () => {
    const isOpen = header.classList.toggle("mobile-open");
    menu.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      header.classList.remove("mobile-open");
      menu.setAttribute("aria-expanded", "false");
    });
  });
}

show(0);

/* ПРЕЛИСТВАНЕ КАТО КНИГА В УВЕЛИЧЕН РЕЖИМ */

const zoomPrev = document.createElement("button");
const zoomNext = document.createElement("button");

zoomPrev.type = "button";
zoomNext.type = "button";

zoomPrev.className = "zoom-page-prev";
zoomNext.className = "zoom-page-next";

zoomPrev.textContent = "‹";
zoomNext.textContent = "›";

zoomPrev.setAttribute("aria-label", "Предишна страница");
zoomNext.setAttribute("aria-label", "Следваща страница");

zoomStage.appendChild(zoomPrev);
zoomStage.appendChild(zoomNext);

let zoomTurning = false;

function turnZoomPage(direction) {
  if (zoomTurning || !zoomOpen) return;

  const target = current + direction;
  if (target < 0 || target >= pages.length) return;

  zoomTurning = true;

  const oldPage = document.createElement("img");
  oldPage.src = pages[current];
  oldPage.className = "zoom-turning-page";

  zoomStage.appendChild(oldPage);

  // Следващата страница се показва под обръщащата се.
  zoomImage.src = pages[target];
  resetZoom();

  const animation = oldPage.animate(
    [
      { transform: "rotateY(0deg)" },
      {
        transform: direction > 0
          ? "rotateY(-90deg)"
          : "rotateY(90deg)"
      },
      {
        transform: direction > 0
          ? "rotateY(-180deg)"
          : "rotateY(180deg)"
      }
    ],
    {
      duration: 650,
      easing: "ease-in-out",
      fill: "forwards"
    }
  );

  animation.onfinish = () => {
    current = target;
    show(current);
    zoomCounter.textContent = `${current + 1} / ${pages.length}`;
    oldPage.remove();
    zoomTurning = false;
  };
}

zoomPrev.addEventListener("click", () => turnZoomPage(-1));
zoomNext.addEventListener("click", () => turnZoomPage(1));

/* ПЛЪЗГАНЕ ЗА ПРЕЛИСТВАНЕ */

let zoomSwipeX = null;
let zoomSwipeY = null;

zoomStage.addEventListener("touchstart", e => {
  if (e.touches.length === 1 && scale === 1) {
    zoomSwipeX = e.touches[0].clientX;
    zoomSwipeY = e.touches[0].clientY;
  } else {
    zoomSwipeX = null;
  }
}, { passive: true });

zoomStage.addEventListener("touchend", e => {
  if (zoomSwipeX === null || scale > 1) return;

  const dx = e.changedTouches[0].clientX - zoomSwipeX;
  const dy = e.changedTouches[0].clientY - zoomSwipeY;

  if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
    turnZoomPage(dx < 0 ? 1 : -1);
  }

  zoomSwipeX = null;
}, { passive: true });

