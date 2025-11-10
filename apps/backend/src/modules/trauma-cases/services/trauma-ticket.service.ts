import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { TicketPriority, TicketPathway } from '@prisma/client';

@Injectable()
export class TraumaTicketService {
  constructor(private prisma: PrismaService) {}

  async createTicket(
    patientId: string,
    originHospitalId: string,
    destinationHospitalId: string | null,
    chiefComplaint: string,
    userId: string
  ): Promise<string> {
    console.log('Creating new ticket...');
    
    const ticketData = {
      patientId: patientId,
      originHospitalId: originHospitalId,
      destinationHospitalId: destinationHospitalId,
      priority: TicketPriority.CRITICAL,
      pathway: TicketPathway.TRAUMA,
      emergencyType: 'TRAUMA',
      emergencySeverity: 'CRITICAL',
      ticketNumber: `TRAUMA-${Date.now()}`,
      notes: chiefComplaint || 'Trauma case',
      createdById: userId,
    };

    try {
      const ticket = await this.prisma.ticket.create({
        data: ticketData,
      });
      console.log('New ticket created:', ticket.id);
      return ticket.id;
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      throw new BadRequestException(`Error creating ticket: ${error.message}`);
    }
  }

  async validateTicketExists(ticketId: string): Promise<void> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
  }
}
