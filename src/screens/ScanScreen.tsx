import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, radius, fontFamily, shadows, accent as accentRamp, primaryGradient, primaryGradientLocations } from "../theme";
import { CameraIcon, CloseIcon, FlashIcon, PlusIcon } from "../components/Icon";

// Kamera önizlemesi her zaman KOYU bir zemin üzerinde (canlı kamera görüntüsü)
// — bu yüzden üstteki kontroller/etiketler ana (krem) temanın renkleriyle
// değil, tasarım kaynağındaki (02/04 ekranları) kendi koyu-zemin paletiyle
// çiziliyor. Bunlar bilinçli olarak colors.* içinde YOK, çünkü sadece bu
// koyu kamera overlay'inde kullanılıyorlar.
const OVERLAY_TEXT = "#F3EFE8";
const OVERLAY_MINT = "#9BD9AE";
const OVERLAY_AMBER_TEXT = "#FBD9A0";
const OVERLAY_AMBER_BG = "rgba(198,138,46,0.2)";
const OVERLAY_AMBER_BORDER = "rgba(198,138,46,0.45)";
const OVERLAY_BANNER_BG = "rgba(20,19,18,0.72)";
const OVERLAY_BTN_BG = "rgba(0,0,0,0.4)";

type Props = NativeStackScreenProps<RootStackParamList, "Scan">;

// ÖNEMLİ: Barkod tarama TAMAMEN KALDIRILDI. Denemelerde barkod algılama —
// hem gerçek barkodu okuyup Open Beauty Facts'te bulamaması hem de arka
// planda sürekli barkod arayıp (ör. üründeki küçük bir barkodu görüş
// alanının kenarında yakalayıp) deklanşör davranışını "barkod çek" moduna
// kaçırması yüzünden — kullanıcıyı asıl istediğimiz İÇERİK LİSTESİ +
// "ürün nedir/ne için kullanılacak" formundan uzaklaştırıyordu. Artık her
// çekim doğrudan bu forma gidiyor, barkodla ilgili hiçbir kod çalışmıyor.
// (Backend'deki Open Beauty Facts entegrasyonu dokunulmadan kalıyor ama
// client hiçbir zaman barkod göndermediği için hiç tetiklenmiyor.)

// ÖNEMLİ DÜZELTME: expo-camera'nın getAvailableLensesAsync() fonksiyonu lens
// adlarını iOS'un "localizedName" değeri olarak döner (örn. "Back Camera",
// "Back Ultra Wide Camera", "Back Dual Wide Camera") — "builtInWideAngleCamera"
// gibi iç (native enum) isimlerle DEĞİL. Önceki kod bu ismi arıyordu ve hiçbir
// zaman eşleşmiyordu; bu yüzden selectedLens hep boş kalıyor, expo-camera da
// varsayılan cihazı kullanıyordu — iPhone 13 Pro ve sonrasında bu varsayılan
// genelde "Back Dual Wide Camera" gibi SANAL (virtual) bir cihaz oluyor ve bu
// sanal cihaz, yakın mesafede otomatik olarak 0.5x ultra-geniş lense geçiyor
// (macro modu). Tek fiziksel geniş açı lensini ("Back Camera") açıkça
// seçtiğimizde bu sanal-cihaz geçişi hiç devreye girmiyor, çünkü artık ortada
// "geçilecek" başka bir lens yok.
const MAIN_LENS_EXACT = "Back Camera";

// "Bu ürünü ne için kullanmak istiyorsun?" artık serbest metin DEĞİL —
// kullanıcı uğraşıp yazmak istemeyebiliyor, bu yüzden seçilebilir hazır
// seçenekler sunuyoruz. Önce ürün kategorisi seçiliyor (bu, hangi "ne için"
// seçeneklerinin gösterileceğini belirliyor), sonra o kategoriye uygun
// amaç seçenekleri çıkıyor. Seçilenler backend'e aynı "userIntent" metin
// alanına (virgülle birleştirilip) gönderiliyor — pipeline'da değişiklik
// gerekmedi.
const PRODUCT_CATEGORIES = [
  "Şampuan / Saç Bakımı",
  "Yüz Bakımı / Krem",
  "Vücut / Duş",
  "Parfüm / Deodorant",
  "Diğer",
] as const;
type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

const INTENT_OPTIONS: Record<ProductCategory, string[]> = {
  "Şampuan / Saç Bakımı": [
    "Saç Dökülmesine Karşı",
    "Kepeğe Karşı",
    "Nemlendirme / Onarım",
    "Hacim / Canlandırma",
    "Boyalı Saç Bakımı",
    "Günlük Temizlik",
  ],
  "Yüz Bakımı / Krem": [
    "Nemlendirme",
    "Anti-Aging / Kırışıklık",
    "Akne / Sivilce",
    "Leke / Ton Eşitleme",
    "Gözenek Sıkılaştırma",
    "Güneş Koruma",
  ],
  "Vücut / Duş": ["Nemlendirme", "Peeling / Arındırma", "Sıkılaştırma", "Ferahlık"],
  "Parfüm / Deodorant": ["Ter Kontrolü", "Koku / Ferahlık", "Hassas Cilt İçin"],
  Diğer: ["Genel Bakım", "Belirli Bir Amacım Yok"],
};

