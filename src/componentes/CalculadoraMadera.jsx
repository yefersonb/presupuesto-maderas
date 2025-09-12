// CalculadoraMadera.jsx - Versión con CSS tradicional sin Tailwind

import React, { useMemo, useState, useEffect } from "react";
import "./CalculadoraMadera.css"; // Archivo CSS externo

const BF_K = 0.2734;
const PRECIO_BRUTO = 429;
const EXTRA_CEPILLADO = 28;

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

  // Escalamos para que entren en el área
  const maxW = 150; // largo horizontal máximo
  const maxH = 50;  // ancho vertical máximo

  const scaleW = maxW / L;
  const scaleH = maxH / w;
  const scale = Math.min(scaleW, scaleH);

  const rw = L * scale; // largo dibujado
  const rh = w * scale; // ancho dibujado

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
      const precioBase = PRECIO_BRUTO + (i.cepillado ? EXTRA_CEPILLADO : 0);
      const costo = bfTotal * precioBase;
      return { ...i, bfUnidad, bfTotal, precioBase, costo };
    });
  }, [items]);

  const totales = useMemo(() => {
    const bf = rows.reduce((acc, r) => acc + r.bfTotal, 0);
    const costo = rows.reduce((acc, r) => acc + r.costo, 0);
    return { bf, costo };
  }, [rows]);

  return (
    <div className="calculadora-container">
      <header className="header">
        <img src="/logo.jpg" alt="Casas Nativa" className="logo" />
        <h1>Presupuesto de Madera - División Maderas</h1>
        <p>
          Calculá pies tablares y costo estimado por pieza. Marcá si querés cepillado.
        </p>
      </header>

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
