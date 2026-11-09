// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase JS SDK v10 CommonJS & Auth compatibility for Expo / React Native
config.resolver.sourceExts.push('cjs');

module.exports = config;
