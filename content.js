/*
================================================================
| PA MINI HELPER LIBRARY v0.1                                  |
| --- Nền tảng cho kịch bản tự động hóa ---                    |
================================================================
*/
(function () {
  if (window.PA) return; // Tránh nạp 2 lần // ====== UTILS ======

  const u = {
    $(sel, root = document) {
      try {
        return root.querySelector(sel);
      } catch (_) {
        return null;
      }
    },
    $all(sel, root = document) {
      try {
        return Array.from(root.querySelectorAll(sel));
      } catch (_) {
        return [];
      }
    },
    norm(s) {
      return (s || "").toString().replace(/\s+/g, " ").trim().toLowerCase();
    },
    includes(a, b) {
      return u.norm(a).includes(u.norm(b));
    },
    toast(msg, ok = true) {
      let t = document.getElementById("__pa_toast__");
      if (!t) {
        t = document.createElement("div");
        t.id = "__pa_toast__";
        Object.assign(t.style, {
          position: "fixed",
          right: "16px",
          bottom: "16px",
          padding: "10px 12px",
          color: "#fff",
          borderRadius: "8px",
          fontSize: "14px",
          zIndex: 2147483647,
          boxShadow: "0 6px 18px rgba(0,0,0,.2)",
        });
        document.body.appendChild(t);
      }
      t.style.background = ok ? "rgba(40,167,69,.95)" : "rgba(220,53,69,.95)";
      t.textContent = msg;
      t.style.display = "block";
      clearTimeout(t.__h);
      t.__h = setTimeout(() => (t.style.display = "none"), 1600);
    },
    fire(el) {
      if (!el) return;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      if (window.$) {
        try {
          window.$(el).change();
        } catch (_) {}
      }
    },
    isEditableTarget(e) {
      const tag = (e.target?.tagName || "").toLowerCase();
      return (
        ["input", "textarea", "select"].includes(tag) ||
        e.target?.isContentEditable ||
        e.isComposing
      );
    },
    hi(el, color = "#3b82f6") {
      if (!el) return;
      const oldO = el.style.outline,
        oldB = el.style.boxShadow;
      el.style.outline = `2px solid ${color}`;
      el.style.boxShadow = `0 0 0 4px ${color}40`;
      setTimeout(() => {
        el.style.outline = oldO;
        el.style.boxShadow = oldB;
      }, 1200);
    },
  }; // ====== CORE FINDERS ======

  function byId(id) {
    return document.getElementById(id) || null;
  }
  function byName(name) {
    return u.$(`[name="${CSS.escape(name)}"]`);
  }
  function byCSS(selector) {
    return u.$(selector);
  }
  function byPlaceholder(text) {
    return (
      u
        .$all("input[placeholder],textarea[placeholder]")
        .find((el) => u.includes(el.getAttribute("placeholder"), text)) || null
    );
  }
  function byAriaLabel(text) {
    return (
      u
        .$all("[aria-label]")
        .find((el) => u.includes(el.getAttribute("aria-label"), text)) || null
    );
  }
  function byText(text) {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      null
    );
    while (walker.nextNode()) {
      const el = walker.currentNode;
      if (u.includes(el.textContent || "", text)) return el;
    }
    return null;
  }
  function byLabel(label) {
    const hit = u
      .$all("label[for]")
      .find((l) => u.includes(l.textContent, label));
    if (hit) return byId(hit.getAttribute("for"));
    for (const l of u.$all("label")) {
      if (u.includes(l.textContent, label)) {
        const el = l.querySelector("input,select,textarea");
        if (el) return el;
      }
    }
    for (const el of u.$all("input,select,textarea")) {
      const pr =
        el.closest("div,td,th,li,section,._group,.row") || el.parentElement;
      if (pr && u.includes(pr.textContent || "", label)) return el;
    }
    return null;
  }
  function find(spec) {
    if (!spec) return null;
    if (typeof spec === "string")
      return byLabel(spec) || byText(spec) || byCSS(spec);
    if (spec.id) return byId(spec.id);
    if (spec.name) return byName(spec.name);
    if (spec.label) return byLabel(spec.label);
    if (spec.placeholder) return byPlaceholder(spec.placeholder);
    if (spec.text) return byText(spec.text);
    if (spec.aria) return byAriaLabel(spec.aria);
    if (spec.css) return byCSS(spec.css);
    return null;
  } // ====== ACTIONS ======

  function focus(spec) {
    const el = spec?.nodeType ? spec : find(spec);
    if (!el) {
      u.toast("Không tìm thấy phần tử", false);
      return false;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (typeof el.focus === "function") el.focus({ preventScroll: true });
    if (typeof el.select === "function") {
      try {
        el.select();
      } catch (_) {}
    }
    u.hi(el);
    return true;
  }
  function set(spec, value) {
    const el = spec?.nodeType ? spec : find(spec);
    if (!el) {
      u.toast("Không tìm thấy phần tử để set", false);
      return false;
    }
    const tag = (el.tagName || "").toLowerCase(),
      type = (el.type || "").toLowerCase();
    if (tag === "select") {
      const v = value == null ? "" : String(value);
      let opt = Array.from(el.options).find((o) => String(o.value) === v);
      if (!opt)
        opt = Array.from(el.options).find((o) =>
          u.includes(o.textContent || "", v)
        );
      if (opt) {
        el.value = opt.value;
        u.fire(el);
        u.hi(el, "#10b981");
        return true;
      }
      return false;
    }
    if (tag === "input" && (type === "checkbox" || type === "radio")) {
      el.checked = !!value;
      u.fire(el);
      u.hi(el, "#10b981");
      return true;
    }
    if ("value" in el) {
      el.value = value == null ? "" : value;
      u.fire(el);
      u.hi(el, "#10b981");
      return true;
    }
    return false;
  }
  function clickSave(labels = ["save", "lưu"]) {
    const btn = u
      .$all(
        'button, input[type="button"], input[type="submit"], [role="button"]'
      )
      .find((el) =>
        labels.some((lb) => u.includes(el.value || el.textContent || "", lb))
      );
    if (btn) {
      btn.click();
      return true;
    }
    u.toast("Không tìm thấy nút Save", false);
    return false;
  } // ====== HOTKEYS ======

  const _hotkeys = new Map();
  function hotkey(key, handler, opts = {}) {
    _hotkeys.set(key.toLowerCase(), { handler, opts });
    return api;
  }
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const item = _hotkeys.get((e.key || "").toLowerCase());
      if (!item || (!item.opts?.whenTyping && u.isEditableTarget(e))) return;
      e.preventDefault();
      try {
        item.handler(e);
      } catch (err) {
        console.error(err);
        u.toast("Lỗi khi chạy hotkey", false);
      }
    },
    true
  ); // ====== API ======

  const api = {
    find,
    focus,
    set,
    toast: u.toast,
    hotkey,
    hotkeyFocus: (key, spec, opts = {}) => hotkey(key, () => focus(spec), opts),
    hotkeySet: (key, spec, value, opts = {}) =>
      hotkey(key, () => set(spec, value), opts),
    clickSave,
  };
  Object.defineProperty(api, "version", { value: "0.1" });
  window.PA = api;
})();

