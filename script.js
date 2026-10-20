let scanningLocked = false;

function onScanSuccess(decodedText, decodedResult) {
  if (scanningLocked) return; // Evita peticiones duplicadas mientras se procesa una
  
  scanningLocked = true;
  console.log("Código detectado:", decodedText);

  // Consulta al backend por la zona detectada
  // decodedText puede ser un ID o nombre (ej: 1, 2, o el texto dentro del QR)
  fetch(`https://3mn4ggd4-3000.brs.devtunnels.ms/api/v1/zonas/${decodedText}`)
    .then(res => {
      if (!res.ok) throw new Error("Zona no encontrada");
      return res.json();
    })
    .then(zona => {
      mostrarDatosZona(zona);
      // Desbloquea para volver a escanear después de 3 segundos
      setTimeout(() => { scanningLocked = false; }, 3000);
    })
    .catch(err => {
      console.error(err);
      // Fallback: si tu endpoint no recibe ID individual, busca en la lista completa
      buscarEnListaGeneral(decodedText);
    });
}

function buscarEnListaGeneral(identificador) {
  fetch('https://3mn4ggd4-3000.brs.devtunnels.ms/api/v1/zonas')
    .then(res => res.json())
    .then(zonas => {
      // Intenta comparar por id o por nombre
      const zona = zonas.find(z => z.id == identificador || z.nombre == identificador);
      if (zona) {
        mostrarDatosZona(zona);
      } else {
        alert("QR escaneado: '" + identificador + "', pero no coincide con ninguna zona de Supabase.");
      }
      setTimeout(() => { scanningLocked = false; }, 3000);
    })
    .catch(e => {
      console.error("Error cargando API:", e);
      scanningLocked = false;
    });
}

function mostrarDatosZona(zona) {
  const panel = document.getElementById('info-panel');
  document.getElementById('zona-nombre').innerText = zona.nombre || "Zona";
  document.getElementById('zona-tipo').innerText = zona.tipo || "General";
  document.getElementById('zona-descripcion').innerText = zona.descripcion || "Sin descripción disponible.";
  panel.style.display = 'block';
}

// Inicializar la cámara trasera en el celular
const html5QrcodeScanner = new Html5QrcodeScanner(
  "reader", 
  { fps: 10, qrbox: { width: 250, height: 250 } },
  /* verbose= */ false
);

html5QrcodeScanner.render(onScanSuccess);