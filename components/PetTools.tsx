import React, { useState, useMemo } from 'react';

// Icons
const CalculatorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);

const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
);

const ScaleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
    />
  </svg>
);

const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

type PetType = 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster';
type ToolTab = 'age' | 'name' | 'tips' | 'food';

// Pet name data organized by characteristics
const PET_NAMES = {
  cute: {
    dog: [
      'Mochi',
      'Biscuit',
      'Peanut',
      'Bubbles',
      'Cookie',
      'Noodle',
      'Pickle',
      'Waffle',
      'Dumpling',
      'Sprout',
    ],
    cat: [
      'Muffin',
      'Mittens',
      'Whiskers',
      'Snowball',
      'Pudding',
      'Marshmallow',
      'Cupcake',
      'Button',
      'Boba',
      'Peach',
    ],
    bird: [
      'Tweety',
      'Sunny',
      'Kiwi',
      'Mango',
      'Pepper',
      'Cloud',
      'Rainbow',
      'Chirpy',
      'Sky',
      'Cotton',
    ],
    rabbit: [
      'Fluffy',
      'Thumper',
      'Snowball',
      'Clover',
      'Buttercup',
      'Hopscotch',
      'Dandelion',
      'Cocoa',
      'Willow',
      'Honey',
    ],
    hamster: [
      'Nugget',
      'Pebbles',
      'Squeaky',
      'Gizmo',
      'Nibbles',
      'Cashew',
      'Acorn',
      'Pip',
      'Tiny',
      'Bean',
    ],
  },
  bengali: {
    dog: ['Bholu', 'Tuffy', 'Simba', 'Raja', 'Tommy', 'Moti', 'Sheru', 'Kalu', 'Rocket', 'Bruno'],
    cat: [
      'Billu',
      'Meow',
      'Mintu',
      'Tara',
      'Goldie',
      'Mishti',
      'Jhilik',
      'Chhotu',
      'Mithu',
      'Rani',
    ],
    bird: [
      'Mithu',
      'Tota',
      'Maina',
      'Bulbul',
      'Koyal',
      'Moyna',
      'Pakhi',
      'Chintai',
      'Chiria',
      'Jhilmil',
    ],
    rabbit: [
      'Khargosh',
      'Bunty',
      'Sona',
      'Chanda',
      'Tinku',
      'Pinku',
      'Golu',
      'Raju',
      'Munni',
      'Dolly',
    ],
    hamster: [
      'Chuha',
      'Motu',
      'Pinky',
      'Ritu',
      'Lucky',
      'Sonu',
      'Bittu',
      'Chintu',
      'Guddu',
      'Bablu',
    ],
  },
  funny: {
    dog: [
      'Sir Barksalot',
      'Bark Twain',
      'Droolius Caesar',
      'Chewbarka',
      'Indiana Bones',
      'Woofgang Puck',
      'Bark Obama',
      'Fur-dinand',
      'Hairy Pawter',
      'Jimmy Chew',
    ],
    cat: [
      'Meowly Cyrus',
      'Catrick Swayze',
      'Purrlock Holmes',
      'Chairman Meow',
      'Whisker Biscuit',
      'Cat Damon',
      'Fuzz Aldrin',
      'Leonardo DiCatrio',
      'Paw McCartney',
      'Catzilla',
    ],
    bird: [
      'Tweet-y Perry',
      'Beaky Blinders',
      'Wingston Churchill',
      'Bird Reynolds',
      'Feather Locklear',
      'Polly Parton',
      'Eggbert',
      'Chirp Eastwood',
      'Wing King',
      'Beak-oncé',
    ],
    rabbit: [
      'Bunny Depp',
      'Hoptimus Prime',
      'Carrot Top',
      'Bunzilla',
      'Hoprah Winfrey',
      'Peter Rabbit',
      'Bun Jovi',
      'Hare Jordan',
      'Bunny Boo',
      'Fluffernutter',
    ],
    hamster: [
      'Hammy Potter',
      'Cheeks McGee',
      'Sir Squeaks',
      'Hamtaro',
      'Fuzzy Wuzzy',
      'Wheel Turner',
      'Napoleon Boneparte',
      'Hamsterdam',
      'Tiny Tornado',
      'Cheek Poucher',
    ],
  },
  strong: {
    dog: ['Zeus', 'Thor', 'Titan', 'Apollo', 'Rocky', 'Max', 'Duke', 'Bear', 'Rex', 'Ace'],
    cat: [
      'Leo',
      'Simba',
      'Tiger',
      'Shadow',
      'Panther',
      'Jaguar',
      'Storm',
      'Hunter',
      'Blaze',
      'Fang',
    ],
    bird: [
      'Phoenix',
      'Eagle',
      'Falcon',
      'Hawk',
      'Thunder',
      'Storm',
      'Ace',
      'Blaze',
      'Hunter',
      'Jet',
    ],
    rabbit: [
      'Atlas',
      'Titan',
      'Goliath',
      'Hercules',
      'Maximus',
      'Thor',
      'King',
      'Brutus',
      'Champion',
      'Legend',
    ],
    hamster: [
      'Mighty',
      'Champion',
      'Turbo',
      'Rocket',
      'Bolt',
      'Flash',
      'Speedy',
      'Zoom',
      'Dash',
      'Storm',
    ],
  },
};

