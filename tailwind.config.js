/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./content/**/*.{html,md}", "./layouts/**/*.{html,js}", "./static/js/**/*.js"],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'), // Highly recommended for rendering the README markdown nicely
  ],
}