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

// Every card shares the same accent.
export const SERVICE_ACCENT = "#8a5cff";

export const SERVICE_CLUSTER_META: ServiceClusterMeta[] = [
  { index: "01", accent: SERVICE_ACCENT },
  { index: "02", accent: SERVICE_ACCENT },
  { index: "03", accent: SERVICE_ACCENT },
  { index: "04", accent: SERVICE_ACCENT },
];

export function localizeServiceClusters(copy: ServiceClusterCopy[]): ServiceClusterData[] {
  return SERVICE_CLUSTER_META.map((meta, i) => ({ ...meta, ...copy[i] }));
}
