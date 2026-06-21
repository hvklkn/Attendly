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
- Admin ve Instructor tarafında CSV ile toplu öğrenci içe aktarma
- Kullanıcı profillerinde mevcut şifreyle şifre değiştirme
- Şifremi unuttum akışı için süreli, tek kullanımlık reset token sistemi
- Admin destek ekranında reset linki başlatma ve geçici şifre atama
- Dinamik QR token üretimi ve 60 saniyelik yenileme döngüsü
- Login sonrası `next` param ile QR token query bilgisinin korunması
- Browser geolocation ile konum, doğruluk ve Haversine mesafe kontrolü
- Oturum geofence önceliği; yoksa oda koordinatı/radius fallback
- AttendanceRecord ve PresenceCheck kayıtları
- Düşük doğruluk, konum dışı, tekrar deneme, süresi dolmuş/iptal edilmiş token ve kapalı oturum uyarıları
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
PASSWORD_RESET_EMAIL_PROVIDER=""
```

- `DATABASE_URL`: PostgreSQL/Neon bağlantı adresi.
- `NEXT_PUBLIC_APP_URL`: QR linklerinin üretileceği public uygulama origin’i. Local için `http://localhost:3000`, canlıda Vercel domain’i olmalıdır.
- `SEED_PASSWORD`: Demo kullanıcılarının seed sırasında atanacak şifresi.
- `PASSWORD_RESET_EMAIL_PROVIDER`: Opsiyonel. Şifre sıfırlama e-postası için ileride bağlanacak SMTP/transactional e-posta sağlayıcı anahtarıdır.
- Auth/session secret: Bu demo sürümünde ek bir secret env yoktur. Session token’ları `crypto.randomBytes` ile üretilir, hashlenerek veritabanında saklanır ve `attendly_session` HTTP-only cookie ile taşınır.

## Prisma Migration ve Seed

Local geliştirme:

```bash
npx prisma migrate dev
npm run prisma:seed
```

Canlı/veri tabanı deploy:

```bash
npm run prisma:deploy
npm run prisma:seed
```

Not: Neon pooler bağlantısı kullanıldığında Prisma advisory lock beklemesine takılmamak için `prisma:deploy` script’i migration komutunu explicit schema ile ve tek deploy varsayımıyla çalıştırır. Aynı veritabanına paralel migration/deploy çalıştırmayın.

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

## CSV ile Öğrenci İçe Aktarma

Admin ekranı: `/admin/students/import`

Instructor ekranı: `/instructor/students/import`

CSV formatı:

```csv
name,email,studentNo,sectionCode,password
Zeynep Demir,zeynep@example.com,B210100001,CSE101-A,AttendlyDev123!
```

Zorunlu kolonlar:

- `name`
- `email`

Opsiyonel kolonlar:

- `studentNo`
- `sectionCode`
- `password`

İçe aktarma akışı:

1. CSV dosyası seçilir.
2. İsteğe bağlı varsayılan şube seçilir.
3. Sistem önce önizleme gösterir; toplam satır, geçerli satır, hatalı satır, tekrarlanan e-posta, eksik ad/e-posta ve bulunamayan şube kodu sayıları görünür.
4. Kullanıcı “İçe Aktar” demeden veritabanına kayıt yazılmaz.
5. E-posta mevcutsa yeni kullanıcı oluşturulmaz; öğrenci üyelik ve şube kaydı kuralları kurum kapsamıyla kontrol edilir.
6. Pasif şube kaydı varsa tekrar aktif yapılır; aktif tekrar kayıt oluşturulmaz.
7. Şifre boşsa `SEED_PASSWORD`, o da uygun değilse demo varsayılan şifresi kullanılır.

## Şifre Yönetimi

