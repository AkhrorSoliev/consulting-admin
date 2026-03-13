/**
 * Stage-specific copy text for each candidate decision stage.
 */

import { CANDIDATE_STATUS_DEFAULT } from "../../constants/candidateStatus";
import { normalizeDecision } from "./helpers";

function buildCommonClosing() {
  const telegramChannelsText = [
    "Qo'shimcha ma'lumotlar uchun Telegram kanallarimiz:",
    "🔹 ConsultingUz rasmiy kanali: https://t.me/Consulting_UZB",
    "🔹 O'zbekiston bo'ylab nemis tili markazlarimiz: https://t.me/dafsprachzentrum",
  ].join("\n");

  return {
    channelsText: telegramChannelsText,
    closing: "Hurmat bilan,\nConsultingUZ jamoasi",
  };
}

function getStage1Copy(d) {
  const commonClosing = buildCommonClosing();
  if (d === "accepted") {
    return {
      subject: "✅ 1-bosqich: Ichki suhbatga taklif",
      emailTitle: "Ichki suhbatga taklif",
      statusLabel: "1-bosqich (ichki suhbat) — kutilmoqda",
      mainText:
        "Sizning arizangiz ko'rib chiqildi. 1-bosqich — ichki suhbat uchun navbat belgilandi.",
      nextStepNote:
        "Iltimos, belgilangan vaqt va ko'rsatmalarga amal qiling. Qo'shimcha ma'lumotlar kerak bo'lsa, siz bilan bog'lanamiz.",
      ...commonClosing,
    };
  }
  return {
    subject: "❌ 1-bosqich: Rad etildi",
    emailTitle: "Arizangiz ko'rib chiqildi",
    statusLabel: "1-bosqich — rad etildi",
    mainText:
      "Sizning arizangiz diqqat bilan ko'rib chiqildi. Afsuski, hujjatlaringiz ushbu lavozim talablariga to'liq mos kelmadi.",
    nextStepNote:
      "Sizga boshqa mavjud bo'sh ish o'rinlarimizga ariza topshirib, qayta urinib ko'rishingizni tavsiya qilamiz. Qiziqishingiz va vaqtingiz uchun samimiy minnatdorchilik bildiramiz.",
    ...commonClosing,
  };
}

function getStage2Copy(d) {
  const commonClosing = buildCommonClosing();
  if (d === "accepted") {
    return {
      subject: "✅ 2-bosqich: Ariza holati yangilandi",
      emailTitle: "Ariza holati yangilandi",
      statusLabel: "2-bosqich — hujjatlar ish beruvchiga yuborilmoqda",
      mainText:
        "Tabriklaymiz! Siz 1-bosqich ichki suhbatdan muvaffaqiyatli o'tdingiz.",
      nextStepNote:
        "Suhbatga oid barcha zarur ma'lumotlar (sana, vaqt va havola) quyida keltirilgan. Iltimos, belgilangan vaqtda ishtirok etishingizni tasdiqlang.",
      examples: [
        {
          id: "example1",
          title: "1-misol: Standart tabrik",
          content:
            "Sizning hujjatlaringiz to'liq holatda ish beruvchiga yuboriladi. Ish beruvchi hujjatlaringizni ko'rib chiqadi. Agar sizning hujjatlaringiz ish beruvchiga ma'qul kelsa, sizi suhbatga taklif etadi. Suhbat kuni, joyi va vaqti haqida tez orada elektron pochta orqali sizga xabar yuboramiz.",
        },
        {
          id: "example2",
          title: "2-misol: Yuqori rahbariyat bilan suhbat",
          content: `Siz ConsultingUz rahbari Orif Akhmadaliyev bilan ikkinchi bosqich ichki suhbatga taklif qilinasiz.

Suhbatga oid barcha zarur ma'lumotlar quyida keltirilgan. Iltimos, belgilangan vaqtda ishtirok etishingizni tasdiqlang.

Keyingi bosqichlar bo'yicha batafsil ma'lumotlar Sizga qo'shimcha tarzda taqdim etiladi. Jarayon davomida qo'shimcha ma'lumot zarur bo'lsa, Siz bilan bevosita bog'lanamiz.`,
        },
      ],
      ...commonClosing,
    };
  }
  return {
    subject: "❌ 2-bosqich: Rad etildi",
    emailTitle: "Ariza holati yangilandi",
    statusLabel: "2-bosqich — rad etildi",
    mainText:
      "Afsuski, tanlov jarayonining 2-bosqichida sizning nomzodingiz keyingi bosqichga o'tkazilmadi.",
    nextStepNote:
      "Qaror tanlov mezonlari asosida qabul qilindi. Qiziqishingiz va jarayonga ajratgan vaqtingiz uchun samimiy minnatdorchilik bildiramiz. Kelgusida boshqa imkoniyatlar paydo bo'lganda, qayta urinib ko'rishingizni tavsiya qilamiz.",
    ...commonClosing,
  };
}

