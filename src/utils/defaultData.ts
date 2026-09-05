import { HeadsUpItem, ImposterWord, WheelCategory } from '../types';

export const DEFAULT_HEADS_UP_ITEMS: HeadsUpItem[] = [
  // Movies
  { id: 'm1', category: 'movies', text: 'Titanic', hint: 'Ocean romance with an iceberg' },
  { id: 'm2', category: 'movies', text: 'Jurassic Park', hint: 'Dinosaur theme park' },
  { id: 'm3', category: 'movies', text: 'Finding Nemo', hint: 'Clownfish looking for his son' },
  { id: 'm4', category: 'movies', text: 'Harry Potter', hint: 'Boy wizard with lightning scar' },
  { id: 'm5', category: 'movies', text: 'The Lion King', hint: 'Hakuna Matata in the savannah' },
  { id: 'm6', category: 'movies', text: 'Avatar', hint: 'Blue people on Pandora' },
  { id: 'm7', category: 'movies', text: 'Inception', hint: 'Dream within a dream' },
  { id: 'm8', category: 'movies', text: 'Spider-Man', hint: 'Friendly neighborhood web slinger' },
  { id: 'm9', category: 'movies', text: 'Frozen', hint: 'Let it go in the snow' },
  { id: 'm10', category: 'movies', text: 'Barbie', hint: 'Pink world and Ken' },
  { id: 'm11', category: 'movies', text: 'The Matrix', hint: 'Red pill or blue pill' },
  { id: 'm12', category: 'movies', text: 'Star Wars', hint: 'May the force be with you' },
  { id: 'm13', category: 'movies', text: 'Ratatouille', hint: 'Little chef mouse in Paris' },
  { id: 'm14', category: 'movies', text: 'Pirates of the Caribbean', hint: 'Captain Jack Sparrow' },
  { id: 'm15', category: 'movies', text: 'Back to the Future', hint: 'DeLorean time machine' },

  // Characters
  { id: 'c1', category: 'characters', text: 'Mickey Mouse', hint: 'Iconic Disney mouse with red shorts' },
  { id: 'c2', category: 'characters', text: 'SpongeBob SquarePants', hint: 'Pineapple under the sea' },
  { id: 'c3', category: 'characters', text: 'Sherlock Holmes', hint: 'Detective of 221B Baker Street' },
  { id: 'c4', category: 'characters', text: 'Batman', hint: 'Dark Knight of Gotham City' },
  { id: 'c5', category: 'characters', text: 'Pikachu', hint: 'Yellow electric Pokémon' },
  { id: 'c6', category: 'characters', text: 'Super Mario', hint: 'Italian plumber saving Princess Peach' },
  { id: 'c7', category: 'characters', text: 'Darth Vader', hint: 'I am your father' },
  { id: 'c8', category: 'characters', text: 'James Bond', hint: 'Secret Agent 007' },
  { id: 'c9', category: 'characters', text: 'Iron Man', hint: 'Billionaire Tony Stark in high-tech suit' },
  { id: 'c10', category: 'characters', text: 'Elsa', hint: 'Snow Queen with ice powers' },
  { id: 'c11', category: 'characters', text: 'Shrek', hint: 'Friendly green ogre in a swamp' },
  { id: 'c12', category: 'characters', text: 'The Joker', hint: 'Why so serious?' },
  { id: 'c13', category: 'characters', text: 'Winnie the Pooh', hint: 'Bear who loves honey' },
  { id: 'c14', category: 'characters', text: 'Yoda', hint: 'Wise green Jedi master' },

  // Animals
  { id: 'a1', category: 'animals', text: 'Kangaroo', hint: 'Australian hopper with pouch' },
  { id: 'a2', category: 'animals', text: 'Penguin', hint: 'Tuxedo bird that waddles in Antarctica' },
  { id: 'a3', category: 'animals', text: 'Giraffe', hint: 'Tallest animal with long neck' },
  { id: 'a4', category: 'animals', text: 'Golden Retriever', hint: 'Friendly, fluffy family dog' },
  { id: 'a5', category: 'animals', text: 'Octopus', hint: 'Eight tentacled sea genius' },
  { id: 'a6', category: 'animals', text: 'Chameleon', hint: 'Color changing lizard' },
  { id: 'a7', category: 'animals', text: 'Flamingo', hint: 'Pink bird standing on one leg' },
  { id: 'a8', category: 'animals', text: 'Gorilla', hint: 'Powerful silverback primate' },
  { id: 'a9', category: 'animals', text: 'Koala', hint: 'Eucalyptus eating tree sleeper' },
  { id: 'a10', category: 'animals', text: 'Giant Panda', hint: 'Black and white bamboo muncher' },
  { id: 'a11', category: 'animals', text: 'Dolphin', hint: 'Playful jumping ocean mammal' },
  { id: 'a12', category: 'animals', text: 'Cheetah', hint: 'Fastest land animal on Earth' },
  { id: 'a13', category: 'animals', text: 'Owl', hint: 'Nocturnal wise bird that turns head 270 degrees' },

  // Restaurant & Food
  { id: 'f1', category: 'food', text: 'Truffle French Fries', hint: 'Crispy potato snack with gourmet aroma' },
  { id: 'f2', category: 'food', text: 'Spaghetti Carbonara', hint: 'Classic pasta with egg, cheese and bacon' },
  { id: 'f3', category: 'food', text: 'Wood-Fired Pizza', hint: 'Cheesy blistered crust baked in brick oven' },
  { id: 'f4', category: 'food', text: 'Double Bacon Cheeseburger', hint: 'Juicy American diner staple' },
  { id: 'f5', category: 'food', text: 'Chocolate Lava Cake', hint: 'Molten warm center with vanilla ice cream' },
  { id: 'f6', category: 'food', text: 'Crispy Calamari', hint: 'Fried squid rings with lemon aioli' },
  { id: 'f7', category: 'food', text: 'Strawberry Milkshake', hint: 'Creamy cold dessert with whipped cream' },
  { id: 'f8', category: 'food', text: 'Sushi Platter', hint: 'Fresh salmon, tuna, and wasabi rolls' },
];

