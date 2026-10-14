// Locale-independent service data. Cluster titles and items live in the
// dictionaries (lib/i18n/dictionaries), listed in the same order as here.
export interface ServiceItem {
  title: string;
  detail?: string;
  description?: string;
}

export interface ServiceClusterMeta {
  index: string;
  accent: string;
}

export interface ServiceClusterCopy {
  title: string;
  items: ServiceItem[];
}

export type ServiceClusterData = ServiceClusterMeta & ServiceClusterCopy;

export const SERVICE_CLUSTER_META: ServiceClusterMeta[] = [
  { index: "01", accent: "#8a5cff" },
  { index: "02", accent: "#2b4bff" },
  { index: "03", accent: "#ff5a1f" },
  { index: "04", accent: "#c8ff4d" },
];

export function localizeServiceClusters(copy: ServiceClusterCopy[]): ServiceClusterData[] {
  return SERVICE_CLUSTER_META.map((meta, i) => ({ ...meta, ...copy[i] }));
}