function getStage2ResultCopy(d) {
  const commonClosing = buildCommonClosing();
  if (d === "accepted") {
    return {
      subject:
        "✅ 2-bosqich natijasi: Yuqori rahbariyat bilan suhbatdan o'tdingiz",
      emailTitle: "Yuqori rahbariyat bilan suhbat natijasi",
      statusLabel: "2-bosqich natijasi — qabul qilindi",
      mainText:
        "Tabriklaymiz! Siz yuqori rahbariyat bilan suhbatdan muvaffaqiyatli o'tdingiz. Sizning bilim, tajriba va professional ko'nikmalaringiz yuqori baholandi.",
      nextStepNote:
        "Sizning hujjatlaringiz to'liq holatda ish beruvchiga yuboriladi. Ish beruvchi hujjatlaringizni ko'rib chiqadi. Agar sizning hujjatlaringiz ish beruvchiga ma'qul kelsa, sizi suhbatga taklif etadi. Suhbat kuni, joyi va vaqti haqida tez orada elektron pochta orqali sizga xabar yuboramiz.",
      ...commonClosing,
    };
  }
  return {
    subject: "❌ 2-bosqich natijasi: Rad etildi",
    emailTitle: "Ariza holati yangilandi",
    statusLabel: "2-bosqich natijasi — rad etildi",
    mainText:
      "Afsuski, yuqori rahbariyat bilan suhbat natijalariga ko'ra, sizning nomzodingiz keyingi bosqichga o'tkazilmadi.",
    nextStepNote:
      "Qaror tanlov mezonlari va kompaniya talablari asosida qabul qilindi. Qiziqishingiz va jarayonga ajratgan vaqtingiz uchun samimiy minnatdorchilik bildiramiz. Kelgusida boshqa imkoniyatlar paydo bo'lganda, qayta urinib ko'rishingizni tavsiya qilamiz.",
    ...commonClosing,
  };
}

function getStage3Copy(d) {
  const commonClosing = buildCommonClosing();
  if (d === "accepted") {
    return {
      subject: "✅ 3-bosqich: Ish beruvchi bilan suhbatga taklif",
      emailTitle: "Ish beruvchi bilan suhbatga taklif",
      statusLabel: "3-bosqich (ish beruvchi bilan suhbat) — kutilmoqda",
      mainText:
        "Tabriklaymiz! Siz tanlov jarayonining 3-bosqichiga muvaffaqiyatli o'tdingiz. Endi ish beruvchi bilan bevosita suhbatga taklif qilinasiz.",
      nextStepNote:
        "Suhbat tafsilotlari (sana, vaqt va havola) quyida keltirilgan. Iltimos, belgilangan vaqtda ishtirok etishingizni tasdiqlang va suhbatga yaxshi tayyorgarlik ko'ring.",
      ...commonClosing,
    };
  }
  return {
    subject: "❌ 3-bosqich: Rad etildi",
    emailTitle: "Ariza holati yangilandi",
    statusLabel: "3-bosqich — rad etildi",
    mainText:
      "Afsuski, tanlov jarayonining 3-bosqichida sizning nomzodingiz keyingi bosqichga o'tkazilmadi.",
    nextStepNote:
      "Qiziqishingiz va jarayonga ajratgan vaqtingiz uchun samimiy minnatdorchilik bildiramiz. Kelgusida boshqa mos imkoniyatlar paydo bo'lganda, qayta ariza topshirishingizni tavsiya qilamiz.",
    ...commonClosing,
  };
}

function getStage4Copy(d) {
  const commonClosing = buildCommonClosing();
  if (d === "accepted") {
    return {
      subject: "✅ 4-bosqich: Hujjatlarni yuklash",
      emailTitle: "Hujjatlarni yuklash",
      statusLabel: "4-bosqich (hujjatlar yuklash) — kutilmoqda",
      mainText:
        "Tabriklaymiz! Siz ish beruvchi bilan o'tkazilgan suhbatdan muvaffaqiyatli o'tdingiz. Endi yakuniy bosqich — zarur hujjatlarni yuklash bosqichiga o'tdingiz.",
      nextStepNote:
        "Iltimos, quyidagi havola orqali tizimga kirib, talab etilgan barcha hujjatlarni yuklang. Imzolanishi kerak bo'lgan hujjatlarni yuklab olib, imzolaganingizdan so'ng, qayta yuklashingizni so'raymiz.",
      ...commonClosing,
    };
  }
  return {
    subject: "❌ 4-bosqich: Rad etildi",
    emailTitle: "Ariza holati yangilandi",
    statusLabel: "4-bosqich — rad etildi",
    mainText:
      "Afsuski, tanlov jarayonining yakuniy bosqichida sizning nomzodingiz bo'yicha ijobiy qaror qabul qilinmadi.",
    nextStepNote:
      "Qiziqishingiz va jarayonga ajratgan barcha vaqtingiz uchun samimiy minnatdorchilik bildiramiz. Kelgusida mos imkoniyatlar paydo bo'lganda, sizni xabardor qilishimiz mumkin.",
    ...commonClosing,
  };
}

export function pickStageCopy(stage, decision) {
  const d = normalizeDecision(decision);

  if (stage === "stage_1") return getStage1Copy(d);
  if (stage === "stage_2") return getStage2Copy(d);
  if (stage === "stage_2_result") return getStage2ResultCopy(d);
  if (stage === "stage_3") return getStage3Copy(d);
  // stage_4 (default)
  return getStage4Copy(d);
}

export function getStatusEmailCopy(stage, decision) {
  const normalizedStage =
    String(stage || "").trim() || CANDIDATE_STATUS_DEFAULT;
  return pickStageCopy(normalizedStage, decision);
}
