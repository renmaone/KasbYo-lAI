import { PrismaClient, UserRole, Gender, CourseStatus, RiasecType } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const RIASEC_42: { text: string; category: RiasecType }[] = [
  // R - Realistic (7)
  { text: "Mexanizmlar, qurilmalar yoki kompyuter qismlarini yig‘ish va ta’mirlash menga yoqadi", category: "R" },
  { text: "Elektr sxemalar va texnik asboblar bilan amaliy ishlashga qiziqaman", category: "R" },
  { text: "Ochiq havoda, laboratoriyada yoki ustaxonada aniq natija beruvchi ish qilishni yoqtiraman", category: "R" },
  { text: "Robototexnika va avtomatlashtirilgan qurilmalarni yasashga qiziqaman", category: "R" },
  { text: "Chizmalar bo‘yicha biror buyum yoki konstruksiya yaratish menga qiziq", category: "R" },
  { text: "Qishloq xo‘jaligi texnologiyalari yoki ekologiya qurilmalarini sinab ko‘rishni yoqtiraman", category: "R" },
  { text: "Jismoniy faollik va aniq asbob-uskunalar bilan ishlash menga qulay", category: "R" },
  // I - Investigative (7)
  { text: "Murakkab matematik va mantiqiy masalalarni yechish menga zavq beradi", category: "I" },
  { text: "Ilmiy tajribalar o‘tkazish va hodisalarning sabablarini tahlil qilishni yaxshi ko‘raman", category: "I" },
  { text: "Dasturlash tillari va algoritmlar qanday ishlashini chuqur o‘rganishni xohlayman", category: "I" },
  { text: "Katta hajmdagi ma’lumotlarni tahlil qilib, qonuniyatlarni topish menga yoqadi", category: "I" },
  { text: "Kimyo, biologiya yoki fizika fanlaridagi tadqiqotlarga qiziqaman", category: "I" },
  { text: "Yangi texnologiyalar va sun’iy intellekt modellarini o‘rganish menga qiziq", category: "I" },
  { text: "Muammoni hal qilishdan oldin barcha faktlarni chuqur tekshirib chiqaman", category: "I" },
  // A - Artistic (7)
  { text: "Rasm chizish, grafik dizayn yoki 3D modellashtirish bilan shug‘ullanishni yoqtiraman", category: "A" },
  { text: "Veb-sayt va mobil ilovalarning chiroyli interfeysini (UI/UX) yaratish menga qiziq", category: "A" },
  { text: "Hikoya, maqola yoki ssenariy yozish orqali g‘oyalarimni ifodalay olaman", category: "A" },
  { text: "Musiqa bastalash, video montaj yoki fotografiya bilan ishlash menga zavq beradi", category: "A" },
  { text: "Bino va interyerlarning zamonaviy me’moriy dizaynini loyihalashga qiziqaman", category: "A" },
  { text: "Qolipga tushmagan, nostandart va ijodiy yechimlar o‘ylab topishni yaxshi ko‘raman", category: "A" },
  { text: "Brendlar uchun logotip va vizual uslub yaratish menga qiziq", category: "A" },
  // S - Social (7)
  { text: "Tengdoshlarimga murakkab mavzularni tushuntirish va dars berish menga yoqadi", category: "S" },
  { text: "Insonlarning sog‘lig‘ini tiklash va ularga tibbiy yordam ko‘rsatishni xohlayman", category: "S" },
  { text: "Jamoada ishlash va boshqalarning muammolarini tinglab maslahat berish menga oson", category: "S" },
  { text: "Psixologiya va insonlarning xulq-atvorini tushunishga qiziqaman", category: "S" },
  { text: "Ijtimoiy loyihalar va volontyorlik tadbirlarida faol qatnashishni yoqtiraman", category: "S" },
  { text: "Chet tillarini o‘rganib, turli madaniyat vakillari bilan muloqot qilishni xohlayman", category: "S" },
  { text: "Boshqalarning rivojlanishiga hissa qo‘shish menga katta motivatsiya beradi", category: "S" },
  // E - Enterprising (7)
  { text: "Maktab loyihalari va jamoalarga sardorlik qilish menga yoqadi", category: "E" },
  { text: "Kelajakda o‘z startapim yoki tadbirkorlik biznesimni ochishni maqsad qilganman", category: "E" },
  { text: "O‘z g‘oyalarimni auditoriya oldida ishonch bilan taqdim eta olaman", category: "E" },
  { text: "Muzokaralar olib borish va odamlarni umumiy maqsad sari ruhlantirish menga oson", category: "E" },
  { text: "Marketing, reklama va mahsulotni bozorga olib chiqish strategiyalariga qiziqaman", category: "E" },
  { text: "Tavakkalchilikdan qo‘rqmayman va tezkor qarorlar qabul qila olaman", category: "E" },
  { text: "Tadbirlar, musobaqalar yoki klublar faoliyatini tashkil etishni yaxshi ko‘raman", category: "E" },
  // C - Conventional (7)
  { text: "Jadvallar, ro‘yxatlar va ma’lumotlar bazasini tartibga solish menga yoqadi", category: "C" },
  { text: "Moliyaviy hisob-kitoblar, byudjet va raqamlar aniqligini tekshirishga qiziqaman", category: "C" },
  { text: "Hujjatlar bilan ishlash va har bir detalning qoidaga mosligini nazorat qilishni yoqtiraman", category: "C" },
  { text: "Reja asosida, aniq jadval va tartib bilan ishlash menga qulay", category: "C" },
  { text: "Bank ishi, audit va iqtisodiy ko‘rsatkichlarni tahlil qilish menga qiziq", category: "C" },
  { text: "Axborot xavfsizligi standartlari va tizim qoidalarini tekshirishni yoqtiraman", category: "C" },
  { text: "Hisobotlar tayyorlash va statistik ma’lumotlarni tizimlashtirish menga oson", category: "C" },
];