// Ekrandaki çerçeveleme kılavuzunun boyutu (ekranın yüzdesi olarak). Aynı
// değerler hem kılavuzu çizmek hem de fotoğrafı kırpmak için kullanılıyor —
// yani kullanıcı çerçevenin içine ne koyduysa AI'ye giden görsel tam olarak o.
// 7 Eylül düzeltmesi: kullanıcı geri bildirimi — çerçeve, yazıyı yakalamak
// için küçük geliyordu. %82/%42'den %92/%68'e büyütüldü (guideWrap'in KALAN
// dikey alanına göre yüzde — bkz. aşağıdaki guideWrap/guideFrame stilleri).
// Not: cropToGuideFrame() artık çerçevenin GERÇEK ölçülmüş konumunu (guideRect)
// kullandığı için, bu değerleri büyütmek fotoğrafın kırpılan bölgesini de
// otomatik olarak aynı oranda büyütür — ayrıca bir şey güncellemeye gerek yok.
const GUIDE_W = 0.92;
const GUIDE_H = 0.68;

/**
 * Çekilen fotoğrafı, ekrandaki kılavuz çerçevesine denk gelen bölgeye kırpar.
 * İçerik/bileşen listesi fotoğrafları için kullanılıyor (yakın çekim, yazının
 * okunabilir kalması kritik).
 *
 * NEDEN GEREKLİ: Kullanıcı ürünü biraz uzaktan çektiğinde, içerik listesi
 * 4000x3000'lik fotoğrafın küçücük bir bölgesinde kalıyor. Görsel API'ye
 * gönderilirken otomatik küçültüldüğü için o minik yazılar tamamen okunamaz
 * hale geliyordu. Sadece çerçeve içini gönderirsek aynı yazı çok daha fazla
 * piksele denk geliyor ve okunabiliyor.
 *
 * Kamera önizlemesi ekranı "cover" mantığıyla dolduruyor (fotoğrafın kenarları
 * ekran dışında kalıyor), o yüzden ekran koordinatlarını fotoğraf
 * koordinatlarına çevirirken bu taşmayı hesaba katmamız gerekiyor.
 */
// Claude'un görsel analizinde "standart" çözünürlük katmanı en uzun kenarı
// ~1568 piksele kadar kullanıyor — bunun ÜZERİNDEKİ piksellerin OCR/okuma
// kalitesine katkısı yok, sadece token (=maliyet) olarak faturaya yansıyor.
// quality:1 ile çekilen telefon fotoğrafları genelde 3000-4000px civarında
// oluyor; AI'ye göndermeden önce bu boyuta indirmek görüntü kalitesini
// ETKİLEMEDEN (model zaten kendi içinde bu boyuta indiriyor) tarama başına
// görsel maliyetini belirgin şekilde düşürüyor.
const MAX_UPLOAD_DIMENSION = 1568;

async function resizeForUpload(uri: string, width?: number, height?: number): Promise<string> {
  if (!width || !height) return uri;
  const longest = Math.max(width, height);
  if (longest <= MAX_UPLOAD_DIMENSION) return uri; // zaten küçük, gerek yok
  try {
    const scale = MAX_UPLOAD_DIMENSION / longest;
    const ctx = ImageManipulator.manipulate(uri);
    ctx.resize({ width: Math.round(width * scale), height: Math.round(height * scale) });
    const rendered = await ctx.renderAsync();
    const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
    return saved.uri || uri;
  } catch {
    return uri; // küçültme başarısız olursa orijinali gönder — analiz yine çalışsın.
  }
}

