const mongoose = require('mongoose');
const GameCard = require('./models/GameCard');
require('dotenv').config({ path: './config.env' });

const gameCards = [
  {
    name: 'Friendly Cards',
    difficulty: 'friendly',
    description: 'Easy & Fun',
    color: '#4CAF50',
    challenges: [
      'Tell a joke',
      'Do 5 jumping jacks',
      'Sing a song',
      'Dance for 30 seconds',
      'Make a funny face'
    ]
  },
  {
    name: 'Easy Cards',
    difficulty: 'easy',
    description: 'Beginner Level',
    color: '#2196F3',
    challenges: [
      'Do 10 push-ups',
      'Tell a story',
      'Imitate an animal',
      'Do a magic trick',
      'Recite a poem'
    ]
  },
  {
    name: 'Medium Cards',
    difficulty: 'medium',
    description: 'Intermediate',
    color: '#FF9800',
    challenges: [
      'Do 20 sit-ups',
      'Speak in a different accent for 1 minute',
      'Do a handstand',
      'Tell a scary story',
      'Do an impression of someone famous'
    ]
  },
  {
    name: 'Hard Cards',
    difficulty: 'hard',
    description: 'Advanced',
    color: '#F44336',
    challenges: [
      'Do 30 burpees',
      'Hold a plank for 2 minutes',
      'Do a backflip',
      'Speak backwards for 30 seconds',
      'Do a one-handed push-up'
    ]
  },
  {
    name: 'Extreme Cards',
    difficulty: 'extreme',
    description: 'Expert Level',
    color: '#9C27B0',
    challenges: [
      'Do 50 push-ups',
      'Hold a handstand for 1 minute',
      'Do a cartwheel',
      'Speak in tongues for 1 minute',
      'Do a split'
    ]
  },
  {
    name: 'XXX Cards',
    difficulty: 'xxx',
    description: 'Adult Content',
    color: '#E91E63',
    challenges: [
      'Tell a dirty joke',
      'Do a seductive dance',
      'Give someone a lap dance',
      'Strip to your underwear',
      'Kiss someone passionately'
    ]
  },
  {
    name: 'Killer Cards',
    difficulty: 'killer',
    description: 'Ultimate Challenge',
    color: '#000000',
    challenges: [
      'Do 100 push-ups',
      'Hold a plank for 5 minutes',
      'Do a backflip off a chair',
      'Speak in tongues for 3 minutes',
      'Do a one-handed handstand'
    ]
  }
];

async function seedGameCards() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing game cards
    await GameCard.deleteMany({});
    console.log('Cleared existing game cards');

    // Insert new game cards
    const insertedCards = await GameCard.insertMany(gameCards);
    console.log(`Inserted ${insertedCards.length} game cards`);

    console.log('Game cards seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding game cards:', error);
    process.exit(1);
  }
}

seedGameCards(); 