const CAREERS_30 = [
  { title: "Full-Stack Dasturchi", category: "IT", riasecCodes: ["I", "R"] as RiasecType[], description: "Veb-ilovalarning frontend va backend qismlarini loyihalash va yaratish.", requirements: ["TypeScript", "React/Next.js", "Node.js", "SQL"], relatedSubjects: ["Matematika", "Informatika", "Ingliz tili"], educationPaths: ["TUIT", "Inha universiteti", "New Uzbekistan University"], salaryRange: "10–30 mln so‘m" },
  { title: "Sun’iy Intellekt (AI/ML) Muhandisi", category: "IT", riasecCodes: ["I", "R"] as RiasecType[], description: "Neyron tarmoqlar, kompyuter ko‘rishi va til modellarini ishlab chiqish.", requirements: ["Python", "Oliy matematika", "Statistika", "PyTorch"], relatedSubjects: ["Matematika", "Informatika", "Ingliz tili"], educationPaths: ["New Uzbekistan University", "Inha", "TUIT"], salaryRange: "15–40 mln so‘m" },
  { title: "Ma’lumotlar Tahlilchisi (Data Analyst)", category: "IT", riasecCodes: ["I", "C"] as RiasecType[], description: "Katta hajmdagi ma’lumotlarni tahlil qilish va biznes qarorlar uchun vizual hisobotlar tuzish.", requirements: ["SQL", "Python/R", "Excel/BI", "Ehtimollar nazariyasi"], relatedSubjects: ["Matematika", "Informatika", "Iqtisodiyot"], educationPaths: ["Westminster", "TUIT", "O‘zMU"], salaryRange: "8–22 mln so‘m" },
  { title: "Kiberxavfsizlik Mutaxassisi", category: "IT", riasecCodes: ["I", "C"] as RiasecType[], description: "Axborot tizimlari va tarmoqlarni kiberhujumlardan himoya qilish.", requirements: ["Tarmoq protokollari", "Linux", "Kriptografiya"], relatedSubjects: ["Informatika", "Matematika", "Ingliz tili"], educationPaths: ["TUIT", "Ixtisoslashtirilgan IT akademiyalar"], salaryRange: "12–32 mln so‘m" },
  { title: "UI/UX Dizayner", category: "Dizayn", riasecCodes: ["A", "I"] as RiasecType[], description: "Foydalanuvchilar uchun qulay va estetik raqamli interfeyslar loyihalash.", requirements: ["Figma", "Dizayn tizimlari", "Foydalanuvchi tadqiqoti"], relatedSubjects: ["Informatika", "Tasviriy san’at", "Ingliz tili"], educationPaths: ["Kamoliddin Behzod instituti", "IT dizayn maktablari"], salaryRange: "7–20 mln so‘m" },
  { title: "Robototexnika va Mexatronika Muhandisi", category: "Muhandislik", riasecCodes: ["R", "I"] as RiasecType[], description: "Sanoat robotlari va aqlli avtomatlashtirilgan mexanizmlarni yaratish.", requirements: ["Fizika", "C++/Python", "Elektronika", "3D CAD"], relatedSubjects: ["Fizika", "Matematika", "Informatika"], educationPaths: ["Turin Politexnika universiteti", "TDTU"], salaryRange: "9–25 mln so‘m" },
  { title: "Qayta Tiklanuvchi Energiya Muhandisi", category: "Muhandislik", riasecCodes: ["R", "I"] as RiasecType[], description: "Quyosh va shamol elektr stansiyalarini loyihalash hamda joriy etish.", requirements: ["Elektrotexnika", "Fizika", "Loyihalash"], relatedSubjects: ["Fizika", "Matematika", "Geografiya"], educationPaths: ["TDTU", "TIQXMMI"], salaryRange: "8–22 mln so‘m" },
  { title: "Arxitektor va Shaharsoz", category: "Dizayn", riasecCodes: ["A", "R"] as RiasecType[], description: "Zamonaviy va ekologik binolar hamda jamoat hududlarini loyihalash.", requirements: ["AutoCAD/Revit", "Chizmachilik", "Kompozitsiya"], relatedSubjects: ["Chizmachilik", "Matematika", "Fizika"], educationPaths: ["TAQU", "SamDAQU"], salaryRange: "8–24 mln so‘m" },
  { title: "Biotexnolog", category: "Fan", riasecCodes: ["I", "R"] as RiasecType[], description: "Tirik organizmlar asosida dori vositalari va qishloq xo‘jaligi yechimlari yaratish.", requirements: ["Biologiya", "Kimyo", "Laboratoriya tahlili"], relatedSubjects: ["Biologiya", "Kimyo", "Ingliz tili"], educationPaths: ["O‘zMU", "Toshkent Tibbiyot Akademiyasi"], salaryRange: "7–18 mln so‘m" },
  { title: "Shifokor-Diagnostik", category: "Tibbiyot", riasecCodes: ["I", "S"] as RiasecType[], description: "Zamonaviy tibbiy uskunalar yordamida kasalliklarni aniq tashxislash.", requirements: ["Anatomiya", "Biologiya", "Kimyo", "Mas’uliyat"], relatedSubjects: ["Biologiya", "Kimyo", "Ona tili"], educationPaths: ["TTA", "SamDTU", "BuxDTI"], salaryRange: "8–25 mln so‘m" },
  { title: "Farmatsevt-Tadqiqotchi", category: "Tibbiyot", riasecCodes: ["I", "C"] as RiasecType[], description: "Yangi dori preparatlarini ishlab chiqish va sifatini nazorat qilish.", requirements: ["Organik kimyo", "Biologiya", "Laboratoriya"], relatedSubjects: ["Kimyo", "Biologiya"], educationPaths: ["Toshkent Farmatsevtika Instituti"], salaryRange: "7–19 mln so‘m" },
  { title: "Pedagog va EdTech Metodist", category: "Ta’lim", riasecCodes: ["S", "A"] as RiasecType[], description: "Zamonaviy raqamli ta’lim dasturlari va interaktiv darsliklar yaratish.", requirements: ["Pedagogika", "Muloqot", "Raqamli vositalar"], relatedSubjects: ["Ona tili", "Matematika", "Ingliz tili"], educationPaths: ["TDPU", "O‘zDJTU"], salaryRange: "6–16 mln so‘m" },
  { title: "Klinik va Maktab Psixologi", category: "Ijtimoiy", riasecCodes: ["S", "I"] as RiasecType[], description: "O‘quvchilar va kattalarga psixologik qo‘llab-quvvatlash ko‘rsatish.", requirements: ["Psixologiya", "Empatiya", "Diagnostika"], relatedSubjects: ["Biologiya", "Adabiyot", "Tarix"], educationPaths: ["O‘zMU", "TDPU"], salaryRange: "6–15 mln so‘m" },
  { title: "Mahsulot Menejeri (Product Manager)", category: "Biznes", riasecCodes: ["E", "I"] as RiasecType[], description: "IT va biznes mahsulotlarining rivojlanish strategiyasini boshqarish.", requirements: ["Tahlil", "Jamoa boshqaruvi", "UX tushunchasi"], relatedSubjects: ["Matematika", "Iqtisodiyot", "Ingliz tili"], educationPaths: ["Westminster", "MDIS", "TDIU"], salaryRange: "12–35 mln so‘m" },
  { title: "Raqamli Marketing Mutaxassisi", category: "Biznes", riasecCodes: ["E", "A"] as RiasecType[], description: "Brendlarni ijtimoiy tarmoqlar va qidiruv tizimlarida rivojlantirish.", requirements: ["Analitika", "Kontent strategiya", "SMM/SEO"], relatedSubjects: ["Ona tili", "Ingliz tili", "Informatika"], educationPaths: ["TDIU", "O‘zJOKU"], salaryRange: "6–18 mln so‘m" },
  { title: "Moliyaviy Tahlilchi va Auditor", category: "Moliya", riasecCodes: ["C", "I"] as RiasecType[], description: "Kompaniyalar moliyaviy holatini baholash va investitsiya prognozlari tuzish.", requirements: ["Buxgalteriya", "Excel", "Iqtisodiy tahlil"], relatedSubjects: ["Matematika", "Iqtisodiyot", "Ingliz tili"], educationPaths: ["Toshkent Moliya Instituti", "Westminster"], salaryRange: "8–24 mln so‘m" },
  { title: "Logistika va Ta’minot Zanjiri Menejeri", category: "Biznes", riasecCodes: ["E", "C"] as RiasecType[], description: "Xalqaro yuk tashish va ombor tizimlarini optimallashtirish.", requirements: ["Rejalashtirish", "Ingliz/Xitoy tili", "ERP"], relatedSubjects: ["Geografiya", "Matematika", "Ingliz tili"], educationPaths: ["Toshkent Davlat Transport Universiteti"], salaryRange: "7–20 mln so‘m" },
  { title: "Agronom-Texnolog (Smart Agro)", category: "Agrosanoat", riasecCodes: ["R", "I"] as RiasecType[], description: "Dronlar va sensorlar yordamida hosildorlikni oshirish.", requirements: ["Biologiya", "Tuproqshunoslik", "Agrotexnika"], relatedSubjects: ["Biologiya", "Kimyo", "Geografiya"], educationPaths: ["Toshkent Davlat Agrar Universiteti"], salaryRange: "6–16 mln so‘m" },
  { title: "Ekolog va Iqlim Tahlilchisi", category: "Fan", riasecCodes: ["I", "R"] as RiasecType[], description: "Atrof-muhit muhofazasi va ekologik loyihalarni baholash.", requirements: ["Ekologiya", "GIS xaritalar", "Kimyo"], relatedSubjects: ["Biologiya", "Geografiya", "Kimyo"], educationPaths: ["O‘zMU", "TIQXMMI"], salaryRange: "6–15 mln so‘m" },
  { title: "3D Animator va Game Dizayner", category: "Dizayn", riasecCodes: ["A", "I"] as RiasecType[], description: "Kompyuter o‘yinlari va animatsion filmlar uchun 3D modellar yaratish.", requirements: ["Blender/Maya", "Unity/Unreal", "Rassomlik"], relatedSubjects: ["Informatika", "Tasviriy san’at", "Fizika"], educationPaths: ["IT Park akademiyalari", "Behzod instituti"], salaryRange: "8–25 mln so‘m" },
  { title: "DevOps va Cloud Muhandisi", category: "IT", riasecCodes: ["I", "R"] as RiasecType[], description: "Bulutli serverlar infratuzilmasi va avtomatik deploy tizimlarini boshqarish.", requirements: ["Docker", "Kubernetes", "Linux", "AWS/GCP"], relatedSubjects: ["Informatika", "Matematika", "Ingliz tili"], educationPaths: ["TUIT", "Inha universiteti"], salaryRange: "14–36 mln so‘m" },
  { title: "QA Muhandis (Dasturiy Ta’minot Sinovchisi)", category: "IT", riasecCodes: ["C", "I"] as RiasecType[], description: "Ilovalardagi xatoliklarni aniqlash va avtomatlashtirilgan testlar yozish.", requirements: ["Test dizayn", "Playwright/Selenium", "SQL"], relatedSubjects: ["Informatika", "Matematika", "Ingliz tili"], educationPaths: ["TUIT", "IT o‘quv markazlari"], salaryRange: "6–18 mln so‘m" },
  { title: "Huquqshunos (IT va Intellektual Mulk)", category: "Huquq", riasecCodes: ["E", "C"] as RiasecType[], description: "Raqamli texnologiyalar, startaplar va mualliflik huquqlarini himoya qilish.", requirements: ["Qonunchilik", "Mantiq", "Muzokara"], relatedSubjects: ["Tarix", "Huquq", "Ona tili"], educationPaths: ["Toshkent Davlat Yuridik Universiteti"], salaryRange: "8–25 mln so‘m" },
  { title: "Tarjimon-Sinxronist", category: "Gumanitar", riasecCodes: ["S", "A"] as RiasecType[], description: "Xalqaro konferensiyalar va biznes uchrashuvlarda og‘zaki va yozma tarjima.", requirements: ["C1/C2 xorijiy til", "Nutq madaniyati"], relatedSubjects: ["Ingliz tili", "Ona tili", "Tarix"], educationPaths: ["O‘zDJTU", "SamDChTI"], salaryRange: "7–20 mln so‘m" },
  { title: "Jurnalist va Media Prodyuser", category: "Media", riasecCodes: ["A", "E"] as RiasecType[], description: "Tahliliy materiallar, podkastlar va hujjatli media loyihalar tayyorlash.", requirements: ["Yozuvchilik", "Intervyu", "Video ishlab chiqarish"], relatedSubjects: ["Ona tili", "Adabiyot", "Tarix"], educationPaths: ["O‘zJOKU"], salaryRange: "6–16 mln so‘m" },
  { title: "Aviatsiya Muhandisi", category: "Muhandislik", riasecCodes: ["R", "I"] as RiasecType[], description: "Havo kemalariga texnik xizmat ko‘rsatish va aerodinamik loyihalash.", requirements: ["Fizika", "Aerodinamika", "Ingliz tili"], relatedSubjects: ["Fizika", "Matematika", "Ingliz tili"], educationPaths: ["TDTU Aviatsiya fakulteti"], salaryRange: "10–28 mln so‘m" },
  { title: "Geolog va Konchilik Muhandisi", category: "Muhandislik", riasecCodes: ["R", "I"] as RiasecType[], description: "Foydali qazilma konlarini qidirish va xavfsiz qazib olish texnologiyalari.", requirements: ["Geologiya", "Kimyo", "Geodeziya"], relatedSubjects: ["Geografiya", "Kimyo", "Fizika"], educationPaths: ["Geologiya fanlari universiteti"], salaryRange: "9–26 mln so‘m" },
  { title: "HR Menejeri (Iste’dodlarni Rivojlantirish)", category: "Biznes", riasecCodes: ["S", "E"] as RiasecType[], description: "Kompaniyaga kuchli mutaxassislarni jalb qilish va jamoa madaniyatini qurish.", requirements: ["Psixologiya", "Muloqot", "Tashkilotchilik"], relatedSubjects: ["Ona tili", "Ingliz tili", "Iqtisodiyot"], educationPaths: ["TDIU", "MDIS"], salaryRange: "7–18 mln so‘m" },
  { title: "Bank va FinTech Mutaxassisi", category: "Moliya", riasecCodes: ["C", "E"] as RiasecType[], description: "Raqamli to‘lov tizimlari va zamonaviy bank mahsulotlarini rivojlantirish.", requirements: ["Moliya", "Raqamli savodxonlik", "Analitika"], relatedSubjects: ["Matematika", "Iqtisodiyot", "Informatika"], educationPaths: ["Toshkent Moliya Instituti", "TDIU"], salaryRange: "8–24 mln so‘m" },
  { title: "Stomatolog-Ortoped", category: "Tibbiyot", riasecCodes: ["R", "S"] as RiasecType[], description: "Zamonaviy 3D texnologiyalar yordamida tishlarni davolash va protezlash.", requirements: ["Anatomiya", "Nozik qo‘l motorikasi", "Kimyo"], relatedSubjects: ["Biologiya", "Kimyo"], educationPaths: ["Toshkent Davlat Stomatologiya Instituti"], salaryRange: "9–28 mln so‘m" },
];

