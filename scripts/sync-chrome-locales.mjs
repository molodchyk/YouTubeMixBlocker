// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2023-2026 Oleksandr Molodchyk

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const chromeLocalesDirectory = path.join(root, "src/chrome/_locales");
const listingDirectory = path.join(root, "store-listing/chrome-web-store/listing");
const whatsNewPath = path.join(root, "store-listing/chrome-web-store/whats_new.json");
const githubURL = "https://github.com/molodchyk/YouTubeMixBlocker";
const supportEmail = "molodchykr@gmail.com";
const sameAsEnglishLocales = ["en_AU", "en_GB", "en_US"];
const chromeReleaseNotes = {
  version: "1.5.3",
  bullet1: "Added Chrome localization coverage for all 66 supported Chrome Web Store visible locales.",
  bullet2: "Kept the Chrome Web Store package focused on Chrome-supported locale coverage."
};

const translations = {
  fa: {
    messages: {
      appDescription: "میکس‌های YouTube را مسدود می‌کند و نشانی‌های تماشای Mix را پاک‌سازی می‌کند.",
      popupStatus: "بی‌سروصدا فعال است",
      popupMixCardsBlocked: "کارت‌های Mix مسدودشده",
      popupMixUrlsCleaned: "نشانی‌های Mix پاک‌سازی‌شده",
      popupThisPage: "این صفحه",
      popupRecommendations: "پیشنهادها",
      popupSearchResults: "نتایج جستجو",
      popupWatchSidebar: "نوار کناری تماشا",
      popupShowBadge: "نمایش شمارنده نشان برای این صفحه",
      popupTheme: "پوسته",
      popupThemeSystem: "سیستم",
      popupThemeLight: "روشن",
      popupThemeDark: "تیره",
      popupShowDetails: "نمایش جزئیات شمارنده‌ها",
      popupResetCounters: "بازنشانی شمارنده‌ها",
      popupResetConfirm: "همه شمارنده‌های YouTube Mix Blocker بازنشانی شوند؟",
      popupStatsUnavailable: "آمار در دسترس نیست"
    },
    listing: {
      intro: "YouTube Mix Blocker پیشنهادهای YouTube Mix را از صفحه‌های YouTube حذف می‌کند و نشانی‌های تماشای Mix را پاک‌سازی می‌کند تا ویدیوها مانند پیوندهای معمولی باز شوند.",
      quiet: "این افزونه برای آرام و کم‌حاشیه ماندن ساخته شده است: جایگزین کردن فید، پیشنهادهای خودش، یا رابط کاربری جلب‌توجه‌کننده ندارد مگر اینکه خودتان پنجره بازشو را باز کنید.",
      features: "ویژگی‌ها",
      bullets: [
        "کارت‌های YouTube Mix را در پیشنهادها مسدود می‌کند.",
        "کارت‌های YouTube Mix را در نتایج جستجو مسدود می‌کند.",
        "کارت‌های YouTube Mix را در پیشنهادهای نوار کناری صفحه تماشا مسدود می‌کند.",
        "نشانی‌های تماشای Mix را با حذف پارامترهای فهرست پخش Mix پاک‌سازی می‌کند.",
        "شمارنده‌های اختیاری برای Mixهای مسدودشده و URLهای پاک‌سازی‌شده دارد.",
        "شمارنده نشان را به‌طور پیش‌فرض غیرفعال نگه می‌دارد."
      ],
      privacyHead: "حریم خصوصی",
      privacy: "این افزونه فقط روی صفحه‌های YouTube اجرا می‌شود. داده‌های مرور شما را جمع‌آوری، فروش، یا ارسال نمی‌کند.",
      openSource: "متن‌باز",
      source: "متن‌باز تحت مجوز GPL-3.0:",
      feedback: "بازخوردتان خوشحالمان می‌کند. می‌توانید نظر بگذارید، در GitHub یک issue باز کنید، یا بنویسید به:",
      whatsNewHead: "تازه‌های نسخه 1.5.3",
      whatsNew1: "فضاهای خالی باقی‌مانده در شبکه صفحه اصلی YouTube پس از مسدود شدن کارت‌های Mix حذف شد.",
      whatsNew2: "مشکل نوار کناری Chrome که در آن نشانگر بارگیری YouTube پس از پیمایش پیشنهادهای تازه بارگیری‌شده گیر می‌کرد برطرف شد."
    }
  },
  az: {
    messages: {
      appDescription: "YouTube Mix-lərini bloklayır və Mix izləmə URL-lərini təmizləyir.",
      popupStatus: "Səssizcə aktivdir",
      popupMixCardsBlocked: "Bloklanan Mix kartları",
      popupMixUrlsCleaned: "Təmizlənən Mix URL-ləri",
      popupThisPage: "Bu səhifə",
      popupRecommendations: "Tövsiyələr",
      popupSearchResults: "Axtarış nəticələri",
      popupWatchSidebar: "İzləmə yan paneli",
      popupShowBadge: "Bu səhifə üçün nişan sayını göstər",
      popupTheme: "Tema",
      popupThemeSystem: "Sistem",
      popupThemeLight: "Açıq",
      popupThemeDark: "Tünd",
      popupShowDetails: "Ətraflı bölgünü göstər",
      popupResetCounters: "Sayğacları sıfırla",
      popupResetConfirm: "Bütün YouTube Mix Blocker sayğacları sıfırlansın?",
      popupStatsUnavailable: "Statistika əlçatan deyil"
    },
    listing: {
      intro: "YouTube Mix Blocker YouTube səhifələrindən YouTube Mix tövsiyələrini silir və Mix izləmə URL-lərini təmizləyir ki, videolar adi video keçidləri kimi açılsın.",
      quiet: "O, sakit və minimal qalmaq üçün hazırlanıb: lent əvəzlənmir, öz tövsiyələri yoxdur və popup-ı açmadıqca diqqət çəkən interfeys göstərilmir.",
      features: "Xüsusiyyətlər",
      bullets: [
        "Tövsiyələrdə YouTube Mix kartlarını bloklayır.",
        "Axtarış nəticələrində YouTube Mix kartlarını bloklayır.",
        "İzləmə səhifəsinin yan panel tövsiyələrində YouTube Mix kartlarını bloklayır.",
        "Mix pleylist parametrlərini silərək Mix izləmə URL-lərini təmizləyir.",
        "Bloklanan Mix-lər və təmizlənən URL-lər üçün istəyə bağlı sayğaclar əlavə edir.",
        "Nişan sayğacını standart olaraq söndürülmüş saxlayır."
      ],
      privacyHead: "Məxfilik",
      privacy: "Bu artırma yalnız YouTube səhifələrində işləyir. Baxış məlumatlarınızı toplamır, satmır və ötürmür.",
      openSource: "Açıq mənbə",
      source: "GPL-3.0 lisenziyası ilə açıq mənbə:",
      feedback: "Rəyiniz xoşdur. Siz rəy yaza, GitHub-da məsələ aça və ya bu ünvana yaza bilərsiniz:",
      whatsNewHead: "1.5.3 versiyasında yeniliklər",
      whatsNew1: "Mix kartları bloklandıqdan sonra YouTube ana səhifə torunda qalan boş sahələr silindi.",
      whatsNew2: "Yeni yüklənmiş yan panel tövsiyələri sürüşdürüldükdən sonra YouTube yükləmə göstəricisinin ilişə bildiyi Chrome izləmə yan paneli problemi düzəldildi."
    }
  },
  eu: {
    messages: {
      appDescription: "YouTube Mixak blokeatzen ditu eta Mix ikusteko URLak garbitzen ditu.",
      popupStatus: "Isilik aktibo",
      popupMixCardsBlocked: "Blokeatutako Mix txartelak",
      popupMixUrlsCleaned: "Garbitutako Mix URLak",
      popupThisPage: "Orrialde hau",
      popupRecommendations: "Gomendioak",
      popupSearchResults: "Bilaketa-emaitzak",
      popupWatchSidebar: "Ikusteko alboko barra",
      popupShowBadge: "Erakutsi orrialde honetako bereizgarri-kontagailua",
      popupTheme: "Gaia",
      popupThemeSystem: "Sistema",
      popupThemeLight: "Argia",
      popupThemeDark: "Iluna",
      popupShowDetails: "Erakutsi xehetasunen banaketa",
      popupResetCounters: "Berrezarri kontagailuak",
      popupResetConfirm: "YouTube Mix Blocker kontagailu guztiak berrezarri?",
      popupStatsUnavailable: "Estatistikak ez daude erabilgarri"
    },
    listing: {
      intro: "YouTube Mix Blockerrek YouTube Mix gomendioak kentzen ditu YouTube orrialdeetatik eta Mix ikusteko URLak garbitzen ditu, bideoak bideo-esteka arrunt gisa ireki daitezen.",
      quiet: "Isilik eta minimo izateko diseinatuta dago: ez du jarioa ordezkatzen, ez du bere gomendiorik gehitzen, eta ez du arreta erakartzen duen interfazea erakusten popup-a irekitzea aukeratzen ez baduzu.",
      features: "Ezaugarriak",
      bullets: [
        "YouTube Mix txartelak blokeatzen ditu gomendioetan.",
        "YouTube Mix txartelak blokeatzen ditu bilaketa-emaitzetan.",
        "YouTube Mix txartelak blokeatzen ditu ikusteko orriko alboko barrako gomendioetan.",
        "Mix ikusteko URLak garbitzen ditu Mix erreprodukzio-zerrendako parametroak kenduta.",
        "Blokeatutako Mixetarako eta garbitutako URLetarako aukerako kontagailuak ditu.",
        "Bereizgarri-kontagailua lehenespenez desgaituta uzten du."
      ],
      privacyHead: "Pribatutasuna",
      privacy: "Luzapen hau YouTube orrialdeetan bakarrik exekutatzen da. Ez du zure nabigazio-daturik biltzen, saltzen edo transmititzen.",
      openSource: "Kode irekia",
      source: "GPL-3.0 lizentziarekin kode irekia:",
      feedback: "Iritziak ongi etorriak dira. Balorazio bat utzi, GitHub-en arazo bat ireki edo hona idatz dezakezu:",
      whatsNewHead: "1.5.3 bertsioan berria",
      whatsNew1: "Mix txartelak blokeatu ondoren YouTube hasierako saretan geratutako hutsuneak kendu dira.",
      whatsNew2: "Chrome-ko ikusteko alboko barrako arazo bat konpondu da: YouTube-ren kargatze-adierazlea trabatuta gera zitekeen alboko barrako gomendio berriak korritu ondoren."
    }
  },
  uz: {
    messages: {
      appDescription: "YouTube Mixlarni bloklaydi va Mix tomosha URLlarini tozalaydi.",
      popupStatus: "Jim faol",
      popupMixCardsBlocked: "Bloklangan Mix kartalari",
      popupMixUrlsCleaned: "Tozalangan Mix URLlari",
      popupThisPage: "Bu sahifa",
      popupRecommendations: "Tavsiyalar",
      popupSearchResults: "Qidiruv natijalari",
      popupWatchSidebar: "Tomosha yon paneli",
      popupShowBadge: "Bu sahifa uchun belgi hisoblagichini ko‘rsatish",
      popupTheme: "Mavzu",
      popupThemeSystem: "Tizim",
      popupThemeLight: "Yorug‘",
      popupThemeDark: "Qorong‘i",
      popupShowDetails: "Batafsil taqsimotni ko‘rsatish",
      popupResetCounters: "Hisoblagichlarni tiklash",
      popupResetConfirm: "Barcha YouTube Mix Blocker hisoblagichlari tiklansinmi?",
      popupStatsUnavailable: "Statistika mavjud emas"
    },
    listing: {
      intro: "YouTube Mix Blocker YouTube sahifalaridan YouTube Mix tavsiyalarini olib tashlaydi va Mix tomosha URLlarini tozalaydi, shunda videolar oddiy video havolalari sifatida ochiladi.",
      quiet: "U tinch va ixcham ishlash uchun yaratilgan: tasmani almashtirmaydi, o‘z tavsiyalarini bermaydi va popup-ni ochmaguningizcha e’tiborni tortuvchi interfeys ko‘rsatmaydi.",
      features: "Xususiyatlar",
      bullets: [
        "Tavsiyalardagi YouTube Mix kartalarini bloklaydi.",
        "Qidiruv natijalaridagi YouTube Mix kartalarini bloklaydi.",
        "Tomosha sahifasi yon panelidagi YouTube Mix kartalarini bloklaydi.",
        "Mix pleylist parametrlarini olib tashlab, Mix tomosha URLlarini tozalaydi.",
        "Bloklangan Mixlar va tozalangan URLlar uchun ixtiyoriy hisoblagichlarni qo‘shadi.",
        "Belgi hisoblagichini sukut bo‘yicha o‘chirilgan holatda saqlaydi."
      ],
      privacyHead: "Maxfiylik",
      privacy: "Bu kengaytma faqat YouTube sahifalarida ishlaydi. U brauzer ma’lumotlaringizni yig‘maydi, sotmaydi yoki uzatmaydi.",
      openSource: "Ochiq kodli",
      source: "GPL-3.0 litsenziyasi ostida ochiq kodli:",
      feedback: "Fikr-mulohaza mamnuniyat bilan qabul qilinadi. Sharh qoldirishingiz, GitHub’da masala ochishingiz yoki quyidagiga yozishingiz mumkin:",
      whatsNewHead: "1.5.3 versiyasidagi yangiliklar",
      whatsNew1: "Mix kartalari bloklangandan keyin YouTube bosh sahifasi to‘rida qolgan bo‘sh joylar olib tashlandi.",
      whatsNew2: "Yangi yuklangan yon panel tavsiyalarini aylantirgandan keyin YouTube yuklash indikatori qotib qolishi mumkin bo‘lgan Chrome tomosha yon paneli muammosi tuzatildi."
    }
  },
  sq: {
    messages: {
      appDescription: "Bllokon YouTube Mixes dhe pastron URL-të e shikimit Mix.",
      popupStatus: "Aktiv në heshtje",
      popupMixCardsBlocked: "Karta Mix të bllokuara",
      popupMixUrlsCleaned: "URL Mix të pastruara",
      popupThisPage: "Kjo faqe",
      popupRecommendations: "Rekomandime",
      popupSearchResults: "Rezultatet e kërkimit",
      popupWatchSidebar: "Shiriti anësor i shikimit",
      popupShowBadge: "Shfaq numërimin e simbolit për këtë faqe",
      popupTheme: "Tema",
      popupThemeSystem: "Sistemi",
      popupThemeLight: "E çelët",
      popupThemeDark: "E errët",
      popupShowDetails: "Shfaq ndarjen e hollësishme",
      popupResetCounters: "Rivendos numëruesit",
      popupResetConfirm: "Të rivendosen të gjithë numëruesit e YouTube Mix Blocker?",
      popupStatsUnavailable: "Statistikat nuk janë të disponueshme"
    },
    listing: {
      intro: "YouTube Mix Blocker heq rekomandimet YouTube Mix nga faqet e YouTube dhe pastron URL-të e shikimit Mix, që videot të hapen si lidhje të zakonshme videoje.",
      quiet: "Është krijuar të qëndrojë i qetë dhe minimal: pa zëvendësim të furnizimit, pa rekomandime të veta dhe pa ndërfaqe që tërheq vëmendjen, përveç kur hapni popup-in.",
      features: "Veçoritë",
      bullets: [
        "Bllokon kartat YouTube Mix në rekomandime.",
        "Bllokon kartat YouTube Mix në rezultatet e kërkimit.",
        "Bllokon kartat YouTube Mix në rekomandimet e shiritit anësor të faqes së shikimit.",
        "Pastron URL-të e shikimit Mix duke hequr parametrat e listës Mix.",
        "Përfshin numërues opsionalë për Mix të bllokuara dhe URL të pastruara.",
        "E mban numëruesin e simbolit të çaktivizuar si parazgjedhje."
      ],
      privacyHead: "Privatësia",
      privacy: "Kjo shtesë funksionon vetëm në faqet e YouTube. Nuk mbledh, shet ose transmeton të dhënat tuaja të shfletimit.",
      openSource: "Me burim të hapur",
      source: "Me burim të hapur nën licencën GPL-3.0:",
      feedback: "Komentet janë të mirëpritura. Mund të lini një vlerësim, të hapni një çështje në GitHub, ose të shkruani te:",
      whatsNewHead: "Çfarë ka të re në versionin 1.5.3",
      whatsNew1: "U hoqën hapësirat bosh të mbetura në rrjetën e faqes kryesore të YouTube pas bllokimit të kartave Mix.",
      whatsNew2: "U rregullua një problem i shiritit anësor të Chrome ku rrotulluesi i ngarkimit të YouTube mund të mbetej i bllokuar pas lëvizjes në rekomandimet e reja."
    }
  },
  mk: {
    messages: {
      appDescription: "Ги блокира YouTube Mix-овите и ги чисти URL-адресите за гледање Mix.",
      popupStatus: "Тивко активно",
      popupMixCardsBlocked: "Блокирани Mix картички",
      popupMixUrlsCleaned: "Исчистени Mix URL-адреси",
      popupThisPage: "Оваа страница",
      popupRecommendations: "Препораки",
      popupSearchResults: "Резултати од пребарување",
      popupWatchSidebar: "Странична лента за гледање",
      popupShowBadge: "Прикажи бројач на значката за оваа страница",
      popupTheme: "Тема",
      popupThemeSystem: "Систем",
      popupThemeLight: "Светла",
      popupThemeDark: "Темна",
      popupShowDetails: "Прикажи детален преглед",
      popupResetCounters: "Ресетирај бројачи",
      popupResetConfirm: "Да се ресетираат сите бројачи на YouTube Mix Blocker?",
      popupStatsUnavailable: "Статистиката не е достапна"
    },
    listing: {
      intro: "YouTube Mix Blocker ги отстранува препораките YouTube Mix од страниците на YouTube и ги чисти URL-адресите за гледање Mix, за видеата да се отвораат како обични видео врски.",
      quiet: "Создаден е да остане тивок и минимален: без замена на фидот, без сопствени препораки и без интерфејс што привлекува внимание освен ако не го отворите popup прозорецот.",
      features: "Функции",
      bullets: [
        "Ги блокира YouTube Mix картичките во препораките.",
        "Ги блокира YouTube Mix картичките во резултатите од пребарување.",
        "Ги блокира YouTube Mix картичките во препораките од страничната лента на страницата за гледање.",
        "Ги чисти URL-адресите за гледање Mix со отстранување на параметрите за Mix плејлиста.",
        "Вклучува изборни бројачи за блокирани Mix-ови и исчистени URL-адреси.",
        "Го остава бројачот на значката исклучен по стандард."
      ],
      privacyHead: "Приватност",
      privacy: "Оваа екстензија работи само на страници на YouTube. Не ги собира, продава или пренесува вашите податоци за прелистување.",
      openSource: "Отворен код",
      source: "Отворен код под лиценцата GPL-3.0:",
      feedback: "Повратните информации се добредојдени. Можете да оставите рецензија, да отворите issue на GitHub или да пишете на:",
      whatsNewHead: "Што е ново во верзија 1.5.3",
      whatsNew1: "Отстранети се празните места што остануваа во мрежата на почетната страница на YouTube по блокирањето на Mix картичките.",
      whatsNew2: "Поправен е проблем со страничната лента во Chrome каде што индикаторот за вчитување на YouTube можеше да остане заглавен по лизгање низ ново вчитани препораки."
    }
  },
  hy: {
    messages: {
      appDescription: "Արգելափակում է YouTube Mix-երը և մաքրում Mix դիտման URL-ները։",
      popupStatus: "Լուռ ակտիվ է",
      popupMixCardsBlocked: "Արգելափակված Mix քարտեր",
      popupMixUrlsCleaned: "Մաքրված Mix URL-ներ",
      popupThisPage: "Այս էջը",
      popupRecommendations: "Առաջարկություններ",
      popupSearchResults: "Որոնման արդյունքներ",
      popupWatchSidebar: "Դիտման կողային վահանակ",
      popupShowBadge: "Ցույց տալ նշանի հաշվիչը այս էջի համար",
      popupTheme: "Թեմա",
      popupThemeSystem: "Համակարգ",
      popupThemeLight: "Բաց",
      popupThemeDark: "Մուգ",
      popupShowDetails: "Ցույց տալ մանրամասն բաշխումը",
      popupResetCounters: "Վերակայել հաշվիչները",
      popupResetConfirm: "Վերակայե՞լ YouTube Mix Blocker-ի բոլոր հաշվիչները։",
      popupStatsUnavailable: "Վիճակագրությունը հասանելի չէ"
    },
    listing: {
      intro: "YouTube Mix Blocker-ը հեռացնում է YouTube Mix առաջարկությունները YouTube էջերից և մաքրում է Mix դիտման URL-ները, որպեսզի տեսանյութերը բացվեն որպես սովորական տեսահղումներ։",
      quiet: "Այն նախագծված է հանգիստ և պարզ մնալու համար՝ առանց հոսքի փոխարինման, սեփական առաջարկությունների կամ ուշադրություն գրավող միջերեսի, եթե ինքներդ չբացեք popup-ը։",
      features: "Հնարավորություններ",
      bullets: [
        "Արգելափակում է YouTube Mix քարտերը առաջարկություններում։",
        "Արգելափակում է YouTube Mix քարտերը որոնման արդյունքներում։",
        "Արգելափակում է YouTube Mix քարտերը դիտման էջի կողային առաջարկություններում։",
        "Մաքրում է Mix դիտման URL-ները՝ հեռացնելով Mix երգացանկի պարամետրերը։",
        "Ներառում է ընտրովի հաշվիչներ արգելափակված Mix-երի և մաքրված URL-ների համար։",
        "Նշանի հաշվիչը լռելյայն թողնում է անջատված։"
      ],
      privacyHead: "Գաղտնիություն",
      privacy: "Այս ընդլայնումը աշխատում է միայն YouTube էջերում։ Այն չի հավաքում, վաճառում կամ փոխանցում ձեր զննարկման տվյալները։",
      openSource: "Բաց կոդ",
      source: "Բաց կոդ GPL-3.0 արտոնագրով՝",
      feedback: "Կարծիքները ողջունելի են։ Կարող եք թողնել գնահատական, GitHub-ում բացել issue կամ գրել՝",
      whatsNewHead: "Ինչ է նոր 1.5.3 տարբերակում",
      whatsNew1: "Հեռացվել են դատարկ տարածքները, որոնք մնում էին YouTube-ի գլխավոր էջի ցանցում Mix քարտերը արգելափակելուց հետո։",
      whatsNew2: "Ուղղվել է Chrome-ի դիտման կողային վահանակի խնդիր, երբ YouTube-ի բեռնման ցուցիչը կարող էր մնալ կախված նոր բեռնված կողային առաջարկությունները ոլորելուց հետո։"
    }
  },
  ur: {
    messages: {
      appDescription: "YouTube Mixes کو بلاک کرتا ہے اور Mix watch URLs کو صاف کرتا ہے۔",
      popupStatus: "خاموشی سے فعال",
      popupMixCardsBlocked: "بلاک کیے گئے Mix کارڈز",
      popupMixUrlsCleaned: "صاف کیے گئے Mix URLs",
      popupThisPage: "یہ صفحہ",
      popupRecommendations: "تجاویز",
      popupSearchResults: "تلاش کے نتائج",
      popupWatchSidebar: "واچ سائیڈ بار",
      popupShowBadge: "اس صفحے کے لیے بیج کاؤنٹ دکھائیں",
      popupTheme: "تھیم",
      popupThemeSystem: "سسٹم",
      popupThemeLight: "لائٹ",
      popupThemeDark: "ڈارک",
      popupShowDetails: "تفصیلی تقسیم دکھائیں",
      popupResetCounters: "کاؤنٹرز ری سیٹ کریں",
      popupResetConfirm: "کیا YouTube Mix Blocker کے تمام کاؤنٹرز ری سیٹ کر دیے جائیں؟",
      popupStatsUnavailable: "اعداد و شمار دستیاب نہیں"
    },
    listing: {
      intro: "YouTube Mix Blocker یوٹیوب صفحات سے YouTube Mix تجاویز ہٹاتا ہے اور Mix watch URLs کو صاف کرتا ہے تاکہ ویڈیوز عام ویڈیو لنکس کے طور پر کھلیں۔",
      quiet: "اسے خاموش اور سادہ رہنے کے لیے بنایا گیا ہے: کوئی فیڈ تبدیلی نہیں، اپنی تجاویز نہیں، اور کوئی توجہ کھینچنے والا UI نہیں جب تک آپ popup نہ کھولیں۔",
      features: "خصوصیات",
      bullets: [
        "تجاویز میں YouTube Mix کارڈز بلاک کرتا ہے۔",
        "تلاش کے نتائج میں YouTube Mix کارڈز بلاک کرتا ہے۔",
        "واچ صفحے کی سائیڈ بار تجاویز میں YouTube Mix کارڈز بلاک کرتا ہے۔",
        "Mix پلے لسٹ پیرامیٹرز ہٹا کر Mix watch URLs صاف کرتا ہے۔",
        "بلاک کیے گئے Mixes اور صاف کیے گئے URLs کے لیے اختیاری کاؤنٹرز شامل ہیں۔",
        "بیج کاؤنٹر کو بطور ڈیفالٹ غیر فعال رکھتا ہے۔"
      ],
      privacyHead: "رازداری",
      privacy: "یہ ایکسٹینشن صرف YouTube صفحات پر چلتی ہے۔ یہ آپ کا براؤزنگ ڈیٹا جمع، فروخت یا منتقل نہیں کرتی۔",
      openSource: "اوپن سورس",
      source: "GPL-3.0 لائسنس کے تحت اوپن سورس:",
      feedback: "آپ کی رائے خوش آئند ہے۔ آپ ریویو چھوڑ سکتے ہیں، GitHub پر issue کھول سکتے ہیں، یا اس پر لکھ سکتے ہیں:",
      whatsNewHead: "ورژن 1.5.3 میں نیا کیا ہے",
      whatsNew1: "Mix کارڈز بلاک ہونے کے بعد YouTube ہوم گرڈ میں رہ جانے والی خالی جگہیں ہٹا دی گئیں۔",
      whatsNew2: "Chrome watch-sidebar کا مسئلہ درست کیا گیا جہاں نئی لوڈ شدہ سائیڈ بار تجاویز اسکرول کرنے کے بعد YouTube کا لوڈنگ اسپنر اٹک سکتا تھا۔"
    }
  },
  ne: {
    messages: {
      appDescription: "YouTube Mix हरू रोक्छ र Mix हेर्ने URL हरू सफा गर्छ।",
      popupStatus: "शान्त रूपमा सक्रिय",
      popupMixCardsBlocked: "रोकिएका Mix कार्डहरू",
      popupMixUrlsCleaned: "सफा गरिएका Mix URL हरू",
      popupThisPage: "यो पृष्ठ",
      popupRecommendations: "सिफारिसहरू",
      popupSearchResults: "खोज परिणामहरू",
      popupWatchSidebar: "हेर्ने साइडबार",
      popupShowBadge: "यो पृष्ठका लागि ब्याज गणना देखाउनुहोस्",
      popupTheme: "थिम",
      popupThemeSystem: "प्रणाली",
      popupThemeLight: "उज्यालो",
      popupThemeDark: "गाढा",
      popupShowDetails: "विस्तृत विभाजन देखाउनुहोस्",
      popupResetCounters: "गणकहरू रिसेट गर्नुहोस्",
      popupResetConfirm: "सबै YouTube Mix Blocker गणकहरू रिसेट गर्ने?",
      popupStatsUnavailable: "तथ्याङ्क उपलब्ध छैन"
    },
    listing: {
      intro: "YouTube Mix Blocker ले YouTube पृष्ठहरूबाट YouTube Mix सिफारिसहरू हटाउँछ र Mix हेर्ने URL हरू सफा गर्छ, ताकि भिडियोहरू सामान्य भिडियो लिंकका रूपमा खुलून्।",
      quiet: "यो शान्त र न्यूनतम रहन बनाइएको हो: फिड प्रतिस्थापन छैन, आफ्नै सिफारिसहरू छैनन्, र popup नखोलेसम्म ध्यान तान्ने UI छैन।",
      features: "विशेषताहरू",
      bullets: [
        "सिफारिसहरूमा YouTube Mix कार्डहरू रोक्छ।",
        "खोज परिणामहरूमा YouTube Mix कार्डहरू रोक्छ।",
        "हेर्ने पृष्ठको साइडबार सिफारिसहरूमा YouTube Mix कार्डहरू रोक्छ।",
        "Mix प्लेलिस्ट प्यारामिटरहरू हटाएर Mix हेर्ने URL हरू सफा गर्छ।",
        "रोकिएका Mix र सफा गरिएका URL हरूका लागि वैकल्पिक गणकहरू समावेश गर्छ।",
        "ब्याज गणकलाई पूर्वनिर्धारित रूपमा बन्द राख्छ।"
      ],
      privacyHead: "गोपनीयता",
      privacy: "यो एक्सटेन्सन YouTube पृष्ठहरूमा मात्र चल्छ। यसले तपाईंको ब्राउजिङ डेटा सङ्कलन, बिक्री वा प्रसारण गर्दैन।",
      openSource: "खुला स्रोत",
      source: "GPL-3.0 इजाजतपत्र अन्तर्गत खुला स्रोत:",
      feedback: "प्रतिक्रिया स्वागत छ। तपाईं समीक्षा छोड्न, GitHub मा issue खोल्न, वा यसमा लेख्न सक्नुहुन्छ:",
      whatsNewHead: "संस्करण 1.5.3 मा नयाँ के छ",
      whatsNew1: "Mix कार्डहरू रोकिएपछि YouTube गृह ग्रिडमा बाँकी रहेका खाली ठाउँहरू हटाइयो।",
      whatsNew2: "नयाँ लोड गरिएका साइडबार सिफारिसहरू स्क्रोल गरेपछि YouTube को लोडिङ स्पिनर अड्किन सक्ने Chrome watch-sidebar समस्या समाधान गरियो।"
    }
  },
  pa: {
    messages: {
      appDescription: "YouTube Mixes ਨੂੰ ਬਲਾਕ ਕਰਦਾ ਹੈ ਅਤੇ Mix watch URLs ਨੂੰ ਸਾਫ਼ ਕਰਦਾ ਹੈ।",
      popupStatus: "ਚੁੱਪਚਾਪ ਸਰਗਰਮ",
      popupMixCardsBlocked: "ਬਲਾਕ ਕੀਤੇ Mix ਕਾਰਡ",
      popupMixUrlsCleaned: "ਸਾਫ਼ ਕੀਤੇ Mix URL",
      popupThisPage: "ਇਹ ਪੰਨਾ",
      popupRecommendations: "ਸਿਫ਼ਾਰਸ਼ਾਂ",
      popupSearchResults: "ਖੋਜ ਨਤੀਜੇ",
      popupWatchSidebar: "ਵਾਚ ਸਾਈਡਬਾਰ",
      popupShowBadge: "ਇਸ ਪੰਨੇ ਲਈ ਬੈਜ ਗਿਣਤੀ ਦਿਖਾਓ",
      popupTheme: "ਥੀਮ",
      popupThemeSystem: "ਸਿਸਟਮ",
      popupThemeLight: "ਲਾਈਟ",
      popupThemeDark: "ਡਾਰਕ",
      popupShowDetails: "ਵਿਸਥਾਰਿਤ ਵੇਰਵਾ ਦਿਖਾਓ",
      popupResetCounters: "ਕਾਊਂਟਰ ਰੀਸੈਟ ਕਰੋ",
      popupResetConfirm: "ਸਾਰੇ YouTube Mix Blocker ਕਾਊਂਟਰ ਰੀਸੈਟ ਕਰਨੇ ਹਨ?",
      popupStatsUnavailable: "ਅੰਕੜੇ ਉਪਲਬਧ ਨਹੀਂ"
    },
    listing: {
      intro: "YouTube Mix Blocker YouTube ਪੰਨਿਆਂ ਤੋਂ YouTube Mix ਸਿਫ਼ਾਰਸ਼ਾਂ ਹਟਾਉਂਦਾ ਹੈ ਅਤੇ Mix watch URLs ਨੂੰ ਸਾਫ਼ ਕਰਦਾ ਹੈ ਤਾਂ ਜੋ ਵੀਡੀਓ ਆਮ ਵੀਡੀਓ ਲਿੰਕਾਂ ਵਾਂਗ ਖੁੱਲ੍ਹਣ।",
      quiet: "ਇਹ ਚੁੱਪ ਅਤੇ ਸਧਾਰਣ ਰਹਿਣ ਲਈ ਬਣਾਇਆ ਗਿਆ ਹੈ: ਕੋਈ ਫੀਡ ਬਦਲਾਅ ਨਹੀਂ, ਆਪਣੀਆਂ ਸਿਫ਼ਾਰਸ਼ਾਂ ਨਹੀਂ, ਅਤੇ popup ਖੋਲ੍ਹਣ ਤੱਕ ਧਿਆਨ ਖਿੱਚਣ ਵਾਲਾ UI ਨਹੀਂ।",
      features: "ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ",
      bullets: [
        "ਸਿਫ਼ਾਰਸ਼ਾਂ ਵਿੱਚ YouTube Mix ਕਾਰਡਾਂ ਨੂੰ ਬਲਾਕ ਕਰਦਾ ਹੈ।",
        "ਖੋਜ ਨਤੀਜਿਆਂ ਵਿੱਚ YouTube Mix ਕਾਰਡਾਂ ਨੂੰ ਬਲਾਕ ਕਰਦਾ ਹੈ।",
        "ਵਾਚ ਪੰਨੇ ਦੀ ਸਾਈਡਬਾਰ ਸਿਫ਼ਾਰਸ਼ਾਂ ਵਿੱਚ YouTube Mix ਕਾਰਡਾਂ ਨੂੰ ਬਲਾਕ ਕਰਦਾ ਹੈ।",
        "Mix ਪਲੇਲਿਸਟ ਪੈਰਾਮੀਟਰ ਹਟਾ ਕੇ Mix watch URLs ਸਾਫ਼ ਕਰਦਾ ਹੈ।",
        "ਬਲਾਕ ਕੀਤੇ Mixes ਅਤੇ ਸਾਫ਼ ਕੀਤੇ URLs ਲਈ ਚੋਣਵਾਂ ਕਾਊਂਟਰ ਸ਼ਾਮਲ ਕਰਦਾ ਹੈ।",
        "ਬੈਜ ਕਾਊਂਟਰ ਨੂੰ ਮੂਲ ਰੂਪ ਵਿੱਚ ਬੰਦ ਰੱਖਦਾ ਹੈ।"
      ],
      privacyHead: "ਪਰਦੇਦਾਰੀ",
      privacy: "ਇਹ ਐਕਸਟੈਂਸ਼ਨ ਸਿਰਫ਼ YouTube ਪੰਨਿਆਂ ‘ਤੇ ਚਲਦੀ ਹੈ। ਇਹ ਤੁਹਾਡਾ ਬ੍ਰਾਊਜ਼ਿੰਗ ਡਾਟਾ ਇਕੱਠਾ, ਵੇਚਦੀ ਜਾਂ ਭੇਜਦੀ ਨਹੀਂ।",
      openSource: "ਖੁੱਲ੍ਹਾ ਸਰੋਤ",
      source: "GPL-3.0 ਲਾਇਸੰਸ ਹੇਠ ਖੁੱਲ੍ਹਾ ਸਰੋਤ:",
      feedback: "ਫੀਡਬੈਕ ਦਾ ਸਵਾਗਤ ਹੈ। ਤੁਸੀਂ ਸਮੀਖਿਆ ਛੱਡ ਸਕਦੇ ਹੋ, GitHub ‘ਤੇ issue ਖੋਲ੍ਹ ਸਕਦੇ ਹੋ, ਜਾਂ ਇੱਥੇ ਲਿਖ ਸਕਦੇ ਹੋ:",
      whatsNewHead: "ਵਰਜਨ 1.5.3 ਵਿੱਚ ਨਵਾਂ ਕੀ ਹੈ",
      whatsNew1: "Mix ਕਾਰਡ ਬਲਾਕ ਹੋਣ ਤੋਂ ਬਾਅਦ YouTube ਹੋਮ ਗ੍ਰਿਡ ਵਿੱਚ ਰਹਿ ਗਈਆਂ ਖਾਲੀ ਥਾਵਾਂ ਹਟਾਈਆਂ ਗਈਆਂ।",
      whatsNew2: "Chrome watch-sidebar ਸਮੱਸਿਆ ਠੀਕ ਕੀਤੀ ਗਈ ਜਿੱਥੇ ਨਵੀਆਂ ਲੋਡ ਹੋਈਆਂ ਸਾਈਡਬਾਰ ਸਿਫ਼ਾਰਸ਼ਾਂ ਸਕ੍ਰੋਲ ਕਰਨ ਤੋਂ ਬਾਅਦ YouTube ਦਾ ਲੋਡਿੰਗ ਸਪਿੰਨਰ ਅਟਕ ਸਕਦਾ ਸੀ।"
    }
  },
  si: {
    messages: {
      appDescription: "YouTube Mix අවහිර කර Mix නැරඹුම් URL පිරිසිදු කරයි.",
      popupStatus: "නිහඬව සක්‍රීයයි",
      popupMixCardsBlocked: "අවහිර කළ Mix කාඩ්පත්",
      popupMixUrlsCleaned: "පිරිසිදු කළ Mix URL",
      popupThisPage: "මෙම පිටුව",
      popupRecommendations: "නිර්දේශ",
      popupSearchResults: "සෙවුම් ප්‍රතිඵල",
      popupWatchSidebar: "නැරඹුම් පැති තීරුව",
      popupShowBadge: "මෙම පිටුව සඳහා ලාංඡන ගණන පෙන්වන්න",
      popupTheme: "තේමාව",
      popupThemeSystem: "පද්ධතිය",
      popupThemeLight: "ආලෝක",
      popupThemeDark: "අඳුරු",
      popupShowDetails: "විස්තරාත්මක බෙදීම පෙන්වන්න",
      popupResetCounters: "ගණක නැවත සකසන්න",
      popupResetConfirm: "YouTube Mix Blocker ගණක සියල්ල නැවත සකසන්නද?",
      popupStatsUnavailable: "සංඛ්‍යාලේඛන ලබා ගත නොහැක"
    },
    listing: {
      intro: "YouTube Mix Blocker YouTube පිටු වලින් YouTube Mix නිර්දේශ ඉවත් කර Mix නැරඹුම් URL පිරිසිදු කරයි, එවිට වීඩියෝ සාමාන්‍ය වීඩියෝ සබැඳි ලෙස විවෘත වේ.",
      quiet: "එය නිහඬ හා අවම ලෙස සිටීමට සැලසුම් කර ඇත: feed ප්‍රතිස්ථාපනයක් නැත, තමන්ගේම නිර්දේශ නැත, popup විවෘත කරන තුරු අවධානය ගන්නා UI නැත.",
      features: "විශේෂාංග",
      bullets: [
        "නිර්දේශ තුළ YouTube Mix කාඩ්පත් අවහිර කරයි.",
        "සෙවුම් ප්‍රතිඵල තුළ YouTube Mix කාඩ්පත් අවහිර කරයි.",
        "නැරඹුම් පිටුවේ පැති තීරු නිර්දේශ තුළ YouTube Mix කාඩ්පත් අවහිර කරයි.",
        "Mix playlist පරාමිතීන් ඉවත් කර Mix නැරඹුම් URL පිරිසිදු කරයි.",
        "අවහිර කළ Mix සහ පිරිසිදු කළ URL සඳහා විකල්ප ගණක ඇතුළත් කරයි.",
        "ලාංඡන ගණකය පෙරනිමියෙන් අක්‍රියව තබයි."
      ],
      privacyHead: "පෞද්ගලිකත්වය",
      privacy: "මෙම දිගුව YouTube පිටු මත පමණක් ක්‍රියා කරයි. එය ඔබගේ බ්‍රවුසින් දත්ත එකතු, විකිණීම හෝ සම්ප්‍රේෂණය නොකරයි.",
      openSource: "විවෘත මූලාශ්‍ර",
      source: "GPL-3.0 බලපත්‍රය යටතේ විවෘත මූලාශ්‍ර:",
      feedback: "ප්‍රතිපෝෂණය සාදරයෙන් පිළිගනිමු. ඔබට සමාලෝචනයක් තැබිය, GitHub හි issue එකක් විවෘත කළ හැකිය, හෝ මෙයට ලියන්න:",
      whatsNewHead: "1.5.3 අනුවාදයේ අලුත් දේ",
      whatsNew1: "Mix කාඩ්පත් අවහිර කළ පසු YouTube මුල් පිටු ජාලයේ ඉතිරි වූ හිස් ඉඩ ඉවත් කරන ලදී.",
      whatsNew2: "අලුතින් පූරණය කළ පැති තීරු නිර්දේශ ස්ක්‍රෝල් කළ පසු YouTube පූරණ spinner එක හිර විය හැකි Chrome watch-sidebar ගැටලුව විසඳන ලදී."
    }
  },
  ka: {
    messages: {
      appDescription: "ბლოკავს YouTube Mix-ებს და ასუფთავებს Mix-ის ყურების URL-ებს.",
      popupStatus: "ჩუმად აქტიურია",
      popupMixCardsBlocked: "დაბლოკილი Mix ბარათები",
      popupMixUrlsCleaned: "გასუფთავებული Mix URL-ები",
      popupThisPage: "ეს გვერდი",
      popupRecommendations: "რეკომენდაციები",
      popupSearchResults: "ძიების შედეგები",
      popupWatchSidebar: "ყურების გვერდითი ზოლი",
      popupShowBadge: "ამ გვერდისთვის ნიშნულის მთვლელის ჩვენება",
      popupTheme: "თემა",
      popupThemeSystem: "სისტემა",
      popupThemeLight: "ღია",
      popupThemeDark: "მუქი",
      popupShowDetails: "დეტალური დაყოფის ჩვენება",
      popupResetCounters: "მთვლელების განულება",
      popupResetConfirm: "განულდეს YouTube Mix Blocker-ის ყველა მთვლელი?",
      popupStatsUnavailable: "სტატისტიკა მიუწვდომელია"
    },
    listing: {
      intro: "YouTube Mix Blocker აშორებს YouTube Mix რეკომენდაციებს YouTube გვერდებიდან და ასუფთავებს Mix-ის ყურების URL-ებს, რომ ვიდეოები ჩვეულებრივ ვიდეო ბმულებად გაიხსნას.",
      quiet: "ის შექმნილია ჩუმად და მინიმალურად მუშაობისთვის: არ ცვლის არხს, არ ამატებს საკუთარ რეკომენდაციებს და არ აჩვენებს ყურადღების მიმქცევ UI-ს, თუ popup-ს არ გახსნით.",
      features: "ფუნქციები",
      bullets: [
        "ბლოკავს YouTube Mix ბარათებს რეკომენდაციებში.",
        "ბლოკავს YouTube Mix ბარათებს ძიების შედეგებში.",
        "ბლოკავს YouTube Mix ბარათებს ყურების გვერდის გვერდითი ზოლის რეკომენდაციებში.",
        "ასუფთავებს Mix-ის ყურების URL-ებს Mix playlist პარამეტრების წაშლით.",
        "მოიცავს სურვილისამებრ მთვლელებს დაბლოკილი Mix-ებისა და გასუფთავებული URL-ებისთვის.",
        "ნიშნულის მთვლელს ნაგულისხმევად გამორთულს ტოვებს."
      ],
      privacyHead: "კონფიდენციალურობა",
      privacy: "ეს გაფართოება მუშაობს მხოლოდ YouTube გვერდებზე. ის არ აგროვებს, ყიდის ან გადასცემს თქვენს დათვალიერების მონაცემებს.",
      openSource: "ღია წყარო",
      source: "ღია წყარო GPL-3.0 ლიცენზიით:",
      feedback: "უკუკავშირი მისასალმებელია. შეგიძლიათ დატოვოთ მიმოხილვა, გახსნათ issue GitHub-ზე, ან მოგვწეროთ:",
      whatsNewHead: "რა არის ახალი ვერსიაში 1.5.3",
      whatsNew1: "წაიშალა ცარიელი სივრცეები, რომლებიც YouTube-ის მთავარ ბადეში რჩებოდა Mix ბარათების დაბლოკვის შემდეგ.",
      whatsNew2: "გამოსწორდა Chrome-ის ყურების გვერდითი ზოლის პრობლემა, როცა YouTube-ის ჩატვირთვის ინდიკატორი შეიძლება გაჭედილიყო ახლად ჩატვირთული გვერდითი რეკომენდაციების გადახვევის შემდეგ."
    }
  },
  am: {
    messages: {
      appDescription: "የYouTube Mixesን ያግዳል እና የMix መመልከቻ URL-ዎችን ያጸዳል።",
      popupStatus: "በጸጥታ ንቁ ነው",
      popupMixCardsBlocked: "የታገዱ Mix ካርዶች",
      popupMixUrlsCleaned: "የተጸዱ Mix URL-ዎች",
      popupThisPage: "ይህ ገጽ",
      popupRecommendations: "ምክሮች",
      popupSearchResults: "የፍለጋ ውጤቶች",
      popupWatchSidebar: "የመመልከቻ ጎን አሞሌ",
      popupShowBadge: "ለዚህ ገጽ የባጅ ቆጣሪን አሳይ",
      popupTheme: "ገጽታ",
      popupThemeSystem: "ስርዓት",
      popupThemeLight: "ብርሃን",
      popupThemeDark: "ጨለማ",
      popupShowDetails: "ዝርዝር መከፋፈልን አሳይ",
      popupResetCounters: "ቆጣሪዎችን ዳግም አስጀምር",
      popupResetConfirm: "ሁሉንም የYouTube Mix Blocker ቆጣሪዎች ዳግም ማስጀመር?",
      popupStatsUnavailable: "ስታቲስቲክስ አይገኝም"
    },
    listing: {
      intro: "YouTube Mix Blocker ከYouTube ገጾች የYouTube Mix ምክሮችን ያስወግዳል እና የMix መመልከቻ URL-ዎችን ያጸዳል፣ ቪዲዮዎችም እንደ መደበኛ የቪዲዮ አገናኞች እንዲከፈቱ።",
      quiet: "ጸጥ ያለ እና ቀላል ሆኖ እንዲቆይ ተዘጋጅቷል፤ feed አይተካም፣ የራሱ ምክሮች የሉትም፣ popup ካልከፈቱ በስተቀር ትኩረት የሚስብ UI አያሳይም።",
      features: "ባህሪዎች",
      bullets: [
        "በምክሮች ውስጥ የYouTube Mix ካርዶችን ያግዳል።",
        "በፍለጋ ውጤቶች ውስጥ የYouTube Mix ካርዶችን ያግዳል።",
        "በመመልከቻ ገጽ ጎን አሞሌ ምክሮች ውስጥ የYouTube Mix ካርዶችን ያግዳል።",
        "የMix playlist መለኪያዎችን በማስወገድ የMix መመልከቻ URL-ዎችን ያጸዳል።",
        "ለታገዱ Mixes እና ለተጸዱ URL-ዎች አማራጭ ቆጣሪዎችን ያካትታል።",
        "የባጅ ቆጣሪውን በነባሪነት አጥፍቶ ይተዋል።"
      ],
      privacyHead: "ግላዊነት",
      privacy: "ይህ ቅጥያ በYouTube ገጾች ላይ ብቻ ይሰራል። የአሰሳ ውሂብዎን አይሰበስብም፣ አይሸጥም ወይም አያስተላልፍም።",
      openSource: "ክፍት ምንጭ",
      source: "በGPL-3.0 ፈቃድ ስር ክፍት ምንጭ:",
      feedback: "አስተያየት በደስታ ይቀበላል። ግምገማ መተው፣ በGitHub issue መክፈት፣ ወይም ወደዚህ መጻፍ ይችላሉ:",
      whatsNewHead: "በስሪት 1.5.3 ያለው አዲስ ነገር",
      whatsNew1: "Mix ካርዶች ከታገዱ በኋላ በYouTube መነሻ ገጽ grid ውስጥ የቀሩ ባዶ ቦታዎች ተወግደዋል።",
      whatsNew2: "አዲስ የተጫኑ የጎን አሞሌ ምክሮችን ከማሸብለል በኋላ የYouTube የመጫኛ ምልክት ሊቆም የሚችልበት የChrome watch-sidebar ችግኝ ተስተካክሏል።"
    }
  }
};

