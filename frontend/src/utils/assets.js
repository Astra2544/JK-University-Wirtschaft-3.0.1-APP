const API_URL = process.env.REACT_APP_BACKEND_URL;

const assetCache = new Map();
const pendingRequests = new Map();

export async function loadAsset(assetKey) {
  if (assetCache.has(assetKey)) {
    return assetCache.get(assetKey);
  }

  if (pendingRequests.has(assetKey)) {
    return pendingRequests.get(assetKey);
  }

  const promise = fetch(`${API_URL}/api/assets/${assetKey}`)
    .then(res => {
      if (!res.ok) throw new Error('Asset not found');
      return res.json();
    })
    .then(data => {
      assetCache.set(assetKey, data.data_url);
      pendingRequests.delete(assetKey);
      return data.data_url;
    })
    .catch(err => {
      pendingRequests.delete(assetKey);
      console.warn(`Failed to load asset: ${assetKey}`, err);
      return null;
    });

  pendingRequests.set(assetKey, promise);
  return promise;
}

export async function loadAssetsBatch(assetKeys) {
  const uncached = assetKeys.filter(k => !assetCache.has(k));

  if (uncached.length === 0) {
    const result = {};
    assetKeys.forEach(k => {
      result[k] = assetCache.get(k);
    });
    return result;
  }

  try {
    const res = await fetch(`${API_URL}/api/assets-batch?keys=${encodeURIComponent(uncached.join(','))}`);
    if (!res.ok) throw new Error('Failed to load assets batch');
    const data = await res.json();

    Object.entries(data).forEach(([key, value]) => {
      if (value && value.data_url) {
        assetCache.set(key, value.data_url);
      }
    });
  } catch (err) {
    console.warn('Failed to load assets batch', err);
  }

  const result = {};
  assetKeys.forEach(k => {
    result[k] = assetCache.get(k) || null;
  });
  return result;
}

export function getCachedAsset(assetKey) {
  return assetCache.get(assetKey) || null;
}

export function preloadAssets(assetKeys) {
  return loadAssetsBatch(assetKeys);
}

export const ASSET_KEYS = {
  LOGO: 'logo',
  OEHLI_LOGO: 'oehli-logo',
  HERO_MAIN: 'background/hero-main',
  HERO_SMALL1: 'background/hero-small1',
  HERO_SMALL2: 'background/hero-small2',
  ABOUT_MAIN: 'background/about-main',
  ABOUT_SMALL: 'background/about-small',
  SLIDE_1: 'background/slide-1',
  SLIDE_2: 'background/slide-2',
  SLIDE_3: 'background/slide-3',
  SLIDE_4: 'background/slide-4',
  SLIDE_5: 'background/slide-5',
  BG_1: 'background/bg-1',
  BG_2: 'background/bg-2',
  BG_3: 'background/bg-3',
  BG_4: 'background/bg-4',
  BG_5: 'background/bg-5',
  BG_6: 'background/bg-6',
  BG_7: 'background/bg-7',
  BG_8: 'background/bg-8',
  GALLERY_1: 'background/gallery-1',
  GALLERY_2: 'background/gallery-2',
  GALLERY_3: 'background/gallery-3',
  GALLERY_4: 'background/gallery-4',
  GALLERY_5: 'background/gallery-5',
  PORTRAIT_MAXIMILIAN: 'portrait/maximilian-pilsner',
  PORTRAIT_LUCIA: 'portrait/lucia-schoisswohl',
  PORTRAIT_STEFAN: 'portrait/stefan-gstoettenmayr',
  PORTRAIT_THERESA: 'portrait/theresa-kloibhofer',
  PORTRAIT_MICHAEL: 'portrait/michael-tremetzberger',
  PORTRAIT_TEAM: 'portrait/team-transparent',
};

export const TEAM_ASSET_MAP = {
  'Maximilian-Pilsner': 'team/maximilian-pilsner',
  'Lucia-Schoisswohl': 'team/lucia-schoisswohl',
  'Stefan-Gstoettenmayer': 'team/stefan-gstoettenmayer',
  'Sebastian-Jensen': 'team/sebastian-jensen',
  'Carolina-Goetsch': 'team/carolina-goetsch',
  'Simon-Plangger': 'team/simon-plangger',
  'Matej-Kromka': 'team/matej-kromka',
  'Florian-Zimmermann': 'team/florian-zimmermann',
  'Maxim-Tafincev': 'team/maxim-tafincev',
  'Simon-Reisinger': 'team/simon-reisinger',
  'Paul-Mairleitner': 'team/paul-mairleitner',
  'Sarika-Bimanaviona': 'team/sarika-bimanaviona',
  'Thomas-Kreilinger': 'team/thomas-kreilinger',
  'Lilli-Huber': 'team/lilli-huber',
  'Theresa-Kloibhofer': 'team/theresa-kloibhofer',
  'Philipp-Bergsmann': 'team/philipp-bergsmann',
  'Paul-Hamminger': 'team/paul-hamminger',
  'Alex-Sighireanu': 'team/alex-sighireanu',
  'Victoria-Riener': 'team/victoria-riener',
  'placeholder-missing': 'team/placeholder-missing',
};

export function getTeamAssetKey(imagePath) {
  const filename = imagePath.split('/').pop().replace('.png', '');
  return TEAM_ASSET_MAP[filename] || null;
}
