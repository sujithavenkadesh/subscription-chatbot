import { useEffect, useRef, useState } from 'react';
import * as api from '../api';
import './ChatWindow.css';

const fmt = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });

const START_OPTIONS = [
  { label: 'I am an existing customer', value: 'existing' },
  { label: 'I am a new customer', value: 'new' },
];
const ERROR_OPTIONS = [
  { label: 'I am an existing customer', value: 'existing' },
  { label: 'Start over', value: 'restart' },
];
const TEXT_STEPS = ['existing_phone', 'new_name', 'new_phone', 'new_email', 'new_address'];
const PLACEHOLDERS = {
  existing_phone: 'Enter your 10-digit phone number',
  new_name: 'Enter your name',
  new_phone: 'Enter your 10-digit phone number',
  new_email: 'Enter your email',
  new_address: 'Enter your delivery address',
};

export default function ChatWindow() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! Welcome. Are you an existing customer or a new one?' },
  ]);
  const [options, setOptions] = useState(START_OPTIONS);
  const [step, setStep] = useState('start');
  const [input, setInput] = useState('');
  const [form, setForm] = useState({});
  const [customer, setCustomer] = useState(null);
  const [products, setProducts] = useState([]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, options]);

  const say = (text, opts) => {
    setMessages((m) => [...m, { from: 'bot', text }]);
    if (opts) setOptions(opts);
  };
  const userSays = (text) => setMessages((m) => [...m, { from: 'user', text }]);

  const showProducts = async () => {
    const list = await api.getProducts();
    setProducts(list);
    say('Here are our products:\n' + list.map((p) => `• ${p.name} – ${p.description}`).join('\n'));
    say('Pick one to see its plans:', list.map((p) => ({ label: p.name, value: `product:${p.id}` })));
  };

  const showCustomer = (data) => {
    setCustomer(data.customer);
    say(`Welcome back, ${data.customer.name}!`);
    if (data.subscriptions.length === 0) say('You have no subscriptions yet.');
    data.subscriptions.forEach((s) => {
      say(
        `${s.product_name} (${s.plan_name}) – ₹${Number(s.price)}\n` +
        `Status: ${s.status}\n` +
        `Expiry: ${fmt(s.expiry_date)} (${s.days_left >= 0 ? `${s.days_left} days left` : 'expired'})\n` +
        `Latest order: ${s.last_order_status || 'none'}` +
        (s.next_delivery ? ` – delivery ${fmt(s.next_delivery)}` : '')
      );
      if (s.alert) say(`⚠️ ${s.alert}`);
    });
    say('What would you like to do next?', [
      { label: 'View products', value: 'list' },
      { label: 'Start over', value: 'restart' },
    ]);
  };

  const handleOption = async (opt) => {
    setOptions([]);
    userSays(opt.label);
    const v = opt.value;
    setBusy(true);
    try {
      if (v === 'existing') {
        setStep('existing_phone');
        say('Please enter your registered 10-digit phone number.');
      } else if (v === 'new') {
        setForm({});
        setStep('new_name');
        say("Welcome! Let's get you registered. What is your name?");
      } else if (v === 'restart') {
        setStep('start');
        setCustomer(null);
        setForm({});
        say('Okay! Are you an existing customer or a new one?', START_OPTIONS);
            } else if (v === 'list') {
        await showProducts();
      } else if (v.startsWith('existing_found:')) {
        say('One moment, checking your account...');
        const phone = v.split(':')[1];
        const data = await api.lookupCustomer(phone);
        setStep('menu');
        showCustomer(data);
      } else if (v === 'retry_phone') {
        setStep('new_phone');
        say('No problem. What is your 10-digit phone number?');
      } else if (v.startsWith('product:')) {
        const p = products.find((x) => x.id === Number(v.split(':')[1]));
        say(
          `${p.name} plans:`,
          p.plans.map((pl) => ({ label: `${pl.name} – ₹${Number(pl.price)}`, value: `plan:${pl.id}` }))
        );
      } else if (v.startsWith('plan:')) {
        const sub = await api.subscribe(customer.id, Number(v.split(':')[1]));
        say(`Done! Your subscription is active. It renews on ${fmt(sub.renewal_date)}.`, [
        { label: 'Add another plan', value: 'list' },
        { label: 'Start over', value: 'restart' },
          ]);
      }
    } catch (e) {
      say(
        e.message === 'Failed to fetch'
          ? "Sorry, I can't reach the server right now. Please try again."
          : e.message,
        ERROR_OPTIONS
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    userSays(text);
    setBusy(true);
    try {
      if (step === 'existing_phone') {
         if (!/^\d{10}$/.test(text)) {
         say('Please enter a valid 10-digit phone number.');
         return;
         }
        say('One moment, checking your account...');
        try {
        const data = await api.lookupCustomer(text);
        setStep('menu');
        showCustomer(data);
        } catch (err) {
          if (err.message === 'Customer not found') {
            say("I couldn't find that number.", [
              { label: 'Register as new customer', value: 'new' },
              { label: 'Try another number', value: 'existing' },
            ]);
          } else throw err;
        }
      } else if (step === 'new_name') {
        setForm({ name: text });
        setStep('new_phone');
        say(`Nice to meet you, ${text}! What is your 10-digit phone number?`);
     } else if (step === 'new_phone') 
      {
       if (!/^\d{10}$/.test(text)) {
       say('Please enter a valid 10-digit phone number.');
       return;
      }
      try {
      await api.lookupCustomer(text);
      say("This number is already registered with us.", [
      { label: 'Continue as existing customer', value: `existing_found:${text}` },
      { label: 'Use a different number', value: 'retry_phone' },
    ]);
      return;
     }   catch (err) {
      if (err.message !== 'Customer not found') throw err;
     }
     setForm((f) => ({ ...f, phone: text }));
     setStep('new_email');
     say('What is your email address?');
      } 
       else if (step === 'new_email') {
       if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
       say('Please enter a valid email address (e.g. name@example.com).');
       return;
      }
        setForm((f) => ({ ...f, email: text }));
        setStep('new_address');
        say('What is your delivery address?');
      } else if (step === 'new_address') {
        const created = await api.registerCustomer({ ...form, address: text });
        setCustomer(created);
        setStep('menu');
        say(`Thank you, ${created.name}! You are registered.`);
        await showProducts();
      }
    } catch (err) {
      say(
        err.message === 'Failed to fetch'
          ? "Sorry, I can't reach the server right now. Please try again."
          : err.message,
        ERROR_OPTIONS
      );
    } finally {
      setBusy(false);
    }
  };

  const canType = TEXT_STEPS.includes(step);

  return (
    <div className="chat">
      <div className="chat-header">Subscription Assistant</div>
      <div className="chat-body">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.from}`}>{m.text}</div>
        ))}
        <div className="options">
          {options.map((o) => (
            <button key={o.value} onClick={() => handleOption(o)} disabled={busy}>
              {o.label}
            </button>
          ))}
        </div>
        <div ref={endRef} />
      </div>
      <form className="chat-input" onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={canType ? PLACEHOLDERS[step] : 'Choose an option above'}
          disabled={!canType || busy}
        />
        <button type="submit" disabled={!canType || busy}>Send</button>
      </form>
    </div>
  );
}