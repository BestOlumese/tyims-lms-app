import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  await transporter.sendMail({
    from: `"TYIMS LMS" <${process.env.EMAIL_FROM}>`,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

// Reusable email templates

export const emailTemplates = {
  enrollmentConfirmation(params: {
    userName: string;
    courseTitle: string;
    courseUrl: string;
  }): { subject: string; html: string } {
    return {
      subject: `You're enrolled in "${params.courseTitle}"`,
      html: `
        <h2>Welcome to ${params.courseTitle}!</h2>
        <p>Hi ${params.userName}, your enrollment is confirmed.</p>
        <p><a href="${params.courseUrl}">Start learning now →</a></p>
        <p>TYIMS LMS Team</p>
      `,
    };
  },

  certificateIssued(params: {
    userName: string;
    courseTitle: string;
    certificateUrl: string;
  }): { subject: string; html: string } {
    return {
      subject: `Your certificate for "${params.courseTitle}" is ready!`,
      html: `
        <h2>Congratulations, ${params.userName}!</h2>
        <p>You've completed <strong>${params.courseTitle}</strong>.</p>
        <p><a href="${params.certificateUrl}">Download your certificate →</a></p>
        <p>TYIMS LMS Team</p>
      `,
    };
  },

  payoutProcessed(params: {
    instructorName: string;
    amountNGN: number;
  }): { subject: string; html: string } {
    return {
      subject: "Your TYIMS payout has been processed",
      html: `
        <h2>Payout Processed</h2>
        <p>Hi ${params.instructorName}, your payout of <strong>₦${params.amountNGN.toLocaleString()}</strong> has been sent to your bank account.</p>
        <p>It may take 1–3 business days to reflect in your account.</p>
        <p>TYIMS LMS Team</p>
      `,
    };
  },

  videoProcessed(params: {
    instructorName: string;
    lessonTitle: string;
    courseUrl: string;
  }): { subject: string; html: string } {
    return {
      subject: `Your video "${params.lessonTitle}" is ready`,
      html: `
        <h2>Video Processing Complete</h2>
        <p>Hi ${params.instructorName}, your video <strong>${params.lessonTitle}</strong> has been processed and is now live.</p>
        <p><a href="${params.courseUrl}">View your course →</a></p>
        <p>TYIMS LMS Team</p>
      `,
    };
  },
};
