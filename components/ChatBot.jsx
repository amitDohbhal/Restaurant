"use client"
import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Send, MessageCircle, X } from "lucide-react";

import Link from "next/link";

// Helper: checks if the user is logged in

function isLoggedIn(session) {
  return !!session?.user;
}

const productQnA = [
  {
    q: "🛍 Product Information",
    a: `Q: Is this product available in stock?\nA: Yes, the product is currently available.\n\nQ: What sizes/colors are available?\nA: This product comes in [List Sizes/Colors]. Please select your preferred option from the dropdown menu.\n\nQ: Is this product genuine/original?\nA: Yes, we only sell 100% genuine and authentic products.\n\nQ: Can I see more pictures of the product?\nA: Sure! You can find multiple images in the product gallery. Let us know if you need a close-up of any specific feature.\n\nQ: Does this product have a warranty?\nA: Yes, it comes with a [Duration] warranty provided by the manufacturer.`
  },
  {
    q: "🚚 Shipping & Delivery",
    a: `Q: When will I receive my order?\nA: Delivery usually takes [3 to 7 days], depending on your location.\n\nQ: Do you offer free shipping?\nA: We offer free shipping on orders over ₹2,999. Shipping fees apply to orders below that.\n\nQ: Can I track my order?\nA: Yes, once shipped, you will receive a tracking link via email/SMS or your client dashboard.`
  },
  {
    q: "💳 Payment & Checkout",
    a: `Q: What payment methods do you accept?\nA: We accept credit/debit cards, UPI, PayPal, and Cash on Delivery (COD) in selected areas.\n\nQ: Is it safe to make a payment on your site?\nA: Absolutely. Our website uses SSL encryption and secure payment gateways to protect your data.`
  },
  {
    q: "🔁 Returns & Refunds",
    a: `Q: Can I return this product?\nA: Yes, we have a 30-day return policy. The product must be unused and in original condition.\n\nQ: How long does a refund take?\nA: Refunds are processed within 30 business days after we receive the returned item.`
  },
  {
    q: "📦 Order Status",
    a: `Q: Can I track my order?\nA: Yes, once shipped, you will receive a tracking link via email/SMS or your client dashboard.\n\nQ: Can I change or cancel my order?\nA: You can cancel or modify your order within a certain period after placing it. Please contact us immediately for assistance.`
  },
  {
    q: "🧑‍💬 Chat With Admin",
    a: `Yes, our customer support is available [Days & Hours]. You can also email us at support@info@adventureaxis.in or call +91 7351009107, 9411571947.`
  }
];

