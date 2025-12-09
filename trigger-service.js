
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/apps/backend/src/app.module');
const { TicketsService } = require('./dist/apps/backend/src/modules/tickets/tickets.service');

async function main() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const ticketsService = app.get(TicketsService);

    const ticketId = 'TKT-1765234093051-XLMIF'; // Wait, this is ticket NUMBER. I need ID.
    // I need to find ID from Number first.
    const prisma = app.get('PrismaService'); // Or PrismaService class
    const ticket = await prisma.ticket.findUnique({ where: { ticketNumber: ticketId } });
    
    if (!ticket) {
      console.error('Ticket not found');
      return;
    }

    console.log(`Calling getRecommendedAmbulances for ticket ID: ${ticket.id}`);
    const result = await ticketsService.getRecommendedAmbulances(ticket.id);
    
    console.log('Result count:', result.length);
    const amb = result.find(r => r.ambulance.callSign.includes('4691'));
    if (amb) {
      console.log('Ambulance 4691 found in result!');
      console.log('Zone Logs in result:', amb.zoneLogs.length);
    } else {
      console.log('Ambulance 4691 NOT found in result.');
    }

    await app.close();
  } catch (error) {
    console.error(error);
  }
}

main();
