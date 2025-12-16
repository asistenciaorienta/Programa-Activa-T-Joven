/* ===============================
   CONFIGURACIÓN
================================*/
const SHEET_ID = "1JomDFGbxD_uQ7aKZb42N8qNESDWfmxEO01wizw58v1I";
const SHEET_NAME = "Datos_Activa-T_Joven25-26";
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
const CACHE_KEY = "activa_t_joven_datos";
const CACHE_TIME = 5 * 60 * 1000; // 5 minutos

let datos = [];

/* ===============================
   NORMALIZAR TEXTO
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
  const cont = input.nextElementSibling;
  const valoresNorm = valores.map(v => normalizar(v));

  input.addEventListener("input", () => {
    cont.innerHTML = "";
    const texto = normalizar(input.value);
    if (!texto) return;

    valores.forEach((v, i) => {
      if (valoresNorm[i].includes(texto)) {
        const div = document.createElement("div");
        div.className = "autocomplete-item";
        div.textContent = v;
        div.onclick = () => {
          input.value = v;
          cont.innerHTML = "";
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
   CARGA DATOS (CACHE + FETCH)
================================*/
document.addEventListener("DOMContentLoaded", cargarDatos);

function cargarDatos() {
  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");

  if (cache && Date.now() - cache.time < CACHE_TIME) {
    datos = cache.data;
    console.log("Datos cargados desde caché:", datos.length);
    inicializarFiltros();
    return;
  }

  fetch(URL)
    .then(r => r.text())
    .then(txt => {
      const json = JSON.parse(
        txt.substring(txt.indexOf("{"), txt.lastIndexOf("}") + 1)
      );

      const cols = json.table.cols.map(c => normalizar(c.label));

      datos = json.table.rows.map(r => {
        let obj = {};
        cols.forEach((c, i) => {
          obj[c] = r.c[i] ? r.c[i].v : "";
        });
        return obj;
      });

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ time: Date.now(), data: datos })
      );

      console.log("Datos cargados desde Google Sheets:", datos.length);
      inicializarFiltros();
    })
    .catch(err => console.error("Error cargando datos:", err));
}

/* ===============================
   INICIALIZAR FILTROS
================================*/
function inicializarFiltros() {

  /* ---------- ATE (select clásico) ---------- */
  const selATE = document.getElementById("fATE");
  const ates = [...new Set(datos.map(d => d["ate"]).filter(Boolean))].sort();

  selATE.innerHTML = `<option value="">Todas las ATE</option>`;
  ates.forEach(a => selATE.add(new Option(a, a)));

  /* ---------- Oficina (select clásico dependiente) ---------- */
  const selOfi = document.getElementById("fOficina");

  selATE.addEventListener("change", () => {
    const ateSel = selATE.value;
    selOfi.innerHTML = `<option value="">Todas las oficinas</option>`;

    const oficinas = [...new Set(
      datos
        .filter(d => !ateSel || d["ate"] === ateSel)
        .map(d => d["oficina de empleo"])
        .filter(Boolean)
    )].sort();

    oficinas.forEach(o => selOfi.add(new Option(o, o)));
  });

  selATE.dispatchEvent(new Event("change"));

  /* ---------- AUTOCOMPLETE ---------- */
  activarAutocomplete(
    document.getElementById("fAyuntamiento"),
    [...new Set(datos.map(d => d["ayuntamiento"]).filter(Boolean))]
  );

  activarAutocomplete(
    document.getElementById("fCodigoOcupacion"),
    [...new Set(datos.map(d => d["nº ocupacion"]).filter(Boolean))]
  );

  activarAutocomplete(
    document.getElementById("fOcupacion"),
    [...new Set(datos.map(d => d["denominacion ocupacion"]).filter(Boolean))]
  );

  activarAutocomplete(
    document.getElementById("fNivel"),
    [...new Set(datos.map(d => d["nivel de estudios"]).filter(Boolean))]
  );
}

/* ===============================
   FILTRAR
================================*/
document.getElementById("btnBuscar").addEventListener("click", () => {
  const filtros = {
    ate: document.getElementById("fATE").value,
    oficina: document.getElementById("fOficina").value,
    ayto: document.getElementById("fAyuntamiento").value,
    cod: document.getElementById("fCodigoOcupacion").value,
    ocup: document.getElementById("fOcupacion").value,
    nivel: document.getElementById("fNivel").value
  };

  const res = datos.filter(d =>
    (!filtros.ate || d["ate"] === filtros.ate) &&
    (!filtros.oficina || d["oficina de empleo"] === filtros.oficina) &&
    (!filtros.ayto || normalizar(d["ayuntamiento"]) === normalizar(filtros.ayto)) &&
    (!filtros.cod || d["nº ocupacion"] === filtros.cod) &&
    (!filtros.ocup || normalizar(d["denominacion ocupacion"]) === normalizar(filtros.ocup)) &&
    (!filtros.nivel || d["nivel de estudios"] === filtros.nivel)
  );

  mostrarResultados(res);
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
      "ate",
      "ayuntamiento",
      "nº ocupacion",
      "denominacion ocupacion",
      "nº contratos",
      "nivel de estudios",
      "codigo postal",
      "oficina de empleo"
    ].forEach(c => {
      const td = document.createElement("td");
      td.textContent = d[c] || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}
