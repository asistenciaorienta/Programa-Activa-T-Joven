/* ===============================
   CONFIGURACIÓN
================================*/
const SHEET_ID = "1JomDFGbxD_uQ7aKZb42N8qNESDWfmxEO01wizw58v1I";
const SHEET_NAME = "Datos_Activa-T_Joven25-26";
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
const CACHE_KEY = "activa_t_joven_datos";
const CACHE_TIME = 5 * 60 * 1000;

let datos = [];

/* ===============================
   NORMALIZAR
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
    const txt = normalizar(input.value);
    if (!txt) return;

    valores.forEach((v, i) => {
      if (valoresNorm[i].includes(txt)) {
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
      const json = JSON.parse(txt.substring(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
      const cols = json.table.cols.map(c => c.label);

      datos = json.table.rows.map(r => {
        let o = {};
        cols.forEach((c, i) => o[c] = r.c[i] ? r.c[i].v : "");
        return o;
      });

      localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data: datos }));
      inicializar();
    });
}

/* ===============================
   INICIALIZAR FILTROS
================================*/
let selATE, selOfi, selAyto;
let inpCod, inpOcup, inpNivel;

function inicializar() {
  selATE = document.getElementById("fATE");
  selOfi = document.getElementById("fOficina");
  selAyto = document.getElementById("fAyuntamiento");

  inpCod = document.getElementById("fCodigoOcupacion");
  inpOcup = document.getElementById("fOcupacion");
  inpNivel = document.getElementById("fNivel");

  [selATE, selOfi, selAyto].forEach(s => s.onchange = actualizarFiltros);
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

  const filtrados = datos.filter(d =>
    (!filtros.ate || d["ATE"] === filtros.ate) &&
    (!filtros.oficina || d["Oficina de empleo"] === filtros.oficina) &&
    (!filtros.ayto || d["Ayuntamiento"] === filtros.ayto) &&
    (!filtros.cod || d["Nº Ocupación"].toString().includes(filtros.cod)) &&
    (!filtros.ocup || normalizar(d["Denominación Ocupación"]).includes(normalizar(filtros.ocup))) &&
    (!filtros.nivel || d["Nivel de estudios"] === filtros.nivel)
  );

  actualizarSelect(selATE, filtrados.map(d => d["ATE"]), filtros.ate, "Todas las ATE");
  actualizarSelect(selOfi, filtrados.map(d => d["Oficina de empleo"]), filtros.oficina, "Todas las oficinas");
  actualizarSelect(selAyto, filtrados.map(d => d["Ayuntamiento"]), filtros.ayto, "Todos los ayuntamientos");

  activarAutocomplete(inpCod, [...new Set(filtrados.map(d => d["Nº Ocupación"]))]);
  activarAutocomplete(inpOcup, [...new Set(filtrados.map(d => d["Denominación Ocupación"]))]);
  activarAutocomplete(inpNivel, [...new Set(filtrados.map(d => d["Nivel de estudios"]))]);

  mostrarResultados(filtrados);
}

function actualizarSelect(sel, valores, actual, texto) {
  const unicos = [...new Set(valores.filter(Boolean))].sort();
  sel.innerHTML = `<option value="">${texto}</option>`;
  unicos.forEach(v => sel.add(new Option(v, v)));
  if (unicos.includes(actual)) sel.value = actual;
}

/* ===============================
   RESULTADOS
================================*/
function mostrarResultados(lista) {
  const tbody = document.querySelector("#tablaResultados tbody");
  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="8">No hay resultados</td></tr>`;
    return;
 _toggle;

  lista.forEach(d => {
    const tr = document.createElement("tr");
    [
      "Ayuntamiento",
      "Nº Ocupación",
      "Denominación Ocupación",
      "Nº contratos",
      "Grupo de cotización",
      "Nivel de estudios",
      "Código Postal",
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
   EXPORTAR A PDF
================================*/
document.getElementById("btnExportarPdf")?.addEventListener("click", exportarPDF);

function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  // Título
  doc.setFontSize(14);
  doc.text("Programa ACTIVA-T Joven – Resultados de búsqueda", 14, 15);

  // Obtener filas visibles
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

  doc.autoTable({
    startY: 22,
    head: [[
      "Ayuntamiento",
      "Nº Ocupación",
      "Denominación Ocupación",
      "Nº Contratos",
      "Nivel Estudios",
      "Código Postal",
      "Oficina de Empleo"
    ]],
    body: filas,
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [0, 121, 50] // Verde Junta
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  doc.save("ACTIVA-T_Joven_resultados.pdf");
}
