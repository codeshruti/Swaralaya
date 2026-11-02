export type Song = {
  id: string; title: string; composer: string; raga: string; tala: string; language: string;
  opening: string; // short opening line (pallavi), public-domain compositions only
  meaning: string;
};
export type Composer = {
  id: string; name: string; era: string; born: string; place: string; bio: string; signature: string;
};

export const composers: Composer[] = [
  { id: 'tyagaraja', name: 'Tyagaraja', era: '1767–1847', born: 'Thiruvarur', place: 'Thiruvaiyaru', signature: 'Ramabhakti, kritis in Telugu',
    bio: 'Saint-composer of the Carnatic trinity. He composed thousands of kritis in praise of Rama, and his Pancharatna kritis are a high point of the tradition.' },
  { id: 'dikshitar', name: 'Muthuswami Dikshitar', era: '1775–1835', born: 'Thiruvarur', place: 'Ettayapuram', signature: 'Guruguha mudra, Sanskrit kritis',
    bio: 'Scholar-composer known for grave, veena-like compositions in Sanskrit, with the signature "Guruguha". His kritis document temple deities and raga grammar.' },
  { id: 'syama', name: 'Syama Sastri', era: '1762–1827', born: 'Thiruvarur', place: 'Thanjavur', signature: 'Devi, intricate talas',
    bio: 'The eldest of the trinity, devoted to Goddess Kamakshi. Famous for the swarajatis and for rhythmic complexity wrapped in emotional intimacy.' },
  { id: 'purandara', name: 'Purandara Dasa', era: '1484–1564', born: 'Purandaragad', place: 'Hampi', signature: 'Pitamaha of Carnatic music',
    bio: 'Called the father of Carnatic music, he codified the teaching sequence (sarali, janti, alankaras) still used today and composed devotional songs in Kannada.' },
  { id: 'annamacharya', name: 'Annamacharya', era: '1408–1503', born: 'Tallapaka', place: 'Tirupati', signature: 'Sankirtanas to Venkateswara',
    bio: 'The earliest known composer of Telugu sankirtanas, he wrote tens of thousands of songs for Lord Venkateswara.' },
  { id: 'swati', name: 'Swathi Thirunal', era: '1813–1846', born: 'Thiruvananthapuram', place: 'Travancore', signature: 'Padmanabha mudra',
    bio: 'Maharaja of Travancore and a prolific composer in Sanskrit, Malayalam, Telugu and Hindi who patronised scholars of both Carnatic and Hindustani traditions.' },
  { id: 'subramania-bharati', name: 'Subramania Bharati', era: '1882–1921', born: 'Ettayapuram', place: 'Pondicherry', signature: 'Patriotic and devotional Tamil poetry',
    bio: 'Poet and freedom fighter whose Tamil songs are staples of the modern concert platform.' },
];

