import * as fs from 'fs';

function scanDJI(filename) {
  const buffer = fs.readFileSync(filename);
  const str = buffer.toString('utf8');
  console.log(`\nScanning ${filename}`);
  
  const keywords = ['22.8', '120.4', 'latitude', 'longitude'];
  for (const kw of keywords) {
    const idx = str.indexOf(kw);
    if (idx !== -1) {
      console.log(`Found ${kw} around:`, str.substring(idx - 20, idx + 60).replace(/[^a-zA-Z0-9+\-., ]/g, ' '));
    }
  }
}

scanDJI('../data/DJI_20260501061403_0455_D.MP4');
