export type Raga = {
  id: string; name: string; kind: 'melakarta' | 'janya'; number?: number; parent?: number;
  arohana: string; avarohana: string; moods: string[]; time: string; description: string;
  notes: number[]; // pitch classes used (0-11)
  famous?: string[];
};

const SEMI: Record<string, number> = {
  S: 0, R1: 1, R2: 2, R3: 3, G1: 2, G2: 3, G3: 4, M1: 5, M2: 6, P: 7,
  D1: 8, D2: 9, D3: 10, N1: 9, N2: 10, N3: 11,
};
export const semitones = (s: string) => s.split(/\s+/).filter(Boolean).map((x) => SEMI[x]);
export const NOTE_LABEL = ['S', 'R1', 'R2', 'G2', 'G3', 'M1', 'M2', 'P', 'D1', 'D2', 'D3', 'N3'];
export const NOTE_LABEL_FULL = ['S', 'R1', 'R2/G1', 'R3/G2', 'G3', 'M1', 'M2', 'P', 'D1', 'D2/N1', 'D3/N2', 'N3'];

const MELA_NAMES = `Kanakangi,Ratnangi,Ganamurti,Vanaspati,Manavati,Tanarupi,Senavati,Hanumatodi,Dhenuka,Natakapriya,Kokilapriya,Rupavati,Gayakapriya,Vakulabharanam,Mayamalavagowla,Chakravakam,Suryakantam,Hatakambari,Jhankaradhvani,Natabhairavi,Keeravani,Kharaharapriya,Gaurimanohari,Varunapriya,Mararanjani,Charukesi,Sarasangi,Harikambhoji,Dheerasankarabharanam,Naganandini,Yagapriya,Ragavardhini,Gangeyabhushani,Vagadheeshwari,Shulini,Chalanata,Salagam,Jalarnavam,Jhalavarali,Navaneetam,Pavani,Raghupriya,Gavambodhi,Bhavapriya,Shubhapantuvarali,Shadvidamargini,Suvarnangi,Divyamani,Dhavalambari,Namanarayani,Kamavardhini,Ramapriya,Gamanashrama,Vishwambari,Shamalangi,Shanmukhapriya,Simhendramadhyamam,Hemavati,Dharmavati,Neetimati,Kantamani,Rishabhapriya,Latangi,Vachaspati,Mechakalyani,Chitrambari,Sucharitra,Jyotiswarupini,Dhatuvardhini,Nasikabhushani,Kosalam,Rasikapriya`.split(',');
export const CHAKRAS = ['Indu', 'Netra', 'Agni', 'Veda', 'Bana', 'Rutu', 'Rishi', 'Vasu', 'Brahma', 'Disi', 'Rudra', 'Aditya'];
const RG = [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]];
const DN = [[8, 9], [8, 10], [8, 11], [9, 10], [9, 11], [10, 11]];
const RN = ['R1', 'R2', 'R3'], GN = ['G1', 'G2', 'G3'];
const rName = (s: number) => (s === 1 ? 'R1' : s === 2 ? 'R2' : 'R3');
const gName = (s: number) => (s === 2 ? 'G1' : s === 3 ? 'G2' : 'G3');
const dName = (s: number) => (s === 8 ? 'D1' : s === 9 ? 'D2' : 'D3');
const nName = (s: number) => (s === 9 ? 'N1' : s === 10 ? 'N2' : 'N3');
void RN; void GN;

const MELA_MOODS: Record<number, [string[], string, string]> = {
  8: [['Pathos', 'Devotional'], 'Early morning', 'Deeply expressive and plaintive; a showpiece for elaborate alapana.'],
  15: [['Devotional', 'Serene'], 'Dawn', 'The first raga taught to every student; grounded, bright with dawn-like calm.'],
  22: [['Romantic', 'Joyful'], 'Evening', 'Rich in possibility; a mother of countless ragas and a favourite of Tyagaraja.'],
  28: [['Joyful', 'Majestic'], 'Evening', 'Regal and sweet, with a distinctive kaitaisi-nishada colour.'],
  29: [['Majestic', 'Joyful'], 'Anytime', 'Equivalent to the Western major scale; bright, confident and expansive.'],
  20: [['Pathos', 'Romantic'], 'Night', 'Equivalent to natural minor; tender, searching.'],
  26: [['Pathos', 'Romantic'], 'Evening', 'Exotic augmented-second leap gives a yearning, poignant mood.'],
  56: [['Heroic', 'Majestic'], 'Evening', 'Bold and intense, with a strong dramatic presence.'],
  65: [['Devotional', 'Majestic'], 'Evening', 'Grand and luminous; the prati-madhyama counterpart of Shankarabharanam.'],
  16: [['Devotional', 'Serene'], 'Dawn', 'Pure and meditative; the Hindustani Bhairav cousin.'],
  21: [['Pathos', 'Serene'], 'Night', 'Gentle sorrow and depth; relatively recent in popularity.'],
};

