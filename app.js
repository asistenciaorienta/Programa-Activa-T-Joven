/* ===============================
   CONFIGURACIÓN
================================*/
const SHEET_ID = "1JomDFGbxD_uQ7aKZb42N8qNESDWfmxEO01wizw58v1I";
const SHEET_NAME = "Datos_Activa-T_Joven25-26";
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

const CACHE_KEY = "activa_t_joven_cache";
const CACHE_TIME = 5 * 60 * 1000; // 5 minutos

let datos = [];

/* ===============================
   NORMALIZAR TEXTO
================================*/
function normalizar(txt = "") {
  return txt.toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/* ===============================
   AUTOCOMPLETE
================================*/
function activarAutocomplete(input, valores) {
  if (!input) return;

  const cont = input.nextElementSibling;
  cont.innerHTML = "";

  const valoresNorm = valores.map(v => normalizar(v));

  input.oninput = () => {
    cont.innerHTML = "";
    const texto = normalizar(input.value);
    if (!texto) {
      actualizarFiltros();
      return;
    }

    valores.forEach((v, i) => {
      if (valoresNorm[i].includes(texto)) {
        const div = document.createElement("div");
        div.textContent = v;
        div.onclick = () => {
          input.value = v;
          cont.innerHTML = "";
          actualizarFiltros();
        };
        cont.appendChild(div);
      }
    });

    actualizarFiltros();
  };

  document.addEventListener("click", e => {
    if (e.target !== input) cont.innerHTML = "";
  });
}

/* ===============================
   CARGA DE DATOS
================================*/
document.addEventListener("DOMContentLoaded", cargarDatos);

function cargarDatos() {

  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");

  if (cache && Date.now() - cache.time < CACHE_TIME) {
    datos = cache.data;
    inicializar();
    return;
  }

  fetch(URL)
    .then(r => r.text())
    .then(txt => {
      const json = JSON.parse(
        txt.substring(txt.indexOf("{"), txt.lastIndexOf("}") + 1)
      );

      const cols = json.table.cols.map(c => c.label);

      datos = json.table.rows.map(r => {
        let o = {};
        cols.forEach((c, i) => o[c] = r.c[i] ? r.c[i].v : "");
        return o;
      });

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ time: Date.now(), data: datos })
      );

      inicializar();
    })
    .catch(err => console.error("Error cargando datos:", err));
}

/* ===============================
   VARIABLES FILTROS
================================*/
let selATE, selOfi, selAyto;
let inpCod, inpOcup, inpNivel;

/* ===============================
   INICIALIZAR
================================*/
function inicializar() {

  selATE = document.getElementById("fATE");
  selOfi = document.getElementById("fOficina");
  selAyto = document.getElementById("fAyuntamiento");

  inpCod = document.getElementById("fCodigoOcupacion");
  inpOcup = document.getElementById("fOcupacion");
  inpNivel = document.getElementById("fNivel");

  selATE.onchange = actualizarFiltros;
  selOfi.onchange = actualizarFiltros;
  selAyto.onchange = actualizarFiltros;

  actualizarFiltros();
}

/* ===============================
   FILTROS ENCADENADOS
================================*/
function actualizarFiltros() {

  const filtros = {
    ate: selATE.value,
    oficina: selOfi.value,
    ayto: selAyto.value,
    cod: inpCod.value,
    ocup: inpOcup.value,
    nivel: inpNivel.value
  };

  const hayFiltros = Object.values(filtros).some(v => v);

  const filtrados = hayFiltros
    ? datos.filter(d =>
        (!filtros.ate || d["ATE"] === filtros.ate) &&
        (!filtros.oficina || d["Oficina de empleo"] === filtros.oficina) &&
        (!filtros.ayto || d["Ayuntamiento"] === filtros.ayto) &&
        (!filtros.cod || d["Nº Ocupación"].toString().includes(filtros.cod)) &&
        (!filtros.ocup || normalizar(d["Denominación Ocupación"]).includes(normalizar(filtros.ocup))) &&
        (!filtros.nivel || normalizar(d["Nivel de estudios"]) === normalizar(filtros.nivel))
      )
    : datos;

  actualizarSelect(
    selATE,
    filtrados.map(d => d["ATE"]),
    filtros.ate,
    "Todas las ATE"
  );

  actualizarSelect(
    selOfi,
    filtrados.map(d => d["Oficina de empleo"]),
    filtros.oficina,
    "Todas las oficinas"
  );

  actualizarSelect(
    selAyto,
    filtrados.map(d => d["Ayuntamiento"]),
    filtros.ayto,
    "Todos los ayuntamientos"
  );

  activarAutocomplete(
    inpCod,
    [...new Set(filtrados.map(d => d["Nº Ocupación"]).filter(Boolean))]
  );

  activarAutocomplete(
    inpOcup,
    [...new Set(filtrados.map(d => d["Denominación Ocupación"]).filter(Boolean))]
  );

  activarAutocomplete(
    inpNivel,
    [...new Set(filtrados.map(d => d["Nivel de estudios"]).filter(Boolean))]
  );

  mostrarResultados(filtrados);
}