// Pet care tips organized by pet type and category
const PET_TIPS = {
  dog: {
    health: [
      'Schedule annual vet checkups and stay current on vaccinations 💉',
      "Brush your dog's teeth 2-3 times per week to prevent dental disease 🦷",
      'Check for ticks and fleas regularly, especially after outdoor activities 🐜',
      'Keep your dog at a healthy weight - obesity can reduce lifespan by 2+ years ⚖️',
      'Watch for signs of illness: lethargy, loss of appetite, excessive thirst 👀',
    ],
    nutrition: [
      "Feed high-quality protein-based food appropriate for your dog's age 🍖",
      "Avoid giving chocolate, grapes, onions, and xylitol - they're toxic! ⚠️",
      'Always provide fresh, clean water - change it at least twice daily 💧',
      "Don't overfeed treats - they should be less than 10% of daily calories 🦴",
      'Consider adding fish oil for a shiny coat and joint health 🐟',
    ],
    training: [
      'Use positive reinforcement - reward good behavior immediately 🎉',
      'Keep training sessions short (5-10 minutes) for better retention 📚',
      'Be consistent with commands - use the same words every time 🗣️',
      'Socialize your puppy early with different people, dogs, and environments 🤝',
      'Never punish accidents during potty training - patience is key 🚽',
    ],
    exercise: [
      'Most dogs need 30-60 minutes of exercise daily depending on breed 🏃',
      'Mental stimulation is as important as physical exercise - try puzzle toys 🧩',
      'Swimming is excellent low-impact exercise for dogs with joint issues 🏊',
      'Avoid exercising in extreme heat - dogs can get heatstroke quickly ☀️',
      'Play fetch, tug-of-war, or hide-and-seek for interactive fun 🎾',
    ],
  },
  cat: {
    health: [
      'Annual vet visits are essential even for indoor cats 🏥',
      'Keep litter boxes clean - scoop daily and change litter weekly 🧹',
      'Watch for urinary issues - straining or crying in the litter box is serious ⚠️',
      'Brush your cat regularly to reduce hairballs and matting 🪥',
      'Keep toxic plants like lilies away - they can cause kidney failure 🌿',
    ],
    nutrition: [
      'Cats are obligate carnivores - they need meat-based protein 🥩',
      'Wet food helps with hydration and urinary tract health 🥫',
      'Never give cats dog food - it lacks essential nutrients like taurine 🚫',
      'Avoid milk - most adult cats are lactose intolerant 🥛',
      'Feed on a schedule rather than free-feeding to prevent obesity ⏰',
    ],
    enrichment: [
      'Provide scratching posts to satisfy natural instincts and save furniture 🪵',
      'Vertical space (cat trees, shelves) makes cats feel secure 📐',
      'Rotate toys regularly to keep them interesting 🧸',
      'Window perches give cats entertainment and sunbathing spots ☀️',
      'Play with your cat for 15-20 minutes daily to prevent boredom 🎣',
    ],
    behavior: [
      'Cats need hiding spots when feeling stressed or overwhelmed 📦',
      'Slow blinks are "cat kisses" - try blinking slowly at your cat 😸',
      'Sudden behavior changes often indicate health issues - consult a vet 🩺',
      'Multiple cat households need one litter box per cat plus one extra 🚻',
      'Cats prefer their water bowl away from their food bowl 💧',
    ],
  },
  bird: {
    health: [
      'Annual avian vet checkups are important - birds hide illness well 🏥',
      'Never use non-stick cookware - fumes are deadly to birds ⚠️',
      'Provide cuttlebone or mineral blocks for calcium 🦴',
      'Keep the cage clean to prevent respiratory infections 🧼',
      'Watch for signs of illness: fluffed feathers, sitting on cage floor 👀',
    ],
    nutrition: [
      'Seed-only diets are unhealthy - offer pellets, fruits, and vegetables 🥗',
      'Avoid avocado, chocolate, caffeine, and alcohol - all toxic to birds 🚫',
      'Fresh water should be available at all times 💧',
      'Sprouted seeds are more nutritious than dry seeds 🌱',
      'Calcium is crucial, especially for egg-laying females 🥚',
    ],
    enrichment: [
      'Birds need 10-12 hours of quiet, dark sleep time 😴',
      'Rotate toys weekly to prevent boredom 🎠',
      'Foraging toys stimulate natural behavior - hide treats in toys 🔍',
      'Safe out-of-cage time is essential for exercise and bonding 🦜',
      "Music and talking provide mental stimulation when you're away 🎵",
    ],
    housing: [
      'Bigger cage is always better - birds need room to spread wings 🏠',
      'Place cage at eye level, away from drafts and direct sunlight 📍',
      'Cover cage at night for security and proper sleep 🌙',
      'Use paper or newspaper as cage liner - avoid wood chips 📰',
      'Provide multiple perches of varying widths and textures 🌳',
    ],
  },
  rabbit: {
    health: [
      'Spay/neuter prevents cancer and reduces behavioral issues 🏥',
      'Dental check-ups are crucial - rabbit teeth grow continuously 🦷',
      'Watch for signs of GI stasis: not eating, small/no droppings ⚠️',
      'Keep nails trimmed every 4-6 weeks 💅',
      'Rabbits can get heatstroke easily - keep them cool in summer ❄️',
    ],
    nutrition: [
      'Unlimited hay should be 80% of diet - essential for digestion 🌾',
      'Fresh leafy greens daily: romaine, cilantro, parsley 🥬',
      'Limit pellets and treats - obesity is common in pet rabbits ⚖️',
      'Fresh water in a bowl is preferred over a bottle 💧',
      'Introduce new foods slowly to prevent digestive upset 🐌',
    ],
    housing: [
      'Rabbits need space to hop at least 3-4 body lengths 🏠',
      'Provide hiding spots - cardboard boxes work great 📦',
      'Bunny-proof your home - rabbits love to chew wires and furniture 🔌',
      'Litter training is possible - use hay in the litter box 🚽',
      'Soft flooring is important - wire floors hurt their feet 🧶',
    ],
    behavior: [
      'Binkies (jumping and twisting) mean your rabbit is happy! 🎉',
      'Thumping indicates fear or warning - check what scared them 👀',
      'Rabbits are social - consider getting a bonded pair 💕',
      'Tooth grinding (purring) usually means contentment 😊',
      "Chinning objects means they're marking territory 🏷️",
    ],
  },
  hamster: {
    health: [
      'Hamsters are prone to wet tail - watch for diarrhea and lethargy ⚠️',
      'Check teeth regularly - overgrown teeth need vet attention 🦷',
      "Hamsters are nocturnal - don't disturb sleep during the day 😴",
      'Keep the cage in a quiet area away from direct sunlight 🌤️',
      'Average lifespan is 2-3 years - cherish every moment 💕',
    ],
    nutrition: [
      'Commercial hamster food mix provides balanced nutrition 🥣',
      'Fresh vegetables in small amounts: carrots, cucumber, broccoli 🥕',
      'Avoid citrus fruits and onions - toxic to hamsters 🚫',
      'Provide fresh water daily in a bottle or shallow dish 💧',
      'Occasional protein treats: plain cooked egg, mealworms 🥚',
    ],
    housing: [
      'Minimum 450 square inches of floor space (bigger is better!) 🏠',
      'Deep bedding (6+ inches) allows natural burrowing behavior 🕳️',
      'Exercise wheel is essential - choose a solid surface wheel 🎡',
      'Avoid wire wheels and balls - they can injure tiny feet 🚫',
      'Provide chew toys to keep teeth worn down naturally 🦷',
    ],
    handling: [
      'Let your hamster settle in for 3-5 days before handling 🤲',
      'Handle over a soft surface in case of falls 🛋️',
      "Syrian hamsters must live alone - they're territorial 🚪",
      'Dwarf hamsters can sometimes live in same-sex pairs 👯',
      'Never wake a sleeping hamster - they may bite when startled 😬',
    ],
  },
};

