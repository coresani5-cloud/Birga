/* Birga — tarjimalar (o'zbek, rus, ingliz) */
'use strict';
const I18N = {
  uz: {
    install_app: 'Telefonga yuklab olish', install_title: 'Birga’ni telefonga o‘rnatish', installed_ok: 'Birga o‘rnatildi',
    ios_steps: ['Safari’da pastdagi <b>Ulashish</b> tugmasini bosing', '<b>“Bosh ekranga qo‘shish”</b> ni tanlang', 'O‘ng yuqoridagi <b>Qo‘shish</b> ni bosing'],
    and_steps: ['Brauzer menyusini oching (<b>⋮</b>)', '<b>“Ilovani o‘rnatish”</b> yoki <b>“Bosh ekranga qo‘shish”</b> ni tanlang', '<b>O‘rnatish</b> ni bosing'],
    ios_safari_only: 'iPhone’da o‘rnatish uchun bu sahifani Safari’da oching.', got_it: 'Tushunarli',
    phone_intro: 'Telefon raqamingizni kiriting. Sizga SMS orqali tasdiqlash kodi yuboriladi.',
    continue: 'Davom etish', terms: 'Davom etish orqali foydalanish shartlariga rozilik bildirasiz.',
    country: 'Davlat', search_country: 'Davlatni qidiring', code_sent: '5 xonali kodni SMS orqali yubordik',
    resend_in: 'Qayta yuborish {t}', resend: 'Kodni qayta yuborish', change_number: 'Raqamni o‘zgartirish',
    dev_code: 'Test rejimi (SMS xizmati ulanmagan). Kod:', code_resent: 'Kod qayta yuborildi',
    enter_full_phone: 'Raqamni to‘liq va to‘g‘ri kiriting', your_profile: 'Profilingiz', profile_hint: 'Ismingizni kiriting va rasm qo‘shing',
    name: 'Ism', username_opt: 'username (ixtiyoriy)', start: 'Boshlash',
    search: 'Qidirish', connecting: 'Ulanmoqda…', no_chats: 'Hali suhbatlar yo‘q', no_chats_hint: 'Yangi suhbat boshlash uchun pastdagi tugmani bosing',
    my_profile: 'Mening profilim', saved: 'Saqlangan xabarlar', night: 'Tungi rejim', language: 'Til', logout: 'Chiqish',
    choose_chat: 'Suhbatni tanlang', write_msg: 'Xabar yozing…', slide_cancel: '‹ Bekor qilish uchun suring', cancel: 'Bekor qilish',
    theme_auto: 'Avto', theme_light: 'Yorug‘', theme_dark: 'Qorong‘i',
    online: 'onlayn', seen_recently: 'yaqinda faol edi', seen_now: 'hozirgina faol edi', seen_min: '{n} daqiqa oldin faol edi',
    seen_today: 'bugun {t} da faol edi', seen_date: '{d} {t} da faol edi', today: 'Bugun', yesterday: 'Kecha',
    typing: 'yozmoqda…', rec_voice: 'ovozli xabar yozmoqda…', rec_round: 'video xabar yozmoqda…', sending_file: 'fayl yubormoqda…',
    you: 'Siz', t_photo: 'Rasm', t_video: 'Video', t_voice: 'Ovozli xabar', t_round: 'Video xabar', t_file: 'Fayl', t_call: 'Qo‘ng‘iroq', t_vcall: 'Video qo‘ng‘iroq',
    deleted: 'Xabar o‘chirildi', new_chat: 'Yangi suhbat', search_people: 'Telefon raqam, @username yoki ism', results: 'Natijalar',
    saved_hint: 'O‘zingizga eslatmalar', not_found_user: 'Hech kim topilmadi. Raqamni xalqaro formatda kiriting, masalan +998 90 123 45 67',
    profile: 'Profil', change_photo: 'Rasmni o‘zgartirish uchun bosing', about: 'O‘zingiz haqingizda', phone: 'Telefon', save: 'Saqlash', saved_ok: 'Saqlandi',
    info: 'Ma’lumot', bio: 'Bio', call: 'Qo‘ng‘iroq', video: 'Video',
    reply: 'Javob berish', copy: 'Nusxa olish', download: 'Yuklab olish', delete: 'O‘chirish', copied: 'Nusxa olindi',
    confirm_delete: 'Xabar hamma uchun o‘chirilsinmi?', confirm_logout: 'Hisobdan chiqasizmi?',
    send_files: '{n} ta fayl yuborish', add_caption: 'Izoh qo‘shish…', send: 'Yuborish', not_sent: 'Xabar yuborilmadi',
    upload_fail: 'Yuklab bo‘lmadi', net_err: 'Tarmoq xatosi', hold_voice: 'Ovozli xabar uchun bosib turing', hold_round: 'Video xabar uchun bosib turing',
    need_https: 'Mikrofon va kamera faqat xavfsiz (HTTPS) ulanishda ishlaydi', allow_mic: 'Mikrofonga ruxsat bering', allow_cam: 'Kamera va mikrofonga ruxsat bering',
    cam_switch_fail: 'Kamerani almashtirib bo‘lmadi', play_fail: 'Ijro etib bo‘lmadi',
    calling: 'Qo‘ng‘iroq qilinmoqda…', ringing: 'Jiringlamoqda…', reaching: 'Chaqirilmoqda…', busy: 'Band', rejected: 'Rad etildi', no_answer: 'Javob berilmadi',
    incoming_call: 'Kiruvchi qo‘ng‘iroq…', incoming_vcall: 'Kiruvchi video qo‘ng‘iroq…', connecting_call: 'Ulanmoqda…', reconnecting: 'Qayta ulanmoqda…',
    conn_lost: 'Ulanish uzildi', ended: 'Tugadi', mic: 'Mikrofon', camera: 'Kamera', flip: 'Almashtirish', end: 'Tugatish', decline: 'Rad etish', answer: 'Javob berish',
    out_call: 'Chiquvchi qo‘ng‘iroq', in_call: 'Kiruvchi qo‘ng‘iroq', out_vcall: 'Chiquvchi video qo‘ng‘iroq', in_vcall: 'Kiruvchi video qo‘ng‘iroq', missed: 'O‘tkazib yuborilgan',
    notif_banner: 'Ilova yopiq bo‘lsa ham xabar va qo‘ng‘iroqlardan xabardor bo‘ling', enable: 'Yoqish', notif_on: 'Bildirishnomalar yoqildi',
    session_end: 'Sessiya tugadi, qaytadan kiring', err: 'Xatolik', processing: 'Tayyorlanmoqda…',
    months: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
    days: ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'],
    fmt_day: (d, m, y) => `${d}-${m}${y ? ' ' + y : ''}`,
  },
  ru: {
    install_app: 'Установить на телефон', install_title: 'Установка Birga на телефон', installed_ok: 'Birga установлен',
    ios_steps: ['Нажмите кнопку <b>Поделиться</b> внизу Safari', 'Выберите <b>«На экран „Домой“»</b>', 'Нажмите <b>Добавить</b> в правом верхнем углу'],
    and_steps: ['Откройте меню браузера (<b>⋮</b>)', 'Выберите <b>«Установить приложение»</b> или <b>«Добавить на главный экран»</b>', 'Нажмите <b>Установить</b>'],
    ios_safari_only: 'Чтобы установить на iPhone, откройте эту страницу в Safari.', got_it: 'Понятно',
    phone_intro: 'Введите номер телефона. Мы отправим SMS с кодом подтверждения.',
    continue: 'Продолжить', terms: 'Продолжая, вы принимаете условия использования.',
    country: 'Страна', search_country: 'Поиск страны', code_sent: 'Мы отправили SMS с 5-значным кодом',
    resend_in: 'Повторить через {t}', resend: 'Отправить код ещё раз', change_number: 'Изменить номер',
    dev_code: 'Тестовый режим (SMS не подключены). Код:', code_resent: 'Код отправлен повторно',
    enter_full_phone: 'Введите номер полностью и правильно', your_profile: 'Ваш профиль', profile_hint: 'Укажите имя и добавьте фото',
    name: 'Имя', username_opt: 'username (необязательно)', start: 'Начать',
    search: 'Поиск', connecting: 'Подключение…', no_chats: 'Пока нет чатов', no_chats_hint: 'Нажмите кнопку внизу, чтобы начать чат',
    my_profile: 'Мой профиль', saved: 'Избранное', night: 'Ночной режим', language: 'Язык', logout: 'Выйти',
    choose_chat: 'Выберите чат', write_msg: 'Сообщение…', slide_cancel: '‹ Влево — отмена', cancel: 'Отмена',
    theme_auto: 'Авто', theme_light: 'Светлая', theme_dark: 'Тёмная',
    online: 'в сети', seen_recently: 'был(а) недавно', seen_now: 'был(а) только что', seen_min: 'был(а) {n} мин. назад',
    seen_today: 'был(а) сегодня в {t}', seen_date: 'был(а) {d} в {t}', today: 'Сегодня', yesterday: 'Вчера',
    typing: 'печатает…', rec_voice: 'записывает голосовое…', rec_round: 'записывает видео…', sending_file: 'отправляет файл…',
    you: 'Вы', t_photo: 'Фото', t_video: 'Видео', t_voice: 'Голосовое сообщение', t_round: 'Видеосообщение', t_file: 'Файл', t_call: 'Звонок', t_vcall: 'Видеозвонок',
    deleted: 'Сообщение удалено', new_chat: 'Новый чат', search_people: 'Номер, @username или имя', results: 'Результаты',
    saved_hint: 'Заметки для себя', not_found_user: 'Никого не найдено. Введите номер в международном формате, например +7 916 123 45 67',
    profile: 'Профиль', change_photo: 'Нажмите, чтобы сменить фото', about: 'О себе', phone: 'Телефон', save: 'Сохранить', saved_ok: 'Сохранено',
    info: 'Информация', bio: 'О себе', call: 'Позвонить', video: 'Видео',
    reply: 'Ответить', copy: 'Копировать', download: 'Скачать', delete: 'Удалить', copied: 'Скопировано',
    confirm_delete: 'Удалить сообщение у всех?', confirm_logout: 'Выйти из аккаунта?',
    send_files: 'Отправить файлов: {n}', add_caption: 'Добавить подпись…', send: 'Отправить', not_sent: 'Сообщение не отправлено',
    upload_fail: 'Не удалось загрузить', net_err: 'Ошибка сети', hold_voice: 'Удерживайте для записи голосового', hold_round: 'Удерживайте для записи видеосообщения',
    need_https: 'Микрофон и камера работают только по защищённому (HTTPS) соединению', allow_mic: 'Разрешите доступ к микрофону', allow_cam: 'Разрешите доступ к камере и микрофону',
    cam_switch_fail: 'Не удалось сменить камеру', play_fail: 'Не удалось воспроизвести',
    calling: 'Вызов…', ringing: 'Звонит…', reaching: 'Вызываем…', busy: 'Занято', rejected: 'Отклонён', no_answer: 'Нет ответа',
    incoming_call: 'Входящий звонок…', incoming_vcall: 'Входящий видеозвонок…', connecting_call: 'Соединение…', reconnecting: 'Переподключение…',
    conn_lost: 'Соединение потеряно', ended: 'Завершён', mic: 'Микрофон', camera: 'Камера', flip: 'Сменить', end: 'Завершить', decline: 'Отклонить', answer: 'Ответить',
    out_call: 'Исходящий звонок', in_call: 'Входящий звонок', out_vcall: 'Исходящий видеозвонок', in_vcall: 'Входящий видеозвонок', missed: 'Пропущенный',
    notif_banner: 'Получайте уведомления о сообщениях и звонках, даже когда приложение закрыто', enable: 'Включить', notif_on: 'Уведомления включены',
    session_end: 'Сессия завершена, войдите снова', err: 'Ошибка', processing: 'Обработка…',
    months: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
    days: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    fmt_day: (d, m, y) => `${d} ${m}${y ? ' ' + y : ''}`,
  },
  en: {
    install_app: 'Install on phone', install_title: 'Install Birga on your phone', installed_ok: 'Birga installed',
    ios_steps: ['Tap the <b>Share</b> button at the bottom of Safari', 'Choose <b>“Add to Home Screen”</b>', 'Tap <b>Add</b> in the top right'],
    and_steps: ['Open the browser menu (<b>⋮</b>)', 'Choose <b>“Install app”</b> or <b>“Add to Home screen”</b>', 'Tap <b>Install</b>'],
    ios_safari_only: 'To install on iPhone, open this page in Safari.', got_it: 'Got it',
    phone_intro: 'Enter your phone number. We’ll text you a verification code.',
    continue: 'Continue', terms: 'By continuing you accept the terms of use.',
    country: 'Country', search_country: 'Search country', code_sent: 'We sent a 5-digit code by SMS',
    resend_in: 'Resend in {t}', resend: 'Resend code', change_number: 'Change number',
    dev_code: 'Test mode (SMS not connected). Code:', code_resent: 'Code sent again',
    enter_full_phone: 'Enter a complete, valid number', your_profile: 'Your profile', profile_hint: 'Enter your name and add a photo',
    name: 'Name', username_opt: 'username (optional)', start: 'Start',
    search: 'Search', connecting: 'Connecting…', no_chats: 'No chats yet', no_chats_hint: 'Tap the button below to start a chat',
    my_profile: 'My profile', saved: 'Saved messages', night: 'Night mode', language: 'Language', logout: 'Log out',
    choose_chat: 'Select a chat', write_msg: 'Message…', slide_cancel: '‹ Slide to cancel', cancel: 'Cancel',
    theme_auto: 'Auto', theme_light: 'Light', theme_dark: 'Dark',
    online: 'online', seen_recently: 'last seen recently', seen_now: 'last seen just now', seen_min: 'last seen {n} min ago',
    seen_today: 'last seen today at {t}', seen_date: 'last seen {d} at {t}', today: 'Today', yesterday: 'Yesterday',
    typing: 'typing…', rec_voice: 'recording voice…', rec_round: 'recording video…', sending_file: 'sending a file…',
    you: 'You', t_photo: 'Photo', t_video: 'Video', t_voice: 'Voice message', t_round: 'Video message', t_file: 'File', t_call: 'Call', t_vcall: 'Video call',
    deleted: 'Message deleted', new_chat: 'New chat', search_people: 'Phone, @username or name', results: 'Results',
    saved_hint: 'Notes to yourself', not_found_user: 'No one found. Enter the number in international format, e.g. +1 415 555 2671',
    profile: 'Profile', change_photo: 'Tap to change photo', about: 'About you', phone: 'Phone', save: 'Save', saved_ok: 'Saved',
    info: 'Info', bio: 'Bio', call: 'Call', video: 'Video',
    reply: 'Reply', copy: 'Copy', download: 'Download', delete: 'Delete', copied: 'Copied',
    confirm_delete: 'Delete this message for everyone?', confirm_logout: 'Log out of your account?',
    send_files: 'Send {n} file(s)', add_caption: 'Add a caption…', send: 'Send', not_sent: 'Message not sent',
    upload_fail: 'Upload failed', net_err: 'Network error', hold_voice: 'Hold to record a voice message', hold_round: 'Hold to record a video message',
    need_https: 'Microphone and camera work only over a secure (HTTPS) connection', allow_mic: 'Allow microphone access', allow_cam: 'Allow camera and microphone access',
    cam_switch_fail: 'Could not switch camera', play_fail: 'Could not play',
    calling: 'Calling…', ringing: 'Ringing…', reaching: 'Calling…', busy: 'Busy', rejected: 'Declined', no_answer: 'No answer',
    incoming_call: 'Incoming call…', incoming_vcall: 'Incoming video call…', connecting_call: 'Connecting…', reconnecting: 'Reconnecting…',
    conn_lost: 'Connection lost', ended: 'Ended', mic: 'Mic', camera: 'Camera', flip: 'Flip', end: 'End', decline: 'Decline', answer: 'Answer',
    out_call: 'Outgoing call', in_call: 'Incoming call', out_vcall: 'Outgoing video call', in_vcall: 'Incoming video call', missed: 'Missed',
    notif_banner: 'Get notified about messages and calls even when the app is closed', enable: 'Enable', notif_on: 'Notifications enabled',
    session_end: 'Session ended, please sign in again', err: 'Error', processing: 'Processing…',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    fmt_day: (d, m, y) => `${m} ${d}${y ? ', ' + y : ''}`,
  },
};
const LANG_NAMES = { uz: 'O‘zbekcha', ru: 'Русский', en: 'English' };

function detectLang() {
  try { const s = localStorage.getItem('birga_lang'); if (I18N[s]) return s; } catch {}
  for (const l of navigator.languages || [navigator.language || 'en']) {
    const c = String(l).slice(0, 2).toLowerCase();
    if (I18N[c]) return c;
    if (['kk', 'ky', 'tg', 'be', 'uk', 'az', 'hy', 'ka'].includes(c)) return 'ru';
  }
  return 'en';
}
let LANG = detectLang();
function t(key, vars) {
  let s = (I18N[LANG] && I18N[LANG][key]) ?? I18N.en[key] ?? key;
  if (vars && typeof s === 'string') for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
  return s;
}
function applyI18n(root = document) {
  document.documentElement.lang = LANG;
  root.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root.querySelectorAll('[data-i18n-ph]').forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  root.querySelectorAll('[data-i18n-title]').forEach((el) => (el.title = t(el.dataset.i18nTitle)));
}
function setLang(l) {
  if (!I18N[l]) return;
  LANG = l;
  try { localStorage.setItem('birga_lang', l); } catch {}
  applyI18n();
}
