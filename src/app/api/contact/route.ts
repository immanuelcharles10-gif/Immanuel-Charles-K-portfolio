import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message must be less than 2000 characters.' },
        { status: 400 }
      );
    }

    // 1. Store message in Firebase Firestore under "messages" collection
    let firestoreSaved = false;
    try {
      await addDoc(collection(db, 'messages'), {
        name,
        email,
        message,
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        read: false,
      });
      firestoreSaved = true;
    } catch (fsError) {
      console.error('Error saving message to Firebase Firestore:', fsError);
    }

    // 2. Send email notification via Nodemailer (if credentials configured)
    let emailSent = false;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: Number(process.env.EMAIL_PORT) || 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: `"${name}" <${process.env.EMAIL_USER}>`, // Send via authenticated email
          replyTo: email,
          to: 'immanuelcharles10@gmail.com',
          subject: `New Portfolio Contact from ${name}`,
          text: `You have received a new message from your portfolio website.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\n---\nSent at: ${new Date().toLocaleString()}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #111;">
              <h2>New Message from ${name}</h2>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              <p style="white-space: pre-wrap; font-size: 16px;">${message}</p>
              <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666;">Sent from your portfolio website at ${new Date().toLocaleString()}</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
      } catch (emailErr) {
        console.error('Nodemailer send error:', emailErr);
      }
    }

    // Return success if message was saved to Firebase Firestore OR sent via email
    if (firestoreSaved || emailSent) {
      return NextResponse.json(
        { success: true, savedToFirebase: firestoreSaved },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save or send message. Please try again later.' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}

