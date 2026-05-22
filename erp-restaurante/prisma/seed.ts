import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const seeds = [
    { userName: 'admin', name: 'Administrador Global', role: 'GERENTE' as const, pass: 'admin' },
    { userName: 'balcao', name: 'Operador de Balcão', role: 'BALCONISTA' as const, pass: 'balcao' },
    { userName: 'garcom', name: 'Garçom Equipe A', role: 'GARCOM' as const, pass: 'garcom' },
  ];

  for (const s of seeds) {
    const passWord = await bcrypt.hash(s.pass, 10);
    await prisma.user.upsert({
      where: { userName: s.userName },
      update: { passWord, role: s.role, name: s.name },
      create: { userName: s.userName, passWord, role: s.role, name: s.name },
    });
  }

  console.log('Seed OK: admin/balcao/garcom criados/atualizados (senha = o próprio login).');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
