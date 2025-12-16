const SHEET_ID = "1JomDFGbxD_uQ7aKZb42N8qNESDWfmxEO01wizw58v1I";
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Datos_Activa-T_Joven25-26`;

let datos = [];

/* ===============================
   NORMALIZAR
================================*/
function normalizar(txt){
  return txt
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .trim();
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

/* ===============================
   FILTRAR
================================*/
document.getElementById("btnBuscar").addEventListener("click", () => {
  const ay = document.getElementById("filtroAyuntamiento").value;
  const oc = document.getElementById("filtroOcupacion").value;

  let res = datos;
  if (ay) res = res.filter(d => d["ayuntamiento"] === ay);
  if (oc) res = res.filter(d => d["denominacion ocupacion"] === oc);

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
