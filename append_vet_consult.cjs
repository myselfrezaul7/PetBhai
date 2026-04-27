const fs = require('fs');
const path = require('path');
const mockDataPath = path.join(__dirname, 'backend', 'src', 'data', 'mockData.ts');

let content = fs.readFileSync(mockDataPath, 'utf16le');

const vetConsultBlock = `\n\n## 👨‍⚕️ ভেটের পরামর্শ\n\nঅবশ্যই মনে রাখবেন, ইন্টারনেটের কোনো তথ্যই একজন রেজিস্টার্ড ভেটেরিনারি চিকিৎসকের বিকল্প হতে পারে না। আপনার পোষা প্রাণীর যেকোনো জরুরি চিকিৎসায় এবং সঠিক ডায়াগনসিসের জন্য আজই **PetBhai** অ্যাপ বা ওয়েবসাইট থেকে একজন সার্টিফাইড ভেটের সাথে যোগাযোগ করুন।`;

// We will split the file by `'content': \`` or `'content': '`
// It's safer to use regex to find all instances of detailed guide and append it before the closing backtick of the content string.

let changed = 0;

const newContent = content.replace(/## 📋 বিস্তারিত করণীয়([\s\S]*?)(`\s*,\s*'excerpt'|'\s*,\s*'excerpt')/g, (match, details, closing) => {
  if (details.includes('ভেটের পরামর্শ') || details.includes('PetBhai অ্যাপ')) {
    return match; // already added
  }
  
  changed++;
  return '## 📋 বিস্তারিত করণীয়' + details + vetConsultBlock + closing;
});

fs.writeFileSync(mockDataPath, newContent, 'utf16le');
console.log('Appended Vet Consultation to ' + changed + ' articles.');
