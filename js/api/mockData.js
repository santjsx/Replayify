/* ==========================================================================
   Album Finder - Static Mock Sandbox Collections
   ========================================================================== */

export const MOCK_ARTISTS = [
  {
    id: 'tame_impala',
    name: 'Tame Impala',
    images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&h=400&q=80' }],
    followers: { total: 6420512 },
    popularity: 88,
    genres: ['psychedelic rock', 'indie pop', 'neo-psychedelia']
  },
  {
    id: 'daft_punk',
    name: 'Daft Punk',
    images: [{ url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&h=400&q=80' }],
    followers: { total: 9812543 },
    popularity: 92,
    genres: ['electronic', 'french house', 'synthpop']
  },
  {
    id: 'billie_eilish',
    name: 'Billie Eilish',
    images: [{ url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&h=400&q=80' }],
    followers: { total: 49208312 },
    popularity: 95,
    genres: ['dark pop', 'electro-pop', 'alternative']
  },
  {
    id: 'radiohead',
    name: 'Radiohead',
    images: [{ url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=400&h=400&q=80' }],
    followers: { total: 8203512 },
    popularity: 86,
    genres: ['alternative rock', 'art rock', 'experimental']
  }
];

export const MOCK_ALBUMS = [
  {
    id: 'currents',
    name: 'Currents',
    images: [{ url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=400&q=80' }],
    release_date: '2015-07-17',
    album_type: 'album',
    total_tracks: 13,
    artists: [{ id: 'tame_impala', name: 'Tame Impala' }],
    label: 'Interscope Records',
    popularity: 85
  },
  {
    id: 'random_access_memories',
    name: 'Random Access Memories',
    images: [{ url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=400&h=400&q=80' }],
    release_date: '2013-05-17',
    album_type: 'album',
    total_tracks: 13,
    artists: [{ id: 'daft_punk', name: 'Daft Punk' }],
    label: 'Columbia Records',
    popularity: 90
  },
  {
    id: 'hit_me_hard_and_soft',
    name: 'Hit Me Hard and Soft',
    images: [{ url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=400&h=400&q=80' }],
    release_date: '2024-05-17',
    album_type: 'album',
    total_tracks: 10,
    artists: [{ id: 'billie_eilish', name: 'Billie Eilish' }],
    label: 'Darkroom/Interscope',
    popularity: 94
  },
  {
    id: 'kid_a',
    name: 'Kid A',
    images: [{ url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&h=400&q=80' }],
    release_date: '2000-10-02',
    album_type: 'album',
    total_tracks: 10,
    artists: [{ id: 'radiohead', name: 'Radiohead' }],
    label: 'Parlophone Records',
    popularity: 81
  }
];

// Royalty-free MP3 test items for preview audio streams (SoundHelix)
export const PREVIEW_MP3_1 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
export const PREVIEW_MP3_2 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';
export const PREVIEW_MP3_3 = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3';

export const MOCK_TOP_TRACKS = {
  tame_impala: [
    { id: 'let_it_happen', name: 'Let It Happen', duration_ms: 467000, explicit: false, preview_url: PREVIEW_MP3_1, popularity: 82 },
    { id: 'the_less_i_know', name: 'The Less I Know the Better', duration_ms: 217000, explicit: true, preview_url: PREVIEW_MP3_2, popularity: 89 },
    { id: 'borderline', name: 'Borderline', duration_ms: 237000, explicit: false, preview_url: PREVIEW_MP3_3, popularity: 78 }
  ],
  daft_punk: [
    { id: 'get_lucky', name: 'Get Lucky (feat. Pharrell Williams)', duration_ms: 249000, explicit: false, preview_url: PREVIEW_MP3_1, popularity: 87 },
    { id: 'instant_crush', name: 'Instant Crush (feat. Julian Casablancas)', duration_ms: 337000, explicit: false, preview_url: PREVIEW_MP3_2, popularity: 84 },
    { id: 'one_more_time', name: 'One More Time', duration_ms: 320000, explicit: false, preview_url: PREVIEW_MP3_3, popularity: 80 }
  ],
  billie_eilish: [
    { id: 'lunch', name: 'LUNCH', duration_ms: 180000, explicit: true, preview_url: PREVIEW_MP3_1, popularity: 93 },
    { id: 'chihiro', name: 'CHIHIRO', duration_ms: 303000, explicit: false, preview_url: PREVIEW_MP3_2, popularity: 91 },
    { id: 'birds_of_a_feather', name: 'BIRDS OF A FEATHER', duration_ms: 210000, explicit: false, preview_url: PREVIEW_MP3_3, popularity: 95 }
  ],
  radiohead: [
    { id: 'creep', name: 'Creep', duration_ms: 238000, explicit: true, preview_url: PREVIEW_MP3_1, popularity: 86 },
    { id: 'karma_police', name: 'Karma Police', duration_ms: 261000, explicit: false, preview_url: PREVIEW_MP3_2, popularity: 78 },
    { id: 'weird_fishes', name: 'Weird Fishes/Arpeggi', duration_ms: 318000, explicit: false, preview_url: PREVIEW_MP3_3, popularity: 75 }
  ]
};

export const MOCK_ALBUM_DETAILS = {
  currents: {
    id: 'currents',
    name: 'Currents',
    images: [{ url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=400&q=80' }],
    release_date: '2015-07-17',
    artists: [{ id: 'tame_impala', name: 'Tame Impala' }],
    label: 'Interscope Records',
    copyrights: [{ text: '© 2015 Tame Impala, under exclusive license to Interscope Records' }],
    external_urls: { spotify: 'https://open.spotify.com/album/79dfqiaQJ7nN71991aTf3t' },
    tracks: {
      items: [
        { id: 'let_it_happen', name: 'Let It Happen', duration_ms: 467000, explicit: false, preview_url: PREVIEW_MP3_1, track_number: 1 },
        { id: 'nangs', name: 'Nangs', duration_ms: 107000, explicit: false, preview_url: PREVIEW_MP3_2, track_number: 2 },
        { id: 'the_moment', name: 'The Moment', duration_ms: 255000, explicit: false, preview_url: PREVIEW_MP3_3, track_number: 3 },
        { id: 'the_less_i_know', name: 'The Less I Know the Better', duration_ms: 217000, explicit: true, preview_url: PREVIEW_MP3_1, track_number: 4 },
        { id: 'disciples', name: 'Disciples', duration_ms: 108000, explicit: false, preview_url: PREVIEW_MP3_2, track_number: 5 }
      ]
    }
  },
  random_access_memories: {
    id: 'random_access_memories',
    name: 'Random Access Memories',
    images: [{ url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=400&h=400&q=80' }],
    release_date: '2013-05-17',
    artists: [{ id: 'daft_punk', name: 'Daft Punk' }],
    label: 'Columbia Records',
    copyrights: [{ text: '© 2013 Columbia Records, a division of Sony Music' }],
    external_urls: { spotify: 'https://open.spotify.com/album/4m28wb762qXJ8pu6765tZ2' },
    tracks: {
      items: [
        { id: 'give_life_back_to_music', name: 'Give Life Back to Music', duration_ms: 274000, explicit: false, preview_url: PREVIEW_MP3_1, track_number: 1 },
        { id: 'game_of_love', name: 'The Game of Love', duration_ms: 322000, explicit: false, preview_url: PREVIEW_MP3_2, track_number: 2 },
        { id: 'giorgio_by_moroder', name: 'Giorgio by Moroder', duration_ms: 544000, explicit: false, preview_url: PREVIEW_MP3_3, track_number: 3 },
        { id: 'instant_crush', name: 'Instant Crush (feat. Julian Casablancas)', duration_ms: 337000, explicit: false, preview_url: PREVIEW_MP3_1, track_number: 4 },
        { id: 'get_lucky', name: 'Get Lucky (feat. Pharrell Williams)', duration_ms: 249000, explicit: false, preview_url: PREVIEW_MP3_2, track_number: 5 }
      ]
    }
  },
  hit_me_hard_and_soft: {
    id: 'hit_me_hard_and_soft',
    name: 'Hit Me Hard and Soft',
    images: [{ url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=400&h=400&q=80' }],
    release_date: '2024-05-17',
    artists: [{ id: 'billie_eilish', name: 'Billie Eilish' }],
    label: 'Darkroom/Interscope Records',
    copyrights: [{ text: '© 2024 Billie Eilish, under exclusive license to Interscope Records' }],
    external_urls: { spotify: 'https://open.spotify.com/album/7aJuG46RsnH748cIhK1j2t' },
    tracks: {
      items: [
        { id: 'skinny', name: 'SKINNY', duration_ms: 219000, explicit: false, preview_url: PREVIEW_MP3_1, track_number: 1 },
        { id: 'lunch', name: 'LUNCH', duration_ms: 180000, explicit: true, preview_url: PREVIEW_MP3_2, track_number: 2 },
        { id: 'chihiro', name: 'CHIHIRO', duration_ms: 303000, explicit: false, preview_url: PREVIEW_MP3_3, track_number: 3 },
        { id: 'birds_of_a_feather', name: 'BIRDS OF A FEATHER', duration_ms: 210000, explicit: false, preview_url: PREVIEW_MP3_1, track_number: 4 },
        { id: 'wildflower', name: 'WILDFLOWER', duration_ms: 261000, explicit: false, preview_url: PREVIEW_MP3_2, track_number: 5 }
      ]
    }
  },
  kid_a: {
    id: 'kid_a',
    name: 'Kid A',
    images: [{ url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&h=400&q=80' }],
    release_date: '2000-10-02',
    artists: [{ id: 'radiohead', name: 'Radiohead' }],
    label: 'XL Recordings',
    copyrights: [{ text: '© 2000 XL Recordings, under exclusive license from Parlophone' }],
    external_urls: { spotify: 'https://open.spotify.com/album/19SSvyq05i794w997zeq2j' },
    tracks: {
      items: [
        { id: 'everything_in_its_right_place', name: 'Everything In Its Right Place', duration_ms: 251000, explicit: false, preview_url: PREVIEW_MP3_1, track_number: 1 },
        { id: 'kid_a_track', name: 'Kid A', duration_ms: 284000, explicit: false, preview_url: PREVIEW_MP3_2, track_number: 2 },
        { id: 'the_national_anthem', name: 'The National Anthem', duration_ms: 351000, explicit: false, preview_url: PREVIEW_MP3_3, track_number: 3 },
        { id: 'how_to_disappear_completely', name: 'How to Disappear Completely', duration_ms: 356000, explicit: false, preview_url: PREVIEW_MP3_1, track_number: 4 },
        { id: 'optimistic', name: 'Optimistic', duration_ms: 315000, explicit: false, preview_url: PREVIEW_MP3_2, track_number: 5 }
      ]
    }
  }
};
