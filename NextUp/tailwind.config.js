//Configuracion de tailwind

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./*.js"
  ],
  theme: {
    extend: {
      colors: {
        primario: "#1E88E5",
        secundario: "#697981",
        fondo: "#1565C0",
        texto: "#0D47A1"
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
  plugins: [],
}




