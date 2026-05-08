import type { Corrections } from '../types';

export function exportCorrections(corrections: Corrections) {
  if (Object.keys(corrections).length === 0) {
    alert('目前沒有校正資料可匯出');
    return;
  }
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(corrections, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchorNode.setAttribute("download", `map_corrections_${dateStr}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

export function importCorrections(file: File): Promise<Corrections> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const obj = JSON.parse(event.target?.result as string);
        resolve(obj);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}
