#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const program = new Command();

program
  .name('ultramoney')
  .description('CLI oficial de UltraMoney para administrar clientes, préstamos y pagos desde la terminal')
  .version('1.1.0');

// Import commands
import { clientsCommand } from './commands/clients.js';
import { loansCommand } from './commands/loans.js';
import { paymentsCommand } from './commands/payments.js';

program.addCommand(clientsCommand);
program.addCommand(loansCommand);
program.addCommand(paymentsCommand);

program.parse(process.argv);
