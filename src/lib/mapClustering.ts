// ---------- Map Clustering ----------

export interface GeoProfile {
  id: string;
  lat: number;
  lng: number;
  name: string;
  photo: string;
  mode: string;
}

export interface Cluster {
  id: string;
  lat: number;
  lng: number;
  profiles: GeoProfile[];
  count: number;
}

/**
 * Haversine distance between two geo points in km.
 */
function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Cluster radius in km based on zoom level.
 * Lower zoom = wider clusters.
 */
function getClusterRadius(zoom: number): number {
  // zoom 10 -> ~5km, zoom 14 -> ~0.5km, zoom 18+ -> ~0.05km
  return Math.max(0.05, 50 / Math.pow(2, zoom - 8));
}

/**
 * Simple greedy clustering algorithm.
 *
 * 1. Sort profiles by lat (deterministic order).
 * 2. For each profile, find the nearest existing cluster within radius.
 * 3. If found, add to that cluster and update centroid.
 * 4. If not, create a new cluster.
 *
 * At high zoom levels the radius shrinks so each profile is its own cluster.
 */
export function clusterProfiles(
  profiles: GeoProfile[],
  zoom: number,
): Cluster[] {
  if (profiles.length === 0) return [];

  const radius = getClusterRadius(zoom);
  const sorted = [...profiles].sort((a, b) => a.lat - b.lat);
  const clusters: Cluster[] = [];

  for (const p of sorted) {
    let bestCluster: Cluster | null = null;
    let bestDist = Infinity;

    for (const c of clusters) {
      const dist = haversine(p.lat, p.lng, c.lat, c.lng);
      if (dist < radius && dist < bestDist) {
        bestDist = dist;
        bestCluster = c;
      }
    }

    if (bestCluster) {
      // Update centroid (weighted average)
      const n = bestCluster.count;
      bestCluster.lat = (bestCluster.lat * n + p.lat) / (n + 1);
      bestCluster.lng = (bestCluster.lng * n + p.lng) / (n + 1);
      bestCluster.profiles.push(p);
      bestCluster.count += 1;
    } else {
      clusters.push({
        id: `cluster-${p.id}`,
        lat: p.lat,
        lng: p.lng,
        profiles: [p],
        count: 1,
      });
    }
  }

  return clusters;
}

/**
 * Formats a cluster for display on the map.
 * Single-profile clusters return the profile info directly.
 * Multi-profile clusters return a summary.
 */
export function formatCluster(cluster: Cluster): {
  label: string;
  showCount: boolean;
} {
  if (cluster.count === 1) {
    return { label: cluster.profiles[0].name, showCount: false };
  }
  return {
    label: `${cluster.count} personnes`,
    showCount: true,
  };
}
