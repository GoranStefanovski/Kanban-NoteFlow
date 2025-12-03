import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendVerificationCode(email: string, code: string, username: string) {
    const fromName = this.configService.get('SMTP_FROM_NAME') || 'Personal Notepad';
    const fromEmail = this.configService.get('SMTP_FROM_EMAIL');

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Your Login Verification Code',
      html: this.getVerificationEmailTemplate(code, username),
      text: `Hello ${username},\n\nYour verification code is: ${code}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this code, please ignore this email.`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  private getVerificationEmailTemplate(code: string, username: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              border: 1px solid #e0e0e0;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .code-box {
              background-color: #fff;
              border: 2px solid #4F46E5;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #4F46E5;
              letter-spacing: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Personal Notepad</h1>
              <p>Hello ${username},</p>
            </div>
            
            <p>You requested to log in to your account. Please use the verification code below:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <p><strong>This code will expire in 5 minutes.</strong></p>
            
            <p>If you did not request this code, please ignore this email.</p>
            
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

