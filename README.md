# Solar Inverter Bento Card

Minimal bento-style Lovelace card for monitoring solar micro inverters in Home Assistant. A hero strip shows total live AC output, and each inverter gets its own tile with a capacity bar and PV / voltage / current stats.

## Features

- **Hero total** — combined AC output of all inverters, big and glanceable, with a live/idle indicator
- **Bento tiles** — one tile per inverter: AC watts, capacity bar vs. rated power, and PV / Volt / Amp mini stats
- **Tap a tile** to open the more-info dialog for its AC power entity
- **Theme-aware** — follows your Home Assistant theme (light/dark), monochrome icons with green reserved for live/solar
- **Efficient** — re-renders only when a displayed value actually changes
- **Visual editor** — configure names, rated power, and all six entities per inverter without YAML (up to 2 inverters in the editor; more via YAML)

## Installation (HACS)

1. In HACS, go to **Frontend** → ⋮ menu → **Custom repositories**
2. Add your repository URL with category **Lovelace**
3. Click **Install**, then add the card from the dashboard UI — search for *Solar Inverter Bento Card*

## Configuration

All options are available in the visual editor. YAML equivalent:

```yaml
type: custom:solar-inverter-bento-card
name: Solar Inverters
inverters:
  - name: Micro SG600
    rated_power: 600 # bar = AC power / rated power (0 hides the bar)
    entity_ac_power: sensor.smart_inverter_power
    entity_ac_voltage: sensor.smart_inverter_ac_voltage
    entity_ac_current: sensor.smart_inverter_ac_current
    entity_pv_power: sensor.smart_inverter_dc_power
    entity_pv_voltage: sensor.smart_inverter_dc_voltage
    entity_pv_current: sensor.smart_inverter_dc_current
  - name: Micro BFAD
    rated_power: 800
    entity_ac_power: sensor.solar_inverter_800w_ac_active_power
    entity_ac_voltage: sensor.solar_inverter_800w_ac_voltage_2
    entity_ac_current: sensor.solar_inverter_800w_ac_current_2
    entity_pv_power: sensor.solar_inverter_800w_pv_power_2
    entity_pv_voltage: sensor.solar_inverter_800w_pv_dc_voltage
    entity_pv_current: sensor.solar_inverter_800w_pv_dc_current
```

| Option | Description |
|---|---|
| `name` | Card title |
| `inverters[].name` | Tile title |
| `inverters[].rated_power` | Rated AC power (W) for the capacity bar; `0` hides the bar |
| `inverters[].entity_ac_power` | AC output power sensor (W) — also used for the tile total and tap action |
| `inverters[].entity_ac_voltage` | AC voltage sensor (V) |
| `inverters[].entity_ac_current` | AC current sensor (A) |
| `inverters[].entity_pv_power` | PV/DC input power sensor (W) |
| `inverters[].entity_pv_voltage` | PV/DC voltage sensor (V) |
| `inverters[].entity_pv_current` | PV/DC current sensor (A) |

Any entity may be omitted — missing values render as `—`. The Volt/Amp stat prefers the PV sensor and falls back to the AC sensor.

## Notes

- The visual editor supports two inverters; add a third or more through YAML (`inverters:` list).
- An inverter shows **Live** (green) when AC power > 0.5 W, otherwise **Idle** (gray).
