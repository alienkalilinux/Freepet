'use client';

interface PasswordStrengthProps {
  password: string;
}

function checkPassword(password: string): { percent: number; label: string; color: string; textColor: string } {
  if (!password || password.length === 0) {
    return { percent: 0, label: '', color: '', textColor: '' };
  }

  let level = 0;

  if (password.length >= 6) level++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) level++;
  if (/[0-9]/.test(password)) level++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) level++;

  switch (level) {
    case 0:
      return { percent: 25, label: 'Плохо', color: 'bg-red-500', textColor: 'text-red-400' };
    case 1:
      return { percent: 25, label: 'Плохо', color: 'bg-red-500', textColor: 'text-red-400' };
    case 2:
      return { percent: 50, label: 'Слабо', color: 'bg-orange-500', textColor: 'text-orange-400' };
    case 3:
      return { percent: 75, label: 'Нормально', color: 'bg-yellow-500', textColor: 'text-yellow-400' };
    case 4:
      return { percent: 100, label: 'Хорошо', color: 'bg-green-500', textColor: 'text-green-400' };
    default:
      return { percent: 25, label: 'Плохо', color: 'bg-red-500', textColor: 'text-red-400' };
  }
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const { percent, label, color, textColor } = checkPassword(password);

  const requirements = [
    { text: 'Минимум 6 символов', met: password.length >= 6 },
    { text: 'Большие и маленькие буквы', met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { text: 'Цифры (0-9)', met: /[0-9]/.test(password) },
    { text: 'Спецсимволы (!@#$...)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) },
  ];

  return (
    <div className="mt-2">
      <div className="flex items-center space-x-2 mb-2">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-300`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${textColor}`}>{label}</span>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {requirements.map((req, i) => (
          <div key={i} className="flex items-center space-x-2 text-xs">
            <span className={req.met ? 'text-green-400' : 'text-slate-500'}>
              {req.met ? '✓' : '○'}
            </span>
            <span className={req.met ? 'text-green-300' : 'text-slate-500'}>{req.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}