"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  MessageCircle,
  Shield,
  Users,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  discordUsername: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  general?: string;
}

type FormStatus = "idle" | "submitting" | "success" | "error";

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "general_support",
    message: "",
    discordUsername: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [responseMessage, setResponseMessage] = useState("");

  const contactMethods = [
    {
      icon: MessageCircle,
      title: "General Support",
      description: "Questions about the bot or the web app",
      contact: "support@pathway.gg",
      response: "24-48 hours",
    },
    {
      icon: Shield,
      title: "Privacy & Legal",
      description: "Privacy concerns or data requests",
      contact: "legal@pathway.gg",
      response: "1-2 business days",
    },
    {
      icon: Users,
      title: "Discord Community",
      description: "Join the community for quick help and updates",
      contact: "Join Server",
      href: "#",
      response: "Immediate",
    },
    {
      icon: Mail,
      title: "Bug Reports",
      description: "Found something broken? Let us know",
      contact: "support@pathway.gg",
      response: "24-48 hours",
    },
  ];

  const subjectOptions = [
    { value: "general_support", label: "General Support" },
    { value: "sales_inquiry", label: "Sales & Enterprise" },
    { value: "bug_report", label: "Bug Report" },
    { value: "feature_request", label: "Feature Request" },
    { value: "legal_privacy", label: "Legal & Privacy" },
    { value: "partnership", label: "Partnership Inquiry" },
    { value: "other", label: "Other" },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    } else if (formData.message.trim().length > 5000) {
      newErrors.message = "Message must be less than 5000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setStatus("submitting");
    setErrors({});
    setResponseMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject,
          message: formData.message.trim(),
          discordUsername: formData.discordUsername.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setResponseMessage(data.message);
        // Reset form
        setFormData({
          name: "",
          email: "",
          subject: "general_support",
          message: "",
          discordUsername: "",
        });
      } else {
        setStatus("error");
        if (data.code === "VALIDATION_ERROR" && data.details) {
          // Map validation errors to form fields
          const fieldErrors: FormErrors = {};
          data.details.forEach((detail: { field: string; message: string }) => {
            fieldErrors[detail.field as keyof FormErrors] = detail.message;
          });
          setErrors(fieldErrors);
        } else if (data.code === "RATE_LIMIT_EXCEEDED") {
          setErrors({
            general:
              "You've submitted too many messages. Please try again later.",
          });
        } else {
          setErrors({
            general: data.error || "Failed to send message. Please try again.",
          });
        }
      }
    } catch (error) {
      setStatus("error");
      setErrors({
        general:
          "Network error. Please check your connection and try again, or email us directly.",
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-background to-muted py-20">
        <div className="container max-w-4xl mx-auto px-4 md:px-8 text-center">
          <Mail className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're here to help. Choose the best way to reach us or send us a
            message below.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div key={method.title} className="card p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-primary/20 p-3 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg">
                        {method.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Response: {method.response}
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {method.description}
                  </p>
                  {method.href ? (
                    <Link
                      href={method.href}
                      className="btn-primary w-full justify-center"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {method.contact}
                    </Link>
                  ) : (
                    <a
                      href={`mailto:${method.contact}`}
                      className="btn-outline w-full justify-center"
                    >
                      {method.contact}
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contact Form */}
          <div className="card p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-heading font-bold mb-6 text-center">
              Send Us a Message
            </h2>

            {/* Success Message */}
            {status === "success" && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    Message sent successfully!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                    {responseMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {status === "error" && errors.general && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400">
                    Error
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    {errors.general}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block mb-2 font-medium">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`input w-full ${
                    errors.name ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  placeholder="Your name"
                  disabled={status === "submitting"}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block mb-2 font-medium">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`input w-full ${
                    errors.email ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  placeholder="your@email.com"
                  disabled={status === "submitting"}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Discord Username (Optional) */}
              <div>
                <label
                  htmlFor="discordUsername"
                  className="block mb-2 font-medium"
                >
                  Discord Username{" "}
                  <span className="text-muted-foreground text-sm">
                    (Optional)
                  </span>
                </label>
                <input
                  type="text"
                  id="discordUsername"
                  name="discordUsername"
                  value={formData.discordUsername}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="username#1234"
                  disabled={status === "submitting"}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Include your Discord username if you need help with your
                  account.
                </p>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block mb-2 font-medium">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className={`input w-full ${
                    errors.subject ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  disabled={status === "submitting"}
                >
                  {subjectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.subject && (
                  <p className="text-sm text-red-500 mt-1">{errors.subject}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block mb-2 font-medium">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className={`input w-full ${
                    errors.message ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  rows={6}
                  placeholder="Tell us what's on your mind..."
                  disabled={status === "submitting"}
                />
                {errors.message && (
                  <p className="text-sm text-red-500 mt-1">{errors.message}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.message.length} / 5000 characters
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-primary w-full justify-center"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground">
              For fastest response, join the Discord server and ask in the support channel.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
