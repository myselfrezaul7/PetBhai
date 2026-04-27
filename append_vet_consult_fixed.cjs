const fs = require('fs');
const path = require('path');
const mockDataPath = path.join(__dirname, 'backend', 'src', 'data', 'mockData.ts');

let content = fs.readFileSync(mockDataPath, 'utf16le');

const vetConsultBlock = `\n\n## 👨‍⚕️ ভেটের পরামর্শ\n\nঅবশ্যই মনে রাখবেন, ইন্টারনেটের কোনো তথ্যই একজন রেজিস্টার্ড ভেটেরিনারি চিকিৎসকের বিকল্প হতে পারে না। আপনার পোষা প্রাণীর যেকোনো জরুরি চিকিৎসায় এবং সঠিক ডায়াগনসিসের জন্য আজই **PetBhai** অ্যাপ বা ওয়েবসাইট থেকে একজন সার্টিফাইড ভেটের সাথে যোগাযোগ করুন।`;

let changed = 0;
let startIndex = 0;

while (true) {
  const marker = '## 📋 বিস্তারিত করণীয়';
  const idx = content.indexOf(marker, startIndex);
  if (idx === -1) break;

  // Check if it already has it
  const vetIdx = content.indexOf('## 👨‍⚕️ ভেটের পরামর্শ', idx);
  
  // Find the end of the content field.
  // The content field ends with a backtick, followed by a comma, followed by optional whitespace, followed by 'excerpt'
  const endMarker = `\`,`;
  let endIdx = content.indexOf(endMarker, idx);
  
  // Need to make sure this endMarker is actually the end of content, checking what comes next
  const textAfter = content.substring(endIdx, endIdx + 50);
  if (textAfter.includes('excerpt')) {
    // If it already has vet block between marker and endIdx, skip
    if (vetIdx !== -1 && vetIdx < endIdx) {
      startIndex = endIdx;
      continue;
    }
    
    // Insert vetConsultBlock before the backtick
    content = content.substring(0, endIdx) + vetConsultBlock + content.substring(endIdx);
    changed++;
    startIndex = endIdx + vetConsultBlock.length;
  } else {
    // try next backtick
    startIndex = idx + marker.length;
  }
}

fs.writeFileSync(mockDataPath, content, 'utf16le');
console.log('Appended Vet Consultation to ' + changed + ' articles.');
