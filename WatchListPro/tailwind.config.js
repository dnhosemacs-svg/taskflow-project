//Configuracion de tailwind

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html"],
  theme: {
    extend: {
      colors: {
        primario: "#FCB861",
        secundario: "#C5620B",
        fondo: "#3c2b21",
        texto: "#b7bbbf",
        alta: "#f31800",
        media: "#decf00",
        baja: "#3cff00"
      },
      fontFamily: {
        principal: ["Arial", "sans-serif"],
        titulos: ["Georgia", "serif"]
      },
      spacing: {
        s: "8px",
        m: "16px",
        g: "32px"
      }
    }
  },
  plugins: []
}
