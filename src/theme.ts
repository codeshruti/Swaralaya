export const colors = {
  bg: '#140A0C', surface: '#21121A', surface2: '#2C1A24', border: '#3D2733',
  text: '#F6EBDD', muted: '#B9A596', gold: '#E8B04A', saffron: '#F08A3C',
  rose: '#D6547A', teal: '#4FB3A9', danger: '#E5584F',
};
export const radius = { sm: 10, md: 16, lg: 24 };
export const space = (n: number) => n * 4;
export const font = { display: 'Georgia, "Times New Roman", serif' as const };
export const moodColors: Record<string, string> = {
  Devotional: '#E8B04A', Serene: '#4FB3A9', Joyful: '#F08A3C', Pathos: '#D6547A',
  Heroic: '#C9503C', Romantic: '#C77DBA', Meditative: '#7E9BD6', Majestic: '#B98B3E',
};
