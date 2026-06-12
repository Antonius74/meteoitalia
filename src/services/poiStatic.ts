import { Poi, PoiCategory } from '@/types/poi';

interface StaticCityPoi {
  coords: { lat: number; lon: number };
  pois: Array<Omit<Poi, 'id' | 'lat' | 'lon' | 'source'>>;
}

const def = (
  name: string,
  category: PoiCategory,
  description: string,
  indoor: boolean,
  opts: Partial<Pick<Poi, 'family' | 'bestMonths' | 'link'>> = {},
) => ({ name, category, description, indoor, family: opts.family ?? true, bestMonths: opts.bestMonths, link: opts.link });

export const STATIC_CITY_POI: Record<string, StaticCityPoi> = {
  roma: {
    coords: { lat: 41.9028, lon: 12.4964 },
    pois: [
      def('Colosseo e Foro Romano', 'monumento', 'Il simbolo della città imperiale, da visitare in mattinata.', false, { bestMonths: [3, 4, 5, 9, 10, 11] }),
      def('Musei Vaticani e Cappella Sistina', 'museo', 'Uno dei musei più visitati al mondo, ideale nelle giornate calde o piovose.', true, { link: 'https://www.museivaticani.va' }),
      def('Villa Borghese', 'parco', 'Il polmone verde di Roma con Galleria Borghese, laghetto e bioparco.', false, { bestMonths: [3, 4, 5, 9, 10, 11] }),
      def('Centro Storico e Piazza Navona', 'passeggiata', 'Cuore barocco della città, perfetto al tramonto nelle giornate asciutte.', false, { bestMonths: [4, 5, 6, 9, 10] }),
      def('Trastevere', 'locali', 'Quartiere della movida romana con ristoranti tipici.', false, { family: false }),
    ],
  },
  milano: {
    coords: { lat: 45.4642, lon: 9.19 },
    pois: [
      def('Duomo e Terrazze', 'monumento', 'Salita sulle terrazze del Duomo per una vista unica della città.', false, { link: 'https://www.duomomilano.it' }),
      def('Pinacoteca di Brera', 'museo', 'Una delle più importanti collezioni darte italiane.', true, { link: 'https://pinacotecabrera.org' }),
      def('Parco Sempione', 'parco', 'Grande parco urbano con Castello Sforzesco.', false, { bestMonths: [4, 5, 6, 9, 10] }),
      def('Navigli', 'locali', 'Zona dei canali con bar, ristoranti e vita notturna.', false, { family: false }),
      def('Museo Nazionale della Scienza e Tecnologia', 'museo', 'Ideale per famiglie, con sottomarino e sezione spazio.', true, { link: 'https://www.museoscienza.org' }),
    ],
  },
  napoli: {
    coords: { lat: 40.8518, lon: 14.2681 },
    pois: [
      def('Centro Storico UNESCO', 'passeggiata', 'I vicoli del centro storico, patrimonio UNESCO.', false, { bestMonths: [4, 5, 6, 9, 10] }),
      def('Museo Archeologico Nazionale', 'museo', 'Una delle più importanti collezioni archeologiche al mondo.', true, { link: 'https://www.museoarcheologiconapoli.it' }),
      def('Vesuvio e Pompei', 'montagna', 'Escursione sul vulcano e visita agli scavi.', false, { bestMonths: [4, 5, 6, 9, 10, 11] }),
      def('Castel dellOvo e Lungomare', 'spiaggia', 'Castello sul mare e passeggiata sul lungomare.', false, { bestMonths: [5, 6, 7, 8, 9] }),
    ],
  },
  torino: {
    coords: { lat: 45.0703, lon: 7.6869 },
    pois: [
      def('Museo Egizio', 'museo', 'Il più importante museo egizio al mondo dopo quello del Cairo.', true, { link: 'https://museoegizio.it' }),
      def('Reggia di Venaria', 'monumento', 'Palazzo UNESCO alle porte della città con giardini.', false, { link: 'https://lavenaria.it' }),
      def('Parco del Valentino', 'parco', 'Lungo il Po, con Borgo Medievale e orto botanico.', false, { bestMonths: [4, 5, 6, 9, 10] }),
      def('Sacra di San Michele', 'montagna', 'Abbazia medioevale a 40 min dalla città.', false, { bestMonths: [5, 6, 7, 8, 9, 10] }),
    ],
  },
  palermo: {
    coords: { lat: 38.1157, lon: 13.3615 },
    pois: [
      def('Cattedrale e Palazzo dei Normanni', 'monumento', 'I tesori normanni della città con la Cappella Palatina.', true),
      def('Vucciria e Ballarò', 'cibo', 'Mercati storici di street food.', false),
      def('Spiagge di Mondello', 'spiaggia', 'Spiaggia urbana con acqua cristallina.', false, { bestMonths: [5, 6, 7, 8, 9] }),
      def('Cefalù', 'spiaggia', 'Borgo medievale con spiaggia e cattedrale normanna.', false, { bestMonths: [5, 6, 7, 8, 9] }),
    ],
  },
  genova: {
    coords: { lat: 44.4056, lon: 8.9463 },
    pois: [
      def('Acquario di Genova', 'famiglia', 'Uno dei più grandi acquari dEuropa, ideale per bambini.', true, { link: 'https://www.acquariodigenova.it' }),
      def('Centro Storico e Via Garibaldi', 'passeggiata', 'I Rolli UNESCO, palazzi nobiliari del Cinquecento.', false),
      def('Boccadasse', 'spiaggia', 'Borgo di pescatori con piccola spiaggia.', false, { bestMonths: [5, 6, 7, 8, 9] }),
      def('Cinque Terre', 'natura', 'Sentieri UNESCO tra borghi sul mare.', false, { bestMonths: [4, 5, 6, 9, 10], link: 'https://www.cinqueterre.it' }),
    ],
  },
  bologna: {
    coords: { lat: 44.4949, lon: 11.3426 },
    pois: [
      def('Due Torri e Centro Storico', 'monumento', 'Salita sulla Torre degli Asinelli e portici UNESCO.', false),
      def('Pinacoteca Nazionale', 'museo', 'Importante collezione di arte emiliana.', true),
      def('Colline Bolognesi', 'natura', 'Trekking sulle colline a sud della città.', false, { bestMonths: [4, 5, 6, 9, 10] }),
      def('Mercato di Mezzo', 'cibo', 'Mercato coperto con cucina tipica bolognese.', true),
    ],
  },
  firenze: {
    coords: { lat: 43.7696, lon: 11.2558 },
    pois: [
      def('Uffizi e Corridoio Vasariano', 'museo', 'Una delle pinacoteche più famose al mondo.', true, { link: 'https://www.uffizi.it' }),
      def('Duomo e Cupola del Brunelleschi', 'monumento', 'Salita sulla cupola per una vista mozzafiato.', false),
      def('Ponte Vecchio e Lungarno', 'passeggiata', 'Passeggiata al tramonto lungo lArno.', false, { bestMonths: [4, 5, 6, 9, 10] }),
      def('Giardino di Boboli', 'parco', 'Giardino storico di Palazzo Pitti.', false, { bestMonths: [3, 4, 5, 6, 9, 10, 11] }),
    ],
  },
  bari: {
    coords: { lat: 41.1171, lon: 16.8719 },
    pois: [
      def('Bari Vecchia', 'passeggiata', 'Il cuore antico della città con la Cattedrale di San Nicola.', false),
      def('Spiagge di Polignano e Monopoli', 'spiaggia', 'Spiagge e calette a 20-30 min.', false, { bestMonths: [5, 6, 7, 8, 9] }),
      def('Castello Svevo', 'monumento', 'Fortezza medievale di Federico II.', false),
    ],
  },
  venezia: {
    coords: { lat: 45.4408, lon: 12.3155 },
    pois: [
      def('Piazza San Marco e Basilica', 'monumento', 'Il cuore di Venezia con la Basilica dorata.', false),
      def('Palazzo Ducale', 'museo', 'Residenza dei Dogi, con capolavori.', true, { link: 'https://palazzoducale.visitmuve.it' }),
      def('Gondola e Canali', 'passeggiata', 'Giro in gondola o vaporetto.', false, { bestMonths: [4, 5, 6, 9, 10] }),
      def('Murano e Burano', 'natura', 'Isole della laguna, celebri per il vetro e le case colorate.', false, { bestMonths: [4, 5, 6, 9, 10] }),
    ],
  },
  verona: {
    coords: { lat: 45.4384, lon: 10.9916 },
    pois: [
      def('Arena di Verona', 'monumento', 'Anfiteatro romano con spettacoli dopera in estate.', false, { bestMonths: [6, 7, 8, 9], link: 'https://www.arena.it' }),
      def('Casa di Giulietta', 'monumento', 'Il balcone di Giulietta e il cortile medievale.', false),
      def('Lago di Garda', 'lago', 'A 30 min, con parchi, terme e sport acquatici.', false, { bestMonths: [4, 5, 6, 7, 8, 9] }),
    ],
  },
  catania: {
    coords: { lat: 37.5079, lon: 15.083 },
    pois: [
      def('Etna', 'montagna', 'Escursione sul vulcano attivo più alto dEuropa.', false, { bestMonths: [4, 5, 6, 9, 10] }),
      def('Pescheria e Piazza Duomo', 'passeggiata', 'Il cuore barocco della città con mercato del pesce.', false),
      def('Taormina', 'natura', 'Borgo a picco sul mare con teatro greco.', false, { bestMonths: [4, 5, 6, 9, 10] }),
    ],
  },
  'new-york': {
    coords: { lat: 40.7128, lon: -74.006 },
    pois: [
      def('Central Park', 'parco', 'Il polmone verde di Manhattan.', false, { bestMonths: [4, 5, 6, 9, 10, 11] }),
      def('Metropolitan Museum', 'museo', 'Tra i più grandi musei del mondo.', true, { link: 'https://www.metmuseum.org' }),
      def('Statua della Libertà', 'monumento', 'Icona della città, raggiungibile in traghetto.', false),
      def('High Line', 'passeggiata', 'Parchetto sopraelevato su una vecchia ferrovia.', false, { bestMonths: [4, 5, 6, 9, 10, 11] }),
    ],
  },
  parigi: {
    coords: { lat: 48.8566, lon: 2.3522 },
    pois: [
      def('Torre Eiffel', 'monumento', 'Salita sulla torre simbolo della città.', false, { link: 'https://www.toureiffel.paris' }),
      def('Louvre', 'museo', 'Il museo più visitato al mondo.', true, { link: 'https://www.louvre.fr' }),
      def('Senna in Battello', 'passeggiata', 'Crociera sulla Senna, ideale anche nelle giornate nuvolose.', false, { bestMonths: [4, 5, 6, 7, 8, 9] }),
      def('Montmartre', 'passeggiata', 'Quartiere degli artisti con la Basilica del Sacré-Coeur.', false, { bestMonths: [4, 5, 6, 9, 10] }),
    ],
  },
  londra: {
    coords: { lat: 51.5074, lon: -0.1278 },
    pois: [
      def('British Museum', 'museo', 'Collezione universale con la Stele di Rosetta.', true, { link: 'https://www.britishmuseum.org' }),
      def('Hyde Park', 'parco', 'Il grande parco centrale, con Serpentine Lake.', false, { bestMonths: [5, 6, 7, 8, 9] }),
      def('Tower of London', 'monumento', 'La fortezza reale con i Gioielli della Corona.', false),
      def('Camden Town', 'locali', 'Quartiere alternativo con mercati e street food.', false, { family: false }),
    ],
  },
  tokyo: {
    coords: { lat: 35.6762, lon: 139.6503 },
    pois: [
      def('Senso-ji (Asakusa)', 'monumento', 'Il tempio buddhista più antico di Tokyo.', false),
      def('TeamLab Planets', 'museo', 'Installazioni immersive digitali.', true, { link: 'https://www.teamlab.art' }),
      def('Shibuya e Shinjuku', 'passeggiata', 'I quartieri più vitali di Tokyo.', false),
      def('Monte Fuji', 'montagna', 'Escursione al vulcano sacro, a 2 ore da Tokyo.', false, { bestMonths: [7, 8, 9] }),
    ],
  },
  woking: {
    coords: { lat: 51.3168, lon: -0.5604 },
    pois: [
      def('The Lightbox Gallery & Museum', 'museo', 'Galleria darte e museo nel centro di Woking.', true, { link: 'https://www.thelightbox.org.uk' }),
      def('Woking Palace', 'monumento', 'Sito storico di un palazzo reale Tudor.', false),
      def('Horsell Common', 'parco', 'Riserva naturale e punto di partenza per passeggiate.', false, { bestMonths: [4, 5, 6, 9, 10] }),
      def('RHS Garden Wisley', 'natura', 'Giardini botanici della Royal Horticultural Society.', false, { bestMonths: [4, 5, 6, 7, 8, 9], link: 'https://www.rhs.org.uk/gardens/wisley' }),
      def('Brookwood Cemetery', 'natura', 'Il cimitero più grande del Regno Unito, con percorsi storici.', false),
    ],
  },
  manchester: {
    coords: { lat: 53.4808, lon: -2.2426 },
    pois: [
      def('Manchester Art Gallery', 'museo', 'Importante collezione di arte inglese.', true, { link: 'https://manchesterartgallery.org' }),
      def('Old Trafford', 'sport', 'Stadio del Manchester United, tour guidati disponibili.', false, { family: true }),
      def('Science and Industry Museum', 'museo', 'Museo interattivo sulla rivoluzione industriale.', true),
      def('Heaton Park', 'parco', 'Uno dei parchi urbani più grandi dEuropa.', false),
    ],
  },
  edimburgo: {
    coords: { lat: 55.9533, lon: -3.1883 },
    pois: [
      def('Edinburgh Castle', 'monumento', 'Castello simbolo della Scozia, con i Gioielli della Corona.', false, { link: 'https://www.edinburghcastle.scot' }),
      def('Royal Mile', 'passeggiata', 'La strada principale del centro storico medievale.', false),
      def('National Museum of Scotland', 'museo', 'Museo completo dalla preistoria alla scienza moderna.', true),
      def('Arthur\'s Seat', 'montagna', 'Escursione sul vulcano estinto con vista sulla città.', false, { bestMonths: [5, 6, 7, 8, 9] }),
    ],
  },
  'san-paolo': {
    coords: { lat: -23.5505, lon: -46.6333 },
    pois: [
      def('Parque Ibirapuera', 'parco', 'Il polmone verde di San Paolo.', false, { bestMonths: [4, 5, 6, 9, 10] }),
      def('MASP', 'museo', 'Museo darte di San Paolo, icona modernista.', true, { link: 'https://masp.org.br' }),
      def('Avenida Paulista', 'passeggiata', 'La strada più vivace della città.', false),
      def('Mercado Municipal', 'cibo', 'Mercato storico con street food.', true),
    ],
  },
  mumbai: {
    coords: { lat: 19.076, lon: 72.8777 },
    pois: [
      def('Gateway of India', 'monumento', 'Arco monumentale affacciato sul mare.', false),
      def('Chhatrapati Shivaji Terminus', 'monumento', 'Stazione UNESCO in stile gotico-vittoriano.', false),
      def('Gateway of India - Elephanta Caves', 'natura', 'Traghetto per le grotte di Elephanta, sito UNESCO.', false, { bestMonths: [11, 12, 1, 2] }),
      def('Marine Drive', 'passeggiata', 'Lungomare al tramonto, la "Collana della Regina".', false),
    ],
  },
};

export const FALLBACK_GENERIC_POI: StaticCityPoi = {
  coords: { lat: 0, lon: 0 },
  pois: [
    def('Centro Storico', 'passeggiata', 'Il cuore storico della città, ideale per una passeggiata.', false, { bestMonths: [4, 5, 6, 9, 10] }),
    def('Museo Civico', 'museo', 'Il museo principale della città, con collezioni locali.', true),
    def('Parco Urbano', 'parco', 'Il parco cittadino, perfetto per relax e picnic.', false, { bestMonths: [4, 5, 6, 9, 10] }),
    def('Chiesa/Cattedrale principale', 'monumento', 'Ledificio religioso più importante del centro.', true),
  ],
};