export default function ChatBot() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0); // 0: greet, 1: small talk, 2: contact, 3: product, 4: menu, 5: qna
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [product, setProduct] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);

  // FAQ/product state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [faqClicked, setFaqClicked] = useState(null);

  const PRODUCT_FAQS = [
    {
      q: "Is this product available in stock?",
      a: (prod) => prod?.inStock ? `Yes, the product is currently available. (${prod.inStock} in stock)` : "Sorry, this product is currently out of stock.",
      key: "stock"
    },
    {
      q: "What sizes/colors are available?",
      a: (prod) => {
        let sizes = prod?.sizes?.length ? prod.sizes.join(", ") : "Not specified";
        let colors = prod?.colors?.length ? prod.colors.join(", ") : "Not specified";
        return `Sizes: ${sizes}\nColors: ${colors}`;
      },
      key: "sizecolor"
    },
    {
      q: "Is this product genuine/original?",
      a: () => "Yes, we only sell 100% genuine and authentic products.",
      key: "genuine"
    },
    {
      q: "Does this product have a warranty?",
      a: (prod) => prod?.warranty ? `Yes, it comes with a ${prod.warranty} warranty provided by the manufacturer.` : "No warranty information available.",
      key: "warranty"
    },
    {
      q: "Where can I find more information about this product?",
      a: (prod) => prod?._id ?
        `You can find more information about this product at <a href="/product/${prod._id}" target="_blank" rel="noopener noreferrer" class="underline hover:text-blue-600">${prod.title}</a>`
        : "No additional information available.",
      key: "url"
    },
  ];

  const handleFaqClick = (faq) => {
    if (!selectedProduct) return;
    setFaqClicked(faq.key);
    setMessages(msgs => [
      ...msgs,
      { from: "You", sender: session?.user?.id || "user", text: faq.q, createdAt: new Date().toISOString() },
      { from: "Bot", sender: "bot", text: typeof faq.a === 'function' ? faq.a(selectedProduct) : faq.a, faqKey: faq.key, createdAt: new Date().toISOString() }
    ]);
  };

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showSupportOptions, setShowSupportOptions] = useState(false);
  const chatWindowRef = useRef(null);

  // Load chat history from DB (or localStorage fallback)
  useEffect(() => {
    async function loadHistory() {
      if (session?.user?.id) {
        try {
          const res = await fetch(`/api/getMessages?userId=${session.user.id}`);
          const data = await res.json();

          if (data.messages && Array.isArray(data.messages)) {
            setMessages((prev) => (JSON.stringify(prev) !== JSON.stringify(data.messages) ? data.messages : prev));
            return;
          } else {
            setMessages([]);
          }
        } catch (error) {
          setMessages([]);
        }
      }
      // fallback to localStorage
      const localHistory = localStorage.getItem("chatbot_history");
      if (localHistory) {
        try {
          const parsed = JSON.parse(localHistory);
          if (Array.isArray(parsed)) setMessages(parsed);
        } catch { }
      } else {
        setMessages([
          {
            from: "Bot",
            sender: "bot",
            text: "Hi there! 👋 Welcome to Adventure Axis!\n\nI’m AI Support Intelligence from our online store – your virtual assistant here to help you with anything you need.\n\nHow can I assist you today?",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    }
    loadHistory();
  }, [session?.user?.id]);


  const handleResetChat = () => {
    setMessages([
      {
        from: "Bot",
        sender: "bot",
        text: "Hi there! 👋 Welcome to Adventure Axis!\n\nI’m AI Support Intelligence from our online store – your virtual assistant here to help you with anything you need.\n\nHow can I assist you today?",
        createdAt: new Date().toISOString(),
      },
    ]);
    setStep(0);
    setInput("");
    setContact({ name: "", phone: "", email: "" });
    setProduct("");
    setError("");
    localStorage.removeItem("chatbot_history");
  };

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;

    if (messages.length === 0) {
      const timer = setTimeout(() => {
        setMessages([
          {
            from: "Bot",
            sender: "bot",
            text: `Hi there! 👋 Welcome to Adventure Axis!\n\nI’m AI Support Intelligence from our online store – your virtual assistant here to help you with anything you need.\n\nHow can I assist you today?`,
            createdAt: new Date().toISOString()
          }
        ]);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [open]);


  const handleSmallTalk = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(msgs => [
      ...msgs,
      { from: "You", sender: session?.user?.id || "user", text: input, createdAt: new Date().toISOString() },
      {
        from: "Bot",
        sender: "bot",
        text: `May I know your name and contact number?\n\n📧 Your Email Address:\n📞 Your Phone Number (optional):`,
        createdAt: new Date().toISOString()
      }
    ]);
    setInput("");
    setStep(2);
  };


  const handleContact = (e) => {
    e.preventDefault();
    if (!contact.name.trim() || !contact.email.trim()) {
      setError("Please enter your name and email.");
      return;
    }

    setMessages(msgs => [
      ...msgs,
      {
        from: "You",
        sender: session?.user?.id || "user",
        text: `Name: ${contact.name}\nEmail: ${contact.email}${contact.phone ? `\nPhone: ${contact.phone}` : ""}`,
        createdAt: new Date().toISOString()
      },
      {
        from: "Bot",
        sender: "bot",
        text: `Thank you! 😊\n\nHow can I help you today?\n\nPlease choose one of the options below 👇`,
        createdAt: new Date().toISOString()
      }
    ]);
    setContact({ name: "", phone: "", email: "" });
    setError("");
    setStep(3);
  };
  const handleQnAOption = (qna) => {
    // Special handling for Chat With Admin
    if (qna.q === "🧑‍💬 Chat With Admin") {
      if (!isLoggedIn(session)) {
        setLoginPrompt(true);
        setOpen(true);
        return;
      } else {
        window.location.href = "/dashboard?section=chatbot";
        return;
      }
    }

    setMessages((msgs) => [...msgs, { from: "You", sender: session?.user?.id || "user", text: qna.q, createdAt: new Date().toISOString() }]);

    if (qna.q === "🛍 Product Information") {
      setShowSupportOptions(false);
      setMessages((msgs) => [
        ...msgs,
        { from: "Bot", sender: "bot", text: "Sure! Please share the product name.", createdAt: new Date().toISOString() }
      ]);
      setStep("product-info");
    } else {
      setShowSupportOptions(false);
      setMessages((msgs) => [...msgs, { from: "Bot", sender: "bot", text: qna.a, createdAt: new Date().toISOString() }]);
      setStep(4);
    }
  };
  const handleProduct = async (e) => {
    e.preventDefault();
    if (!product.trim()) {
      setError("Please enter a product name.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/product/search?q=${product}`);
      const data = await response.json();
      let foundProduct = null;
      if (Array.isArray(data.products) && data.products.length > 0) {
        foundProduct = data.products[0];
      } else if (data.product) {
        foundProduct = data.product;
      }
      setFaqClicked(null);
      setSelectedProduct(null);
      if (foundProduct) {
        // Compose bot message with product details
        let imageUrl = foundProduct || '/placeholder.jpeg';
        let price = foundProduct.price ? `₹${foundProduct.price}` : 'Price not available';

        setMessages(msgs => [
          ...msgs,
          { from: "You", sender: session?.user?.id || "user", text: product, createdAt: new Date().toISOString() },
          {
            from: "Bot",
            sender: "bot",
            text: `Product: ${foundProduct.title}\n${price}`,
            image: imageUrl,
            createdAt: new Date().toISOString()
          },
        ]);
        setSelectedProduct(foundProduct);
        setStep("faq");
      } else {
        setMessages(msgs => [
          ...msgs,
          { from: "You", sender: session?.user?.id || "user", text: product, createdAt: new Date().toISOString() },
          { from: "Bot", sender: "bot", text: "Sorry, product not found.", createdAt: new Date().toISOString() }
        ]);
      }
    } catch (e) {
      setMessages(msgs => [...msgs, { from: "Bot", sender: "bot", text: "Sorry, something went wrong.", createdAt: new Date().toISOString() }]);
    }
    setLoading(false);
    setProduct("");
    setError("");
    setStep("faq");
  };

  // Reset chat on close
  const handleClose = () => {
    setOpen(false);
    setStep(0);
    setMessages([
      { from: "Bot", sender: "bot", text: "...", createdAt: new Date().toISOString() }
    ]);
    setInput("");
    setContact({ name: "", phone: "", email: "" });
    setProduct("");
    setError("");
  };

  const handleBubbleClick = () => {
    setOpen(true);
    // Only show greeting if there is no chat history
    if (!messages || messages.length === 0) {
      setMessages([
        {
          from: "Bot",
          sender: "bot",
          text: `Hi there! 👋 Welcome to Adventure Axis!\n\nI’m AI Support Intelligence from our online store – your virtual assistant here to help you with anything you need.\n\nHow can I assist you today?`,
          createdAt: new Date().toISOString()
        }
      ]);
    }
  };

  const handleMainMenu = (qna) => {
    if (qna.q === "🧑‍💬 Talk to Support") {
      setShowSupportOptions(true);
      setStep(3);
      setMessages(msgs => [
        ...msgs,
        { from: "You", sender: session?.user?.id || "user", text: qna.q, createdAt: new Date().toISOString() },
        { from: "Bot", sender: "bot", text: qna.a, createdAt: new Date().toISOString() }
      ]);
      return;
    }
    setMessages((msgs) => [
      ...msgs,
      { from: "You", sender: session?.user?.id || "user", text: qna.q, createdAt: new Date().toISOString() },
      { from: "Bot", sender: "bot", text: qna.a + "\n\nFor more help, contact us at support@info@adventureaxis.in or call +91 7351009107, 9411571947.", createdAt: new Date().toISOString() },
    ]);
  };

  const handleChatWithAdmin = async () => {
    localStorage.setItem("chat_with_admin", "true");
    localStorage.setItem("chatbot_history", JSON.stringify(messages));
    // Persist bot history to backend
    if (session?.user?.id && messages.length > 0) {
      await fetch('/api/mergeBotHistory', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, botMessages: messages }),
      });
    }
    if (!isLoggedIn(session)) {
      setLoginPrompt(true);
      return;
    }
    window.location.href = "/dashboard?section=chatbot";
  };

  const handleInputSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!isLoggedIn(session)) {
      setLoginPrompt(true);
      return;
    }
    setMessages((msgs) => [...msgs, { from: "You", sender: session?.user?.id || "user", text: input, createdAt: new Date().toISOString() }]);
    setLoading(true);
    setInput("");
    try {
      // Send to /api/chat/user-query for admin
      await fetch("/api/chat/user-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          userId: session?.user?.id,
          userName: session?.user?.name || session?.user?.email,
          userEmail: session?.user?.email,
        }),
      });
      setCustomSent(true);
      setShowCustomInput(false);
      setMessages((msgs) => [
        ...msgs,
        { from: "Bot", sender: "bot", text: "Your question has been sent to our team. We'll get back to you soon!", createdAt: new Date().toISOString() },
      ]);
    } catch (e) {
      setMessages((msgs) => [...msgs, { from: "Bot", sender: "bot", text: "Sorry, something went wrong.", createdAt: new Date().toISOString() }]);
    }
    setLoading(false);
    setTimeout(scrollToBottom, 200);
  };
  const handleBackToChat = () => {
    setSelectedProduct(null);
    setFaqClicked(null);
    setStep(3); // This should be the step that shows your main quick-topic buttons
  };
  const isProductNotFound = step === "faq" && messages[messages.length - 1]?.text === "Sorry, product not found."

  // Handle chat with admin click
  const handleChatWithAdminClick = () => {
    if (!isLoggedIn(session)) {
      setLoginPrompt(true);
      setShowSupportOptions(true);
      setOpen(true);
    } else {
      window.location.href = "/dashboard?section=chatbot";
    }
  };

  return (
    <>
      {/* Floating chat bubble */}
      {!open && (
        <button
          className="fixed bottom-6 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center transition-all duration-300"
          aria-label="Open chat"
          onClick={handleBubbleClick}
        >
          <MessageCircle className="w-8 h-8" />
        </button>
      )}
      {/* Chat window */}
      {open && (
        <div
          className={`fixed bottom-10 md:bottom-2 right-[4%] z-[9999] w-[330px] max-w-[95vw] bg-white rounded-xl shadow-2xl flex flex-col border border-gray-200 animate-fadeIn
          ${
            // Shrink to content only for support mode or product not found
            showSupportOptions || isProductNotFound || step === 0 || step === 1 || step === 2 || step === "product-info"
              ? 'md:max-h-[30rem] h-full'
              : 'md:h-screen'
            }
        `}
        >

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-blue-600 rounded-t-xl">
            <span className="text-white font-semibold">Chat with us</span>
            <button onClick={handleClose} className="text-white hover:text-gray-200"><X className="w-5 h-5" /></button>
          </div>
          {/* Chat body */}
          <div ref={chatWindowRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-blue-50" style={{ maxHeight: 420 }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "bot" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl text-sm shadow-sm max-w-[80%] whitespace-pre-wrap ${msg.sender === "bot"
                    ? "bg-white text-gray-900 border border-gray-200"
                    : "bg-blue-600 text-white border border-blue-600"
                    }`}
                >
                  {msg.faqKey === 'url' ? (
                    <span dangerouslySetInnerHTML={{ __html: msg.text }} />
                  ) : (
                    msg.text
                  )}
                  <div className="flex text-xs mt-1 gap-1 justify-end">
                    <span className={msg.sender === "bot" ? "text-gray-400" : "text-white/70"}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="px-4 py-2 rounded-2xl text-sm bg-blue-100 text-blue-600 animate-pulse">...
                </div>
              </div>
            )}
          </div>
          {/* Guided chat flow input area */}
          <div className="px-4 py-3 border-t border-gray-100 bg-white rounded-b-xl">
            {/* Step 0: Small talk */}
            {step === 0 && (
              <form onSubmit={handleSmallTalk} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-blue-500 bg-gray-50"
                  placeholder="Say hi or ask anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 flex items-center justify-center disabled:opacity-60"
                  disabled={!input.trim()}
                  aria-label="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            )}
            {/* Step 2: Contact info */}
            {step === 2 && (
              <form onSubmit={handleContact} className="flex flex-col gap-2">
                <input
                  type="text"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-blue-500 bg-gray-50"
                  placeholder="Your Name (required)"
                  value={contact.name}
                  onChange={e => setContact({ ...contact, name: e.target.value })}
                  autoFocus
                />
                <input
                  type="email"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-blue-500 bg-gray-50"
                  placeholder="Your Email (required)"
                  value={contact.email}
                  onChange={e => setContact({ ...contact, email: e.target.value })}
                />
                <input
                  type="tel"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-blue-500 bg-gray-50"
                  placeholder="Your Phone (optional)"
                  value={contact.phone}
                  onChange={e => setContact({ ...contact, phone: e.target.value })}
                />
                {error && <div className="text-red-500 text-xs">{error}</div>}
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 font-semibold mt-1"
                >
                  Continue
                </button>
              </form>
            )}
            {/* Step 3: Main menu with Chat with Admin option */}
            {step === 3 && (
              <div className="flex flex-col gap-2 mb-1">
                {/* Chat with Admin button */}
                {/* <button
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  onClick={handleChatWithAdminClick}
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat with Admin
                </button> */}
                
                {/* Other menu items */}
                {productQnA.map((qna) => (
                  <button
                    key={qna.q}
                    className="flex-1 text-left px-4 py-1 rounded-lg border transition-colors duration-150 font-medium transition"
                    onClick={() => handleQnAOption(qna)}
                  >
                    {qna.q}
                  </button>
                ))}
              </div>
            )}
            {step === "product-info" && (
              <>

                <form onSubmit={handleProduct} className="flex gap-2 mt-1">
                  <input
                    type="text"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-blue-500 bg-gray-50"
                    placeholder="Product Name or Code (required)"
                    value={product}
                    onChange={e => setProduct(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 flex items-center justify-center disabled:opacity-60"
                    disabled={!product.trim()}
                    aria-label="Send"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
                {step === "faq" && selectedProduct && (
                  <>
                    <div className="font-semibold text-gray-700 mb-2">Frequently Asked Questions:</div>
                    <div className="flex flex-col gap-2">
                      {PRODUCT_FAQS.map((faq) => (
                        <button
                          key={faq.key}
                          onClick={() => handleFaqClick(faq)}
                          className={`w-full text-left px-4 py-2 rounded-lg font-medium shadow-sm text-xs transition whitespace-nowrap bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 ${faqClicked === faq.key
                            ? 'bg-blue-600 text-black border-blue-600'
                            : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                            }`}
                          disabled={faqClicked === faq.key}
                        >
                          {faq.q}
                        </button>
                      ))}
                    </div>
                  </>
                )}

              </>
            )}
            {/* Step 4: Main menu */}
            {step === 4 && !selectedProduct && (
              <>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {productQnA.map((qna) => (
                    <button
                      key={qna.q}
                      className="flex-1 text-left px-4 py-1 rounded-lg border transition-colors duration-150 font-medium transition"
                      onClick={() => handleMainMenu(qna)}
                      disabled={loading}
                    >
                      {qna.q}
                    </button>
                  ))}
                </div>


                {!(step === "faq" && selectedProduct) && (
                  <>
                    <button
                      className="w-full mt-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
                      onClick={() => setStep(0)}
                      disabled={loading}
                    >
                      New Question
                    </button>
                    <button
                      className="w-full mt-2 text-sm text-red-600 hover:underline"
                      onClick={handleResetChat}
                    >
                      🔄 Reset Chat
                    </button>
                  </>
                )}
              </>
            )}
            {loginPrompt && (
              <div className="flex flex-col gap-2 mt-2">
                <p className="text-sm text-gray-700 text-center mb-2">Please log in or sign up to chat with an admin.</p>
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
                  onClick={() => window.location.href = "/sign-in?redirect=/dashboard?section=chatbot"}
                >
                  🔐 Login
                </button>
                <button
                  className="w-full bg-gray-100 hover:bg-gray-200 text-blue-700 py-2 rounded-lg font-semibold border transition"
                  onClick={() => window.location.href = "/sign-up?redirect=/dashboard?section=chatbot"}
                >
                  📝 Signup
                </button>
                <button
                  className="w-full text-center px-4 py-2 rounded-lg border transition-colors duration-150 font-medium shadow-sm text-sm transition whitespace-nowrap"
                  onClick={() => {
                    setLoginPrompt(false);
                    setShowSupportOptions(false);
                  }}
                >
                  👈 Back to Chat
                </button>
              </div>
            )}
            {showCustomInput && !loginPrompt && (
              <form onSubmit={handleInputSend} className="flex gap-2 mt-1">
                <input
                  type="text"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-blue-500 bg-gray-50"
                  placeholder="Type your question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 flex items-center justify-center disabled:opacity-60"
                  disabled={loading || !input.trim()}
                  aria-label="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            )}
            {step === "faq" && selectedProduct && (
              <>
                <div className="font-semibold text-gray-700 mb-2">Frequently Asked Questions:</div>
                <div className="flex flex-wrap gap-2 mb-1">
                  {PRODUCT_FAQS.map((faq) => (
                    <button
                      key={faq.key}
                      onClick={() => handleFaqClick(faq)}
                      className={`w-full text-left px-2 py-2 rounded-lg font-medium shadow-sm text-xs transition whitespace-nowrap bg-white text-gray-700 border border-gray-300 hover:bg-gray-200
            ${faqClicked === faq.key
                          ? 'text-black border border-blue-600'
                          : 'border'
                        }`}
                      disabled={faqClicked === faq.key}
                    >
                      {faq.q}
                    </button>
                  ))}
                  {/* Add Back to Chat button at the end */}
                  <button
                    onClick={handleBackToChat}
                    className="w-full px-4 py-2 rounded-lg border transition-colors duration-150 font-medium shadow-sm text-xs transition whitespace-nowrap "
                  >
                    👈 Back to Main Menu
                  </button>
                </div>
              </>
            )}
            {step === "faq" && messages[messages.length - 1]?.text === "Sorry, product not found." && (
              <div className="p-2 bg-white">
                <form onSubmit={handleProduct} className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-blue-500 bg-gray-50"
                    placeholder="Product Name (required)"
                    value={product}
                    onChange={e => setProduct(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 flex items-center justify-center disabled:opacity-60"
                    disabled={!product.trim()}
                    aria-label="Send"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={handleBackToChat}
                    className="w-full text-left px-2 py-2 rounded-lg font-medium shadow-sm text-xs transition whitespace-nowrap bg-white text-gray-700 border border-gray-300 hover:bg-gray-200"
                    style={{ minWidth: 0 }}
                  >
                    👈 Back to Main Menu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}