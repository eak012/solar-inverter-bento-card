/* Solar Inverter Bento Card
 * Version: 1.1.0 (hero removed - tiles only, per user request)
 * Custom Lovelace card: minimal bento-style monitoring for micro inverters.
 */

const LIVE_THRESHOLD_W = 0.5;

const DEFAULT_INVERTERS = [
  {
    name: "Micro SG600",
    rated_power: 600,
    entity_ac_power: "sensor.smart_inverter_power",
    entity_ac_voltage: "sensor.smart_inverter_ac_voltage",
    entity_ac_current: "sensor.smart_inverter_ac_current",
    entity_pv_power: "sensor.smart_inverter_dc_power",
    entity_pv_voltage: "sensor.smart_inverter_dc_voltage",
    entity_pv_current: "sensor.smart_inverter_dc_current",
  },
  {
    name: "Micro BFAD",
    rated_power: 800,
    entity_ac_power: "sensor.solar_inverter_800w_ac_active_power",
    entity_ac_voltage: "sensor.solar_inverter_800w_ac_voltage_2",
    entity_ac_current: "sensor.solar_inverter_800w_ac_current_2",
    entity_pv_power: "sensor.solar_inverter_800w_pv_power_2",
    entity_pv_voltage: "sensor.solar_inverter_800w_pv_dc_voltage",
    entity_pv_current: "sensor.solar_inverter_800w_pv_dc_current",
  },
];

function cloneDefaultInverters() {
  return JSON.parse(JSON.stringify(DEFAULT_INVERTERS));
}

function numOrNull(hass, entityId) {
  if (!hass || !entityId) return null;
  const st = hass.states[entityId];
  if (!st || st.state == null) return null;
  const v = parseFloat(st.state);
  return Number.isFinite(v) ? v : null;
}

function fmtW(v) {
  return v == null ? "—" : String(Math.round(v));
}
function fmtV(v) {
  return v == null ? "—" : String(parseFloat(v.toFixed(1)));
}
function fmtA(v) {
  return v == null ? "—" : String(parseFloat(v.toFixed(2)));
}

class SolarInverterBentoCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("solar-inverter-bento-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:solar-inverter-bento-card",
      name: "Solar Inverters",
      inverters: cloneDefaultInverters(),
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    const inverters = Array.isArray(config.inverters) && config.inverters.length
      ? config.inverters
      : cloneDefaultInverters();
    this._config = {
      name: config.name || "Solar Inverters",
      inverters: inverters.map((inv) => ({
        name: inv.name || "Inverter",
        rated_power: inv.rated_power != null ? Number(inv.rated_power) : 0,
        entity_ac_power: inv.entity_ac_power || "",
        entity_ac_voltage: inv.entity_ac_voltage || "",
        entity_ac_current: inv.entity_ac_current || "",
        entity_pv_power: inv.entity_pv_power || "",
        entity_pv_voltage: inv.entity_pv_voltage || "",
        entity_pv_current: inv.entity_pv_current || "",
      })),
    };
    this._lastSnap = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    // Re-render only when a displayed value actually changed.
    const snap = JSON.stringify(
      this._config.inverters.map((inv) =>
        ["entity_ac_power", "entity_ac_voltage", "entity_ac_current",
         "entity_pv_power", "entity_pv_voltage", "entity_pv_current"]
          .map((k) => {
            const s = hass.states[inv[k]];
            return s ? s.state : null;
          })
      )
    );
    if (snap !== this._lastSnap) {
      this._lastSnap = snap;
      this._render();
    }
  }

  getCardSize() {
    return 3;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const hass = this._hass;
    const cfg = this._config;

    const tiles = cfg.inverters.map((inv) => {
      const ac = numOrNull(hass, inv.entity_ac_power);
      const acV = numOrNull(hass, inv.entity_ac_voltage);
      const acA = numOrNull(hass, inv.entity_ac_current);
      const pv = numOrNull(hass, inv.entity_pv_power);
      const pvV = numOrNull(hass, inv.entity_pv_voltage);
      const pvA = numOrNull(hass, inv.entity_pv_current);
      const live = ac != null && ac > LIVE_THRESHOLD_W;
      const rated = inv.rated_power > 0 ? inv.rated_power : 0;
      const pct = rated > 0 && ac != null ? Math.max(0, Math.min(100, (ac / rated) * 100)) : 0;
      return { inv, ac, acV, acA, pv, pvV, pvA, live, rated, pct };
    });

    const tilesHtml = tiles.map((t) => `
      <div class="tile" data-entity="${t.inv.entity_ac_power || ""}">
        <div class="tile-top">
          <span class="tile-name">${t.inv.name}</span>
          <span class="live${t.live ? "" : " off"}"><span class="dot"></span>${t.live ? "Live" : "Idle"}</span>
        </div>
        <div class="tile-power">${fmtW(t.ac)} <small>W</small></div>
        ${t.rated > 0 ? `<div class="bar"><i style="width: ${t.pct.toFixed(1)}%"></i></div>` : ""}
        <div class="stats">
          <div class="stat"><div class="k">PV</div><div class="v">${fmtW(t.pv)}<small>W</small></div></div>
          <div class="stat"><div class="k">Volt</div><div class="v">${fmtV(t.pvV || t.acV)}<small>V</small></div></div>
          <div class="stat"><div class="k">Amp</div><div class="v">${fmtA(t.pvA || t.acA)}<small>A</small></div></div>
        </div>
      </div>
    `).join("");

    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
          font-family: var(--paper-font-body1_-_font-family, inherit);
        }
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }
        .tile {
          background: var(--secondary-background-color, rgba(125, 125, 125, 0.08));
          border: 1px solid var(--divider-color, rgba(125, 125, 125, 0.2));
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .tile:active {
          transform: scale(0.98);
        }
        .tile-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .tile-name {
          font-weight: 600;
          font-size: 0.95em;
          color: var(--primary-text-color);
        }
        .live {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.78em;
          font-weight: 500;
          color: var(--success-color, #67c23a);
        }
        .live .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }
        .live.off {
          color: var(--secondary-text-color);
        }
        .tile-power {
          font-size: 1.9em;
          font-weight: 700;
          line-height: 1.1;
          color: var(--primary-text-color);
          font-variant-numeric: tabular-nums;
          margin: 2px 0 10px;
        }
        .tile-power small, .stat .v small {
          font-size: 0.55em;
          font-weight: 500;
          color: var(--secondary-text-color);
          margin-left: 1px;
        }
        .bar {
          height: 6px;
          border-radius: 3px;
          background: var(--divider-color, rgba(125, 125, 125, 0.25));
          overflow: hidden;
          margin-bottom: 12px;
        }
        .bar > i {
          display: block;
          height: 100%;
          border-radius: 3px;
          background: var(--success-color, #67c23a);
          transition: width 0.6s ease;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }
        .stat .k {
          font-size: 0.68em;
          color: var(--secondary-text-color);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 1px;
        }
        .stat .v {
          font-size: 0.92em;
          font-weight: 600;
          color: var(--primary-text-color);
          font-variant-numeric: tabular-nums;
        }
      </style>

      <ha-card>
        <div class="bento-grid">${tilesHtml}</div>
      </ha-card>
    `;

    this.shadowRoot.querySelectorAll(".tile").forEach((el) => {
      el.addEventListener("click", () => {
        const entityId = el.dataset.entity;
        if (!entityId) return;
        this.dispatchEvent(
          new CustomEvent("hass-more-info", {
            detail: { entityId },
            bubbles: true,
            composed: true,
          })
        );
      });
    });
  }
}

class SolarInverterBentoCardEditor extends HTMLElement {
  setConfig(config) {
    const stub = SolarInverterBentoCard.getStubConfig();
    const inverters = Array.isArray(config.inverters) && config.inverters.length
      ? config.inverters.concat(cloneDefaultInverters()).slice(0, 2)
      : cloneDefaultInverters();
    // Keep any extra inverters beyond the two editable slots untouched.
    this._extra = Array.isArray(config.inverters) ? config.inverters.slice(2) : [];
    this._config = { ...stub, ...config, inverters };
    this._render();
  }

  set hass(hass) {
    const firstHass = !this._hass;
    this._hass = hass;
    if (this._config && firstHass) this._render();
  }

  _emit() {
    const inverters = this._config.inverters.concat(this._extra || []);
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: { ...this._config, inverters } },
        bubbles: true,
        composed: true,
      })
    );
  }

  _valueChanged(field, value) {
    this._config = { ...this._config, [field]: value };
    this._emit();
  }

  _invChanged(idx, field, value) {
    const inverters = this._config.inverters.map((inv, i) =>
      i === idx ? { ...inv, [field]: value } : inv
    );
    this._config = { ...this._config, inverters };
    this._emit();
  }

  _invFields(idx, inv) {
    const p = `inv${idx}`;
    const rows = [
      ["entity_ac_power", "AC Power entity (W)"],
      ["entity_ac_voltage", "AC Voltage entity (V)"],
      ["entity_ac_current", "AC Current entity (A)"],
      ["entity_pv_power", "PV Power entity (W)"],
      ["entity_pv_voltage", "PV Voltage entity (V)"],
      ["entity_pv_current", "PV Current entity (A)"],
    ];
    return `
      <div class="inv-block">
        <div class="inv-head">Inverter ${idx + 1}</div>
        <div class="two-col">
          <div class="row">
            <label>Name</label>
            <input id="${p}_name" type="text" value="${inv.name || ""}" />
          </div>
          <div class="row">
            <label>Rated power (W) — for the bar</label>
            <input id="${p}_rated" type="number" min="0" step="1" value="${inv.rated_power ?? ""}" />
          </div>
        </div>
        ${rows.map(([f, label]) => `
          <div class="row">
            <label>${label}</label>
            <input id="${p}_${f}" type="text" list="sensor-options" value="${inv[f] || ""}" placeholder="sensor..." />
          </div>
        `).join("")}
      </div>
    `;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const cfg = this._config;
    const [inv0, inv1] = cfg.inverters;

    this.shadowRoot.innerHTML = `
      <style>
        .row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
        label { font-size: 0.85em; color: var(--secondary-text-color); }
        input { padding: 6px; border-radius: 4px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); }
        .two-col { display: flex; gap: 12px; }
        .two-col .row { flex: 1; }
        .inv-block { border: 1px solid var(--divider-color); border-radius: 8px; padding: 12px; margin-bottom: 12px; }
        .inv-head { font-weight: 600; font-size: 0.9em; margin-bottom: 10px; color: var(--primary-text-color); }
        .hint { font-size: 0.8em; color: var(--secondary-text-color); margin-top: 4px; }
      </style>
      <div class="row">
        <label>Card name</label>
        <input id="name" type="text" value="${cfg.name || ""}" />
      </div>
      ${this._invFields(0, inv0 || {})}
      ${this._invFields(1, inv1 || {})}
      <datalist id="sensor-options">${this._sensorOptions()}</datalist>
      <div class="hint">แก้ไขได้ 2 เครื่องใน editor — ถ้ามีเครื่องที่ 3 ขึ้นไป เพิ่มผ่าน YAML ได้ (inverters: [...])</div>
    `;

    const $ = (id) => this.shadowRoot.getElementById(id);
    $("name").addEventListener("change", (e) => this._valueChanged("name", e.target.value));
    [0, 1].forEach((idx) => {
      const p = `inv${idx}`;
      const numFields = ["rated_power"];
      $(`${p}_name`).addEventListener("change", (e) => this._invChanged(idx, "name", e.target.value));
      $(`${p}_rated`).addEventListener("change", (e) => this._invChanged(idx, "rated_power", Number(e.target.value) || 0));
      ["entity_ac_power", "entity_ac_voltage", "entity_ac_current",
       "entity_pv_power", "entity_pv_voltage", "entity_pv_current"].forEach((f) => {
        $(`${p}_${f}`).addEventListener("change", (e) => this._invChanged(idx, f, e.target.value.trim()));
      });
    });
  }

  _sensorOptions() {
    if (!this._hass) return "";
    return Object.keys(this._hass.states)
      .filter((id) => id.startsWith("sensor."))
      .sort()
      .map((id) => `<option value="${id}"></option>`)
      .join("");
  }
}

customElements.define("solar-inverter-bento-card", SolarInverterBentoCard);
customElements.define("solar-inverter-bento-card-editor", SolarInverterBentoCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "solar-inverter-bento-card",
  name: "Solar Inverter Bento Card",
  description: "Minimal bento-style monitoring card for solar micro inverters with capacity bars.",
});
