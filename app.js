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
  return txt.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

/* ===============================
   AUTOCOMPLETE
================================*/
function activarAutocomplete(input, valores) {
  if (!input) return;
  const cont = input.nextElementSibling;
  const valoresNorm = valores.map(v => normalizar(v));

  input.addEventListener("input", () => {
    cont.innerHTML = "";
    const texto = normalizar(input.value);
    if (!texto) return;

    valores.forEach((v, i) => {
      if (valoresNorm[i].includes(texto)) {
        const div = document.createElement("div");
        div.textContent = v;
        div.onclick = () => {
          input.value = v;
          cont.innerHTML = "";
          actualizarFiltrosDependientes();
        };
        cont.appendChild(div);
      }
    });

    actualizarFiltrosDependientes();
  });

  document.addEventListener("click", e => {
    if (e.target !== input) cont.innerHTML = "";
  });
}

/* ===============================
   CARGA DATOS
================================*/
document.addEventListener("DOMContentLoaded", cargarDatos);

function cargarDatos() {
  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");

  if (cache && Date.now() - cache.time < CACHE_TIME) {
    datos = cache.data;
    inicializarFiltros();
    filtrar();
    return;
  }

  fetch(URL)
    .then(r => r.text())
    .then(txt => {
      const json = JSON.parse(txt.substring(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
      const headers = json.table.cols.map(c => c.label);

      datos = json.table.rows.map(r => {
        let obj = {};
        headers.forEach((h, i) => {
          obj[h] = r.c[i] ? r.c[i].v : "";
        });
        return obj;
      });

      localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data: datos }));

      inicializarFiltros();
      filtrar();
    });
}

/* ===============================
   FILTROS INICIALES
================================*/
let selects = {};
let inputs = {};

function inicializarFiltros() {
  selects = {
    ate: document.getElementById("fATE"),
    oficina: document.getElementById("fOficina")
  };

  inputs = {
    ayto: document.getElementById("fAyuntamiento"),
    cod: document.getElementById("fCodigoOcupacion"),
    ocup: document.getElementById("fOcupacion"),
    nivel: document.getElementById("fNivel")
  };

  // llenamos selects
  actualizarFiltrosDependientes();

  // eventos en selects
  Object.values(selects).forEach(sel => sel.addEventListener("change", actualizarFiltrosDependientes));
  Object.values(inputs).forEach(inp => inp.addEventListener("input", actualizarFiltrosDependientes));
}

/* ===============================
   ACTUALIZAR FILTROS DEPENDIENTES
================================*/
function actualizarFiltrosDependientes() {
  const filtroActual = {
    ate: selects.ate.value,
    oficina: selects.oficina.value,
    ayto: inputs.ayto.value,
    cod: inputs.cod.value,
    ocup: inputs.ocup.value,
    nivel: inputs.nivel.value
  };

  // filtramos datos según los filtros actuales
  const datosFiltrados = datos.filter(d =>
    (!filtroActual.ate || d["ATE"] === filtroActual.ate) &&
    (!filtroActual.oficina || d["Oficina de empleo"] === filtroActual.oficina) &&
    (!filtroActual.ayto || normalizar(d["Ayuntamiento"]).includes(normalizar(filtroActual.ayto))) &&
    (!filtroActual.cod || d["Nº Ocupación"].toString().includes(filtroActual.cod)) &&
    (!filtroActual.ocup || normalizar(d["Denominación Ocupación"]).includes(normalizar(filtroActual.ocup))) &&
    (!filtroActual.nivel || d["Nivel de estudios"] === filtroActual.nivel)
  );

  // Actualizar selects
  actualizarSelect(selects.ate, [...new Set(datosFiltrados.map(d => d["ATE"]).filter(Boolean))]);
  actualizarSelect(selects.oficina, [...new Set(datosFiltrados.map(d => d["Oficina de empleo"]).filter(Boolean))]);

  // Actualizar autocompletes
  activarAutocomplete(inputs.ayto, [...new Set(datosFiltrados.map(d => d["Ayuntamiento"]).filter(Boolean))]);
  activarAutocomplete(inputs.cod, [...new Set(datosFiltrados.map(d => d["Nº Ocupación"]).filter(Boolean))]);
  activarAutocomplete(inputs.ocup, [...new Set(datosFiltrados.map(d => d["Denominación Ocupación"]).filter(Boolean))]);
  activarAutocomplete(inputs.nivel, [...new Set(datosFiltrados.map(d => d["Nivel de estudios"]).filter(Boolean))]);

  // Mostrar resultados
  mostrarResultados(datosFiltrados);
}

function actualizarSelect(sel, valores) {
  if (!sel) return;
  const actual = sel.value;
  sel.innerHTML = `<option value="">Todos</option>`;
  valores.sort().forEach(v => sel.add(new Option(v, v)));
  // mantener valor si sigue disponible
  if (valores.includes(actual)) sel.value = actual;
}

/* ===============================
   LIMPIAR FILTROS
================================*/
document.getElementById("btnLimpiar").addEventListener("click", () => {
  Object.values(selects).forEach(s => s.selectedIndex = 0);
  Object.values(inputs).forEach(i => i.value = "");
  actualizarFiltrosDependientes();
});

/* ===============================
   MOSTRAR RESULTADOS
================================*/
function mostrarResultados(lista) {
  const tbody = document.querySelector("#tablaResultados tbody");
  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="8">No hay resultados</td></tr>`;
    return;
  }

  lista.forEach(d => {
    const tr = document.createElement("tr");
    [
      "ATE",
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
