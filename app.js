const SHEET_ID = "1JomDFGbxD_uQ7aKZb42N8qNESDWfmxEO01wizw58v1I";
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Datos_Activa-T_Joven25-26`;

let datos = [];

/* ===============================
   NORMALIZAR
================================*/
function normalizar(txt){
  return txt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .trim();
}

function activarAutocomplete(input, valores){
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
   CARGA DE DATOS
================================*/
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

    console.log("Datos cargados:", datos.length);
    cargarDesplegables();
  });

/* ===============================
   DESPLEGABLES
================================*/
function cargarDesplegables(){
  const selAy = document.getElementById("filtroAyuntamiento");
  const selOc = document.getElementById("filtroOcupacion");

  const aytos = [...new Set(datos.map(d => d["ayuntamiento"]).filter(Boolean))].sort();
  const ocups = [...new Set(datos.map(d => d["denominacion ocupacion"]).filter(Boolean))].sort();

  aytos.forEach(a => selAy.add(new Option(a, a)));
  ocups.forEach(o => selOc.add(new Option(o, o)));
}

activarAutocomplete(
  document.getElementById("fATE"),
  [...new Set(datos.map(d => d["ate"]).filter(Boolean))]
);

activarAutocomplete(
  document.getElementById("fAyuntamiento"),
  [...new Set(datos.map(d => d["ayuntamiento"]).filter(Boolean))]
);

activarAutocomplete(
  document.getElementById("fOficina"),
  [...new Set(datos.map(d => d["oficina de empleo"]).filter(Boolean))]
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

/* ===============================
   FILTRAR
================================*/
document.getElementById("btnBuscar").addEventListener("click", () => {
  const filtros = {
    ate: document.getElementById("fATE").value,
    ayuntamiento: document.getElementById("fAyuntamiento").value,
    oficina: document.getElementById("fOficina").value,
    codOcup: document.getElementById("fCodigoOcupacion").value,
    ocup: document.getElementById("fOcupacion").value,
    nivel: document.getElementById("fNivel").value
  };

  let res = datos.filter(d =>
    (!filtros.ate || d["ate"] === filtros.ate) &&
    (!filtros.ayuntamiento || d["ayuntamiento"] === filtros.ayuntamiento) &&
    (!filtros.oficina || d["oficina de empleo"] === filtros.oficina) &&
    (!filtros.codOcup || d["nº ocupacion"] === filtros.codOcup) &&
    (!filtros.ocup || d["denominacion ocupacion"] === filtros.ocup) &&
    (!filtros.nivel || d["nivel de estudios"] === filtros.nivel)
  );

  mostrarResultados(res);
});


/* ===============================
   MOSTRAR RESULTADOS
================================*/
function mostrarResultados(lista){
  const tbody = document.querySelector("#tablaResultados tbody");
  tbody.innerHTML = "";

  if (!lista.length){
    tbody.innerHTML = `<tr><td colspan="8">No hay resultados</td></tr>`;
    return;
  }

  lista.forEach(d => {
    const tr = document.createElement("tr");
    [
      "ayuntamiento",
      "nº ocupacion",
      "denominacion ocupacion",
      "nº contratos",
      "grupo de cotizacion",
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