export const DEFAULT_IMPOSTER_WORDS: ImposterWord[] = [
  { id: 'iw1', category: 'Italian Cuisine', word: 'Lasagna', hintForImposter: 'A popular baked Italian comfort dish' },
  { id: 'iw2', category: 'Fast Food', word: 'Cheeseburger', hintForImposter: 'A classic handheld savory favorite' },
  { id: 'iw3', category: 'Desserts', word: 'Tiramisu', hintForImposter: 'A coffee-infused layered sweet treat' },
  { id: 'iw4', category: 'Breakfast Favorites', word: 'Pancakes with Maple Syrup', hintForImposter: 'Fluffy griddle breakfast food' },
  { id: 'iw5', category: 'Beverages', word: 'Iced Caramel Latte', hintForImposter: 'A sweetened cold cafe drink' },
  { id: 'iw6', category: 'Kitchen Utensils', word: 'Rolling Pin', hintForImposter: 'A tool used in baking and dough prep' },
  { id: 'iw7', category: 'Restaurant Staff', word: 'Head Chef', hintForImposter: 'An important restaurant role' },
  { id: 'iw8', category: 'Zoo Animals', word: 'Giraffe', hintForImposter: 'A famous mammal known for height' },
  { id: 'iw9', category: 'Cinema Blockbusters', word: 'The Avengers', hintForImposter: 'A massive team ensemble film' },
  { id: 'iw10', category: 'Vacation Destinations', word: 'Tropical Beach Resort', hintForImposter: 'A relaxing getaway with warm weather' },
  { id: 'iw11', category: 'Board Games', word: 'Monopoly', hintForImposter: 'A classic game about buying property' },
  { id: 'iw12', category: 'Musical Instruments', word: 'Grand Piano', hintForImposter: 'A large classical acoustic instrument' },
];

