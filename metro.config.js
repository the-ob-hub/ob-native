const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Forzar a Metro a buscar en node_modules local primero
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
    ],
    // Asegurar que Metro pueda resolver módulos aunque no estén en el Haste map
    disableHierarchicalLookup: false,
  },
  watchFolders: [
    path.resolve(__dirname, 'node_modules'),
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