// 7 Eylül düzeltmesi: Bu fonksiyon eskiden kılavuz çerçevesinin ekranın TAM
// ORTASINDA olduğunu VARSAYIYORDU (GUIDE_W/GUIDE_H yüzdeleriyle hesaplanmış).
// Kamera overlay'indeki çakışmayı düzeltmek için çerçeveyi topBar/bottomBar
// ile aynı flex sütununa taşıyınca (aralarında KALAN boşlukta ortalanıyor
// artık — bkz. aşağıdaki JSX'teki not), bu varsayım artık YANLIŞ: çerçeve
// ekranın ortasında değil, topBar'ın yüksekliğine göre değişen bir yerde
// duruyor. O yüzden artık çerçevenin GERÇEK ekran konumunu (guideRect —
// measureInWindow ile ölçülüyor, bkz. component içindeki guideFrameRef) alıp
// doğrudan onu kullanıyoruz; GUIDE_W/GUIDE_H'ye dayalı eski hesap sadece
// guideRect henüz ölçülememişse (ör. çok hızlı bir çekim) YEDEK olarak kalıyor.
async function cropToGuideFrame(
  uri: string,
  photoW?: number,
  photoH?: number,
  guideRect?: { x: number; y: number; width: number; height: number } | null
): Promise<string> {
  if (!photoW || !photoH) return uri;
  try {
    const { width: screenW, height: screenH } = Dimensions.get("window");

    // "cover": fotoğraf, ekranı tamamen dolduracak en küçük ölçekle büyütülür.
    const scale = Math.max(screenW / photoW, screenH / photoH);
    const visibleW = screenW / scale; // fotoğrafın ekranda görünen kısmı (piksel)
    const visibleH = screenH / scale;
    const offsetX = (photoW - visibleW) / 2; // ekran dışında kalan kenar payı
    const offsetY = (photoH - visibleH) / 2;

    let cropW: number;
    let cropH: number;
    let cropX: number;
    let cropY: number;

    if (guideRect && guideRect.width > 0 && guideRect.height > 0) {
      // Kılavuz çerçevesinin GERÇEK (ölçülmüş) ekran konumu — ekran
      // koordinatlarından fotoğraf koordinatlarına aynı "cover" ölçeğiyle
      // çevriliyor.
      cropW = guideRect.width / scale;
      cropH = guideRect.height / scale;
      cropX = offsetX + guideRect.x / scale;
      cropY = offsetY + guideRect.y / scale;
    } else {
      // Yedek: guideRect ölçülemediyse eski varsayım (tam ekranda ortalı).
      cropW = visibleW * GUIDE_W;
      cropH = visibleH * GUIDE_H;
      cropX = offsetX + (visibleW - cropW) / 2;
      cropY = offsetY + (visibleH - cropH) / 2;
    }

    // Kullanıcının çerçevelemesi biraz kaymış olabilir — her yönde %10 pay
    // bırakıyoruz ki etiketin kenarı kesilmesin.
    const padX = cropW * 0.1;
    const padY = cropH * 0.1;
    cropX = Math.max(0, cropX - padX);
    cropY = Math.max(0, cropY - padY);
    cropW = Math.min(photoW - cropX, cropW + padX * 2);
    cropH = Math.min(photoH - cropY, cropH + padY * 2);

    if (cropW < 50 || cropH < 50) return uri; // mantıksız sonuç — orijinali kullan

    const ctx = ImageManipulator.manipulate(uri);
    ctx.crop({
      originX: Math.round(cropX),
      originY: Math.round(cropY),
      width: Math.round(cropW),
      height: Math.round(cropH),
    });
    // Kırpılmış bölge de (nadiren) MAX_UPLOAD_DIMENSION'ı aşabilir — aynı
    // işlem içinde (tek geçişte) gerekirse küçültüyoruz, ayrı bir adım
    // eklemeye gerek yok.
    const longestCropped = Math.max(cropW, cropH);
    if (longestCropped > MAX_UPLOAD_DIMENSION) {
      const downscale = MAX_UPLOAD_DIMENSION / longestCropped;
      ctx.resize({ width: Math.round(cropW * downscale), height: Math.round(cropH * downscale) });
    }
    const rendered = await ctx.renderAsync();
    const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.95 });
    return saved.uri || uri;
  } catch {
    // Kırpma başarısız olursa orijinal fotoğrafla devam et — analiz yine çalışsın.
    return uri;
  }
}

