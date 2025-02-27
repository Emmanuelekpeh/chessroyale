import { storage } from '../server/storage';
import { config } from '../config';
import { db } from '../server/db';

async function seed() {
  try {
    console.log('Seeding database...');
    
    // Create initial puzzles
    await storage.createInitialPuzzles();
    
    // Create any other necessary initial data
    
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
