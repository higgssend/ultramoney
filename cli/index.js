#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from the root .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const program = new Command();

program
  .name('ultramoney-cli')
  .description('CLI para interactuar con la API de UltraMoney')
  .version('1.0.0');

// Import commands
import { clientsCommand } from './commands/clients.js';
program.addCommand(clientsCommand);

program.parse(process.argv);
