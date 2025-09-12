// CalculadoraMadera.jsx - con exportación a imagen, aclaración y columna tirantes (solo fecha en encabezado)

import React, { useMemo, useState, useRef } from "react";
import "./CalculadoraMadera.css";
import html2canvas from "html2canvas";

const BF_K = 0.2734;
const PRECIO_BRUTO = 429;
const EXTRA_CEPILLADO = 28;
const PRECIO_TIRANTE = 1200; // Precio por pie si largo > 4.5 m

function toNum(v, def = 0) {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : def;
}

function bfCalc(thicknessIn, widthIn, lengthM) {
  const t = Math.max(0, toNum(thicknessIn));
  const w = Math.max(0, toNum(widthIn));
  const L = Math.max(0, toNum(lengthM));
  return t * w * L * BF_K;
}

function MiniDibujo({ wIn, Lm }) {
  const w = Math.max(0.2, toNum(wIn));
  const L = Math.max(0.2, toNum(Lm));

  const maxW = 150;
  const maxH = 50;

  const scaleW = maxW / L;
  const scaleH = maxH / w;
  const scale = Math.min(scaleW, scaleH);

  const rw = L * scale;
  const rh = w * scale;

  return (
    <svg viewBox="0 0 180 90" className="mini-dibujo">
      <rect
        x="10"
        y={40 - rh / 2}
        width={rw}
        height={rh}
        rx="2"
        fill="#bbf7d0"
        stroke="#166534"
        strokeWidth="2"
      />
      <text
        x={10 + rw / 2}
        y={20}
        textAnchor="middle"
        fontSize="10"
        fill="#166534"
      >
        {wIn}" × {Lm} m
      </text>
    </svg>
  );
}

export default function CalculadoraMadera() {
  const [items, setItems] = useState([
    { id: 1, t: 2, w: 3, L: 2, qty: 1, cepillado: false },
  ]);

  const exportRef = useRef(null);

  const guardarComoImagen = () => {
    if (!exportRef.current) return;
    html2canvas(exportRef.current).then(canvas => {
      const link = document.createElement("a");
      link.download = "presupuesto-maderas.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  const addItem = () => {
    const id = Math.max(0, ...items.map(i => i.id)) + 1;
    setItems([...items, { id, t: 2, w: 3, L: 2, qty: 1, cepillado: false }]);
  };

  const duplicateItem = (id) => {
    const src = items.find(i => i.id === id);
    if (!src) return;
    const nid = Math.max(0, ...items.map(i => i.id)) + 1;
    setItems([...items, { ...src, id: nid }]);
  };

  const removeItem = (id) => setItems(items.filter(i => i.id !== id));

  const updateItem = (id, key, value) => {
    setItems(items.map(i =>
      i.id === id ? { ...i, [key]: key === "cepillado" ? !!value : value } : i
    ));
  };

  const rows = useMemo(() => {
    return items.map(i => {
      const bfUnidad = bfCalc(i.t, i.w, i.L);
      const bfTotal = bfUnidad * Math.max(0, toNum(i.qty, 0));

      // Tirante largo
      const esTirante = i.L > 4.5;
      const precioBase = esTirante
        ? PRECIO_TIRANTE
        : PRECIO_BRUTO + (i.cepillado ? EXTRA_CEPILLADO : 0);

      const costo = bfTotal * precioBase;
      return { ...i, bfUnidad, bfTotal, precioBase, costo, esTirante };
    });
  }, [items]);

  const totales = useMemo(() => {
    const bf = rows.reduce((acc, r) => acc + r.bfTotal, 0);
    const costo = rows.reduce((acc, r) => acc + r.costo, 0);
    return { bf, costo };
  }, [rows]);

  const fecha = new Date().toLocaleDateString("es-AR");

  return (
    <div className="calculadora-container">
      <header className="header">
        <img src="/logo.jpg" alt="Casas Nativa" className="logo" />
        <h1>Presupuesto de Madera - División Maderas</h1>
        <p>
          Calculá pies tablares y costo estimado por pieza. Marcá si querés cepillado.
        </p>
      </header>

      {/* Contenedor que se exporta como imagen */}
      <div ref={exportRef} className="export-box">
        <div className="export-header">
          <span>Fecha: {fecha}</span>
        </div>

        <div className="tabla-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Cantidad</th>
                <th>Espesor (in)</th>
                <th>Ancho (in)</th>
                <th>Largo (m)</th>
                <th>Cepillado</th>
                <th>Vista</th>
                <th>Tipo</th>
                <th>BF/pieza</th>
                <th>BF Total</th>
                <th>Costo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <input
                      type="number"
                      value={r.qty}
                      onChange={e => updateItem(r.id, "qty", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={r.t}
                      onChange={e => updateItem(r.id, "t", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={r.w}
                      onChange={e => updateItem(r.id, "w", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={r.L}
                      onChange={e => updateItem(r.id, "L", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={r.cepillado}
                      onChange={e =>
                        updateItem(r.id, "cepillado", e.target.checked)
                      }
                    />
                  </td>
                  <td>
                    <MiniDibujo wIn={r.w} Lm={r.L} />
                  </td>
                  <td>
                    {r.esTirante ? "Tirante largo" : "Normal"}
                  </td>
                  <td>{r.bfUnidad.toFixed(2)} pies²</td>
                  <td>{r.bfTotal.toFixed(2)} pies²</td>
                  <td>${r.costo.toFixed(2)}</td>
                  <td>
                    <button onClick={() => duplicateItem(r.id)}>Duplicar</button>
                    <button onClick={() => removeItem(r.id)}>Borrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="totales">
          <div className="total-box">
            <span>Total</span>
            <strong>{totales.bf.toFixed(2)} pies cuadrados</strong>
          </div>
          <div className="total-box">
            <span>Costo total</span>
            <strong>${totales.costo.toFixed(2)}</strong>
          </div>
        </div>

        <p className="detalle">
          ⚠️ Tirantes o piezas mayores a 4,5 m → ${PRECIO_TIRANTE} por pie tablar
        </p>
      </div>
      {/* Fin exportable */}

      <div className="acciones">
        <button onClick={addItem} className="btn-primary">
          Agregar fila
        </button>
        <button
          onClick={() =>
            setItems([{ id: 1, t: 2, w: 3, L: 2, qty: 1, cepillado: false }])
          }
          className="btn-secondary"
        >
          Reiniciar
        </button>
        <button onClick={guardarComoImagen} className="btn-secondary">
          Guardar como imagen
        </button>
      </div>

      <footer className="footer">
        <p>
          Fórmula: bf = espesor × ancho × largo × 0.2734 | Precio base ${PRECIO_BRUTO} + ${EXTRA_CEPILLADO} si es cepillado.
        </p>
        <p>Casas Nativa · División Maderas</p>
        <p>
          WhatsApp:{" "}
          <a href="https://wa.me/543751567045">+54 9 3751 56-7045</a>
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
