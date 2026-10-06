/**
 * Ryanair Dynamic Ancillary Flows — Client State Machine & Stitch Screen Renderer
 * Connects imported Stitch screens (E, A, F, B, D, C, G + Screen 10) to the ADK/FastAPI backend.
 */
(function () {
  "use strict";

  const HARP_LOGO_URL =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCWAfcgHJVx3SrViwJ_ZZBnBchF4_SrbTLqXP_l6xhSc2lWVJD3nwaZZtEReVBRhR-5dzS_OWKcgv3R";

  const state = {
    sessionId: null,
    personaId: "marta_byrne",
    currentScreen: "checkin_start",
    sessionData: null,
    seatMapData: null,
    basketData: {
      header_title: "Review your extras",
      items: [],
      total_eur: 0.0,
      formatted_total: "€0.00",
      saved_payment_method: "Visa ending 4412",
      pay_cta_label: "Pay and get boarding passes",
    },
    boardingPasses: [],
    analyticsData: null,
    drawerExpanded: false,
    activePassIndex: 0,
    whoModalOpen: false,
  };

  const SCREEN_LABELS = {
    checkin_start: "Screen E · Check-in Start",
    loading: "Screen 2 · Getting Trip Ready",
    offer_page_1: "Screen A · Offer Page 1 (Step 1)",
    seat_map: "Screen F · Boeing 737 Seat Map",
    offer_page_2: "Screen B · Offer Page 2 (Step 2)",
    review_and_pay: "Screen D · Review & Pay",
    zero_offer: "Screen C · Zero-Offer State (1 Step)",
    boarding_passes: "Screen G · Boarding Passes",
  };

  function showToast(message) {
    const toast = document.getElementById("mobile-toast");
    const text = document.getElementById("mobile-toast-text");
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      toast.classList.add("hidden");
    }, 3200);
  }

  async function apiFetch(path, options) {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API ${res.status}: ${errText}`);
    }
    return res.json();
  }

  async function initSession(personaId, signalOverrides) {
    state.personaId = personaId || state.personaId;
    state.drawerExpanded = false;
    state.activePassIndex = 0;

    const session = await apiFetch("/api/v1/checkin/sessions", {
      method: "POST",
      body: JSON.stringify({
        persona_id: state.personaId,
        signal_overrides: signalOverrides || null,
      }),
    });

    state.sessionId = session.session_id;
    state.sessionData = session;
    state.currentScreen = "checkin_start";
    state.basketData = {
      header_title: "Review your extras",
      items: [],
      total_eur: 0.0,
      formatted_total: "€0.00",
      saved_payment_method: "Visa ending 4412",
      pay_cta_label: "Pay and get boarding passes",
    };
    state.boardingPasses = [];

    const latencyBadge = document.getElementById("latency-badge");
    if (latencyBadge && typeof session.latency_ms === "number") {
      latencyBadge.textContent = `Scored in ${session.latency_ms.toFixed(1)}ms`;
    }

    await refreshAnalytics();
    renderCurrentScreen();
  }

  async function refreshAnalytics() {
    try {
      state.analyticsData = await apiFetch("/api/v1/analytics/summary");
      renderStudioAnalytics();
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
  }

  function syncMutationResponse(mutation) {
    if (mutation.basket) {
      state.basketData = mutation.basket;
    }
    if (mutation.boarding_passes && mutation.boarding_passes.length > 0) {
      state.boardingPasses = mutation.boarding_passes;
    }
    if (state.sessionData) {
      state.sessionData.basket_total_eur = mutation.basket
        ? mutation.basket.total_eur
        : 0;
      state.sessionData.declined_product_ids =
        mutation.declined_product_ids || [];
    }
  }

  function isProductSelected(productId) {
    return state.basketData.items.some((item) => item.product_id === productId);
  }

  function getProductQuantity(productId) {
    const found = state.basketData.items.find(
      (item) => item.product_id === productId
    );
    return found ? found.quantity : 0;
  }

  function updateHeaderBadges() {
    const badge = document.getElementById("active-screen-badge");
    if (badge) {
      badge.textContent =
        SCREEN_LABELS[state.currentScreen] || state.currentScreen;
    }
    document.querySelectorAll(".jump-btn").forEach((btn) => {
      const target = btn.getAttribute("data-jump");
      if (target === state.currentScreen) {
        btn.className =
          "jump-btn px-2.5 py-1 rounded-full bg-primary-container text-white transition-colors";
      } else {
        btn.className =
          "jump-btn px-2.5 py-1 rounded-full hover:bg-surface-container-low text-text-heading transition-colors";
      }
    });
  }

  function renderCurrentScreen() {
    updateHeaderBadges();
    const viewport = document.getElementById("screen-viewport");
    if (!viewport || !state.sessionData) return;
    viewport.scrollTop = 0;

    switch (state.currentScreen) {
      case "checkin_start":
        viewport.innerHTML = renderScreenE();
        bindScreenE();
        break;
      case "loading":
        viewport.innerHTML = renderScreenLoading();
        break;
      case "offer_page_1":
        viewport.innerHTML = renderScreenA();
        bindScreenA();
        break;
      case "seat_map":
        viewport.innerHTML = renderScreenF();
        bindScreenF();
        break;
      case "offer_page_2":
        viewport.innerHTML = renderScreenB();
        bindScreenB();
        break;
      case "review_and_pay":
        viewport.innerHTML = renderScreenD();
        bindScreenD();
        break;
      case "zero_offer":
        viewport.innerHTML = renderScreenC();
        bindScreenC();
        break;
      case "boarding_passes":
        viewport.innerHTML = renderScreenG();
        bindScreenG();
        break;
      default:
        viewport.innerHTML = renderScreenE();
        bindScreenE();
    }
  }

  /* ==========================================================================
   * SCREEN E — Check-in Start (Full Greeting Header + Help Hub Search Bar + Fixed Child Ages 6y & 9y)
   * ========================================================================== */
  function renderScreenE() {
    const s = state.sessionData;
    const stepPillText = s.entry_step_pill || "2 STEPS TO YOUR BOARDING PASSES";
    const isZero = s.flow_branch === "zero_offer";

    return `
      <div class="flex flex-col w-full pb-6">
        <!-- Navy Header Sheet Block (Full Greeting Header) -->
        <div class="bg-primary-container px-margin pt-4 rounded-b-3xl shadow-sm text-on-primary relative overflow-hidden pb-8">
          <svg class="absolute -right-12 -bottom-10 w-64 h-64 text-on-primary/5 pointer-events-none" fill="none" viewBox="0 0 200 200">
            <path d="M10 180 C 60 120, 140 140, 190 20" stroke="currentColor" stroke-dasharray="4 6" stroke-width="2"></path>
            <circle cx="190" cy="20" fill="currentColor" r="4"></circle>
            <path d="M-20 120 C 50 80, 110 110, 180 60" stroke="currentColor" stroke-dasharray="3 5" stroke-width="1.5"></path>
          </svg>
          <div class="flex items-center justify-between mb-4 relative z-10">
            <div class="flex items-center gap-space-xs">
              <div class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-[#F1C933] font-bold shadow-xs">
                <span class="material-symbols-outlined text-[22px]">flight</span>
              </div>
            </div>
            <div class="flex items-center gap-space-sm">
              <button aria-label="Notifications" type="button" class="w-9 h-9 rounded-full bg-on-primary/10 flex items-center justify-center text-on-primary hover:bg-on-primary/20 transition-colors">
                <span class="material-symbols-outlined text-[20px]">notifications</span>
              </button>
              <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center ring-2 ring-secondary-fixed text-on-primary font-bold text-label-md">
                MB
              </div>
            </div>
          </div>
          <div class="relative z-10 pt-1">
            <h1 class="font-headline-lg text-headline-lg text-on-primary tracking-tight font-bold">Hi Marta,</h1>
            <p class="font-body-md text-body-md text-on-primary/80 mt-0.5">Let's get you checked in</p>
            <!-- Help Hub Search Bar retained per design decision -->
            <div class="bg-surface-page rounded-full px-4 py-2.5 flex items-center justify-between shadow-sm mt-4 text-text-body">
              <div class="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
                <span class="material-symbols-outlined text-[20px] text-text-heading flex-shrink-0">search</span>
                <input id="help-hub-input" type="text" placeholder="Ask or search for help with this trip" class="w-full bg-transparent outline-none font-body-sm text-body-sm text-text-heading placeholder:text-text-body truncate" />
              </div>
              <button id="help-hub-submit" type="button" aria-label="Search" class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-text-heading flex-shrink-0 transition-colors hover:bg-surface-variant">
                <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Content Body Container -->
        <div class="px-margin flex flex-col gap-space-lg -mt-3 relative z-20">
          <!-- Dynamic Step Progress Indicator Capsule -->
          <div class="flex items-center justify-between bg-surface-page rounded-xl shadow-sm p-3.5 border border-border-hairline">
            <div class="flex items-center gap-space-sm min-w-0">
              <div class="w-7 h-7 rounded-full bg-pill-next-bg flex items-center justify-center text-pill-next-text flex-shrink-0">
                <span class="material-symbols-outlined text-[17px]">checklist</span>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="font-label-sm text-label-sm text-primary tracking-wider uppercase font-bold truncate">${stepPillText}</span>
                <span class="font-body-sm text-body-sm text-text-body truncate">${
                  isZero
                    ? "All documents verified · Ready for passes"
                    : "Personalised options ready for your trip"
                }</span>
              </div>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0 pl-2">
              <div class="w-5 h-1.5 rounded-full bg-primary"></div>
              ${
                s.total_steps === 2
                  ? '<div class="w-2.5 h-1.5 rounded-full bg-surface-container-high"></div>'
                  : ""
              }
            </div>
          </div>

          <!-- Flight Entity Card -->
          <div class="bg-surface-page rounded-xl p-4 shadow-sm border border-border-hairline relative">
            <div class="flex items-start justify-between gap-space-sm mb-3">
              <div class="flex items-center gap-space-sm">
                <div class="w-10 h-10 rounded-xl bg-pill-next-bg flex items-center justify-center text-primary-container">
                  <span class="material-symbols-outlined text-[22px]">flight_takeoff</span>
                </div>
                <div>
                  <h2 class="font-title-md text-title-md text-text-heading font-semibold">Dublin → Faro</h2>
                  <p class="font-body-sm text-body-sm text-text-body">Tue 14 Oct · FR1234 · 06:35</p>
                </div>
              </div>
              <span class="inline-flex items-center px-2.5 py-1 rounded-full font-label-md text-label-md bg-secondary-container text-on-secondary-fixed font-bold shadow-xs">
                Check-in open
              </span>
            </div>
            <div class="bg-surface-container-low rounded-lg p-3 flex items-center justify-between text-center mt-2">
              <div class="text-left">
                <span class="font-headline-sm text-headline-sm text-text-heading leading-none block">DUB</span>
                <span class="font-label-sm text-label-sm text-text-body block mt-0.5">Terminal 1 · Gate 104</span>
              </div>
              <div class="flex-1 px-3 flex flex-col items-center">
                <span class="font-label-sm text-label-sm text-text-body mb-1">2h 55m</span>
                <div class="w-full flex items-center gap-1">
                  <div class="w-2 h-2 rounded-full bg-primary-container"></div>
                  <div class="flex-1 h-0.5 bg-outline-variant/60 relative">
                    <span class="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-container text-[14px]">airplanemode_active</span>
                  </div>
                  <div class="w-2 h-2 rounded-full bg-primary-container"></div>
                </div>
                <span class="font-label-sm text-label-sm text-pill-done-text font-bold mt-1">On schedule</span>
              </div>
              <div class="text-right">
                <span class="font-headline-sm text-headline-sm text-text-heading leading-none block">FAO</span>
                <span class="font-label-sm text-label-sm text-text-body block mt-0.5">Main Terminal</span>
              </div>
            </div>
          </div>

          <!-- Passenger Roster Section (Sanitized Child Ages: Fia B 6y, Oisín B 9y) -->
          <div class="flex flex-col gap-space-sm">
            <div class="flex items-center justify-between px-1">
              <span class="font-label-sm text-label-sm text-primary font-bold tracking-wider uppercase">4 Passengers</span>
              <span class="font-label-sm text-label-sm text-pill-done-text flex items-center gap-1 font-semibold">
                <span class="material-symbols-outlined text-[15px]" style="font-variation-settings: 'FILL' 1;">verified</span>
                Passports on file
              </span>
            </div>
            <div class="bg-surface-page rounded-xl shadow-sm border border-border-hairline overflow-hidden divide-y divide-border-hairline">
              <!-- Marta B -->
              <div class="p-3.5 flex items-center justify-between">
                <div class="flex items-center gap-space-sm min-w-0">
                  <div class="w-10 h-10 rounded-full bg-pill-next-bg text-pill-next-text flex items-center justify-center font-title-md text-title-md font-bold flex-shrink-0 ring-2 ring-primary/10">MB</div>
                  <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="font-title-md text-title-md text-text-heading font-semibold truncate">Marta B</span>
                      <span class="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">Lead Booker</span>
                    </div>
                    <span class="font-body-sm text-body-sm text-text-body flex items-center gap-1 mt-0.5">
                      <span class="material-symbols-outlined text-[14px] text-pill-done-text">check_circle</span>
                      Document verified · IRL •••• 9821
                    </span>
                  </div>
                </div>
              </div>
              <!-- Declan B -->
              <div class="p-3.5 flex items-center justify-between">
                <div class="flex items-center gap-space-sm min-w-0">
                  <div class="w-10 h-10 rounded-full bg-pill-next-bg text-pill-next-text flex items-center justify-center font-title-md text-title-md font-bold flex-shrink-0">DB</div>
                  <div class="flex flex-col min-w-0">
                    <span class="font-title-md text-title-md text-text-heading font-semibold truncate">Declan B</span>
                    <span class="font-body-sm text-body-sm text-text-body flex items-center gap-1 mt-0.5">
                      <span class="material-symbols-outlined text-[14px] text-pill-done-text">check_circle</span>
                      Document verified · IRL •••• 4120
                    </span>
                  </div>
                </div>
              </div>
              <!-- Fia B (Child, age 6) -->
              <div class="p-3.5 flex items-center justify-between">
                <div class="flex items-center gap-space-sm min-w-0">
                  <div class="w-10 h-10 rounded-full bg-secondary-fixed/40 text-on-secondary-fixed flex items-center justify-center font-title-md text-title-md font-bold flex-shrink-0">FB</div>
                  <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="font-title-md text-title-md text-text-heading font-semibold truncate">Fia B</span>
                      <span class="bg-pill-plan-bg text-pill-plan-text font-label-sm text-label-sm px-1.5 py-0.5 rounded font-bold">Child (6y)</span>
                    </div>
                    <span class="font-body-sm text-body-sm text-text-body flex items-center gap-1 mt-0.5">
                      <span class="material-symbols-outlined text-[14px] text-pill-done-text">check_circle</span>
                      Document verified · IRL •••• 7731
                    </span>
                  </div>
                </div>
              </div>
              <!-- Oisín B (Child, age 9) -->
              <div class="p-3.5 flex items-center justify-between">
                <div class="flex items-center gap-space-sm min-w-0">
                  <div class="w-10 h-10 rounded-full bg-secondary-fixed/40 text-on-secondary-fixed flex items-center justify-center font-title-md text-title-md font-bold flex-shrink-0">OB</div>
                  <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="font-title-md text-title-md text-text-heading font-semibold truncate">Oisín B</span>
                      <span class="bg-pill-plan-bg text-pill-plan-text font-label-sm text-label-sm px-1.5 py-0.5 rounded font-bold">Child (9y)</span>
                    </div>
                    <span class="font-body-sm text-body-sm text-text-body flex items-center gap-1 mt-0.5">
                      <span class="material-symbols-outlined text-[14px] text-pill-done-text">check_circle</span>
                      Document verified · IRL •••• 6614
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Primary CTA -->
          <div class="pt-1 pb-2 flex flex-col gap-space-sm">
            <button id="start-checkin-btn" type="button" class="w-full bg-primary hover:bg-primary-container text-on-primary py-4 px-6 rounded-full font-title-md text-title-md font-semibold tracking-wide shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-space-sm">
              <span>Start check-in</span>
              <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
            <p class="font-label-sm text-label-sm text-text-body text-center flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-[14px] text-pill-done-text">lock</span>
              By continuing you confirm dangerous goods compliance
            </p>
          </div>
        </div>
      </div>
    `;
  }

  function bindScreenE() {
    const startBtn = document.getElementById("start-checkin-btn");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        state.currentScreen = "loading";
        renderCurrentScreen();
        setTimeout(() => {
          state.currentScreen =
            state.sessionData.flow_branch === "zero_offer"
              ? "zero_offer"
              : "offer_page_1";
          renderCurrentScreen();
        }, 380);
      });
    }
    const helpBtn = document.getElementById("help-hub-submit");
    if (helpBtn) {
      helpBtn.addEventListener("click", () => {
        const input = document.getElementById("help-hub-input");
        const q = input && input.value.trim();
        showToast(
          q
            ? `Flight FR1234 departs 06:35 from DUB Terminal 1, Gate 104.`
            : "Tap 'Start check-in' below to complete check-in in 2 steps."
        );
      });
    }
  }

  /* ==========================================================================
   * SCREEN 2 (Transient) — "Getting your trip ready." Skeleton State
   * ========================================================================== */
  function renderScreenLoading() {
    return `
      <div class="flex-1 flex flex-col items-center justify-center px-margin py-16 text-center gap-4">
        <div class="w-12 h-12 rounded-full bg-surface-ai flex items-center justify-center text-[#4B2EDB] animate-pulse">
          <span class="material-symbols-outlined text-[26px]">flight_takeoff</span>
        </div>
        <div>
          <p class="font-title-md text-text-heading font-semibold">Getting your trip ready.</p>
          <p class="font-body-sm text-text-body mt-1"> Dublin → Faro · FR1234</p>
        </div>
        <div class="w-full max-w-xs space-y-3 mt-4">
          <div class="h-20 rounded-xl bg-surface-container-low animate-pulse"></div>
          <div class="h-36 rounded-2xl bg-surface-ai/70 animate-pulse"></div>
          <div class="h-12 rounded-full bg-surface-container-low animate-pulse"></div>
        </div>
      </div>
    `;
  }

  /* ==========================================================================
   * SCREEN A — Offer Page 1 ("Step 1 of 2" / "Step 1 of 1")
   * ========================================================================== */
  function renderScreenA() {
    const s = state.sessionData;
    const page = (s.pages && s.pages[0]) || {
      step_indicator: "Step 1 of 2",
      assistant_panel: {
        heading: "You usually travel with Priority",
        supporting_text: "You added it on your last 3 trips.",
      },
      cards: [],
      drawer_items: [],
    };
    const priorityAdded = isProductSelected("priority_boarding");
    const seatsAdded = isProductSelected("reserved_seats");
    const hasSitTogetherCard = page.cards.some(
      (c) => c.product_id === "reserved_seats"
    );
    const hasNextOfferPage = s.pages && s.pages.length >= 2;
    const continueLabel =
      priorityAdded || seatsAdded
        ? hasNextOfferPage
          ? "Continue to Step 2"
          : "Review your extras"
        : "No thanks, continue";

    return `
      <div class="flex flex-col w-full pb-8">
        <!-- Compact Brand Navy Header Block (Header Ladder Rule: no duplicate greeting) -->
        <div class="bg-primary-container px-margin py-3.5 rounded-b-[24px] shadow-sm flex items-center justify-between text-on-primary">
          <button id="screen-a-back" type="button" aria-label="Back" class="w-9 h-9 flex items-center justify-start text-on-primary hover:opacity-80 transition-opacity">
            <span class="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 class="font-title-md text-title-md font-bold text-on-primary text-center flex-1">Check in</h1>
          <span class="font-label-md text-label-md text-on-primary/90 text-right min-w-[72px]">${page.step_indicator}</span>
        </div>

        <div class="px-margin flex flex-col gap-space-lg pt-space-lg">
          <!-- Flight Route Entity Card -->
          <div class="bg-surface-page rounded-xl p-space-md shadow-sm border border-border-hairline flex items-center justify-between gap-space-sm">
            <div class="flex items-center gap-space-md">
              <div class="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center flex-shrink-0 text-primary">
                <span class="material-symbols-outlined text-[22px]">flight_takeoff</span>
              </div>
              <div class="flex flex-col">
                <h2 class="font-title-md text-title-md text-text-heading truncate">Dublin → Faro</h2>
                <p class="font-body-sm text-body-sm text-text-body truncate">Tue 14 Oct · FR1234 · 06:35</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-md bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md flex-shrink-0">
              Check-in open
            </span>
          </div>

          <!-- Lavender Assistant Insight Panel (surface/ai #F2F1FE) -->
          <div class="bg-surface-ai rounded-[18px] p-space-lg flex flex-col gap-space-md shadow-sm">
            <div class="flex items-start gap-space-md">
              <div class="w-9 h-9 rounded-full bg-[#4B2EDB] flex items-center justify-center flex-shrink-0 text-on-primary shadow-sm">
                <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
              </div>
              <div class="flex flex-col">
                <h3 class="font-title-md text-title-md text-[#4B2EDB] font-bold">${page.assistant_panel.heading}</h3>
                <p class="font-body-sm text-body-sm text-text-body mt-0.5">${page.assistant_panel.supporting_text}</p>
              </div>
            </div>

            <!-- Card A: Priority & 2 Cabin Bags -->
            <div class="bg-surface-page rounded-xl p-space-md border border-border-hairline flex flex-col gap-space-sm shadow-sm">
              <div class="flex items-center justify-between gap-space-sm">
                <div class="flex items-center gap-space-sm">
                  <span class="material-symbols-outlined text-primary text-[22px] flex-shrink-0">luggage</span>
                  <span class="font-title-md text-title-md text-text-heading">Priority &amp; 2 Cabin Bags</span>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-pill-next-bg text-pill-next-text font-label-sm text-label-sm flex-shrink-0">
                  Your usual
                </span>
              </div>
              <p class="font-body-sm text-body-sm text-text-body">Skip the queue, 2 bags each</p>
              <div class="flex items-center justify-between pt-1 mt-1">
                <div class="flex flex-col">
                  <span class="text-[18px] font-bold text-text-heading">€76 for 4 passengers</span>
                  <button id="choose-who-link" type="button" class="text-left font-label-md text-label-md text-primary-container underline mt-0.5">
                    Choose who gets it
                  </button>
                </div>
                <button id="toggle-priority-btn" type="button" class="${
                  priorityAdded
                    ? "px-5 py-2 rounded-full bg-pill-done-bg text-pill-done-text border-[1.5px] border-pill-done-text font-title-md text-body-md font-semibold transition-all"
                    : "px-5 py-2 rounded-full border-[1.5px] border-primary-container text-primary-container font-title-md text-body-md font-semibold hover:bg-primary-container/5 transition-all"
                }">
                  ${priorityAdded ? "✓ Added" : "Add"}
                </button>
              </div>
            </div>

            ${
              hasSitTogetherCard
                ? `
            <!-- Card B: Sit together -->
            <div class="bg-surface-page rounded-xl p-space-md border border-border-hairline flex flex-col gap-space-sm shadow-sm">
              <div class="flex items-center justify-between gap-space-sm">
                <div class="flex items-center gap-space-sm">
                  <span class="material-symbols-outlined text-primary text-[22px] flex-shrink-0">airline_seat_recline_extra</span>
                  <span class="font-title-md text-title-md text-text-heading">Sit together</span>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-pill-review-bg text-pill-review-text font-label-sm text-label-sm flex-shrink-0">
                  Recommended
                </span>
              </div>
              <p class="font-body-sm text-body-sm text-text-body">Seats are assigned free, but your family may be split up</p>
              <div class="flex items-center justify-between pt-1 mt-1">
                <div class="flex flex-col">
                  <span class="text-[18px] font-bold text-text-heading">€24 for 4 seats</span>
                  <span class="font-label-md text-label-md text-text-body">${
                    seatsAdded ? "Row 12 (12A–12D) reserved" : "Row 12 · Together"
                  }</span>
                </div>
                <button id="choose-seats-btn" type="button" class="${
                  seatsAdded
                    ? "px-5 py-2 rounded-full bg-pill-done-bg text-pill-done-text border-[1.5px] border-pill-done-text font-title-md text-body-md font-semibold transition-all"
                    : "px-5 py-2 rounded-full border-[1.5px] border-primary-container text-primary-container font-title-md text-body-md font-semibold hover:bg-primary-container/5 transition-all"
                }">
                  ${seatsAdded ? "Seats 12A–12D ✓" : "Choose seats"}
                </button>
              </div>
            </div>
            `
                : ""
            }
          </div>

          <!-- First-Class Decline / Continue Action (Equal Visual Weight) -->
          <div class="w-full flex flex-col items-center">
            <button id="screen-a-continue" type="button" class="w-full py-3.5 px-space-lg rounded-full border-[1.5px] border-primary-container text-primary-container font-title-md text-title-md font-semibold flex items-center justify-center gap-space-sm hover:bg-primary-container/5 active:scale-[0.99] transition-all">
              <span>${continueLabel}</span>
              <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function bindScreenA() {
    const backBtn = document.getElementById("screen-a-back");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        state.currentScreen = "checkin_start";
        renderCurrentScreen();
      });
    }

    const whoLink = document.getElementById("choose-who-link");
    if (whoLink) {
      whoLink.addEventListener("click", () => {
        showToast(
          "Applies Priority & 2 Cabin Bags across all 4 passengers (Marta, Declan, Fia, Oisín) for €76.00."
        );
      });
    }

    const priorityBtn = document.getElementById("toggle-priority-btn");
    if (priorityBtn) {
      priorityBtn.addEventListener("click", async () => {
        const currentlySelected = isProductSelected("priority_boarding");
        const mutation = await apiFetch(
          `/api/v1/checkin/sessions/${state.sessionId}/actions`,
          {
            method: "POST",
            body: JSON.stringify({
              action: currentlySelected ? "remove_item" : "add",
              current_screen: "offer_page_1",
              product_id: "priority_boarding",
              quantity: currentlySelected ? 0 : 1,
            }),
          }
        );
        syncMutationResponse(mutation);
        await refreshAnalytics();
        renderCurrentScreen();
      });
    }

    const chooseSeatsBtn = document.getElementById("choose-seats-btn");
    if (chooseSeatsBtn) {
      chooseSeatsBtn.addEventListener("click", async () => {
        state.seatMapData = await apiFetch(
          `/api/v1/checkin/sessions/${state.sessionId}/seat-map`
        );
        state.currentScreen = "seat_map";
        renderCurrentScreen();
      });
    }

    const continueBtn = document.getElementById("screen-a-continue");
    if (continueBtn) {
      continueBtn.addEventListener("click", async () => {
        const hasSelection =
          isProductSelected("priority_boarding") ||
          isProductSelected("reserved_seats");
        const mutation = await apiFetch(
          `/api/v1/checkin/sessions/${state.sessionId}/actions`,
          {
            method: "POST",
            body: JSON.stringify({
              action: hasSelection ? "continue" : "decline_page",
              current_screen: "offer_page_1",
            }),
          }
        );
        syncMutationResponse(mutation);
        state.currentScreen = mutation.next_screen;
        await refreshAnalytics();
        renderCurrentScreen();
      });
    }
  }

  /* ==========================================================================
   * SCREEN F — Seat Map (No Step Number, No Urgency Timer, No Row 14, Child Exit Row Rule)
   * ========================================================================== */
  function renderScreenF() {
    return `
      <div class="flex flex-col w-full pb-4">
        <!-- Compact Navy Header (Sub-screen of Offer Page 1: NO step number) -->
        <div class="bg-primary-container text-on-primary px-margin pt-3 pb-5 rounded-b-[24px] shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <button id="screen-f-back" type="button" aria-label="Back to Offer Page 1" class="w-9 h-9 -ml-1 flex items-center justify-start text-on-primary hover:opacity-80">
              <span class="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 class="font-title-md text-title-md font-bold text-on-primary flex-1 text-center">Choose your seats</h1>
            <span class="w-9"></span>
          </div>
          <p class="font-body-sm text-body-sm text-primary-fixed text-center flex items-center justify-center gap-1.5 flex-wrap">
            <span>Dublin to Faro</span>
            <span>•</span>
            <span>Flight FR1234</span>
            <span>•</span>
            <span>Boeing 737-800</span>
          </p>
        </div>

        <div class="px-margin flex flex-col gap-space-md -mt-2 pt-3">
          <!-- Passenger Selection Bar -->
          <div class="bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-border-hairline flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm text-text-body uppercase tracking-wider">Party of 4 (Byrne Family)</span>
              <span class="font-label-sm text-label-sm text-pill-done-text bg-pill-done-bg px-2 py-0.5 rounded-full flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]">check_circle</span>
                All seated together
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="flex items-center justify-between p-2 rounded-lg bg-secondary-container/20">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-label-md shrink-0 font-bold">M</div>
                  <div class="truncate">
                    <p class="font-title-md text-text-heading truncate text-[13px] leading-tight">Marta</p>
                    <p class="font-body-sm text-text-body text-[11px] leading-tight">Adult</p>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-fixed text-[13px] font-bold">12A</span>
              </div>
              <div class="flex items-center justify-between p-2 rounded-lg bg-secondary-container/20">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-label-md shrink-0 font-bold">D</div>
                  <div class="truncate">
                    <p class="font-title-md text-text-heading truncate text-[13px] leading-tight">Declan</p>
                    <p class="font-body-sm text-text-body text-[11px] leading-tight">Adult</p>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-fixed text-[13px] font-bold">12B</span>
              </div>
              <div class="flex items-center justify-between p-2 rounded-lg bg-secondary-container/20">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-label-md shrink-0 font-bold">F</div>
                  <div class="truncate">
                    <p class="font-title-md text-text-heading truncate text-[13px] leading-tight">Fia (6y)</p>
                    <p class="font-body-sm text-text-body text-[11px] leading-tight">Child</p>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-fixed text-[13px] font-bold">12C</span>
              </div>
              <div class="flex items-center justify-between p-2 rounded-lg bg-secondary-container/20">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-label-md shrink-0 font-bold">O</div>
                  <div class="truncate">
                    <p class="font-title-md text-text-heading truncate text-[13px] leading-tight">Oisín (9y)</p>
                    <p class="font-body-sm text-text-body text-[11px] leading-tight">Child</p>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-fixed text-[13px] font-bold">12D</span>
              </div>
            </div>
          </div>

          <!-- Lavender Assistant Insight Panel (Sanitized: NO urgency countdown timer) -->
          <div class="rounded-[18px] p-4 bg-surface-ai flex flex-col gap-2">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-[#4B2EDB] flex items-center justify-center shrink-0 shadow-sm">
                <span class="material-symbols-outlined text-surface-page text-[18px]" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
              </div>
              <div class="flex-1">
                <h2 class="font-title-md text-title-md text-[#4B2EDB] font-bold">I've found 4 seats together</h2>
                <p class="font-body-sm text-body-sm text-text-body mt-0.5">Row 12, near the front. Marta &amp; Declan with children Fia &amp; Oisín seated together.</p>
              </div>
            </div>
            <div class="flex items-center gap-2 pt-1 font-label-sm text-label-sm text-pill-done-text bg-surface-page/80 px-2.5 py-1.5 rounded-lg">
              <span class="material-symbols-outlined text-[15px] shrink-0">verified</span>
              <span class="truncate">Family seating rules verified • No extra grouping fee</span>
            </div>
          </div>

          <!-- Cabin Seat Map Card (Sanitized: Row 14 excluded; Exit Row 16 greyed for children) -->
          <div class="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-border-hairline flex flex-col items-center">
            <div class="w-full grid grid-cols-7 gap-1 text-center font-label-sm text-label-sm text-text-body py-1.5 mb-2 bg-surface-container-low rounded-lg">
              <span>A</span><span>B</span><span>C</span><span class="text-on-surface-variant/50">AISLE</span><span>D</span><span>E</span><span>F</span>
            </div>

            <div class="w-full flex flex-col gap-2">
              <!-- Row 11 -->
              <div class="grid grid-cols-7 gap-1.5 items-center">
                <div class="h-9 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant/40"><span class="material-symbols-outlined text-[14px]">close</span></div>
                <div class="h-9 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant/40"><span class="material-symbols-outlined text-[14px]">close</span></div>
                <div class="h-9 rounded-lg bg-surface-container-low flex flex-col items-center justify-center text-primary-container"><span class="font-label-sm leading-none font-bold">11C</span><span class="text-[9px] text-text-body">€6</span></div>
                <div class="h-9 flex items-center justify-center font-label-md text-text-body font-bold">11</div>
                <div class="h-9 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant/40"><span class="material-symbols-outlined text-[14px]">close</span></div>
                <div class="h-9 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant/40"><span class="material-symbols-outlined text-[14px]">close</span></div>
                <div class="h-9 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant/40"><span class="material-symbols-outlined text-[14px]">close</span></div>
              </div>

              <!-- Row 12 Badge -->
              <div class="w-full flex justify-center -mb-0.5 mt-1">
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-secondary-fixed shadow-sm">
                  <span class="material-symbols-outlined text-[14px]">stars</span>
                  <span class="font-label-sm text-label-sm font-bold tracking-wide">Best row for your group</span>
                </div>
              </div>

              <!-- Row 12 (RECOMMENDED 12A-12D) -->
              <div class="grid grid-cols-7 gap-1.5 items-center p-1 rounded-xl bg-secondary-container/20">
                <div class="h-11 rounded-lg bg-secondary-container text-on-secondary-fixed flex flex-col items-center justify-center shadow-sm">
                  <span class="text-[12px] font-bold leading-tight">12A</span>
                  <span class="text-[9px] uppercase font-bold">Marta</span>
                </div>
                <div class="h-11 rounded-lg bg-secondary-container text-on-secondary-fixed flex flex-col items-center justify-center shadow-sm">
                  <span class="text-[12px] font-bold leading-tight">12B</span>
                  <span class="text-[9px] uppercase font-bold">Declan</span>
                </div>
                <div class="h-11 rounded-lg bg-secondary-container text-on-secondary-fixed flex flex-col items-center justify-center shadow-sm">
                  <span class="text-[12px] font-bold leading-tight">12C</span>
                  <span class="text-[9px] uppercase font-bold">Fia</span>
                </div>
                <div class="h-11 flex items-center justify-center text-primary-container font-bold text-[15px]">12</div>
                <div class="h-11 rounded-lg bg-secondary-container text-on-secondary-fixed flex flex-col items-center justify-center shadow-sm">
                  <span class="text-[12px] font-bold leading-tight">12D</span>
                  <span class="text-[9px] uppercase font-bold">Oisín</span>
                </div>
                <div class="h-11 rounded-lg bg-surface-container-low flex flex-col items-center justify-center text-primary-container">
                  <span class="font-label-sm leading-tight font-bold">12E</span>
                  <span class="text-[9px] text-text-body">€6</span>
                </div>
                <div class="h-11 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant/40">
                  <span class="material-symbols-outlined text-[14px]">close</span>
                </div>
              </div>

              <!-- Row 13 -->
              <div class="grid grid-cols-7 gap-1.5 items-center">
                <div class="h-9 rounded-lg bg-surface-container-low flex flex-col items-center justify-center text-primary-container"><span class="font-label-sm leading-none font-bold">13A</span><span class="text-[9px] text-text-body">€6</span></div>
                <div class="h-9 rounded-lg bg-surface-container-low flex flex-col items-center justify-center text-primary-container"><span class="font-label-sm leading-none font-bold">13B</span><span class="text-[9px] text-text-body">€6</span></div>
                <div class="h-9 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant/40"><span class="material-symbols-outlined text-[14px]">close</span></div>
                <div class="h-9 flex items-center justify-center font-label-md text-text-body font-bold">13</div>
                <div class="h-9 rounded-lg bg-surface-container-low flex flex-col items-center justify-center text-primary-container"><span class="font-label-sm leading-none font-bold">13D</span><span class="text-[9px] text-text-body">€6</span></div>
                <div class="h-9 rounded-lg bg-surface-container-low flex flex-col items-center justify-center text-primary-container"><span class="font-label-sm leading-none font-bold">13E</span><span class="text-[9px] text-text-body">€6</span></div>
                <div class="h-9 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant/40"><span class="material-symbols-outlined text-[14px]">close</span></div>
              </div>

              <!-- Row 15 (Row 14 omitted per Consistency Contract) -->
              <div class="grid grid-cols-7 gap-1.5 items-center">
                <div class="h-9 rounded-lg bg-surface-container-low flex flex-col items-center justify-center text-primary-container"><span class="font-label-sm leading-none font-bold">15A</span><span class="text-[9px] text-text-body">€6</span></div>
                <div class="h-9 rounded-lg bg-surface-container-low flex flex-col items-center justify-center text-primary-container"><span class="font-label-sm leading-none font-bold">15B</span><span class="text-[9px] text-text-body">€6</span></div>
                <div class="h-9 rounded-lg bg-surface-container-low flex flex-col items-center justify-center text-primary-container"><span class="font-label-sm leading-none font-bold">15C</span><span class="text-[9px] text-text-body">€6</span></div>
                <div class="h-9 flex items-center justify-center font-label-md text-text-body font-bold">15</div>
                <div class="h-9 rounded-lg bg-surface-container-low flex flex-col items-center justify-center text-primary-container"><span class="font-label-sm leading-none font-bold">15D</span><span class="text-[9px] text-text-body">€6</span></div>
                <div class="h-9 rounded-lg bg-surface-container-low flex flex-col items-center justify-center text-primary-container"><span class="font-label-sm leading-none font-bold">15E</span><span class="text-[9px] text-text-body">€6</span></div>
                <div class="h-9 rounded-lg bg-surface-container-low flex flex-col items-center justify-center text-primary-container"><span class="font-label-sm leading-none font-bold">15F</span><span class="text-[9px] text-text-body">€6</span></div>
              </div>

              <!-- Exit Row 16 (Child Seating Rule: Greyed out with tap reason) -->
              <div class="w-full flex items-center justify-between py-1 px-2.5 my-0.5 rounded bg-surface-container-high text-text-body">
                <span class="font-label-sm text-label-sm font-bold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">block</span>
                  EXIT ROW 16 · UNAVAILABLE WITH CHILDREN (6Y, 9Y)
                </span>
              </div>
              <div class="grid grid-cols-7 gap-1.5 items-center opacity-50">
                ${["16A", "16B", "16C"]
                  .map(
                    (s) =>
                      `<button type="button" class="child-restricted-seat h-9 rounded-lg bg-surface-variant flex flex-col items-center justify-center text-on-surface-variant cursor-not-allowed" data-seat="${s}"><span class="font-label-sm leading-none">${s}</span><span class="text-[8px]">Restricted</span></button>`
                  )
                  .join("")}
                <div class="h-9 flex items-center justify-center font-label-md text-text-body font-bold">16</div>
                ${["16D", "16E", "16F"]
                  .map(
                    (s) =>
                      `<button type="button" class="child-restricted-seat h-9 rounded-lg bg-surface-variant flex flex-col items-center justify-center text-on-surface-variant cursor-not-allowed" data-seat="${s}"><span class="font-label-sm leading-none">${s}</span><span class="text-[8px]">Restricted</span></button>`
                  )
                  .join("")}
              </div>
            </div>
          </div>

          <!-- Sticky Confirm Bar -->
          <div class="bg-surface-page rounded-2xl p-3.5 shadow-md border border-border-hairline flex items-center justify-between mt-1">
            <div class="flex flex-col">
              <span class="font-label-sm text-label-sm text-text-body uppercase tracking-wider">4 seats · Row 12</span>
              <div class="flex items-baseline gap-1">
                <span class="font-headline-sm text-headline-sm text-text-heading leading-tight">€24.00</span>
                <span class="font-body-sm text-body-sm text-text-body">(@ €6.00)</span>
              </div>
            </div>
            <button id="confirm-seats-btn" type="button" class="bg-primary hover:bg-primary-container text-on-primary px-6 py-3 rounded-full font-title-md text-title-md flex items-center gap-2 shadow-md transition-all active:scale-[0.98]">
              <span>Confirm seats</span>
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function bindScreenF() {
    const backBtn = document.getElementById("screen-f-back");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        state.currentScreen = "offer_page_1";
        renderCurrentScreen();
      });
    }

    document.querySelectorAll(".child-restricted-seat").forEach((btn) => {
      btn.addEventListener("click", () => {
        showToast(
          "Safety rule: Emergency exit row 16 cannot accommodate children under 16 (Fia, 6 and Oisín, 9)."
        );
      });
    });

    const confirmBtn = document.getElementById("confirm-seats-btn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", async () => {
        // Wiring Trap #1: Confirm seats goes directly to Offer Page 2, never back to Offer Page 1
        const mutation = await apiFetch(
          `/api/v1/checkin/sessions/${state.sessionId}/seats`,
          {
            method: "POST",
            body: JSON.stringify({
              seat_designators: ["12A", "12B", "12C", "12D"],
            }),
          }
        );
        syncMutationResponse(mutation);
        state.currentScreen = mutation.next_screen;
        await refreshAnalytics();
        renderCurrentScreen();
      });
    }
  }

  /* ==========================================================================
   * SCREEN B — Offer Page 2 ("Step 2 of 2", Sanitized Copy + Expandable Car Hire Drawer)
   * ========================================================================== */
  function renderScreenB() {
    const s = state.sessionData;
    const page = (s.pages && s.pages[1]) || {
      step_indicator: "Step 2 of 2",
      assistant_panel: {
        heading: "Most families on this route add a bag",
        supporting_text: "7 nights, 4 travellers.",
      },
      drawer_label: "More extras (1)",
      drawer_items: [
        {
          product_id: "car_hire",
          title: "Car hire in Faro",
          description: "Pick up at Faro Airport (FAO) · Free cancellation",
          price_label: "From €28.00/day",
          price_eur: 28.0,
        },
      ],
    };

    const bagCount = getProductQuantity("checked_bag_20kg");
    const carSelected = isProductSelected("car_hire");
    const hasAnySelection = bagCount > 0 || carSelected;

    return `
      <div class="flex flex-col w-full pb-8">
        <!-- Compact Brand Navy Header -->
        <div class="bg-primary-container px-margin py-3.5 rounded-b-[24px] shadow-sm flex items-center justify-between text-on-primary">
          <button id="screen-b-back" type="button" aria-label="Back to Offer Page 1" class="w-9 h-9 flex items-center justify-start text-on-primary hover:opacity-80">
            <span class="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 class="font-title-md text-title-md font-bold text-on-primary text-center flex-1">Check in</h1>
          <span class="font-label-md text-label-md text-on-primary/90 text-right min-w-[72px]">${page.step_indicator}</span>
        </div>

        <div class="px-margin flex flex-col gap-space-lg pt-space-lg">
          <!-- Section Heading (Sanitized: "for this flight", not "for your return journey") -->
          <div class="flex flex-col items-start gap-1">
            <h2 class="font-headline-sm text-headline-sm text-text-heading">Anything in the hold?</h2>
            <p class="font-body-sm text-body-sm text-text-body">
              Customise your checked luggage allowance for this flight.
            </p>
          </div>

          <!-- Lavender Assistant Insight Panel (Sanitized: Garbled refund line removed) -->
          <div class="rounded-[18px] bg-surface-ai p-space-md flex flex-col gap-space-md shadow-sm">
            <div class="flex items-start gap-space-sm">
              <div class="w-9 h-9 rounded-full bg-[#4B2EDB] flex items-center justify-center shrink-0 shadow-sm">
                <span class="material-symbols-outlined text-on-primary text-[19px]" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
              </div>
              <div class="flex flex-col pt-0.5">
                <h3 class="font-title-md text-title-md text-[#4B2EDB] font-bold">${page.assistant_panel.heading}</h3>
                <span class="font-body-sm text-body-sm text-text-body mt-0.5">${page.assistant_panel.supporting_text}</span>
              </div>
            </div>

            <!-- Card C: 20kg Checked Bag -->
            <div class="bg-surface-page rounded-xl p-space-md border border-border-hairline flex flex-col gap-space-md shadow-sm">
              <div class="flex items-start justify-between gap-space-sm">
                <div class="flex items-start gap-space-sm">
                  <div class="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-primary text-[22px]">luggage</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-title-md text-title-md text-text-heading">20kg Checked Bag</span>
                    <span class="font-body-sm text-body-sm text-text-body">Up to 119 × 119 × 81cm · Outbound flight</span>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <span class="text-[18px] font-bold text-text-heading">€39.99</span>
                  <span class="block font-label-sm text-label-sm text-text-body font-normal">one way</span>
                </div>
              </div>

              <!-- Quantity Stepper + Add Button -->
              <div class="flex items-center justify-between pt-1">
                <div class="flex items-center bg-surface-container-low rounded-full px-1.5 py-1">
                  <button id="bag-dec-btn" type="button" aria-label="Decrease quantity" ${
                    bagCount === 0 ? "disabled" : ""
                  } class="w-7 h-7 rounded-full flex items-center justify-center text-outline transition-colors disabled:opacity-40 hover:bg-surface-page">
                    <span class="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <span id="bag-count-val" class="w-8 text-center font-title-md text-text-heading select-none">${bagCount}</span>
                  <button id="bag-inc-btn" type="button" aria-label="Increase quantity" class="w-7 h-7 rounded-full flex items-center justify-center text-primary transition-colors hover:bg-surface-page">
                    <span class="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
                <button id="bag-toggle-btn" type="button" class="${
                  bagCount > 0
                    ? "px-5 py-2 rounded-full bg-pill-done-bg text-pill-done-text border-[1.5px] border-pill-done-text font-title-md text-body-md font-semibold transition-all"
                    : "px-5 py-2 rounded-full border-[1.5px] border-primary-container text-primary-container font-title-md text-body-md font-semibold hover:bg-primary-container/5 transition-all"
                }">
                  ${bagCount > 0 ? `Selected (${bagCount}) ✓` : "Add"}
                </button>
              </div>
            </div>
          </div>

          <!-- Collapsed Demotion Drawer: "More extras (1)" -> Expands in place to Car hire in Faro -->
          <div class="flex flex-col rounded-xl border border-border-hairline bg-surface-page shadow-sm overflow-hidden">
            <button id="drawer-toggle-btn" type="button" class="w-full p-space-md flex items-center justify-between hover:bg-surface-container-low/60 transition-colors">
              <div class="flex items-center gap-space-sm">
                <div class="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center">
                  <span class="material-symbols-outlined text-primary text-[18px]">directions_car</span>
                </div>
                <div class="flex flex-col items-start">
                  <span class="font-body-md text-body-md font-semibold text-text-heading">${
                    page.drawer_label || "More extras (1)"
                  }</span>
                  <span class="font-body-sm text-body-sm text-text-body">Car hire in Faro (score 0.29 · demoted to drawer)</span>
                </div>
              </div>
              <span class="material-symbols-outlined text-outline text-[20px] transition-transform ${
                state.drawerExpanded ? "rotate-90" : ""
              }">chevron_right</span>
            </button>

            ${
              state.drawerExpanded
                ? `
            <div class="px-space-md pb-space-md pt-2 border-t border-border-hairline bg-surface-container-low/40 flex items-center justify-between gap-3">
              <div class="flex flex-col">
                <span class="font-title-md text-text-heading">Car hire in Faro (FAO)</span>
                <span class="font-body-sm text-text-body">Pick up at terminal · Free cancellation</span>
                <span class="font-title-md text-text-heading font-bold mt-1">€28.00 <span class="font-body-sm font-normal text-text-body">/ day</span></span>
              </div>
              <button id="car-hire-toggle-btn" type="button" class="${
                carSelected
                  ? "px-4 py-2 rounded-full bg-pill-done-bg text-pill-done-text border-[1.5px] border-pill-done-text font-semibold text-xs"
                  : "px-4 py-2 rounded-full border-[1.5px] border-primary-container text-primary-container font-semibold text-xs"
              }">
                ${carSelected ? "Added ✓" : "Add"}
              </button>
            </div>
            `
                : ""
            }
          </div>

          <!-- First-Class Decline / Continue Button -->
          <div class="flex flex-col gap-space-sm pt-1">
            <button id="screen-b-continue" type="button" class="w-full rounded-full py-3.5 px-6 text-center font-title-md text-title-md border-[1.5px] border-primary-container text-primary-container bg-surface-page hover:bg-primary-container/5 active:scale-[0.99] transition-all flex items-center justify-center gap-space-xs">
              <span>${
                hasAnySelection
                  ? `Confirm &amp; Continue (${bagCount > 0 ? `${bagCount} bag` : "extras"})`
                  : "No thanks, continue"
              }</span>
              <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function bindScreenB() {
    const backBtn = document.getElementById("screen-b-back");
    if (backBtn) {
      backBtn.addEventListener("click", async () => {
        // Wiring Trap #2: Back arrow on Offer Page 2 goes to Offer Page 1, never Seat Map
        const mutation = await apiFetch(
          `/api/v1/checkin/sessions/${state.sessionId}/actions`,
          {
            method: "POST",
            body: JSON.stringify({
              action: "navigate_back",
              current_screen: "offer_page_2",
            }),
          }
        );
        syncMutationResponse(mutation);
        state.currentScreen = mutation.next_screen;
        renderCurrentScreen();
      });
    }

    const updateBagQty = async (newQty) => {
      const mutation = await apiFetch(
        `/api/v1/checkin/sessions/${state.sessionId}/actions`,
        {
          method: "POST",
          body: JSON.stringify({
            action: newQty > 0 ? "add" : "update_quantity",
            current_screen: "offer_page_2",
            product_id: "checked_bag_20kg",
            quantity: newQty,
          }),
        }
      );
      syncMutationResponse(mutation);
      await refreshAnalytics();
      renderCurrentScreen();
    };

    const incBtn = document.getElementById("bag-inc-btn");
    if (incBtn) {
      incBtn.addEventListener("click", () => {
        const current = getProductQuantity("checked_bag_20kg");
        if (current < 4) updateBagQty(current + 1);
      });
    }

    const decBtn = document.getElementById("bag-dec-btn");
    if (decBtn) {
      decBtn.addEventListener("click", () => {
        const current = getProductQuantity("checked_bag_20kg");
        if (current > 0) updateBagQty(current - 1);
      });
    }

    const bagToggle = document.getElementById("bag-toggle-btn");
    if (bagToggle) {
      bagToggle.addEventListener("click", () => {
        const current = getProductQuantity("checked_bag_20kg");
        updateBagQty(current === 0 ? 1 : 0);
      });
    }

    const drawerBtn = document.getElementById("drawer-toggle-btn");
    if (drawerBtn) {
      drawerBtn.addEventListener("click", () => {
        state.drawerExpanded = !state.drawerExpanded;
        renderCurrentScreen();
      });
    }

    const carBtn = document.getElementById("car-hire-toggle-btn");
    if (carBtn) {
      carBtn.addEventListener("click", async () => {
        const selected = isProductSelected("car_hire");
        const mutation = await apiFetch(
          `/api/v1/checkin/sessions/${state.sessionId}/actions`,
          {
            method: "POST",
            body: JSON.stringify({
              action: selected ? "remove_item" : "add",
              current_screen: "offer_page_2",
              product_id: "car_hire",
              quantity: selected ? 0 : 1,
            }),
          }
        );
        syncMutationResponse(mutation);
        await refreshAnalytics();
        renderCurrentScreen();
      });
    }

    const continueBtn = document.getElementById("screen-b-continue");
    if (continueBtn) {
      continueBtn.addEventListener("click", async () => {
        const hasBagOrCar =
          getProductQuantity("checked_bag_20kg") > 0 ||
          isProductSelected("car_hire");
        const mutation = await apiFetch(
          `/api/v1/checkin/sessions/${state.sessionId}/actions`,
          {
            method: "POST",
            body: JSON.stringify({
              action: hasBagOrCar ? "continue" : "decline_page",
              current_screen: "offer_page_2",
            }),
          }
        );
        syncMutationResponse(mutation);
        // Empty-basket skip rule: if basket is empty, backend sets next_screen = "boarding_passes"
        state.currentScreen = mutation.next_screen;
        await refreshAnalytics();
        renderCurrentScreen();
      });
    }
  }

  /* ==========================================================================
   * SCREEN D — Review & Pay (No Step Number, Dynamic Removable Line Items, Visa 4412)
   * ========================================================================== */
  function renderScreenD() {
    const items = state.basketData.items || [];
    const iconMap = {
      priority_boarding: "luggage",
      reserved_seats: "airline_seat_recline_extra",
      checked_bag_20kg: "shopping_bag",
      car_hire: "directions_car",
    };
    const subBadgeMap = {
      priority_boarding: "All guests",
      reserved_seats: "Together",
      checked_bag_20kg: "Hold luggage",
      car_hire: "Faro Airport",
    };

    return `
      <div class="flex flex-col w-full pb-8">
        <!-- Navy Header Accent Block (Checkout is NOT a step: no step number) -->
        <div class="bg-primary-container px-margin pt-3.5 pb-9 text-on-primary">
          <div class="flex items-center justify-between mb-1">
            <button id="screen-d-back" type="button" aria-label="Back to Offer Page 2" class="w-9 h-9 -ml-1 flex items-center justify-start text-on-primary hover:opacity-80">
              <span class="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 class="font-headline-sm text-headline-sm text-on-primary flex-1 text-center">Review your extras</h1>
            <span class="w-9"></span>
          </div>
          <p class="font-body-sm text-body-sm text-on-primary-container text-center">Ryanair · FR1234 • Dublin (DUB) → Faro (FAO)</p>
        </div>

        <div class="-mt-5 bg-surface-page rounded-t-[20px] px-margin pt-5 pb-6 flex flex-col gap-space-md shadow-sm">
          <!-- Lavender Assistant Summary Panel -->
          <div class="bg-surface-ai rounded-xl p-space-md flex items-start gap-space-sm">
            <div class="w-8 h-8 rounded-full bg-[#4B2EDB] flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-on-primary text-[18px]" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-title-md text-title-md text-[#4B2EDB] font-bold leading-tight">Everything is in sync</p>
              <p class="font-body-sm text-body-sm text-text-body mt-0.5">I've linked your selected extras across your family booking X8Y9QL.</p>
            </div>
          </div>

          <!-- Selected Line Items with Inline Remove -->
          <div class="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-md">
            <div class="flex items-center justify-between pb-1">
              <span class="font-label-sm text-label-sm text-pill-next-text bg-pill-next-bg px-2.5 py-1 rounded-full uppercase">Selected Add-ons (${items.length})</span>
              <span class="font-label-md text-label-md text-on-surface-variant">Instant Confirmation</span>
            </div>

            ${
              items.length === 0
                ? `<div class="bg-surface-page rounded-lg p-4 text-center text-body-sm text-text-body">No extras in basket.</div>`
                : items
                    .map(
                      (item) => `
              <div class="bg-surface-page rounded-lg p-space-sm flex items-center justify-between shadow-sm">
                <div class="flex items-center gap-space-sm min-w-0">
                  <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary">
                    <span class="material-symbols-outlined text-[22px]">${
                      iconMap[item.product_id] || "check_circle"
                    }</span>
                  </div>
                  <div class="min-w-0">
                    <p class="font-title-md text-title-md text-text-heading truncate">${item.label}</p>
                    <button type="button" data-remove-id="${item.product_id}" class="remove-line-btn font-label-md text-label-md text-text-body hover:text-error transition-colors flex items-center gap-1 mt-0.5">
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
                <div class="text-right shrink-0 pl-2">
                  <p class="font-title-md text-title-md text-text-heading font-bold">${item.formatted_price}</p>
                  <span class="font-label-sm text-label-sm text-on-surface-variant">${
                    subBadgeMap[item.product_id] || "Included"
                  }</span>
                </div>
              </div>
            `
                    )
                    .join("")
            }
          </div>

          <!-- Total Bar -->
          <div class="bg-surface-container-high rounded-xl p-space-md flex items-center justify-between">
            <div class="flex flex-col">
              <span class="font-label-sm text-label-sm uppercase text-text-body">Total Add-ons Due</span>
              <span class="font-headline-sm text-headline-sm text-text-heading">Total</span>
            </div>
            <div class="text-right">
              <span class="font-headline-lg text-headline-lg text-text-heading tracking-tight">${state.basketData.formatted_total}</span>
              <p class="font-label-sm text-label-sm text-text-body">Taxes &amp; fees included</p>
            </div>
          </div>

          <!-- Saved Payment Method Card (Visa ending 4412) -->
          <div class="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-sm">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm text-text-body uppercase tracking-wider">Payment Method</span>
              <span class="font-label-md text-label-md text-primary font-bold">Saved Card</span>
            </div>
            <div class="bg-surface-page rounded-lg p-space-sm flex items-center justify-between shadow-sm">
              <div class="flex items-center gap-space-sm min-w-0">
                <div class="w-11 h-8 rounded bg-primary flex items-center justify-center shrink-0 shadow-sm text-secondary-fixed">
                  <span class="font-title-md text-title-md font-bold tracking-tighter italic">VISA</span>
                </div>
                <div class="min-w-0">
                  <p class="font-title-md text-title-md text-text-heading truncate">Visa ending 4412</p>
                  <p class="font-body-sm text-body-sm text-text-body">Expires 09/27 • Default card</p>
                </div>
              </div>
              <div class="w-6 h-6 rounded-full bg-pill-done-bg flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-pill-done-text text-[16px]">check</span>
              </div>
            </div>
          </div>

          <!-- Primary Pay CTA -->
          <button id="pay-cta-btn" type="button" class="w-full bg-primary-container hover:bg-primary active:scale-[0.99] text-on-primary py-4 px-margin rounded-full flex items-center justify-center gap-space-sm shadow-md transition-all">
            <span class="material-symbols-outlined text-secondary-fixed text-[22px]">flight_takeoff</span>
            <span class="font-title-md text-title-md font-bold text-on-primary">Pay and get boarding passes</span>
            <span class="material-symbols-outlined text-[20px] text-on-primary">arrow_forward</span>
          </button>
        </div>
      </div>
    `;
  }

  function bindScreenD() {
    const backBtn = document.getElementById("screen-d-back");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        const pageCount =
          (state.sessionData &&
            state.sessionData.pages &&
            state.sessionData.pages.length) ||
          0;
        state.currentScreen = pageCount >= 2 ? "offer_page_2" : "offer_page_1";
        renderCurrentScreen();
      });
    }

    document.querySelectorAll(".remove-line-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const pid = btn.getAttribute("data-remove-id");
        const mutation = await apiFetch(
          `/api/v1/checkin/sessions/${state.sessionId}/actions`,
          {
            method: "POST",
            body: JSON.stringify({
              action: "remove_item",
              current_screen: "review_and_pay",
              product_id: pid,
            }),
          }
        );
        syncMutationResponse(mutation);
        state.currentScreen = mutation.next_screen;
        await refreshAnalytics();
        renderCurrentScreen();
      });
    });

    const payBtn = document.getElementById("pay-cta-btn");
    if (payBtn) {
      payBtn.addEventListener("click", async () => {
        const checkout = await apiFetch(
          `/api/v1/checkin/sessions/${state.sessionId}/checkout`,
          {
            method: "POST",
            body: JSON.stringify({ payment_method_token: "visa_4412" }),
          }
        );
        syncMutationResponse(checkout);
        state.currentScreen = "boarding_passes";
        await refreshAnalytics();
        renderCurrentScreen();
      });
    }
  }

  /* ==========================================================================
   * SCREEN C — Zero-Offer State ("1 STEP", Full Greeting Header, Sanitized Flight Card)
   * ========================================================================== */
  function renderScreenC() {
    const panel = (state.sessionData && state.sessionData.zero_offer_panel) || {
      heading: "You're all set",
      supporting_text: "Nothing else to add for this trip.",
    };

    return `
      <div class="flex flex-col w-full pb-8">
        <!-- Full Greeting Header (Entry Screen Rule) -->
        <header class="w-full bg-primary-container text-on-primary pt-4 rounded-b-[24px] shadow-md">
          <div class="h-12 px-margin flex items-center justify-between">
            <div class="flex items-center gap-space-sm">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center bg-primary text-[#F1C933]">
                <span class="material-symbols-outlined text-[22px]">flight</span>
              </div>
              <span class="font-title-md text-title-md text-on-primary font-semibold">Home</span>
            </div>
            <div class="flex items-center gap-space-sm">
              <button aria-label="Notifications" type="button" class="w-9 h-9 flex items-center justify-center text-on-primary">
                <span class="material-symbols-outlined text-[22px]">notifications</span>
              </button>
              <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center ring-2 ring-secondary-fixed text-on-primary font-bold text-xs">MB</div>
            </div>
          </div>
          <div class="px-margin pt-2 pb-6 flex flex-col">
            <h1 class="font-headline-lg text-[28px] font-bold text-on-primary tracking-tight leading-tight">Hi Marta,</h1>
            <p class="font-body-md text-on-primary/80 mt-1">You're all set to fly</p>
          </div>
        </header>

        <div class="flex flex-col w-full px-margin pt-space-md space-y-space-xl">
          <!-- "1 STEP" Overline Pill -->
          <div class="inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full bg-pill-next-bg">
            <span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary-container font-bold">1 STEP</span>
          </div>

          <!-- Flight Entity Card (Sanitized: contradictory single-seat chip removed) -->
          <div class="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-border-hairline">
            <div class="flex items-start justify-between gap-space-sm">
              <div class="flex items-center gap-space-sm">
                <div class="w-11 h-11 rounded-lg bg-surface-container-low flex items-center justify-center text-primary-container flex-shrink-0">
                  <span class="material-symbols-outlined text-[24px]">flight_takeoff</span>
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="font-title-md text-title-md text-text-heading font-semibold tracking-tight truncate">Dublin → Faro</span>
                  <span class="font-body-sm text-body-sm text-text-body truncate">Tue 14 Oct · FR1234 · 06:35</span>
                </div>
              </div>
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pill-done-bg text-pill-done-text font-label-md text-label-md font-semibold flex-shrink-0">
                <span class="w-1.5 h-1.5 rounded-full bg-pill-done-text"></span>
                Ready
              </span>
            </div>
            <div class="mt-space-md pt-space-sm border-t border-border-hairline flex items-center justify-between text-body-sm text-text-body">
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-text-body text-[16px]">schedule</span>
                <span class="font-body-sm">Terminal 1 · Gate 104 · Gate closes 06:05</span>
              </div>
              <span class="font-label-md text-label-md text-text-body">4 passengers</span>
            </div>
          </div>

          <!-- Lavender Assistant Panel ("You're all set" / "Nothing else to add for this trip.") -->
          <div class="w-full rounded-[18px] bg-surface-ai p-space-lg shadow-sm flex flex-col space-y-space-md">
            <div class="flex items-start gap-3.5">
              <div class="w-10 h-10 rounded-full bg-[#4B2EDB] flex items-center justify-center text-on-primary flex-shrink-0 shadow-sm">
                <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
              </div>
              <div class="flex flex-col pt-0.5">
                <h2 class="font-headline-sm text-[19px] leading-tight text-[#4B2EDB] font-bold">${panel.heading}</h2>
                <p class="font-body-md text-body-md text-text-body mt-1">${panel.supporting_text}</p>
              </div>
            </div>
            <div class="bg-surface-page rounded-xl p-3.5 flex items-center justify-between shadow-xs">
              <div class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-pill-done-text text-[20px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                <span class="font-body-sm text-body-sm text-text-heading font-medium">Passenger details &amp; documents verified</span>
              </div>
              <span class="font-label-sm text-label-sm text-text-body uppercase font-bold">Synced</span>
            </div>
          </div>

          <!-- Get Boarding Passes CTA -->
          <div class="w-full pt-space-sm">
            <button id="zero-offer-passes-btn" type="button" class="w-full py-3.5 px-6 rounded-full bg-primary-container hover:bg-primary text-on-primary font-title-md text-title-md font-semibold flex items-center justify-center gap-2 shadow-sm transition-all">
              <span>Get boarding passes</span>
              <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function bindScreenC() {
    const btn = document.getElementById("zero-offer-passes-btn");
    if (btn) {
      btn.addEventListener("click", async () => {
        const checkout = await apiFetch(
          `/api/v1/checkin/sessions/${state.sessionId}/checkout`,
          {
            method: "POST",
            body: JSON.stringify({ payment_method_token: "visa_4412" }),
          }
        );
        syncMutationResponse(checkout);
        state.currentScreen = "boarding_passes";
        await refreshAnalytics();
        renderCurrentScreen();
      });
    }
  }

  /* ==========================================================================
   * SCREEN G — Boarding Passes (Swipeable Stack of 4 Passes with Dynamic Badges)
   * ========================================================================== */
  function renderScreenG() {
    const passes =
      state.boardingPasses && state.boardingPasses.length === 4
        ? state.boardingPasses
        : [
            {
              pass_index: 1,
              passenger_name: "Marta Byrne",
              seat: isProductSelected("reserved_seats") ? "12A" : null,
              badges: [
                ...(isProductSelected("priority_boarding") ? ["PRIORITY"] : []),
                ...(isProductSelected("reserved_seats") ? ["12A"] : []),
              ],
            },
            {
              pass_index: 2,
              passenger_name: "Declan Byrne",
              seat: isProductSelected("reserved_seats") ? "12B" : null,
              badges: [
                ...(isProductSelected("priority_boarding") ? ["PRIORITY"] : []),
                ...(isProductSelected("reserved_seats") ? ["12B"] : []),
              ],
            },
            {
              pass_index: 3,
              passenger_name: "Fia Byrne",
              seat: isProductSelected("reserved_seats") ? "12C" : null,
              badges: [
                ...(isProductSelected("priority_boarding") ? ["PRIORITY"] : []),
                ...(isProductSelected("reserved_seats") ? ["12C"] : []),
              ],
            },
            {
              pass_index: 4,
              passenger_name: "Oisín Byrne",
              seat: isProductSelected("reserved_seats") ? "12D" : null,
              badges: [
                ...(isProductSelected("priority_boarding") ? ["PRIORITY"] : []),
                ...(isProductSelected("reserved_seats") ? ["12D"] : []),
              ],
            },
          ];

    const idx = state.activePassIndex % passes.length;
    const activePass = passes[idx];
    const hasPriority = activePass.badges.includes("PRIORITY");
    const seatLabel = activePass.seat ? `Seat ${activePass.seat}` : "Seat at Gate";

    return `
      <div class="flex flex-col w-full pb-8">
        <!-- Compact Navy Header (Boarding Passes: no step number) -->
        <div class="bg-primary-container text-on-primary rounded-b-3xl px-margin pt-4 pb-10 relative overflow-hidden shadow-sm">
          <div class="relative z-10 flex flex-col gap-space-xs">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary-fixed">Family Booking · PNR: X8Y9QL</span>
              <span class="bg-pill-done-bg text-pill-done-text px-2.5 py-0.5 rounded-full font-label-md text-label-md font-semibold">Gate 104</span>
            </div>
            <h1 class="font-headline-sm text-headline-sm text-on-primary tracking-tight mt-1">Boarding passes</h1>
            <p class="font-body-sm text-body-sm text-primary-fixed">DUB → FAO · Flight FR1234 · Departs 06:35 (Boarding 05:55)</p>
          </div>
        </div>

        <!-- Swipeable Stack of 4 Passes -->
        <div class="px-margin -mt-6 relative z-20 flex flex-col items-center">
          <div class="w-full rounded-2xl bg-surface-page shadow-md border border-border-hairline overflow-hidden flex flex-col justify-between">
            <div class="p-space-lg flex flex-col gap-space-sm bg-gradient-to-b from-surface-ai/40 to-transparent">
              <!-- Earned Ancillary Badges -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5 flex-wrap">
                  ${
                    hasPriority
                      ? `<span class="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">PRIORITY</span>`
                      : `<span class="bg-surface-container-high text-text-body font-label-sm text-label-sm px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">STANDARD</span>`
                  }
                  <span class="bg-primary text-on-primary font-label-sm text-label-sm px-2.5 py-1 rounded-full font-bold">${
                    activePass.seat || "FREE ALLOCATION"
                  }</span>
                </div>
                <span class="font-label-md text-text-body font-semibold">${
                  idx + 1
                } of 4</span>
              </div>

              <!-- Passenger Name -->
              <div>
                <span class="font-label-sm text-label-sm uppercase tracking-wider text-text-body">Passenger</span>
                <h2 class="font-headline-sm text-headline-sm text-text-heading mt-0.5">${
                  activePass.passenger_name
                }</h2>
              </div>

              <!-- Route Info -->
              <div class="flex items-center justify-between pt-1">
                <div>
                  <div class="font-headline-lg text-headline-lg text-primary leading-none">DUB</div>
                  <div class="font-label-md text-label-md text-text-body mt-1">Dublin T1</div>
                </div>
                <div class="flex-1 flex flex-col items-center px-4">
                  <span class="font-label-sm text-label-sm text-text-body mb-1">FR1234</span>
                  <div class="w-full h-0.5 bg-surface-variant relative"></div>
                  <span class="font-label-sm text-label-sm text-pill-next-text font-bold mt-1">06:35</span>
                </div>
                <div class="text-right">
                  <div class="font-headline-lg text-headline-lg text-primary leading-none">FAO</div>
                  <div class="font-label-md text-label-md text-text-body mt-1">Faro</div>
                </div>
              </div>

              <!-- Operational Meta Grid -->
              <div class="grid grid-cols-3 gap-2 pt-2 bg-surface-container-low rounded-xl p-2.5 mt-1">
                <div>
                  <span class="font-label-sm text-text-body block">Seat</span>
                  <span class="font-title-md text-text-heading font-bold">${seatLabel}</span>
                </div>
                <div class="text-center">
                  <span class="font-label-sm text-text-body block">Boarding</span>
                  <span class="font-title-md text-pill-review-text font-bold">05:55</span>
                </div>
                <div class="text-right">
                  <span class="font-label-sm text-text-body block">Gate closes</span>
                  <span class="font-title-md text-primary font-bold">06:05</span>
                </div>
              </div>
            </div>

            <!-- QR Code Stub -->
            <div class="px-space-lg pb-space-lg pt-3 border-t border-dashed border-outline-variant/60 flex flex-col items-center bg-surface-page">
              <svg class="w-28 h-28" fill="none" viewBox="0 0 100 100">
                <rect fill="#FFFFFF" height="100" width="100"></rect>
                <rect fill="#002164" height="28" rx="3" width="28" x="5" y="5"></rect>
                <rect fill="#FFFFFF" height="20" width="20" x="9" y="9"></rect>
                <rect fill="#002164" height="12" width="12" x="13" y="13"></rect>
                <rect fill="#002164" height="28" rx="3" width="28" x="67" y="5"></rect>
                <rect fill="#FFFFFF" height="20" width="20" x="71" y="9"></rect>
                <rect fill="#002164" height="12" width="12" x="75" y="13"></rect>
                <rect fill="#002164" height="28" rx="3" width="28" x="5" y="67"></rect>
                <rect fill="#FFFFFF" height="20" width="20" x="9" y="71"></rect>
                <rect fill="#002164" height="12" width="12" x="13" y="75"></rect>
                <rect fill="#002164" height="24" rx="2" width="24" x="38" y="38"></rect>
                <rect fill="#FFFFFF" height="12" width="12" x="44" y="44"></rect>
                <rect fill="#002164" height="4" width="4" x="48" y="48"></rect>
                <rect fill="#002164" height="10" width="12" x="68" y="72"></rect>
                <rect fill="#002164" height="8" width="16" x="40" y="76"></rect>
              </svg>
              <span class="font-label-sm text-text-body mt-1">Scan at Gate 104 · PNR X8Y9QL</span>
            </div>
          </div>

          <!-- Pass Switcher Controls (1 of 4) -->
          <div class="flex flex-col items-center gap-2 mt-3">
            <div class="flex items-center gap-1.5">
              ${passes
                .map(
                  (_, i) =>
                    `<span class="${
                      i === idx
                        ? "w-6 h-2 rounded-full bg-primary"
                        : "w-2 h-2 rounded-full bg-outline-variant/60"
                    } transition-all"></span>`
                )
                .join("")}
            </div>
            <div class="flex items-center gap-3">
              <button id="prev-pass-btn" type="button" class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-text-heading">
                <span class="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span class="font-label-md text-text-heading font-semibold">${
                idx + 1
              } of 4 · ${activePass.passenger_name}</span>
              <button id="next-pass-btn" type="button" class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-text-heading">
                <span class="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Wallet CTA & Manage Extras Link -->
        <div class="px-margin mt-space-lg flex flex-col gap-space-sm">
          <button id="apple-wallet-btn" type="button" class="w-full py-3.5 px-space-md rounded-full border-[1.5px] border-primary-container text-primary-container font-title-md text-title-md font-semibold flex items-center justify-center gap-2 hover:bg-primary-container/5 transition-all">
            <span class="material-symbols-outlined text-[20px]">wallet</span>
            <span>Add all to Apple Wallet</span>
          </button>
          <div class="text-center pt-1">
            <button id="manage-extras-link" type="button" class="font-body-sm text-body-sm text-text-body hover:text-primary transition-colors inline-flex items-center gap-1">
              <span>Changed your mind?</span>
              <span class="underline font-semibold text-text-heading">Manage extras</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function bindScreenG() {
    const prevBtn = document.getElementById("prev-pass-btn");
    const nextBtn = document.getElementById("next-pass-btn");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        state.activePassIndex = (state.activePassIndex + 3) % 4;
        renderCurrentScreen();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        state.activePassIndex = (state.activePassIndex + 1) % 4;
        renderCurrentScreen();
      });
    }
    const walletBtn = document.getElementById("apple-wallet-btn");
    if (walletBtn) {
      walletBtn.addEventListener("click", () => {
        showToast(
          "Added 4 boarding passes (Marta, Declan, Fia, Oisín) to Apple Wallet."
        );
      });
    }
    const manageLink = document.getElementById("manage-extras-link");
    if (manageLink) {
      manageLink.addEventListener("click", () => {
        state.currentScreen =
          state.basketData.items.length > 0 ? "review_and_pay" : "offer_page_1";
        renderCurrentScreen();
      });
    }
  }

  /* ==========================================================================
   * SCREEN 10 — Companion Analytics & Propensity Studio Renderer
   * ========================================================================== */
  function renderStudioAnalytics() {
    const a = state.analyticsData;
    const s = state.sessionData;
    if (!a) return;

    const countersEl = document.getElementById("live-counters-strip");
    if (countersEl && a.live_session_counters) {
      const c = a.live_session_counters;
      countersEl.innerHTML = `
        <span class="px-2.5 py-1 rounded-full bg-surface-container-low font-semibold text-text-heading">Sessions: ${c.total_sessions_created}</span>
        <span class="px-2.5 py-1 rounded-full bg-pill-done-bg text-pill-done-text font-bold">Live Revenue: €${c.total_ancillary_revenue_eur.toFixed(2)}</span>
      `;
    }

    const kpiGrid = document.getElementById("kpi-tiles-grid");
    if (kpiGrid && a.kpi_tiles) {
      kpiGrid.innerHTML = a.kpi_tiles
        .map(
          (tile) => `
          <div class="rounded-xl p-3.5 bg-surface-container-low/70 border border-border-hairline flex flex-col justify-between">
            <span class="text-[11px] font-semibold text-text-body">${tile.label}</span>
            <div class="text-2xl font-bold text-text-heading mt-1">${tile.value}</div>
            <span class="text-[11px] font-bold text-pill-done-text mt-1">${tile.delta_label}</span>
          </div>
        `
        )
        .join("");
    }

    const tableBody = document.getElementById("propensity-table-body");
    if (tableBody && s && s.ranked_ancillaries) {
      tableBody.innerHTML = s.ranked_ancillaries
        .map((item) => {
          let badgeHtml = "";
          if (item.placement === "primary_card") {
            badgeHtml = `<span class="px-2 py-0.5 rounded-full bg-pill-done-bg text-pill-done-text font-bold">Promoted · Primary Card</span>`;
          } else if (item.placement === "drawer") {
            badgeHtml = `<span class="px-2 py-0.5 rounded-full bg-pill-review-bg text-pill-review-text font-bold">Demoted · "More extras" Drawer</span>`;
          } else {
            badgeHtml = `<span class="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-semibold">Removed (${item.removal_rule})</span>`;
          }
          return `
            <tr class="${item.eligible ? "bg-white" : "bg-surface-container-low/40 text-text-body/70"}">
              <td class="py-2 px-3 font-bold text-text-heading">#${item.rank}</td>
              <td class="py-2 px-3 font-semibold text-text-heading">${item.title}</td>
              <td class="py-2 px-3 font-mono font-bold text-primary-container">${item.score.toFixed(2)}</td>
              <td class="py-2 px-3">${item.top_driver}</td>
              <td class="py-2 px-3">${badgeHtml}</td>
            </tr>
          `;
        })
        .join("");
    }

    const takeupEl = document.getElementById("takeup-bars");
    if (takeupEl && a.takeup_by_ancillary) {
      takeupEl.innerHTML = a.takeup_by_ancillary
        .map(
          (row) => `
          <div class="p-3 rounded-xl bg-surface-container-low/50 border border-border-hairline flex flex-col gap-1.5 text-xs">
            <div class="flex justify-between font-semibold text-text-heading">
              <span>${row.title}</span>
              <span class="text-primary-container font-bold">${row.dynamic_conversion_pct}% vs ${row.static_baseline_pct}% static</span>
            </div>
            <div class="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
              <div class="h-full bg-primary-container rounded-full" style="width: ${Math.min(100, row.dynamic_conversion_pct * 1.8)}%"></div>
            </div>
          </div>
        `
        )
        .join("");
    }
  }

  /* ==========================================================================
   * Global Studio & Navigation Bindings
   * ========================================================================== */
  function bindGlobalControls() {
    const toggleStudioBtn = document.getElementById("toggle-studio-btn");
    const studioPanel = document.getElementById("studio-panel");
    if (toggleStudioBtn && studioPanel) {
      toggleStudioBtn.addEventListener("click", () => {
        studioPanel.classList.toggle("hidden");
      });
    }

    document.querySelectorAll(".jump-btn, .nav-tab-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const target = btn.getAttribute("data-jump");
        if (!target) return;
        if (target === "seat_map" && !state.seatMapData) {
          state.seatMapData = await apiFetch(
            `/api/v1/checkin/sessions/${state.sessionId}/seat-map`
          );
        }
        state.currentScreen = target;
        renderCurrentScreen();
      });
    });

    const supportBtn = document.getElementById("nav-support-btn");
    if (supportBtn) {
      supportBtn.addEventListener("click", () => {
        showToast(
          "App 2026 Help Hub · Booking X8Y9QL (DUB → FAO, FR1234) is on schedule."
        );
      });
    }

    document.querySelectorAll(".persona-preset-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const preset = btn.getAttribute("data-persona");
        document.querySelectorAll(".persona-preset-btn").forEach((b) => {
          b.className =
            b.getAttribute("data-persona") === preset
              ? "persona-preset-btn px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary-container text-white shadow-xs transition-all"
              : "persona-preset-btn px-3.5 py-1.5 rounded-full text-xs font-bold bg-surface-container-low text-text-heading hover:bg-surface-container-high transition-all";
        });
        await initSession(preset, null);
      });
    });

    const pSlider = document.getElementById("sig-prior-priority");
    const cSlider = document.getElementById("sig-children");
    const nSlider = document.getElementById("sig-nights");
    if (pSlider) {
      pSlider.addEventListener("input", () => {
        document.getElementById("val-prior-priority").textContent =
          `${pSlider.value} / 4`;
      });
    }
    if (cSlider) {
      cSlider.addEventListener("input", () => {
        document.getElementById("val-children").textContent =
          `${cSlider.value} kids`;
      });
    }
    if (nSlider) {
      nSlider.addEventListener("input", () => {
        document.getElementById("val-nights").textContent =
          `${nSlider.value} nights`;
      });
    }

    const applyBtn = document.getElementById("apply-signals-btn");
    if (applyBtn) {
      applyBtn.addEventListener("click", async () => {
        const overrides = {
          prior_priority_trips: parseInt(pSlider.value, 10),
          children_count: parseInt(cSlider.value, 10),
          trip_nights: parseInt(nSlider.value, 10),
          force_zero_offer: false,
        };
        await initSession("marta_byrne", overrides);
        showToast(
          `Re-scored 8 ancillaries → ${state.sessionData.entry_step_pill}`
        );
      });
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    bindGlobalControls();
    await initSession("marta_byrne", null);
  });
})();