/*
================================================================
| SC POG/COMBO/TB AUTOMATION SCRIPT v3.0                       |
| --- Kịch bản tự động cho Photo Audit SC ---                  |
================================================================
*/
(() => {
  // Chỉ chạy trên trang Photo Audit SC
  if (!window.PA || !/TradeProgramViewPhoto_SC\.aspx/i.test(location.href))
    return; // ====== 1. KHAI BÁO IDS CHO CẢ 3 LOẠI KỆ ======

  // --- Dành cho Kệ POG ---
  const IDS_POG = {
    facings: { id: "condition_15492" },
    columns: { id: "condition_15493" },
    trayTB: { id: "condition_15494" },
    cdc: { id: "condition_15495" },
    mf: { id: "condition_15496" },
    tb: { id: "condition_15497" },
  };
  // --- Dành cho Kệ Combo ---
  const IDS_COMBO = {
    comboShelves: { id: "condition_15498" },
    comboFacingTB: { id: "condition_15499" },
    comboFacingTP: { id: "condition_15500" },
    comboCDC: { id: "condition_15501" },
    comboMF: { id: "condition_15502" },
    comboSSAdvance: { id: "condition_15503" },
    comboSSCharcoal: { id: "condition_15504" },
    comboSSGumcare: { id: "condition_15505" },
    comboSSInBetween: { id: "condition_15506" },
    comboBatman: { id: "condition_15507" },
  };
  // --- Dành cho Kệ Bàn Chải (TB) ---
  const IDS_TB = {
    tbShelves: { id: "condition_15508" },
    tbFacingTB: { id: "condition_15509" },
    tbSSAdvance: { id: "condition_15510" },
    tbSSCharcoal: { id: "condition_15511" },
    tbSSGumcare: { id: "condition_15512" },
    tbSSInBetween: { id: "condition_15513" },
    tbBatman: { id: "condition_15514" },
  };
  // --- Dành cho các trường chung ---
  const IDS_COMMON = {
    note1: { id: "condition_15515" },
    note2: { id: "condition_15516" },
    note3: { id: "condition_15517" },
    fake: { id: "condition_15491" },
    showImg: { id: "show_img" },
    imgZoom: { id: "imgzoomed" },
  }; // ====== 2. HÀM NHẬN DIỆN FORM ======

  function detectFormType() {
    const filterDiv = document.getElementById("Condition_filter");
    if (!filterDiv) return "UNKNOWN";
    if (filterDiv.querySelector("#POG")) return "POG";
    if (filterDiv.querySelector("#COMBO")) return "COMBO";
    if (filterDiv.querySelector("#TB")) return "TB"; // Thêm nhận diện kệ Bàn Chải
    return "UNKNOWN";
  } // ====== 3. CÁC HÀM PRESET RIÊNG BIỆT ====== // --- Preset cho POG ---

  function applyMissingPOGPreset() {
    let changed = 0;
    changed += PA.set(IDS_COMMON.fake, "No") ? 1 : 0;
    changed += PA.set(IDS_POG.facings, 0) ? 1 : 0;
    changed += PA.set(IDS_POG.columns, 0) ? 1 : 0;
    changed += PA.set(IDS_POG.trayTB, 0) ? 1 : 0;
    changed += PA.set(IDS_POG.cdc, "No") ? 1 : 0;
    changed += PA.set(IDS_POG.mf, "No") ? 1 : 0;
    changed += PA.set(IDS_POG.tb, "No") ? 1 : 0;
    changed += PA.set(IDS_COMMON.note1, "Thiếu hình kệ POG") ? 1 : 0;
    PA.toast(`Áp preset 'Thiếu hình POG' (${changed} trường)`, !!changed);
  }
  function applyTailPreset_POG() {
    let changed = 0;
    changed += PA.set(IDS_POG.facings, 0) ? 1 : 0;
    changed += PA.set(IDS_POG.columns, 0) ? 1 : 0;
    changed += PA.set(IDS_COMMON.fake, "No") ? 1 : 0;
    changed += PA.set(IDS_COMMON.note1, "Trưng bày đuôi sản phẩm") ? 1 : 0;
    PA.toast(`Áp preset 'Đuôi SP' (${changed} trường)`, !!changed);
  } // --- Preset cho Combo ---

  function applyMissingComboPreset() {
    let changed = 0;
    changed += PA.set(IDS_COMMON.fake, "No") ? 1 : 0;
    changed += PA.set(IDS_COMBO.comboShelves, 0) ? 1 : 0;
    changed += PA.set(IDS_COMBO.comboFacingTB, 0) ? 1 : 0;
    changed += PA.set(IDS_COMBO.comboFacingTP, 0) ? 1 : 0;
    changed += PA.set(IDS_COMBO.comboCDC, "No") ? 1 : 0;
    changed += PA.set(IDS_COMBO.comboMF, "No") ? 1 : 0;
    changed += PA.set(IDS_COMBO.comboSSAdvance, "No") ? 1 : 0;
    changed += PA.set(IDS_COMBO.comboSSCharcoal, "No") ? 1 : 0;
    changed += PA.set(IDS_COMBO.comboSSGumcare, "No") ? 1 : 0;
    changed += PA.set(IDS_COMBO.comboSSInBetween, "No") ? 1 : 0;
    changed += PA.set(IDS_COMBO.comboBatman, "No") ? 1 : 0;
    changed += PA.set(IDS_COMMON.note1, "Thiếu hình kệ Combo") ? 1 : 0;
    PA.toast(`Áp preset 'Thiếu hình Combo' (${changed} trường)`, !!changed);
  }

  // --- Preset cho Kệ Bàn Chải (TB) ---
  function applyMissingTBPreset() {
    let changed = 0;
    changed += PA.set(IDS_COMMON.fake, "No") ? 1 : 0;
    changed += PA.set(IDS_TB.tbShelves, 0) ? 1 : 0;
    changed += PA.set(IDS_TB.tbFacingTB, 0) ? 1 : 0;
    changed += PA.set(IDS_TB.tbSSAdvance, "No") ? 1 : 0;
    changed += PA.set(IDS_TB.tbSSCharcoal, "No") ? 1 : 0;
    changed += PA.set(IDS_TB.tbSSGumcare, "No") ? 1 : 0;
    changed += PA.set(IDS_TB.tbSSInBetween, "No") ? 1 : 0;
    changed += PA.set(IDS_TB.tbBatman, "No") ? 1 : 0;
    changed += PA.set(IDS_COMMON.note1, "Thiếu hình kệ bàn chải") ? 1 : 0;
    PA.toast(`Áp preset 'Thiếu hình kệ BC' (${changed} trường)`, !!changed);
  } // --- Hàm chung ---

  function applyNote3AndSave() {
    const NOTE_TEXT = "Ảnh chấm thuộc Phase 3";
    const okSet = PA.set(IDS_COMMON.note3, NOTE_TEXT);
    if (okSet) {
      const okSave = PA.clickSave();
      PA.toast(
        `Note 3 = "${NOTE_TEXT}" và ${
          okSave ? "đã bấm Save" : "không thấy nút Save"
        }`,
        okSave
      );
    } else {
      PA.toast("Không gán được Note 3", false);
    }
  } // ====== 4. GẮN HOTKEYS THÔNG MINH ====== // D: Preset "Thiếu hình" (tùy theo context)

  PA.hotkey("d", () => {
    const formType = detectFormType();
    if (formType === "POG") applyMissingPOGPreset();
    else if (formType === "COMBO") applyMissingComboPreset();
    else if (formType === "TB")
      applyMissingTBPreset(); // Thêm trường hợp Kệ Bàn Chải
    else PA.toast("Không nhận diện được form để áp preset!", false);
  }); // `: Preset "Đuôi sản phẩm" (chỉ cho POG)

  PA.hotkey("`", () => {
    const formType = detectFormType();
    if (formType === "POG") {
      applyTailPreset_POG();
    } else {
      PA.toast("Preset 'Đuôi SP' chỉ dành cho kệ POG.", false);
    }
  }); // F: Focus form (tùy theo context)

  PA.hotkey("f", () => {
    const formType = detectFormType();
    let prefer;
    if (formType === "POG") {
      prefer = [IDS_POG.facings, IDS_POG.columns, IDS_COMMON.note1];
    } else if (formType === "COMBO") {
      prefer = [IDS_COMBO.comboShelves, IDS_COMMON.note1, IDS_COMMON.note2];
    } else if (formType === "TB") {
      prefer = [IDS_TB.tbShelves, IDS_TB.tbFacingTB, IDS_COMMON.note1]; // Thêm trường hợp Kệ Bàn Chải
    } else {
      return PA.toast("Không tìm thấy form để focus", false);
    }
    const el = prefer
      .map(PA.find)
      .find((x) => x && !x.disabled && x.offsetParent !== null);
    if (!el) return PA.toast("Không tìm thấy control để focus", false);
    PA.focus(el);
  }); // Q, G, H: Các hotkey chung

  PA.hotkey("q", applyNote3AndSave);
  PA.hotkey("g", () => PA.focus(IDS_COMMON.showImg));
  PA.hotkey("h", () => PA.focus(IDS_COMMON.imgZoom));

  console.log(
    "%cSC POG/Combo/TB Unified Script loaded!",
    "color: #10b981; font-weight: bold;"
  );
})();
