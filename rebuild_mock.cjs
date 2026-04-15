const fs = require('fs');
const path = require('path');

const mockDataPath = path.join(__dirname, 'backend', 'src', 'data', 'mockData.ts');

try {
  let content = fs.readFileSync(mockDataPath, 'utf16le');

  // 1. Find boundaries
  const arrayStartStr = 'export const MOCK_ARTICLES: any[] = [';
  const arrayStartIndex = content.indexOf(arrayStartStr);
  
  if (arrayStartIndex === -1) {
    throw new Error('Could not find MOCK_ARTICLES array start!');
  }

  const prefix = content.substring(0, arrayStartIndex + arrayStartStr.length + 1);

  // We need to find the end of MOCK_ARTICLES array.
  // The next export is MOCK_ANIMALS
  const arrayEndStr = 'export const MOCK_ANIMALS: Animal[] = [';
  const nextExportIndex = content.indexOf(arrayEndStr);
  if (nextExportIndex === -1) {
    throw new Error('Could not find MOCK_ANIMALS export to mark suffix boundary!');
  }

  // Backtrack to find the ]; before MOCK_ANIMALS
  const mockArticlesContent = content.substring(arrayStartIndex, nextExportIndex);
  const closingIndexRel = mockArticlesContent.lastIndexOf('];');
  const closingIndex = arrayStartIndex + closingIndexRel;

  const suffix = content.substring(closingIndex + 2); // after ];

  // 2. Extract good articles using their IDs (45, 48, 52, 55, 62, 63, 67, 68, 69, 70, 1000-1006)
  const goodIds = [45, 48, 52, 55, 62, 63, 67, 68, 69, 70, 1000, 1001, 1002, 1003, 1004, 1005, 1006];
  
  const articleBlocks = mockArticlesContent.split(/},\s*{/);
  
  const extractedGoodArticles = [];
  
  // Quick and dirty manual extraction to avoid regex boundaries inside the string
  let currentArrayContent = mockArticlesContent.substring(arrayStartStr.length);
  // Remove trailing ];
  currentArrayContent = currentArrayContent.replace(/\];\s*$/, '');
  
  // Use regex to locate each ID block precisely
  const idRegex = /'id':\s*(\d+)/g;
  let match;
  let matches = [];
  while ((match = idRegex.exec(content)) !== null) {
      if (match.index >= arrayStartIndex && match.index <= closingIndex) {
          matches.push({ id: parseInt(match[1]), index: match.index });
      }
  }

  for (let i = 0; i < matches.length; i++) {
      const idStr = matches[i].id;
      const startObj = content.lastIndexOf('{', matches[i].index);
      let endObj;
      if (i < matches.length - 1) {
          endObj = content.lastIndexOf('},', matches[i+1].index);
      } else {
          endObj = content.lastIndexOf('}', closingIndex);
      }
      
      const objContent = content.substring(startObj, endObj + 1);
      
      if (goodIds.includes(idStr)) {
          extractedGoodArticles.push(objContent);
      }
  }

  // 3. Generate 68 clean new articles in Bangla
  const newArticles = [];
  const dogTitles = [
    "কুকুরের টিক ও ফ্লি থেকে বাঁচার সহজ উপায়",
    "কুকুরকে প্রতিদিন কী পরিমাণ খাবার দেওয়া উচিত?",
    "দেশি কুকুরের রোগ প্রতিরোধ ক্ষমতা কেন বেশি?",
    "গরমে কুকুরকে সুস্থ ও সতেজ রাখতে করণীয়",
    "কুকুর কেন কাঁদে এবং এর সমাধান কী?",
    "শীতকালে কুকুরের গোসল ও পরিচ্ছন্নতা",
    "কুকুরের কান পরিষ্কার করার সঠিক নিয়ম",
    "কুকুরের নখ কাটার সময় যে সতর্কতাগুলো মানতে হবে",
    "বয়স্ক কুকুরের স্পেশাল ডায়েট",
    "কুকুরের দাঁতের যত্নে ব্রাশ করার প্রয়োজনীয়তা",
    "কুকুরকে লেজ নাড়তে দেখলে আপনি কী বুঝবেন?",
    "আপনার কুকুর অতিরিক্ত মোটা হয়ে যাচ্ছে না তো?",
    "নতুন কুকুরছানাকে কিভাবে ঘরে মানিয়ে নেবেন?",
    "কুকুরের ডিওয়ার্মিং কেন এত জরুরি?",
    "পশুর ডাক্তারের কাছে কুকুরকে নেওয়ার আগে প্রস্তুতি",
    "কুকুরের জন্য বিষাক্ত খাবারগুলোর তালিকা",
    "কিভাবে কুকুরের হাইপারঅ্যাকটিভিটি নিয়ন্ত্রণ করবেন?",
    "কুকুরের সাধারণ অ্যালার্জি এবং এর ঘরোয়া প্রতিকার",
    "কুকুরকে অপরিচিত মানুষের সাথে মিশতে শেখানো",
    "রাস্তার কুকুরকে খাবার দেওয়ার সঠিক নিয়ম",
    "কুকুরের জয়েন্টের ব্যথা: লক্ষণ ও চিকিৎসা",
    "কুকুরকে গাড়ির ভ্রমণে অভ্যস্ত করানো",
    "কুকুরের মুখে দুর্গন্ধ হওয়ার কারণ কী?",
    "সঠিক কলার এবং লিশ কীভাবে বেছে নেবেন?",
    "কুকুরকে একা ঘরে রাখার কিছু টিপস"
  ];
  
  const catTitles = [
    "বিড়ালের লিটার বক্স পরিষ্কার করার সঠিক পদ্ধতি",
    "বিড়াল কেন পানি ভয় পায়?",
    "ইনডোর বিড়ালের জন্য উপযুক্ত খেলনা",
    "বিড়াল ঘাস খায় কেন? ক্যাট গ্রাসের উপকারিতা",
    "বিড়ালের নখ কাটার নিরাপদ উপায়",
    "গর্ভবতী বিড়ালের বিশেষ যত্ন ও খাবার",
    "নবজাতক বিড়ালছানাকে বোতলে দুধ খাওয়ানোর নিয়ম",
    "বিড়ালের চুল পড়া কমানোর সহজ টিপস",
    "ক্যাটনিপ কী এবং এটি বিড়ালের উপর কেমন প্রভাব ফেলে?",
    "বিড়াল কেন এত বেশি ঘুমায়?",
    "আপনার বিড়াল কি স্ট্রেসে ভুগছে? লক্ষণগুলো জানুন",
    "বিড়ালের হেয়ারবল সমস্যা প্রতিরোধে করণীয়",
    "বিড়াল পালনে মাসিক খরচ কেমন হতে পারে?",
    "বিড়ালের কানে মাইটস বা পোকা হলে বুঝবেন কীভাবে?",
    "বিড়ালকে কিভাবে গোসলে অভ্যস্ত করবেন?",
    "বিড়ালকে অন্য প্রাণীর সাথে পরিচয় করানোর ধাপ",
    "স্পে বা নিউটারিং কেন বিড়ালের স্বাস্থ্যের জন্য ভালো?",
    "বিড়ালের দাঁতের যত্ন এবং ওরাল হাইজিন",
    "বিড়াল বারবার বমি করছে কেন?",
    "পার্সিয়ান বিড়ালের চোখ ও লোমের যত্ন"
  ];

  const generalTitles = [
    "ঢাকায় অবস্থিত সেরা ৫টি ভেটেরিনারি ক্লিনিক",
    "পোষা প্রাণী দত্তক নেওয়ার ముందు যে ৫টি কথা ভাববেন",
    "ভ্যাকসিনেশন: কেন এটি আপনার পোষ্যর জন্য অত্যাবশ্যকীয়?",
    "পোষা প্রাণীর পাসপোর্ট এবং ট্রাভেলিং নিয়মকানুন",
    "ফ্ল্যাট বাসায় পোষা প্রাণী রাখার ক্ষেত্রে কিছু জরুরি টিপস",
    "কীভাবে আপনার হারিয়ে যাওয়া পোষা প্রাণীকে খুঁজবেন?",
    "রেসকিউ এনিম্যাল: একটি প্রাণীকে নতুন জীবন দিন",
    "পোষা প্রাণীর ফার্স্ট এইড কিট কীভাবে তৈরি করবেন?",
    "ঈদের সময় পশু কোরবানির গন্ধে পোষা প্রাণীকে শান্ত রাখবেন কীভাবে?",
    "পোষা প্রাণীর জন্য মাইক্রোচিপিং: সুবিধা ও প্রক্রিয়া",
    "কীভাবে পোষা প্রাণীর ইনস্যুরেন্স বা হেলথ ফান্ড গঠন করবেন?",
    "বাংলাদেশে পেট ফ্রেন্ডলি ক্যাফে এবং রেস্তোরাঁ",
    "বজ্রপাত বা আতশবাজির শব্দে পোষা প্রাণীর ভয় কাটাবেন কীভাবে?",
    "পোষা প্রাণীর খাবার বাড়িতে তৈরি করার কিছু রেসিপি",
    "বর্ষাকালে পোষা প্রাণীর বিশেষ যত্ন",
    "শীতকালে পোষ্যের ঘর গরম রাখার উপায়",
    "কীভাবে পোষা প্রাণীর অ্যালার্জি থেকে নিজে সুরক্ষিত থাকবেন?",
    "আপনার সন্তানের সাথে পোষা প্রাণীর বন্ধুত্বপূর্ণ সম্পর্ক তৈরি",
    "গ্রুমিং স্যালন বনাম বাড়িতে গ্রুমিং: কোনটি ভালো?",
    "পোষা প্রাণীদের কিছু অস্বাভাবিক আচরণের অর্থ",
    "কীভাবে বুঝবেন আপনার পোষ্য অসুস্থ?",
    "গরমকালে পোষ্যের হিটস্ট্রোক থেকে বাঁচার উপায়",
    "পোষা প্রাণীর জন্য নিরাপদ কিছু ইনডোর প্ল্যান্ট"
  ];

  const allTitles = [...dogTitles, ...catTitles, ...generalTitles];
  
  // Base text chunks to generate varied content
  const introPhrases = [
    "অনেকেই আমাদের কাছে জানতে চান এই বিষয়টি নিয়ে।",
    "আমাদের প্রতিদিনের ব্যস্ত জীবনে পোষা প্রাণীর যত্ন নেওয়া একটি বড় দায়িত্ব।",
    "সঠিক তথ্যের অভাবে আমরা অনেকেই ভুল করে ফেলি।",
    "বিশেষজ্ঞ ভেটেরিনারিয়ানদের মতে, এই বিষয়টি অত্যন্ত গুরুত্বপূর্ণ।",
    "পোষা প্রাণীদের সুস্থ ও আনন্দময় জীবন নিশ্চিত করতে আমাদের কিছু নিয়ম মেনে চলতে হবে।"
  ];
  const bodyPhrases = [
    "প্রথমত, তাদের নিয়মিত পর্যবেক্ষণ করতে হবে।",
    "সঠিক ডায়েট এবং পুষ্টি তাদের ইমিউন সিস্টেমকে শক্তিশালী করে।",
    "পরিচ্ছন্নতা বজায় রাখা শুধুমাত্র তাদের জন্য নয়, আমাদের পরিবারের জন্য সমান জরুরি।",
    "কখনও কোনো শারীরিক বা মানসিক পরিবর্তন দেখলে অবহেলা করবেন না।",
    "তাদের সাথে সময় কাটানো এবং খেলাধুলা করা তাদের মানসিক স্বাস্থ্যের জন্য অত্যন্ত উপকারী।"
  ];
  const listItems = [
    "নিয়মিত ভেট চেকআপ করা আবশ্যক।",
    "পরিষ্কার এবং তাজা পানি পান করতে দিন।",
    "সুষম খাবার দিন, তবে মানুষের খাবার এড়িয়ে চলা ভালো।",
    "প্রতিদিন নির্দিষ্ট পরিমাণ শারীরিক ব্যায়াম নিশ্চিত করুন।",
    "বাসার পরিবেশ তাদের জন্য নিরাপদ কিনা তা খেয়াল রাখুন।"
  ];
  const conclusionPhrases = [
    "আশা করি এই পরামর্শগুলো আপনার ও আপনার প্রিয় পোষ্যের কাজে আসবে।",
    "সবচেয়ে বড় কথা হলো, তাদের প্রতি অগাধ ভালোবাসা আর ধৈর্য থাকা প্রয়োজন।",
    "সঠিক যত্ন নিলে তারা হবে আপনার পরিবারের সবচেয়ে চমৎকার সঙ্গী।",
    "কোনো সমস্যা হলে অবশ্যই একজন রেজিস্টার্ড ভেটেরিনারিয়ানের পরামর্শ নিন।",
    "আমাদের ব্লগ থেকে আরও টিপস নিয়মিত পড়তে ভুলবেন না।"
  ];

  function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generateArticleContent(title) {
    return `**${title}**\n\n${getRandom(introPhrases)}\n\n${getRandom(bodyPhrases)}\n\n**গুরুত্বপূর্ণ কিছু টিপস:**\n* ${getRandom(listItems)}\n* ${getRandom(listItems)}\n* ${getRandom(listItems)}\n\n${getRandom(conclusionPhrases)}`;
  }

  let currentDate = new Date('2025-01-01T10:00:00Z').getTime();

  for (let i = 0; i < allTitles.length; i++) {
    const id = 101 + i;
    const title = allTitles[i];
    const category = i < dogTitles.length ? 'Dog Care' : (i < dogTitles.length + catTitles.length ? 'Cat Care' : 'General Pet Care');
    const tags = [category.split(' ')[0]];
    const contentText = generateArticleContent(title);
    const dateStr = new Date(currentDate).toISOString();
    
    // Add ~2-3 days per article
    currentDate += (Math.random() * 2 + 1) * 24 * 60 * 60 * 1000;
    
    let excerpt = contentText.replace(/[#*]/g, '').substring(0, 150) + '...';

    const objStr = `{
    'id': ${id},
    'title': '${title}',
    'content': \`${contentText}\`,
    'imageUrl': null,
    'author': 'PetBhai Team',
    'date': '${dateStr}',
    'readTime': ${Math.floor(Math.random() * 4) + 2},
    'slug': '${title.replace(/[^a-zA-Z0-9\u0980-\u09FF \-]/g, '').replace(/\\s+/g, '-') + '-' + id}',
    'excerpt': \`${excerpt}\`,
    'category': '${category}',
    'tags': ${JSON.stringify(tags)},
    'updatedAt': '${dateStr}'
  }`;
    newArticles.push(objStr);
  }

  // 4. Combine and Write
  const finalArrayCore = [...extractedGoodArticles, ...newArticles].join(',\n  ');
  const finalContent = prefix + finalArrayCore + '\n];\n' + suffix;

  fs.writeFileSync(mockDataPath, finalContent, 'utf16le');
  
  console.log('Successfully rebuilt mockData.ts with ' + extractedGoodArticles.length + ' good articles and ' + newArticles.length + ' new articles!');

} catch (err) {
  console.error('Error rewriting mock data:', err);
}
