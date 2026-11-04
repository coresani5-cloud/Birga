/* Uzbegim — mijoz: ro'yxatdan o'tish, manzil, buyurtma va jonli kuzatuv.
   Server ishlayotgan bo'lsa (node server.js) hammasi haqiqiy: holatni oshxona/kuryer belgilaydi,
   kuryer GPS'i xaritada ko'rinadi. Fayl to'g'ridan-to'g'ri ochilsa — "Demo" rejim. */
const UZ = window.UZB;
let LIVE = false, ME = null, ES = null, TRK = null;

Object.assign(T.uz, {
  login: 'Kirish', register: "Ro'yxatdan o'tish", password: 'Parol (kamida 6 belgi)', haveAcc: 'Akkauntingiz bormi?', noAcc: "Akkauntingiz yo'qmi?",
  authH: 'Xush kelibsiz!', authP: "Buyurtma berish uchun akkauntga kiring yoki ro'yxatdan o'ting.",
  eExists: "Bu raqam allaqachon ro'yxatdan o'tgan. Kirish bo'limiga o'ting.", eLogin: "Telefon yoki parol noto'g'ri", ePhone: "Telefon raqamni +998 XX XXX XX XX ko'rinishida kiriting", ePw: "Parol kamida 6 belgidan iborat bo'lsin", eName: 'Ismingizni kiriting', eNet: "Server bilan aloqa yo'q. Internetni tekshiring.",
  welcomeU: 'Xush kelibsiz', profile: 'Profil', myOrders: 'Mening buyurtmalarim', noOrders: "Hali buyurtma yo'q", logout: 'Chiqish', track: 'Kuzatish', myAddr: 'Manzillarim', noAddr: "Saqlangan manzil yo'q. Buyurtma berishda saqlab qo'yishingiz mumkin.",
  addrPh: "Ko'cha, uy, xonadon, mo'ljal", pickMap: '📍 Xaritada belgilash', promoNoDisc: 'buyurtma chegirmasiz, oddiy narxda beriladi', orderNow: 'Buyurtma berish', delApprox: 'taxminan, operator aniqlaydi', pinOptional: 'Xaritada belgilash shart emas. Belgilasangiz, kuryer tezroq topadi va yetkazish narxi aniq hisoblanadi.', consentOrder: '«Buyurtma berish»ni bosib, <a href="oferta.html" target="_blank">oferta</a> shartlariga va <a href="privacy.html" target="_blank">shaxsiy ma\'lumotlar</a> qayta ishlanishiga rozilik bildirasiz.', myLoc: '🎯 Joylashuvimni aniqlash', mapDone: '✓ Xaritada belgilandi', saveAddr: 'Manzilni saqlab qo\'yish', addrLabel: 'Nomi (Uy, Ish...)', pickBranch: 'Filialni tanlang', mapHint: "Xaritani suring — pin manzilingiz ustida tursin",
  locDenied: "Joylashuvni aniqlab bo'lmadi. Xaritada qo'lda belgilang.", needAddr: 'Manzilni kiriting', orderFor: 'Buyurtmachi',
  waiting: 'Oshxona buyurtmangizni ko\'rib chiqmoqda...', courierCard: 'Kuryeringiz', dist: 'Masofa', left: 'Qoldi', upd: 'Yangilandi', near: '🔔 Kuryer yetib kelay dedi! Eshikka chiqing.', mins: 'daq', demo: 'Demo rejim: holatlar avtomatik o\'zgaradi. Haqiqiy rejim uchun serverni ishga tushiring.',
  myOrder: 'Buyurtmam', jmAgo: '{m} daqiqa oldin berilgan', jm_new: 'Buyurtmangiz oshxonaga yetib bordi, tasdiqlashni kutyapmiz', jm_accepted: 'Oshxona buyurtmangizni oldi, navbatga qo\'ydi', jm_cooking: 'Oshpaz hozir tayyorlayapti — hammasi yangi va issiq', jm_ready: 'Qadoqlandi! Kuryer olib ketmoqda', jm_readyP: 'Filialda sizni kutyapti — kelib oling', jm_onway: 'Kuryer yo\'lda — xaritada kuzatib boring', jm_delivered: 'Osh bo\'lsin! Bahoyingizni qoldiring', jm_deliveredP: 'Osh bo\'lsin! Bahoyingizni qoldiring', jm_cancelled: 'Buyurtma yopildi', consent: 'Men <a href="oferta.html" target="_blank">ommaviy oferta</a> shartlariga va <a href="privacy.html" target="_blank">shaxsiy ma\'lumotlarim</a> qayta ishlanishiga roziman', eConsent: 'Davom etish uchun oferta va maxfiylik shartlariga rozilik bering', forgot: 'Parolni unutdingizmi? +998 95 000 00 00 raqamiga qo\'ng\'iroq qiling — operator yangi vaqtinchalik parol beradi.', eLocked: 'Ko\'p marta noto\'g\'ri parol kiritildi. 15 daqiqadan keyin urinib ko\'ring yoki qo\'ng\'iroq qiling: +998 95 000 00 00', ePaused: 'Hozir buyurtmalar vaqtincha qabul qilinmayapti{m}. Birozdan keyin qayta urinib ko\'ring.', pausedBar: '⏸ Buyurtmalar vaqtincha to\'xtatilgan{m}{u}. Menyuni ko\'rib turishingiz mumkin.', pausedUntil: ' — soat {t} gacha', eActive: 'Sizda 3 ta faol buyurtma bor. Ular yetkazilgach yangisini bering yoki qo\'ng\'iroq qiling: +998 95 000 00 00', pwChange: 'Parolni o\'zgartirish', pwOld: 'Hozirgi parol', pwNew: 'Yangi parol (kamida 6 belgi)', pwSave: 'Saqlash', pwSaved: 'Parol o\'zgartirildi', eOldPw: 'Hozirgi parol noto\'g\'ri', pwTempNote: 'Siz vaqtinchalik parol bilan kirdingiz. Iltimos, o\'zingizga yangi parol o\'rnating.', hrsTpl: 'Har kuni {a} dan {b} gacha', hrs247: 'Har kuni, kun bo\'yi', dealLavash: '1+1: ikkinchi lavash yarim narxda', dealNight: 'Tungi aksiya: kombolarga −20%', eClosed: 'Hozir yopiqmiz. Ish vaqti: {h}', closedBar: '🌙 Hozir yopiqmiz — buyurtmalar {h} oralig\'ida qabul qilinadi. Menyuni ko\'rib turishingiz mumkin.', eStopped: 'Savatdagi ba\'zi taomlar tugab qoldi. Ularni savatdan olib tashlang.', ePromoFirst: 'Bu promokod faqat birinchi buyurtmaga', ePromoUsed: 'Bu promokoddan allaqachon foydalangansiz', eNoPoint: 'Xaritada manzilingizni belgilang', eFar: 'Bu manzil yetkazish hududidan tashqarida ({km} km dan uzoq)', eSlow: 'Juda ko\'p urinish. Bir daqiqadan keyin qayta urinib ko\'ring.', eMap: 'Xarita yuklanmadi. Internetni tekshiring.', delPick: 'xaritada belgilang', fromBranch: 'Filial', stepPoint: 'Xaritada uyingizni belgilang', stepAddr: 'Uy, xonadon, qavat, mo\'ljal', soldout: 'Tugagan', cancelBtn: 'Buyurtmani bekor qilish', cancelSure: 'Rostdan bekor qilinsinmi? Yana bosing', eLate: 'Oshxona buyurtmani qabul qilib bo\'ldi, endi bekor qilib bo\'lmaydi. Qo\'ng\'iroq qiling: +998 95 000 00 00', youCancelled: 'Siz buyurtmani bekor qildingiz.', reason: 'Sabab', rateQ: 'Buyurtma sizga yoqdimi?', rateComment: 'Fikringiz (ixtiyoriy)', send: 'Yuborish', thanksRate: 'Baho uchun rahmat!', delFrom: '{x} so\'mdan', cancelled: 'Buyurtma bekor qilindi. Savollar bo\'lsa qo\'ng\'iroq qiling: +998 95 000 00 00', items: 'Tarkib', gpsWait: 'Kuryer GPS signali kutilmoqda...', toYou: 'sizgacha',
});
Object.assign(T.ru, {
  login: 'Войти', register: 'Регистрация', password: 'Пароль (минимум 6 символов)', haveAcc: 'Уже есть аккаунт?', noAcc: 'Нет аккаунта?',
  authH: 'Добро пожаловать!', authP: 'Чтобы сделать заказ, войдите или зарегистрируйтесь.',
  eExists: 'Этот номер уже зарегистрирован. Перейдите ко входу.', eLogin: 'Неверный телефон или пароль', ePhone: 'Введите номер в формате +998 XX XXX XX XX', ePw: 'Пароль должен быть не короче 6 символов', eName: 'Введите имя', eNet: 'Нет связи с сервером. Проверьте интернет.',
  welcomeU: 'Добро пожаловать', profile: 'Профиль', myOrders: 'Мои заказы', noOrders: 'Заказов пока нет', logout: 'Выйти', track: 'Отследить', myAddr: 'Мои адреса', noAddr: 'Сохранённых адресов нет. Можно сохранить при заказе.',
  addrPh: 'Улица, дом, квартира, ориентир', pickMap: '📍 Отметить на карте', orderNow: 'Заказать', promoNoDisc: 'заказ будет по обычной цене, без скидки', delApprox: 'примерно, уточнит оператор', pinOptional: 'Отмечать на карте не обязательно. Но так курьер найдёт быстрее, а доставка посчитается точно.', consentOrder: 'Нажимая «Заказать», вы соглашаетесь с <a href="oferta.html" target="_blank">офертой</a> и <a href="privacy.html" target="_blank">обработкой персональных данных</a>.', myLoc: '🎯 Определить местоположение', mapDone: '✓ Отмечено на карте', saveAddr: 'Сохранить адрес', addrLabel: 'Название (Дом, Работа...)', pickBranch: 'Выберите филиал', mapHint: 'Двигайте карту — пин должен стоять на вашем адресе',
  locDenied: 'Не удалось определить местоположение. Отметьте на карте вручную.', needAddr: 'Укажите адрес', orderFor: 'Заказчик',
  waiting: 'Кухня рассматривает ваш заказ...', courierCard: 'Ваш курьер', dist: 'Расстояние', left: 'Осталось', upd: 'Обновлено', near: '🔔 Курьер почти у вас! Выходите к двери.', mins: 'мин', demo: 'Демо-режим: статусы меняются автоматически. Для реальной работы запустите сервер.',
  myOrder: 'Мой заказ', jmAgo: 'оформлен {m} мин назад', jm_new: 'Заказ получен кухней, ждём подтверждения', jm_accepted: 'Кухня приняла заказ и поставила в очередь', jm_cooking: 'Повар готовит прямо сейчас — всё свежее и горячее', jm_ready: 'Упаковано! Курьер забирает заказ', jm_readyP: 'Ждёт вас в филиале — можно забирать', jm_onway: 'Курьер в пути — следите на карте', jm_delivered: 'Приятного аппетита! Оставьте оценку', jm_deliveredP: 'Приятного аппетита! Оставьте оценку', jm_cancelled: 'Заказ закрыт', consent: 'Я согласен с <a href="oferta.html" target="_blank">публичной офертой</a> и <a href="privacy.html" target="_blank">обработкой персональных данных</a>', eConsent: 'Чтобы продолжить, примите условия оферты и политики конфиденциальности', forgot: 'Забыли пароль? Позвоните +998 95 000 00 00 — оператор выдаст новый временный пароль.', eLocked: 'Слишком много неверных попыток. Попробуйте через 15 минут или позвоните: +998 95 000 00 00', ePaused: 'Сейчас заказы временно не принимаются{m}. Попробуйте чуть позже.', pausedBar: '⏸ Приём заказов временно приостановлен{m}{u}. Меню можно посмотреть.', pausedUntil: ' — до {t}', eActive: 'У вас уже 3 активных заказа. Оформите новый после доставки или позвоните: +998 95 000 00 00', pwChange: 'Сменить пароль', pwOld: 'Текущий пароль', pwNew: 'Новый пароль (не короче 6 символов)', pwSave: 'Сохранить', pwSaved: 'Пароль изменён', eOldPw: 'Текущий пароль неверный', pwTempNote: 'Вы вошли по временному паролю. Пожалуйста, задайте свой новый пароль.', hrsTpl: 'Ежедневно с {a} до {b}', hrs247: 'Ежедневно, круглосуточно', dealLavash: '1+1: второй лаваш за полцены', dealNight: 'Ночная акция: −20% на комбо', eClosed: 'Сейчас мы закрыты. Часы работы: {h}', closedBar: '🌙 Сейчас мы закрыты — заказы принимаются с {h}. Меню можно посмотреть.', eStopped: 'Некоторые блюда закончились. Уберите их из корзины.', ePromoFirst: 'Этот промокод только для первого заказа', ePromoUsed: 'Вы уже использовали этот промокод', eNoPoint: 'Отметьте ваш адрес на карте', eFar: 'Адрес вне зоны доставки (дальше {km} км)', eSlow: 'Слишком много попыток. Попробуйте через минуту.', eMap: 'Карта не загрузилась. Проверьте интернет.', delPick: 'отметьте на карте', fromBranch: 'Филиал', stepPoint: 'Отметьте дом на карте', stepAddr: 'Дом, квартира, этаж, ориентир', soldout: 'Закончилось', cancelBtn: 'Отменить заказ', cancelSure: 'Точно отменить? Нажмите ещё раз', eLate: 'Кухня уже приняла заказ, отменить нельзя. Позвоните: +998 95 000 00 00', youCancelled: 'Вы отменили заказ.', reason: 'Причина', rateQ: 'Понравился заказ?', rateComment: 'Ваш отзыв (необязательно)', send: 'Отправить', thanksRate: 'Спасибо за оценку!', delFrom: 'от {x} сум', cancelled: 'Заказ отменён. Вопросы: +998 95 000 00 00', items: 'Состав', gpsWait: 'Ждём GPS-сигнал курьера...', toYou: 'до вас',
});

