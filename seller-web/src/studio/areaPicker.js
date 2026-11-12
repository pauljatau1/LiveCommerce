export const normalArea = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
export function pickerAreas(config, state) {
  if (config?.areaOptions?.[state]) return config.areaOptions[state];
  // Compatibility with a still-running older API; the server remains the area source.
  return Object.entries(config?.areas?.[state] || {}).flatMap(([lga,names]) => [...new Set([lga,...names])].map(name => ({name,lga,group:'Areas',popularRank:-1})));
}
export function matchesArea(area, query) {
  const needle = normalArea(query);
  return !needle || [area.name, area.lga, ...(area.aliases || [])].some(value => normalArea(value).includes(needle));
}
export function areaGroups(areas, query = '') {
  const filtered = areas.filter(area => matchesArea(area,query));
  if (normalArea(query)) return [{label:'Search results',areas:filtered}];
  const popular = filtered.filter(area => area.popularRank >= 0).sort((a,b) => a.popularRank-b.popularRank);
  const uniquePopular = [...new Map(popular.map(area=>[area.name,area])).values()];
  const names = [...new Set(filtered.map(area=>area.group || 'Areas'))].sort((a,b)=>a==='Island'?-1:b==='Island'?1:a.localeCompare(b));
  return [{label:'Popular',areas:uniquePopular},...names.map(label=>({label,areas:filtered.filter(area=>(area.group || 'Areas')===label).sort((a,b)=>a.name.localeCompare(b.name)||a.lga.localeCompare(b.lga))}))].filter(group=>group.areas.length);
}
