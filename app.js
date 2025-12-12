const SHEET_URL = "https://docs.google.com/spreadsheets/d/2PACX-1vSIDRA_WFFSC7_hQDvU99BtTzj6wd22pQbieKxyPeIaGKADD00pOviCb4N5cdpgQXu7xeB0g6mppG1Z/gviz/tq?tqx=out:json";

let registros = [];

// ----- Cargar datos -----
fetch(SHEET_URL)
  .then(res => res.text())
  .then(text => {
    const json = JSON.parse(text.substring(47, text.length - 2));

    registros = json.table.rows.map(r => r.c.map(c => c ? c.v : ""));

    console.log("Datos cargados:", registros);
  });


// ----- Filtrado -----
document.getElementById("btnBuscar").addEventListener("click", () => {
  const ay = normalizar(document.getElementById("filtroAyuntamiento").value);
  const oc = normalizar(document.getElementById("filtroOcupacion").value);
  const gc = normalizar(document.getElementById("filtroGrupo").value);
  const ne = normalizar(document.getElementById("filtroNivel").value);

  const resultados = registros.filter(r => {

    return (
      normalizar(r[1]).includes(ay) &&
      normalizar(r[5]).includes(oc) &&
      normalizar(r[8]).includes(gc) &&
      normalizar(r[7]).includes(ne)
    );
  });

  renderTabla(resultados);
});


// ----- Quitar tildes -----
function normalizar(t) {
  if (!t) return "";
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}


// ----- Mostrar tabla -----
function renderTabla(filas) {
  const tbody = document.querySelector("#tablaResultados tbody");
  tbody.innerHTML = "";

  filas.forEach(r => {
    const tr = document.createElement("tr");
    r.forEach(col => {
      const td = document.createElement("td");
      td.textContent = col;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}
