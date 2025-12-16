import { io, Socket } from 'socket.io-client';
import { authService } from './authService';
import { getWebSocketUrl } from '../utils/socketUtils';

export interface TicketUpdateEvent {
  ticket: any;
  action: string;
  timestamp: string;
}

export interface TransportEvent {
  ticket: any;
  timestamp: string;
}

export interface TicketAssignmentEvent {
  ticket: any;
  assignedTo: any;
  timestamp: string;
}

export interface EmergencyTicketEvent {
  ticket: any;
  timestamp: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentNamespace?: string;

  connect(namespace?: string) {
    if (this.socket && this.isConnected) {
      return;
    }

    const token = authService.getToken();
    if (!token) {
      console.warn('No authentication token available for WebSocket connection');
      return;
    }

    this.currentNamespace = namespace;
    const socketUrl = getWebSocketUrl(namespace);
    console.log(`[webSocketService] Connecting to: ${socketUrl}${namespace ? ` (namespace: ${namespace})` : ' (default namespace)'}`);

    this.socket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
      this.reconnect();
    });
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect(this.currentNamespace);
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentNamespace = undefined;
      this.reconnectAttempts = 0;
    }
  }

  // Subscribe to ticket updates
  subscribeToTicket(ticketId: string, callback: (event: TicketUpdateEvent) => void) {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }

    this.socket.emit('subscribeToTicket', ticketId);
    this.socket.on('ticketUpdated', callback);
  }

  // Subscribe to hospital tickets
  subscribeToHospitalTickets(hospitalId: string, callback: (event: TicketUpdateEvent) => void) {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }

    this.socket.emit('subscribeToHospitalTickets', hospitalId);
    this.socket.on('ticketUpdated', callback);
  }

  // Subscribe to assigned tickets
  subscribeToAssignedTickets(callback: (event: TicketUpdateEvent) => void) {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }

    this.socket.emit('subscribeToAssignedTickets');
    this.socket.on('ticketUpdated', callback);
  }

  // Listen for transport events
  onTransportStarted(callback: (event: TransportEvent) => void) {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }

    this.socket.on('transportStarted', callback);
  }

  onTransportCompleted(callback: (event: TransportEvent) => void) {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }

    this.socket.on('transportCompleted', callback);
  }

  // Listen for ticket assignments
  onTicketAssigned(callback: (event: TicketAssignmentEvent) => void) {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }

    this.socket.on('ticketAssigned', callback);
  }

  // Listen for emergency tickets
  onEmergencyTicket(callback: (event: EmergencyTicketEvent) => void) {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }

    this.socket.on('emergencyTicket', callback);
  }

  // Unsubscribe from events
  unsubscribe(event: string) {
    if (!this.socket) return;
    this.socket.off(event);
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

export const webSocketService = new WebSocketService();
