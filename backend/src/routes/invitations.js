import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import crypto from 'crypto';
import { Resend } from 'resend';

const router = express.Router();
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// POST invite user (Admin only)
router.post('/invite', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { email, name, role } = req.body;

    if (!email || !name || !role) {
      return res.status(400).json({ error: 'Email, name, and role are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create pending user with invite token
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        status: 'pending',
        inviteToken,
        inviteTokenExpiry,
        invitedById: req.user.id
      }
    });

    // Send invitation email
    const frontendUrl = process.env.FRONTEND_URL || 'https://legal-track-nine.vercel.app';
    const inviteUrl = `${frontendUrl}/accept-invite?token=${inviteToken}`;

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'LegalTrack <notifications@resend.dev>',
        to: email,
        subject: 'You\'ve been invited to join LegalTrack',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #1e3a5f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to LegalTrack</h1>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                <p>You've been invited to join LegalTrack as a <strong>${role}</strong>.</p>
                <p>Click the button below to set up your account:</p>
                <p style="text-align: center;">
                  <a href="${inviteUrl}" class="button">Accept Invitation</a>
                </p>
                <p>This invitation link will expire in 7 days.</p>
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                <p>LegalTrack - Professional Legal Case Management</p>
              </div>
            </div>
          </body>
          </html>
        `
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request, user is created
    }

    res.status(201).json({ 
      message: 'Invitation sent successfully',
      user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status }
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET verify invite token
router.get('/verify/:token', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { inviteToken: req.params.token }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid invitation token' });
    }

    if (user.inviteTokenExpiry < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    res.json({ 
      valid: true, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST accept invitation and set password
router.post('/accept', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { inviteToken: token }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid invitation token' });
    }

    if (user.inviteTokenExpiry < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Hash password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with password and clear invite token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        status: 'active',
        inviteToken: null,
        inviteTokenExpiry: null,
        joinDate: new Date()
      }
    });

    res.json({ 
      message: 'Account activated successfully',
      user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, role: updatedUser.role }
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET pending invitations (Admin only)
router.get('/pending', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: 'pending' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        inviteTokenExpiry: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST resend invitation (Admin only)
router.post('/resend/:userId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId }
    });

    if (!user || user.status !== 'pending') {
      return res.status(400).json({ error: 'User not found or already activated' });
    }

    // Generate new invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { inviteToken, inviteTokenExpiry }
    });

    // Send invitation email
    const frontendUrl = process.env.FRONTEND_URL || 'https://legal-track-nine.vercel.app';
    const inviteUrl = `${frontendUrl}/accept-invite?token=${inviteToken}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'LegalTrack <notifications@resend.dev>',
      to: user.email,
      subject: 'Your LegalTrack invitation has been resent',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #1e3a5f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>LegalTrack Invitation</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name},</p>
              <p>Your invitation to join LegalTrack has been resent.</p>
              <p style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </p>
              <p>This link expires in 7 days.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    res.json({ message: 'Invitation resent successfully' });
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE cancel invitation (Admin only)
router.delete('/:userId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId }
    });

    if (!user || user.status !== 'pending') {
      return res.status(400).json({ error: 'User not found or already activated' });
    }

    await prisma.user.delete({ where: { id: req.params.userId } });
    res.json({ message: 'Invitation cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
