import { Module } from '@nestjs/common';
import { SocketModule } from './sockets/socket.module';
import { MailModule } from 'src/core/mail/mail.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auditoria } from '../modules/auditoria/entities/auditoria.entity';
import { ActionLogInterceptor } from './interceptors/action-log.interceptor';

@Module({
  imports: [SocketModule, MailModule, TypeOrmModule.forFeature([Auditoria])],
  providers: [ActionLogInterceptor],
  exports: [SocketModule, MailModule, ActionLogInterceptor],
})
export class CommonModule {}