export const songs: Song[] = [
  { id: 'endaro', title: 'Endaro Mahanubhavulu', composer: 'tyagaraja', raga: 'Dheerasankarabharanam', tala: 'Adi', language: 'Telugu',
    opening: 'Endaro mahanubhavulu andariki vandanamulu', meaning: 'There are so many great souls; I bow to them all. The fifth Pancharatna kriti (Sri raga).' },
  { id: 'nagumomu', title: 'Nagumomu Ganaleni', composer: 'tyagaraja', raga: 'Abheri', tala: 'Adi', language: 'Telugu',
    opening: 'Nagumomu ganaleni naa jaali telisi', meaning: 'A plea to Rama: knowing my distress, will I not see your smiling face?' },
  { id: 'nannu-palimpa', title: 'Nannu Palimpa', composer: 'tyagaraja', raga: 'Mohanam', tala: 'Adi', language: 'Telugu',
    opening: 'Nannu palimpa nadachi vachitivo', meaning: 'Did you walk here to protect me, O Lord?' },
  { id: 'koluvamaregada', title: 'Koluvamaregada', composer: 'tyagaraja', raga: 'Todi', tala: 'Adi', language: 'Telugu',
    opening: 'Koluvamaregada Raghuveera koluvamaregada', meaning: 'Does Rama not hold court? A devout inquiry in Todi.' },
  { id: 'upacharamu', title: 'Upacharamu', composer: 'tyagaraja', raga: 'Bhairavi', tala: 'Adi', language: 'Telugu',
    opening: 'Upacharamu chesevarunnaru', meaning: 'Others may offer you ceremonial services; I offer only my devotion.' },
  { id: 'vatapi', title: 'Vatapi Ganapatim', composer: 'dikshitar', raga: 'Hamsadhwani', tala: 'Adi', language: 'Sanskrit',
    opening: 'Vatapi ganapatim bhaje ham', meaning: 'I worship Ganapati of Vatapi, remover of obstacles.' },
  { id: 'akshayalinga', title: 'Akshayalinga Vibho', composer: 'dikshitar', raga: 'Dheerasankarabharanam', tala: 'Rupaka', language: 'Sanskrit',
    opening: 'Akshayalinga vibho svayambho', meaning: 'A hymn to Shiva as the imperishable lingam.' },
  { id: 'meenakshi-me-mudam', title: 'Meenakshi Me Mudam', composer: 'dikshitar', raga: 'Gamakakriya', tala: 'Misra Chapu', language: 'Sanskrit',
    opening: 'Meenakshi me mudam dehi', meaning: 'O Meenakshi, grant me joy.' },
  { id: 'marivere', title: 'Marivere Gati', composer: 'syama', raga: 'Anandabhairavi', tala: 'Adi', language: 'Telugu',
    opening: 'Marivere gati evaramma', meaning: 'Who else is my refuge, O mother?' },
  { id: 'kamakshi-padamu', title: 'Kamakshi Padamu', composer: 'syama', raga: 'Anandabhairavi', tala: 'Adi', language: 'Telugu',
    opening: 'Kamakshi padamu', meaning: 'A devotional appeal to Kamakshi.' },
  { id: 'kamalajadala', title: 'Kamalajadala', composer: 'syama', raga: 'Bilahari', tala: 'Adi', language: 'Telugu',
    opening: 'Kamalajadala netri', meaning: 'Lotus-eyed Goddess, I seek your protection.' },
  { id: 'bhagyada-lakshmi', title: 'Bhagyada Lakshmi Baramma', composer: 'purandara', raga: 'Madhyamavati', tala: 'Adi', language: 'Kannada',
    opening: 'Bhagyada Lakshmi baaramma', meaning: 'Come, O Goddess of fortune, and bless our home.' },
  { id: 'venkatachala', title: 'Venkatachala Nilayam', composer: 'purandara', raga: 'Sindhubhairavi', tala: 'Adi', language: 'Kannada',
    opening: 'Venkatachala nilayam vaikuntha pura vasam', meaning: 'Praise to the dweller on Venkatachala hill.' },
  { id: 'brahmam-okate', title: 'Brahmam Okate', composer: 'annamacharya', raga: 'Bhoopalam', tala: 'Adi', language: 'Telugu',
    opening: 'Brahmam okate para brahmam okate', meaning: 'The Absolute is one; there is only one Supreme.' },
  { id: 'bhavayami', title: 'Bhavayami Gopalabalam', composer: 'swati', raga: 'Mohanam', tala: 'Adi', language: 'Sanskrit',
    opening: 'Bhavayami gopalabalam', meaning: 'I meditate on the child Krishna.' },
  { id: 'sakhi-re', title: 'Chinnanchiru Kiliye', composer: 'subramania-bharati', raga: 'Ragamalika', tala: 'Adi', language: 'Tamil',
    opening: 'Chinnanchiru kiliye kannamma', meaning: 'A loving address to a little child: "little parrot".' },
];

export const composerById = (id: string) => composers.find((c) => c.id === id);
export const songsByComposer = (id: string) => songs.filter((s) => s.composer === id);
export const songsByRaga = (name: string) =>
  songs.filter((s) => s.raga.toLowerCase().replace(/[^a-z]/g, '') === name.toLowerCase().replace(/[^a-z]/g, ''));
