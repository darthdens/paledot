// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
export const dateCopy = {
  en: { date: 'Simulation date', play: 'Play', pause: 'Pause', today: 'Today', day: '1 day/s', month: '1 month/s', year: '1 year/s', source: 'Planet positions calculated with astronomy-engine' },
  fr: { date: 'Date de simulation', play: 'Lecture', pause: 'Pause', today: "Aujourd’hui", day: '1 jour/s', month: '1 mois/s', year: '1 an/s', source: 'Positions planétaires calculées avec astronomy-engine' },
  es: { date: 'Fecha de simulación', play: 'Reproducir', pause: 'Pausa', today: 'Hoy', day: '1 día/s', month: '1 mes/s', year: '1 año/s', source: 'Posiciones planetarias calculadas con astronomy-engine' },
  pt: { date: 'Data da simulação', play: 'Reproduzir', pause: 'Pausa', today: 'Hoje', day: '1 dia/s', month: '1 mês/s', year: '1 ano/s', source: 'Posições planetárias calculadas com astronomy-engine' },
  it: { date: 'Data della simulazione', play: 'Riproduci', pause: 'Pausa', today: 'Oggi', day: '1 giorno/s', month: '1 mese/s', year: '1 anno/s', source: 'Posizioni planetarie calcolate con astronomy-engine' },
  de: { date: 'Simulationsdatum', play: 'Abspielen', pause: 'Pause', today: 'Heute', day: '1 Tag/s', month: '1 Monat/s', year: '1 Jahr/s', source: 'Planetenpositionen mit astronomy-engine berechnet' },
};
export function formatSimDate(time: number, locale: string) {
  const date = new Date(time);
  const day = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date).toLocaleUpperCase(locale);
  const hours = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' }).format(date);
  return `${day} · ${hours} UTC`;
}