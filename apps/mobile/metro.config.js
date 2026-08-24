// Expo Router 57's web stack imports `./toolbar` as a file. Metro needs the
// directory index so `expo start --web` can render the camera shell.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const toolbarIndex = path.resolve(
  __dirname,
  '../../node_modules/expo-router/build/layouts/stack-utils/toolbar/index.js',
);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const origin = context.originModulePath.replace(/\\/g, '/');
  if (moduleName === './toolbar' && origin.endsWith('stack-utils/StackScreen.js')) {
    return { filePath: toolbarIndex, type: 'sourceFile' };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
