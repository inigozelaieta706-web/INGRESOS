const MONEDA = "EUR";          // cambia a "USD" si quieres dólares
const SOLO_SI_LLENAS = true;   // true: el + aparece cuando todas las filas tienen ingreso. false: siempre visible
const KEY = "presupuesto-503020";

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = n => new Intl.NumberFormat("es-ES", { style: "currency", currency: MONEDA }).format(n);
const filasVacias = () => Array.from({ length: 10 }, () => ({ ing: "", tipo: "" }));

let datos = { filas: filasVacias(), notas: "" };
try {
  const g = JSON.parse(localStorage.getItem(KEY));
  if (g && Array.isArray(g.filas) && g.filas.length) datos = g;
} catch {}
const guardar = () => localStorage.setItem(KEY, JSON.stringify(datos));

// ---------- Tabla ----------
function pintar() {
  $("cuerpo").innerHTML = datos.filas.map((f, i) => `
    <tr>
      <td class="n">${i + 1}</td>
      <td><input type="number" step="any" min="0" data-i="${i}" data-c="ing" value="${esc(f.ing)}" placeholder="0"></td>
      <td><input type="text" data-i="${i}" data-c="tipo" value="${esc(f.tipo)}" placeholder="Ej. Salario"></td>
      <td class="r" id="p50-${i}"></td>
      <td class="r" id="p30-${i}"></td>
      <td class="r" id="p20-${i}"></td>
    </tr>`).join("");
  calcular();
}

function calcular() {
  let total = 0;
  datos.filas.forEach((f, i) => {
    const v = parseFloat(f.ing);
    const ok = !isNaN(v);
    if (ok) total += v;
    $("p50-" + i).textContent = ok ? fmt(v * 0.5) : "";
    $("p30-" + i).textContent = ok ? fmt(v * 0.3) : "";
    $("p20-" + i).textContent = ok ? fmt(v * 0.2) : "";
  });
  $("t0").textContent = fmt(total);
  $("t1").textContent = fmt(total * 0.5);
  $("t2").textContent = fmt(total * 0.3);
  $("t3").textContent = fmt(total * 0.2);
  const llenas = datos.filas.every(f => f.ing !== "");
  $("mas").hidden = SOLO_SI_LLENAS && !llenas;
}

$("cuerpo").addEventListener("input", e => {
  const t = e.target;
  if (!t.dataset.c) return;
  datos.filas[t.dataset.i][t.dataset.c] = t.value;
  guardar();
  calcular();
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