- Student, Instructor ve Admin kullanıcıları profil ekranlarından mevcut şifrelerini doğrulayarak yeni şifre belirleyebilir.
- Login ekranındaki “Şifremi Unuttum?” bağlantısı `/forgot-password` akışını başlatır.
- Reset token’ları veritabanında hash olarak saklanır, 30 dakika geçerlidir ve tek kullanımlıktır.
- Aynı e-posta için kısa sürede çok sayıda reset isteği oluşursa sistem isteği güvenli biçimde sınırlar.
- Admin kullanıcı düzenleme ekranında “Şifre Desteği” panelinden reset linki süreci başlatabilir veya geçici şifre atayabilir.
- Geçici şifre atanan kullanıcı ilk girişte profil ekranındaki şifre değiştirme bölümüne yönlendirilir.
- Şifre değişimi veya reset sonrası diğer aktif oturumlar iptal edilir.
- Password reset mail delivery requires SMTP/transactional email configuration. Demo sürümünde e-posta adapter yapısı hazırdır; sağlayıcı yapılandırılmadığında ham token veya reset bağlantısı kullanıcıya, admin ekranına ya da server log’una yazdırılmaz.

## Yönetim Notları

- Admin ders, şube, oda ve kullanıcı kayıtlarını oluşturabilir, düzenleyebilir ve pasifleştirebilir.
- Pasifleştirme soft delete mantığıyla çalışır; geçmiş yoklama, rapor ve güvenlik kayıtları korunur.
- Şube ekranında bir veya birden fazla öğretmen atanabilir. Eğitmen yalnızca kendisine atanmış aktif şubeler için yoklama oluşturabilir ve rapor görebilir.
- Oda oluşturma ve düzenleme ekranlarında “Mevcut konumumu kullan” butonu sadece tarayıcı konum izni ister; kamera izni istemez.
- Instructor öğrenci yönetiminde kendi şubelerine kayıtlı öğrencilerin ad ve öğrenci numarası bilgisini düzenleyebilir, enrollment kaydını pasifleştirip tekrar aktif hale getirebilir.
- Admin ve Instructor işlemleri formdan gelen id değerlerine güvenmeden kurum kapsamı kontrolüyle çalışır.

## Vercel + Neon Deploy Notları

1. Neon’da PostgreSQL projesi oluşturun ve pooled connection string’i alın.
2. Vercel project environment variables içine şunları ekleyin:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `SEED_PASSWORD`
3. `NEXT_PUBLIC_APP_URL` değeri canlı Vercel origin’i olmalıdır. Örnek: `https://attendly-demo.vercel.app`
4. Deploy öncesi ya da deploy pipeline’da migration çalıştırın:

```bash
npm run prisma:deploy
```

Not: Vercel/Neon ortamında aynı anda birden fazla migration job çalıştırmayın.

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
3. Admin şubeyi bir veya birden fazla öğretmene atar.
4. Admin veya eğitmen öğrenci-şube ataması yapar.
5. Eğitmen yeni yoklama oluşturur.
6. Eğitmen “Mevcut konumumu kullan” ile yoklama alanını belirler.
7. Sistem oturum geofence bilgisini kaydeder.
8. Eğitmen session detail ekranında dinamik QR üretir.
9. Öğrenci telefon kamerasıyla QR kodu okutur veya yoklama bağlantısını açar.
10. Öğrenci giriş yapmamışsa login ekranına gider; login sonrası `token` query param korunur.
11. Öğrenci “Yoklamaya Katıl” butonuna basar.
12. Tarayıcı sadece konum izni ister.
13. Sistem token, revoked/expired durumları, session status, enrollment ve organization kapsamını kontrol eder.
14. Sistem geofence mesafesini ve konum doğruluğunu hesaplar.
15. Uygunsa AttendanceRecord ve PresenceCheck oluşturulur.
16. Tekrar yoklama, konum dışı, düşük doğruluk, kapalı oturum ve geçersiz token denemeleri güvenlik uyarısı olarak loglanır.
17. Eğitmen yoklama raporunu, katılmayan öğrencileri ve güvenlik uyarılarını görüntüler.
18. CSV export alınabilir.
19. Eğitmen yoklamayı kapatır; aktif QR token’lar revoke edilir.
20. Kullanıcı profilinden şifresini değiştirebilir veya login ekranından şifre sıfırlama akışını başlatabilir.

## Final Kontrol Komutları

```bash
npm run typecheck
npm run build
npm run prisma:deploy
npm run prisma:seed
```
