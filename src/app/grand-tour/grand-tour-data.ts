import { GrandTourId, GrandTourInfo, Stage } from './grand-tour-types';

export const SCORITO_POINTS = {
  general: [
    { position: 1, points: 100 },
    { position: 2, points: 80 },
    { position: 3, points: 60 },
    { position: 4, points: 50 },
    { position: 5, points: 40 },
    { position: 6, points: 36 },
    { position: 7, points: 32 },
    { position: 8, points: 28 },
    { position: 9, points: 24 },
    { position: 10, points: 20 },
    { position: 11, points: 16 },
    { position: 12, points: 14 },
    { position: 13, points: 12 },
    { position: 14, points: 10 },
    { position: 15, points: 8 },
    { position: 16, points: 6 },
    { position: 17, points: 5 },
    { position: 18, points: 4 },
    { position: 19, points: 3 },
    { position: 20, points: 2 }
  ],
  points: [
    { position: 1, points: 80 },
    { position: 2, points: 60 },
    { position: 3, points: 40 },
    { position: 4, points: 30 },
    { position: 5, points: 20 }
  ],
  mountain: [
    { position: 1, points: 60 },
    { position: 2, points: 40 },
    { position: 3, points: 30 },
    { position: 4, points: 20 },
    { position: 5, points: 10 }
  ],
  youth: [
    { position: 1, points: 60 },
    { position: 2, points: 40 },
    { position: 3, points: 30 },
    { position: 4, points: 20 },
    { position: 5, points: 10 }
  ]
};

const generateStages = (tourType: GrandTourId): Stage[] => {
  const templates: { [key in GrandTourId]: { name: string, types: Stage['stageType'][], km: number[] } } = {
    tour: {
      name: 'Tour de France',
      types: [
        'hilly', 'flat', 'flat', 'mountain', 'flat',
        'flat', 'time_trial', 'flat', 'gravel', 'mountain',
        'mountain', 'flat', 'flat', 'mountain', 'mountain',
        'flat', 'hilly', 'mountain', 'mountain', 'mountain', 'time_trial'
      ],
      km: [
        206, 199, 230, 139, 177, 163, 25, 183, 199, 187,
        211, 203, 171, 151, 197, 188, 177, 179, 144, 132, 33
      ]
    },
    giro: {
      name: 'Giro d\'Italia',
      types: [
        'hilly', 'mountain', 'flat', 'flat', 'flat',
        'gravel', 'time_trial', 'mountain', 'flat', 'mountain',
        'flat', 'hilly', 'flat', 'time_trial', 'mountain',
        'mountain', 'mountain', 'flat', 'mountain', 'mountain', 'flat'
      ],
      km: [
        140, 161, 166, 190, 178, 180, 40, 152, 214, 142,
        207, 193, 179, 31, 222, 202, 159, 178, 157, 184, 125
      ]
    },
    vuelta: {
      name: 'Vuelta a España',
      types: [
        'time_trial', 'hilly', 'flat', 'mountain', 'flat',
        'mountain', 'flat', 'mountain', 'mountain', 'mountain',
        'flat', 'mountain', 'mountain', 'flat', 'mountain',
        'mountain', 'flat', 'mountain', 'hilly', 'mountain', 'time_trial'
      ],
      km: [
        12, 194, 191, 170, 177, 185, 180, 159, 178, 160,
        166, 137, 176, 200, 143, 181, 141, 179, 173, 172, 25
      ]
    }
  };

  const current = templates[tourType];
  return Array.from({ length: 21 }, (_, i) => {
    const num = i + 1;
    const stageType = current.types[i] || 'flat';
    let difficulty = 2;
    if (stageType === 'mountain') difficulty = 5;
    else if (stageType === 'hilly' || stageType === 'gravel') difficulty = 3;
    else if (stageType === 'time_trial') difficulty = 4;
    else difficulty = 1;

    return {
      stageNumber: num,
      date: `Etappe ${num}`,
      startLocation: `Start Rit ${num}`,
      endLocation: `Finish Rit ${num}`,
      distanceKm: current.km[i] || 175,
      stageType: stageType,
      difficulty: difficulty,
      description: `${stageType === 'flat' ? 'Vlakke sprintetappe' : stageType === 'mountain' ? 'Zware bergrit met aankomst bergop' : stageType === 'time_trial' ? 'Individuele tijdrit' : stageType === 'gravel' ? 'Kasseien- of gravelrit' : 'Heuveletappe voor aanvallers'}`
    };
  });
};

export const GRAND_TOURS_DATA: { [key in GrandTourId]: GrandTourInfo } = {
  tour: {
    id: 'tour',
    name: 'Tour de France',
    nickname: 'La Grande Boucle',
    country: 'Frankrijk',
    flag: '🇫🇷',
    accentColor: '#eab308',
    gradientClass: 'theme-tour',
    leaderJerseyName: 'Gele Trui (AK)',
    pointsJerseyName: 'Groene Trui (Sprint)',
    mountainJerseyName: 'Bolletjestrui (Berg)',
    youthJerseyName: 'Witte Trui (Jongeren)',
    stages: generateStages('tour')
  },
  giro: {
    id: 'giro',
    name: 'Giro d\'Italia',
    nickname: 'La Corsa Rosa',
    country: 'Italië',
    flag: '🇮🇹',
    accentColor: '#db2777',
    gradientClass: 'theme-giro',
    leaderJerseyName: 'Maglia Rosa (AK)',
    pointsJerseyName: 'Maglia Ciclamino (Punten)',
    mountainJerseyName: 'Maglia Azzurra (Berg)',
    youthJerseyName: 'Maglia Bianca (Jongeren)',
    stages: generateStages('giro')
  },
  vuelta: {
    id: 'vuelta',
    name: 'Vuelta a España',
    nickname: 'La Ronda Española',
    country: 'Spanje',
    flag: '🇪🇸',
    accentColor: '#dc2626',
    gradientClass: 'theme-vuelta',
    leaderJerseyName: 'La Roja (AK)',
    pointsJerseyName: 'Groene Trui (Punten)',
    mountainJerseyName: 'Bolletjestrui (Berg)',
    youthJerseyName: 'Witte Trui (Jongeren)',
    stages: generateStages('vuelta')
  }
};
