export interface Building {
  name: string;
  // Building centre, used by the "Simulate being at…" select. Null for places with no fixed point.
  lat: number | null;
  lng: number | null;
}

export const buildings: Building[] = [
  {
    name: 'Aula Barat',
    lat: -6.89246,
    lng: 107.609824,
  },
  {
    name: 'Aula Timur',
    lat: -6.892378,
    lng: 107.611055,
  },
  {
    name: 'Basic Science A',
    lat: -6.891791,
    lng: 107.608458,
  },
  {
    name: 'Basic Science B',
    lat: -6.889023,
    lng: 107.611914,
  },
  {
    name: 'CADL',
    lat: -6.888327,
    lng: 107.609553,
  },
  {
    name: 'CAS (Center for Advanced Sciences)',
    lat: -6.888273,
    lng: 107.611263,
  },
  {
    name: 'CC Barat',
    lat: -6.891257,
    lng: 107.609996,
  },
  {
    name: 'CC Timur',
    lat: -6.891239,
    lng: 107.610765,
  },
  {
    name: 'CRiMSE',
    lat: -6.888273,
    lng: 107.610005,
  },
  {
    name: 'Farmasi (School of Pharmacy)',
    lat: -6.890127,
    lng: 107.610982,
  },
  {
    name: 'Fisika',
    lat: -6.891356,
    lng: 107.609272,
  },
  {
    name: 'GKU Barat',
    lat: -6.89038,
    lng: 107.608829,
  },
  {
    name: 'GKU Timur',
    lat: -6.890389,
    lng: 107.612086,
  },
  {
    name: 'Gedung Kimia',
    lat: -6.889322,
    lng: 107.611996,
  },
  {
    name: 'Gedung Kuliah Matematika',
    lat: -6.888517,
    lng: 107.60872,
  },
  {
    name: 'Gedung Seni Rupa (FSRD)',
    lat: -6.892252,
    lng: 107.611598,
  },
  {
    name: 'Lab Fisika Dasar',
    lat: -6.889059,
    lng: 107.61072,
  },
  {
    name: 'Lab Hidrolika',
    lat: -6.890108,
    lng: 107.611978,
  },
  {
    name: 'Labtek I',
    lat: -6.889213,
    lng: 107.611172,
  },
  {
    name: 'Labtek IV',
    lat: -6.888417,
    lng: 107.612113,
  },
  {
    name: 'Labtek IX A',
    lat: -6.89151,
    lng: 107.611398,
  },
  {
    name: 'Labtek IX B',
    lat: -6.891854,
    lng: 107.611905,
  },
  {
    name: 'Labtek IX C',
    lat: -6.891519,
    lng: 107.611896,
  },
  {
    name: 'Labtek V',
    lat: -6.890588,
    lng: 107.609788,
  },
  {
    name: 'Labtek VI',
    lat: -6.890154,
    lng: 107.609715,
  },
  {
    name: 'Labtek VIII',
    lat: -6.890579,
    lng: 107.610955,
  },
  {
    name: 'Labtek X',
    lat: -6.888933,
    lng: 107.609453,
  },
  {
    name: 'Labtek XI',
    lat: -6.889566,
    lng: 107.609453,
  },
  {
    name: 'Masjid Salman',
    lat: -6.89369,
    lng: 107.611199,
  },
  {
    name: 'Oktagon',
    lat: -6.889041,
    lng: 107.610068,
  },
  {
    name: 'Perpustakaan Pusat',
    lat: -6.888273,
    lng: 107.610729,
  },
  {
    name: 'TVST',
    lat: -6.889484,
    lng: 107.610068,
  },
  {
    name: 'Teknik Lingkungan',
    lat: -6.891203,
    lng: 107.611643,
  },
  {
    name: 'Main gate (Jl. Ganesha)',
    lat: -6.893057,
    lng: 107.610385,
  },
  {
    name: 'Outdoor area / walkway',
    lat: null,
    lng: null,
  },
];
