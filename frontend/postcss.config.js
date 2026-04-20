// Autoprefixer used to pick up `browserslist` from package.json (CRA). Vite does not use that
// field for JS; keep browser targets here so CSS prefixing matches prior production vs dev.
module.exports = () => ({
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      overrideBrowserslist:
        process.env.NODE_ENV === 'production'
          ? ['>0.2%', 'not dead', 'not op_mini all']
          : ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version'],
    },
  },
})
