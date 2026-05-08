import exifr from 'exifr';
import * as fs from 'fs';

async function run() {
  const file = fs.readFileSync('../data/IMG_3194.MOV');
  try {
    const gps = await exifr.gps(file);
    console.log('GPS:', gps);
    const parsed = await exifr.parse(file);
    console.log('Parsed:', parsed);
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
