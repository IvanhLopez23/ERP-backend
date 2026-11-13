import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import { MailOptions } from './interfaces/mail-options.interface';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private layoutTemplate: HandlebarsTemplateDelegate;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });

    const layoutPath = join(__dirname, 'templates', 'layout.hbs');
    const layoutSource = readFileSync(layoutPath, 'utf8');
    this.layoutTemplate = handlebars.compile(layoutSource);
  }

  async sendMail(options: MailOptions): Promise<void> {
    const { to, subject, html, text, template, context } = options;

    let bodyHtml = html;
    if (template) {
      const templatePath = join(__dirname, 'templates', `${template}.hbs`);
      const templateSource = readFileSync(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(templateSource);
      bodyHtml = compiledTemplate(context || {});
    }

    const fullHtml = this.layoutTemplate({
      subject,
      body: bodyHtml || '',
    });

    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_FROM'),
      to,
      subject,
      html: fullHtml,
      text,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    token: string,
    nombreUsuario: string,
  ): Promise<void> {
    const appUrl =
      this.configService.get<string>('APP_URL') || 'http://localhost:4200';
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    await this.sendMail({
      to,
      subject: 'Recuperación de contraseña',
      template: 'reset-password',
      context: { nombreUsuario, resetLink },
    });
  }
}
