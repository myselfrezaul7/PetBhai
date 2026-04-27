const fs = require('fs');
const path = require('path');
const mockDataPath = path.join(__dirname, 'backend', 'src', 'data', 'mockData.ts');

let content = fs.readFileSync(mockDataPath, 'utf16le');

const vetConsultBlock = `\n\n## 👨‍⚕️ ভেটের পরামর্শ\n\nঅবশ্যই মনে রাখবেন, ইন্টারনেটের কোনো তথ্যই একজন রেজিস্টার্ড ভেটেরিনারি চিকিৎসকের বিকল্প হতে পারে না। আপনার পোষা প্রাণীর যেকোনো জরুরি চিকিৎসায় এবং সঠিক ডায়াগনসিসের জন্য আজই **PetBhai** অ্যাপ বা ওয়েবসাইট থেকে একজন সার্টিফাইড ভেটের সাথে যোগাযোগ করুন।`;

const ids = [45, 48, 52, 55, 62, 63, 67, 68, 69, 70, 1000, 1001, 1002, 1003, 1004, 211, 212, 213];
let changed = 0;

for (const id of ids) {
  const marker = `'id': ${id},`;
  const idIdx = content.indexOf(marker);
  if (idIdx === -1) {
    console.log('Not found:', id);
    continue;
  }
  
  const excerptMarker = `'excerpt':`;
  const excerptIdx = content.indexOf(excerptMarker, idIdx);
  
  if (excerptIdx === -1) continue;
  
  let backtickIdx = content.lastIndexOf('`', excerptIdx);
  
  if (backtickIdx === -1 || backtickIdx < idIdx) continue;
  
  const contentSection = content.substring(idIdx, backtickIdx);
  if (contentSection.includes('ভেটের পরামর্শ')) continue;
  
  content = content.substring(0, backtickIdx) + vetConsultBlock + content.substring(backtickIdx);
  changed++;
}

fs.writeFileSync(mockDataPath, content, 'utf16le');
console.log('Appended Vet Consultation to ' + changed + ' articles.');