/* ---------- Stil ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
.auth-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:16px;background:var(--glass);border:1px solid var(--ln);margin-top:16px}
.auth-tabs button{height:42px;border-radius:12px;font-weight:800}
.auth-tabs button.on{background:var(--grad);color:#120d09}
.err{color:#ff6b5e;font-size:13px;font-weight:700;min-height:18px}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chipb{padding:9px 14px;border-radius:999px;border:1px solid var(--ln);background:var(--glass);font-weight:700;font-size:13px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chipb.on{border-color:var(--or);color:var(--or2);background:rgba(255,122,0,.12)}
.pick{position:relative;height:260px;border-radius:20px;overflow:hidden;border:1px solid var(--ln)}
.pick .cpin{position:absolute;left:50%;top:50%;z-index:500;transform:translate(-50%,-100%);font-size:40px;pointer-events:none;filter:drop-shadow(0 6px 8px rgba(0,0,0,.5))}
.row2{display:flex;gap:8px;flex-wrap:wrap}
.row2 .btn{flex:1;height:44px;font-size:13px;padding:0 14px}
.ok{color:#34d399;font-weight:800;font-size:13px}
.me-card{display:flex;gap:14px;align-items:center;padding:16px;border-radius:20px;background:var(--glass);border:1px solid var(--ln)}
.me-av{width:54px;height:54px;border-radius:50%;background:var(--grad);display:grid;place-items:center;font-family:Unbounded;font-weight:900;font-size:22px;color:#120d09;flex:none}
.olist{display:grid;gap:10px}
.oi{display:flex;gap:12px;align-items:center;padding:14px;border-radius:18px;background:var(--glass);border:1px solid var(--ln)}
.oi .m{flex:1;min-width:0}.oi .m b{display:block}.oi .m span{font-size:12px;color:var(--mut)}
.stc{font-size:11px;font-weight:800;padding:5px 10px;border-radius:999px;background:var(--glass2);border:1px solid var(--ln);white-space:nowrap}
.stc.onway,.stc.ready{background:rgba(255,122,0,.15);color:var(--or2);border-color:rgba(255,122,0,.4)}
.stc.delivered{background:rgba(52,211,153,.12);color:#34d399;border-color:rgba(52,211,153,.35)}
.stc.cancelled{background:rgba(255,80,60,.12);color:#ff6b5e}
.trk-h{display:flex;justify-content:space-between;align-items:center;gap:10px;padding-right:44px}
.trk-big{display:flex;gap:14px;align-items:center;margin:16px 0;padding:16px;border-radius:20px;background:linear-gradient(135deg,rgba(255,166,43,.16),rgba(255,106,0,.08));border:1px solid rgba(255,122,0,.3)}
.trk-big .e{font-size:0}
.ts .d .gi{width:20px;height:20px;stroke:var(--mut)}
.ts.on .d .gi{stroke:#fff;stroke-width:1.8}.trk-big b{display:block;font-size:17px}.trk-big span{color:var(--mut);font-size:13px}
.trk-map{height:300px;border-radius:20px;overflow:hidden;border:1px solid var(--ln);background:var(--glass)}
.trk-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
.trk-stats div{padding:10px 12px;border-radius:16px;background:var(--glass);border:1px solid var(--ln)}
.trk-stats span{display:block;font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em}
.trk-stats b{font-family:Unbounded;font-size:16px;color:var(--or2)}
.near{margin-top:12px;padding:14px;border-radius:16px;background:var(--grad);color:#120d09;font-weight:800;text-align:center;animation:nearp 1.2s infinite}
@keyframes nearp{50%{transform:scale(1.02)}}
.ts small{display:block;color:var(--mut);font-weight:600;font-size:12px}
.ts.on b{color:var(--ink)}
.demo-note{margin-top:12px;font-size:12px;color:var(--mut);padding:10px 12px;border-radius:12px;border:1px dashed var(--ln)}
/* ===== Buyurtma yo'li ===== */
.jr{margin:16px 0;padding:18px 14px 14px;border-radius:26px;position:relative;overflow:hidden;border:1px solid rgba(255,122,0,.32);
  background:radial-gradient(120% 140% at 0% 0%,rgba(255,166,43,.22),transparent 55%),radial-gradient(80% 120% at 100% 100%,rgba(31,182,193,.10),transparent 60%),var(--glass)}