export const melakartas: Raga[] = MELA_NAMES.map((name, i) => {
  const n = i + 1;
  const [r, g] = RG[Math.floor(((n - 1) % 36) / 6)];
  const [d, nn] = DN[(n - 1) % 6];
  const m = n <= 36 ? 5 : 6;
  const mn = n <= 36 ? 'M1' : 'M2';
  const seq = ['S', rName(r), gName(g), mn, 'P', dName(d), nName(nn)];
  const info = MELA_MOODS[n];
  return {
    id: `mela-${n}`, name, kind: 'melakarta', number: n,
    arohana: [...seq, 'S'].join(' '), avarohana: ['S', ...seq.slice(1).reverse()].join(' '),
    moods: info ? info[0] : n <= 36 ? ['Serene'] : ['Majestic'],
    time: info ? info[1] : 'Anytime',
    description: info ? info[2] : `Melakarta #${n}, in the ${CHAKRAS[Math.floor((n - 1) / 6)]} chakra. A complete seven-note scale (sampurna) from which janya ragas are derived.`,
    notes: [0, r, g, m, 7, d, nn],
  };
});

type J = [string, number, string, string, string[], string, string, string[]?];
const J_DATA: J[] = [
  ['Mohanam', 28, 'S R2 G3 P D2 S', 'S D2 P G3 R2 S', ['Joyful', 'Serene'], 'Anytime', 'A bright pentatonic raga with a sweet, open feeling. Loved by beginners and masters alike.', ['Nannu Palimpa', 'Evvari Bodhana']],
  ['Hamsadhwani', 29, 'S R2 G3 P N3 S', 'S N3 P G3 R2 S', ['Joyful', 'Devotional'], 'Anytime', 'Auspicious and uplifting; traditionally sung to begin concerts.', ['Vatapi Ganapatim']],
  ['Abhogi', 22, 'S R2 G2 M1 D2 S', 'S D2 M1 G2 R2 S', ['Serene', 'Romantic'], 'Night', 'Smooth and weighty; a late-night raga with a calm intensity.', ['Evarura']],
  ['Bilahari', 29, 'S R2 M1 P D2 S', 'S N3 D2 P M1 G3 R2 S', ['Joyful', 'Devotional'], 'Morning', 'Cheerful and devotional; vakra phrases give it a distinctive lilt.', ['Parulanna Matamu']],
  ['Kalyani', 65, 'S R2 G3 M2 P D2 N3 S', 'S N3 D2 P M2 G3 R2 S', ['Devotional', 'Majestic'], 'Evening', 'Also called Mechakalyani, a grand and auspicious raga.', ['Vanajakshi', 'Etavunara']],
  ['Bhairavi', 20, 'S R2 G2 M1 P D1 N2 S', 'S N2 D1 P M1 G2 R2 S', ['Pathos', 'Devotional'], 'Morning', 'The queen of ragas; deeply emotional, often sung to conclude a concert.', ['Upacharamu']],
  ['Todi', 8, 'S R1 G2 M1 P D1 N2 S', 'S N2 D1 P M1 G2 R1 S', ['Pathos', 'Devotional'], 'Morning', 'Hanumatodi\'s popular name: heavy, serious, intensely moving.', ['Koluvamaregada']],
  ['Kambhoji', 28, 'S R2 G3 M1 P D2 S', 'S N2 D2 P M1 G3 R2 S', ['Joyful', 'Majestic'], 'Evening', 'Rich and ornamented; a favourite for extended alapana and pallavi.', ['Evaribodhana']],
  ['Mayamalavagowla', 15, 'S R1 G3 M1 P D1 N3 S', 'S N3 D1 P M1 G3 R1 S', ['Devotional', 'Serene'], 'Dawn', 'The foundational scale of Carnatic learning, used in beginner exercises.', ['Tulasidala']],
  ['Sahana', 28, 'S R2 G3 M1 P M1 D2 N2 S', 'S N2 D2 P M1 G3 R2 G3 M1 R2 S', ['Romantic', 'Serene'], 'Night', 'Sweet, intimate and slightly teasing.', ['Giripai']],
  ['Hindolam', 20, 'S G2 M1 D1 N2 S', 'S N2 D1 M1 G2 S', ['Meditative', 'Serene'], 'Night', 'Pentatonic and tranquil, with a floating, contemplative quality.', ['Samaja Vara Gamana']],
  ['Madhyamavati', 22, 'S R2 M1 P N2 S', 'S N2 P M1 R2 S', ['Serene', 'Devotional'], 'Anytime', 'Peaceful and auspicious; traditionally sung at the end of a concert.', ['Rama Katha Sudha']],
  ['Keeravani', 21, 'S R2 G2 M1 P D1 N3 S', 'S N3 D1 P M1 G2 R2 S', ['Pathos', 'Romantic'], 'Night', 'Harmonic-minor-like. Soulful and widely used in film music.', ['Kaligiyunte']],
  ['Charukesi', 26, 'S R2 G3 M1 P D1 N2 S', 'S N2 D1 P M1 G3 R2 S', ['Pathos', 'Romantic'], 'Evening', 'Melancholic yet sweet; the major-third and minor-sixth tension is its signature.', ['Adamodigalade']],
  ['Anandabhairavi', 20, 'S G2 R2 G2 M1 P D2 P S', 'S N2 D1 P M1 G2 R2 S', ['Devotional', 'Pathos'], 'Anytime', 'Tender and loving; many beloved Syama Sastri compositions are set here.', ['Marivere Gati']],
  ['Begada', 29, 'S G3 R2 G3 M1 P D2 N3 D2 S', 'S N3 D2 P M1 G3 R2 S', ['Joyful', 'Romantic'], 'Evening', 'Curvy (vakra) and charming; both playful and affectionate.', ['Nadaloludai']],
  ['Saveri', 15, 'S R1 M1 P D1 S', 'S N3 D1 P M1 G3 R1 S', ['Pathos', 'Devotional'], 'Dawn', 'Expressive and plaintive, with a distinctive pathos.', ['Sarasiruha']],
  ['Reethigowla', 22, 'S G2 R2 G2 M1 N2 D2 N2 S', 'S N2 M1 G2 R2 G2 S', ['Pathos', 'Romantic'], 'Evening', 'Winding, emotionally rich phrases; both yearning and tender.', ['Janani Ninuvina']],
  ['Shanmukhapriya', 56, 'S R2 G2 M2 P D1 N2 S', 'S N2 D1 P M2 G2 R2 S', ['Heroic', 'Majestic'], 'Evening', 'The 56th melakarta, bold and dramatic.', ['Sarasa Sama Dana']],
  ['Hamsanandi', 53, 'S R1 G3 M2 P D2 N3 S', 'S N3 D2 P M2 G3 R1 S', ['Joyful', 'Romantic'], 'Evening', 'Colourful and affectionate, hovering between sweetness and wistfulness.'],
  ['Natakurinji', 28, 'S G3 R2 G3 M1 D2 N2 S', 'S N2 D2 M1 G3 R2 G3 S', ['Pathos', 'Romantic'], 'Night', 'Poignant and wistful; a classical raga of longing.', ['Chalamela']],
  ['Revathi', 15, 'S R1 M1 P N3 S', 'S N3 P M1 R1 S', ['Meditative', 'Serene'], 'Night', 'Pentatonic, calm, pastoral and gently rocking.'],
  ['Sindhubhairavi', 10, 'S R2 G2 M1 P D1 N2 S', 'S N2 D1 P M1 G2 R2 S', ['Pathos', 'Romantic'], 'Anytime', 'Folk-flavoured and tender; often sung at the end of a concert as a light piece.'],
  ['Bageshri', 22, 'S R2 G2 M1 D2 N2 S', 'S N2 D2 M1 G2 R2 S', ['Romantic', 'Serene'], 'Late night', 'A night raga of tenderness and longing.'],
  ['Valaji', 29, 'S R2 G3 P D2 N3 S', 'S N3 D2 P G3 R2 S', ['Joyful', 'Heroic'], 'Anytime', 'Pentatonic variants of Shankarabharanam used in bright, energetic compositions.'],
].map((r) => r) as J[];

