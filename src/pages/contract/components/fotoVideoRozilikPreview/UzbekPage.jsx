export default function UzbekPage({ fullName, geburtsdatum, adresse, email, ortDatum }) {
  return (
    <>
      <h1 className="text-sm font-bold text-center mb-5 underline text-blue-700">
        Foto va video tasvirlardan foydalanishga rozilik arizasi
      </h1>

      {/* Header fields */}
      <div className="flex mb-1">
        <span className="font-semibold w-36">Shaxsning ismi-sharifi:</span>
        <span className="flex-1 border-b border-black min-h-[14px]">{fullName}</span>
      </div>
      <div className="flex mb-1">
        <span className="font-semibold w-36">Tug'ilgan sana:</span>
        <span className="flex-1 border-b border-black min-h-[14px]">{geburtsdatum}</span>
      </div>
      <div className="flex mb-1">
        <span className="font-semibold w-36">Manzili:</span>
        <span className="flex-1 border-b border-black min-h-[14px]">{adresse}</span>
      </div>

      {/* Section 1 */}
      <h2 className="font-bold mt-4 mb-2">1. Rozilikning maqsadi</h2>
      <p className="text-justify mb-2">
        Men ushbu ariza orqali Orif Akhmadaliev (ConsultingUz) (keyingi o'rinlarda <span className="font-bold">"Kompaniya"</span> deb yuritiladi) tomonidan mening foto va video tasvirlarimni yaratish va ulardan quyidagi maqsadlarda foydalanishga rozilik bildiraman:
      </p>
      <p className="pl-4 mb-1">• Ijtimoiy tarmoqlarda joylashtirish (masalan: Instagram, Facebook, LinkedIn, Telegram, YouTube)</p>
      <p className="pl-4 mb-1">• Kompaniyaning rasmiy veb-saytida foydalanish</p>
      <p className="pl-4 mb-1">• Reklama, axborot va marketing maqsadlarida qo'llash</p>
      <p className="pl-4 mb-2">• Muvaffaqiyat tarixlari, tajriba hikoyalari hamda kompaniya taqdimotlarida foydalanish</p>

      {/* Section 2 */}
      <h2 className="font-bold mt-4 mb-2">2. Foydalaniladigan media turlari</h2>
      <p className="text-justify mb-2">
        Quyidagi media turlaridan foydalanishga roziman:
      </p>
      <p className="pl-4 mb-1">• Foto va video tasvirlar (yakka va guruh suratlari)</p>
      <p className="pl-4 mb-2">• Qisqa intervyular yoki video murojaatlar</p>

      {/* Section 3 */}
      <h2 className="font-bold mt-4 mb-2">3. Foydalanish doirasi</h2>
      <p className="text-justify mb-2">
        Tasvirlar dunyo bo'ylab, muddatsiz va hech qanday cheklovlarsiz foydalanilishi, nusxa ko'chirilishi, tarqatilishi va ommaga taqdim etilishiga roziman.
      </p>
      <p className="text-justify mb-2">
        Ushbu rozilik quyidagilardagi e'lonlarni o'z ichiga oladi:
      </p>
      <p className="pl-4 mb-1">• Instagram, Facebook, LinkedIn, Telegram</p>
      <p className="pl-4 mb-1">• Kompaniyaning rasmiy saytlarida: consultinguz.de / consultinguz.uz</p>
      <p className="pl-4 mb-2">• Kompaniyaning boshqa raqamli aloqa kanallarida</p>

      {/* Section 4 */}
      <h2 className="font-bold mt-4 mb-2">4. Ixtiyoriylik va bekor qilish huquqi</h2>
      <p className="text-justify mb-2">
        Ushbu rozilik ixtiyoriy ravishda berilmoqda. Men istalgan vaqtda kelajak uchun roziligimni bekor qilishim mumkin. Bekor qilishgacha bo'lgan e'lonlarga o'zgarish kiritilmaydi, lekin kelgusida foydalanish to'xtatiladi.
      </p>
      <p className="mb-2">Bekor qilish uchun murojaat:</p>
      <p className="mb-2">
        <span className="font-bold">E-mail: </span>
        <a href={`mailto:${email}`} className="text-blue-600 underline">{email}</a>
      </p>

      {/* Section 5 */}
      <h2 className="font-bold mt-4 mb-2">5. Tasvirlarga bo'lgan huquqlar</h2>
      <p className="text-justify mb-2">
        Men tasdiqlayman ki, ushbu tasvirlardan foydalanish uchun hech qanday to'lov yoki mukofot talab qilmayman.
      </p>
      <p className="text-justify mb-2">
        Kompaniya mening shaxsiy huquqlarimni hurmat qilgan holda tasvirlarni tahrirlashi, kesishi yoki kollaj shaklida qayta ishlashi mumkin.
      </p>

      {/* Section 6 */}
      <h2 className="font-bold mt-4 mb-2">6. Shaxsiy ma'lumotlarni himoya qilish</h2>
      <p className="text-justify mb-2">
        Ma'lumotlar amaldagi ma'lumotlarni himoya qilish qonunchiligiga (DSGVO) muvofiq qayta ishlanadi. Faqat e'lon qilish uchun zarur bo'lgan ma'lumotlargina qayta ishlanadi.
      </p>

      {/* Signature Section */}
      <div className="mt-8 space-y-4">
        <div className="flex">
          <span className="font-semibold w-56">Joy, sana:</span>
          <span className="flex-1 border-b border-black min-h-[14px]">{ortDatum}</span>
        </div>
        <div className="flex">
          <span className="font-semibold w-56">Shaxsning imzosi:</span>
          <span className="flex-1 border-b border-black min-h-[14px]"></span>
        </div>
        <div className="flex">
          <span className="font-semibold w-56">Kompaniya vakili (ixtiyoriy):</span>
          <span className="flex-1 border-b border-black min-h-[14px]"></span>
        </div>
      </div>
    </>
  );
}
