// CalculadoraMadera.jsx - versión sin gráfico ni columna de filas
import React, { useMemo, useState, useRef } from "react";
import "./CalculadoraMadera.css";
import html2canvas from "html2canvas";

const BF_K = 0.2734;

// 💰 Precios base
const PRECIO_TIRANTE_CORTO = 429;   // Precio por pie hasta 4,5 m
const PRECIO_TIRANTE_LARGO = 1000;  // Precio por pie mayor a 4,5 m
const EXTRA_CEPILLADO = 160;        // Extra por pie si se elige cepillado

// 🔢 Factores de conversión
const M2_TO_BF = 11;                  
const FACTOR_ANCHO_LARGO = 11;        

// --- Funciones auxiliares ---
function toNum(v, def = 0) {
  if (v === "" || v === null || v === undefined) return def;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : def;
}

function bfCalc(thicknessIn, widthIn, lengthM) {
  const t = Math.max(0, toNum(thicknessIn));
  const w = Math.max(0, toNum(widthIn));
  const L = Math.max(0, toNum(lengthM));
  return t * w * L * BF_K;
}

// --- Componente principal ---
export default function CalculadoraMadera() {
  const [items, setItems] = useState([
    {
      id: 1,
      tipo: "pieza",
      t: "2",
      w: "3",
      L: "2",
      qty: "1",
      m2: "",
      anchoM: "",
      largoM: "",
      cepillado: false,
    },
  ]);

  const exportRef = useRef(null);

  const guardarComoImagen = () => {
    if (!exportRef.current) return;
    html2canvas(exportRef.current).then((canvas) => {
      const link = document.createElement("a");
      link.download = "presupuesto-maderas.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  const addItem = (tipo = "pieza") => {
    const id = Math.max(0, ...items.map((i) => i.id)) + 1;
    setItems([
      ...items,
      {
        id,
        tipo,
        t: "2",
        w: "3",
        L: "2",
        qty: "1",
        m2: "",
        anchoM: "",
        largoM: "",
        cepillado: false,
      },
    ]);
  };

  const duplicateItem = (id) => {
    const src = items.find((i) => i.id === id);
    if (!src) return;
    const nid = Math.max(0, ...items.map((i) => i.id)) + 1;
    setItems([...items, { ...src, id: nid }]);
  };

  const removeItem = (id) => setItems(items.filter((i) => i.id !== id));

  const updateItem = (id, key, value) => {
    setItems(
      items.map((i) =>
        i.id === id
          ? {
              ...i,
              [key]: key === "cepillado" ? !!value : value,
            }
          : i
      )
    );
  };

  // --- Cálculo principal ---
  const rows = useMemo(() => {
    return items.map((i) => {
      if (i.tipo === "pieza") {
        const bfUnidad = bfCalc(i.t, i.w, i.L);
        const bfTotal = bfUnidad * Math.max(0, toNum(i.qty, 0));
        const Lnum = toNum(i.L, 0);
        const esLargo = Lnum > 4.5;
        const precioPorPie = esLargo ? PRECIO_TIRANTE_LARGO : PRECIO_TIRANTE_CORTO;
        const costo =
          bfTotal * precioPorPie +
          (i.cepillado ? bfTotal * EXTRA_CEPILLADO : 0);
        return { ...i, bfUnidad, bfTotal, costo, esLargo };
      }
      if (i.tipo === "m2") {
        const m2 = Math.max(0, toNum(i.m2, 0));
        const bfUnidad = m2 * M2_TO_BF;
        const bfTotal = bfUnidad;
        const costo =
          bfTotal * PRECIO_TIRANTE_CORTO +
          (i.cepillado ? bfTotal * EXTRA_CEPILLADO : 0);
        return { ...i, bfUnidad, bfTotal, costo };
      }
      const a = Math.max(0, toNum(i.anchoM, 0));
      const l = Math.max(0, toNum(i.largoM, 0));
      const m2 = a * l;
      const bfUnidad = m2 * FACTOR_ANCHO_LARGO;
      const bfTotal = bfUnidad;
      const costo =
        bfTotal * PRECIO_TIRANTE_CORTO +
        (i.cepillado ? bfTotal * EXTRA_CEPILLADO : 0);
      return { ...i, bfUnidad, bfTotal, costo, m2 };
    });
  }, [items]);

  const totales = useMemo(() => {
    const bf = rows.reduce((acc, r) => acc + r.bfTotal, 0);
    const costo = rows.reduce((acc, r) => acc + r.costo, 0);
    return { bf, costo };
  }, [rows]);

  const fecha = new Date().toLocaleDateString("es-AR");

  // --- Render ---
  return (
    <div className="calculadora-container">
      <header className="header">
        <img src="/logo.jpg" alt="Casas Nativa" className="logo" />
        <h1>Presupuesto de Madera</h1>
        <p>Calculá pies y costo estimado por pieza, m² o ancho/largo.</p>
      </header>

      <div ref={exportRef} className="export-box">
        <div className="export-header">
          <span>Fecha: {fecha}</span>
        </div>

        <table className="tabla-compacta">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>
                Dimensiones <br /> (Esp.× Ancho × Largo × Cant)
              </th>
              <th>Cepillado</th>
              <th>Pies</th>
              <th>Costo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <select
                    value={r.tipo}
                    onChange={(e) => updateItem(r.id, "tipo", e.target.value)}
                  >
                    <option value="pieza">Pieza</option>
                    <option value="m2">m²</option>
                    <option value="ancho_largo">Ancho/Largo</option>
                  </select>
                </td>
                <td>
                  {r.tipo === "pieza" && (
                    <>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={r.t}
                        onChange={(e) => updateItem(r.id, "t", e.target.value)}
                        className="espesor"
                      />{" "}
                      ×
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={r.w}
                        onChange={(e) => updateItem(r.id, "w", e.target.value)}
                        className="ancho"
                      />{" "}
                      ×
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={r.L}
                        onChange={(e) => updateItem(r.id, "L", e.target.value)}
                        className="largo"
                      />{" "}
                      m ×
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={r.qty}
                        onChange={(e) => updateItem(r.id, "qty", e.target.value)}
                        className="cantidad"
                      />{" "}
                      u
                    </>
                  )}
                  {r.tipo === "m2" && (
                    <>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={r.m2}
                        onChange={(e) => updateItem(r.id, "m2", e.target.value)}
                        className="m2"
                      />{" "}
                      m²
                    </>
                  )}
                  {r.tipo === "ancho_largo" && (
                    <>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={r.anchoM}
                        onChange={(e) =>
                          updateItem(r.id, "anchoM", e.target.value)
                        }
                        className="anchoM"
                      />{" "}
                      m ×
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={r.largoM}
                        onChange={(e) =>
                          updateItem(r.id, "largoM", e.target.value)
                        }
                        className="largoM"
                      />{" "}
                      m
                    </>
                  )}
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={r.cepillado}
                    onChange={(e) =>
                      updateItem(r.id, "cepillado", e.target.checked)
                    }
                  />
                </td>
                <td>{r.bfTotal.toFixed(2)}</td>
                <td>${r.costo.toFixed(2)}</td>
                <td>
                  <button onClick={() => duplicateItem(r.id)}>⧉</button>
                  <button onClick={() => removeItem(r.id)}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totales">
          <strong>
            Total: {totales.bf.toFixed(2)} pies | ${totales.costo.toFixed(2)}
          </strong>
        </div>

        <p className="detalle">
          ⚠️ Tirantes hasta 4,5 m → ${PRECIO_TIRANTE_CORTO}/pie | Tirantes
          mayores a 4,5 m → ${PRECIO_TIRANTE_LARGO}/pie | Extra cepillado:{" "}
          {EXTRA_CEPILLADO}/pie | Equivalencias: m² × {M2_TO_BF} (modo m²) |
          Ancho×Largo × {FACTOR_ANCHO_LARGO} (modo ancho/largo)
        </p>
      </div>

      <div className="acciones">
        <button onClick={() => addItem("pieza")}>+ Pieza</button>
        <button onClick={() => addItem("m2")}>+ m²</button>
        <button onClick={() => addItem("ancho_largo")}>+ Ancho/Largo</button>
        <button onClick={guardarComoImagen}>Guardar como imagen</button>
      </div>

      <footer className="footer">
        <p>
          Fórmula: pies = Espesor × Ancho × Largo × 0.2734 | Precios base:{" "}
          {PRECIO_TIRANTE_CORTO} (corto) y {PRECIO_TIRANTE_LARGO} (largo) +{" "}
          {EXTRA_CEPILLADO} si es cepillado.
        </p>
        <p>Casas Nativa · División Maderas</p>
        <p>
          WhatsApp:{" "}
          <a
            href="https://wa.me/543751567045"
            target="_blank"
            rel="noopener noreferrer"
          >
            +54 9 3751 56-7045
          </a>
        </p>
        <p>
          <a href="https://facebook.com/casasnativa">Facebook</a> ·{" "}
          <a href="https://instagram.com/casas.nativa">Instagram</a>
        </p>
        <p>
          Otros productos:{" "}
          <a href="https://www.nativahomedeco.com.ar">
            nativahomedeco.com.ar
          </a>{" "}
          · <a href="https://instagram.com/nativahomedeco">@nativahomedeco</a>
        </p>
      </footer>
    </div>
  );
}