export const janyas: Raga[] = J_DATA.map(([name, parent, ar, av, moods, time, desc, famous]) => ({
  id: `janya-${name.toLowerCase()}`, name, kind: 'janya', parent, arohana: ar, avarohana: av,
  moods, time, description: desc, famous,
  notes: Array.from(new Set([...semitones(ar), ...semitones(av)])).filter((x) => x < 12).sort((a, b) => a - b),
}));

export const allRagas: Raga[] = [...melakartas, ...janyas];
export const ragaById = (id: string) => allRagas.find((r) => r.id === id);
export const ragaByName = (n: string) => allRagas.find((r) => r.name.toLowerCase() === n.toLowerCase());
export const childrenOf = (num: number) => janyas.filter((j) => j.parent === num);
export const parentOf = (r: Raga) => (r.parent ? melakartas[r.parent - 1] : undefined);
export const MOODS = ['Devotional', 'Serene', 'Joyful', 'Pathos', 'Heroic', 'Romantic', 'Meditative', 'Majestic'];

export function compareRagas(a: Raga, b: Raga) {
  const A = new Set(a.notes), B = new Set(b.notes);
  const shared = a.notes.filter((n) => B.has(n));
  const onlyA = a.notes.filter((n) => !B.has(n));
  const onlyB = b.notes.filter((n) => !A.has(n));
  const sim = shared.length / new Set([...a.notes, ...b.notes]).size;
  return { shared, onlyA, onlyB, similarity: sim };
}
