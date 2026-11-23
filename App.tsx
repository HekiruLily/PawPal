import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ToastProvider} from './src/context/ToastContext';
import {AppNavigator} from './src/navigation/AppNavigator';

function App() {
  return <SafeAreaProvider>
    <ToastProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </ToastProvider>
  </SafeAreaProvider>;
}

export default App;
