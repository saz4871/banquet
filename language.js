(function () {
  'use strict';

  const STORAGE_KEY = 'eventVaultLanguage';
  const POPUP_SEEN_KEY = 'eventVaultLanguagePopupSeen';
  const LANG = { EN: 'en', UR: 'ur' };

  // Only UI copy is translated. User/vendor venue names, locations, URLs and database values remain untouched.
  const T = {
    'Event Vault': 'ایونٹ والٹ',
    'Curated Event Spaces': 'منتخب ایونٹ اسپیسز',
    'PRIVATE EVENT COLLECTION': 'خصوصی ایونٹ کلیکشن',
    'The Grand Event Vault': 'دی گرینڈ ایونٹ والٹ',
    'A refined collection of distinctive spaces for celebrations, ceremonies and unforgettable nights.': 'تقریبات، رسومات اور یادگار راتوں کے لیے منفرد اور منتخب مقامات کا شاندار مجموعہ۔',
    'Explore the collection': 'کلیکشن دیکھیں',
    'Curated & verified spaces': 'منتخب اور تصدیق شدہ مقامات',
    'EVENT VAULT': 'ایونٹ والٹ',
    'SPACE': 'اسپیس',
    'CURATION': 'انتخاب',
    'Banquets': 'بینکوئٹس',
    'Celebration spaces': 'تقریبات کے مقامات',
    'Halls': 'ہالز',
    'Elegant interiors': 'خوبصورت اندرونی ماحول',
    'LIVE COLLECTION': 'لائیو کلیکشن',
    'DISCOVER YOUR SPACE': 'اپنی اسپیس دریافت کریں',
    'Available': 'دستیاب',
    'Luxury Spaces': 'لگژری اسپیسز',
    'Luxury Halls': 'لگژری ہالز',
    'Browse hand-picked venues and open a space to view its full portfolio and availability.': 'منتخب وینیوز دیکھیں اور کسی اسپیس کو کھول کر اس کا مکمل پورٹ فولیو اور دستیابی ملاحظہ کریں۔',
    'spaces currently available': 'اس وقت دستیاب اسپیسز',
    'Search by venue, location or detail...': 'وینیو، مقام یا تفصیل سے تلاش کریں...',
    'No spaces found': 'کوئی اسپیس نہیں ملی',
    'Try a different venue name, location or keyword.': 'کوئی دوسرا وینیو نام، مقام یا کی ورڈ آزمائیں۔',
    'Curating your collection': 'آپ کی کلیکشن تیار کی جا رہی ہے',
    'PRIVATE VENUE': 'خصوصی وینیو',
    'BANQUET': 'بینکوئٹ',
    'HALL': 'ہال',
    'FROM': 'شروع',
    'CAPACITY': 'گنجائش',
    'people': 'افراد',
    'View portfolio': 'پورٹ فولیو دیکھیں',
    'Location available on details': 'مقام تفصیلات میں دستیاب ہے',

    'Vendor Panel': 'وینڈر پینل',
    'Please wait': 'براہِ کرم انتظار کریں',
    'Preparing your workspace and syncing the latest data…': 'آپ کی ورک اسپیس تیار اور تازہ ترین ڈیٹا سنک کیا جا رہا ہے…',
    'Preparing your workspace and syncing the latest data...': 'آپ کی ورک اسپیس تیار اور تازہ ترین ڈیٹا سنک کیا جا رہا ہے...',
    'Vendor Portal': 'وینڈر پورٹل',
    'Secure access to your venue management workspace.': 'آپ کی وینیو مینجمنٹ ورک اسپیس تک محفوظ رسائی۔',
    'Vendor Username:': 'وینڈر یوزرنیم:',
    'Vendor Password:': 'وینڈر پاس ورڈ:',
    'Enter username': 'یوزرنیم درج کریں',
    'Enter password': 'پاس ورڈ درج کریں',
    'Verify': 'تصدیق کریں',
    'Vendor': 'وینڈر',
    'Vendor Management': 'وینڈر مینجمنٹ',
    'Vendor Spreadsheet': 'وینڈر اسپریڈشیٹ',
    'Rate': 'ریٹ',
    'Change password': 'پاس ورڈ تبدیل کریں',
    'Log out': 'لاگ آؤٹ',
    'Select an option from the left panel.': 'بائیں پینل سے ایک آپشن منتخب کریں۔',
    'Ready': 'تیار',
    'Live': 'لائیو',
    'Loading...': 'لوڈ ہو رہا ہے...',
    'Loading': 'لوڈ ہو رہا ہے',
    'Welcome': 'خوش آمدید',
    'No Image': 'کوئی تصویر نہیں',
    'YOUR ASSIGNED VENUE': 'آپ کو تفویض کردہ وینیو',
    'Location not added': 'مقام شامل نہیں کیا گیا',
    'Open portfolio': 'پورٹ فولیو کھولیں',
    'Pending': 'زیرِ التوا',
    'Views': 'ویوز',
    'Approved': 'منظور شدہ',
    'Days Left to Expire': 'میعاد ختم ہونے میں دن',
    'Expires:': 'میعاد ختم:',
    'Assigned Venue UID:': 'تفویض کردہ وینیو UID:',
    'Pick a Date': 'تاریخ منتخب کریں',
    'Select Event Time': 'ایونٹ کا وقت منتخب کریں',
    'Morning': 'صبح',
    'Evening': 'شام',
    'Night': 'رات',
    'Sun': 'اتوار',
    'Mon': 'پیر',
    'Tue': 'منگل',
    'Wed': 'بدھ',
    'Thu': 'جمعرات',
    'Fri': 'جمعہ',
    'Sat': 'ہفتہ',
    'Approved booking': 'منظور شدہ بکنگ',
    'Booking pending': 'بکنگ زیرِ التوا',
    'Vendor blocked': 'وینڈر بلاک ہے',
    'PRIVATE VENDOR RECORDS': 'خصوصی وینڈر ریکارڈز',
    'My Booking Spreadsheet': 'میری بکنگ اسپریڈشیٹ',
    'Only requests for your assigned venue are shown here.': 'یہاں صرف آپ کے تفویض کردہ وینیو کی درخواستیں دکھائی جاتی ہیں۔',
    'Assigned venue': 'تفویض کردہ وینیو',
    'Status': 'اسٹیٹس',
    'All records': 'تمام ریکارڈز',
    'Denied': 'مسترد',
    'Search': 'تلاش',
    'Requested month': 'درخواست کردہ ماہ',
    'Client': 'کلائنٹ',
    'Contact': 'رابطہ',
    'Event': 'ایونٹ',
    'Target date': 'مطلوبہ تاریخ',
    'Time': 'وقت',
    'Requested': 'درخواست کردہ',
    'Action': 'ایکشن',
    'Loading your records…': 'آپ کے ریکارڈز لوڈ ہو رہے ہیں…',
    'No matching records': 'کوئی متعلقہ ریکارڈ نہیں ملا',
    'Try another status, search term or month.': 'کوئی دوسرا اسٹیٹس، سرچ ٹرم یا ماہ آزمائیں۔',
    'Approve': 'منظور کریں',
    'Deny': 'مسترد کریں',
    'Closed': 'بند',
    'Declined': 'مسترد شدہ',
    'Could not load records': 'ریکارڈز لوڈ نہیں ہو سکے',
    'Please refresh the vendor panel and try again.': 'وینڈر پینل ریفریش کرکے دوبارہ کوشش کریں۔',
    'Rate Settings': 'ریٹ سیٹنگز',
    'Update your Standard and Seasonal rates for your Banquet/Hall.': 'اپنے بینکوئٹ/ہال کے اسٹینڈرڈ اور سیزنل ریٹس اپ ڈیٹ کریں۔',
    'Standard Rate/Cost': 'اسٹینڈرڈ ریٹ/قیمت',
    'Seasonal Rate/Cost': 'سیزنل ریٹ/قیمت',
    'Save Rates': 'ریٹس محفوظ کریں',
    'Enter current password and new password for your linked vendor.': 'اپنے منسلک وینڈر کا موجودہ اور نیا پاس ورڈ درج کریں۔',
    'Current password': 'موجودہ پاس ورڈ',
    'New password': 'نیا پاس ورڈ',
    'Update password': 'پاس ورڈ اپ ڈیٹ کریں',
    'Unknown view': 'نامعلوم ویو',
    'Vendor session not available': 'وینڈر سیشن دستیاب نہیں',
    'Please log in again to load your assigned venue records.': 'اپنے تفویض کردہ وینیو ریکارڈز لوڈ کرنے کے لیے دوبارہ لاگ اِن کریں۔',

    'Admin Dashboard': 'ایڈمن ڈیش بورڈ',
    'Admin Login': 'ایڈمن لاگ اِن',
    'Enter 2-Step Authentication Key:': '2-اسٹیپ توثیقی کلید درج کریں:',
    'Enter 2-Step Key': '2-اسٹیپ کلید درج کریں',
    'Show authentication key': 'توثیقی کلید دکھائیں',
    'Hide authentication key': 'توثیقی کلید چھپائیں',
    'ADMIN ACTION': 'ایڈمن ایکشن',
    'Operation Successful': 'آپریشن کامیاب',
    'Your changes have been saved.': 'آپ کی تبدیلیاں محفوظ کر دی گئی ہیں۔',
    'Cancel': 'منسوخ',
    'Continue': 'جاری رکھیں',
    'Admin': 'ایڈمن',
    'Banquet Management': 'بینکوئٹ مینجمنٹ',
    'Banquet Spreadsheet': 'بینکوئٹ اسپریڈشیٹ',
    'Hall Management': 'ہال مینجمنٹ',
    'Hall Spreadsheet': 'ہال اسپریڈشیٹ',
    'Master Record': 'ماسٹر ریکارڈ',
    'Banquet Record': 'بینکوئٹ ریکارڈ',
    'Hall Record': 'ہال ریکارڈ',
    'VENDOR CREDENTIALS': 'وینڈر اسناد',
    'auto-generated': 'خودکار طور پر تیار شدہ',
    'Auto-generated 6-digit UID': 'خودکار 6 ہندسوں کا UID',
    'Password': 'پاس ورڈ',
    'Confirm action': 'ایکشن کی تصدیق کریں',
    'PLEASE CONFIRM': 'براہِ کرم تصدیق کریں',
    'Done': 'مکمل',
    'ADMIN UPDATE': 'ایڈمن اپ ڈیٹ',
    'Access verified. Updating venue expiry dates…': 'رسائی کی تصدیق ہو گئی۔ وینیو کی میعاد کی تاریخیں اپ ڈیٹ کی جا رہی ہیں…',
    'Enter the numeric authentication key.': 'عددی توثیقی کلید درج کریں۔',
    'Verifying secure access…': 'محفوظ رسائی کی تصدیق ہو رہی ہے…',
    'Incorrect authentication key.': 'غلط توثیقی کلید۔',
    'Authentication service is not configured.': 'توثیقی سروس ترتیب نہیں دی گئی۔',
    'Could not verify access. Check your Firebase connection.': 'رسائی کی تصدیق نہیں ہو سکی۔ اپنی Firebase کنکشن چیک کریں۔',
    'Opening dashboard…': 'ڈیش بورڈ کھولا جا رہا ہے…',
    'Saved successfully': 'کامیابی سے محفوظ ہو گیا',
    'Updated successfully': 'کامیابی سے اپ ڈیٹ ہو گیا',
    'Save failed. Check console.': 'محفوظ نہیں ہو سکا۔ کنسول چیک کریں۔',
    'Clear': 'صاف کریں',
    'Cleared': 'صاف کر دیا گیا',
    'Validating...': 'تصدیق ہو رہی ہے...',
    'Validation failed': 'تصدیق ناکام',

    'Portfolio': 'پورٹ فولیو',
    'View Image': 'تصویر دیکھیں',
    'View image in HD': 'تصویر HD میں دیکھیں',
    'Location: Loading...': 'مقام: لوڈ ہو رہا ہے...',
    'Details': 'تفصیلات',
    'Specialisation': 'خصوصیت',
    'Rate and Capacity': 'ریٹ اور گنجائش',
    'Seasonal Rate': 'سیزنل ریٹ',
    'Standard Rate': 'اسٹینڈرڈ ریٹ',
    'Capacity': 'گنجائش',
    'Cinematic Stream': 'سینیمیٹک اسٹریم',
    'Pick a Date': 'تاریخ منتخب کریں',
    'Select Event Time': 'ایونٹ کا وقت منتخب کریں',
    'Calendar status legend': 'کیلنڈر اسٹیٹس کی وضاحت',
    'Previous month': 'پچھلا ماہ',
    'Next month': 'اگلا ماہ',
    'Fully reserved': 'مکمل طور پر بک',
    'Booking Pending by Other User': 'دوسرے صارف کی بکنگ زیرِ التوا ہے',
    'BOOK NOW': 'ابھی بک کریں',
    'LOCATION': 'مقام',
    'Event Time': 'ایونٹ کا وقت',
    'Morning or Evening — select your vibe.': 'صبح یا شام — اپنی پسند کا وقت منتخب کریں۔',
    'Close': 'بند کریں',
    'Event Type Options': 'ایونٹ کی اقسام',
    'What event you are planning for?': 'آپ کس ایونٹ کی منصوبہ بندی کر رہے ہیں؟',
    'Baraat': 'بارات',
    'Aqiqah': 'عقیقہ',
    'Valima': 'ولیمہ',
    'Birthday': 'سالگرہ',
    'Ameen': 'آمین',
    'Mehandi': 'مہندی',
    'Enter your details': 'اپنی تفصیلات درج کریں',
    'Name': 'نام',
    'Phone': 'فون',
    'Your name': 'اپنا نام',
    'Confirmation': 'تصدیق',
    'Your booking details:': 'آپ کی بکنگ کی تفصیلات:',
    'Phone Number:': 'فون نمبر:',
    'Event Time:': 'ایونٹ کا وقت:',
    'Event Date:': 'ایونٹ کی تاریخ:',
    'Done': 'مکمل',
    'We will contact you soon.': 'ہم جلد آپ سے رابطہ کریں گے۔',
    'Booking confirmed! Keep your phone on. The vendor will contact you shortly.': 'بکنگ کی تصدیق ہو گئی! اپنا فون آن رکھیں۔ وینڈر جلد آپ سے رابطہ کرے گا۔',
    'Please wait a moment': 'براہِ کرم ایک لمحہ انتظار کریں',
    'Notice': 'اطلاع',
    'No hall selected.': 'کوئی ہال منتخب نہیں کیا گیا۔',
    'No banquet selected.': 'کوئی بینکوئٹ منتخب نہیں کی گئی۔',
    'Hall details not found.': 'ہال کی تفصیلات نہیں ملیں۔',
    'Banquet details not found.': 'بینکوئٹ کی تفصیلات نہیں ملیں۔',
    'Location unavailable': 'مقام دستیاب نہیں',
    'No venue is currently selected.': 'فی الحال کوئی وینیو منتخب نہیں۔',
    'Venue location data was not found.': 'وینیو کے مقام کا ڈیٹا نہیں ملا۔',
    'The selected venue could not be found.': 'منتخب وینیو نہیں مل سکا۔',
    'No valid location link is available for this venue.': 'اس وینیو کے لیے درست مقام کا لنک دستیاب نہیں۔',
    'The location could not be decrypted or opened.': 'مقام کو ڈی کرپٹ یا کھولا نہیں جا سکا۔',
    'Phone invalid (11 digits required).': 'فون نمبر درست نہیں (11 ہندسے درکار ہیں)۔',
    'Booking confirmed.': 'بکنگ کی تصدیق ہو گئی۔',
    'Booking pending by another user for this date.': 'اس تاریخ کے لیے دوسرے صارف کی بکنگ زیرِ التوا ہے۔',
    'This date is fully reserved for this time.': 'یہ تاریخ اس وقت کے لیے مکمل طور پر بک ہے۔',
    'Selected option will be saved automatically.': 'منتخب آپشن خودکار طور پر محفوظ ہو جائے گا۔',

    'English': 'انگریزی',
    'Urdu': 'اردو',
    'Choose your language': 'اپنی زبان منتخب کریں',
    'Select a language to continue': 'جاری رکھنے کے لیے زبان منتخب کریں',
    'English keeps the website in English. Urdu translates the website while keeping the same layout and numeric values.': 'انگریزی سے ویب سائٹ انگریزی میں رہے گی۔ اردو ویب سائٹ کا متن اردو میں کرے گی جبکہ لے آؤٹ اور عددی قدریں اپنی جگہ برقرار رہیں گی۔',
    'Continue in English': 'انگریزی میں جاری رکھیں',
    'Continue in Urdu': 'اردو میں جاری رکھیں',

    'Banquet Name': 'بینکوئٹ کا نام',
    'Hall Name': 'ہال کا نام',
    'Location': 'مقام',
    'Location Link': 'مقام کا لنک',
    'Capacity': 'گنجائش',
    'WhatsApp': 'واٹس ایپ',
    'Start Date': 'شروع ہونے کی تاریخ',
    'Standard': 'اسٹینڈرڈ',
    'Seasonal': 'سیزنل',
    'YouTube Link': 'یوٹیوب لنک',
    'Upload Image': 'تصویر اپ لوڈ کریں',
    'Images': 'تصاویر',
    'Availability': 'دستیابی',
    'Morning Availability': 'صبح کی دستیابی',
    'Evening Availability': 'شام کی دستیابی',
    'Night Availability': 'رات کی دستیابی',
    'Luxury': 'لگژری',
    'Master Class': 'ماسٹر کلاس',
    'CCTV': 'سی سی ٹی وی',
    'Theme': 'تھیم',
    'Valet': 'والیٹ',
    'Details': 'تفصیلات',
    'Vendor Username': 'وینڈر یوزرنیم',
    'Vendor Password': 'وینڈر پاس ورڈ',
    'Save': 'محفوظ کریں',
    'Update': 'اپ ڈیٹ کریں',
    'Delete': 'حذف کریں',
    'Edit': 'ترمیم',
    'Add': 'شامل کریں',
    'Create': 'بنائیں',
    'Close': 'بند کریں',
    'Back': 'واپس',
    'Next': 'اگلا',
    'Previous': 'پچھلا',
    'Submit': 'جمع کریں',
    'Reset': 'ری سیٹ کریں',
    'Refresh': 'ری فریش کریں',
    'Loading records…': 'ریکارڈز لوڈ ہو رہے ہیں…',
    'No records found': 'کوئی ریکارڈ نہیں ملا',
    'Search by name or UID': 'نام یا UID سے تلاش کریں',
    'Vendor credentials': 'وینڈر اسناد',
    'Username': 'یوزرنیم',
    'Current': 'موجودہ',
    'New': 'نیا',
    'Confirm': 'تصدیق کریں',
    'Required': 'ضروری',
    'Optional': 'اختیاری',
    'Enabled': 'فعال',
    'Disabled': 'غیر فعال',
    'Active': 'فعال',
    'Expired': 'میعاد ختم',
    'Days Remaining': 'دن باقی',
    'No matching records': 'کوئی متعلقہ ریکارڈ نہیں ملا',
    'Error': 'خرابی',
    'Success': 'کامیابی',
    'Failed': 'ناکام',
    'Updated': 'اپ ڈیٹ ہو گیا',
    'Saved': 'محفوظ ہو گیا',
    'Deleted': 'حذف ہو گیا',
    'Language': 'زبان'
  };

  const R = Object.fromEntries(Object.entries(T).map(([en, ur]) => [ur, en]));
  const phrasePairs = Object.entries(T).sort((a,b) => b[0].length - a[0].length);
  const reversePairs = Object.entries(R).sort((a,b) => b[0].length - a[0].length);

  function currentLang() { return localStorage.getItem(STORAGE_KEY) || LANG.EN; }
  function hasUrdu(text) { return /[\u0600-\u06FF]/.test(text); }
  function translateText(text, lang) {
    if (!text || lang === LANG.EN) return text;
    let out = String(text);
    for (const [en, ur] of phrasePairs) out = out.split(en).join(ur);
    // Common dynamic messages with numbers: numbers stay exactly numeric.
    out = out.replace(/(\d+) venue expiry record(s?) refreshed\. Opening dashboard…/gi, (_, n, s) => `${n} وینیو کی میعاد کا ریکارڈ ${s ? 'ریفریش ہو گئے' : 'ریفریش ہو گیا'}۔ ڈیش بورڈ کھولا جا رہا ہے…`);
    out = out.replace(/(\d+) Days Remaining/g, '$1 دن باقی');
    out = out.replace(/Expired (\d+) days ago/g, '$1 دن پہلے میعاد ختم');
    out = out.replace(/Expires:\s*/g, 'میعاد ختم: ');
    return out;
  }
  function restoreText(text) {
    let out = String(text || '');
    for (const [ur, en] of reversePairs) out = out.split(ur).join(en);
    out = out.replace(/(\d+) دن باقی/g, '$1 Days Remaining');
    out = out.replace(/(\d+) دن پہلے میعاد ختم/g, 'Expired $1 days ago');
    out = out.replace(/میعاد ختم:\s*/g, 'Expires: ');
    return out;
  }

  function translateNode(node) {
    const lang = currentLang();
    if (node.nodeType === Node.TEXT_NODE) {
      const raw = node.nodeValue;
      if (!raw || !raw.trim()) return;
      const base = node.__evBaseText || (lang === LANG.UR ? restoreText(raw) : raw);
      node.__evBaseText = base;
      const next = translateText(base, lang);
      if (next !== raw) node.nodeValue = next;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.closest('#evLanguageModal')) return;
    if (['SCRIPT','STYLE','NOSCRIPT'].includes(node.tagName)) return;

    const attrs = ['placeholder','title','aria-label'];
    attrs.forEach(attr => {
      if (!node.hasAttribute(attr)) return;
      const raw = node.getAttribute(attr);
      const key = `__evAttr_${attr}`;
      const base = node[key] || (lang === LANG.UR ? restoreText(raw) : raw);
      node[key] = base;
      const next = translateText(base, lang);
      if (next !== raw) node.setAttribute(attr, next);
    });
    if (node.childNodes.length) node.childNodes.forEach(translateNode);
  }

  function translatePage() {
    document.documentElement.lang = currentLang();
    document.documentElement.classList.toggle('ev-urdu', currentLang() === LANG.UR);
    if (document.body) translateNode(document.body);
  }

  function createStyles() {
    if (document.getElementById('evLanguageStyles')) return;
    const style = document.createElement('style');
    style.id = 'evLanguageStyles';
    style.textContent = `
      #evLanguageModal{position:fixed;inset:0;z-index:999999;display:grid;place-items:center;padding:20px;background:rgba(4,6,10,.76);backdrop-filter:blur(18px);font-family:Manrope,DM Sans,system-ui,sans-serif;animation:evLangFade .22s ease both}
      #evLanguageModal *{box-sizing:border-box}
      .ev-lang-card{position:relative;width:min(470px,100%);padding:34px;border:1px solid rgba(223,189,126,.28);border-radius:30px;background:linear-gradient(145deg,#171b21,#0c0f14 72%);box-shadow:0 40px 120px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.05);color:#fff;overflow:hidden}
      .ev-lang-glow{position:absolute;width:220px;height:220px;right:-80px;top:-90px;border-radius:50%;background:rgba(223,189,126,.11);filter:blur(4px);pointer-events:none}
      .ev-lang-brand{display:flex;align-items:center;gap:10px;color:#dfbd7e;font-size:10px;font-weight:900;letter-spacing:.26em;text-transform:uppercase}
      .ev-lang-brand span{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;background:rgba(223,189,126,.1);border:1px solid rgba(223,189,126,.2);font-size:16px}
      .ev-lang-title{margin:22px 0 8px;font:800 30px/1.12 Manrope,system-ui;letter-spacing:-.04em}
      .ev-lang-subtitle{margin:0;color:#9da4ae;font-size:13px;line-height:1.7;max-width:390px}
      .ev-lang-options{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:25px}
      .ev-lang-option{position:relative;text-align:left;border:1px solid #303640;border-radius:18px;background:rgba(255,255,255,.035);padding:17px 16px;color:#fff;cursor:pointer;transition:transform .18s,border-color .18s,background .18s,box-shadow .18s}
      .ev-lang-option:hover{transform:translateY(-2px);border-color:rgba(223,189,126,.65);background:rgba(223,189,126,.07);box-shadow:0 15px 35px rgba(0,0,0,.2)}
      .ev-lang-option strong{display:block;font-size:16px}.ev-lang-option small{display:block;margin-top:5px;color:#9299a4;font-size:10px;line-height:1.5}
      .ev-lang-footer{margin-top:18px;color:#6f7782;font-size:10px;line-height:1.55}
      @keyframes evLangFade{from{opacity:0}to{opacity:1}}
      @media(max-width:520px){.ev-lang-card{padding:27px 21px;border-radius:24px}.ev-lang-options{grid-template-columns:1fr}.ev-lang-title{font-size:27px}}
      .ev-urdu{font-family:"Noto Naskh Arabic","Noto Sans Arabic",Arial,sans-serif}
    `;
    document.head.appendChild(style);
  }

  function popup() {
    if (localStorage.getItem(POPUP_SEEN_KEY) === '1') return;
    if (document.getElementById('evLanguageModal')) return;
    const modal = document.createElement('div');
    modal.id = 'evLanguageModal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.innerHTML = `
      <div class="ev-lang-card">
        <div class="ev-lang-glow"></div>
        <div class="ev-lang-brand"><span>✦</span> EVENT VAULT</div>
        <h2 class="ev-lang-title">Choose your language</h2>
        <p class="ev-lang-subtitle">Select a language to continue. Your choice will apply across the website without changing the existing layout or numeric values.</p>
        <div class="ev-lang-options">
          <button class="ev-lang-option" data-lang="en" type="button"><strong>English</strong><small>Continue with the complete English interface</small></button>
          <button class="ev-lang-option" data-lang="ur" type="button"><strong>اردو</strong><small>ویب سائٹ اردو میں، اسی لے آؤٹ اور عددی قدروں کے ساتھ</small></button>
        </div>
        <div class="ev-lang-footer">You can change the saved language later by clearing the site language preference.</div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-lang]').forEach(btn => btn.addEventListener('click', () => {
      const lang = btn.dataset.lang === 'ur' ? LANG.UR : LANG.EN;
      localStorage.setItem(STORAGE_KEY, lang);
      localStorage.setItem(POPUP_SEEN_KEY, '1');
      modal.remove();
      translatePage();
      window.dispatchEvent(new CustomEvent('eventVaultLanguageChanged', { detail: { lang } }));
    }));
    translateNode(modal);
  }

  function init() {
    createStyles();
    translatePage();
    popup();
    const observer = new MutationObserver(mutations => {
      if (document.getElementById('evLanguageModal')) return;
      for (const m of mutations) {
        if (m.type === 'characterData') translateNode(m.target);
        else if (m.type === 'childList') m.addedNodes.forEach(n => translateNode(n));
        else if (m.type === 'attributes') translateNode(m.target);
      }
    });
    observer.observe(document.documentElement, { subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['placeholder','title','aria-label'] });
    window.EventVaultLanguage = {
      get: currentLang,
      set(lang){ localStorage.setItem(STORAGE_KEY, lang === 'ur' ? 'ur' : 'en'); translatePage(); },
      translate: translateText
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