// idle: normal tarama modu (ana fotoğrafı bekliyor)
// capturingSecond: kullanıcı ikinci bir fotoğraf ekliyor (etiketin devamı ya
//   da klasik arka yüz) — bir sonraki deklanşör basışı bu fotoğrafı kaydeder
// details: fotoğraf(lar) çekildi, kullanıcı ürün adı/içerik/kullanım amacı
//   gibi opsiyonel bilgileri girip analizi başlatıyor
type Stage = "idle" | "capturingSecond" | "details";

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, selected && styles.chipSelected]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [selectedLens, setSelectedLens] = useState<string | undefined>(undefined);

  // 7 Eylül düzeltmesi: kılavuz çerçevesi artık topBar'ın yüksekliğine göre
  // KAYABİLEN bir konumda (bkz. guideWrap/guideFrame JSX'i aşağıda) — bu
  // yüzden cropToGuideFrame()'in doğru bölgeyi kırpabilmesi için çerçevenin
  // GERÇEK ekran konumunu ölçüp burada tutuyoruz. measureGuideFrame,
  // guideFrame View'inin onLayout'unda çağrılıyor; her topBar boyu
  // değiştiğinde (banner metni satır sayısı değiştiğinde vb.) yeniden ölçülür.
  const guideFrameRef = useRef<View>(null);
  const [guideRect, setGuideRect] = useState<{ x: number; y: number; width: number; height: number } | null>(
    null
  );
  const measureGuideFrame = useCallback(() => {
    guideFrameRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        setGuideRect({ x, y, width, height });
      }
    });
  }, []);

  // ÖNEMLİ MANTIK DEĞİŞİKLİĞİ: Barkod/Open Beauty Facts tek başına güvenilir
  // değil (çoğu üründe kayıt yok ya da eksik) — bu yüzden barkodsuz akışta
  // artık varsayılan olarak doğrudan İÇERİK/BİLEŞEN LİSTESİ fotoğrafını
  // istiyoruz (en değerli veri bu), ürünün ön yüzünü değil. Bazı ürünlerde
  // (ör. tarak, fırça gibi içerik listesi olmayan ürünler) kullanıcı bunu
  // "noIngredientsMode" ile kapatıp eski ön+arka yüz akışına geçebiliyor.
  const [noIngredientsMode, setNoIngredientsMode] = useState(false);
  const [primaryUri, setPrimaryUri] = useState<string | null>(null);
  const [secondUri, setSecondUri] = useState<string | null>(null);

  // Barkod/görsel AI marka tanısa bile tam ürünü/varyantı kaçırabiliyor (ör.
  // "saç dökülmesine karşı" olduğunu anlayamama) — bu yüzden "details"
  // ekranında ürün adını HER ZAMAN görünür şekilde soruyoruz. ARTIK ZORUNLU
  // (20 Ağustos 2026): testlerde, ürün adı boş bırakıldığında AI aynı ürünü
  // farklı taramalarda farklı isim/bileşenle karıştırabiliyordu (ör. bir
  // etikette birden fazla ürün adı geçtiğinde); ayrıca isim olmadan
  // index.js'teki önbellek de devreye giremiyor. O yüzden isim girilmeden
  // "Analiz Et" ilerlemiyor — bkz. submitDetails() ve nameError state'i.
  const [productNameHint, setProductNameHint] = useState("");
  const [nameError, setNameError] = useState(false);
  // İçerik listesi fotoğraftan net okunamıyorsa (kavisli şişe, küçük/soluk
  // yazı vb.) AI genel/tipik bir formülasyona düşüyor — kullanıcı etikette
  // yazan listeyi buraya elle yazabilirse (kopyala-yapıştır dahil), AI'ye
  // bunu DOĞRULANMIŞ veri olarak veriyoruz. Bu alan hâlâ katlanır/opsiyonel —
  // iki fotoğraf genelde yeterli oluyor, sadece gerektiğinde açılıyor.
  const [showIngredientsHint, setShowIngredientsHint] = useState(false);
  const [ingredientsHint, setIngredientsHint] = useState("");
  // "Bu ürünü ne için kullanmak istiyorsun?" — artık serbest metin değil,
  // seçilebilir chip'ler (kullanıcı yazmak zorunda kalmasın diye). Önce
  // kategori seçiliyor, ardından o kategoriye uygun amaç seçenekleri çıkıyor.
  const [productCategoryHint, setProductCategoryHint] = useState<ProductCategory | null>(null);
  const [selectedIntents, setSelectedIntents] = useState<string[]>([]);

  // Kamera hazır olunca cihazdaki lensleri sorup ana (1x geniş açı) lensi
  // açıkça seçiyoruz. iOS dışında bu API yok, o yüzden hata durumunu sessizce
  // yutuyoruz (varsayılan lens kullanılmaya devam eder).
  const handleCameraReady = useCallback(async () => {
    try {
      const lenses = await cameraRef.current?.getAvailableLensesAsync();
      if (!lenses?.length) return;
      // Debug: bu satır Metro/Expo terminalinde hangi lens isimlerinin
      // geldiğini gösterir — cihazlar arası isim farkı olursa buradan görülür.
      console.log("[ScanScreen] Kullanılabilir lensler:", lenses);
      // Önce tam eşleşme ("Back Camera" — tek, fiziksel, sanal olmayan geniş
      // açı lensi). Bulunamazsa: adında "wide" geçen ama "ultra/dual/triple/
      // tele" geçmeyen bir lens ara (bazı cihazlarda isimlendirme farklı
      // olabilir). O da yoksa: en azından sanal/çoklu-lens olmayan (dual/
      // triple/ultra/tele içermeyen) herhangi bir arka lens.
      const main =
        lenses.find((l) => l === MAIN_LENS_EXACT) ??
        lenses.find((l) => /wide/i.test(l) && !/ultra|dual|triple|tele/i.test(l)) ??
        lenses.find((l) => !/ultra|dual|triple|tele/i.test(l));
      console.log("[ScanScreen] Seçilen lens:", main);
      if (main) setSelectedLens(main);
    } catch (e) {
      // iOS dışı platform ya da desteklenmeyen cihaz — varsayılanla devam.
      console.log("[ScanScreen] Lens seçimi başarısız:", e);
    }
  }, []);

  const goToAnalyzing = (
    imageUri: string,
    backImageUri?: string,
    userProvidedName?: string,
    userProvidedIngredients?: string,
    userIntent?: string,
    bothImagesAreIngredients?: boolean
  ) => {
    navigation.replace("Analyzing", {
      imageUri,
      backImageUri,
      userProvidedName,
      userProvidedIngredients,
      userIntent,
      bothImagesAreIngredients,
    });
  };

  const takePhoto = async (opts?: { isSecondShot?: boolean }) => {
    if (!cameraRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      // quality 1: içerik listesi gibi küçük yazıların AI tarafından
      // okunabilmesi için JPEG sıkıştırmasını en aza indiriyoruz.
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!photo?.uri) return;

      if (opts?.isSecondShot) {
        // İkinci fotoğraf HER ZAMAN çerçeveye kırpılıyor: ya içerik listesinin
        // devamı (kavisli şişede etiket tek karede sığmadıysa) ya da klasik
        // arka yüz/içerik listesi — ikisi de yakın çekim gerektiriyor.
        const cropped = await cropToGuideFrame(photo.uri, photo.width, photo.height, guideRect);
        setSecondUri(cropped);
        setStage("details");
        return;
      }

      // Ana fotoğraf. noIngredientsMode'da bu ÖN yüz (ürünün tamamı
      // görünmeli, kırpma YOK — eski davranış). Normal (varsayılan) modda bu
      // doğrudan İÇERİK/BİLEŞEN LİSTESİ fotoğrafı — çerçeveye kırpılır, çünkü
      // artık en değerli/öncelikli veri bu.
      const primary = noIngredientsMode
        ? await resizeForUpload(photo.uri, photo.width, photo.height)
        : await cropToGuideFrame(photo.uri, photo.width, photo.height, guideRect);
      setPrimaryUri(primary);
      setStage("details");
    } catch (e) {
      Alert.alert("Hata", "Fotoğraf çekilemedi, tekrar dener misin?");
    } finally {
      setIsCapturing(false);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      // Galeriden seçilen fotoğrafta barkod algılamıyoruz, direkt AI analizine düşer.
      const asset = result.assets[0];
      const resized = await resizeForUpload(asset.uri, asset.width, asset.height);
      goToAnalyzing(resized);
    }
  };

  const retakePrimary = () => {
    setPrimaryUri(null);
    // Ana fotoğraf değişince ikinci fotoğraf da tutarsızlaşabilir (ör. moda
    // geçişi), temizleyip baştan başlatıyoruz.
    setSecondUri(null);
    setStage("idle");
  };

  const startSecondShot = () => setStage("capturingSecond");

  const retakeSecond = () => {
    setSecondUri(null);
    setStage("capturingSecond");
  };

  const toggleIntent = (opt: string) => {
    setSelectedIntents((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]));
  };

  const selectCategory = (cat: ProductCategory) => {
    // Kategori değişince o kategoriye ait olmayan seçili amaçlar anlamsız
    // kalır — temizliyoruz.
    setProductCategoryHint((prev) => (prev === cat ? null : cat));
    setSelectedIntents([]);
  };

  const submitDetails = () => {
    if (!primaryUri) return;
    // Ürün adı artık zorunlu — bkz. productNameHint tanımındaki not. Boşsa
    // analize hiç başlamıyoruz, kullanıcıya kırmızı uyarı gösteriyoruz.
    if (!productNameHint.trim()) {
      setNameError(true);
      return;
    }
    goToAnalyzing(
      primaryUri,
      secondUri || undefined,
      productNameHint,
      ingredientsHint,
      // Seçilen amaç chip'leri tek bir metne birleştirilip backend'e aynı
      // "userIntent" alanıyla gidiyor — pipeline'da hiçbir değişiklik
      // gerekmedi, sadece bu değerin NASIL üretildiği değişti (serbest metin
      // yerine seçim).
      selectedIntents.join(", "),
      // İki fotoğraf da içerik/bileşen listesiyse (noIngredientsMode kapalı
      // ve ikinci fotoğraf çekildiyse), backend'e "bunlar ön/arka değil,
      // aynı etiketin iki parçası" diye ayrı bir talimat kullanması için
      // haber veriyoruz.
      !noIngredientsMode && !!secondUri
    );
  };

  if (!permission) {
    return <View style={styles.safe} />;
  }

  if (!permission.granted) {
    // Tasarım kaynağı: "C Kamera izni" ekranı — ikon rozeti, başlık, açıklama,
    // gradyanlı ana buton + krem ikincil buton. Birebir aktarıldı.
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionBox}>
          <View style={styles.permissionIconBadge}>
            <CameraIcon size={40} color={colors.primary} strokeWidth={2.75} />
          </View>
          <Text style={styles.permissionTitle}>Kameraya erişim gerekiyor</Text>
          <Text style={styles.permissionText}>
            Etiketi okuyabilmek için kamerayı kullanıyoruz. Fotoğraflar yalnızca analiz için işlenir,
            paylaşılmaz.
          </Text>
          <View style={styles.permissionActions}>
            <TouchableOpacity onPress={requestPermission} activeOpacity={0.9}>
              <LinearGradient
                colors={primaryGradient}
                locations={primaryGradientLocations}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.permissionBtn}
              >
                <Text style={styles.permissionBtnText}>İzin ver</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.galleryLinkBtn} onPress={pickFromGallery} activeOpacity={0.85}>
              <Text style={styles.galleryLinkText}>Galeriden fotoğraf seç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Detay formu: fotoğraf(lar) çekildi, kullanıcı ürün adı/içerik/kullanım
  // amacı gibi opsiyonel bilgileri girip analizi başlatıyor. Her çekim
  // (barkod yok artık) buraya uğruyor.
  if (stage === "details" && primaryUri) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.detailsContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.previewTitle}>Ürün Detayları</Text>
          <Text style={styles.previewSubtitle}>
            {noIngredientsMode
              ? "Ön yüz fotoğrafını kaydettik. Aşağıdan arka yüzü de ekleyebilir, ürünün ne olduğunu yazabilirsin."
              : "İçerik/bileşen listesi fotoğrafını kaydettik. Yazılar okunmuyorsa tekrar çek; kavisli bir şişeyse devamını da ekleyebilirsin."}
          </Text>

          <View style={styles.photoRow}>
            <View style={styles.photoSlot}>
              <Image source={{ uri: primaryUri }} style={styles.detailsThumb} resizeMode="cover" />
              <TouchableOpacity onPress={retakePrimary}>
                <Text style={styles.retakeLink}>Tekrar çek</Text>
              </TouchableOpacity>
            </View>

            {secondUri ? (
              <View style={styles.photoSlot}>
                <Image source={{ uri: secondUri }} style={styles.detailsThumb} resizeMode="cover" />
                <TouchableOpacity onPress={retakeSecond}>
                  <Text style={styles.retakeLink}>Tekrar çek</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addPhotoSlot} onPress={startSecondShot} activeOpacity={0.8}>
                <PlusIcon size={17} color={accentRamp[600]} />
                <Text style={styles.addPhotoText}>
                  {noIngredientsMode ? "Arka yüzünü\nde çek" : "Etiketin\ndevamı var mı?"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.fieldLabelStrong}>Bu ürün nedir? (marka + ürün adı) *</Text>
          <TextInput
            style={[styles.detailsInput, nameError && styles.detailsInputError]}
            placeholder='Örn: "Vichy Dercos Aminexil Saç Dökülmesine Karşı Şampuan"'
            placeholderTextColor={colors.textFaint}
            value={productNameHint}
            onChangeText={(text) => {
              setProductNameHint(text);
              if (nameError && text.trim()) setNameError(false);
            }}
          />
          {nameError ? (
            <Text style={styles.fieldError}>
              Ürün adını yazman gerekiyor — AI'nin doğru ürünü/markayı tanıması ve aynı ürünü tekrar
              taradığında tutarlı sonuç verebilmesi için gerekli.
            </Text>
          ) : (
            <Text style={styles.fieldHint}>
              AI barkod/görselden markayı tanısa bile tam ürünü/varyantı kaçırabiliyor — yazman sonucu
              belirgin şekilde iyileştiriyor.
            </Text>
          )}

          {showIngredientsHint ? (
            <TextInput
              style={[styles.detailsInput, styles.multilineInput]}
              placeholder="İçerik listesini biliyorsan/okuyabiliyorsan buraya yazabilirsin (opsiyonel)"
              placeholderTextColor={colors.textFaint}
              value={ingredientsHint}
              onChangeText={setIngredientsHint}
              multiline
              numberOfLines={3}
            />
          ) : (
            <TouchableOpacity onPress={() => setShowIngredientsHint(true)}>
              <Text style={styles.nameHintToggle}>İçerik listesini de yazabilirsin (opsiyonel)</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.fieldLabelCaps}>Bu ürün ne tür bir ürün? (opsiyonel)</Text>
          <View style={styles.chipRow}>
            {PRODUCT_CATEGORIES.map((cat) => (
              <Chip key={cat} label={cat} selected={productCategoryHint === cat} onPress={() => selectCategory(cat)} />
            ))}
          </View>

          {productCategoryHint && productCategoryHint !== "Diğer" && (
            <>
              <Text style={styles.fieldLabelCaps}>Ne için kullanmak istiyorsun? (opsiyonel)</Text>
              <View style={styles.chipRow}>
                {INTENT_OPTIONS[productCategoryHint].map((opt) => (
                  <Chip key={opt} label={opt} selected={selectedIntents.includes(opt)} onPress={() => toggleIntent(opt)} />
                ))}
              </View>
            </>
          )}

          {/* NOT (6 Eylül düzeltmesi): tasarım kaynağında (03_Ürün_detayları.html)
              bu buton GRADYAN DEĞİL, düz #C67139 (colors.primary) — gradyan
              yalnızca izin ekranındaki "İzin ver" butonunda kullanılıyor
              (aşağıdaki permissionBtn, o doğru şekilde gradyan kalıyor).
              Önceki turda bu ikisi karıştırılıp buraya da gradyan
              uygulanmıştı. */}
          <TouchableOpacity onPress={submitDetails} activeOpacity={0.9} style={styles.analyzeBtn}>
            <Text style={styles.analyzeBtnText}>Analiz et</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safe}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        autofocus="on"
        enableTorch={torchOn}
        onCameraReady={handleCameraReady}
        // Ana (1x) kamera lensini açıkça seçiyoruz — bkz. MAIN_LENS notu.
        selectedLens={selectedLens}
        zoom={0}
      />

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          {/* 9 Eylül düzeltmesi (kullanıcı geri bildirimi): kapatma (X)
              butonu buradan, ekranın en üst-sol köşesinden kaldırıldı —
              telefonu tek elle tutarken başparmakla ulaşması zordu. Artık
              alt bar'da, galeri butonuyla simetrik şekilde SAĞ ALT'ta (bkz.
              bottomBar) — başparmağın zaten durduğu bölge. Üstte sadece
              flaş butonu kalıyor. */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => setTorchOn((t) => !t)}
              style={[styles.closeBtn, torchOn && styles.torchBtnActive]}
            >
              <FlashIcon size={15} color={torchOn ? "#fff" : "#FFD97A"} />
            </TouchableOpacity>
          </View>
          {stage === "capturingSecond" ? (
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                {noIngredientsMode
                  ? "Şimdi ürünün ARKA yüzünü çerçeveye tut ve çek."
                  : "Şişeyi biraz döndür, etiketin DEVAMINI çerçeveye tut ve çek."}
              </Text>
            </View>
          ) : (
            <View>
              {!noIngredientsMode && (
                <View style={styles.tipBanner}>
                  <Text style={styles.tipBannerText}>
                    💡 İçerik listesini bulamadıysan bak: genelde ürünün ARKA veya ALT kısmında, küçük
                    puntolu yazıyla yazılıdır.
                  </Text>
                </View>
              )}
              <Text style={styles.hint}>
                {noIngredientsMode
                  ? "Ürünün ÖN yüzünü çerçeveye tut ve çek — ardından arka yüzünü de çekmen istenecek."
                  : "Ürünün İÇERİK/BİLEŞEN LİSTESİNİN olduğu kısmı çerçeveye tut ve çek."}
              </Text>
              <TouchableOpacity onPress={() => setNoIngredientsMode((v) => !v)}>
                <Text style={styles.modeSwitchLink}>
                  {noIngredientsMode
                    ? "← İçerik listesi var, öyle devam edeyim"
                    : "Bu üründe içerik/bileşen listesi yok →"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Çerçeveleme kılavuzu: kullanıcının etiketi/barkodu kadraja tam
            doldurması, AI'nin küçük yazıları okuyabilmesi için en kritik
            nokta. NOT (7 Eylül düzeltmesi): eskiden bu, topBar/bottomBar'dan
            BAĞIMSIZ, tüm ekranı kaplayan ayrı bir katmanda dikey ORTALANIYORDU
            — yani topBar'daki metin (özellikle iki banner + mode-switch
            linki üst üste bindiğinde) ekranın 3-4 satırını kaplayınca,
            SABİT bir yükseklikte ortalanan bu çerçeve topBar'ın son satırının
            üzerine biniyordu. Android'de daha dar ekranlarda metin daha çok
            satıra bölündüğü için bu çakışma orada belirginleşti. Artık
            topBar/bottomBar ile AYNI flex sütununda, aralarında KALAN
            boşlukta ortalanıyor — topBar ne kadar uzasa da (kaç satıra
            bölünürse bölünsün) çerçeveyle asla çakışmıyor. */}
        <View style={styles.guideWrap} pointerEvents="none">
          {/* ref + onLayout: çerçevenin GERÇEK ekran konumunu ölçüp
              guideRect'e kaydediyoruz — cropToGuideFrame() artık bu ölçümü
              kullanıyor (bkz. yukarıdaki fonksiyon başındaki 7 Eylül notu). */}
          <View ref={guideFrameRef} style={styles.guideFrame} onLayout={measureGuideFrame} />
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={pickFromGallery} style={styles.galleryBtn}>
            <Text style={styles.galleryBtnText}>Galeri</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => takePhoto(stage === "capturingSecond" ? { isSecondShot: true } : undefined)}
            style={styles.shutterBtn}
            disabled={isCapturing}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>
          <View style={styles.closeBtnBottomWrap}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
              <CloseIcon size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  overlay: { flex: 1, justifyContent: "space-between" },
  // Artık tüm ekranı kaplayan ayrı bir katman değil — topBar ve bottomBar
  // arasında KALAN alanı dolduran normal bir flex çocuğu (bkz. yukarıdaki
  // JSX'teki 7 Eylül notu).
  guideWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  guideFrame: {
    width: `${GUIDE_W * 100}%`,
    height: `${GUIDE_H * 100}%`,
    borderWidth: 2,
    // Tasarım kaynağı ("02"/"04" ekranları): border:2px solid rgba(255,255,255,.6)
    // — önceki değer (.75) tasarımdakinden daha belirgin/opak duruyordu.
    borderColor: "rgba(255,255,255,0.6)",
    borderRadius: radius.md,
  },
  topBar: { padding: spacing.lg },
  // Artık sadece flaş butonu var (bkz. 9 Eylül notu) — sağa hizalı kalması
  // için "space-between" yerine "flex-end".
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: spacing.md,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: OVERLAY_BTN_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  // Kapatma (X) butonunun alt bar'daki sarmalayıcısı — galleryBtn ile aynı
  // genişlikte (64) ki shutter tam ortada kalsın, içindeki gerçek dokunma
  // alanı ise closeBtn boyutunda (34x34) ama bottomBar'ın padding'i sayesinde
  // ekranın köşesine YAPIŞIK değil, başparmağın doğal durduğu bölgede.
  closeBtnBottomWrap: { width: 64, alignItems: "flex-end" },
  torchBtnActive: { backgroundColor: colors.primary },
  hint: {
    color: OVERLAY_TEXT,
    backgroundColor: OVERLAY_BANNER_BG,
    padding: spacing.md,
    borderRadius: 16,
    fontSize: 13,
    lineHeight: 18,
  },
  modeSwitchLink: {
    color: OVERLAY_MINT,
    fontSize: 12.5,
    fontFamily: fontFamily.semibold,
    marginTop: spacing.sm,
    alignSelf: "flex-start",
  },
  infoBanner: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 16,
    ...shadows.lifted(colors.primaryDark),
  },
  infoBannerText: { color: "#fff", fontSize: 13, fontFamily: fontFamily.semibold, lineHeight: 18 },
  tipBanner: {
    backgroundColor: OVERLAY_AMBER_BG,
    borderWidth: 1,
    borderColor: OVERLAY_AMBER_BORDER,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tipBannerText: { color: OVERLAY_AMBER_TEXT, fontSize: 12.5, fontFamily: fontFamily.semibold, lineHeight: 18 },
  detailsContainer: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  previewTitle: { fontFamily: fontFamily.semibold, color: colors.text, fontSize: 22, letterSpacing: -0.6, marginBottom: spacing.xs },
  previewSubtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: spacing.md },
  photoRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  photoSlot: { alignItems: "center" },
  detailsThumb: { width: 120, height: 120, borderRadius: 18, backgroundColor: colors.card },
  retakeLink: { color: accentRamp[600], fontSize: 12, fontFamily: fontFamily.semibold, marginTop: 7 },
  addPhotoSlot: {
    width: 120,
    height: 120,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(32,30,29,0.22)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: spacing.xs,
  },
  addPhotoText: { color: accentRamp[600], fontSize: 11, fontFamily: fontFamily.semibold, textAlign: "center", lineHeight: 15 },
  fieldLabelStrong: { color: colors.text, fontSize: 13.5, fontFamily: fontFamily.semibold, marginTop: spacing.md, marginBottom: 8 },
  fieldLabelCaps: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fontFamily.semibold,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    marginTop: spacing.md,
    marginBottom: 9,
  },
  fieldHint: { color: colors.textMuted, fontSize: 11.5, marginTop: 4, lineHeight: 15 },
  fieldError: { color: colors.danger, fontSize: 11.5, marginTop: 4, lineHeight: 15, fontFamily: fontFamily.semibold },
  detailsInputError: { borderWidth: 1, borderColor: colors.danger },
  detailsInput: {
    color: colors.text,
    fontSize: 14,
    backgroundColor: "#F3EBDD",
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  multilineInput: { minHeight: 64, height: undefined, paddingVertical: 12, textAlignVertical: "top" },
  nameHintToggle: { color: accentRamp[600], fontSize: 12, fontFamily: fontFamily.semibold, marginTop: spacing.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  // Tasarımdaki ".pill" — seçili: dolu turuncu zemin/beyaz yazı; seçili
  // değil: beyaz zemin + ince "hairline" halka (gölge yerine border) + soluk
  // olmayan (textMuted) yazı.
  chip: {
    height: 29,
    borderRadius: 999,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(32,30,29,0.08)",
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 11.5, fontFamily: fontFamily.semibold, letterSpacing: -0.1 },
  chipTextSelected: { color: "#fff" },
  analyzeBtn: {
    borderRadius: radius.pill,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    ...shadows.glow(colors.primaryDark),
  },
  analyzeBtnText: { color: "#fff", fontSize: 14.5, fontFamily: fontFamily.semibold, letterSpacing: -0.2 },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  galleryBtn: { width: 64, alignItems: "flex-start" },
  // Tasarım kaynağı: font-size:12px (66'dan/13'ten değil, birebir eşleşsin diye düzeltildi).
  galleryBtnText: { color: "#fff", fontSize: 12, fontFamily: fontFamily.semibold },
  // Tasarım kaynağı ("02"/"04" ekranları): 58x58 dış halka (border 3px) + 48x48
  // iç dolu daire — önceki değerler (66/54) tasarımdakinden biraz büyüktü.
  shutterBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#fff" },
  // Tasarım kaynağı: "C Kamera izni" ekranı — ikon rozeti + başlık + açıklama
  // + gradyanlı ana buton + krem ikincil buton, birebir aktarıldı.
  permissionBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  permissionIconBadge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#FBEEDD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  permissionTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 19,
    letterSpacing: -0.5,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  permissionText: {
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 260,
  },
  permissionActions: { width: "100%", marginTop: spacing.xl, gap: 9 },
  permissionBtn: {
    height: 50,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow(colors.primaryDark),
  },
  permissionBtnText: { color: "#fff", fontFamily: fontFamily.semibold, fontSize: 14.5, letterSpacing: -0.2 },
  galleryLinkBtn: {
    height: 46,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: "rgba(198,113,57,0.35)",
  },
  galleryLinkText: { color: colors.primaryDark, fontSize: 13, fontFamily: fontFamily.semibold },
});
