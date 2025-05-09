module.exports = {
  presets: [
    ['@vue/cli-plugin-babel/preset', {
      useBuiltIns: false, // Ne pas injecter automatiquement core-js
      corejs: false
    }]
  ]
};
