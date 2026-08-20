const bundledModules = import.meta.glob('../../../data/**/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const bundledJson = new Map(
  Object.entries(bundledModules).map(([path, value]) => [
    `./${path.replace('../../../data/', '')}`,
    value,
  ]),
);

export async function loadJsonAsset<T>(path: string): Promise<T> {
  const bundled = bundledJson.get(path);
  if (bundled === undefined) {
    throw new Error(`Missing bundled data asset: ${path}`);
  }
  return bundled as T;
}
