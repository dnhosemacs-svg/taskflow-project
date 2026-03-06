//Configuracion de tailwind
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./app.js"
  ],
  theme: {
    extend: {
      colors: {
        primario: '#0D47A1',
        texto: '#1F2933',
      },
    },
  },
  plugins: [],
}

