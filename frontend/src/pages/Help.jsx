import { useState } from "react";
import { useToast } from "../hooks/useToast";
import UiIcon from "../components/ui/UiIcon";
import "../styles/professional.css";

export default function Help() {
  const toast = useToast();
  const [activeCategory, setActiveCategory] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const categories = [
    { id: "general", iconName: "books", title: "General", desc: "Getting started basics" },
    { id: "games", iconName: "games", title: "Games", desc: "How to play and tips" },
    { id: "therapy", iconName: "speech", title: "Speech Therapy", desc: "Therapy features" },
    { id: "account", iconName: "profile", title: "Account", desc: "Profile and settings" },
    { id: "technical", iconName: "wrench", title: "Technical", desc: "Troubleshooting" },
  ];

  const faqs = {
    general: [
      { q: "What is DHYAN?", a: "DHYAN is a speech therapy and learning platform designed for children. It combines fun games with therapeutic exercises to help improve speech and communication skills." },
      { q: "How do I get started?", a: "Sign up for an account, complete your profile, and start exploring our games! We recommend starting with the Tutorial game to learn the basics." },
      { q: "Is DHYAN free?", a: "Yes! DHYAN offers a free tier with access to basic games and features. Premium features may be available for therapists and advanced users." },
      { q: "Who can use DHYAN?", a: "DHYAN is designed for children of all ages, parents, guardians, and speech therapists. Each user type has tailored features and dashboards." },
    ],
    games: [
      { q: "What games are available?", a: "We offer various games including Memory Match, Scene Description, Object Discovery, Problem Solving, and Speech Therapy exercises. Each game targets different skills." },
      { q: "How is progress tracked?", a: "Your progress is automatically tracked! View your achievements, accuracy scores, and completed sessions in your Dashboard." },
      { q: "Can I play offline?", a: "Currently, DHYAN requires an internet connection to save your progress and provide the best experience." },
      { q: "Are the games educational?", a: "Absolutely! Every game is designed by speech therapists and educators to be both fun and beneficial for speech development." },
    ],
    therapy: [
      { q: "How does speech therapy work?", a: "Our Speech Therapy section includes guided exercises, pronunciation practice, and interactive activities. A therapist can assign specific exercises." },
      { q: "Can my therapist track my progress?", a: "Yes! If your therapist is connected to your account, they can view detailed progress reports and session history." },
      { q: "What age is appropriate?", a: "DHYAN is suitable for children ages 3-12, with adjustable difficulty levels to match each child's abilities." },
      { q: "How often should we practice?", a: "We recommend 15-20 minutes daily for best results. Consistency is key in speech therapy!" },
    ],
    account: [
      { q: "How do I reset my password?", a: "Click 'Forgot Password' on the login page, enter your email, and follow the instructions sent to your inbox." },
      { q: "Can I change my email?", a: "Currently, email changes must be requested through our support team for security reasons." },
      { q: "How do I add a child profile?", a: "Go to the Therapist Console, click 'Add Child', and fill in the required information. You can add multiple children." },
      { q: "Can I delete my account?", a: "Yes, you can delete your account from Settings > Privacy. This will permanently remove all your data." },
    ],
    technical: [
      { q: "What browsers are supported?", a: "DHYAN works best on Chrome, Firefox, Safari, and Edge (latest versions). Make sure your browser is up to date." },
      { q: "Why isn't the sound working?", a: "Check that your device's volume is up and not muted. Also, ensure your browser allows audio playback for this site." },
      { q: "The game isn't loading. What should I do?", a: "Try refreshing the page, clearing your browser cache, or using a different browser. If problems persist, contact support." },
      { q: "Is my data secure?", a: "Yes! We use industry-standard encryption and security practices. Your data is stored securely and never shared with third parties." },
    ],
  };

  const filteredFaqs = faqs[activeCategory].filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      toast.success("Message sent! We will get back to you soon.");
      setContactForm({ name: "", email: "", subject: "", message: "" });
      setSending(false);
    }, 1500);
  };

  const activeCat = categories.find((c) => c.id === activeCategory);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-title-with-icon">
          <UiIcon name="help" size={40} title="" />
          <h1 className="page-title">Help Center</h1>
        </div>
        <p className="page-subtitle">
          Find answers to common questions or get in touch with our support team
        </p>
      </div>

      <div className="card mb-6">
        <div className="search-input-wrapper">
          <span className="search-icon">
            <UiIcon name="search" size={24} title="" />
          </span>
          <input
            type="text"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input search-input"
          />
        </div>
      </div>

      <div className="category-grid mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`btn btn-lg category-btn ${activeCategory === cat.id ? 'btn-primary' : 'btn-outline'}`}
          >
            <UiIcon name={cat.iconName} size={24} title="" />
            <span className="category-title">{cat.title}</span>
            <span className="category-desc">{cat.desc}</span>
          </button>
        ))}
      </div>

      <div className="card">
        <h2 className="card-title">
          {activeCat && <UiIcon name={activeCat.iconName} size={28} title="" />}
          {activeCat?.title} FAQs
        </h2>

        <div className="faq-list">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => (
              <div
                key={idx}
                className="faq-item"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="faq-question"
                >
                  <span className="faq-q-text">Q: {faq.q}</span>
                  <UiIcon 
                    name="chevron-down" 
                    size={20} 
                    title="" 
                    className={`faq-chevron ${expandedFaq === idx ? 'expanded' : ''}`}
                  />
                </button>
                {expandedFaq === idx && (
                  <div className="faq-answer">
                    <strong>A:</strong> {faq.a}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <UiIcon name="search" size={48} title="" />
              <p>No FAQs found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="card-title">
          <UiIcon name="chat" size={28} title="" />
          Contact Support
        </h2>

        <form onSubmit={handleContactSubmit} className="form-stack">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Your Name
              </label>
              <input
                type="text"
                required
                value={contactForm.name}
                onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Email Address
              </label>
              <input
                type="email"
                required
                value={contactForm.email}
                onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Subject
            </label>
            <select
              required
              value={contactForm.subject}
              onChange={(e) => setContactForm((p) => ({ ...p, subject: e.target.value }))}
              className="form-input"
            >
              <option value="">Select a topic...</option>
              <option value="general">General Question</option>
              <option value="technical">Technical Issue</option>
              <option value="billing">Billing & Subscription</option>
              <option value="feedback">Feedback & Suggestions</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Message
            </label>
            <textarea
              required
              rows={5}
              value={contactForm.message}
              onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
              placeholder="Describe your issue or question in detail..."
              className="form-input"
              style={{ resize: "vertical", minHeight: 120 }}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="btn btn-primary btn-lg"
          >
            {sending ? "Sending..." : (
              <>
                <UiIcon name="send" size={20} title="" />
                Send Message
              </>
            )}
          </button>
        </form>

        <div className="contact-methods mt-8 pt-8 border-t">
          <div className="contact-grid">
            {[
              { iconName: "mail", label: "Email", value: "support@dhyan.com" },
              { iconName: "phone", label: "Phone", value: "+1 (555) 123-4567" },
              { iconName: "chat", label: "Live Chat", value: "Available 9AM-5PM" },
            ].map((contact) => (
              <div key={contact.label} className="contact-card">
                <UiIcon name={contact.iconName} size={36} title="" />
                <div className="contact-label">{contact.label}</div>
                <div className="contact-value">{contact.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
