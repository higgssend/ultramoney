import { Command } from 'commander';
import chalk from 'chalk';
import { createClient } from '@insforge/sdk';

export const paymentsCommand = new Command('payments')
  .description('Gestión de transacciones y recibos de pago');

paymentsCommand
  .command('list')
  .description('Lista las últimas transacciones de pago')
  .option('-l, --limit <number>', 'Límite de transacciones a mostrar', '10')
  .action(async (options) => {
    try {
      const url = process.env.VITE_INSFORGE_URL || 'https://api.ultramoney.app';
      const key = process.env.VITE_INSFORGE_ANON_KEY || 'ik_12002a3fd3274a14e562bcce4a015fee';

      const insforge = createClient({ baseUrl: url, anonKey: key });

      console.log(chalk.blue(`Consultando las últimas ${options.limit} transacciones de pago...`));
      
      const { data, error } = await insforge.database
        .from('transactions')
        .select('*')
        .order('id', { ascending: false })
        .limit(Number(options.limit));

      if (error) {
        console.log(chalk.red('Error al consultar transacciones:'), error);
        return;
      }

      if (data && data.length > 0) {
        console.table(data.map((t) => ({
          ID: t.id.substring(0, 8),
          Fecha: t.date,
          Monto: `RD$ ${t.amount}`,
          Tipo: t.type || 'Ingreso',
          Concepto: t.description || 'Sin concepto',
          ReciboURL: `https://ultramoney.app/recibo/${t.id}`
        })));
      } else {
        console.log(chalk.yellow('No hay transacciones de pago registradas.'));
      }
    } catch (err) {
      console.log(chalk.red('Error inesperado:'), err.message);
    }
  });
