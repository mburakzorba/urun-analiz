// Learn more https://docs.expo.dev/guides/customizing-metro
//
// NOT: server/ klasörünü Metro'nun taramasından çıkarmak için resolver.blockList
// özelleştirmesi denendi, fakat bu ortamda Metro'nun dosya tarayıcısında var olan
// bir dosyayı (react-native'in kendi iç webapis modüllerinden birini) bulamama
// hatasına yol açtığı görüldü. Bu yüzden bilinçli olarak varsayılan config'i
// olduğu gibi bırakıyoruz — server/ klasörü ekstra taranıyor ama bundle'a dahil
// edilmiyor (hiçbir app kodu ondan import etmiyor), bu yüzden zararsız.
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
