/*
PA mini helper — v0.1
Tính năng chính:
- PA.find(spec): tìm phần tử theo id/name/label/placeholder/text/CSS
- PA.focus(spec): focus + scroll + highlight
- PA.set(spec, value): set value cho input/textarea/select/checkbox/radio (hỗ trợ chọn option theo text)
- PA.hotkey(key, handler, opts)
- PA.hotkeyFocus(key, spec, opts)
- PA.hotkeySet(key, spec, value, opts)
- PA.palette(): mở hộp tìm kiếm nhanh (/) — gõ truy vấn để focus hoặc set

Cách nhúng: copy file này dán vào console, userscript, hay <script> riêng.
*/
(function () {
  if (window.PA) return; // tránh nạp 2 lần // ====== utils ======

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
  }; // ====== core finders ======

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
      const s = (el.textContent || "").trim();
      if (s && u.includes(s, text)) return el;
    }
    return null;
  }
  function byLabel(label) {
    // 1) label[for]
    const labs = u.$all("label[for]");
    const hit = labs.find((l) => u.includes(l.textContent, label));
    if (hit) {
      return byId(hit.getAttribute("for"));
    } // 2) label bao quanh control
    const labs2 = u.$all("label");
    for (const l of labs2) {
      if (u.includes(l.textContent, label)) {
        const el = l.querySelector("input,select,textarea");
        if (el) return el;
      }
    } // 3) gần kề
    const cand = u.$all("input,select,textarea");
    for (const el of cand) {
      const pr =
        el.closest("div,td,th,li,section,._group,.row") || el.parentElement;
      if (!pr) continue;
      const txt = (pr.textContent || "").trim();
      if (txt && u.includes(txt, label)) return el;
    }
    return null;
  } // spec: string CSS | {id|name|label|placeholder|text|aria|css}

  function find(spec) {
    if (!spec) return null;
    if (typeof spec === "string") {
      if (spec.startsWith("#")) return byCSS(spec);
      if (spec.includes(" ") || spec.includes(".") || spec.includes("["))
        return byCSS(spec); // chuỗi ngắn coi như label
      return byLabel(spec) || byText(spec) || byCSS(spec);
    }
    if (spec.id) return byId(spec.id);
    if (spec.name) return byName(spec.name);
    if (spec.label) return byLabel(spec.label);
    if (spec.placeholder) return byPlaceholder(spec.placeholder);
    if (spec.text) return byText(spec.text);
    if (spec.aria) return byAriaLabel(spec.aria);
    if (spec.css) return byCSS(spec.css);
    return null;
  } // ====== actions ======

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
    u.toast("Đã focus");
    return true;
  }

  function set(spec, value) {
    const el = spec?.nodeType ? spec : find(spec);
    if (!el) {
      u.toast("Không tìm thấy phần tử để set", false);
      return false;
    }
    const tag = (el.tagName || "").toLowerCase();
    const type = (el.type || "").toLowerCase();
    if (tag === "select") {
      const v = value == null ? "" : String(value); // chọn theo value trước, nếu không có thì theo text hiển thị (fuzzy)
      let opt = Array.from(el.options).find((o) => String(o.value) === v);
      if (!opt)
        opt = Array.from(el.options).find((o) =>
          u.includes(o.textContent || "", v)
        );
      if (opt) {
        el.value = opt.value;
        u.fire(el);
        u.hi(el, "#10b981");
        u.toast(`Đã chọn: ${opt.textContent?.trim() || opt.value}`);
        return true;
      }
      u.toast("Không khớp option", false);
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
      u.toast("Đã set giá trị");
      return true;
    }
    u.toast("Phần tử không hỗ trợ set giá trị", false);
    return false;
  }

  function clickSave(labels = ["save", "lưu"]) {
    const btns = u.$all(
      'button, input[type="button"], input[type="submit"], [role="button"]'
    );
    const btn = btns.find((el) =>
      labels.some((lb) => u.includes(el.value || el.textContent || "", lb))
    );
    if (btn) {
      btn.click();
      u.toast("Đã bấm Save");
      return true;
    }
    u.toast("Không tìm thấy nút Save", false);
    return false;
  } // ====== hotkeys ======

  const _hotkeys = new Map();
  function hotkey(key, handler, opts = {}) {
    const k = key.toLowerCase();
    _hotkeys.set(k, { handler, opts });
    return api;
  }
  function hotkeyFocus(key, spec, opts = {}) {
    return hotkey(key, () => focus(spec), opts);
  }
  function hotkeySet(key, spec, value, opts = {}) {
    return hotkey(key, () => set(spec, value), opts);
  }

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return; // chỉ nhận single-key
      const k = (e.key || "").toLowerCase();
      const item = _hotkeys.get(k);
      if (!item) return;
      if (!item.opts?.whenTyping && u.isEditableTarget(e)) return; // tránh cản trở khi đang gõ
      e.preventDefault();
      try {
        item.handler(e);
      } catch (err) {
        console.error(err);
        u.toast("Lỗi khi chạy hotkey", false);
      }
    },
    true
  ); // ====== quick palette (/) ======

  let paletteOpen = false;
  function palette() {
    if (paletteOpen) return;
    paletteOpen = true;
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,.25)",
      zIndex: 2147483646,
    });
    const box = document.createElement("div");
    Object.assign(box.style, {
      position: "absolute",
      left: "50%",
      top: "15%",
      transform: "translateX(-50%)",
      width: "min(720px, 92vw)",
      background: "#111827",
      color: "#fff",
      padding: "12px",
      borderRadius: "10px",
      boxShadow: "0 10px 30px rgba(0,0,0,.3)",
    });
    const ip = document.createElement("input");
    ip.type = "text";
    ip.placeholder =
      "nhập: #id | .class | label:Note 1 | name:foo | text:Lưu | css:...  — thêm =giá trị để set";
    Object.assign(ip.style, {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #374151",
      borderRadius: "8px",
      background: "#111",
      color: "#fff",
      outline: "none",
    });
    box.appendChild(ip);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    ip.focus();

    function close() {
      paletteOpen = false;
      overlay.remove();
    }
    overlay.addEventListener("click", (ev) => {
      if (ev.target === overlay) close();
    });
    window.addEventListener("keydown", escClose, { once: true });
    function escClose(e) {
      if (e.key === "Escape") {
        close();
      }
    }

    ip.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const raw = ip.value.trim();
        if (!raw) return; // parse dạng: "query = value"
        const [q, ...rest] = raw.split("=");
        const val = rest.join("=").trim();
        let spec;
        if (q.startsWith("#") || q.startsWith(".") || q.startsWith("css:"))
          spec = { css: q.replace(/^css:/, "").trim() };
        else if (q.startsWith("label:"))
          spec = { label: q.replace(/^label:/, "").trim() };
        else if (q.startsWith("name:"))
          spec = { name: q.replace(/^name:/, "").trim() };
        else if (q.startsWith("text:"))
          spec = { text: q.replace(/^text:/, "").trim() };
        else if (q.startsWith("aria:"))
          spec = { aria: q.replace(/^aria:/, "").trim() };
        else if (q.startsWith("ph:") || q.startsWith("placeholder:"))
          spec = { placeholder: q.replace(/^ph:|^placeholder:/, "").trim() };
        else if (q.startsWith("#")) spec = { css: q };
        else spec = { label: q };
        if (val) {
          set(spec, val);
        } else {
          focus(spec);
        }
        e.preventDefault();
        close();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        overlay.remove();
        paletteOpen = false;
      }
    });
  }
  window.addEventListener(
    "keydown",
    (e) => {
      if (u.isEditableTarget(e)) return;
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        if ((e.key || "").toLowerCase() === "/") {
          e.preventDefault();
          palette();
        }
      }
    },
    true
  );

  const api = {
    find,
    focus,
    set,
    toast: u.toast, // <-- DÒNG ĐƯỢC THÊM VÀO ĐỂ FIX LỖI
    hotkey,
    hotkeyFocus,
    hotkeySet,
    clickSave,
    palette,
    _u: u,
  };
  Object.defineProperty(api, "version", { value: "0.1" });
  window.PA = api; // ====== ví dụ cấu hình (có thể xóa) ====== // Q: set Note 3 = "Ảnh chấm thuộc Phase 3" rồi bấm Save

  PA.hotkey("q", () => {
    const ok = PA.set({ label: "Note 3" }, "Ảnh chấm thuộc Phase 3");
    if (ok) PA.clickSave();
  }); // F: focus nhanh vào 1 control, G: focus #show_img, H: focus #imgzoomed
  PA.hotkeyFocus("f", { label: "POG: Number of facings" });
  PA.hotkeyFocus("g", { id: "show_img" });
  PA.hotkeyFocus("h", { id: "imgzoomed" });

  console.log(
    "%cPA mini helper v0.1 loaded",
    "padding:2px 6px;background:#111;color:#0f0;border-radius:4px"
  );
})();
