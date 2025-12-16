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
  return txt
    .toString()
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
  const valoresNorm = valores.map(v => normalizar(v));

  input.addEventListener("input", () => {
    cont.innerHTML = "";
    const texto = normalizar(input.value);
    if (!texto) {
      filtrar(); // búsqueda en tiempo real
      return;
    }

    valores.forEach((v, i) => {
      if (valoresNorm[i].includes(texto)) {
        const div = document.createElement("div");
        div.textContent = v;
        div.onclick = () => {
          input.value = v;
          cont.innerHTML = "";
          filtrar();
        };
        cont.appendChild(div);
      }
    });
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
      const json = JSON.parse(
        txt.substring(txt.indexOf("{"), txt.lastIndexOf("}") + 1)
      );

      const headers = json.table.cols.map(c => c.label);

      datos = json.table.rows.map(r => {
        let obj = {};
        headers.forEach((h, i) => {
          obj[h] = r.c[i] ? r.c[i].v : "";
        });
        return obj;
      });

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ time: Date.now(), data: datos })
      );

      inicializarFiltros();
      filtrar();
    });
}

/* ===============================
   FILTROS
================================*/
function inicializarFiltros() {

  const selATE = document.getElementById("fATE");
  const selOfi = document.getElementById("fOficina");

  /* -------- ATE -------- */
  const ates = [...new Set(datos.map(d => d["ATE"]).filter(Boolean))].sort();
  selATE.innerHTML = `<option value="">Todas las ATEs</option>`;
  ates.forEach(a => selATE.add(new Option(a, a)));

  /* -------- OFICINAS DEPENDIENTES -------- */
  selATE.addEventListener("change", () => {
    const ateSel = selATE.value;
    selOfi.innerHTML = `<option value="">Todas las oficinas</option>`;

    const oficinas = [...new Set(
      datos
        .filter(d => !ateSel || d["ATE"] === ateSel)
        .map(d => d["Oficina de empleo"])
        .filter(Boolean)
    )].sort();

    oficinas.forEach(o => selOfi.add(new Option(o, o)));
    filtrar();
  });

  selOfi.addEventListener("change", filtrar);

  selATE.dispatchEvent(new Event("change"));

  /* -------- AUTOCOMPLETES -------- */
  activarAutocomplete(
    document.getElementById("fAyuntamiento"),
    [...new Set(datos.map(d => d["Ayuntamiento"]).filter(Boolean))]
  );

  activarAutocomplete(
    document.getElementById("fCodigoOcupacion"),
    [...new Set(datos.map(d => d["Nº Ocupación"]).filter(Boolean))]
  );

  activarAutocomplete(
    document.getElementById("fOcupacion"),
    [...new Set(datos.map(d => d["Denominación Ocupación"]).filter(Boolean))]
  );

  activarAutocomplete(
    document.getElementById("fNivel"),
    [...new Set(datos.map(d => d["Nivel de estudios"]).filter(Boolean))]
  );

  /* -------- INPUTS → TIEMPO REAL -------- */
  ["fAyuntamiento", "fCodigoOcupacion", "fOcupacion", "fNivel"]
    .forEach(id => {
      document.getElementById(id).addEventListener("input", filtrar);
    });
}

/* ===============================
   FILTRAR (TIEMPO REAL)
================================*/
function filtrar() {
  const filtros = {
    ate: fATE.value,
    oficina: fOficina.value,
    ayto: fAyuntamiento.value,
    cod: fCodigoOcupacion.value,
    ocup: fOcupacion.value,
    nivel: fNivel.value
  };

  const res = datos.filter(d =>
    (!filtros.ate || d["ATE"] === filtros.ate) &&
    (!filtros.oficina || d["Oficina de empleo"] === filtros.oficina) &&
    (!filtros.ayto || normalizar(d["Ayuntamiento"]).includes(normalizar(filtros.ayto))) &&
    (!filtros.cod || d["Nº Ocupación"].toString().includes(filtros.cod)) &&
    (!filtros.ocup || normalizar(d["Denominación Ocupación"]).includes(normalizar(filtros.ocup))) &&
    (!filtros.nivel || d["Nivel de estudios"] === filtros.nivel)
  );

  mostrarResultados(res);
}

/* ===============================
   LIMPIAR FILTROS
================================*/
document.getElementById("btnLimpiar").addEventListener("click", () => {
  document.querySelectorAll("input").forEach(i => i.value = "");
  document.querySelectorAll("select").forEach(s => s.selectedIndex = 0);
  filtrar();
});

/* ===============================
   RESULTADOS
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
