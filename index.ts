// 16 Eylül eklemesi: Supabase'in JS SDK'sı (hesap sistemi için, bkz.
// src/services/supabase.ts) tarayıcı/Node'da var olan bazı URL API'lerini
// kullanıyor — React Native'in kendi ortamında bunlar eksik/eksik davranıyor.
// Bu polyfill'i uygulamanın en başında, HER ŞEYDEN ÖNCE import etmek gerekiyor
// (Supabase client'ı import edilmeden önce devreye girmesi için) — bu yüzden
// bu dosyanın en üstünde, App importundan bile önce duruyor.
import 'react-native-url-polyfill/auto';

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
