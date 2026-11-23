const MONEDA = "EUR";   // cambia a "USD" si quieres dólares
const KEY = "presupuesto-503020";

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = n => new Intl.NumberFormat("es-ES", { style: "currency", currency: MONEDA }).format(n);
const filasVacias = () => Array.from({ length: 10 }, () => ({ ing: "", tipo: "", mov: "ingreso" }));

let datos = { filas: filasVacias(), notas: "" };
try {
  const g = JSON.parse(localStorage.getItem(KEY));
  if (g && Array.isArray(g.filas) && g.filas.length) datos = g;
} catch {}
const guardar = () => localStorage.setItem(KEY, JSON.stringify(datos));

// ---------- Tabla ----------
function pintar() {
  $("cuerpo").innerHTML = datos.filas.map((f, i) => {
    const per = f.mov === "perdida";
    return `
    <tr class="${per ? "perd" : ""}">
      <td class="n">${i + 1}</td>
      <td>
        <div class="celda">
          <input type="number" step="any" min="0" data-i="${i}" data-c="ing" value="${esc(f.ing)}" placeholder="0">
          <button type="button" class="mov ${per ? "perd" : ""}" data-i="${i}">${per ? "Pérdida" : "Ingreso"}</button>
        </div>
      </td>
      <td><input type="text" data-i="${i}" data-c="tipo" value="${esc(f.tipo)}" placeholder="Ej. Salario"></td>
      <td class="r" id="p50-${i}"></td>
      <td class="r" id="p30-${i}"></td>
      <td class="r" id="p20-${i}"></td>
    </tr>`;
  }).join("");
  calcular();
}

function calcular() {
  let ingresos = 0, perdidas = 0;
  datos.filas.forEach((f, i) => {
    const v = parseFloat(f.ing);
    const ok = !isNaN(v);
    const per = f.mov === "perdida";
    if (ok) { if (per) perdidas += v; else ingresos += v; }
    const mostrar = ok && !per;   // las pérdidas no calculan 50/30/20
    ["50", "30", "20"].forEach(p => { $(`p${p}-${i}`).textContent = mostrar ? fmt(v * p / 100) : ""; });
  });
  const neto = ingresos - perdidas;
  const base = Math.max(0, neto);   // si el neto es negativo, no se reparte nada
  $("t0").textContent = fmt(neto);
  $("t1").textContent = fmt(base * 0.5);
  $("t2").textContent = fmt(base * 0.3);
  $("t3").textContent = fmt(base * 0.2);
  $("resumen").textContent = `Ingresos ${fmt(ingresos)} · Pérdidas ${fmt(perdidas)} · Total ${fmt(neto)}`;
}

$("cuerpo").addEventListener("input", e => {
  const t = e.target;
  if (!t.dataset.c) return;
  datos.filas[t.dataset.i][t.dataset.c] = t.value;
  guardar();
  calcular();
});

$("cuerpo").addEventListener("click", e => {
  const b = e.target.closest(".mov");
  if (!b) return;
  const f = datos.filas[b.dataset.i];
  f.mov = f.mov === "perdida" ? "ingreso" : "perdida";
  guardar();
  pintar();
});

$("mas").addEventListener("click", () => {
  datos.filas.push(...filasVacias());
  guardar();
  pintar();
});

// ---------- Notas ----------
$("notas").value = datos.notas || "";
$("notas").addEventListener("input", () => { datos.notas = $("notas").value; guardar(); });

// ---------- Inicio ----------
pintar();