function createMessages(baseMessages, locale) {
  const sourceMessages = sameAsEnglishLocales.includes(locale) ? {} : translations[locale].messages;
  const output = {};

  for (const [key, value] of Object.entries(baseMessages)) {
    output[key] = {
      message: key === "appName" || key === "popupTitle"
        ? value.message
        : (sourceMessages[key] || value.message),
      description: value.description
    };
  }

  return output;
}

function createListing(englishListing, locale) {
  if (sameAsEnglishLocales.includes(locale)) return englishListing;

  const listing = translations[locale].listing;

  return [
    listing.intro,
    "",
    listing.quiet,
    "",
    listing.features,
    "",
    ...listing.bullets.map(bullet => `- ${bullet}`),
    "",
    listing.privacyHead,
    "",
    listing.privacy,
    "",
    listing.openSource,
    "",
    listing.source,
    githubURL,
    "",
    listing.feedback,
    supportEmail,
    "",
    listing.whatsNewHead,
    "",
    listing.whatsNew1,
    listing.whatsNew2,
    ""
  ].join("\n");
}

function normalizeStoreListingFooter(filePath) {
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  const githubURLIndex = lines.findIndex(line => line.trim() === githubURL);

  if (githubURLIndex <= 0) return;

  let previousLineIndex = githubURLIndex - 1;
  while (previousLineIndex >= 0 && lines[previousLineIndex].trim() === "") {
    previousLineIndex -= 1;
  }

  if (previousLineIndex >= 0) {
    lines[previousLineIndex] = "Open source under the GPL-3.0 license:";
  }

  writeFileSync(filePath, `${lines.join("\n").replace(/\n*$/, "")}\n`, "utf8");
}

