# TechStore — Netlifyga joylash bo'yicha qo'llanma

Bu papka — saytning **frontend** qismi (statik HTML/CSS/JS).
Netlify aynan shunaqa statik saytlar uchun mo'ljallangan.

## Eng oson yo'l — Netlify Drop (drag & drop)

1. Brauzerda oching: https://app.netlify.com/drop
2. Shu papkani (`techstore-netlify`) sichqoncha bilan oynaga **sudrab tashlang**.
3. Bir necha soniyada tayyor havola chiqadi, masalan:
   `https://qandaydir-nom-123.netlify.app`
4. Havolani saqlab qo'yish (doimiy bo'lishi) uchun bepul Netlify akkaunt yarating.

> Eslatma: zip'ni emas, ICHIDAGI papkani sudrang. Yoki avval zip'ni oching.

## Muhim: backend haqida

Bu loyihada Node.js + Express + MongoDB backend ham bor, lekin **u Netlifyda
ishlamaydi** (Netlify doimiy server ishlatmaydi).

Yaxshi xabar: frontend'da **demo rejim** bor. Backend topilmasa, sayt avtomatik
tarzda namuna (mock) mahsulotlar bilan to'liq ishlaydi:
- Demo admin: login `admin`, parol `admin123`
- Ro'yxatdan o'tish — brauzer xotirasida (localStorage) saqlanadi

Shuning uchun Netlifydagi havola ko'rsatish/topshirish uchun to'liq ishlaydi.

## Agar haqiqiy backend ham kerak bo'lsa

1. Backend'ni Render yoki Railway'ga joylang.
2. MongoDB uchun MongoDB Atlas (bepul) bazasini ulang.
3. `js/api.js` dagi birinchi qatordagi manzilni o'zgartiring:
   `const API_BASE = 'https://sizning-backend-manzilingiz/api';`
