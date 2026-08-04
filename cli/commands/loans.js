import { Command } from 'commander';
import chalk from 'chalk';
import { createClient } from '@insforge/sdk';

export const loansCommand = new Command('loans')
  .description('Gestión de préstamos (listar, consultar)');

loansCommand
  .command('list')
  .description('Lista todos los préstamos registrados')
  .option('-l, --limit <number>', 'Límite de préstamos a mostrar', '10')
  .action(async (options) => {
    try {
      const url = process.env.VITE_INSFORGE_URL || 'https://api.ultramoney.app';
      const key = process.env.VITE_INSFORGE_ANON_KEY || 'ik_12002a3fd3274a14e562bcce4a015fee';

      const insforge = createClient({ baseUrl: url, anonKey: key });

      console.log(chalk.blue(`Consultando los últimos ${options.limit} préstamos...`));
      
      const { data, error } = await insforge.database
        .from('loans')
        .select('*')
        .order('id', { ascending: false })
        .limit(Number(options.limit));

      if (error) {
        console.log(chalk.red('Error al consultar préstamos:'), error);
        return;
      }

      if (data && data.length > 0) {
        console.table(data.map((l) => ({
          ID: l.id.substring(0, 8),
          Cliente: l.clientname || l.clientName || 'General',
          Monto: `RD$ ${l.amount}`,
          Tipo: l.loantype || l.loanType || 'Amortizado',
          Balance: `RD$ ${l.remainingbalance || l.remainingBalance || 0}`,
          Estado: l.status
        })));
      } else {
        console.log(chalk.yellow('No hay préstamos registrados.'));
      }
    } catch (err) {
      console.log(chalk.red('Error inesperado:'), err.message);
    }
  });
