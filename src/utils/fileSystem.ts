const SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic', 'mp4', 'mov'];

/** 檢查是否支援 File System Access API (showDirectoryPicker) */
export function supportsDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/** 使用 File System Access API 選擇資料夾（桌面版 Chrome/Edge） */
export async function openDirectory(): Promise<File[]> {
  try {
    // @ts-ignore: File System Access API
    const dirHandle = await window.showDirectoryPicker();
    const files: File[] = [];
    await traverseDirectory(dirHandle, files);
    return files;
  } catch (err) {
    console.error('Directory selection failed or cancelled', err);
    return [];
  }
}

/** 使用 <input type="file"> 選擇多個檔案（iOS / Firefox fallback） */
export function openFilePicker(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*,.heic,.HEIC';
    
    input.onchange = () => {
      const files = Array.from(input.files || []).filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return SUPPORTED_EXTENSIONS.includes(ext || '');
      });
      resolve(files);
    };
    
    // 使用者取消時
    input.oncancel = () => resolve([]);
    
    input.click();
  });
}

async function traverseDirectory(dirHandle: any, files: File[]) {
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext || '')) {
        files.push(file);
      }
    } else if (entry.kind === 'directory') {
      await traverseDirectory(entry, files);
    }
  }
}
