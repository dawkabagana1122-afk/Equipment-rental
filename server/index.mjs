import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 4000);
const distPath = path.join(__dirname, '..', 'dist');

app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

const equipment = [
  {
    id: 'DRL-UB-0247',
    name: 'Өрмийн машин D45',
    model: 'Atlas Copco D45',
    status: 'Түрээстэй',
    meta: 'DRL-UB-0247',
    location: 'Нарны зам · Блок B',
    assignee: 'Б. Бат',
    tenant: 'Хөх Тэнгэр ХХК',
    due: '10-р сарын 18',
    telemetry: { vibration: '4.82', temperature: '78.6', rpm: '1,482' },
    live: true,
  },
  {
    id: 'GEN-0162',
    name: 'Генератор 150 кВА',
    model: 'Cummins 150 kVA',
    status: 'Бэлэн',
    meta: 'GEN-0162',
    location: 'Зүүн талбай · Хашаа 2',
    assignee: 'С. Уран',
    tenant: 'Монкон ХХК',
    due: '10-р сарын 14',
    telemetry: { vibration: '2.58', temperature: '64.2', rpm: '840' },
    live: true,
  },
  {
    id: 'MIX-4993',
    name: 'Бетон зуурагч 8м³',
    model: 'MIX-8 PRO',
    status: 'Анхаарах',
    meta: 'MIX-4993',
    location: 'Талбай 12 · Блок C',
    assignee: 'Н. Баяр',
    tenant: 'Улаанбаатар бетон',
    due: '10-р сарын 16',
    telemetry: { vibration: '8.41', temperature: '96.2', rpm: '1,824' },
    live: true,
  },
  {
    id: 'EXC-0914',
    name: 'Бага оврын экскаватор',
    model: 'CAT 308E',
    status: 'Засварт',
    meta: 'EXC-0914',
    location: 'Баруун талбай · Хашаа 1',
    assignee: 'Г. Дэлгэр',
    tenant: 'Говь зам ХХК',
    due: '10-р сарын 09',
    telemetry: { vibration: '3.75', temperature: '72.4', rpm: '1,180' },
    live: false,
  },
  {
    id: 'TLS-1318',
    name: 'Гар багаж / багц',
    model: 'Tool kit 12',
    status: 'Бэлэн',
    meta: 'TLS-1318',
    location: 'Номын сан · Хадгалах',
    assignee: 'Б. Бөх',
    tenant: 'Улаанбаатар логистик',
    due: '10-р сарын 20',
    telemetry: { vibration: '0.86', temperature: '32.1', rpm: '0' },
    live: false,
  },
];

const alerts = [
  {
    id: 'A-8842',
    title: 'Бетон зуурагчийн температур',
    equipmentId: 'MIX-4993',
    risk: '93.4%',
    location: 'Талбай 12',
    severity: 'high',
    description: 'Температур 96.2°C · автомат мониторинг идэвхтэй',
  },
  {
    id: 'A-7710',
    title: 'Генераторын түлшний түвшин',
    equipmentId: 'GEN-0162',
    risk: '18%',
    location: 'Зүүн талбай',
    severity: 'warning',
    description: 'Багачаалжууд түлшний төлөвийг шалгах шаардлагатай',
  },
];

const notifications = [
  {
    id: 'n-1',
    title: 'Хөдөлгүүрийн эрсдэл 18 мин',
    meta: 'MIX-4993 · Талбай 12',
    type: 'alert',
    createdAt: 'Өнөөдөр · 12:43',
  },
  {
    id: 'n-2',
    title: 'Хугацаа 2 цагийн дараа дуусна',
    meta: 'Өрмийн машин D45',
    type: 'calendar',
    createdAt: 'Өнөөдөр · 12:50',
  },
  {
    id: 'n-3',
    title: 'Check-out амжилттай',
    meta: 'GEN-0162 · 09:28',
    type: 'success',
    createdAt: 'Өнөөдөр · 09:28',
  },
  {
    id: 'n-4',
    title: 'Check-in хугацаа ойртлоо',
    meta: 'DRL-UB-0247 · 12:46',
    type: 'warning',
    createdAt: 'Өнөөдөр · 12:46',
  },
];

const supportTeam = [
  { name: 'Д. Эрдэнэ', role: 'Техникч · 7 мин' },
  { name: 'С. Номин', role: 'Менежер · ONLINE' },
];

const dashboard = {
  summary: {
    totalEquipment: 128,
    rentedToday: 6,
    alerts: 4,
    syncSecondsAgo: '8 сек өмнө',
    siteName: 'Улаанбаатар төв',
  },
  equipment,
  alerts,
  notifications,
  supportTeam,
};

const createToken = () => crypto.randomBytes(18).toString('hex');

if (existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ops-backend', time: new Date().toISOString() });
});

app.post('/api/auth/login', (req, res) => {
  const { role = 'employee', phone = '99128044', code = '123456' } = req.body ?? {};

  const normalizedRole = role === 'tenant' ? 'renter' : role;
  const normalizedPhone = String(phone).replace(/\D/g, '');
  const validLogin = code === '123456' && normalizedPhone.length >= 7;

  if (!validLogin) {
    return res.status(401).json({ message: 'Нэвтрэх мэдээлэл буруу байна.' });
  }

  const user = {
    id: `${normalizedRole}-${normalizedPhone}`,
    role: normalizedRole,
    phone: normalizedPhone,
    name: normalizedRole === 'renter' ? 'Хөх Тэнгэр ХХК' : 'Тэмүүлэн',
    company: normalizedRole === 'renter' ? 'Монкон ХХК' : 'Талбай 12',
  };

  return res.json({
    message: 'Амжилттай нэвтэрлээ',
    user,
    session: {
      token: createToken(),
      role: normalizedRole,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
  });
});

app.get('/api/dashboard', (req, res) => {
  res.json(dashboard);
});

app.get('/api/equipment', (req, res) => {
  res.json(equipment);
});

app.get('/api/equipment/:id', (req, res) => {
  const item = equipment.find((entry) => entry.id === req.params.id);

  if (!item) {
    return res.status(404).json({ message: 'Төхөөрөмж олдсонгүй' });
  }

  return res.json(item);
});

app.get('/api/notifications', (req, res) => {
  res.json(notifications);
});

app.get('/api/alerts', (req, res) => {
  res.json(alerts);
});

app.post('/api/support', (req, res) => {
  const { message = 'Тусламжийн хүсэлт илгээгдлээ', team = 'support' } = req.body ?? {};

  return res.json({
    ok: true,
    message,
    team,
    ticketId: 'A-8842',
    updatedAt: new Date().toISOString(),
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Ops backend listening on http://0.0.0.0:${port}`);
});
