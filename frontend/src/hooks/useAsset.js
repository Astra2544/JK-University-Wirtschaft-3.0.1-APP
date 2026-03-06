import { useState, useEffect } from 'react';
import { loadAsset, loadAssetsBatch, getCachedAsset } from '../utils/assets';

export function useAsset(assetKey) {
  const [src, setSrc] = useState(() => getCachedAsset(assetKey));
  const [loading, setLoading] = useState(!getCachedAsset(assetKey));

  useEffect(() => {
    if (!assetKey) return;

    const cached = getCachedAsset(assetKey);
    if (cached) {
      setSrc(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    loadAsset(assetKey).then(dataUrl => {
      setSrc(dataUrl);
      setLoading(false);
    });
  }, [assetKey]);

  return { src, loading };
}

export function useAssets(assetKeys) {
  const [assets, setAssets] = useState(() => {
    const initial = {};
    assetKeys.forEach(k => {
      initial[k] = getCachedAsset(k);
    });
    return initial;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assetKeys || assetKeys.length === 0) {
      setLoading(false);
      return;
    }

    loadAssetsBatch(assetKeys).then(data => {
      setAssets(data);
      setLoading(false);
    });
  }, [assetKeys.join(',')]);

  return { assets, loading };
}

export default useAsset;
