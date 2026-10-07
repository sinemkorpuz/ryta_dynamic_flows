/**
 * Ryanair Dynamic Ancillary Flows — Grounded Client State Machine & Stitch Screen Renderer
 * Dynamically binds imported Stitch screens (E, A, F, B, D, C, G + Screen 10) to the ADK/FastAPI backend.
 */
(function () {
  "use strict";

  const state = {
    sessionId: null,
    personaId: "marta_byrne",
    currentScreen: "checkin_start",
    sessionData: null,
    seatMapData: null,
    selectedSeats: ["12A", "12B", "12C", "12D"],
    helpHubResponse: null,
    helpHubLoading: false,
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

  const DOC_NUMBERS = {
    "pax-1": "IRL •••• 9821",
    "pax-2": "IRL •••• 4120",
    "pax-3": "IRL •••• 7731",
    "pax-4": "IRL •••• 6614",
  };

  const ICON_MATERIAL_MAP = {
    bag: "luggage",
    seat: "airline_seat_recline_extra",
    suitcase: "luggage",
    car: "directions_car",
    bolt: "bolt",
    shield: "verified_user",
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
    }, 3400);
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
    state.helpHubResponse = null;
    state.seatMapData = null;

    const session = await apiFetch("/api/v1/checkin/sessions", {
      method: "POST",
      body: JSON.stringify({
        persona_id: state.personaId,
        signal_overrides: signalOverrides || null,
      }),
    });

    state.sessionId = session.session_id;
    state.sessionData = session;
    state.selectedSeats = ["12A", "12B", "12C", "12D"];
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

  function formatChildAgeBadge(passenger) {
    if (passenger.age === 6) return "Child (6y)";
    if (passenger.age === 9) return "Child (9y)";
    return `Child (${passenger.age}y)`;
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
        viewport.innerHTML = renderOfferPage(0);
        bindOfferPage(0);
        break;
      case "seat_map":
        viewport.innerHTML = renderScreenF();
        bindScreenF();
        break;
      case "offer_page_2":
        viewport.innerHTML = renderOfferPage(1);
        bindOfferPage(1);
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
   * SCREEN E — Check-in Start (Grounded in sessionData.booking, passengers & ADK /assist)
   * ========================================================================== */
  function renderScreenE() {
    const s = state.sessionData;
    const booking = s.booking || {};
    const passengers = s.passengers || [];
    const lead =
      passengers.find((p) => p.is_lead_booker) ||
      passengers[0] || { full_name: "Marta Byrne", initials: "MB" };
    const leadFirstName = (lead.full_name || "Marta").split(" ")[0];
    const stepPillText = s.entry_step_pill || "2 STEPS TO YOUR BOARDING PASSES";
    const isZero = s.flow_branch === "zero_offer";

    return `
      <div class="flex flex-col w-full pb-6">
        <!-- Navy Header Sheet Block (Full Greeting Header) -->
        <div class="bg-primary-container px-margin pt-4 rounded-b-3xl shadow-sm text-on-primary relative overflow-hidden pb-7">
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
                ${lead.initials || "MB"}
              </div>
            </div>
          </div>
          <div class="relative z-10 pt-1">
            <h1 class="font-headline-lg text-headline-lg text-on-primary tracking-tight font-bold">Hi ${leadFirstName},</h1>
            <p class="font-body-md text-body-md text-on-primary/80 mt-0.5">Let's get you checked in</p>

            <!-- Live ADK Help Hub Search Bar -->
            <div class="bg-surface-page rounded-full px-4 py-2.5 flex items-center justify-between shadow-sm mt-4 text-text-body">
              <div class="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
                <span class="material-symbols-outlined text-[20px] text-text-heading flex-shrink-0">search</span>
                <input id="help-hub-input" type="text" value="${
                  state.helpHubResponse ? state.helpHubResponse.query : ""
                }" placeholder="Ask or search for help with this trip" class="w-full bg-transparent outline-none font-body-sm text-body-sm text-text-heading placeholder:text-text-body truncate" />
              </div>
              <button id="help-hub-submit" type="button" aria-label="Ask Assistant" class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-text-heading flex-shrink-0 transition-colors hover:bg-surface-variant">
                <span class="material-symbols-outlined text-[18px]">${
                  state.helpHubLoading ? "hourglass_top" : "arrow_forward"
                }</span>
              </button>
            </div>

            <!-- Quick-Ask Grounded & ADK Simulation Chips -->
            <div class="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
              <button type="button" data-quick-ask="Sitting with children?" class="quick-ask-chip px-2.5 py-1 rounded-full bg-on-primary/10 hover:bg-on-primary/20 text-[11px] font-medium text-on-primary whitespace-nowrap transition-colors">Sitting with children?</button>
              <button type="button" data-quick-ask="Cabin & 20kg bag rules?" class="quick-ask-chip px-2.5 py-1 rounded-full bg-on-primary/10 hover:bg-on-primary/20 text-[11px] font-medium text-on-primary whitespace-nowrap transition-colors">Cabin &amp; 20kg bags?</button>
              <button type="button" data-quick-ask="What if I travel solo for 1 night?" class="quick-ask-chip px-2.5 py-1 rounded-full bg-secondary-container/90 hover:bg-secondary-container text-[11px] font-bold text-on-secondary-fixed whitespace-nowrap transition-colors">⚡ Solo 1-night?</button>
              <button type="button" data-quick-ask="Add Priority boarding for all 4" class="quick-ask-chip px-2.5 py-1 rounded-full bg-on-primary/10 hover:bg-on-primary/20 text-[11px] font-medium text-on-primary whitespace-nowrap transition-colors">+ Add Priority</button>
              <button type="button" data-quick-ask="Gate & departure info?" class="quick-ask-chip px-2.5 py-1 rounded-full bg-on-primary/10 hover:bg-on-primary/20 text-[11px] font-medium text-on-primary whitespace-nowrap transition-colors">Gate &amp; terminal?</button>
            </div>
          </div>
        </div>

        <!-- Content Body Container -->
        <div class="px-margin flex flex-col gap-space-lg -mt-3 relative z-20">
          ${
            state.helpHubResponse
              ? `
          <!-- Grounded ADK Help Hub Response Card (surface/ai #F2F1FE) -->
          <div class="rounded-[18px] bg-surface-ai p-3.5 shadow-sm border border-[#4B2EDB]/15 flex flex-col gap-2">
            <div class="flex items-start justify-between gap-2.5">
              <div class="flex items-start gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-full bg-[#4B2EDB] flex items-center justify-center text-on-primary shrink-0 mt-0.5">
                  <span class="material-symbols-outlined text-[17px]" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="font-title-md text-title-md text-[#4B2EDB] font-bold">${state.helpHubResponse.heading}</span>
                  <p class="font-body-sm text-body-sm text-text-body mt-0.5">${state.helpHubResponse.supporting_text}</p>
                </div>
              </div>
              <button id="close-help-hub-card" type="button" aria-label="Dismiss" class="text-text-body hover:text-text-heading p-1">
                <span class="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div class="flex items-center justify-between flex-wrap gap-1.5 pt-1.5 border-t border-[#4B2EDB]/10 text-[10px]">
              <div class="flex items-center gap-1 flex-wrap">
                <span class="px-2 py-0.5 rounded-full bg-[#4B2EDB]/10 text-[#4B2EDB] font-bold">ADK · ${
                  typeof state.helpHubResponse.latency_ms === "number"
                    ? `${state.helpHubResponse.latency_ms.toFixed(1)}ms`
                    : "Live"
                }</span>
                ${(state.helpHubResponse.invoked_tools || [])
                  .map(
                    (t) =>
                      `<span class="px-2 py-0.5 rounded-full bg-white text-primary-container font-mono font-semibold border border-border-hairline">${t}()</span>`
                  )
                  .join("")}
              </div>
              <span class="text-pill-done-text font-bold">✓ Guardrail ${
                state.helpHubResponse.guardrail_status || "PASS"
              }</span>
            </div>
          </div>
          `
              : ""
          }

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

          <!-- Flight Entity Card (Grounded in sessionData.booking) -->
          <div class="bg-surface-page rounded-xl p-4 shadow-sm border border-border-hairline relative">
            <div class="flex items-start justify-between gap-space-sm mb-3">
              <div class="flex items-center gap-space-sm">
                <div class="w-10 h-10 rounded-xl bg-pill-next-bg flex items-center justify-center text-primary-container">
                  <span class="material-symbols-outlined text-[22px]">flight_takeoff</span>
                </div>
                <div>
                  <h2 class="font-title-md text-title-md text-text-heading font-semibold">${booking.origin_name || "Dublin"} → ${booking.destination_name || "Faro"}</h2>
                  <p class="font-body-sm text-body-sm text-text-body">${booking.departure_date_label || "Tue 14 Oct"} · ${booking.flight_number || "FR1234"} · ${booking.departure_time || "06:35"}</p>
                </div>
              </div>
              <span class="inline-flex items-center px-2.5 py-1 rounded-full font-label-md text-label-md bg-secondary-container text-on-secondary-fixed font-bold shadow-xs">
                ${booking.status_badge || "Check-in open"}
              </span>
            </div>
            <div class="bg-surface-container-low rounded-lg p-3 flex items-center justify-between text-center mt-2">
              <div class="text-left">
                <span class="font-headline-sm text-headline-sm text-text-heading leading-none block">${booking.origin_code || "DUB"}</span>
                <span class="font-label-sm text-label-sm text-text-body block mt-0.5">${booking.origin_terminal || "Terminal 1"} · Gate ${booking.gate || "104"}</span>
              </div>
              <div class="flex-1 px-3 flex flex-col items-center">
                <span class="font-label-sm text-label-sm text-text-body mb-1">2h 55m · ${booking.trip_nights || 7} nights</span>
                <div class="w-full flex items-center gap-1">
                  <div class="w-2 h-2 rounded-full bg-primary-container"></div>
                  <div class="flex-1 h-0.5 bg-outline-variant/60 relative">
                    <span class="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-container text-[14px]">airplanemode_active</span>
                  </div>
                  <div class="w-2 h-2 rounded-full bg-primary-container"></div>
                </div>
                <span class="font-label-sm text-label-sm text-pill-done-text font-bold mt-1">PNR ${booking.booking_reference || "X8Y9QL"}</span>
              </div>
              <div class="text-right">
                <span class="font-headline-sm text-headline-sm text-text-heading leading-none block">${booking.destination_code || "FAO"}</span>
                <span class="font-label-sm text-label-sm text-text-body block mt-0.5">Main Terminal</span>
              </div>
            </div>
          </div>

          <!-- Passenger Roster Section (Grounded in sessionData.passengers with Child (6y) & Child (9y) badges) -->
          <div class="flex flex-col gap-space-sm">
            <div class="flex items-center justify-between px-1">
              <span class="font-label-sm text-label-sm text-primary font-bold tracking-wider uppercase">${passengers.length} Passengers</span>
              <span class="font-label-sm text-label-sm text-pill-done-text flex items-center gap-1 font-semibold">
                <span class="material-symbols-outlined text-[15px]" style="font-variation-settings: 'FILL' 1;">verified</span>
                Passports on file
              </span>
            </div>
            <div class="bg-surface-page rounded-xl shadow-sm border border-border-hairline overflow-hidden divide-y divide-border-hairline">
              ${passengers
                .map((p) => {
                  const isChild = p.passenger_type === "child";
                  const cleanName = (p.display_name || p.full_name || "").split(" · ")[0];
                  const docMask = DOC_NUMBERS[p.passenger_id] || "IRL •••• 9821";
                  return `
              <div class="p-3.5 flex items-center justify-between">
                <div class="flex items-center gap-space-sm min-w-0">
                  <div class="w-10 h-10 rounded-full ${
                    isChild
                      ? "bg-secondary-fixed/40 text-on-secondary-fixed"
                      : "bg-pill-next-bg text-pill-next-text"
                  } flex items-center justify-center font-title-md text-title-md font-bold flex-shrink-0">${p.initials}</div>
                  <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="font-title-md text-title-md text-text-heading font-semibold truncate">${cleanName}</span>
                      ${
                        p.is_lead_booker
                          ? `<span class="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">Lead Booker</span>`
                          : ""
                      }
                      ${
                        isChild
                          ? `<span class="bg-pill-plan-bg text-pill-plan-text font-label-sm text-label-sm px-1.5 py-0.5 rounded font-bold">${formatChildAgeBadge(p)}</span>`
                          : ""
                      }
                    </div>
                    <span class="font-body-sm text-body-sm text-text-body flex items-center gap-1 mt-0.5">
                      <span class="material-symbols-outlined text-[14px] text-pill-done-text">check_circle</span>
                      Document verified · ${docMask}
                    </span>
                  </div>
                </div>
              </div>
                  `;
                })
                .join("")}
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

  function syncSignalsToStudioControls(signals) {
    if (!signals) return;
    const pSlider = document.getElementById("sig-prior-priority");
    const cSlider = document.getElementById("sig-children");
    const nSlider = document.getElementById("sig-nights");
    if (pSlider && typeof signals.prior_priority_trips === "number") {
      pSlider.value = String(signals.prior_priority_trips);
      const valEl = document.getElementById("val-prior-priority");
      if (valEl) valEl.textContent = `${signals.prior_priority_trips} / 4`;
    }
    if (cSlider && typeof signals.children_count === "number") {
      cSlider.value = String(signals.children_count);
      const valEl = document.getElementById("val-children");
      if (valEl) valEl.textContent = `${signals.children_count} kids`;
    }
    if (nSlider && typeof signals.trip_nights === "number") {
      nSlider.value = String(signals.trip_nights);
      const valEl = document.getElementById("val-nights");
      if (valEl) valEl.textContent = `${signals.trip_nights} nights`;
    }
    if (signals.persona_id) {
      state.personaId = signals.persona_id;
      document.querySelectorAll(".persona-preset-btn").forEach((b) => {
        b.className =
          b.getAttribute("data-persona") === signals.persona_id
            ? "persona-preset-btn px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary-container text-white shadow-xs transition-all"
            : "persona-preset-btn px-3.5 py-1.5 rounded-full text-xs font-bold bg-surface-container-low text-text-heading hover:bg-surface-container-high transition-all";
      });
    }
  }

  async function submitHelpHubQuery(rawQuery) {
    const q = (rawQuery || "").trim() || "Tell me about this flight and seating";
    state.helpHubLoading = true;
    renderCurrentScreen();
    try {
      const res = await apiFetch(
        `/api/v1/checkin/sessions/${state.sessionId}/assist`,
        {
          method: "POST",
          body: JSON.stringify({ query: q }),
        }
      );
      state.helpHubResponse = res;
      if (res.session) {
        state.sessionData = res.session;
      }
      if (res.basket) {
        state.basketData = res.basket;
      }
      if (res.signals) {
        syncSignalsToStudioControls(res.signals);
      }
      const latencyBadge = document.getElementById("latency-badge");
      if (latencyBadge && typeof res.latency_ms === "number") {
        latencyBadge.textContent = `ADK Assist · ${res.latency_ms.toFixed(1)}ms`;
      }
      await refreshAnalytics();
      if (res.state_mutated) {
        showToast(`ADK updated simulation: ${res.heading}`);
      }
    } catch (err) {
      showToast(`Help Hub error: ${err.message}`);
    } finally {
      state.helpHubLoading = false;
      renderCurrentScreen();
      renderStudioAnalytics();
    }
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
        }, 340);
      });
    }

    const helpInput = document.getElementById("help-hub-input");
    const helpBtn = document.getElementById("help-hub-submit");
    if (helpBtn) {
      helpBtn.addEventListener("click", () => {
        submitHelpHubQuery(helpInput ? helpInput.value : "");
      });
    }
    if (helpInput) {
      helpInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitHelpHubQuery(helpInput.value);
        }
      });
    }

    document.querySelectorAll(".quick-ask-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const q = chip.getAttribute("data-quick-ask");
        submitHelpHubQuery(q);
      });
    });

    const closeCardBtn = document.getElementById("close-help-hub-card");
    if (closeCardBtn) {
      closeCardBtn.addEventListener("click", () => {
        state.helpHubResponse = null;
        renderCurrentScreen();
      });
    }
  }

  /* ==========================================================================
   * SCREEN 2 (Transient) — "Getting your trip ready." Skeleton State
   * ========================================================================== */
  function renderScreenLoading() {
    const booking = (state.sessionData && state.sessionData.booking) || {};
    return `
      <div class="flex-1 flex flex-col items-center justify-center px-margin py-16 text-center gap-4">
        <div class="w-12 h-12 rounded-full bg-surface-ai flex items-center justify-center text-[#4B2EDB] animate-pulse">
          <span class="material-symbols-outlined text-[26px]">flight_takeoff</span>
        </div>
        <div>
          <p class="font-title-md text-text-heading font-semibold">Getting your trip ready.</p>
          <p class="font-body-sm text-text-body mt-1">${booking.origin_name || "Dublin"} → ${booking.destination_name || "Faro"} · ${booking.flight_number || "FR1234"}</p>
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
   * SCREENS A & B — Dynamic Offer Pages 1 & 2 (Grounded in sessionData.pages[pageIndex])
   * ========================================================================== */
  function renderDynamicOfferCard(card) {
    const pid = card.product_id;
    const selected = isProductSelected(pid);
    const qty = getProductQuantity(pid);
    const iconName = ICON_MATERIAL_MAP[card.icon] || "luggage";
    const pillClass =
      card.status_pill_token === "pill/review"
        ? "bg-pill-review-bg text-pill-review-text"
        : card.status_pill_token === "pill/plan"
        ? "bg-pill-plan-bg text-pill-plan-text"
        : "bg-pill-next-bg text-pill-next-text";

    if (card.control_type === "seat_map_trigger") {
      const seatSummary = selected
        ? `${state.selectedSeats.join(", ")} reserved`
        : "Row 12 · Together";
      return `
        <div class="bg-surface-page rounded-xl p-space-md border border-border-hairline flex flex-col gap-space-sm shadow-sm">
          <div class="flex items-center justify-between gap-space-sm">
            <div class="flex items-center gap-space-sm">
              <span class="material-symbols-outlined text-primary text-[22px] flex-shrink-0">${iconName}</span>
              <span class="font-title-md text-title-md text-text-heading">${card.title}</span>
            </div>
            ${
              card.status_pill
                ? `<span class="px-2 py-0.5 rounded-full ${pillClass} font-label-sm text-label-sm flex-shrink-0">${card.status_pill}</span>`
                : ""
            }
          </div>
          <p class="font-body-sm text-body-sm text-text-body">${card.description}</p>
          <div class="flex items-center justify-between pt-1 mt-1">
            <div class="flex flex-col">
              <span class="text-[18px] font-bold text-text-heading">${card.price_label}</span>
              <span class="font-label-md text-label-md text-text-body">${seatSummary}</span>
            </div>
            <button type="button" data-seat-trigger="${pid}" class="${
              selected
                ? "px-5 py-2 rounded-full bg-pill-done-bg text-pill-done-text border-[1.5px] border-pill-done-text font-title-md text-body-md font-semibold transition-all"
                : "px-5 py-2 rounded-full border-[1.5px] border-primary-container text-primary-container font-title-md text-body-md font-semibold hover:bg-primary-container/5 transition-all"
            }">
              ${selected ? `Seats ${state.selectedSeats[0]}–${state.selectedSeats[state.selectedSeats.length - 1]} ✓` : card.cta_label}
            </button>
          </div>
        </div>
      `;
    }

    if (card.control_type === "quantity_stepper") {
      return `
        <div class="bg-surface-page rounded-xl p-space-md border border-border-hairline flex flex-col gap-space-md shadow-sm">
          <div class="flex items-start justify-between gap-space-sm">
            <div class="flex items-start gap-space-sm">
              <div class="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-primary text-[22px]">${iconName}</span>
              </div>
              <div class="flex flex-col">
                <span class="font-title-md text-title-md text-text-heading">${card.title}</span>
                <span class="font-body-sm text-body-sm text-text-body">${card.description}</span>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="text-[18px] font-bold text-text-heading">${card.price_label}</span>
              <span class="block font-label-sm text-label-sm text-text-body font-normal">for this flight</span>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <div class="flex items-center bg-surface-container-low rounded-full px-1.5 py-1">
              <button type="button" data-qty-dec="${pid}" aria-label="Decrease quantity" ${
                qty === 0 ? "disabled" : ""
              } class="w-7 h-7 rounded-full flex items-center justify-center text-outline transition-colors disabled:opacity-40 hover:bg-surface-page">
                <span class="material-symbols-outlined text-[16px]">remove</span>
              </button>
              <span class="w-8 text-center font-title-md text-text-heading select-none">${qty}</span>
              <button type="button" data-qty-inc="${pid}" aria-label="Increase quantity" class="w-7 h-7 rounded-full flex items-center justify-center text-primary transition-colors hover:bg-surface-page">
                <span class="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>
            <button type="button" data-card-toggle="${pid}" class="${
              qty > 0
                ? "px-5 py-2 rounded-full bg-pill-done-bg text-pill-done-text border-[1.5px] border-pill-done-text font-title-md text-body-md font-semibold transition-all"
                : "px-5 py-2 rounded-full border-[1.5px] border-primary-container text-primary-container font-title-md text-body-md font-semibold hover:bg-primary-container/5 transition-all"
            }">
              ${qty > 0 ? `Selected (${qty}) ✓` : card.cta_label}
            </button>
          </div>
        </div>
      `;
    }

    // Default: toggle_all_pax
    return `
      <div class="bg-surface-page rounded-xl p-space-md border border-border-hairline flex flex-col gap-space-sm shadow-sm">
        <div class="flex items-center justify-between gap-space-sm">
          <div class="flex items-center gap-space-sm">
            <span class="material-symbols-outlined text-primary text-[22px] flex-shrink-0">${iconName}</span>
            <span class="font-title-md text-title-md text-text-heading">${card.title}</span>
          </div>
          ${
            card.status_pill
              ? `<span class="px-2 py-0.5 rounded-full ${pillClass} font-label-sm text-label-sm flex-shrink-0">${card.status_pill}</span>`
              : ""
          }
        </div>
        <p class="font-body-sm text-body-sm text-text-body">${card.description}</p>
        <div class="flex items-center justify-between pt-1 mt-1">
          <div class="flex flex-col">
            <span class="text-[18px] font-bold text-text-heading">${card.price_label}</span>
            ${
              card.secondary_link_label
                ? `<button type="button" data-secondary-link="${pid}" class="text-left font-label-md text-label-md text-primary-container underline mt-0.5">${card.secondary_link_label}</button>`
                : ""
            }
          </div>
          <button type="button" data-card-toggle="${pid}" class="${
            selected
              ? "px-5 py-2 rounded-full bg-pill-done-bg text-pill-done-text border-[1.5px] border-pill-done-text font-title-md text-body-md font-semibold transition-all"
              : "px-5 py-2 rounded-full border-[1.5px] border-primary-container text-primary-container font-title-md text-body-md font-semibold hover:bg-primary-container/5 transition-all"
          }">
            ${selected ? "✓ Added" : card.cta_label}
          </button>
        </div>
      </div>
    `;
  }

  function renderOfferPage(pageIndex) {
    const s = state.sessionData;
    const booking = s.booking || {};
    const pages = s.pages || [];
    const page = pages[pageIndex] || pages[0];
    if (!page) {
      return renderScreenC();
    }

    const cards = page.cards || [];
    const drawerItems = page.drawer_items || [];
    const hasSelectionOnPage =
      cards.some((c) => isProductSelected(c.product_id)) ||
      drawerItems.some((d) => isProductSelected(d.product_id));
    const hasNextOfferPage = pageIndex === 0 && pages.length >= 2;
    const continueLabel = hasSelectionOnPage
      ? hasNextOfferPage
        ? "Continue to Step 2"
        : "Confirm & Continue"
      : (page.decline_cta_label || "No thanks, continue").replace(" →", "");

    return `
      <div class="flex flex-col w-full pb-8">
        <!-- Compact Brand Navy Header Block (Header Ladder Rule: no duplicate greeting) -->
        <div class="bg-primary-container px-margin py-3.5 rounded-b-[24px] shadow-sm flex items-center justify-between text-on-primary">
          <button id="offer-page-back" type="button" aria-label="Back" class="w-9 h-9 flex items-center justify-start text-on-primary hover:opacity-80 transition-opacity">
            <span class="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 class="font-title-md text-title-md font-bold text-on-primary text-center flex-1">${page.header_title || "Check in"}</h1>
          <span class="font-label-md text-label-md text-on-primary/90 text-right min-w-[72px]">${page.step_indicator}</span>
        </div>

        <div class="px-margin flex flex-col gap-space-lg pt-space-lg">
          ${
            page.section_heading
              ? `
          <!-- Section Heading (Sanitized: single-flight scope "for this flight") -->
          <div class="flex flex-col items-start gap-1">
            <h2 class="font-headline-sm text-headline-sm text-text-heading">${page.section_heading}</h2>
            <p class="font-body-sm text-body-sm text-text-body">
              Customise your checked luggage allowance for this flight.
            </p>
          </div>
          `
              : `
          <!-- Flight Route Entity Card (Grounded in sessionData.booking) -->
          <div class="bg-surface-page rounded-xl p-space-md shadow-sm border border-border-hairline flex items-center justify-between gap-space-sm">
            <div class="flex items-center gap-space-md">
              <div class="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center flex-shrink-0 text-primary">
                <span class="material-symbols-outlined text-[22px]">flight_takeoff</span>
              </div>
              <div class="flex flex-col">
                <h2 class="font-title-md text-title-md text-text-heading truncate">${booking.origin_name || "Dublin"} → ${booking.destination_name || "Faro"}</h2>
                <p class="font-body-sm text-body-sm text-text-body truncate">${booking.departure_date_label || "Tue 14 Oct"} · ${booking.flight_number || "FR1234"} · ${booking.departure_time || "06:35"}</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-md bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md flex-shrink-0">
              ${booking.status_badge || "Check-in open"}
            </span>
          </div>
          `
          }

          <!-- Lavender Assistant Insight Panel (surface/ai #F2F1FE) + Dynamic Offer Cards -->
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

            ${cards.map((card) => renderDynamicOfferCard(card)).join("")}
          </div>

          ${
            drawerItems.length > 0
              ? `
          <!-- Collapsed Demotion Drawer (Grounded in page.drawer_items) -->
          <div class="flex flex-col rounded-xl border border-border-hairline bg-surface-page shadow-sm overflow-hidden">
            <button id="drawer-toggle-btn" type="button" class="w-full p-space-md flex items-center justify-between hover:bg-surface-container-low/60 transition-colors">
              <div class="flex items-center gap-space-sm">
                <div class="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center">
                  <span class="material-symbols-outlined text-primary text-[18px]">directions_car</span>
                </div>
                <div class="flex flex-col items-start">
                  <span class="font-body-md text-body-md font-semibold text-text-heading">${
                    page.drawer_label || `More extras (${drawerItems.length})`
                  }</span>
                  <span class="font-body-sm text-body-sm text-text-body">${drawerItems
                    .map((d) => d.title)
                    .join(" · ")}</span>
                </div>
              </div>
              <span class="material-symbols-outlined text-outline text-[20px] transition-transform ${
                state.drawerExpanded ? "rotate-90" : ""
              }">chevron_right</span>
            </button>

            ${
              state.drawerExpanded
                ? drawerItems
                    .map((d) => {
                      const dSel = isProductSelected(d.product_id);
                      return `
            <div class="px-space-md pb-space-md pt-2 border-t border-border-hairline bg-surface-container-low/40 flex items-center justify-between gap-3">
              <div class="flex flex-col">
                <span class="font-title-md text-text-heading">${d.title}</span>
                <span class="font-body-sm text-text-body">${d.description}</span>
                <span class="font-title-md text-text-heading font-bold mt-1">${d.price_label}</span>
              </div>
              <button type="button" data-drawer-item="${d.product_id}" class="${
                        dSel
                          ? "px-4 py-2 rounded-full bg-pill-done-bg text-pill-done-text border-[1.5px] border-pill-done-text font-semibold text-xs"
                          : "px-4 py-2 rounded-full border-[1.5px] border-primary-container text-primary-container font-semibold text-xs"
                      }">
                ${dSel ? "Added ✓" : d.cta_label || "Add"}
              </button>
            </div>
                      `;
                    })
                    .join("")
                : ""
            }
          </div>
          `
              : ""
          }

          <!-- First-Class Decline / Continue Action (Equal Visual Weight) -->
          <div class="w-full flex flex-col items-center">
            <button id="offer-page-continue" type="button" class="w-full py-3.5 px-space-lg rounded-full border-[1.5px] border-primary-container text-primary-container font-title-md text-title-md font-semibold flex items-center justify-center gap-space-sm hover:bg-primary-container/5 active:scale-[0.99] transition-all">
              <span>${continueLabel}</span>
              <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function bindOfferPage(pageIndex) {
    const s = state.sessionData;
    const page = (s.pages && s.pages[pageIndex]) || (s.pages && s.pages[0]);
    if (!page) return;
    const screenKey = page.screen_id || (pageIndex === 0 ? "offer_page_1" : "offer_page_2");

    const backBtn = document.getElementById("offer-page-back");
    if (backBtn) {
      backBtn.addEventListener("click", async () => {
        if (pageIndex === 0) {
          state.currentScreen = "checkin_start";
          renderCurrentScreen();
          return;
        }
        // Wiring Trap #2: Back arrow on Offer Page 2 returns to Offer Page 1, never Seat Map
        const mutation = await apiFetch(
          `/api/v1/checkin/sessions/${state.sessionId}/actions`,
          {
            method: "POST",
            body: JSON.stringify({
              action: "navigate_back",
              current_screen: screenKey,
            }),
          }
        );
        syncMutationResponse(mutation);
        state.currentScreen = mutation.next_screen;
        renderCurrentScreen();
      });
    }

    document.querySelectorAll("[data-secondary-link]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const paxNames = (s.passengers || [])
          .map((p) => p.full_name)
          .join(", ");
        showToast(
          `Applies across all ${(s.passengers || []).length} passengers (${paxNames}) for this flight.`
        );
      });
    });

    document.querySelectorAll("[data-seat-trigger]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        state.seatMapData = await apiFetch(
          `/api/v1/checkin/sessions/${state.sessionId}/seat-map`
        );
        if (
          state.seatMapData &&
          state.seatMapData.recommended_seats &&
          state.seatMapData.recommended_seats.length > 0
        ) {
          state.selectedSeats = state.seatMapData.recommended_seats.slice();
        }
        state.currentScreen = "seat_map";
        renderCurrentScreen();
      });
    });

    document.querySelectorAll("[data-card-toggle]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const pid = btn.getAttribute("data-card-toggle");
        const currentQty = getProductQuantity(pid);
        const mutation = await apiFetch(
          `/api/v1/checkin/sessions/${state.sessionId}/actions`,
          {
            method: "POST",
            body: JSON.stringify({
              action: currentQty > 0 ? "remove_item" : "add",
              current_screen: screenKey,
              product_id: pid,
              quantity: currentQty > 0 ? 0 : 1,
            }),
          }
        );
        syncMutationResponse(mutation);
        await refreshAnalytics();
        renderCurrentScreen();
      });
    });

    const updateStepperQty = async (pid, newQty) => {
      const mutation = await apiFetch(
        `/api/v1/checkin/sessions/${state.sessionId}/actions`,
        {
          method: "POST",
          body: JSON.stringify({
            action: newQty > 0 ? "add" : "update_quantity",
            current_screen: screenKey,
            product_id: pid,
            quantity: newQty,
          }),
        }
      );
      syncMutationResponse(mutation);
      await refreshAnalytics();
      renderCurrentScreen();
    };

    document.querySelectorAll("[data-qty-inc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-qty-inc");
        const cur = getProductQuantity(pid);
        if (cur < 4) updateStepperQty(pid, cur + 1);
      });
    });

    document.querySelectorAll("[data-qty-dec]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-qty-dec");
        const cur = getProductQuantity(pid);
        if (cur > 0) updateStepperQty(pid, cur - 1);
      });
    });

    const drawerBtn = document.getElementById("drawer-toggle-btn");
    if (drawerBtn) {
      drawerBtn.addEventListener("click", () => {
        state.drawerExpanded = !state.drawerExpanded;
        renderCurrentScreen();
      });
    }

    document.querySelectorAll("[data-drawer-item]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const pid = btn.getAttribute("data-drawer-item");
        const selected = isProductSelected(pid);
        const mutation = await apiFetch(
          `/api/v1/checkin/sessions/${state.sessionId}/actions`,
          {
            method: "POST",
            body: JSON.stringify({
              action: selected ? "remove_item" : "add",
              current_screen: screenKey,
              product_id: pid,
              quantity: selected ? 0 : 1,
            }),
          }
        );
        syncMutationResponse(mutation);
        await refreshAnalytics();
        renderCurrentScreen();
      });
    });

    const continueBtn = document.getElementById("offer-page-continue");
    if (continueBtn) {
      continueBtn.addEventListener("click", async () => {
        const cards = page.cards || [];
        const drawers = page.drawer_items || [];
        const hasSelectionOnPage =
          cards.some((c) => isProductSelected(c.product_id)) ||
          drawers.some((d) => isProductSelected(d.product_id));
        const mutation = await apiFetch(
          `/api/v1/checkin/sessions/${state.sessionId}/actions`,
          {
            method: "POST",
            body: JSON.stringify({
              action: hasSelectionOnPage ? "continue" : "decline_page",
              current_screen: screenKey,
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
   * SCREEN F — Seat Map (Grounded in state.seatMapData: rows, recommended_seats, child rules)
   * ========================================================================== */
  function renderSeatCell(seat, passengers) {
    const selectedIdx = state.selectedSeats.indexOf(seat.designator);
    const isSelected = selectedIdx !== -1;

    if (isSelected) {
      const pax = passengers[selectedIdx] || {};
      const shortName = ((pax.full_name || pax.display_name || "Guest").split(" ")[0]);
      return `
        <button type="button" data-seat-select="${seat.designator}" class="h-11 rounded-lg bg-secondary-container text-on-secondary-fixed flex flex-col items-center justify-center shadow-sm transition-transform active:scale-95">
          <span class="text-[12px] font-bold leading-tight">${seat.designator}</span>
          <span class="text-[9px] uppercase font-bold truncate max-w-[44px]">${shortName}</span>
        </button>
      `;
    }

    if (seat.status === "occupied") {
      return `
        <div class="h-9 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant/40">
          <span class="material-symbols-outlined text-[14px]">close</span>
        </div>
      `;
    }

    if (seat.status === "blocked_child_rule") {
      return `
        <button type="button" class="child-restricted-seat h-9 rounded-lg bg-surface-variant flex flex-col items-center justify-center text-on-surface-variant cursor-not-allowed" data-seat="${
          seat.designator
        }" data-reason="${seat.restriction_reason || "Exit row unavailable with children under 16"}">
          <span class="font-label-sm leading-none">${seat.designator}</span>
          <span class="text-[8px]">Restricted</span>
        </button>
      `;
    }

    // Available or unselected recommended seat
    return `
      <button type="button" data-seat-select="${seat.designator}" class="h-9 rounded-lg bg-surface-container-low hover:bg-pill-next-bg flex flex-col items-center justify-center text-primary-container transition-colors">
        <span class="font-label-sm leading-none font-bold">${seat.designator}</span>
        <span class="text-[9px] text-text-body">€${Math.round(seat.price_eur || 6)}</span>
      </button>
    `;
  }

  function renderScreenF() {
    const s = state.sessionData || {};
    const booking = s.booking || {};
    const passengers = s.passengers || [];
    const seatMap = state.seatMapData || {
      aircraft: "Boeing 737-800",
      recommended_row: 12,
      recommended_seats: ["12A", "12B", "12C", "12D"],
      unit_price_eur: 6.0,
      total_price_eur: 24.0,
      assistant_panel: {
        heading: "I've found 4 seats together",
        supporting_text: "Row 12, near the front.",
      },
      rows: [],
    };
    const unitPrice = typeof seatMap.unit_price_eur === "number" ? seatMap.unit_price_eur : 6.0;
    const totalPrice = (state.selectedSeats.length * unitPrice).toFixed(2);
    const activeRows = Array.from(
      new Set(state.selectedSeats.map((d) => d.replace(/[A-F]/g, "")))
    ).join(", ");

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
            <span>${booking.origin_name || "Dublin"} to ${booking.destination_name || "Faro"}</span>
            <span>•</span>
            <span>Flight ${booking.flight_number || "FR1234"}</span>
            <span>•</span>
            <span>${seatMap.aircraft || "Boeing 737-800"}</span>
          </p>
        </div>

        <div class="px-margin flex flex-col gap-space-md -mt-2 pt-3">
          <!-- Passenger Selection Bar (Grounded in sessionData.passengers & state.selectedSeats) -->
          <div class="bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-border-hairline flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm text-text-body uppercase tracking-wider">Party of ${passengers.length} (PNR ${booking.booking_reference || "X8Y9QL"})</span>
              <span class="font-label-sm text-label-sm text-pill-done-text bg-pill-done-bg px-2 py-0.5 rounded-full flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]">check_circle</span>
                All seated together
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              ${passengers
                .map((p, idx) => {
                  const firstName = (p.full_name || p.display_name || "Guest").split(" ")[0];
                  const isChild = p.passenger_type === "child";
                  const seatCode = state.selectedSeats[idx] || "—";
                  return `
              <div class="flex items-center justify-between p-2 rounded-lg bg-secondary-container/20">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-label-md shrink-0 font-bold">${firstName.charAt(0)}</div>
                  <div class="truncate">
                    <p class="font-title-md text-text-heading truncate text-[13px] leading-tight">${firstName}${isChild ? ` (${p.age}y)` : ""}</p>
                    <p class="font-body-sm text-text-body text-[11px] leading-tight">${isChild ? "Child" : "Adult"}</p>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-fixed text-[13px] font-bold">${seatCode}</span>
              </div>
                  `;
                })
                .join("")}
            </div>
          </div>

          <!-- Lavender Assistant Insight Panel (Sanitized: NO urgency countdown timer) -->
          <div class="rounded-[18px] p-4 bg-surface-ai flex flex-col gap-2">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-[#4B2EDB] flex items-center justify-center shrink-0 shadow-sm">
                <span class="material-symbols-outlined text-surface-page text-[18px]" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
              </div>
              <div class="flex-1">
                <h2 class="font-title-md text-title-md text-[#4B2EDB] font-bold">${seatMap.assistant_panel.heading}</h2>
                <p class="font-body-sm text-body-sm text-text-body mt-0.5">${seatMap.assistant_panel.supporting_text} Tap any available seat below to adjust.</p>
              </div>
            </div>
            <div class="flex items-center gap-2 pt-1 font-label-sm text-label-sm text-pill-done-text bg-surface-page/80 px-2.5 py-1.5 rounded-lg">
              <span class="material-symbols-outlined text-[15px] shrink-0">verified</span>
              <span class="truncate">Family seating rules verified • No extra grouping fee</span>
            </div>
          </div>

          <!-- Cabin Seat Map Card (Grounded in state.seatMapData.rows; Row 14 excluded) -->
          <div class="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-border-hairline flex flex-col items-center">
            <div class="w-full grid grid-cols-7 gap-1 text-center font-label-sm text-label-sm text-text-body py-1.5 mb-2 bg-surface-container-low rounded-lg">
              <span>A</span><span>B</span><span>C</span><span class="text-on-surface-variant/50">AISLE</span><span>D</span><span>E</span><span>F</span>
            </div>

            <div class="w-full flex flex-col gap-2">
              ${(seatMap.rows || [])
                .map((row) => {
                  const leftSeats = (row.seats || []).slice(0, 3);
                  const rightSeats = (row.seats || []).slice(3, 6);
                  const isRecRow = row.row_number === seatMap.recommended_row;
                  return `
                    ${
                      row.badge && !row.is_exit_row
                        ? `
                    <div class="w-full flex justify-center -mb-0.5 mt-1">
                      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-secondary-fixed shadow-sm">
                        <span class="material-symbols-outlined text-[14px]">stars</span>
                        <span class="font-label-sm text-label-sm font-bold tracking-wide">${row.badge}</span>
                      </div>
                    </div>
                    `
                        : ""
                    }
                    ${
                      row.is_exit_row
                        ? `
                    <div class="w-full flex items-center justify-between py-1 px-2.5 my-0.5 rounded bg-surface-container-high text-text-body">
                      <span class="font-label-sm text-label-sm font-bold flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">block</span>
                        EXIT ROW ${row.row_number} · ${row.badge || "UNAVAILABLE WITH CHILDREN"}
                      </span>
                    </div>
                    `
                        : ""
                    }
                    <div class="grid grid-cols-7 gap-1.5 items-center ${
                      isRecRow ? "p-1 rounded-xl bg-secondary-container/20" : ""
                    } ${row.is_exit_row ? "opacity-55" : ""}">
                      ${leftSeats.map((sItem) => renderSeatCell(sItem, passengers)).join("")}
                      <div class="h-9 flex items-center justify-center font-label-md text-text-body font-bold">${row.row_number}</div>
                      ${rightSeats.map((sItem) => renderSeatCell(sItem, passengers)).join("")}
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>

          <!-- Sticky Confirm Bar -->
          <div class="bg-surface-page rounded-2xl p-3.5 shadow-md border border-border-hairline flex items-center justify-between mt-1">
            <div class="flex flex-col">
              <span class="font-label-sm text-label-sm text-text-body uppercase tracking-wider">${state.selectedSeats.length} seats · Row ${activeRows}</span>
              <div class="flex items-baseline gap-1">
                <span class="font-headline-sm text-headline-sm text-text-heading leading-tight">€${totalPrice}</span>
                <span class="font-body-sm text-body-sm text-text-body">(@ €${unitPrice.toFixed(2)})</span>
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
        const reason = btn.getAttribute("data-reason");
        showToast(
          `Safety rule: ${reason || "Emergency exit row 16 cannot accommodate children under 16."}`
        );
      });
    });

    document.querySelectorAll("[data-seat-select]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const designator = btn.getAttribute("data-seat-select");
        if (!designator) return;
        const existingIdx = state.selectedSeats.indexOf(designator);
        if (existingIdx !== -1) {
          showToast(
            `Seat ${designator} is currently assigned to passenger #${existingIdx + 1}. Tap any open seat to move.`
          );
          return;
        }
        // Rotate replacement into the last passenger slot
        const updated = state.selectedSeats.slice();
        updated[updated.length - 1] = designator;
        updated.sort();
        state.selectedSeats = updated;
        renderCurrentScreen();
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
              seat_designators: state.selectedSeats,
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
   * SCREEN D — Review & Pay (No Step Number, Dynamic Removable Line Items, Visa 4412)
   * ========================================================================== */
  function renderScreenD() {
    const s = state.sessionData || {};
    const booking = s.booking || {};
    const items = state.basketData.items || [];
    const iconMap = {
      priority_boarding: "luggage",
      reserved_seats: "airline_seat_recline_extra",
      checked_bag_20kg: "shopping_bag",
      car_hire: "directions_car",
      fast_track: "bolt",
      travel_insurance: "verified_user",
    };
    const subBadgeMap = {
      priority_boarding: "All guests",
      reserved_seats: "Together",
      checked_bag_20kg: "Hold luggage",
      car_hire: "Faro Airport",
      fast_track: "Security lane",
      travel_insurance: "Single flight",
    };

    return `
      <div class="flex flex-col w-full pb-8">
        <!-- Navy Header Accent Block (Checkout is NOT a step: no step number) -->
        <div class="bg-primary-container px-margin pt-3.5 pb-9 text-on-primary">
          <div class="flex items-center justify-between mb-1">
            <button id="screen-d-back" type="button" aria-label="Back to Offer Page" class="w-9 h-9 -ml-1 flex items-center justify-start text-on-primary hover:opacity-80">
              <span class="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 class="font-headline-sm text-headline-sm text-on-primary flex-1 text-center">${state.basketData.header_title || "Review your extras"}</h1>
            <span class="w-9"></span>
          </div>
          <p class="font-body-sm text-body-sm text-on-primary-container text-center">${booking.airline || "Ryanair"} · ${booking.flight_number || "FR1234"} • ${booking.origin_name || "Dublin"} (${booking.origin_code || "DUB"}) → ${booking.destination_name || "Faro"} (${booking.destination_code || "FAO"})</p>
        </div>

        <div class="-mt-5 bg-surface-page rounded-t-[20px] px-margin pt-5 pb-6 flex flex-col gap-space-md shadow-sm">
          <!-- Lavender Assistant Summary Panel -->
          <div class="bg-surface-ai rounded-xl p-space-md flex items-start gap-space-sm">
            <div class="w-8 h-8 rounded-full bg-[#4B2EDB] flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-on-primary text-[18px]" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-title-md text-title-md text-[#4B2EDB] font-bold leading-tight">Everything is in sync</p>
              <p class="font-body-sm text-body-sm text-text-body mt-0.5">I've linked your selected extras across booking ${booking.booking_reference || "X8Y9QL"}.</p>
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
                  <p class="font-title-md text-title-md text-text-heading truncate">${state.basketData.saved_payment_method || "Visa ending 4412"}</p>
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
            <span class="font-title-md text-title-md font-bold text-on-primary">${state.basketData.pay_cta_label || "Pay and get boarding passes"}</span>
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
   * SCREEN C — Zero-Offer State ("1 STEP", Grounded in sessionData.zero_offer_panel & booking)
   * ========================================================================== */
  function renderScreenC() {
    const s = state.sessionData || {};
    const booking = s.booking || {};
    const passengers = s.passengers || [];
    const lead =
      passengers.find((p) => p.is_lead_booker) ||
      passengers[0] || { full_name: "Marta Byrne", initials: "MB" };
    const leadFirstName = (lead.full_name || "Marta").split(" ")[0];
    const panel = s.zero_offer_panel || {
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
              <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center ring-2 ring-secondary-fixed text-on-primary font-bold text-xs">${lead.initials || "MB"}</div>
            </div>
          </div>
          <div class="px-margin pt-2 pb-6 flex flex-col">
            <h1 class="font-headline-lg text-[28px] font-bold text-on-primary tracking-tight leading-tight">Hi ${leadFirstName},</h1>
            <p class="font-body-md text-on-primary/80 mt-1">You're all set to fly</p>
          </div>
        </header>

        <div class="flex flex-col w-full px-margin pt-space-md space-y-space-xl">
          <!-- "1 STEP" Overline Pill -->
          <div class="inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full bg-pill-next-bg">
            <span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary-container font-bold">${s.entry_step_pill || "1 STEP"}</span>
          </div>

          <!-- Flight Entity Card (Sanitized: contradictory single-seat chip removed) -->
          <div class="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-border-hairline">
            <div class="flex items-start justify-between gap-space-sm">
              <div class="flex items-center gap-space-sm">
                <div class="w-11 h-11 rounded-lg bg-surface-container-low flex items-center justify-center text-primary-container flex-shrink-0">
                  <span class="material-symbols-outlined text-[24px]">flight_takeoff</span>
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="font-title-md text-title-md text-text-heading font-semibold tracking-tight truncate">${booking.origin_name || "Dublin"} → ${booking.destination_name || "Faro"}</span>
                  <span class="font-body-sm text-body-sm text-text-body truncate">${booking.departure_date_label || "Tue 14 Oct"} · ${booking.flight_number || "FR1234"} · ${booking.departure_time || "06:35"}</span>
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
                <span class="font-body-sm">${booking.origin_terminal || "Terminal 1"} · Gate ${booking.gate || "104"} · Gate closes ${booking.gate_closes_time || "06:05"}</span>
              </div>
              <span class="font-label-md text-label-md text-text-body">${passengers.length || 4} passengers</span>
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
   * SCREEN G — Boarding Passes (Grounded in state.boardingPasses & sessionData.booking)
   * ========================================================================== */
  function renderScreenG() {
    const s = state.sessionData || {};
    const booking = s.booking || {};
    const passengers = s.passengers || [];
    const fallbackPasses = passengers.map((p, i) => {
      const seat = isProductSelected("reserved_seats")
        ? state.selectedSeats[i] || null
        : null;
      return {
        pass_index: i + 1,
        passenger_id: p.passenger_id,
        passenger_name: p.full_name,
        seat,
        badges: [
          ...(isProductSelected("priority_boarding") ? ["PRIORITY"] : []),
          ...(seat ? [seat] : []),
        ],
        qr_payload: `RYR:${booking.booking_reference || "X8Y9QL"}:${booking.flight_number || "FR1234"}:${p.passenger_id}:${seat || "FREE"}`,
      };
    });

    const passes =
      state.boardingPasses && state.boardingPasses.length > 0
        ? state.boardingPasses
        : fallbackPasses;

    const totalPasses = passes.length || 1;
    const idx = state.activePassIndex % totalPasses;
    const activePass = passes[idx];
    const hasPriority = (activePass.badges || []).includes("PRIORITY");
    const seatLabel = activePass.seat ? `Seat ${activePass.seat}` : "Seat at Gate";

    return `
      <div class="flex flex-col w-full pb-8">
        <!-- Compact Navy Header (Boarding Passes: no step number) -->
        <div class="bg-primary-container text-on-primary rounded-b-3xl px-margin pt-4 pb-10 relative overflow-hidden shadow-sm">
          <div class="relative z-10 flex flex-col gap-space-xs">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary-fixed">Booking · PNR: ${booking.booking_reference || "X8Y9QL"}</span>
              <span class="bg-pill-done-bg text-pill-done-text px-2.5 py-0.5 rounded-full font-label-md text-label-md font-semibold">Gate ${booking.gate || "104"}</span>
            </div>
            <h1 class="font-headline-sm text-headline-sm text-on-primary tracking-tight mt-1">Boarding passes</h1>
            <p class="font-body-sm text-body-sm text-primary-fixed">${booking.origin_code || "DUB"} → ${booking.destination_code || "FAO"} · Flight ${booking.flight_number || "FR1234"} · Departs ${booking.departure_time || "06:35"} (Boarding ${booking.boarding_time || "05:55"})</p>
          </div>
        </div>

        <!-- Swipeable Stack of Passes -->
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
                } of ${totalPasses}</span>
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
                  <div class="font-headline-lg text-headline-lg text-primary leading-none">${booking.origin_code || "DUB"}</div>
                  <div class="font-label-md text-label-md text-text-body mt-1">${booking.origin_name || "Dublin"} T1</div>
                </div>
                <div class="flex-1 flex flex-col items-center px-4">
                  <span class="font-label-sm text-label-sm text-text-body mb-1">${booking.flight_number || "FR1234"}</span>
                  <div class="w-full h-0.5 bg-surface-variant relative"></div>
                  <span class="font-label-sm text-label-sm text-pill-next-text font-bold mt-1">${booking.departure_time || "06:35"}</span>
                </div>
                <div class="text-right">
                  <div class="font-headline-lg text-headline-lg text-primary leading-none">${booking.destination_code || "FAO"}</div>
                  <div class="font-label-md text-label-md text-text-body mt-1">${booking.destination_name || "Faro"}</div>
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
                  <span class="font-title-md text-pill-review-text font-bold">${booking.boarding_time || "05:55"}</span>
                </div>
                <div class="text-right">
                  <span class="font-label-sm text-text-body block">Gate closes</span>
                  <span class="font-title-md text-primary font-bold">${booking.gate_closes_time || "06:05"}</span>
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
              <span class="font-label-sm text-text-body mt-1 font-mono text-[10px]">${activePass.qr_payload || `Scan at Gate ${booking.gate || "104"} · PNR ${booking.booking_reference || "X8Y9QL"}`}</span>
            </div>
          </div>

          <!-- Pass Switcher Controls -->
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
              } of ${totalPasses} · ${activePass.passenger_name}</span>
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
    const totalPasses =
      (state.boardingPasses && state.boardingPasses.length) ||
      ((state.sessionData &&
        state.sessionData.passengers &&
        state.sessionData.passengers.length) ||
        4);
    const prevBtn = document.getElementById("prev-pass-btn");
    const nextBtn = document.getElementById("next-pass-btn");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        state.activePassIndex =
          (state.activePassIndex + totalPasses - 1) % totalPasses;
        renderCurrentScreen();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        state.activePassIndex = (state.activePassIndex + 1) % totalPasses;
        renderCurrentScreen();
      });
    }
    const walletBtn = document.getElementById("apple-wallet-btn");
    if (walletBtn) {
      walletBtn.addEventListener("click", () => {
        showToast(
          `Added ${totalPasses} boarding passes to Apple Wallet.`
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

    const traceBar = document.getElementById("adk-live-trace-bar");
    if (traceBar) {
      const hh = state.helpHubResponse;
      if (hh) {
        const toolsHtml = (hh.invoked_tools || [])
          .map(
            (t) =>
              `<span class="px-2 py-0.5 rounded-full bg-white text-primary-container font-mono font-semibold border border-border-hairline">${t}()</span>`
          )
          .join("");
        traceBar.innerHTML = `
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="inline-flex items-center gap-1.5 font-bold text-[#4B2EDB]">
              <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
              <span>ADK Agent (<code>${hh.agent_id || "help_hub_trip_assistant"}</code> · <code>${hh.model || "gemini-flash"}</code>)</span>
            </span>
            <span class="px-2 py-0.5 rounded-full bg-pill-done-bg text-pill-done-text font-bold text-[11px]">
              ${hh.source === "adk_gemini_flash" ? "⚡ Live ADK Runner" : "✓ Grounded ADK Tools"} · ${
          typeof hh.latency_ms === "number" ? `${hh.latency_ms.toFixed(1)}ms` : "OK"
        }
            </span>
          </div>
          <div class="text-text-heading font-medium">
            <span class="text-text-body">Screen E Query:</span> "${hh.query}" → <strong class="text-[#4B2EDB]">${hh.heading}</strong>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span class="text-[11px] text-text-body font-semibold">Invoked Tools:</span>
            ${toolsHtml || `<span class="text-[11px] text-text-body">score_ancillaries()</span>`}
          </div>
        `;
      } else {
        traceBar.innerHTML = `
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="inline-flex items-center gap-1.5 font-bold text-[#4B2EDB]">
              <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
              <span>ADK Help Hub Agent (<code>help_hub_trip_assistant</code>)</span>
            </span>
            <span class="text-[11px] font-semibold text-text-body">Submit a question on Screen E to run ADK tools live</span>
          </div>
        `;
      }
    }

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
          if (
            state.seatMapData &&
            state.seatMapData.recommended_seats &&
            state.seatMapData.recommended_seats.length > 0
          ) {
            state.selectedSeats = state.seatMapData.recommended_seats.slice();
          }
        }
        state.currentScreen = target;
        renderCurrentScreen();
      });
    });

    const supportBtn = document.getElementById("nav-support-btn");
    if (supportBtn) {
      supportBtn.addEventListener("click", () => {
        submitHelpHubQuery("What is my flight status and gate?");
        state.currentScreen = "checkin_start";
        renderCurrentScreen();
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
