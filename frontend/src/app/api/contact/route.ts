import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRateLimit } from "@/lib/api/rate-limit";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Contact Form API Route
 *
 * Handles contact form submissions from the public website.
 *
 * TODO: Integrate with email service (SendGrid, AWS SES, or Resend)
 * TODO: Implement rate limiting per IP address
 */

// Validation schema
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  subject: z.enum([
    "general_support",
    "sales_inquiry",
    "bug_report",
    "feature_request",
    "legal_privacy",
    "partnership",
    "other",
  ]),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be less than 5000 characters"),
  discordUsername: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const RATE_LIMIT = 3; // Max submissions per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function getSubjectLabel(subject: string): string {
  const labels: Record<string, string> = {
    general_support: "General Support",
    sales_inquiry: "Sales & Enterprise",
    bug_report: "Bug Report",
    feature_request: "Feature Request",
    legal_privacy: "Legal & Privacy",
    partnership: "Partnership Inquiry",
    other: "Other",
  };
  return labels[subject] || subject;
}

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    // Check rate limit
    if (withRateLimit(request, { limit: RATE_LIMIT, windowMs: RATE_WINDOW, keyPrefix: "contact" })) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    const service = createServiceClient();
    const db = service as unknown as { from: (table: string) => any };
    const { error: insertError } = await db.from("contact_submissions").insert({
      name: validatedData.name,
      email: validatedData.email,
      subject: validatedData.subject,
      message: validatedData.message,
      discord_username: validatedData.discordUsername || null,
      ip_address: ip,
      user_agent: request.headers.get("user-agent"),
    });

    if (insertError) {
      console.error("Contact form save error:", insertError);
      return NextResponse.json(
        {
          error:
            "An unexpected error occurred. Please try again or email us directly at support@pathway.gg",
          code: "INTERNAL_ERROR",
        },
        { status: 500 }
      );
    }

    // TODO: Send email notification
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'contact@pathway.gg',
    //   to: getDestinationEmail(validatedData.subject),
    //   subject: `[Contact Form] ${getSubjectLabel(validatedData.subject)} - ${validatedData.name}`,
    //   html: generateEmailTemplate(validatedData),
    // });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message:
          "Your message has been sent successfully. We'll get back to you within 24-48 hours.",
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error("Contact form error:", error);
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred. Please try again or email us directly at support@pathway.gg",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

// Helper function to route emails to appropriate team
function getDestinationEmail(subject: string): string {
  const emailMap: Record<string, string> = {
    general_support: "support@pathway.gg",
    sales_inquiry: "sales@pathway.gg",
    bug_report: "support@pathway.gg",
    feature_request: "support@pathway.gg",
    legal_privacy: "legal@pathway.gg",
    partnership: "sales@pathway.gg",
    other: "support@pathway.gg",
  };
  return emailMap[subject] || "support@pathway.gg";
}

// Helper function to generate email HTML (example template)
function generateEmailTemplate(data: ContactFormData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6366f1; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #555; }
          .value { margin-top: 5px; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Form Submission</h2>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">From:</div>
              <div class="value">${data.name} (${data.email})</div>
            </div>

            <div class="field">
              <div class="label">Subject:</div>
              <div class="value">${getSubjectLabel(data.subject)}</div>
            </div>

            ${
              data.discordUsername
                ? `
            <div class="field">
              <div class="label">Discord Username:</div>
              <div class="value">${data.discordUsername}</div>
            </div>
            `
                : ""
            }

            <div class="field">
              <div class="label">Message:</div>
              <div class="value">${data.message.replace(/\n/g, "<br>")}</div>
            </div>

            <div class="footer">
              <p>Sent from Pathway Contact Form</p>
              <p>Timestamp: ${new Date().toISOString()}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