export const DEFAULT_WHEEL_CATEGORIES: WheelCategory[] = [
  {
    id: 'wc-food',
    name: 'Food & Dining',
    color: '#E11D48', // rose-600
    iconName: 'Utensils',
    questions: [
      'What is the single best meal you have ever eaten in your entire life?',
      'If you could only eat one country’s cuisine for the rest of your life, which would it be?',
      'What food combination sounds completely bizarre to others, but you secretly love?',
      'Who at this table would survive the longest as a chef during a busy dinner rush?',
      'Pineapple on pizza: passionately defend or vigorously condemn it!',
      'What is a dish you hated as a child that you now genuinely enjoy?',
      'If you could design the ultimate burger or dessert right now, what would be in it?',
    ],
  },
  {
    id: 'wc-music',
    name: 'Music & Vibes',
    color: '#7C3AED', // violet-600
    iconName: 'Music',
    questions: [
      'What song is an instant mood-booster that you can never skip?',
      'What was the very first album, artist, or song you were utterly obsessed with?',
      'If your life right now had a background theme soundtrack, what song would be playing?',
      'Which music artist would you pay any amount of money to see front-row in concert?',
      'What is your all-time guilty pleasure karaoke song to belt out with friends?',
      'Who at this table has the most unexpected music taste in private?',
    ],
  },
  {
    id: 'wc-movies',
    name: 'Movies & TV',
    color: '#2563EB', // blue-600
    iconName: 'Film',
    questions: [
      'What movie can you quote almost line-for-line from memory?',
      'If a movie were filmed about this table today, what genre would it be and who is the protagonist?',
      'What film or TV show ending left you completely speechless or angry?',
      'Which fictional universe would you choose to live in for just one week?',
      'Who is your favorite movie villain of all time and why do you kind of root for them?',
      'What movie does everyone else seem to adore that you secretly find overrated?',
    ],
  },
  {
    id: 'wc-nature',
    name: 'Nature & Animals',
    color: '#059669', // emerald-600
    iconName: 'Trees',
    questions: [
      'If each person at this table were an animal, which animal matches each person best?',
      'Would you rather explore the deepest unknown trenches of the ocean or uncharted space?',
      'What is the wildest or most surprising encounter with wildlife you have ever experienced?',
      'If you could adopt any animal (domestic, wild, or prehistoric) with zero danger, what would it be?',
      'Are you more of a cozy cabin in the snowy mountains person or a sunny bungalow on the beach?',
    ],
  },
  {
    id: 'wc-table',
    name: 'Table Confessions',
    color: '#D97706', // amber-600
    iconName: 'Flame',
    questions: [
      'What is an unusual or quirky habit you have that most casual acquaintances don’t know about?',
      'What is the funniest or most awkward misunderstanding you have ever gotten caught in?',
      'If everyone at this table was arrested together tonight, what would people assume we did?',
      'What is something silly you believed was totally real until embarrassingly late in life?',
      'What is your proudest non-academic, non-career minor skill (e.g. parallel parking, trivia, tossing items into trash)?',
      'What was your most catastrophic culinary or cooking attempt in the kitchen?',
    ],
  },
  {
    id: 'wc-hypothetical',
    name: 'Would You Rather',
    color: '#0D9488', // teal-600
    iconName: 'HelpCircle',
    questions: [
      'Would you rather receive free meals at any top restaurant worldwide forever or unlimited first-class flights?',
      'Would you rather always speak strictly in rhyming couplets or only be allowed to whisper?',
      'Would you rather dine with a historic figure from 500 years ago or someone 500 years into the future?',
      'Would you rather live without internet for a month or live without hot water and air conditioning for a month?',
      'Would you rather know the truth behind all secret conspiracies or know the secret winner of every future sports match?',
    ],
  },
];
