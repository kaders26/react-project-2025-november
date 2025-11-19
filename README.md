# 🟦 **Shift Scheduling Application — Technical Assessment Delivery Report**

Bu doküman, Shift Scheduling Application için tarafıma iletilen teknik değerlendirmenin tamamlanmış hâlini içermektedir.

Proje kapsamında talep edilen tüm fonksiyonlar eksiksiz olarak uygulanmış, ek olarak performans, UX ve sürdürülebilirlik adına çeşitli iyileştirmeler yapılmıştır.

---

## 📌 **1. Profile Access & Role Management**

* Profil bilgileri, backend yanıtı geciktiğinde dahi **LocalStorage üzerinden kesintisiz olarak** gösterilmektedir.

* Rol bilgisinin görünmemesi, loader aşamasında boş gelmesi veya "undefined role" durumları giderilmiştir.

* ProfileCard bileşeni yeniden yapılandırılarak yükleme akışı daha stabil hale getirilmiştir.

---

## 📌 **2. Staff-Based Calendar Rendering**

* Takvim, seçili personele ait vardiya verilerini **dinamik** ve **hatasız** şekilde üretmektedir.

* Tarih parse hatalarına yönelik normalizasyon katmanı eklendi. (Örnek: `T017` vb.)

* Şiftler, saat uyumsuzluklarını engellemek adına `dayjs.utc()` ile standardize edilmiştir.

* Personel ve shift türüne göre **renk eşleştirme** iyileştirildi.

---

## 📌 **3. Pair Workday Highlighting**

* Bir personelin başka bir personelle eşleştiği günler yalnızca seçili personel üzerinden hesaplanmaktadır.

* Pair günleri:
  * underline (alt çizgi),
  * soft-color background tint
  
  ile görsel olarak ayırt edilir.

* Her partner personele özel **renk kodlaması** uygulanmıştır.

* Tüm underline problemleri giderilerek sadece ilgili günler işaretlenmektedir.

---

## 📌 **4. Shift Detail Modal**

* Takvim üzerindeki herhangi bir etkinlik tıklandığında, aşağıdaki bilgileri içeren modal görüntülenir:
  * Personel adı
  * Vardiya tipi
  * Tarih
  * Başlangıç – Bitiş saatleri
  * Güncellenmiş vardiya bilgisi (badge)

* Modal kullanıcı deneyimi için sade ve kurumsal bir tasarım yaklaşımıyla güncellenmiştir.

---

## 📌 **5. Drag & Drop Shift Update**

* FullCalendar'ın yerleşik sürükle-bırak mekanizması etkinleştirildi.

* Bir etkinlik yeni tarihe taşındığında:
  * İlgili shift'in başlangıç ve bitiş tarihleri hesaplanır,
  * Redux state'i **immutable** yapıya uygun şekilde güncellenir,
  * UI, güncel state'i anında yansıtır.

* Render döngüsü ve referans sorunları giderildi; etkinlikler artık **kalıcı olarak yeni tarihine taşınmaktadır**.

---

## 📌 **6. UX & Design Enhancements**

* Tüm bileşenlerde spacing, renk, tipografi ve hiyerarşi iyileştirmeleri yapıldı.

* Personel seçim alanı daha kurumsal bir görsel dil ile yeniden düzenlendi.

* Takvim genel görünümü sade, okunabilir ve profesyonel bir tasarıma kavuştu.

* Görsel tutarsızlıklar giderildi, modern bir dashboard tarzı oluşturuldu.

---

## 🏛 **7. Kod Yapısı ve Mimarî Notlar**

### Kullanılan Teknolojiler

* **React, TypeScript, Redux**
* **FullCalendar**
* **Day.js**
* **SCSS / Modular Styling**

### Kodlama Prensipleri

* Component-based modüler yapı
* Sıkı TypeScript disiplini
* Immutable Redux güncellemeleri
* UI state ve business logic ayrımı
* Okunabilir ve sürdürülebilir kod standartları

---

## ▶️ **Kurulum ve Çalıştırma**

```bash
npm install --legacy-peer-deps
npm run dev
```

Uygulama: [http://localhost:3000](http://localhost:3000)

---

## 📘 **Sonuç**

Bu teslimde; proje gereksinimleri karşılanmış, ilgili tüm fonksiyonlar kararlı bir şekilde çalışır hale getirilmiş ve kullanıcı deneyimi artırılacak ek iyileştirmeler uygulanmıştır.

Herhangi bir ek açıklama veya teknik detay talep edilmesi durumunda memnuniyetle paylaşabilirim.

---

**📋 Detaylı Teknik Dokümantasyon:** [README2.md](./README2.md)
