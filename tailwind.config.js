module.exports = {
    theme: {
      fontFamily: {
        'muli': ['Mulish', 'Helvetica', 'Arial', 'sans-serif'],
        'serif': ['MyFont', 'Georgia', 'Cambria', 'serif'],
        'mono': ['MyFont', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      width: {
        '128': '1rem',
      }
      // ...
    },
    content: [
      "./src/**/*.{html,js}",
      "./node_modules/tw-elements/dist/js/**/*.js"
    ],
    plugins: [require("tw-elements/dist/plugin")]
    // ...
  }