const SHEET_ID = "1JomDFGbxD_uQ7aKZb42N8qNESDWfmxEO01wizw58v1I";
const SHEET = "Datos_Activa-T_Joven25-26";
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET}`;

const CACHE_KEY = "activa_joven_datos";
const CACHE_TIME = 6 * 60 * 60 * 1000; // 6 horas

let datos = [];
function normalizar(txt){
  return (txt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .trim();
}

function setOptions(select, valores){
  select.innerHTML = `<option value="">Todos</option>`;
  valores.forEach(v => select.add(new Option(v, v)));
}
function activarAutocomplete(input, valores){
  const cont = input.nextElementSibling;
  const norm = valores.map(v => normalizar(v));

  input.addEventListener("input", () => {
    cont.innerHTML = "";
    const t = normalizar(input.value);
    if (!t) return;

    valores.forEach((v,i)=>{
      if(norm[i].includes(t)){
        const d = document.createElement("div");
        d.textContent = v;
        d.onclick = () => {
          input.value = v;
          cont.innerHTML = "";
        };
        cont.appendChild(d);
      }
    });
  });

  document.addEventListener("click", e => {
    if (e.target !== input) cont.innerHTML = "";
  });
}
function cargarDatos(){
  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");

  if (cache && Date.now() - cache.time < CACHE_TIME){
    datos = cache.data;
    console.log("Datos desde caché");
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
        let o = {};
        cols.forEach((c,i)=> o[c] = r.c[i]?.v || "");
        return o;
      });

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        time: Date.now(),
        data: datos
      }));

      console.log("Datos cargados desde Google Sheets");
      inicializarFiltros();
    });
}
function inicializarFiltros(){
  const selATE = document.getElementById("fATE");
  const selOfi = document.getElementById("fOficina");

  // ATE (select clásico)
  const ates = [...new Set(datos.map(d => d["ate"]).filter(Boolean))].sort();
  setOptions(selATE, ates);

  // Autocompletes base
  activarAutocomplete(
    document.getElementById("fNivel"),
    [...new Set(datos.map(d => d["nivel de estudios"]).filter(Boolean))]
  );

  activarAutocomplete(
    document.getElementById("fCodigoOcupacion"),
    [...new Set(datos.map(d => d["nº ocupacion"]).filter(Boolean))]
  );

  // Dependencia ATE → Ayuntamientos
  selATE.addEventListener("change", () => {
    const ate = selATE.value;

    const aytos = datos
      .filter(d => !ate || d["ate"] === ate)
      .map(d => d["ayuntamiento"])
      .filter(Boolean);

    activarAutocomplete(
      document.getElementById("fAyuntamiento"),
      [...new Set(aytos)].sort()
    );

    selOfi.innerHTML = `<option value="">Todas las oficinas</option>`;
  });

  // Dependencia Ayuntamiento → Oficinas
  document.getElementById("fAyuntamiento").addEventListener("blur", () => {
    const ay = document.getElementById("fAyuntamiento").value;

    const oficinas = datos
      .filter(d => d["ayuntamiento"] === ay)
      .map(d => d["oficina de empleo"])
      .filter(Boolean);

    setOptions(selOfi, [...new Set(oficinas)].sort());
  });

  // Autocomplete ocupaciones (global o dependiente si quieres)
  activarAutocomplete(
    document.getElementById("fOcupacion"),
    [...new Set(datos.map(d => d["denominacion ocupacion"]).filter(Boolean))]
  );
}
document.getElementById("btnBuscar").addEventListener("click", () => {
  const f = {
    ate: normalizar(fATE.value),
    ay: normalizar(fAyuntamiento.value),
    ofi: normalizar(fOficina.value),
    cod: normalizar(fCodigoOcupacion.value),
    ocu: normalizar(fOcupacion.value),
    niv: normalizar(fNivel.value)
  };

  const res = datos.filter(d =>
    (!f.ate || normalizar(d["ate"]) === f.ate) &&
    (!f.ay || normalizar(d["ayuntamiento"]) === f.ay) &&
    (!f.ofi || normalizar(d["oficina de empleo"]) === f.ofi) &&
    (!f.cod || normalizar(d["nº ocupacion"]) === f.cod) &&
    (!f.ocu || normalizar(d["denominacion ocupacion"]) === f.ocu) &&
    (!f.niv || normalizar(d["nivel de estudios"]) === f.niv)
  );

  mostrarResultados(res);
});
