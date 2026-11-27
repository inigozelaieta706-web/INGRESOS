
const MONEDA = "EUR";
const KEY = "presupuesto-503020";

const $ = id => document.getElementById(id);

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
}[c]));

const fmt = n => new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: MONEDA
}).format(n);

const filasVacias = () =>
  Array.from({ length: 10 }, () => ({
    ing: "",
    tipo: "",
    mov: "ingreso"
  }));

// ---------- Datos ----------

let datos = {
  filas: filasVacias(),
  notas: "",
  descuento20: ""
};

try {
  const g = JSON.parse(localStorage.getItem(KEY));

  if (g && Array.isArray(g.filas) && g.filas.length) {
    datos = {
      ...datos,
      ...g
    };
  }
} catch {}

const guardar = () =>
  localStorage.setItem(KEY, JSON.stringify(datos));


// ---------- Tabla ----------

function pintar() {

  $("cuerpo").innerHTML = datos.filas.map((f, i) => {

    const per = f.mov === "perdida";

    return `
      <tr class="${per ? "perd" : ""}">

        <td class="n">${i + 1}</td>

        <td>
          <div class="celda">

            <input
              type="number"
              step="any"
              min="0"
              data-i="${i}"
              data-c="ing"
              value="${esc(f.ing)}"
              placeholder="0"
            >

            <button
              type="button"
              class="mov ${per ? "perd" : ""}"
              data-i="${i}"
            >
              ${per ? "Pérdida" : "Ingreso"}
            </button>

          </div>
        </td>

        <td>
          <input
            type="text"
            data-i="${i}"
            data-c="tipo"
            value="${esc(f.tipo)}"
            placeholder="Ej. Salario"
          >
        </td>

        <td class="r" id="p50-${i}"></td>
        <td class="r" id="p30-${i}"></td>
        <td class="r" id="p20-${i}"></td>

      </tr>
    `;

  }).join("");

  calcular();
}


// ---------- Cálculos ----------

function calcular() {

  let ingresos = 0;
  let perdidas = 0;

  datos.filas.forEach((f, i) => {

    const v = parseFloat(f.ing);
    const ok = !isNaN(v);
    const per = f.mov === "perdida";

    if (ok) {

      if (per) {
        perdidas += v;
      } else {
        ingresos += v;
      }

    }

    // Porcentajes individuales de cada ingreso

    const mostrar = ok && !per;

    ["50", "30", "20"].forEach(p => {

      $(`p${p}-${i}`).textContent =
        mostrar ? fmt(v * Number(p) / 100) : "";

    });

  });


  // ---------- NUEVOS CÁLCULOS ----------

  const descuento20 = Math.max(
    0,
    parseFloat(datos.descuento20) || 0
  );

  // Porcentajes originales

  const porcentaje50 = ingresos * 0.50;
  const porcentaje30 = ingresos * 0.30;
  const porcentaje20 = ingresos * 0.20;

  // Las pérdidas solo afectan al 50%

  const resultado50 = porcentaje50 - perdidas;

  // El descuento manual solo afecta al 20%

  const resultado20 = porcentaje20 - descuento20;

  // Total general

  const neto = ingresos - perdidas - descuento20;


  // ---------- Mostrar resultados ----------

  $("t0").textContent = fmt(neto);

  $("t1").textContent = fmt(resultado50);

  $("t2").textContent = fmt(porcentaje30);

  $("t3").textContent = fmt(resultado20);

  $("resumen").textContent =
    `Ingresos ${fmt(ingresos)} · ` +
    `Pérdidas ${fmt(perdidas)} · ` +
    `Descuento 20% ${fmt(descuento20)} · ` +
    `Total ${fmt(neto)}`;

}


// ---------- Editar ingresos ----------

$("cuerpo").addEventListener("input", e => {

  const t = e.target;

  if (!t.dataset.c) return;

  datos.filas[t.dataset.i][t.dataset.c] = t.value;

  guardar();
  calcular();

});


// ---------- Cambiar ingreso / pérdida ----------

$("cuerpo").addEventListener("click", e => {

  const b = e.target.closest(".mov");

  if (!b) return;

  const f = datos.filas[b.dataset.i];

  f.mov = f.mov === "perdida"
    ? "ingreso"
    : "perdida";

  guardar();
  pintar();

});


// ---------- Añadir filas ----------

$("mas").addEventListener("click", () => {

  datos.filas.push(...filasVacias());

  guardar();
  pintar();

});


// ---------- Descuento del 20% ----------

$("descontar").value = datos.descuento20 || "";

$("descontar").addEventListener("input", () => {

  datos.descuento20 = $("descontar").value;

  guardar();
  calcular();

});


// ---------- Notas ----------

$("notas").value = datos.notas || "";

$("notas").addEventListener("input", () => {

  datos.notas = $("notas").value;

  guardar();

});


// ---------- Inicio ----------

pintar();
