(() => {
  // Chỉ chạy trên trang Photo Audit SC
  if (!/TradeProgramViewPhoto_SC\.aspx/i.test(location.href)) return;

  // ====== Khai báo các trường của Photo Audit SC ======
  const IDS = {
    // POG (SC)
    facings: { id: "condition_15492" }, // Integer
    columns: { id: "condition_15493" }, // Integer
    trayTB: { id: "condition_15494" }, // Integer
    cdc: { id: "condition_15495" }, // Combobox (CDC 180/225)
    mf: { id: "condition_15496" }, // Combobox (MF 180/225)
    tb: { id: "condition_15497" }, // Combobox (TB)
    // Notes & Fake
    note1: { id: "condition_15515" }, // Combobox
    note2: { id: "condition_15516" }, // Text
    note3: { id: "condition_15517" }, // Combobox
    fake: { id: "condition_15491" }, // Combobox (Hình Fake?)
    // Khu ảnh
    showImg: { id: "show_img" },
    imgZoom: { id: "imgzoomed" },
  };

  // ====== Tiện ích nhỏ sử dụng PA ======
  function isPlaceholderSelect(spec) {
    const sel = PA.find(spec);
    if (!sel || sel.tagName !== "SELECT") return false;
    const t = (sel.selectedOptions?.[0]?.textContent || "").trim();
    return !t || /select|----/i.test(t);
  }

  // ====== Preset 1: “Trưng bày đuôi sản phẩm” (key: `) ======
  function applyTailPreset_SC() {
    let changed = 0;
    changed += PA.set(IDS.facings, 0) ? 1 : 0;
    changed += PA.set(IDS.columns, 0) ? 1 : 0;
    changed += PA.set(IDS.fake, "No") ? 1 : 0;

    const TAIL = "Trưng bày đuôi sản phẩm";
    if (isPlaceholderSelect(IDS.note1)) {
      // chọn từ combobox Note 1 theo text
      changed += PA.set(IDS.note1, TAIL) ? 1 : 0;
    } else {
      changed += PA.set(IDS.note2, TAIL) ? 1 : 0;
    }
    PA.toast(
      changed
        ? `SC: áp preset 'đuôi SP' (${changed} trường)`
        : "Không sửa được trường nào (SC)",
      !!changed
    );
  }

  // ====== Preset 2: “Thiếu hình kệ POG” (key: D) ======
  function applyMissingPOG_SC() {
    let changed = 0;
    changed += PA.set(IDS.fake, "No") ? 1 : 0; // Hình Fake? = No
    changed += PA.set(IDS.facings, 0) ? 1 : 0; // POG: Number of facings = 0
    changed += PA.set(IDS.columns, 0) ? 1 : 0; // Number of Columns = 0
    changed += PA.set(IDS.trayTB, 0) ? 1 : 0; // POG: Tray/Mini Rack TB = 0
    changed += PA.set(IDS.cdc, "No") ? 1 : 0; // CDC = No
    changed += PA.set(IDS.mf, "No") ? 1 : 0; // MF  = No
    changed += PA.set(IDS.tb, "No") ? 1 : 0; // TB  = No

    const TEXT = "Thiếu hình kệ POG";
    if (isPlaceholderSelect(IDS.note1)) {
      changed += PA.set(IDS.note1, TEXT) ? 1 : 0;
    } else {
      changed += PA.set(IDS.note2, TEXT) ? 1 : 0;
    }
    PA.toast(
      changed
        ? `SC: áp preset 'Thiếu hình kệ POG' (${changed} trường)`
        : "Không sửa được trường nào (SC)",
      !!changed
    );
  }

  // ====== Q: đặt Note 3 + Save (key: Q) ======
  const NOTE3_TEXT = "Ảnh chấm thuộc Phase 3";
  function applyNote3AndSave_SC() {
    const okSet = PA.set(IDS.note3, NOTE3_TEXT);
    const okSave = PA.clickSave();
    PA.toast(
      okSet
        ? `SC: Note 3 = "${NOTE3_TEXT}" và ${
            okSave ? "đã bấm Save" : "không thấy nút Save"
          }`
        : `Không gán được Note 3`,
      okSet && okSave
    );
  }

  // ====== Focus nhanh ======
  function focusForm_SC() {
    // ưu tiên theo thứ tự
    const prefer = [IDS.facings, IDS.columns, IDS.note1, IDS.note2];
    const el =
      prefer
        .map(PA.find)
        .find((x) => x && !x.disabled && x.offsetParent !== null) ||
      document.querySelector(
        "#LoadLevel select, #LoadLevel input, .CSS_Condition select, .CSS_Condition input"
      );
    if (!el) return PA.toast("Không tìm thấy control để focus", false);
    PA.focus(el);
    PA.toast("Đã focus vào form SC");
  }

  function focusShowImg_SC() {
    const ok = PA.focus(IDS.showImg);
    PA.toast(ok ? "Đã focus #show_img" : "Không tìm thấy #show_img", !!ok);
  }

  function focusImgZoom_SC() {
    const ok = PA.focus(IDS.imgZoom);
    PA.toast(ok ? "Đã focus #imgzoomed" : "Không tìm thấy #imgzoomed", !!ok);
  }

  // ====== Gắn hotkeys “một phím” (không giữ Ctrl/Alt/Shift) ======
  // ` : preset đuôi SP
  PA.hotkey("`", applyTailPreset_SC);

  // D : preset “Thiếu hình kệ POG”
  PA.hotkey("d", applyMissingPOG_SC);

  // F : focus form SC
  PA.hotkey("f", focusForm_SC);

  // G : bỏ focus form và focus #show_img
  PA.hotkey("g", focusShowImg_SC);

  // H : focus vào ảnh zoom
  PA.hotkey("h", focusImgZoom_SC);

  // Q : Note3 + Save
  PA.hotkey("q", applyNote3AndSave_SC);

  // ====== Chống postback/partial update của ASP.NET: rebind khi DOM đổi ======
  // (PA.hotkey đã tự bắt global keydown, nhưng nếu field re-render, ta vẫn tìm theo ID/label mỗi lần chạy handler nên OK.
  //  Dưới đây chỉ là ví dụ nếu bạn muốn theo dõi #LoadLevel để làm gì thêm.)
  const host = document.getElementById("LoadLevel") || document.body;
  const mo = new MutationObserver(() => {
    /* có thể refresh gì đó nếu cần */
  });
  mo.observe(host, { childList: true, subtree: true });
})();
