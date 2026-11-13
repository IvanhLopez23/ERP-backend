import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  emitToUser(userId: number, event: string, data: any) {
    this.server?.to(`user:${userId}`).emit(event, data);
  }

  emitToRole(rolId: number, event: string, data: any) {
    this.server?.to(`rol:${rolId}`).emit(event, data);
  }

  emitToGroup(grupo: string, event: string, data: any) {
    this.server?.to(`grupo:${grupo}`).emit(event, data);
  }

  emitToAll(event: string, data: any) {
    this.server?.emit(event, data);
  }
}
