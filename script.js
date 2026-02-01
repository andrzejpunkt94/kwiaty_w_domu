/* ============================================================
   TWOJE KWIATY — LOGIKA APLIKACJI
   ============================================================ */

/* -------------------- Stałe i elementy -------------------- */

const STORAGE_KEY_DATE = "plants_last_date";
const STORAGE_KEY_WATERED = "plants_watered_today";

const wateredTodaySpan = document.getElementById("wateredToday");
const wateredTotalSpan = document.getElementById("wateredTotal");
const counterBadgeText = document.getElementById("counterBadgeText");
const backToTopBtn = document.getElementById("backToTop");

const plantCards = Array.from(document.querySelectorAll(".plant-card"));
const checkboxes = Array.from(document.querySelectorAll(".water-checkbox"));

/* Ustaw liczbę roślin (checkboxów) */
wateredTotalSpan.textContent = checkboxes.length.toString();

/* ============================================================
   AKORDEON — tylko jedna karta otwarta
   ============================================================ */

plantCards.forEach(card => {
  card.addEventListener("toggle", () => {
    if (card.open) {
      plantCards.forEach(other => {
        if (other !== card) other.open = false;
      });
    }
  });
});

/* ============================================================
   FUNKCJE POMOCNICZE
   ============================================================ */

function getLocalIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function msUntilLocalMidnight() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return tomorrow - now;
}

function updateBadgeText(count, total) {
  if (count === 0) {
    counterBadgeText.textContent = "Wszystko przed Tobą 🌱";
  } else if (count < total) {
    counterBadgeText.textContent = "Pięknie, tak trzymaj 💧";
  } else {
    counterBadgeText.textContent = "Wszystko podlane na dziś ✅";
  }
}

/* ============================================================
   RESET STANU O PÓŁNOCY
   ============================================================ */

function resetWateringState() {
  const today = getLocalIsoDate();
  localStorage.setItem(STORAGE_KEY_DATE, today);
  localStorage.setItem(STORAGE_KEY_WATERED, JSON.stringify({}));

  checkboxes.forEach(cb => (cb.checked = false));

  wateredTodaySpan.textContent = "0";
  updateBadgeText(0, checkboxes.length);
}

function scheduleMidnightReset() {
  const first = msUntilLocalMidnight();
  setTimeout(() => {
    resetWateringState();
    setInterval(resetWateringState, 24 * 60 * 60 * 1000);
  }, first);
}

/* ============================================================
   ARIA LABELS DLA CHECKBOXÓW
   ============================================================ */

function initCheckboxAriaLabels() {
  checkboxes.forEach(cb => {
    const card = cb.closest(".plant-card");
    const plantNameEl = card ? card.querySelector(".plant-name") : null;
    const plantName = plantNameEl ? plantNameEl.textContent.trim() : "roślina";
    cb.setAttribute("aria-label", `Podlane dziś: ${plantName}`);
  });
}

/* ============================================================
   ODCZYT I ZAPIS STANU
   ============================================================ */

function loadState() {
  const today = getLocalIsoDate();
  const savedDate = localStorage.getItem(STORAGE_KEY_DATE);
  let savedWatered = {};

  if (savedDate === today) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WATERED);
      if (raw) savedWatered = JSON.parse(raw);
    } catch {
      savedWatered = {};
    }
  } else {
    localStorage.setItem(STORAGE_KEY_DATE, today);
    localStorage.setItem(STORAGE_KEY_WATERED, JSON.stringify({}));
  }

  let count = 0;

  checkboxes.forEach(cb => {
    const card = cb.closest(".plant-card");
    const id = card.getAttribute("data-plant-id");
    const isWatered = !!savedWatered[id];
    cb.checked = isWatered;
    if (isWatered) count++;
  });

  wateredTodaySpan.textContent = count.toString();
  updateBadgeText(count, checkboxes.length);
}

function saveState() {
  const today = getLocalIsoDate();
  localStorage.setItem(STORAGE_KEY_DATE, today);

  const state = {};
  checkboxes.forEach(cb => {
    const card = cb.closest(".plant-card");
    const id = card.getAttribute("data-plant-id");
    if (cb.checked) state[id] = true;
  });

  localStorage.setItem(STORAGE_KEY_WATERED, JSON.stringify(state));
}

/* ============================================================
   OBSŁUGA ZMIAN CHECKBOXÓW
   ============================================================ */

checkboxes.forEach(cb => {
  cb.addEventListener("change", () => {
    let count = 0;
    checkboxes.forEach(c => {
      if (c.checked) count++;
    });

    wateredTodaySpan.textContent = count.toString();
    updateBadgeText(count, checkboxes.length);
    saveState();
  });
});

/* ============================================================
   PRZYCISK „GÓRA”
   ============================================================ */

window.addEventListener("scroll", () => {
  if (window.scrollY > 260) {
    backToTopBtn.classList.add("visible");
  } else {
    backToTopBtn.classList.remove("visible");
  }
});

backToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ============================================================
   AUTOMATYCZNE PRZECHODZENIE DO KOLEJNEJ ROŚLINY / SEKCJI
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const allSections = Array.from(document.querySelectorAll(".location-section"));

  document.querySelectorAll(".water-checkbox").forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      const details = checkbox.closest("details");
      if (!details) return;

      const section = details.closest(".location-section");
      const plantCards = Array.from(section.querySelectorAll("details.plant-card"));
      const index = plantCards.indexOf(details);

      /* Zamknij aktualną roślinę */
      details.open = false;

      /* Jeśli to NIE jest ostatnia roślina → otwórz następną */
      if (index < plantCards.length - 1) {
        const next = plantCards[index + 1];
        setTimeout(() => {
          next.open = true;
          next.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
        return;
      }

      /* Jeśli to OSTATNIA roślina → przejdź do kolejnej sekcji */
      const currentSectionIndex = allSections.indexOf(section);
      const nextSection = allSections[currentSectionIndex + 1];

      if (nextSection) {
        const nextPlants = Array.from(nextSection.querySelectorAll("details.plant-card"));
        const firstPlant = nextPlants[0];

        setTimeout(() => {
          nextSection.scrollIntoView({ behavior: "smooth", block: "start" });
          if (firstPlant) firstPlant.open = true;
        }, 200);
      }
    });
  });
});

/* ============================================================
   REJESTRACJA SERVICE WORKERA
   ============================================================ */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then(reg => console.log("ServiceWorker zarejestrowany:", reg.scope))
      .catch(err => console.log("Błąd rejestracji ServiceWorkera:", err));
  });
}

/* ============================================================
   INICJALIZACJA
   ============================================================ */

initCheckboxAriaLabels();
loadState();
scheduleMidnightReset();

