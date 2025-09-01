import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtAuthGuard } from '../../auth/guards/ws-jwt-auth.guard';

@WebSocketGateway({
  namespace: 'hospitals',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@UseGuards(WsJwtAuthGuard)
export class HospitalsGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('join-hospital-room')
  async handleJoinHospitalRoom(
    @MessageBody() data: { hospitalId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { hospitalId } = data;
    await client.join(`hospital-${hospitalId}`);
    return { event: 'joined-hospital-room', hospitalId };
  }

  @SubscribeMessage('leave-hospital-room')
  async handleLeaveHospitalRoom(
    @MessageBody() data: { hospitalId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { hospitalId } = data;
    await client.leave(`hospital-${hospitalId}`);
    return { event: 'left-hospital-room', hospitalId };
  }

  @SubscribeMessage('subscribe-to-alerts')
  async handleSubscribeToAlerts(@ConnectedSocket() client: Socket) {
    await client.join('capacity-alerts');
    return { event: 'subscribed-to-alerts' };
  }

  @SubscribeMessage('unsubscribe-from-alerts')
  async handleUnsubscribeFromAlerts(@ConnectedSocket() client: Socket) {
    await client.leave('capacity-alerts');
    return { event: 'unsubscribed-from-alerts' };
  }

  // Methods to emit events to connected clients
  emitCapacityUpdate(hospitalId: string, capacityData: any) {
    this.server.to(`hospital-${hospitalId}`).emit('capacity-updated', {
      hospitalId,
      capacity: capacityData,
      timestamp: new Date(),
    });
  }

  emitCapacityAlert(alert: any) {
    this.server.to('capacity-alerts').emit('capacity-alert', {
      ...alert,
      timestamp: new Date(),
    });
  }

  emitHospitalStatusChange(hospitalId: string, status: string) {
    this.server.to(`hospital-${hospitalId}`).emit('status-changed', {
      hospitalId,
      status,
      timestamp: new Date(),
    });
  }
}