// Age calculation data
const AGE_MULTIPLIERS = {
  dog: {
    small: [15, 9, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4], // < 9 kg
    medium: [15, 9, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5], // 9-23 kg
    large: [15, 9, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6], // > 23 kg
  },
  cat: [15, 9, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  bird: {
    small: 4, // Budgies, canaries
    medium: 3, // Cockatiels, lovebirds
    large: 2, // Parrots, macaws
  },
  rabbit: 8, // Roughly 1 rabbit year = 8 human years
  hamster: 25, // 1 hamster year ≈ 25 human years
};

// Food portion calculator data (daily amounts)
const FOOD_GUIDE = {
  dog: {
    // Dry food in cups per day based on weight (kg)
    portions: [
      { maxWeight: 2, cups: 0.5, description: 'Toy breeds (Chihuahua, Yorkie)' },
      { maxWeight: 5, cups: 0.75, description: 'Small breeds (Pomeranian, Maltese)' },
      { maxWeight: 9, cups: 1.25, description: 'Small-medium breeds (Beagle, Cocker Spaniel)' },
      { maxWeight: 14, cups: 1.75, description: 'Medium breeds (Border Collie, Bulldog)' },
      { maxWeight: 23, cups: 2.5, description: 'Large breeds (Labrador, Golden Retriever)' },
      { maxWeight: 32, cups: 3.25, description: 'Large breeds (German Shepherd, Rottweiler)' },
      { maxWeight: 45, cups: 4, description: 'Giant breeds (Great Dane, Mastiff)' },
      { maxWeight: Infinity, cups: 5, description: 'Extra large breeds' },
    ],
    adjustments: {
      puppy: 2, // Double for puppies
      senior: 0.8, // Reduce for seniors
      active: 1.3, // Increase for active dogs
      sedentary: 0.8, // Reduce for sedentary dogs
    },
  },
  cat: {
    // Wet food in ounces + dry food in tablespoons
    baseCalories: 20, // calories per pound of body weight
    adjustments: {
      kitten: 1.5,
      senior: 0.8,
      active: 1.2,
      indoor: 0.9,
    },
  },
  bird: {
    small: { seeds: '1-2 tsp', pellets: '1 tbsp', fresh: 'Small piece daily' },
    medium: { seeds: '1-2 tbsp', pellets: '2 tbsp', fresh: '1-2 tbsp daily' },
    large: { seeds: '2-4 tbsp', pellets: '¼ cup', fresh: '¼ cup daily' },
  },
  rabbit: {
    hay: 'Unlimited (body size pile)',
    pellets: '¼ cup per 2 kg body weight',
    greens: '2 cups per 2 kg body weight',
  },
  hamster: {
    daily: '1-2 tablespoons of hamster food mix',
    treats: 'Small piece of fresh veg every other day',
  },
};

const PetTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolTab>('age');

  // Age Calculator State
  const [petType, setPetType] = useState<PetType>('dog');
  const [petAge, setPetAge] = useState<number>(1);
  const [dogSize, setDogSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [birdSize, setBirdSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Name Generator State
  const [nameStyle, setNameStyle] = useState<'cute' | 'bengali' | 'funny' | 'strong'>('cute');
  const [namePetType, setNamePetType] = useState<PetType>('dog');
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);

  // Tips State
  const [tipsPetType, setTipsPetType] = useState<PetType>('dog');
  const [tipsCategory, setTipsCategory] = useState<string>('health');

  // Food Calculator State
  const [foodPetType, setFoodPetType] = useState<PetType>('dog');
  const [petWeight, setPetWeight] = useState<number>(20);
  const [petLifeStage, setPetLifeStage] = useState<'puppy' | 'adult' | 'senior'>('adult');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'normal' | 'active'>('normal');

  // Calculate human age
  const humanAge = useMemo(() => {
    if (petType === 'dog') {
      const multipliers = AGE_MULTIPLIERS.dog[dogSize];
      let total = 0;
      for (let i = 0; i < Math.min(petAge, multipliers.length); i++) {
        total += multipliers[i];
      }
      if (petAge > multipliers.length) {
        total += (petAge - multipliers.length) * multipliers[multipliers.length - 1];
      }
      return Math.round(total);
    } else if (petType === 'cat') {
      const multipliers = AGE_MULTIPLIERS.cat;
      let total = 0;
      for (let i = 0; i < Math.min(petAge, multipliers.length); i++) {
        total += multipliers[i];
      }
      if (petAge > multipliers.length) {
        total += (petAge - multipliers.length) * 4;
      }
      return Math.round(total);
    } else if (petType === 'bird') {
      return Math.round(petAge * AGE_MULTIPLIERS.bird[birdSize]);
    } else if (petType === 'rabbit') {
      return Math.round(petAge * AGE_MULTIPLIERS.rabbit);
    } else {
      return Math.round(petAge * AGE_MULTIPLIERS.hamster);
    }
  }, [petType, petAge, dogSize, birdSize]);

  // Generate random names
  const generateNames = () => {
    const names = PET_NAMES[nameStyle][namePetType];
    const shuffled = [...names].sort(() => 0.5 - Math.random());
    setGeneratedNames(shuffled.slice(0, 5));
  };

  // Get tips for current selection
  const currentTips = useMemo(() => {
    const petTips = PET_TIPS[tipsPetType];
    const categories = Object.keys(petTips);
    if (!categories.includes(tipsCategory)) {
      setTipsCategory(categories[0]);
      return petTips[categories[0] as keyof typeof petTips];
    }
    return petTips[tipsCategory as keyof typeof petTips];
  }, [tipsPetType, tipsCategory]);

  const tipCategories = useMemo(() => {
    return Object.keys(PET_TIPS[tipsPetType]);
  }, [tipsPetType]);

  // Calculate food portions
  const foodRecommendation = useMemo(() => {
    if (foodPetType === 'dog') {
      const portion = FOOD_GUIDE.dog.portions.find((p) => petWeight <= p.maxWeight);
      if (!portion) return null;

      let adjustedCups = portion.cups;
      if (petLifeStage === 'puppy') adjustedCups *= FOOD_GUIDE.dog.adjustments.puppy;
      else if (petLifeStage === 'senior') adjustedCups *= FOOD_GUIDE.dog.adjustments.senior;

      if (activityLevel === 'active') adjustedCups *= FOOD_GUIDE.dog.adjustments.active;
      else if (activityLevel === 'sedentary') adjustedCups *= FOOD_GUIDE.dog.adjustments.sedentary;

      return {
        cups: adjustedCups.toFixed(2),
        description: portion.description,
        note: 'Split into 2 meals per day',
      };
    } else if (foodPetType === 'cat') {
      let calories = petWeight * FOOD_GUIDE.cat.baseCalories;
      if (petLifeStage === 'puppy') calories *= FOOD_GUIDE.cat.adjustments.kitten;
      else if (petLifeStage === 'senior') calories *= FOOD_GUIDE.cat.adjustments.senior;
      if (activityLevel === 'sedentary') calories *= FOOD_GUIDE.cat.adjustments.indoor;
      else if (activityLevel === 'active') calories *= FOOD_GUIDE.cat.adjustments.active;

      return {
        calories: Math.round(calories),
        wetFood: `${Math.round(calories / 25)} oz wet food`,
        dryFood: `${Math.round(calories / 12)} tbsp dry food`,
        note: 'Or a combination of both',
      };
    } else if (foodPetType === 'bird') {
      return FOOD_GUIDE.bird[birdSize];
    } else if (foodPetType === 'rabbit') {
      return FOOD_GUIDE.rabbit;
    } else {
      return FOOD_GUIDE.hamster;
    }
  }, [foodPetType, petWeight, petLifeStage, activityLevel, birdSize]);

  const TabButton: React.FC<{
    tab: ToolTab;
    icon: React.ReactNode;
    label: string;
  }> = ({ tab, icon, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all ${
        activeTab === tab
          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-slate-600'
      }`}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  const PetTypeSelector: React.FC<{
    value: PetType;
    onChange: (type: PetType) => void;
  }> = ({ value, onChange }) => (
    <div className="flex flex-wrap gap-2">
      {(['dog', 'cat', 'bird', 'rabbit', 'hamster'] as PetType[]).map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            value === type
              ? 'bg-orange-500 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-slate-600'
          }`}
        >
          {type === 'dog' && '🐕'}
          {type === 'cat' && '🐱'}
          {type === 'bird' && '🦜'}
          {type === 'rabbit' && '🐰'}
          {type === 'hamster' && '🐹'}
          <span className="ml-1 capitalize">{type}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <SparklesIcon className="w-7 h-7 mr-2" />
          Pet Tools & Calculators
        </h2>
        <p className="text-orange-100 mt-1">Free AI-powered tools for pet parents</p>
      </div>

      {/* Tab Navigation */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-2">
          <TabButton
            tab="age"
            icon={<CalculatorIcon className="w-5 h-5" />}
            label="Age Calculator"
          />
          <TabButton
            tab="name"
            icon={<SparklesIcon className="w-5 h-5" />}
            label="Name Generator"
          />
          <TabButton tab="tips" icon={<LightbulbIcon className="w-5 h-5" />} label="Care Tips" />
          <TabButton tab="food" icon={<ScaleIcon className="w-5 h-5" />} label="Food Calculator" />
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Age Calculator */}
        {activeTab === 'age' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Select Pet Type
              </label>
              <PetTypeSelector value={petType} onChange={setPetType} />
            </div>

            {petType === 'dog' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Dog Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setDogSize(size)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        dogSize === size
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {size === 'small' && '🐕 Small (<9 kg)'}
                      {size === 'medium' && '🐕 Medium (9-23 kg)'}
                      {size === 'large' && '🐕 Large (>23 kg)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {petType === 'bird' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Bird Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setBirdSize(size)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        birdSize === size
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {size === 'small' && '🐦 Small (Budgie, Canary)'}
                      {size === 'medium' && '🦜 Medium (Cockatiel)'}
                      {size === 'large' && '🦜 Large (Parrot, Macaw)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="pet-age-slider"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
              >
                Pet Age (years): {petAge}
              </label>
              <input
                id="pet-age-slider"
                type="range"
                min="0.5"
                max={petType === 'hamster' ? 4 : petType === 'rabbit' ? 12 : 20}
                step="0.5"
                value={petAge}
                onChange={(e) => setPetAge(parseFloat(e.target.value))}
                aria-label={`Pet age in years: ${petAge}`}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0.5</span>
                <span>{petType === 'hamster' ? 4 : petType === 'rabbit' ? 12 : 20} years</span>
              </div>
            </div>

            {/* Result */}
            <div className="bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 rounded-xl p-6 text-center">
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                Your {petType}'s age in human years:
              </p>
              <p className="text-5xl font-bold text-orange-500">{humanAge}</p>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                {humanAge < 20 && '👶 Still a baby!'}
                {humanAge >= 20 && humanAge < 40 && '💪 In their prime!'}
                {humanAge >= 40 && humanAge < 60 && '🧘 Middle-aged wisdom'}
                {humanAge >= 60 && humanAge < 80 && '👴 Golden years'}
                {humanAge >= 80 && '🌟 Wise elder'}
              </p>
            </div>
          </div>
        )}

        {/* Name Generator */}
        {activeTab === 'name' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Select Pet Type
              </label>
              <PetTypeSelector value={namePetType} onChange={setNamePetType} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Name Style
              </label>
              <div className="flex flex-wrap gap-2">
                {(['cute', 'bengali', 'funny', 'strong'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setNameStyle(style)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      nameStyle === style
                        ? 'bg-pink-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {style === 'cute' && '🥰 Cute'}
                    {style === 'bengali' && '🇧🇩 Bengali'}
                    {style === 'funny' && '😂 Funny'}
                    {style === 'strong' && '💪 Strong'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateNames}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center space-x-2"
            >
              <SparklesIcon className="w-5 h-5" />
              <span>Generate Names</span>
            </button>

            {generatedNames.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                  ✨ Generated Names:
                </p>
                <div className="flex flex-wrap gap-2">
                  {generatedNames.map((name, idx) => (
                    <span
                      key={idx}
                      className="bg-white dark:bg-slate-800 px-4 py-2 rounded-full text-slate-700 dark:text-slate-200 font-medium shadow-sm border border-slate-200 dark:border-slate-700"
                    >
                      {name}
                    </span>
                  ))}
                </div>
                <button
                  onClick={generateNames}
                  className="mt-3 text-sm text-orange-500 hover:text-orange-600 flex items-center space-x-1"
                >
                  <RefreshIcon className="w-4 h-4" />
                  <span>Generate more</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Care Tips */}
        {activeTab === 'tips' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Select Pet Type
              </label>
              <PetTypeSelector value={tipsPetType} onChange={setTipsPetType} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {tipCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setTipsCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      tipsCategory === category
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {category === 'health' && '🏥 '}
                    {category === 'nutrition' && '🍖 '}
                    {category === 'training' && '📚 '}
                    {category === 'exercise' && '🏃 '}
                    {category === 'enrichment' && '🧩 '}
                    {category === 'behavior' && '🧠 '}
                    {category === 'housing' && '🏠 '}
                    {category === 'handling' && '🤲 '}
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {currentTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border-l-4 border-green-500"
                >
                  <p className="text-slate-700 dark:text-slate-200">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Food Calculator */}
        {activeTab === 'food' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Select Pet Type
              </label>
              <PetTypeSelector value={foodPetType} onChange={setFoodPetType} />
            </div>

            {(foodPetType === 'dog' || foodPetType === 'cat') && (
              <>
                <div>
                  <label
                    htmlFor="pet-weight-slider"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2"
                  >
                    Pet Weight: {petWeight} kg
                  </label>
                  <input
                    id="pet-weight-slider"
                    type="range"
                    min="1"
                    max={foodPetType === 'dog' ? 68 : 11}
                    value={petWeight}
                    onChange={(e) => setPetWeight(parseInt(e.target.value))}
                    aria-label={`Pet weight in kilograms: ${petWeight}`}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    Life Stage
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['puppy', 'adult', 'senior'] as const).map((stage) => (
                      <button
                        key={stage}
                        onClick={() => setPetLifeStage(stage)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                          petLifeStage === stage
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {stage === 'puppy' && `👶 ${foodPetType === 'cat' ? 'Kitten' : 'Puppy'}`}
                        {stage === 'adult' && '💪 Adult'}
                        {stage === 'senior' && '👴 Senior'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    Activity Level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['sedentary', 'normal', 'active'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setActivityLevel(level)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                          activityLevel === level
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {level === 'sedentary' && '😴 Sedentary'}
                        {level === 'normal' && '🚶 Normal'}
                        {level === 'active' && '🏃 Active'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {foodPetType === 'bird' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Bird Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setBirdSize(size)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        birdSize === size
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {size === 'small' && '🐦 Small'}
                      {size === 'medium' && '🦜 Medium'}
                      {size === 'large' && '🦜 Large'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Food Recommendation Result */}
            {foodRecommendation && (
              <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                  <ScaleIcon className="w-5 h-5 mr-2 text-green-500" />
                  Daily Food Recommendation
                </h3>

                {foodPetType === 'dog' && 'cups' in foodRecommendation && (
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-green-600">
                      {foodRecommendation.cups} cups/day
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      {foodRecommendation.description}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      💡 {foodRecommendation.note}
                    </p>
                  </div>
                )}

                {foodPetType === 'cat' && 'calories' in foodRecommendation && (
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-green-600">
                      ~{foodRecommendation.calories} calories/day
                    </p>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                        <p className="text-sm text-slate-500">Wet Food</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200">
                          {foodRecommendation.wetFood}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                        <p className="text-sm text-slate-500">Dry Food</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200">
                          {foodRecommendation.dryFood}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      💡 {foodRecommendation.note}
                    </p>
                  </div>
                )}

                {foodPetType === 'bird' && 'seeds' in foodRecommendation && (
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-sm text-slate-500">Seeds</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200">
                        {foodRecommendation.seeds}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-sm text-slate-500">Pellets</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200">
                        {foodRecommendation.pellets}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-sm text-slate-500">Fresh Foods</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200">
                        {foodRecommendation.fresh}
                      </p>
                    </div>
                  </div>
                )}

                {foodPetType === 'rabbit' && 'hay' in foodRecommendation && (
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-sm text-slate-500">🌾 Hay</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200">
                        {foodRecommendation.hay}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-sm text-slate-500">🥣 Pellets</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200">
                        {foodRecommendation.pellets}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-sm text-slate-500">🥬 Fresh Greens</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200">
                        {foodRecommendation.greens}
                      </p>
                    </div>
                  </div>
                )}

                {foodPetType === 'hamster' && 'daily' in foodRecommendation && (
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-sm text-slate-500">Daily Food</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200">
                        {foodRecommendation.daily}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-sm text-slate-500">Treats</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200">
                        {foodRecommendation.treats}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              ⚠️ These are general guidelines. Consult your vet for personalized recommendations.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center">
          <HeartIcon className="w-4 h-4 text-red-500 mr-1" />
          Made with love for pet parents by PetBhai
        </p>
      </div>
    </div>
  );
};

export default PetTools;
