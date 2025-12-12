// ID del Google Sheet publicado (del enlace que nos diste)
const SHEET_ID = "1JomDFGbxD_uQ7aKZb42N8qNESDWfmxEO01wizw58v1I";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

//https://docs.google.com/spreadsheets/d/1JomDFGbxD_uQ7aKZb42N8qNESDWfmxEO01wizw58v1I/edit?usp=sharing
// Almacenar datos
let datos = [];

// Cargar datos con Tabletop.js
Tabletop.init({
  key: SHEET_URL,
  simpleSheet: true,
  callback: function(data, tabletop) {
    datos = data;
    console.log("Datos cargados:", datos);
    cargarDesplegables();
  }
});

// ========================
// CARGAR DESPLEGABLES
// ========================
function cargarDesplegables() {
  const selectAyto = document.getElementById('filtroAyuntamiento');
  const selectOcup = document.getElementById('filtroOcupacion');

  const ayuntamientos = [...new Set(datos.map(d => d.Ayuntamiento).filter(Boolean))];
  const ocupaciones = [...new Set(datos.map(d => d["Denominación Ocupación"]).filter(Boolean))];

  ayuntamientos.forEach(ay => {
    const op = document.createElement("option");
    op.value = ay; op.textContent = ay;
    selectAyto.appendChild(op);
  });

  ocupaciones.forEach(oc => {
    const op = document.createElement("option");
    op.value = oc; op.textContent = oc;
    selectOcup.appendChild(op);
  });
}

// ========================
// FILTRO
// ========================
document.getElementById("btnBuscar").addEventListener("click", filtrar);

function filtrar() {
  const ayto = document.getElementById("filtroAyuntamiento").value;
  const ocup = document.getElementById("filtroOcupacion").value;

  let resultados = datos;

  if (ayto !== "") resultados = resultados.filter(d => d.Ayuntamiento === ayto);
  if (ocup !== "") resultados = resultados.filter(d => d["Denominación Ocupación"] === ocup);

  mostrarResultados(resultados);
}

// ========================
// MOSTRAR RESULTADOS
// ========================
function mostrarResultados(lista) {
  const tbody = document.querySelector("#tablaResultados tbody");
  tbody.innerHTML = "";

  if (lista.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "No hay resultados.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  lista.forEach(d => {
    const tr = document.createElement("tr");
    ["Ayuntamiento", "Nº Ocupación", "Denominación Ocupación", "Nº contratos", "Grupo de cotización", "Nivel de estudios"]
      .forEach(campo => {
        const td = document.createElement("td");
        td.textContent = d[campo] || "";
        tr.appendChild(td);
      });
    tbody.appendChild(tr);
  });
}
