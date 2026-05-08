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

async function traverseDirectory(dirHandle: any, files: File[]) {
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'heic', 'mp4', 'mov'].includes(ext || '')) {
        files.push(file);
      }
    } else if (entry.kind === 'directory') {
      await traverseDirectory(entry, files);
    }
  }
}
