import { Command } from 'commander';
import chalk from 'chalk';
import { createClient } from '@insforge/sdk';

export const clientsCommand = new Command('clients')
  .description('Gestión de clientes (listar, buscar, etc.)');

clientsCommand
  .command('list')
  .description('Lista todos los clientes registrados')
  .option('-l, --limit <number>', 'Límite de clientes a mostrar', '10')
  .action(async (options) => {
    try {
      const url = process.env.VITE_INSFORGE_URL;
      const key = process.env.VITE_INSFORGE_ANON_KEY;
      
      if (!url || !key) {
        console.log(chalk.red('Error: Variables de entorno VITE_INSFORGE_URL o VITE_INSFORGE_ANON_KEY no encontradas. Asegúrese de correr este script desde el root del proyecto donde existe .env.local'));
        process.exit(1);
      }

      const insforge = createClient({
        baseUrl: url,
        anonKey: key
      });

      console.log(chalk.blue(`Consultando los últimos ${options.limit} clientes...`));
      
      const { data, error } = await insforge.database
        .from('clients')
        .select('*')
        .order('id', { ascending: false })
        .limit(Number(options.limit));

      if (error) {
        console.log(chalk.red('Error al consultar clientes:'), error);
        return;
      }

      if (data && data.length > 0) {
        console.table(data.map((c) => ({
          ID: c.id,
          Nombre: `${c.name} ${c.lastname}`,
          Cedula: c.cedula,
          Telefono: c.phone
        })));
      } else {
        console.log(chalk.yellow('No hay clientes registrados.'));
      }
    } catch (err) {
      console.log(chalk.red('Error inesperado:'), err.message);
    }
  });
