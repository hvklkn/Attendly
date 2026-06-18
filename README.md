# Attendly

Attendly, kurumlar için QR kod, konum doğrulama ve güvenlik uyarılarıyla çalışan çok rollü yoklama yönetim uygulamasıdır. Demo akışı; eğitmenin canlı yoklama başlatmasını, öğrencinin QR bağlantısıyla giriş yapmasını, sistemin enrollment/token/geofence kontrollerini çalıştırmasını ve rapor/CSV çıktısı alınmasını gösterir.

## Kullanılan Teknolojiler

- Next.js App Router
- TypeScript
- Prisma ORM
- PostgreSQL / Neon
- Tailwind CSS
- Vercel deploy hedefi
- QR üretimi için `qrcode.react`
- Kamera opsiyonu için `html5-qrcode`

## Temel Özellikler

- Çok rollü giriş ve route koruması: Admin, Instructor, Student
- Admin tarafında ders, şube, oda ve kullanıcı yönetimi
- Instructor tarafında öğrenci-şube atama, canlı yoklama oluşturma ve kapatma
- Dinamik QR token üretimi ve 60 saniyelik yenileme döngüsü
- Login sonrası `next` param ile QR token query bilgisinin korunması
- Browser geolocation ile konum, doğruluk ve Haversine mesafe kontrolü
- Oturum geofence önceliği; yoksa oda koordinatı/radius fallback
- AttendanceRecord ve PresenceCheck kayıtları
- Düşük doğruluk, konum dışı, duplicate, expired/revoked token ve kapalı oturum uyarıları
- Instructor raporu, katılmayan öğrenciler, güvenlik uyarıları ve CSV export
- Demo seed ile dolu dashboard ve rapor ekranları

## Roller

- Admin: Kurum verilerini yönetir; ders, oda, şube, kullanıcı ve admin rapor ekranlarını kullanır.
- Instructor: Kendi şubelerini, öğrencilerini, yoklama oturumlarını, QR panelini, raporları ve güvenlik uyarılarını yönetir.
- Student: QR bağlantısıyla yoklamaya katılır, konum izni verir ve yoklama sonucunu görür.

## Demo Hesapları

| Rol | E-posta | Şifre |
| --- | --- | --- |
| Admin | `admin@attendly.local` | `AttendlyDev123!` |
| Instructor | `instructor@attendly.local` | `AttendlyDev123!` |
| Student | `student@attendly.local` | `AttendlyDev123!` |

Seed içinde sunumu doldurmak için ek demo kullanıcıları da bulunur:

| Rol | E-posta | Şifre |
| --- | --- | --- |
| Instructor | `instructor2@attendly.local` | `AttendlyDev123!` |
| Student | `zeynep@attendly.com` | `AttendlyDev123!` |
| Student | `ali@attendly.com` | `AttendlyDev123!` |
| Student | `ayse@attendly.com` | `AttendlyDev123!` |
| Student | `mehmet@attendly.com` | `AttendlyDev123!` |

## Local Kurulum

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Kalite kontrol komutları:

```bash
npm run typecheck
npm run build
```

Seed komutu proje script’i olarak tanımlıdır:

```bash
npm run prisma:seed
```

Prisma CLI üzerinden çalıştırmak isterseniz:

```bash
npx prisma db seed
```

## Environment Variables

`.env.example` içeriği:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/attendly?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SEED_PASSWORD="AttendlyDev123!"
```

- `DATABASE_URL`: PostgreSQL/Neon bağlantı adresi.
- `NEXT_PUBLIC_APP_URL`: QR linklerinin üretileceği public uygulama origin’i. Local için `http://localhost:3000`, canlıda Vercel domain’i olmalıdır.
- `SEED_PASSWORD`: Demo kullanıcılarının seed sırasında atanacak şifresi.
- Auth/session secret: Bu demo sürümünde ek bir secret env yoktur. Session token’ları `crypto.randomBytes` ile üretilir, hashlenerek veritabanında saklanır ve `attendly_session` HTTP-only cookie ile taşınır.

## Prisma Migration ve Seed

Local geliştirme:

```bash
npx prisma migrate dev
npm run prisma:seed
```

Canlı/veri tabanı deploy:

```bash
npx prisma migrate deploy
npm run prisma:seed
```

Seed verisi şu demo kapsamını oluşturur:

- 1 admin
- 2 instructor
- 5 student
- 2 course
- 3 section
- 2 room
- 1 aktif yoklama
- 2 kapalı/geçmiş yoklama
- AttendanceRecord, PresenceCheck ve AttendanceAlert örnekleri

## Vercel + Neon Deploy Notları

1. Neon’da PostgreSQL projesi oluşturun ve pooled connection string’i alın.
2. Vercel project environment variables içine şunları ekleyin:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `SEED_PASSWORD`
3. `NEXT_PUBLIC_APP_URL` değeri canlı Vercel origin’i olmalıdır. Örnek: `https://attendly-demo.vercel.app`
4. Deploy öncesi ya da deploy pipeline’da migration çalıştırın:

```bash
npx prisma migrate deploy
```

5. Demo verisini canlı DB’ye yüklemek için:

```bash
npm run prisma:seed
```

6. Vercel build komutu varsayılan olarak:

```bash
npm run build
```

## Demo Akışı

1. Admin giriş yapar.
2. Admin ders, oda ve şube oluşturur.
3. Admin veya eğitmen öğrenci-şube ataması yapar.
4. Eğitmen yeni yoklama oluşturur.
5. Eğitmen “Mevcut konumumu kullan” ile yoklama alanını belirler.
6. Sistem oturum geofence bilgisini kaydeder.
7. Eğitmen session detail ekranında dinamik QR üretir.
8. Öğrenci telefon kamerasıyla QR kodu okutur veya yoklama bağlantısını açar.
9. Öğrenci giriş yapmamışsa login ekranına gider; login sonrası `token` query param korunur.
10. Öğrenci “Yoklamaya Katıl” butonuna basar.
11. Tarayıcı sadece konum izni ister.
12. Sistem token, revoked/expired durumları, session status, enrollment ve organization kapsamını kontrol eder.
13. Sistem geofence mesafesini ve konum doğruluğunu hesaplar.
14. Uygunsa AttendanceRecord ve PresenceCheck oluşturulur.
15. Duplicate, konum dışı, düşük doğruluk, kapalı oturum ve geçersiz token denemeleri güvenlik uyarısı olarak loglanır.
16. Eğitmen yoklama raporunu, katılmayan öğrencileri ve güvenlik uyarılarını görüntüler.
17. CSV export alınabilir.
18. Eğitmen yoklamayı kapatır; aktif QR token’lar revoke edilir.

## Final Kontrol Komutları

```bash
npm run typecheck
npm run build
npx prisma migrate deploy
npm run prisma:seed
```
