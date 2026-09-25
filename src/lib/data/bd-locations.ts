/** All 8 official divisions of Bangladesh */
export const BD_DIVISIONS = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
] as const;

export type BDDivision = (typeof BD_DIVISIONS)[number];

/**
 * Districts organised by division.
 * Total: 64 districts across 8 divisions.
 */
export const BD_DISTRICTS: Record<BDDivision, string[]> = {
  Dhaka: [
    'Dhaka',
    'Gazipur',
    'Narayanganj',
    'Munshiganj',
    'Manikganj',
    'Narsingdi',
    'Kishoreganj',
    'Tangail',
    'Faridpur',
    'Gopalganj',
    'Madaripur',
    'Rajbari',
    'Shariatpur',
  ],
  Chattogram: [
    'Chattogram',
    "Cox's Bazar",
    'Bandarban',
    'Rangamati',
    'Khagrachhari',
    'Noakhali',
    'Feni',
    'Lakshmipur',
    'Comilla',
    'Chandpur',
    'Brahmanbaria',
  ],
  Rajshahi: [
    'Rajshahi',
    'Chapai Nawabganj',
    'Naogaon',
    'Natore',
    'Bogura',
    'Sirajganj',
    'Pabna',
    'Joypurhat',
  ],
  Khulna: [
    'Khulna',
    'Jashore',
    'Satkhira',
    'Bagerhat',
    'Narail',
    'Magura',
    'Jhenaidah',
    'Kushtia',
    'Meherpur',
    'Chuadanga',
  ],
  Barishal: [
    'Barishal',
    'Bhola',
    'Patuakhali',
    'Pirojpur',
    'Jhalokathi',
    'Barguna',
  ],
  Sylhet: [
    'Sylhet',
    'Moulvibazar',
    'Habiganj',
    'Sunamganj',
  ],
  Rangpur: [
    'Rangpur',
    'Dinajpur',
    'Kurigram',
    'Gaibandha',
    'Nilphamari',
    'Lalmonirhat',
    'Thakurgaon',
    'Panchagarh',
  ],
  Mymensingh: [
    'Mymensingh',
    'Jamalpur',
    'Sherpur',
    'Netrokona',
  ],
};

/** Bangla division names (parallel to BD_DIVISIONS order) */
export const BD_DIVISIONS_BN: Record<BDDivision, string> = {
  Dhaka:       'ঢাকা',
  Chattogram:  'চট্টগ্রাম',
  Rajshahi:    'রাজশাহী',
  Khulna:      'খুলনা',
  Barishal:    'বরিশাল',
  Sylhet:      'সিলেট',
  Rangpur:     'রংপুর',
  Mymensingh:  'ময়মনসিংহ',
};

/** Bangla district names keyed by English name */
export const BD_DISTRICTS_BN: Record<string, string> = {
  // Dhaka
  Dhaka: 'ঢাকা', Gazipur: 'গাজীপুর', Narayanganj: 'নারায়ণগঞ্জ',
  Munshiganj: 'মুন্সিগঞ্জ', Manikganj: 'মানিকগঞ্জ', Narsingdi: 'নরসিংদী',
  Kishoreganj: 'কিশোরগঞ্জ', Tangail: 'টাঙ্গাইল', Faridpur: 'ফরিদপুর',
  Gopalganj: 'গোপালগঞ্জ', Madaripur: 'মাদারীপুর', Rajbari: 'রাজবাড়ী',
  Shariatpur: 'শরিয়তপুর',
  // Chattogram
  Chattogram: 'চট্টগ্রাম', "Cox's Bazar": 'কক্সবাজার', Bandarban: 'বান্দরবান',
  Rangamati: 'রাঙ্গামাটি', Khagrachhari: 'খাগড়াছড়ি', Noakhali: 'নোয়াখালী',
  Feni: 'ফেনী', Lakshmipur: 'লক্ষ্মীপুর', Comilla: 'কুমিল্লা',
  Chandpur: 'চাঁদপুর', Brahmanbaria: 'ব্রাহ্মণবাড়িয়া',
  // Rajshahi
  Rajshahi: 'রাজশাহী', 'Chapai Nawabganj': 'চাঁপাইনবাবগঞ্জ', Naogaon: 'নওগাঁ',
  Natore: 'নাটোর', Bogura: 'বগুড়া', Sirajganj: 'সিরাজগঞ্জ',
  Pabna: 'পাবনা', Joypurhat: 'জয়পুরহাট',
  // Khulna
  Khulna: 'খুলনা', Jashore: 'যশোর', Satkhira: 'সাতক্ষীরা',
  Bagerhat: 'বাগেরহাট', Narail: 'নড়াইল', Magura: 'মাগুরা',
  Jhenaidah: 'ঝিনাইদহ', Kushtia: 'কুষ্টিয়া', Meherpur: 'মেহেরপুর',
  Chuadanga: 'চুয়াডাঙ্গা',
  // Barishal
  Barishal: 'বরিশাল', Bhola: 'ভোলা', Patuakhali: 'পটুয়াখালী',
  Pirojpur: 'পিরোজপুর', Jhalokathi: 'ঝালকাঠি', Barguna: 'বরগুনা',
  // Sylhet
  Sylhet: 'সিলেট', Moulvibazar: 'মৌলভীবাজার', Habiganj: 'হবিগঞ্জ',
  Sunamganj: 'সুনামগঞ্জ',
  // Rangpur
  Rangpur: 'রংপুর', Dinajpur: 'দিনাজপুর', Kurigram: 'কুড়িগ্রাম',
  Gaibandha: 'গাইবান্ধা', Nilphamari: 'নীলফামারী', Lalmonirhat: 'লালমনিরহাট',
  Thakurgaon: 'ঠাকুরগাঁও', Panchagarh: 'পঞ্চগড়',
  // Mymensingh
  Mymensingh: 'ময়মনসিংহ', Jamalpur: 'জামালপুর', Sherpur: 'শেরপুর',
  Netrokona: 'নেত্রকোনা',
};