async function main() {
  console.log("Seeding KasbYo‘l AI database...");
  const passHash = await argon2.hash("KasbYol2026!");

  // 1. School
  const school = await prisma.school.upsert({
    where: { id: "school-110" },
    update: {},
    create: {
      id: "school-110",
      name: "Toshkent shahri 110-ixtisoslashtirilgan maktab",
      region: "Toshkent shahri",
      district: "Mirobod tumani",
      address: "Tarash Shevchenko ko‘chasi, 14",
      phone: "+998712334455",
    },
  });

  // 2. Super Admin
  await prisma.user.upsert({
    where: { email: "superadmin@kasbyol.uz" },
    update: {},
    create: {
      email: "superadmin@kasbyol.uz",
      phone: "+998900000001",
      passwordHash: passHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      profile: {
        create: {
          firstName: "Sardor",
          lastName: "Valiyev",
          birthDate: new Date("1988-05-12"),
          gender: Gender.MALE,
        },
      },
    },
  });

  // 3. School Admin
  await prisma.user.upsert({
    where: { email: "admin@kasbyol.uz" },
    update: {},
    create: {
      email: "admin@kasbyol.uz",
      phone: "+998900000002",
      passwordHash: passHash,
      role: UserRole.ADMIN,
      emailVerified: true,
      schoolId: school.id,
      profile: {
        create: {
          firstName: "Azima",
          lastName: "Toshpulatova",
          birthDate: new Date("1990-03-18"),
          gender: Gender.FEMALE,
        },
      },
    },
  });

  // 4. Two Teachers
  const teacher1 = await prisma.user.upsert({
    where: { email: "teacher1@kasbyol.uz" },
    update: {},
    create: {
      email: "teacher1@kasbyol.uz",
      phone: "+998900000003",
      passwordHash: passHash,
      role: UserRole.TEACHER,
      emailVerified: true,
      schoolId: school.id,
      profile: {
        create: {
          firstName: "Jasur",
          lastName: "Raximov",
          birthDate: new Date("1992-09-10"),
          gender: Gender.MALE,
        },
      },
      teacherProfile: {
        create: {
          subjects: ["Informatika", "Matematika"],
          education: "TUIT Magistratura",
          experienceYears: 6,
        },
      },
    },
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: "teacher2@kasbyol.uz" },
    update: {},
    create: {
      email: "teacher2@kasbyol.uz",
      phone: "+998900000004",
      passwordHash: passHash,
      role: UserRole.TEACHER,
      emailVerified: true,
      schoolId: school.id,
      profile: {
        create: {
          firstName: "Dilnoza",
          lastName: "Karimova",
          birthDate: new Date("1994-11-22"),
          gender: Gender.FEMALE,
        },
      },
      teacherProfile: {
        create: {
          subjects: ["Fizika", "Ingliz tili"],
          education: "O‘zMU Bakalavr",
          experienceYears: 4,
        },
      },
    },
  });

  // 5. Three Classes
  const class8A = await prisma.class.upsert({
    where: { id: "class-8a" },
    update: {},
    create: {
      id: "class-8a",
      schoolId: school.id,
      name: "8-A",
      academicYear: "2026-2027",
      homeroomTeacherId: teacher1.id,
    },
  });

  await prisma.class.upsert({
    where: { id: "class-9b" },
    update: {},
    create: {
      id: "class-9b",
      schoolId: school.id,
      name: "9-B",
      academicYear: "2026-2027",
      homeroomTeacherId: teacher2.id,
    },
  });

  await prisma.class.upsert({
    where: { id: "class-10a" },
    update: {},
    create: {
      id: "class-10a",
      schoolId: school.id,
      name: "10-A",
      academicYear: "2026-2027",
      homeroomTeacherId: teacher1.id,
    },
  });

  // 6. Ten Students
  const studentNames = [
    ["Asadbek", "Karimov", Gender.MALE],
    ["Madina", "Rustamova", Gender.FEMALE],
    ["Nilufar", "Qodirova", Gender.FEMALE],
    ["Bobur", "Tursunov", Gender.MALE],
    ["Sevinch", "Alimova", Gender.FEMALE],
    ["Diyorbek", "Xolmatov", Gender.MALE],
    ["Zarina", "Mirzayeva", Gender.FEMALE],
    ["Shohruh", "Nazarov", Gender.MALE],
    ["Malika", "Ismoilova", Gender.FEMALE],
    ["Azizbek", "Yo‘ldoshev", Gender.MALE],
  ] as const;

  const createdStudents = [];
  for (let i = 0; i < studentNames.length; i++) {
    const [firstName, lastName, gender] = studentNames[i];
    const st = await prisma.user.upsert({
      where: { email: `student${i + 1}@kasbyol.uz` },
      update: {},
      create: {
        email: `student${i + 1}@kasbyol.uz`,
        phone: `+9989011100${String(i + 1).padStart(2, "0")}`,
        passwordHash: passHash,
        role: UserRole.STUDENT,
        emailVerified: true,
        schoolId: school.id,
        profile: {
          create: {
            firstName,
            lastName,
            birthDate: new Date("2011-04-15"),
            gender,
          },
        },
        studentProfile: {
          create: {
            grade: "8-sinf",
            region: "Toshkent shahri",
            district: "Mirobod tumani",
            interests: ["Dasturlash", "Matematika"],
            guardianConsent: {
              create: {
                guardianName: `${lastName} Ota-ona`,
                guardianPhone: `+9989099900${String(i + 1).padStart(2, "0")}`,
                approved: true,
                approvedAt: new Date(),
              },
            },
          },
        },
      },
    });
    createdStudents.push(st);
    await prisma.classMembership.upsert({
      where: { classId_studentId: { classId: class8A.id, studentId: st.id } },
      update: {},
      create: { classId: class8A.id, studentId: st.id },
    });
  }

  // 7. Four Courses with Sections, Lessons & Quiz
  const coursesData = [
    { id: "course-1", title: "Python va Algoritmlar Asoslari", description: "8–11-sinflar uchun zamonaviy dasturlash kursi", teacherId: teacher1.id },
    { id: "course-2", title: "Olimpiada Matematikasi va Mantiq", description: "Mantiqiy fikrlash va masalalar yechish", teacherId: teacher1.id },
    { id: "course-3", title: "Amaliy Fizika va Mexatronika", description: "Mexanika, elektr va robototexnika asoslari", teacherId: teacher2.id },
    { id: "course-4", title: "Kelajak Kasblari va Karyera Rejalashtirish", description: "RIASEC asosida ongli kasb tanlash", teacherId: teacher2.id },
  ];

  for (const c of coursesData) {
    const course = await prisma.course.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        schoolId: school.id,
        classId: class8A.id,
        teacherId: c.teacherId,
        title: c.title,
        description: c.description,
        status: CourseStatus.PUBLISHED,
        isPublic: true,
      },
    });

    const secCount = await prisma.section.count({ where: { courseId: course.id } });
    if (secCount === 0) {
      await prisma.section.create({
        data: {
          courseId: course.id,
          title: "1-modul: Kirish va Asosiy Tushunchalar",
          position: 1,
          lessons: {
            create: [
              { title: "1-dars: Kursga kirish va maqsadlar", content: "Ushbu darsda asosiy tushunchalar bilan tanishamiz.", position: 1, durationMin: 15 },
              { title: "2-dars: Amaliy mashg‘ulot", content: "Birinchi amaliy topshiriqni bajarish bo‘yicha qo‘llanma.", position: 2, durationMin: 25 },
            ],
          },
        },
      });
    }
  }

  // Enroll first student in course-1
  await prisma.enrollment.upsert({
    where: { courseId_studentId: { courseId: "course-1", studentId: createdStudents[0].id } },
    update: {},
    create: { courseId: "course-1", studentId: createdStudents[0].id },
  });

  // 8. 42 RIASEC Questions
  const qCount = await prisma.interestQuestion.count();
  if (qCount === 0) {
    await prisma.interestQuestion.createMany({
      data: RIASEC_42.map((q, idx) => ({
        text: q.text,
        category: q.category,
        orderNum: idx + 1,
      })),
    });
  }

  // 9. 30 Careers
  for (const career of CAREERS_30) {
    await prisma.career.upsert({
      where: { title: career.title },
      update: {},
      create: career,
    });
  }

  console.log("Seed completed: 1 School, 14 Users, 3 Classes, 4 Courses, 42 RIASEC Questions, 30 Careers.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