function normalizeWhatsNewEntry(entry) {
  return {
    heading: entry.heading.replace(/1\.5\.\d+/g, chromeReleaseNotes.version),
    bullet1: chromeReleaseNotes.bullet1,
    bullet2: chromeReleaseNotes.bullet2
  };
}

function applyWhatsNewToListing(filePath, entry) {
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  let headingIndex = lines.findIndex(line => line.trim() === entry.heading);

  if (headingIndex === -1) {
    headingIndex = lines.findIndex(line => /1\.5\.\d+/.test(line));
  }

  if (headingIndex === -1) return;

  const replacement = [
    entry.heading,
    "",
    entry.bullet1,
    entry.bullet2,
    ""
  ];
  const nextLines = [
    ...lines.slice(0, headingIndex),
    ...replacement,
    ...lines.slice(headingIndex + 5)
  ];

  writeFileSync(filePath, `${nextLines.join("\n").replace(/\n*$/, "")}\n`, "utf8");
}

const baseMessages = JSON.parse(readFileSync(path.join(chromeLocalesDirectory, "en/messages.json"), "utf8"));
const englishListing = readFileSync(path.join(listingDirectory, "en.txt"), "utf8");
const generatedLocales = [...sameAsEnglishLocales, ...Object.keys(translations)];