.jr::before{content:"";position:absolute;right:-40px;top:-40px;width:160px;height:160px;opacity:.10;background:conic-gradient(from 22.5deg,#ffa62b 0 12.5%,transparent 0 25%,#ffa62b 0 37.5%,transparent 0 50%,#ffa62b 0 62.5%,transparent 0 75%,#ffa62b 0 87.5%,transparent 0);border-radius:50%;animation:jrspin 30s linear infinite;pointer-events:none}
@keyframes jrspin{to{transform:rotate(360deg)}}
.jr-hero{display:flex;gap:14px;align-items:center;position:relative}
.jr-orb{width:66px;height:66px;border-radius:50%;background:var(--grad);display:grid;place-items:center;position:relative;flex:none;box-shadow:0 12px 30px rgba(255,106,0,.45)}
.jr-orb::before,.jr-orb::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:2px solid rgba(255,140,40,.6);animation:jrorb 2.2s ease-out infinite}
.jr-orb::after{animation-delay:1.1s}
@keyframes jrorb{from{transform:scale(.85);opacity:1}to{transform:scale(1.55);opacity:0}}
.jr-orb .gi{width:32px;height:32px;stroke:#fff;stroke-width:1.8;animation:jrbob 2.4s ease-in-out infinite}
.jr-orb[data-s="cooking"] .gi{animation:jrsizzle .45s ease-in-out infinite alternate}
.jr-orb[data-s="onway"] .gi{animation:jrride 1s ease-in-out infinite}
.jr-orb[data-s="new"] .gi{animation:jrtick 2s steps(8) infinite}
.jr-orb.pop{animation:jrpop .6s cubic-bezier(.3,1.6,.5,1)}
@keyframes jrbob{50%{transform:translateY(-3px)}}
@keyframes jrsizzle{from{transform:rotate(-7deg) scale(1)}to{transform:rotate(7deg) scale(1.06)}}
@keyframes jrride{0%,100%{transform:translateX(-3px)}50%{transform:translateX(3px) translateY(-2px)}}
@keyframes jrtick{to{transform:rotate(360deg)}}
@keyframes jrpop{0%{transform:scale(.6)}100%{transform:scale(1)}}
.jr-txt{min-width:0}
.jr-txt b{font-family:Unbounded,Manrope,sans-serif;font-size:18px;line-height:1.2;display:block}
.jr-txt span{color:var(--mut);font-size:13px;display:block;margin-top:2px}
.jr-txt em{font-style:normal;font-size:13px;color:var(--or2);display:block;margin-top:4px;font-weight:700}
.jr-track{position:relative;display:grid;grid-template-columns:repeat(var(--n,6),minmax(0,1fr));margin-top:22px}
.jr-line{position:absolute;top:20px;left:calc(50% / var(--n,6));right:calc(50% / var(--n,6));height:4px;border-radius:4px;background:rgba(255,255,255,.10)}
.jr-line i{display:block;height:100%;width:0;border-radius:4px;background:linear-gradient(90deg,#ffd166,#ff7a00);transition:width 1.1s cubic-bezier(.2,.8,.2,1);position:relative;box-shadow:0 0 12px rgba(255,122,0,.6)}
.jr-line i::after{content:"";position:absolute;inset:0;border-radius:4px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);background-size:60px 100%;background-repeat:no-repeat;animation:jrshine 1.8s linear infinite}
@keyframes jrshine{from{background-position:-60px 0}to{background-position:calc(100% + 60px) 0}}
.jr-s{display:grid;justify-items:center;align-content:start;gap:6px;text-align:center;position:relative;z-index:1;min-width:0}
.jr-d{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:var(--bg2);border:2px solid rgba(255,255,255,.14);transition:background .4s,border-color .4s,transform .4s;position:relative}
.jr-d .gi{width:20px;height:20px;stroke:var(--mut);stroke-width:1.6}
.jr-s.done .jr-d{background:var(--grad);border-color:transparent}
.jr-s.done .jr-d .gi{stroke:#fff;stroke-width:1.9}
.jr-s.done:not(.cur) .jr-d::after{content:"";position:absolute;right:-3px;bottom:-3px;width:16px;height:16px;border-radius:50%;background:#34d399 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23062016' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 12.5 4 4 8-9'/%3E%3C/svg%3E") center/11px no-repeat;border:2px solid var(--bg2)}
.jr-s.cur .jr-d{transform:scale(1.18);box-shadow:0 0 0 6px rgba(255,122,0,.18),0 8px 22px rgba(255,106,0,.5);animation:jrcur 1.6s ease-in-out infinite}
@keyframes jrcur{50%{box-shadow:0 0 0 11px rgba(255,122,0,.06),0 8px 22px rgba(255,106,0,.5)}}
.jr-s b{font-size:11px;font-weight:800;color:var(--mut);line-height:1.2;white-space:nowrap}
.jr-s.done b,.jr-s.cur b{color:var(--ink)}
.jr-s small{font-size:10.5px;color:var(--mut);font-variant-numeric:tabular-nums}
.jr.x{border-color:rgba(255,90,78,.4);background:radial-gradient(120% 140% at 0% 0%,rgba(255,90,78,.18),transparent 55%),var(--glass)}
.jr.x .jr-orb{background:linear-gradient(135deg,#ff7a6e,#d92f22);box-shadow:0 12px 30px rgba(217,47,34,.4)}
.jr.x .jr-orb::before,.jr.x .jr-orb::after,.jr.ok .jr-orb::before,.jr.ok .jr-orb::after{animation:none;opacity:0}
.jr.x .jr-line i{background:#ff5a4e;box-shadow:none}
.jr.x .jr-line i::after,.jr.ok .jr-line i::after{animation:none;opacity:0}
.jr.ok{border-color:rgba(52,211,153,.4);background:radial-gradient(120% 140% at 0% 0%,rgba(52,211,153,.16),transparent 55%),var(--glass)}
.jr.ok .jr-orb{background:linear-gradient(135deg,#5eead4,#10b981);box-shadow:0 12px 30px rgba(16,185,129,.4)}
@media (max-width:420px){.jr-d{width:38px;height:38px}.jr-line{top:17px}.jr-s b{font-size:9.5px;letter-spacing:-.01em}.jr-txt b{font-size:16px}}
@media (prefers-reduced-motion:reduce){.jr *,.jr::before{animation:none!important}}
.rate{display:grid;gap:10px;padding:14px;border-radius:18px;background:var(--glass);border:1px solid var(--ln);margin-bottom:10px}
.rate .stars{display:flex;gap:6px}.rate .stars button{font-size:32px;color:var(--mut);line-height:1}.rate .stars button.on{color:var(--gold,#d9b35b)}
.rate textarea{height:64px;border-radius:14px;border:1px solid var(--ln);background:var(--glass);padding:10px 12px;resize:none;outline:none}
.rate.done{display:block;color:var(--gold,#d9b35b);font-size:22px}.rate.done span{font-size:14px;color:var(--mut)}
.consent{display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.4;color:var(--mut)}.consent input{width:20px;height:20px;flex:none;margin-top:1px;accent-color:#ff7a00}.consent a{color:var(--or2)}
.otype.alt{background:var(--glass2);color:var(--ink);border:1px solid rgba(255,122,0,.5);box-shadow:none;animation:nearp 2s infinite}
</style>`);

/* ---------- Akkaunt ---------- */
const demoUsers = () => store.get('demo_users', {});
async function loadMe() {
  if (LIVE) {
    if (!UZ.token()) ME = null;
    else for (let k = 0; k < 6; k++) {
      // server uyg'onayotgan bo'lsa (Render) kirishni o'chirmasdan qayta urinamiz
      try { ME = await UZ.api('me'); break; } catch (e) { ME = null; if (e.status === 401) { UZ.setToken(''); break; } await new Promise(r => setTimeout(r, 2500)); }
    }
  } else ME = store.get('demo_me', null);
  updateUserUi();
}
function updateUserUi() {
  const b = document.getElementById('userBtn');
  if (b) b.classList.toggle('on', !!ME);
  const tp = document.getElementById('tProfile');
  if (tp) tp.querySelector('span').textContent = ME ? ME.name.split(' ')[0] : t('login');
}
async function saveMe(patch) {
  Object.assign(ME, patch);
  if (LIVE) { try { ME = await UZ.api('me', { method: 'PUT', body: patch }); } catch (e) {} }
  else { store.set('demo_me', ME); const u = demoUsers(); if (u[ME.phone]) { u[ME.phone].addresses = ME.addresses; store.set('demo_users', u); } }
}
const phoneDigits = v => v.replace(/\D/g, '');

function openAuth(after, tab = 'reg') {
  const draw = () => {
    openModal(`<div class="mbody" style="padding-top:30px">
      <div style="display:flex;gap:12px;align-items:center">${document.querySelector('.emb').outerHTML.replace('class="emb"', 'class="emb" style="width:56px;height:56px"').replace(/id="eg2?"/, 'id="eg9"').replace(/url\(#eg2?\)/, 'url(#eg9)')}<div><h3>${t('authH')}</h3><p style="color:var(--mut);font-size:14px">${t('authP')}</p></div></div>
      <div class="auth-tabs"><button class="${tab === 'reg' ? 'on' : ''}" data-at="reg">${t('register')}</button><button class="${tab === 'in' ? 'on' : ''}" data-at="in">${t('login')}</button></div>
      <form class="form" id="authF" novalidate>
        ${tab === 'reg' ? `<input id="aName" placeholder="${t('name')}" autocomplete="name">` : ''}
        <input id="aPhone" type="tel" value="+998 " autocomplete="tel">
        <input id="aPw" type="password" placeholder="${t('password')}" autocomplete="${tab === 'reg' ? 'new-password' : 'current-password'}">
        ${tab === 'reg' ? `<label class="consent"><input type="checkbox" id="aOk"> <span>${t('consent')}</span></label>` : `<p class="hint">${t('forgot')}</p>`}
        <div class="err" id="aErr"></div>
        <button class="btn wide" type="submit">${tab === 'reg' ? t('register') : t('login')} →</button>
      </form></div>`);
    document.querySelectorAll('[data-at]').forEach(b => (b.onclick = () => { tab = b.dataset.at; draw(); }));
    const ph = document.getElementById('aPhone');
    maskPhone(ph);
    document.getElementById('authF').onsubmit = async e => {
      e.preventDefault();
      const err = document.getElementById('aErr');
      const name = tab === 'reg' ? document.getElementById('aName').value.trim() : '';
      const phone = phoneDigits(ph.value), pw = document.getElementById('aPw').value;
      if (tab === 'reg' && !name) return (err.textContent = t('eName'));
      if (phone.length !== 12) return (err.textContent = t('ePhone'));
      if (pw.length < 6) return (err.textContent = t('ePw'));
      if (tab === 'reg' && !document.getElementById('aOk').checked) return (err.textContent = t('eConsent'));
      err.textContent = '';
      try {
        if (LIVE) {
          const r = await UZ.api(tab === 'reg' ? 'auth/register' : 'auth/login', { body: { name, phone, password: pw, consent: tab === 'reg' } });
          UZ.setToken(r.token); ME = r.user;
        } else {
          const u = demoUsers(), key = '+' + phone;
          if (tab === 'reg') { if (u[key]) return (err.textContent = t('eExists')); u[key] = { name, phone: key, pw, addresses: [] }; store.set('demo_users', u); }
          else if (!u[key] || u[key].pw !== pw) return (err.textContent = t('eLogin'));
          ME = { name: u[key].name, phone: key, addresses: u[key].addresses || [] }; store.set('demo_me', ME);
        }
        updateUserUi(); closeAll(); toast(`👋 ${t('welcomeU')}, ${ME.name}!`);
        if (ME.pwTemp) setTimeout(openProfile, 250); // vaqtinchalik parol — darhol yangisini so'raymiz
        else if (after) setTimeout(after, 250);
      } catch (x) {
        err.textContent = x.message === 'consent' ? t('eConsent') : x.message === 'locked' ? t('eLocked') : x.message === 'slow' ? t('eSlow') : x.message === 'exists' ? t('eExists') : x.message === 'login' ? t('eLogin') : x.message === 'phone' ? t('ePhone') : x.message === 'password' ? t('ePw') : t('eNet');
      }
    };
  };
  draw();
}

async function myOrders() {
  if (LIVE) { try { return await UZ.api('me/orders'); } catch (e) { return []; } }
  return store.get('demo_orders', []).filter(o => o.phone === ME.phone);
}
async function openProfile() {
  if (!ME) return openAuth(openProfile, 'in');
  openModal(`<div class="mbody" style="padding-top:30px"><h3>${t('profile')}</h3>
    <div class="me-card" style="margin-top:14px"><div class="me-av">${ME.name[0].toUpperCase()}</div><div style="min-width:0"><b style="font-size:17px">${esc(ME.name)}</b><div style="color:var(--mut)">${esc(ME.phone)}</div></div></div>
    <div class="lbl" style="margin-top:18px">${t('myAddr')}</div>
    <div class="olist" id="pAddr" style="margin-top:8px"></div>
    <div class="lbl" style="margin-top:18px">${t('myOrders')}</div>
    <div class="olist" id="pOrders" style="margin-top:8px"><div class="hint">...</div></div>
    ${LIVE ? `<details class="pw" id="pPw" ${ME.pwTemp ? 'open' : ''} style="margin-top:18px"><summary class="lbl" style="cursor:pointer">${t('pwChange')}</summary>
      ${ME.pwTemp ? `<p class="hint" style="margin:8px 0;color:var(--or2)">${t('pwTempNote')}</p>` : ''}
      <form class="form" id="pwF" style="margin-top:8px"><input id="pwOld" type="password" placeholder="${t('pwOld')}" autocomplete="current-password"><input id="pwNew" type="password" placeholder="${t('pwNew')}" autocomplete="new-password"><div class="err" id="pwErr"></div><button class="btn wide" type="submit">${t('pwSave')}</button></form></details>` : ''}
    <button class="btn ghost wide" id="pOut" style="margin-top:18px">${t('logout')}</button></div>`);
  const pwF = document.getElementById('pwF');
  if (pwF) pwF.onsubmit = async e => {
    e.preventDefault();
    const er = document.getElementById('pwErr'), nw = document.getElementById('pwNew').value;
    if (nw.length < 6) return (er.textContent = t('ePw'));
    try { ME = await UZ.api('me', { method: 'PUT', body: { password: document.getElementById('pwOld').value, newPassword: nw } }); toast('✅ ' + t('pwSaved')); document.getElementById('pPw').open = false; er.textContent = ''; }
    catch (x) { er.textContent = x.message === 'oldpw' ? t('eOldPw') : x.message === 'locked' ? t('eLocked') : x.message === 'password' ? t('ePw') : t('eNet'); }
  };
  const drawAddr = () => {
    document.getElementById('pAddr').innerHTML = (ME.addresses || []).length
      ? ME.addresses.map((a, i) => `<div class="oi"><span style="font-size:22px">📍</span><div class="m"><b>${esc(a.label || t('addr'))}</b><span>${esc(a.addr)}</span></div><button class="x" data-deladdr="${i}" aria-label="delete">✕</button></div>`).join('')
      : `<div class="hint">${t('noAddr')}</div>`;
    document.querySelectorAll('[data-deladdr]').forEach(b => (b.onclick = async () => { ME.addresses.splice(+b.dataset.deladdr, 1); await saveMe({ addresses: ME.addresses }); drawAddr(); }));
  };
  drawAddr();
  document.getElementById('pOut').onclick = async () => {
    if (LIVE) { try { await UZ.api('auth/logout', { body: {} }); } catch (e) {} UZ.setToken(''); } else store.set('demo_me', null);
    ME = null; updateUserUi(); closeAll();
  };
  const list = await myOrders();
  const el = document.getElementById('pOrders');
  if (!el) return;
  el.innerHTML = list.length ? list.map(o => {
    const k = UZ.statusKey(o.status, o.mode);
    return `<div class="oi"><span style="font-size:24px">${UZ.STATUS[k].e}</span><div class="m"><b>#${o.no} • ${UZ.money(o.total)} ${t('sum')}</b><span>${new Date(o.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></div><span class="stc ${o.status}">${UZ.STATUS[k].s[L]}</span><button class="btn" style="height:38px;padding:0 14px;font-size:13px" data-trk="${o.id}" data-tok="${o.token || ''}">${t('track')}</button></div>`;
  }).join('') : `<div class="hint">${t('noOrders')}</div>`;
  el.querySelectorAll('[data-trk]').forEach(b => (b.onclick = () => openTrack({ id: b.dataset.trk, token: b.dataset.tok })));
}
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- Buyurtma berish ---------- */
// Server javobidagi xato kodlarini tushunarli matnga aylantirish
function errText(e) {
  const c = e && (e.message || e.error), r = e && e.data;
  const pm = () => (MENU.pauseMsg ? ` (${MENU.pauseMsg})` : '');
  if (c === 'closed') return r && r.paused ? t('ePaused').replace('{m}', pm()) : t('eClosed').replace('{h}', MENU.hours || '');
  if (c === 'paused') return t('ePaused').replace('{m}', pm());
  if (c === 'active_limit') return t('eActive');
  if (c === 'locked') return t('eLocked');
  if (c === 'stopped') return t('eStopped');
  if (c === 'promo') return t(r && r.reason === 'first' ? 'ePromoFirst' : r && r.reason === 'used' ? 'ePromoUsed' : 'promoBad');
  if (c === 'nopoint') return t('eNoPoint');
  if (c === 'far') return t('eFar').replace('{km}', MENU.maxKm || 15);
  if (c === 'addr') return t('needAddr');
  if (c === 'items') return t('cartEmpty');
  if (c === 'slow') return t('eSlow');
  return t('eNet');
}
function cartItems() { return Object.entries(cart).map(([k, q]) => { const r = PK(k); return { id: k, n: vName(r.p, r.vi), q, price: r.v.p }; }); }
function localQuote(b) {
  const tt = totals();
  return { sub: tt.sub, disc: tt.disc, del: b.mode === 'd' && tt.sub < FREE_FROM ? 10000 : 0, total: tt.sub - tt.disc + (b.mode === 'd' && tt.sub < FREE_FROM ? 10000 : 0), branch: b.branch || 0, dist: null, zone: null, promoError: null, open: true };
}
// Telefon raqamni +998 XX XXX XX XX ko'rinishiga keltirish
function maskPhone(el) {
  el.oninput = () => { let d = phoneDigits(el.value); if (!d.startsWith('998')) d = '998' + (d.length > 9 ? d.slice(-9) : d); d = d.slice(0, 12); el.value = '+' + d.slice(0, 3) + ' ' + d.slice(3, 5) + (d.length > 5 ? ' ' + d.slice(5, 8) : '') + (d.length > 8 ? ' ' + d.slice(8, 10) : '') + (d.length > 10 ? ' ' + d.slice(10, 12) : ''); };
  el.oninput();
}
/* Buyurtma: bitta oyna — ism, telefon, manzil. Ro'yxatdan o'tish shart emas, xarita ixtiyoriy.
   Mehmon ma'lumotlari shu qurilmada eslab qolinadi — keyingi safar hammasi tayyor turadi. */
function openCheckout() {
  if (LIVE && MENU.open === false) { toast(MENU.paused ? errText({ message: 'paused' }) : t('eClosed').replace('{h}', MENU.hours || '')); return; }
  const G = store.get('guest', null) || {};
  const who = { name: ME ? ME.name : G.name || '', phone: ME ? ME.phone : G.phone || '' };
  const sel = { addr: '', lat: null, lng: null, branch: Math.max(0, UZ.BRANCHES.findIndex(b => b.active !== false)), label: '' };
  const saved = ME ? ME.addresses || [] : G.addr ? [{ label: t('addr'), addr: G.addr, lat: G.lat ?? null, lng: G.lng ?? null }] : [];
  if (saved[0]) Object.assign(sel, saved[0]);
  let pickMap = null, Q = null, qT = null, seq = 0;
  $('#drawer').classList.remove('on');
  const body = () => ({ mode, addr: sel.addr, lat: mode === 'd' ? sel.lat : null, lng: mode === 'd' ? sel.lng : null, noPin: mode === 'd' && sel.lat == null, branch: sel.branch, items: cartItems(), promo, name: who.name, phone: who.phone });
  const drawSum = () => {
    const el = document.getElementById('fSum'); if (!el) return;
    if (!Q) { el.innerHTML = `<div class="hint">...</div>`; return; }
    const br = UZ.BRANCHES[Q.branch || 0];
    let delLine;
    if (mode !== 'd') delLine = '';
    else if (Q.zone === 'paused') delLine = `<div class="line"><span>${t('del')}</span><span style="color:#ff6b5e">${errText({ message: 'paused' })}</span></div>`;
    else if (Q.zone === 'far') delLine = `<div class="line"><span>${t('del')}</span><span style="color:#ff6b5e">${t('eFar').replace('{km}', MENU.maxKm || 15)}</span></div>`;
    else if (sel.lat == null) delLine = `<div class="line"><span>${t('del')} <span class="hint">· ${t('delApprox')}</span></span><span>${Q.del ? fmt(Q.del) : t('free')}</span></div>`;
    else delLine = `<div class="line"><span>${t('del')}${Q.dist != null ? ` · ${String(Q.dist).replace('.', ',')} km` : ''}</span><span>${Q.del ? fmt(Q.del) : t('free')}</span></div>`;
    el.innerHTML = `<div class="line"><span>${t('sub')}</span><span>${fmt(Q.sub)}</span></div>
      ${(Q.deals || []).map(d => `<div class="line" style="color:#34d399"><span>${t(d.id === 'lavash11' ? 'dealLavash' : 'dealNight')}</span><span>−${fmt(d.v)}</span></div>`).join('')}
      ${Q.disc - (Q.deals || []).reduce((a, d) => a + d.v, 0) > 0 ? `<div class="line" style="color:#34d399"><span>${t('disc')} (${promo})</span><span>−${fmt(Q.disc - (Q.deals || []).reduce((a, d) => a + d.v, 0))}</span></div>` : ''}
      ${Q.promoError ? `<div class="line" style="color:var(--or2);font-size:13px"><span>${esc(promo)}: ${t(Q.promoError === 'first' ? 'ePromoFirst' : Q.promoError === 'used' ? 'ePromoUsed' : 'promoBad')} — ${t('promoNoDisc')}</span><button type="button" class="x" data-promox style="flex:none;padding:0 6px" aria-label="remove">✕</button></div>` : ''}
      ${delLine}
      ${mode === 'd' && Q.dist != null && br ? `<div class="hint">🏪 ${t('fromBranch')}: ${br[L]}</div>` : ''}
      <div class="line tot"><span>${t('total')}</span><span>${fmt(Q.total)}</span></div>`;
    const go = document.getElementById('fGo');
    if (go) go.textContent = `${t('orderNow')} • ${fmt(Q.total)}`;
  };
  const requote = () => {
    clearTimeout(qT);
    qT = setTimeout(async () => {
      const my = ++seq;
      try { const q = LIVE ? await UZ.api('quote', { body: body() }) : localQuote(body()); if (my === seq) { Q = q; drawSum(); } }
      catch (e) { if (my === seq) { Q = localQuote(body()); drawSum(); } }
    }, 250);
  };
  const showOk = () => { const o = document.getElementById('fMapOk'), h = document.getElementById('fPinHint'); if (o) o.hidden = sel.lat == null; if (h) h.hidden = sel.lat != null; };
  const openPick = async c => {
    const w = document.getElementById('fMapW'); if (!w) return;
    w.hidden = false;
    try {
      if (!pickMap || !document.getElementById('fMap').children.length) {
        pickMap = await UZ.makeMap(document.getElementById('fMap'), c || (sel.lat != null ? sel : UZ.CENTER), sel.lat != null || c ? 16 : 13);
        pickMap.on('moveend', () => { const p = pickMap.getCenter(); sel.lat = +p.lat.toFixed(6); sel.lng = +p.lng.toFixed(6); showOk(); requote(); const er = document.getElementById('fErr'); if (er) er.textContent = ''; });
      } else if (c) pickMap.setView([c.lat, c.lng], 17);
      if (c || sel.lat != null) { const p = pickMap.getCenter(); sel.lat = +p.lat.toFixed(6); sel.lng = +p.lng.toFixed(6); showOk(); requote(); }
    } catch (e) { document.getElementById('fMap').innerHTML = `<div class="hint" style="padding:16px">${t('eMap')}</div>`; }
  };
  const keepWho = () => { const n = document.getElementById('fName'), ph = document.getElementById('fPhone'); if (n) who.name = n.value.trim(); if (ph) who.phone = '+' + phoneDigits(ph.value); };
  const draw = () => {
    keepWho();
    pickMap = null;
    openModal(`<div class="mbody" style="padding-top:30px"><h3>${t('ordH')}</h3><div class="form">
      <div class="seg"><button type="button" class="${mode === 'd' ? 'on' : ''}" data-cm="d">${t('oDel')}</button><button type="button" class="${mode === 'p' ? 'on' : ''}" data-cm="p">${t('oPick')}</button></div>
      ${ME ? `<div class="me-card" style="padding:12px"><div class="me-av" style="width:40px;height:40px;font-size:16px">${esc(ME.name[0].toUpperCase())}</div><div><span class="hint">${t('orderFor')}</span><b style="display:block">${esc(ME.name)} • ${esc(ME.phone)}</b></div></div>`
        : `<input id="fName" placeholder="${t('name')}" value="${esc(who.name)}" autocomplete="name" maxlength="60"><input id="fPhone" type="tel" value="${esc(who.phone || '+998 ')}" autocomplete="tel" inputmode="tel">`}
      ${mode === 'd' ? `
        ${saved.length > 1 ? `<div class="chips">${saved.map((a, i) => `<button type="button" class="chipb ${sel.addr === a.addr ? 'on' : ''}" data-sa="${i}">📍 ${esc(a.label || a.addr)}</button>`).join('')}</div>` : ''}
        <textarea id="fAddr" placeholder="${t('addrPh')}" style="height:64px">${esc(sel.addr)}</textarea>
        <div class="row2"><button type="button" class="btn ghost" id="fLoc">${t('myLoc')}</button><button type="button" class="btn ghost" id="fMapB">${t('pickMap')}</button></div>
        <div id="fMapW" ${sel.lat != null ? '' : 'hidden'}><div class="pick"><div id="fMap" style="height:100%"></div><span class="cpin">📍</span></div><div class="hint" style="margin-top:6px">${t('mapHint')}</div></div>
        <div id="fMapOk" class="ok" ${sel.lat == null ? 'hidden' : ''}>${t('mapDone')}</div>
        <div class="hint" id="fPinHint" ${sel.lat == null ? '' : 'hidden'}>${t('pinOptional')}</div>
        ${ME ? `<label style="display:flex;gap:10px;align-items:center;font-weight:700;font-size:14px"><input type="checkbox" id="fSave" ${saved.some(a => a.addr === sel.addr) ? '' : 'checked'} style="width:20px;height:20px;accent-color:#ff7a00"> ${t('saveAddr')}</label>` : ''}
      ` : `<select id="fBranch">${UZ.BRANCHES.map((b, i) => b.active === false ? '' : `<option value="${i}" ${sel.branch === i ? 'selected' : ''}>${b[L]}${b.addr && b.addr[L] ? ' — ' + esc(b.addr[L]) : ''}</option>`).join('')}</select>`}
      <textarea id="fNote" placeholder="${t('note')}"></textarea>
      <div class="hint">💳 ${t('pay')}</div>
      <div id="fSum"></div>
      <div class="err" id="fErr"></div>
      <button type="button" class="btn wide" id="fGo">${t('orderNow')}</button>
      ${ME ? '' : `<p class="hint" style="font-size:12px;text-align:center;line-height:1.45">${t('consentOrder')}</p><p class="hint" style="font-size:13px;text-align:center">${t('haveAcc')} <a href="#" id="fLogin" style="color:var(--or2);font-weight:800">${t('login')}</a></p>`}</div></div>`);
    document.querySelectorAll('[data-cm]').forEach(b => (b.onclick = () => { setMode(b.dataset.cm); draw(); requote(); }));
    document.querySelectorAll('[data-sa]').forEach(b => (b.onclick = () => { Object.assign(sel, saved[+b.dataset.sa]); draw(); }));
    const ph = document.getElementById('fPhone'); if (ph) { maskPhone(ph); ph.onchange = () => { keepWho(); requote(); }; }
    const nm = document.getElementById('fName'); if (nm) nm.onchange = keepWho;
    const lg = document.getElementById('fLogin'); if (lg) lg.onclick = e => { e.preventDefault(); openAuth(openCheckout, 'in'); };
    const addrEl = document.getElementById('fAddr');
    if (addrEl) addrEl.oninput = () => (sel.addr = addrEl.value);
    const brEl = document.getElementById('fBranch');
    if (brEl) brEl.onchange = () => { sel.branch = +brEl.value; requote(); };
    const lb = document.getElementById('fLoc');
    if (lb) lb.onclick = () => {
      if (!navigator.geolocation) return toast(t('locDenied'));
      lb.textContent = '...';
      navigator.geolocation.getCurrentPosition(p => { lb.textContent = t('myLoc'); openPick({ lat: p.coords.latitude, lng: p.coords.longitude }); },
        () => { lb.textContent = t('myLoc'); openPick(); toast(t('locDenied')); }, { enableHighAccuracy: true, timeout: 10000 });
    };
    const mb = document.getElementById('fMapB'); if (mb) mb.onclick = () => openPick();
    if (mode === 'd' && sel.lat != null) openPick();
    document.getElementById('fGo').onclick = submit;
    document.getElementById('fSum').onclick = e => { if (e.target.closest('[data-promox]')) { promo = null; save(); renderCart(); requote(); } };
    drawSum(); requote();
  };
  const submit = async () => {
    const err = document.getElementById('fErr');
    keepWho();
    if (!ME) {
      if (!who.name) return (err.textContent = t('eName'));
      if (phoneDigits(who.phone).length !== 12) return (err.textContent = t('ePhone'));
    }
    if (mode === 'd') {
      sel.addr = document.getElementById('fAddr').value.trim();
      if (!sel.addr) return (err.textContent = t('needAddr'));
      if (Q && (Q.zone === 'far' || Q.zone === 'paused')) return (err.textContent = errText({ message: Q.zone }));
    } else sel.branch = +document.getElementById('fBranch').value;
    const b = { ...body(), note: document.getElementById('fNote').value.trim() };
    if (Q && Q.promoError) b.promo = null; // ishlamagan promokod yuborilmaydi — oddiy narxda
    if (mode === 'p') b.addr = UZ.BRANCHES[sel.branch][L];
    if (ME && mode === 'd' && document.getElementById('fSave')?.checked && !(ME.addresses || []).some(a => a.addr === sel.addr)) {
      await saveMe({ addresses: [{ label: (L === 'ru' ? 'Адрес' : 'Manzil') + ' ' + ((ME.addresses || []).length + 1), addr: sel.addr, lat: sel.lat, lng: sel.lng }, ...(ME.addresses || [])] });
    }
    const btn = document.getElementById('fGo'); btn.disabled = true; btn.textContent = '...';
    let ref;
    try { ref = LIVE ? await UZ.api('orders', { body: b }) : demoCreate({ ...b, total: (Q || localQuote(b)).total }); }
    catch (e) {
      btn.disabled = false; drawSum();
      if (e.status === 401) { ME = null; UZ.setToken(''); updateUserUi(); return draw(); }
      if (e.message === 'stopped') loadMenu();
      return (err.textContent = e.message === 'name' ? t('eName') : e.message === 'phone' ? t('ePhone') : errText(e));
    }
    // Keyingi buyurtma uchun shu qurilmada eslab qolamiz
    if (!ME) store.set('guest', { name: who.name, phone: who.phone, addr: mode === 'd' ? sel.addr : G.addr || '', lat: mode === 'd' ? sel.lat : G.lat ?? null, lng: mode === 'd' ? sel.lng : G.lng ?? null });
    cart = {}; promo = null; save(); renderMenu(); renderCart();
    store.set('active', { id: ref.id, token: ref.token });
    updateActive(); confetti(70); askNotify();
    openTrack(ref);
  };
  draw();
}

/* Brauzer xabarnomasi: sahifa ochiq turganda holat o'zgarsa */
function askNotify() { try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {} }
function notify(title, text) {
  try { if (document.visibilityState !== 'visible' && 'Notification' in window && Notification.permission === 'granted') new Notification(title, { body: text, icon: 'logo.svg' }); } catch (e) {}
}

/* ---------- Menyu holati: tugagan mahsulotlar va ish vaqti ---------- */
let MENU = { stop: [], open: true, hours: '09:00 — 03:00', maxKm: 15 };
async function loadMenu() {
  if (!LIVE) return;
  try { MENU = await UZ.api('menu'); } catch (e) { return; }
  window.STOP = new Set(MENU.stop || []);
  if (MENU.branches) {
    UZ.setBranches(MENU.branches);
    if (typeof BRANCHES !== 'undefined') BRANCHES.splice(0, BRANCHES.length, ...MENU.branches.filter(b => b.active !== false).map(b => ({ uz: [b.name.uz, b.addr.uz], ru: [b.name.ru || b.name.uz, b.addr.ru || b.addr.uz], h: b.hours })));
    const bc = document.getElementById('brCount'); if (bc) bc.textContent = BRANCHES.length;
    // Saytdagi manzil — birinchi ochiq filialdan (oshxona panelida o'zgartirilsa, shu yerda ham o'zgaradi)
    const fb = MENU.branches.find(b => b.active !== false);
    if (fb && fb.addr && fb.addr.uz) {
      const city = { uz: 'Namangan', ru: 'Наманган' };
      for (const lg of ['uz', 'ru']) { const a = (fb.addr[lg] || fb.addr.uz).trim(); const v = /namangan|наманган/i.test(a) ? a : `${city[lg]}, ${a}`; if (T[lg].fAddr !== v) { T[lg].fAddr = v; if (typeof renderText === 'function') renderText(); } }
    }
    if (typeof renderInfo === 'function') renderInfo();
  }
  // Oshxona panelidagi o'zgarishlar: menyu (narx, yangi/olib tashlangan taom), yetkazish narxi, ish vaqti
  let changed = false;
  if (MENU.menu && typeof applyMenu === 'function' && applyMenu(MENU.menu)) { store.set('menuX', MENU.menu); save(); changed = true; }
  if (MENU.freeFrom != null && MENU.freeFrom !== FREE_FROM) { FREE_FROM = MENU.freeFrom; changed = true; }
  if (MENU.zones && MENU.zones[0] && MENU.zones[0][1] !== DELIVERY) { DELIVERY = MENU.zones[0][1]; changed = true; }
  if (MENU.from != null) {
    const hh = x => String(x).padStart(2, '0') + ':00';
    for (const lg of ['uz', 'ru']) { const v = MENU.from === MENU.to ? T[lg].hrs247 : T[lg].hrsTpl.replace('{a}', hh(MENU.from)).replace('{b}', hh(MENU.to)); if (T[lg].hrs !== v) { T[lg].hrs = v; changed = true; } }
  }
  if (changed) renderAll(); else renderMenu();
  const hc = document.getElementById('hrsCount');
  if (hc && MENU.from != null) hc.textContent = (MENU.from === MENU.to ? 24 : (MENU.to - MENU.from + 24) % 24) + (L === 'ru' ? ' ч' : ' soat');
  const bar = document.getElementById('closedBar');
  if (bar) {
    bar.hidden = MENU.open !== false;
    const until = MENU.pauseUntil ? t('pausedUntil').replace('{t}', UZ.time(MENU.pauseUntil)) : '';
    bar.textContent = MENU.paused ? t('pausedBar').replace('{m}', MENU.pauseMsg ? ` (${MENU.pauseMsg})` : '').replace('{u}', until) : t('closedBar').replace('{h}', MENU.hours || '');
  }
}

/* ---------- Jonli kuzatuv ---------- */
function stopTrack() { if (ES) { ES.close(); ES = null; } if (TRK && TRK.timer) clearInterval(TRK.timer); TRK = null; store.set('trkOpen', false); }
const _closeAll = closeAll;
closeAll = function () { stopTrack(); _closeAll(); }; // eslint-disable-line no-global-assign

// "Buyurtma hozir qayerda" — qisqa yozuv
function hereNow(o) {
  const ru = L === 'ru';
  const w = { new: ru ? 'В филиале' : 'Filialda', accepted: ru ? 'В филиале' : 'Filialda', cooking: ru ? 'На кухне' : 'Oshxonada',
    ready: o.mode === 'p' ? (ru ? 'Ждёт вас' : 'Sizni kutmoqda') : (ru ? 'Ждёт курьера' : 'Kuryerni kutmoqda'), onway: ru ? 'У курьера' : 'Kuryerda',
    delivered: ru ? 'У вас' : 'Sizda', cancelled: ru ? 'Отменён' : 'Bekor' }[o.status] || '';
  return (ru ? 'Сейчас: ' : 'Hozir: ') + w;
}
async function openTrack(ref) {
  stopTrack(); store.set('trkOpen', true);
  openModal(`<div class="mbody trk" style="padding-top:26px">
    <div class="trk-h"><div><span class="hint">${t('ordNo')}</span><h3 id="tNo">#…</h3></div><span class="stc" id="tChip"></span></div>
    <div class="jr" id="tJr">
      <div class="jr-hero"><div class="jr-orb" id="tE"></div><div class="jr-txt"><b id="tTitle">${t('waiting')}</b><span id="tSub"></span><em id="tMsg"></em></div></div>
      <div class="jr-track" id="tSteps"></div>
    </div>
    <div id="tCancel" class="err" hidden></div>
    <div id="tAct"></div>
    <div id="tMapW" hidden><div class="trk-map" id="tMap"></div>
      <div class="trk-stats"><div><span>${t('dist')}</span><b id="tDist">—</b></div><div><span>${t('left')}</span><b id="tEta">—</b></div><div><span>${t('upd')}</span><b id="tUpd" style="font-size:12px;font-family:Manrope">—</b></div></div>
      <div id="tNear" class="near" hidden>${t('near')}</div></div>
    <div id="tCourier"></div>
    <details style="margin-top:10px"><summary class="lbl" style="cursor:pointer">${t('items')}</summary><div id="tItems" style="margin-top:8px"></div></details>
    ${LIVE ? '' : `<div class="demo-note">🧪 ${t('demo')}</div>`}
    <button class="btn wide" data-close style="margin-top:14px">${t('close')}</button></div>`);
  TRK = { ref, map: null, mk: {}, line: null, last: null, nearShown: false };
  const me = TRK;
  if (LIVE) {
    ES = new EventSource(`api/orders/${ref.id}/stream?t=${encodeURIComponent(ref.token || '')}`);
    ES.onmessage = e => { if (TRK === me) renderTrack(JSON.parse(e.data)); };
    ES.onerror = () => { if (TRK === me) document.getElementById('tUpd') && (document.getElementById('tUpd').textContent = '…'); };
  } else {
    const o = demoGet(ref.id);
    if (!o) return;
    renderTrack(demoTick(o));
    me.timer = setInterval(() => { if (TRK === me) renderTrack(demoTick(demoGet(ref.id))); }, 1000);
  }
  me.ago = setInterval(() => { if (TRK !== me) return clearInterval(me.ago); const u = document.getElementById('tUpd'); if (u && me.last?.loc) u.textContent = UZ.ago(me.last.loc.at, L); }, 1000);
}

async function renderTrack(o) {
  const me = TRK;
  if (!me || !document.getElementById('tNo')) return;
  const prev = me.last; me.last = o;
  const flow = UZ.FLOW[o.mode], idx = flow.indexOf(o.status);
  const k = UZ.statusKey(o.status, o.mode), S = UZ.STATUS[k];
  document.getElementById('tNo').textContent = '#' + o.no;
  const chip = document.getElementById('tChip'); chip.className = 'stc ' + o.status; chip.textContent = hereNow(o);
  const orb = document.getElementById('tE');
  if (orb.dataset.s !== k) { orb.dataset.s = k; orb.innerHTML = typeof ICO === 'function' ? ICO(S.ic) : S.e; orb.classList.remove('pop'); void orb.offsetWidth; orb.classList.add('pop'); }
  document.getElementById('tJr').classList.toggle('x', o.status === 'cancelled');
  document.getElementById('tJr').classList.toggle('ok', o.status === 'delivered');
  const mins = Math.max(0, Math.round((((o.history && (o.history.delivered || o.history.cancelled)) || Date.now()) - o.createdAt) / 60000));
  document.getElementById('tMsg').textContent = (t('jm_' + k) || '') + (o.status === 'delivered' || o.status === 'cancelled' ? '' : ` · ${t('jmAgo').replace('{m}', mins)}`);
  document.getElementById('tTitle').textContent = o.status === 'new' ? t('waiting') : S[L];
  document.getElementById('tSub').textContent = o.status === 'onway' && o.courier ? `${o.courier.name}` : o.mode === 'p' ? UZ.BRANCHES[o.branch || 0][L] : '';
  const cEl = document.getElementById('tCancel');
  cEl.hidden = o.status !== 'cancelled';
  if (o.status === 'cancelled') cEl.textContent = (o.cancelledBy === 'customer' ? t('youCancelled') : t('cancelled')) + (o.cancelReason ? ' ' + t('reason') + ': ' + o.cancelReason : '');
  // Mijoz amallari: oshxona qabul qilguncha bekor qilish; yetkazilgandan keyin baho
  const act = document.getElementById('tAct');
  if (o.status === 'new') {
    if (!act.querySelector('[data-cx]')) act.innerHTML = `<button class="btn ghost wide" data-cx style="margin-bottom:10px">${t('cancelBtn')}</button>`;
    act.querySelector('[data-cx]').onclick = async ev => {
      const b = ev.currentTarget;
      if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = t('cancelSure'); return; }
      b.disabled = true;
      try {
        if (LIVE) renderTrack(await UZ.api(`orders/${o.id}/cancel?t=${encodeURIComponent(me.ref.token || '')}`, { body: {} }));
        else { const d = demoGet(o.id); d.status = 'cancelled'; d.cancelledBy = 'customer'; d.history.cancelled = Date.now(); d.cancelledAt = 1; store.set('demo_orders', store.get('demo_orders', []).map(x => (x.id === d.id ? d : x))); renderTrack(d); }
      } catch (e) { b.disabled = false; toast(e.message === 'late' ? t('eLate') : t('eNet')); }
    };
  } else if (o.status === 'delivered') {
    if (o.rating) act.innerHTML = `<div class="rate done">${'★'.repeat(o.rating.stars)}${'☆'.repeat(5 - o.rating.stars)} <span>${t('thanksRate')}</span></div>`;
    else if (!act.querySelector('.rate')) {
      act.innerHTML = `<div class="rate"><b>${t('rateQ')}</b><div class="stars">${[1, 2, 3, 4, 5].map(n => `<button data-star="${n}" aria-label="${n}">★</button>`).join('')}</div><textarea id="rComment" placeholder="${t('rateComment')}"></textarea><button class="btn wide" id="rSend" disabled>${t('send')}</button></div>`;
      let stars = 0;
      act.querySelectorAll('[data-star]').forEach(b => (b.onclick = () => { stars = +b.dataset.star; act.querySelectorAll('[data-star]').forEach(x => x.classList.toggle('on', +x.dataset.star <= stars)); document.getElementById('rSend').disabled = false; }));
      document.getElementById('rSend').onclick = async () => {
        const body = { stars, comment: document.getElementById('rComment').value };
        try { if (LIVE) renderTrack(await UZ.api(`orders/${o.id}/rate?t=${encodeURIComponent(me.ref.token || '')}`, { body })); else { act.innerHTML = ''; renderTrack({ ...o, rating: body }); } toast(t('thanksRate')); }
        catch (e) { toast(t('eNet')); }
      };
    }
  } else act.innerHTML = '';
  // Bosqichlar yo'li: faqat oshxona/kuryer belgilaganlari yonadi
  const n = flow.length, reached = o.status === 'cancelled' ? Math.max(0, ...flow.map((st, i) => (o.history && o.history[st] ? i : 0))) : idx;
  const track = document.getElementById('tSteps');
  track.style.setProperty('--n', n);
  const pct = n > 1 ? (reached / (n - 1)) * 100 : 0;
  if (!track.querySelector('.jr-line')) track.innerHTML = `<div class="jr-line"><i></i></div>` + flow.map(() => '<div class="jr-s"></div>').join('');
  track.querySelector('.jr-line i').style.width = pct + '%';
  track.querySelectorAll('.jr-s').forEach((el, i) => {
    const st = flow[i], kk = UZ.statusKey(st, o.mode), done = i <= reached && (o.status !== 'cancelled' || (o.history && o.history[st]));
    const tm = o.history && o.history[st] ? UZ.time(o.history[st]) : '';
    el.className = 'jr-s' + (done ? ' done' : '') + (i === reached && o.status !== 'delivered' && o.status !== 'cancelled' ? ' cur' : '');
    el.innerHTML = `<span class="jr-d">${typeof ICO === 'function' ? ICO(UZ.STATUS[kk].ic) : UZ.STATUS[kk].e}</span><b>${(UZ.STATUS[kk].sh || UZ.STATUS[kk].s)[L]}</b><small>${tm || '&nbsp;'}</small>`;
  });
  document.getElementById('tItems').innerHTML = (o.items || []).map(i => `<div class="line"><span>${esc(i.n)} × ${i.q}</span><span>${UZ.money(i.price * i.q)}</span></div>`).join('') + `<div class="line tot"><span>${t('total')}</span><span>${fmt(o.total)}</span></div>`;
  document.getElementById('tCourier').innerHTML = o.courier && (o.status === 'onway' || o.status === 'delivered')
    ? `<div class="me-card" style="margin-top:12px"><div class="me-av">🛵</div><div><span class="hint">${t('courierCard')}</span><b style="display:block">${esc(o.courier.name)}</b>${o.courier.phone ? `<span style="user-select:all;color:var(--or2);font-weight:800">${esc(o.courier.phone)}</span>` : ''}</div></div>` : '';
  if (o.status === 'delivered' && prev && prev.status !== 'delivered') { confetti(90); toast(S[L]); }
  if (prev && prev.status !== o.status && o.status !== 'new') { try { navigator.vibrate && navigator.vibrate(120); } catch (e) {} notify(`Uzbegim #${o.no}`, S[L]); }
  updateActive(o);

  // Xarita: yetkazib berishda, kuryer yo'lga chiqqanda
  const showMap = o.mode === 'd' && (o.status === 'onway' || (o.status === 'delivered' && o.loc));
  document.getElementById('tMapW').hidden = !showMap;
  if (!showMap) return;
  const dest = o.dest, loc = o.loc, shop = UZ.BRANCHES[o.branch || 0];
  // Masofa va vaqt: xarita yuklanmasa ham ko'rinadi
  if (loc && dest) {
    const m = UZ.dist(loc, dest);
    document.getElementById('tDist').textContent = UZ.fmtDist(m, L);
    document.getElementById('tEta').textContent = o.status === 'delivered' ? '0' : '~' + UZ.etaMin(m, loc.speed) + ' ' + t('mins');
    document.getElementById('tSub').textContent = o.status === 'onway' ? `${o.courier ? o.courier.name + ' • ' : ''}${UZ.fmtDist(m, L)} ${t('toYou')}` : (o.courier ? o.courier.name : '');
    const near = o.status === 'onway' && m < 350;
    document.getElementById('tNear').hidden = !near;
    if (near && !me.nearShown) { me.nearShown = true; toast(t('near')); notify(`Uzbegim #${o.no}`, t('near')); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {} }
  }
  if (loc) document.getElementById('tUpd').textContent = UZ.ago(loc.at, L);
  else document.getElementById('tUpd').textContent = t('gpsWait');
  try {
    const Lf = await UZ.leaflet();
    if (TRK !== me) return;
    if (!me.map) {
      me.map = await UZ.makeMap(document.getElementById('tMap'), loc || dest || shop, 14);
      me.mk.shop = Lf.marker([shop.lat, shop.lng], { icon: UZ.pin(Lf, '🏪', 'shop') }).addTo(me.map);
      if (dest) me.mk.home = Lf.marker([dest.lat, dest.lng], { icon: UZ.pin(Lf, '🏠', 'home') }).addTo(me.map);
    }
    if (loc) {
      if (!me.mk.c) me.mk.c = Lf.marker([loc.lat, loc.lng], { icon: UZ.pin(Lf, '🛵', 'pulse'), zIndexOffset: 1000 }).addTo(me.map);
      else me.mk.c.setLatLng([loc.lat, loc.lng]);
      if (dest) {
        if (!me.line) me.line = Lf.polyline([[loc.lat, loc.lng], [dest.lat, dest.lng]], { color: '#ffa62b', weight: 4, dashArray: '8 10', opacity: .9 }).addTo(me.map);
        else me.line.setLatLngs([[loc.lat, loc.lng], [dest.lat, dest.lng]]);
        if (!me.fitted) { me.map.fitBounds(Lf.latLngBounds([[loc.lat, loc.lng], [dest.lat, dest.lng]]).pad(0.35)); me.fitted = true; }
        else if (!me.map.getBounds().pad(-0.1).contains([loc.lat, loc.lng])) me.map.panTo([loc.lat, loc.lng]);
      } else me.map.panTo([loc.lat, loc.lng]);
    }
  } catch (e) { if (!me.map) document.getElementById('tMap').innerHTML = `<div class="hint" style="padding:20px">${t('eNet')}</div>`; }
}

/* Faol buyurtma tugmasi (sarlavhada) */
function updateActive(o) {
  const b = document.getElementById('activeBtn');
  if (!b) return;
  const a = store.get('active', null);
  if (o && a && o.id === a.id && (o.status === 'delivered' || o.status === 'cancelled')) { store.set('active', null); b.hidden = true; return; }
  b.hidden = !a;
  if (a) { const S = o && o.id === a.id ? UZ.STATUS[UZ.statusKey(o.status, o.mode)] : UZ.STATUS.new; b.innerHTML = `${typeof ICO === 'function' ? ICO(S.ic) : ''}<span>${t('myOrder')}${o && o.id === a.id ? ' #' + o.no : ''}</span>`; }
}

/* ---------- Demo rejim (server yo'q bo'lsa) ---------- */
function demoCreate(b) {
  const list = store.get('demo_orders', []);
  const dest = b.lat != null ? { lat: b.lat, lng: b.lng } : { lat: UZ.CENTER.lat + 0.012, lng: UZ.CENTER.lng + 0.018 };
  const o = { id: 'd' + Date.now().toString(36), token: '', no: 1000 + list.length + 1, mode: b.mode, status: 'new', history: { new: Date.now() }, items: b.items, total: b.total, branch: b.branch, dest: b.mode === 'd' ? dest : null, courier: null, loc: null, createdAt: Date.now(), phone: ME ? ME.phone : b.phone };
  list.unshift(o); store.set('demo_orders', list.slice(0, 20));
  return o;
}
const demoGet = id => store.get('demo_orders', []).find(o => o.id === id);
function demoTick(o) {
  // Oshxona va kuryer harakatini taqlid qiladi
  const s = (Date.now() - o.createdAt) / 1000;
  const plan = o.mode === 'd' ? [['accepted', 4], ['cooking', 8], ['ready', 14], ['onway', 18], ['delivered', 58]] : [['accepted', 4], ['cooking', 8], ['ready', 16], ['delivered', 30]];
  for (const [st, at] of plan) if (s >= at && !o.history[st]) { o.history[st] = o.createdAt + at * 1000; o.status = st; }
  if (o.mode === 'd' && o.history.onway) {
    o.courier = { name: 'Sardor', phone: '+998 90 123 45 67' };
    const shop = UZ.BRANCHES[o.branch || 0], d = o.dest;
    const k = Math.min(1, (s - 18) / 40);
    const ease = k < 1 ? k : 1;
    const wob = Math.sin(ease * Math.PI) * 0.004;
    o.loc = { lat: shop.lat + (d.lat - shop.lat) * ease + wob, lng: shop.lng + (d.lng - shop.lng) * ease - wob, at: Date.now(), speed: 7 };
  }
  const list = store.get('demo_orders', []).map(x => (x.id === o.id ? o : x));
  store.set('demo_orders', list);
  return o;
}

/* ---------- Ishga tushirish ---------- */
(async () => {
  LIVE = await UZ.isLive;
  await loadMe();
  await loadMenu();
  setInterval(loadMenu, 60000);
  const a = store.get('active', null);
  if (a) {
    updateActive();
    if (LIVE) { try { const o = await UZ.api(`orders/${a.id}?t=${encodeURIComponent(a.token || '')}`); updateActive(o); if (store.get('trkOpen', false) && o.status !== 'delivered' && o.status !== 'cancelled') openTrack(a); } catch (e) { if (e.status === 404 || e.status === 403) { store.set('active', null); updateActive(); } } }
  }
  document.getElementById('userBtn').onclick = openProfile;
  document.getElementById('tProfile').onclick = openProfile;
  document.getElementById('activeBtn').onclick = () => { const x = store.get('active', null); if (x) openTrack(x); };
  const _renderAll = renderAll;
  renderAll = function () { _renderAll(); updateUserUi(); updateActive(TRK && TRK.last); }; // eslint-disable-line no-global-assign
})();
document.head.insertAdjacentHTML('beforeend','<style>.lbl{font-weight:800;font-size:12px;color:var(--mut);text-transform:uppercase;letter-spacing:.08em}#activeBtn{display:inline-flex;align-items:center;gap:8px}#activeBtn .gi{width:20px;height:20px;stroke:currentColor}@media (max-width:640px){#activeBtn{display:inline-flex;position:fixed;left:50%;transform:translateX(-50%);bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:61;height:44px;padding:0 18px;font-size:13px;background:var(--grad);color:#120d09;border:0;box-shadow:0 10px 26px rgba(255,106,0,.45);animation:none}#activeBtn[hidden]{display:none}}</style>');
