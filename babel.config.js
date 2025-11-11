module.exports = {
  presets: [
    [
      'module:@react-native/babel-preset',
      {
        enableBabelRuntime: false, // Deshabilitar @babel/runtime para evitar problemas de resolución
      },
    ],
  ],
  plugins: [
    'react-native-reanimated/plugin', // Debe ser el último plugin
  ],
};