function actualizarSelect(select, valores, actual, texto) {
  const unicos = [...new Set(valores.filter(Boolean))].sort();
  select.innerHTML = `<option value="">${texto}</option>`;
  unicos.forEach(v => select.add(new Option(v, v)));
  if (unicos.includes(actual)) select.value = actual;
}

/* ===============================
   LIMPIAR FILTROS
================================*/
document.getElementById("btnLimpiar")?.addEventListener("click", limpiarFiltros);

function limpiarFiltros() {

  selATE.value = "";
  selOfi.value = "";
  selAyto.value = "";

  inpCod.value = "";
  inpOcup.value = "";
  inpNivel.value = "";

  actualizarFiltros();
}

/* ===============================
   RESULTADOS
================================*/
function mostrarResultados(lista) {

  const tbody = document.querySelector("#tablaResultados tbody");
  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="7">No hay resultados</td></tr>`;
    return;
  }

  lista.forEach(d => {
    const tr = document.createElement("tr");
    [
      "Ayuntamiento",
      "Nº Ocupación",
      "Denominación Ocupación",
      "Nº contratos",
      "Grupo de cotización",
      "Nivel de estudios",
      "Oficina de empleo"
    ].forEach(c => {
      const td = document.createElement("td");
      td.textContent = d[c] || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}
/* ===============================
   BOTONES ✖ LIMPIAR INDIVIDUAL
================================*/
document.querySelectorAll(".campo-filtro").forEach(campo => {

  const input = campo.querySelector("input, select");
  const clearBtn = campo.querySelector(".clear-btn");

  if (!input || !clearBtn) return;

  const toggleClear = () => {
    campo.classList.toggle("activo", !!input.value);
  };

  input.addEventListener("input", toggleClear);
  input.addEventListener("change", toggleClear);

  clearBtn.addEventListener("click", () => {
    input.value = "";
    toggleClear();
    actualizarFiltros();
  });

  toggleClear();
});
/* ===============================
   RESALTAR FILTROS ACTIVOS
================================*/
function actualizarEstadoFiltros() {
  document.querySelectorAll(".campo-filtro").forEach(campo => {
    const input = campo.querySelector("input, select");
    if (!input) return;
    campo.classList.toggle("activo", !!input.value);
  });
}

/* Ejecutar en cada cambio */
["input", "change"].forEach(evt => {
  document.addEventListener(evt, actualizarEstadoFiltros);
});

/* Ejecutar al cargar */
document.addEventListener("DOMContentLoaded", actualizarEstadoFiltros);

/* ===============================
   EXPORTAR A PDF
================================*/
document.getElementById("btnExportarPdf")?.addEventListener("click", exportarPDF);

function exportarPDF() {

  const filas = [];
  document.querySelectorAll("#tablaResultados tbody tr").forEach(tr => {
    const fila = [];
    tr.querySelectorAll("td").forEach(td => fila.push(td.textContent));
    if (fila.length) filas.push(fila);
  });

  if (!filas.length) {
    alert("No hay resultados para exportar");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  doc.setFontSize(14);
  doc.text("Programa ACTIVA-T Joven – Resultados de búsqueda", 14, 15);

  doc.autoTable({
    startY: 22,
    head: [[
      "Ayuntamiento",
      "Nº Ocupación",
      "Denominación",
      "Nº Contratos",
      "Grupo Cotización",
      "Nivel Estudios",
      "Oficina de Empleo"
    ]],
    body: filas,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 121, 50] },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  doc.save("ACTIVA-T_Joven_resultados.pdf");
}

