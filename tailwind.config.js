tailwind.config = {
  theme: {
    extend: {
      colors: {
        foco: {
          // Paleta de colores institucional para FOCO
          blue: {
            deep: '#22298A',       // Azul institucional (Headers, logos, botones)
            accent: '#7C83DE',     // Color de las Notas
            mid: '#5966B2',       // Color de las Tareas
            light: '#C6C9F1',        // Color de las Listas
            gray: '#DDE2F2',      // Fondo gris azulado del lienzo
          },
          orange: {
            accent: '#FC7206',     // Naranja de acento para la flecha y progresos
            light: '#FDA35D',      // Fondo suave para tarjetas de inspiración
          },
          gray: {
            sidebar: '#F1F3F9',    // Fondo de la sidebar izquierda
          }
        }
      },
      fontFamily: {
        sans: ['Archivo', 'Inter', 'sans-serif'],
      }
    }
  }
}