for (const locale of generatedLocales) {
  mkdirSync(path.join(chromeLocalesDirectory, locale), { recursive: true });
  writeFileSync(
    path.join(chromeLocalesDirectory, locale, "messages.json"),
    `${JSON.stringify(createMessages(baseMessages, locale), null, 2)}\n`,
    "utf8"
  );
  writeFileSync(path.join(listingDirectory, `${locale}.txt`), createListing(englishListing, locale), "utf8");
}

const legacyHebrewListing = path.join(listingDirectory, "iw.txt");
const canonicalHebrewListing = path.join(listingDirectory, "he.txt");
if (existsSync(legacyHebrewListing) && !existsSync(canonicalHebrewListing)) {
  copyFileSync(legacyHebrewListing, canonicalHebrewListing);
}
if (existsSync(legacyHebrewListing)) {
  unlinkSync(legacyHebrewListing);
}

let whatsNew = JSON.parse(readFileSync(whatsNewPath, "utf8"));
if (whatsNew.iw && !whatsNew.he) {
  whatsNew.he = whatsNew.iw;
}
delete whatsNew.iw;

for (const locale of sameAsEnglishLocales) {
  whatsNew[locale] = { ...whatsNew.en };
}
for (const [locale, data] of Object.entries(translations)) {
  whatsNew[locale] = {
    heading: data.listing.whatsNewHead,
    bullet1: data.listing.whatsNew1,
    bullet2: data.listing.whatsNew2
  };
}
for (const [locale, entry] of Object.entries(whatsNew)) {
  whatsNew[locale] = normalizeWhatsNewEntry(entry);
}

whatsNew = Object.fromEntries(Object.entries(whatsNew).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(whatsNewPath, `${JSON.stringify(whatsNew, null, 2)}\n`, "utf8");

for (const fileName of readdirSync(listingDirectory).filter(fileName => fileName.endsWith(".txt"))) {
  const locale = path.basename(fileName, ".txt");
  const filePath = path.join(listingDirectory, fileName);
  if (whatsNew[locale]) {
    applyWhatsNewToListing(filePath, whatsNew[locale]);
  }
  normalizeStoreListingFooter(filePath);
}

console.log(`Synced ${generatedLocales.length} Chrome locale additions and normalized Chrome store listing footers.`);
